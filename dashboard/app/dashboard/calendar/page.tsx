"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Plus } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function fetchConfig() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${API}/clients/me/payment-config`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.has_google_calendar) {
            setHasGoogleCalendar(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [session, API]);

  const handleOAuth = () => {
    window.location.href = `${API}/auth/google-calendar/login?token=${session?.backendToken}&return_to=${encodeURIComponent(window.location.href)}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/4 rounded-lg bg-white/5" />
        <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Calendar className="text-neon-purple" />
            Calendario Integrado de IA
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Permite que la Inteligencia Artificial lea tu disponibilidad en tiempo real y agende reuniones automáticamente. Conecta tu cuenta de Google Calendar para que la IA ofrezca solo los horarios que tienes libres.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white">Google Calendar</h2>
              <p className="text-sm text-gray-400 mt-1">Autoriza el acceso a tu calendario para automatizar el agendamiento.</p>
            </div>
            {hasGoogleCalendar && (
              <span className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} />
                Conectado
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-10 bg-white/[0.02] border border-white/[0.05] rounded-2xl mb-6">
              <Calendar size={56} className="text-neon-purple mb-6" />
              {hasGoogleCalendar ? (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">¡Google Calendar Conectado!</h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                    La Inteligencia Artificial ya tiene acceso a tu calendario principal. Los eventos creados por la IA aparecerán directamente en tu agenda de Google.
                  </p>
                  <button 
                    onClick={handleOAuth}
                    className="bg-transparent border border-gray-600 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-medium transition-all text-sm"
                  >
                    Reconectar o Cambiar Cuenta
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-medium text-white mb-4">No has conectado tu calendario</h3>
                  <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
                    Haz clic en el botón de abajo para iniciar sesión con Google y otorgar los permisos necesarios para que la IA pueda leer tu disponibilidad y agendar por ti.
                  </p>
                  <button 
                    onClick={handleOAuth}
                    className="bg-neon-purple hover:bg-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} /> Conectar Google Calendar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
