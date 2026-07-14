"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { CheckCircle2, AlertCircle, Activity } from "lucide-react";
import PricingCards from "../../components/PricingCards";
import KRGlue from "@lyracom/embedded-form-glue";

export default function PlanesPage() {
  const { data: session } = useSession();
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleSelectPlan = async (tier: string) => {
    if (!session?.backendToken) return;
    setSelectingPlan(true);
    setErrorMsg("");

    try {
      // 1. Get form token from backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-form-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al generar el pago.");
      }

      const data = await res.json();
      const formToken = data.formToken;

      // 2. Load Lyra Pop-in
      const { KR } = await KRGlue.loadLibrary(
        "https://static.micuentaweb.pe", 
        process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY!
      );

      await KR.setFormConfig({
        formToken: formToken,
        "kr-language": "es-ES",
      });

      // 3. Render and Open Pop-in
      // We must create an element to attach the popin
      let container = document.getElementById("izipay-container");
      if (!container) {
          container = document.createElement("div");
          container.id = "izipay-container";
          container.className = "kr-embedded";
          container.setAttribute("kr-popin", "true");
          document.body.appendChild(container);
      }

      await KR.attachForm("#izipay-container");

      KR.onSubmit(async (paymentData) => {
        if (paymentData.clientAnswer.orderStatus === "PAID") {
           window.location.href = "/dashboard/onboarding";
        } else {
           setErrorMsg("El pago no fue procesado. Intenta con otra tarjeta.");
        }
        return false;
      });

      await KR.openPopin("#izipay-container");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Error de conexión con la pasarela de pagos.");
    } finally {
      setSelectingPlan(false);
    }
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
      <div className="text-center md:text-left mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Plan</h1>
        <p className="text-gray-400 text-lg">
          Activa tu suscripción mensual para darle vida a tu Recepcionista Inteligente.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3 max-w-3xl mx-auto md:mx-0">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      {currentTier && currentTier !== "none" ? (
        <div className="mb-12 bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Plan Actual</h3>
            <p className="text-gray-400">
              Tu cuenta está activa en el plan <span className="text-neon-purple font-bold uppercase">{currentTier}</span>
            </p>
          </div>
          <div className="bg-neon-purple/20 text-neon-purple px-4 py-2 rounded-full font-bold flex items-center gap-2">
            <CheckCircle2 size={18} /> Activo
          </div>
        </div>
      ) : null}

      <PricingCards 
        onSelectPlan={handleSelectPlan} 
        currentTier={currentTier}
      />
      
      {/* Container where Izipay will inject itself if needed, though we append it to body dynamically */}
    </div>
  );
}
