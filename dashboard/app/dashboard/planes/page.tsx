"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Activity } from "lucide-react";

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
        setErrorMsg(errData.detail || "Error al iniciar el checkout.");
      }
    } catch (err) {
      setErrorMsg("Error de conexión al iniciar el checkout.");
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
          Gestiona tu suscripción y desbloquea más capacidades para tu agencia.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3 max-w-3xl mx-auto md:mx-0">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 text-left">
        {/* BASIC PLAN */}
        <div className={`bg-dark-card backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col relative transition-all ${currentTier === "basic" ? "border-white/50" : "border-dark-card-border hover:border-white/20"}`}>
          <div className="flex-1">
            {currentTier === "basic" && (
              <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
                TU PLAN ACTUAL
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-2">Basic</h2>
            <div className="text-4xl font-extrabold text-neon-blue mb-4">$5<span className="text-lg text-gray-500 font-normal">/mes</span></div>
            <p className="text-gray-400 mb-8 h-12">Ideal para emprendedores y negocios locales.</p>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-blue" /> Conectar 1 cuenta de Google Ads</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-blue" /> Optimización base con IA</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-blue" /> Reportes semanales</li>
            </ul>
          </div>
          <button 
            onClick={() => handleSelectPlan("basic")} 
            disabled={selectingPlan || currentTier === "basic"} 
            className={`w-full py-4 rounded-full font-semibold transition-colors border ${
              currentTier === "basic" 
                ? "bg-white/10 text-gray-400 border-white/10 cursor-not-allowed" 
                : "border-dark-card-border hover:bg-white/5 text-white"
            }`}
          >
            {selectingPlan ? "Procesando..." : currentTier === "basic" ? "Plan Actual" : "Cambiar a Basic"}
          </button>
        </div>

        {/* SCALE PLAN */}
        <div className={`bg-dark-card backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] ${currentTier === "scale" ? "border-neon-purple" : "border-neon-purple/50"}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon-purple text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider">
            {currentTier === "scale" ? "TU PLAN ACTUAL" : "MÁS POPULAR"}
          </div>
          <div className="flex-1 mt-4">
            <h2 className="text-2xl font-bold text-white mb-2">Scale</h2>
            <div className="text-4xl font-extrabold text-neon-purple mb-4">$20<span className="text-lg text-gray-500 font-normal">/mes</span></div>
            <p className="text-gray-400 mb-8 h-12">Para agencias pequeñas y negocios en crecimiento.</p>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-purple" /> Hasta 3 cuentas de Google Ads</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-purple" /> Optimización avanzada en tiempo real</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-purple" /> Acompañamiento básico</li>
            </ul>
          </div>
          <button 
            onClick={() => handleSelectPlan("scale")} 
            disabled={selectingPlan || currentTier === "scale"} 
            className={`w-full py-4 rounded-full font-semibold transition-all ${
              currentTier === "scale" 
                ? "bg-neon-purple/20 text-neon-purple cursor-not-allowed" 
                : "bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            }`}
          >
            {selectingPlan ? "Procesando..." : currentTier === "scale" ? "Plan Actual" : "Cambiar a Scale"}
          </button>
        </div>

        {/* GROWTH PLAN */}
        <div className={`bg-dark-card backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col relative transition-all ${currentTier === "growth" ? "border-white/50" : "border-dark-card-border hover:border-white/20"}`}>
          <div className="flex-1">
            {currentTier === "growth" && (
              <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
                TU PLAN ACTUAL
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-2">Growth</h2>
            <div className="text-4xl font-extrabold text-neon-green mb-4">$99<span className="text-lg text-gray-500 font-normal">/mes</span></div>
            <p className="text-gray-400 mb-8 h-12">Para grandes agencias y operaciones robustas.</p>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-green" /> Cuentas de Google Ads ilimitadas</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-green" /> Plan personalizado y estrategas</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-neon-green" /> Soporte prioritario 24/7</li>
            </ul>
          </div>
          <button 
            onClick={() => handleSelectPlan("growth")} 
            disabled={selectingPlan || currentTier === "growth"} 
            className={`w-full py-4 rounded-full font-semibold transition-colors border ${
              currentTier === "growth" 
                ? "bg-white/10 text-gray-400 border-white/10 cursor-not-allowed" 
                : "border-dark-card-border hover:bg-white/5 text-white"
            }`}
          >
            {selectingPlan ? "Procesando..." : currentTier === "growth" ? "Plan Actual" : "Cambiar a Growth"}
          </button>
        </div>
      </div>
    </div>
  );
}
