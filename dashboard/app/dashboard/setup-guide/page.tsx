"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { CheckCircle2, Phone, Briefcase, Rocket, ArrowRight, ShieldCheck, Video } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectedAds, setConnectedAds] = useState(false);

  // Form states
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [tiktokToken, setTiktokToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    const connectedParam = params.get('connected');
    if (stepParam) setCurrentStep(parseInt(stepParam));
    if (connectedParam === 'success') setConnectedAds(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!session?.backendToken) return;
      try {
        const [meRes, credRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, { headers: { Authorization: `Bearer ${session.backendToken}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, { headers: { Authorization: `Bearer ${session.backendToken}` } })
        ]);

        if (meRes.ok) {
          const data = await meRes.json();
          setWhatsappPhone(data.whatsapp_phone || "");
        }
        if (credRes.ok) {
          const data = await credRes.json();
          if (data.connected_accounts?.length > 0) {
            setConnectedAds(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status !== "loading") fetchData();
  }, [session, status]);

  const saveMeData = async () => {
    if (!session?.backendToken) return false;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.backendToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_phone: whatsappPhone })
      });
      return res.ok;
    } catch { return false; }
  };

  const handleNext = async (step: number) => {
    setSaving(true);
    let success = true;
    if (step === 1) {
      success = await saveMeData();
    }
    setSaving(false);
    
    if (success && step < 3) {
      setCurrentStep(step + 1);
    } else if (success && step === 3) {
      window.location.href = "/dashboard";
    }
  };

  const handleOAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google-ads/login?token=${session?.backendToken}&return_to=${encodeURIComponent(window.location.href)}`;
  };

  const steps = [
    { id: 1, title: 'WhatsApp Copilot', icon: Phone },
    { id: 2, title: 'TikTok Ads', icon: Video },
    { id: 3, title: 'Google Ads (RMKTG)', icon: Briefcase },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} /> Sistema Anti-Baneo Conectado
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-3">
            Activa tu Autopiloto de Ads por WhatsApp
          </h1>
          <p className="text-lg text-gray-400">
            Conecta tus motores de tráfico y toma el control total de tus anuncios directamente desde tu chat.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-8 relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10 -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-neon-purple -z-10 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted ? "bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" :
                  isCurrent ? "bg-[#0a0c10] border-neon-purple text-neon-purple" :
                  "bg-[#0a0c10] border-gray-700 text-gray-500"
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isCurrent || isCompleted ? "text-gray-200" : "text-gray-600"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="bg-dark-card border border-dark-card-border rounded-3xl p-6 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[380px]">
          
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">1. Vincula tu WhatsApp (Comandos & Alertas)</h2>
              <p className="text-gray-400 mb-8">
                Ingresa tu número de WhatsApp personal. Desde este chat podrás escribir órdenes en español como: <br />
                <span className="text-neon-purple italic font-medium">"Revisa mi CTR. Si alguno es menor a 1%, apágalo"</span> y recibir informes diarios.
              </p>
              
              <div className="mb-6 max-w-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tu Número de WhatsApp</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Ej: 51999888777 (Código de país sin '+')"
                  className="w-full bg-[#0a0c10] border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-colors"
                />
              </div>

              <div className="flex justify-end mt-10">
                <button 
                  onClick={() => handleNext(1)}
                  disabled={saving}
                  className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  {saving ? "Guardando..." : "Continuar a TikTok Ads"} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">2. Conectar TikTok Ads (Motor de Adquisición)</h2>
              <p className="text-gray-400 mb-8">
                Conecta tu cuenta de TikTok Ads Manager para medir la inversión en tráfico de bajo costo y enviar conversiones offline servidor a servidor.
              </p>
              
              <div className="p-6 bg-[#0a0c10] border border-gray-800 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">TikTok Business Center / Advertiser ID</h3>
                  <p className="text-sm text-gray-400">Estado de cuenta: En proceso de aprobación de credenciales MCP.</p>
                </div>
                <button 
                  onClick={() => alert("Tu cuenta de TikTok Ads está en revisión. Se activará automáticamente apenas ingreses tus credenciales.")}
                  className="px-5 py-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/30 text-neon-purple font-medium text-sm hover:bg-neon-purple/20 transition-all shrink-0"
                >
                  Vincular TikTok Ads
                </button>
              </div>

              <div className="flex justify-between items-center mt-10">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-400 hover:text-white text-sm font-medium"
                >
                  Atrás
                </button>
                <button 
                  onClick={() => handleNext(2)}
                  className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  Continuar a Google Ads <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">3. Conectar Google Ads (Remarketing Invisible)</h2>
              <p className="text-gray-400 mb-8">
                Conecta tu cuenta oficial de Google Ads. QSS creará tus listas de audiencia y retargeting automático de forma invisible por detrás.
              </p>
              
              <div className="p-6 bg-[#0a0c10] border border-gray-800 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Cuenta de Google Ads</h3>
                  <p className="text-sm text-gray-400">
                    {connectedAds ? "✅ Cuenta de Google Ads conectada exitosamente." : "Haz clic para autorizar a QSS en 1 clic mediante Google OAuth."}
                  </p>
                </div>
                <button
                  onClick={handleOAuth}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 ${
                    connectedAds 
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                      : "bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  }`}
                >
                  {connectedAds ? "Re-Conectar Google Ads" : "Conectar con Google OAuth"}
                </button>
              </div>

              <div className="flex justify-between items-center mt-10">
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="text-gray-400 hover:text-white text-sm font-medium"
                >
                  Atrás
                </button>
                <button 
                  onClick={() => handleNext(3)}
                  className="bg-gradient-to-r from-neon-purple to-neon-pink text-white px-8 py-3.5 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  <Rocket size={18} /> Finalizar Setup & Ir al Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
