"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { CheckCircle2, AlertCircle, Activity } from "lucide-react";
import PricingCards from "../../components/PricingCards";
import Script from "next/script";

// Define the global window object for Culqi
declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

export default function PlanesPage() {
  const { data: session } = useSession();
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const selectedTierRef = useRef<string | null>(null);

  const fetchProfile = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTier(data.tier);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  // Setup the global Culqi callback
  useEffect(() => {
    window.culqi = async () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        const tier = selectedTierRef.current;
        
        if (!tier) {
          setErrorMsg("Error: No se encontró el plan seleccionado.");
          setSelectingPlan(false);
          return;
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-subscription`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.backendToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token_id: token, tier }),
          });

          if (res.ok) {
            // Subscription created successfully!
            window.location.href = "/dashboard/onboarding";
          } else {
            const errData = await res.json();
            setErrorMsg(errData.detail || "Error al procesar la suscripción.");
          }
        } catch (err) {
          setErrorMsg("Error de red al crear la suscripción.");
        } finally {
          setSelectingPlan(false);
        }
      } else {
        console.error(window.Culqi.error);
        setErrorMsg(window.Culqi.error.user_message);
        setSelectingPlan(false);
      }
    };
  }, [session]);

  const handleSelectPlan = async (tier: string) => {
    if (!session?.backendToken || !window.Culqi) return;
    setSelectingPlan(true);
    setErrorMsg("");
    selectedTierRef.current = tier;

    // Define amount based on tier
    let amountInCents = 0;
    if (tier === "starter") amountInCents = 9700;
    else if (tier === "growth") amountInCents = 19900;
    else if (tier === "pro") amountInCents = 49900;

    if (amountInCents === 0) {
      setErrorMsg("Plan inválido.");
      setSelectingPlan(false);
      return;
    }

    // Configure Culqi
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
    window.Culqi.settings({
      title: 'QSS Suscripción',
      currency: 'PEN',
      amount: amountInCents,
    });

    window.Culqi.options({
      lang: 'es',
      modal: true,
      style: {
        logo: 'https://culqi.com/LogoCulqi.png', // Or custom QSS logo
      }
    });

    // Open Checkout
    window.Culqi.open();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Activity className="animate-spin text-neon-purple mb-4" size={32} />
        <p className="text-gray-400">Cargando planes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in-up">
      <Script src="https://checkout.culqi.com/js/v4" strategy="lazyOnload" />
      <div className="text-center md:text-left mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Plan</h1>
        <p className="text-gray-400 text-lg">
          Activa tu suscripción para darle vida a tu Recepcionista Inteligente.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3 max-w-3xl mx-auto md:mx-0">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      <PricingCards 
        currentTier={currentTier} 
        selectingPlan={selectingPlan} 
        onSelectPlan={handleSelectPlan} 
      />
    </div>
  );
}
