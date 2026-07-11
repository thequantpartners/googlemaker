"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Shield, ArrowRight, PlayCircle } from "lucide-react";

export default function WelcomePortal({ params }: { params: { clientId: string } }) {
  const [data, setData] = useState<{ client: string; company: string; steps: { id: number, title: string, description: string }[] } | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    try {
      // Decodificamos el payload de la URL
      const decoded = JSON.parse(decodeURIComponent(atob(params.clientId)));
      setData(decoded);
    } catch (e) {
      console.error("Error al decodificar el enlace", e);
    }
  }, [params.clientId]);

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-background">Cargando tu portal seguro...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-white selection:bg-neon-blue selection:text-white pb-20">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neon-blue/10 to-transparent pointer-events-none" />
      
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-20">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-neon-blue mb-6">
            <Shield size={16} /> Portal de Cliente Exclusivo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenido al inicio de tu escalabilidad,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              {data.client}
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Hemos preparado este portal para {data.company}. Sigue los pasos a continuación para iniciar nuestro trabajo juntos.
          </p>
        </div>

        {/* Video SOP / Bienvenida (Simulado) */}
        <div className="bg-black/50 border border-white/10 rounded-[2rem] p-4 md:p-8 mb-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="aspect-video bg-dark-card border border-dark-card-border rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
            <PlayCircle size={64} className="text-neon-blue/80 group-hover:scale-110 transition-transform cursor-pointer" />
            <p className="mt-4 text-gray-400 font-medium">Video de Bienvenida y Reglas de Trabajo (SOPs)</p>
          </div>
        </div>

        {/* Pasos del Onboarding */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Tu hoja de ruta:</h2>
          <div className="space-y-6">
            {data.steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <div 
                  key={step.id} 
                  className={`p-6 rounded-2xl border transition-all duration-300 flex gap-6 ${
                    isActive ? "bg-neon-blue/10 border-neon-blue shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02]" :
                    isCompleted ? "bg-white/5 border-green-500/30 opacity-70" :
                    "bg-dark-card border-white/5 opacity-50"
                  }`}
                >
                  <div className="shrink-0">
                    {isCompleted ? (
                      <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        isActive ? "bg-neon-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-white/10 text-gray-500"
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${isActive ? "text-white" : isCompleted ? "text-gray-300" : "text-gray-500"}`}>
                      {step.title}
                    </h3>
                    <p className={isActive ? "text-gray-300" : "text-gray-500"}>
                      {step.description}
                    </p>
                    
                    {isActive && (
                      <div className="mt-6">
                        <button 
                          onClick={() => setActiveStep(prev => prev + 1)}
                          className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          Marcar como Completado <ArrowRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {activeStep >= data.steps.length && (
            <div className="mt-12 p-8 bg-green-500/10 border border-green-500/30 rounded-2xl text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-400 w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">¡Todo listo para despegar!</h3>
              <p className="text-gray-400 text-lg">
                Has completado todos los pasos requeridos. Nuestro equipo ya fue notificado y nos pondremos a trabajar inmediatamente en tus campañas.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
