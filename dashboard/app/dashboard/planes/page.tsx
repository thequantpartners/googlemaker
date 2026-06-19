"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Activity } from "lucide-react";
import PricingCards from "../../components/PricingCards";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Error initiating checkout.");
      }
    } catch (err) {
      setErrorMsg("Network error initiating checkout.");
    } finally {
      setSelectingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Activity className="animate-spin text-neon-purple mb-4" size={32} />
        <p className="text-gray-400">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in-up">
      <div className="text-center md:text-left mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">My Plan</h1>
        <p className="text-gray-400 text-lg">
          Manage your subscription and unlock more capabilities for your agency.
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
