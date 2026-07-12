"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { CheckCircle2, Phone, Target, MessageSquare, Briefcase, Calendar, Plus, Rocket, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectedAds, setConnectedAds] = useState(false);
  const [connectedCalendar, setConnectedCalendar] = useState(false);

  // Form states
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [industryNiche, setIndustryNiche] = useState("");
  const [ycloudApiKey, setYcloudApiKey] = useState("");
  const [calApiKey, setCalApiKey] = useState("");
  const [calBookingLink, setCalBookingLink] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    const connectedParam = params.get('connected');
    const calendarConnectedParam = params.get('calendar_connected');
    if (stepParam) setCurrentStep(parseInt(stepParam));
    if (connectedParam === 'success') setConnectedAds(true);
    if (calendarConnectedParam === 'success') setConnectedCalendar(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!session?.backendToken) return;
      try {
        const [meRes, payRes, credRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, { headers: { Authorization: `Bearer ${session.backendToken}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/payment-config`, { headers: { Authorization: `Bearer ${session.backendToken}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, { headers: { Authorization: `Bearer ${session.backendToken}` } })
        ]);

        if (meRes.ok) {
          const data = await meRes.json();
          setWhatsappPhone(data.whatsapp_phone || "");
          setIndustryNiche(data.industry_niche || "");
        }
        if (payRes.ok) {
          const data = await payRes.json();
          setYcloudApiKey(data.ycloud_api_key || "");
          setCalApiKey(data.cal_api_key || "");
          setCalBookingLink(data.cal_booking_link || "");
          if (data.has_google_calendar) {
            setConnectedCalendar(true);
          }
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
        body: JSON.stringify({ whatsapp_phone: whatsappPhone, industry_niche: industryNiche })
      });
      return res.ok;
    } catch { return false; }
  };

  const saveSystemPrompt = async (niche: string) => {
    if (!session?.backendToken) return false;
    let prompt = "Eres un asistente virtual amable y profesional. Tu objetivo es ayudar a los clientes, resolver dudas y agendar citas.";
    switch(niche) {
      case "Legal": prompt = "Eres un asistente legal experto. Tu objetivo es pre-calificar casos y agendar consultas."; break;
      case "Salud": prompt = "Eres un asistente médico virtual. Tu objetivo es agendar citas para pacientes de forma empática."; break;
      case "Inmobiliaria": prompt = "Eres un asesor inmobiliario virtual. Tu objetivo es perfilar compradores y agendar visitas a propiedades."; break;
      case "E-Commerce": prompt = "Eres un experto en soporte y ventas para e-commerce. Tu objetivo es resolver dudas de productos y guiar al usuario a la compra."; break;
      case "Servicios": prompt = "Eres un asistente de servicios profesionales. Tu objetivo es cotizar servicios y agendar visitas técnicas."; break;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/chat-widget`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.backendToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ system_prompt: prompt })
      });
      return res.ok;
    } catch { return false; }
  };

  const savePaymentConfig = async () => {
    if (!session?.backendToken) return false;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/payment-config`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.backendToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ycloud_api_key: ycloudApiKey, cal_api_key: calApiKey, cal_booking_link: calBookingLink })
      });
      return res.ok;
    } catch { return false; }
  };

  const handleNext = async (step: number) => {
    setSaving(true);
    let success = true;
    if (step === 1) {
      success = await saveMeData();
    } else if (step === 2) {
      success = await saveMeData();
      if (success) await saveSystemPrompt(industryNiche);
    } else if (step === 3 || step === 5) {
      success = await savePaymentConfig();
    }
    setSaving(false);
    
    if (success && step < 5) {
      setCurrentStep(step + 1);
    } else if (success && step === 5) {
      window.location.href = "/dashboard";
    }
  };

  const handleOAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google-ads/login?token=${session?.backendToken}&return_to=${encodeURIComponent(window.location.href)}`;
  };

  const steps = [
    { id: 1, title: 'Notificaciones', icon: Phone },
    { id: 2, title: 'Inteligencia', icon: Target },
    { id: 3, title: 'Canal WhatsApp', icon: MessageSquare },
    { id: 4, title: 'Adquisición Ads', icon: Briefcase },
    { id: 5, title: 'Agendamiento', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  const niches = [
    { id: "Legal", icon: "⚖️", label: "Legal & Abogados" },
    { id: "Salud", icon: "⚕️", label: "Salud & Clínicas" },
    { id: "Inmobiliaria", icon: "🏢", label: "Inmobiliaria" },
    { id: "E-Commerce", icon: "🛒", label: "E-Commerce" },
    { id: "Servicios", icon: "🛠", label: "Servicios Generales" },
    { id: "Otro", icon: "✨", label: "Otro Nicho" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-3">
            Despliega tu Recepcionista de IA
          </h1>
          <p className="text-lg text-gray-400">
            Sigue estos 5 pasos para configurar tu sistema y automatizar tus ventas.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-8 relative">
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
        <div className="bg-dark-card border border-dark-card-border rounded-3xl p-6 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[400px]">
          
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">1. Recibe tus Leads</h2>
              <p className="text-gray-400 mb-8">Ingresa tu número de WhatsApp personal. Nuestro Master Bot te notificará al instante cuando la IA capture los datos de un cliente potencial.</p>
              
              <div className="mb-6">
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
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  {saving ? "Guardando..." : "Siguiente"} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">2. Elige tu Industria</h2>
              <p className="text-gray-400 mb-8">Selecciona tu nicho de mercado. Cargaremos un comportamiento base optimizado para que la IA sepa cómo vender en tu sector.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {niches.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => setIndustryNiche(niche.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      industryNiche === niche.id 
                      ? "bg-neon-purple/10 border-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                      : "bg-[#0a0c10] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                    }`}
                  >
                    <span className="text-3xl mb-2">{niche.icon}</span>
                    <span className="text-sm font-medium">{niche.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-10">
                <button onClick={() => setCurrentStep(1)} className="text-gray-400 hover:text-white transition-colors">Atrás</button>
                <button 
                  onClick={() => handleNext(2)}
                  disabled={saving || !industryNiche}
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Siguiente"} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">3. Conecta tu WhatsApp Oficial</h2>
              <p className="text-gray-400 mb-8">Para que la IA responda a tus clientes, conecta tu número de WhatsApp de empresa mediante YCloud API Oficial.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">YCloud API Key (Opcional por ahora)</label>
                <input
                  type="password"
                  value={ycloudApiKey}
                  onChange={(e) => setYcloudApiKey(e.target.value)}
                  placeholder="Pega aquí tu API Key de YCloud"
                  className="w-full bg-[#0a0c10] border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">Puedes saltar este paso si planeas usar solo el Chat Widget en tu página web.</p>
              </div>

              <div className="flex justify-between mt-10">
                <button onClick={() => setCurrentStep(2)} className="text-gray-400 hover:text-white transition-colors">Atrás</button>
                <button 
                  onClick={() => handleNext(3)}
                  disabled={saving}
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  {saving ? "Guardando..." : "Siguiente"} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">4. Adquisición de Clientes (Google Ads)</h2>
              <p className="text-gray-400 mb-8">Conecta tu cuenta de Google Ads para que nuestro sistema gestione y optimice tus campañas publicitarias con Inteligencia Artificial.</p>
              
              <div className="flex flex-col items-center justify-center py-8 bg-[#0a0c10] border border-gray-800 rounded-2xl mb-6">
                <Rocket size={48} className="text-neon-green mb-4" />
                {connectedAds ? (
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">¡Cuenta Conectada!</h3>
                    <p className="text-sm text-gray-400">Ya has autorizado el acceso a Google Ads.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-white mb-4">Autoriza el acceso a tu cuenta publicitaria</h3>
                    <button 
                      onClick={handleOAuth}
                      className="bg-neon-green hover:bg-neon-green/90 text-black px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2"
                    >
                      <Plus size={20} /> Conectar Google Ads
                    </button>
                  </>
                )}
              </div>

              <div className="flex justify-between mt-10">
                <button onClick={() => setCurrentStep(3)} className="text-gray-400 hover:text-white transition-colors">Atrás</button>
                <button 
                  onClick={() => handleNext(4)}
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  Siguiente <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">5. Agendamiento Automático</h2>
              <p className="text-gray-400 mb-8">¿Quieres que la IA cierre citas por ti? Conecta tu Google Calendar para que ofrezca tus horarios disponibles.</p>
              
              <div className="flex flex-col items-center justify-center py-8 bg-[#0a0c10] border border-gray-800 rounded-2xl mb-6">
                <Calendar size={48} className="text-neon-purple mb-4" />
                {connectedCalendar ? (
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">¡Calendario Conectado!</h3>
                    <p className="text-sm text-gray-400">Ya has autorizado el acceso a Google Calendar.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-white mb-4">Conecta tu cuenta de Google Calendar</h3>
                    <button 
                      onClick={() => {
                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google-calendar/login?token=${session?.backendToken}&return_to=${encodeURIComponent(window.location.href)}`;
                      }}
                      className="bg-neon-purple hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2"
                    >
                      <Plus size={20} /> Conectar Google Calendar
                    </button>
                  </>
                )}
              </div>

              <div className="flex justify-between mt-10">
                <button onClick={() => setCurrentStep(4)} className="text-gray-400 hover:text-white transition-colors">Atrás</button>
                <button 
                  onClick={() => window.location.href = "/dashboard"}
                  disabled={saving}
                  className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  Finalizar Onboarding <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
