"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Plus, Clock, Users, Video } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

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
            fetchEvents();
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchEvents() {
      try {
        const res = await fetch(`${API}/clients/me/calendar/events`, {
          headers: { Authorization: `Bearer ${session?.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data || []);
        }
      } catch (e) {
        console.error("Error fetching events", e);
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

  const formatEventDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Card */}
          <div className="lg:col-span-1 bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Conexión</h2>
              {hasGoogleCalendar && (
                <span className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Conectado
                </span>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <Calendar size={48} className="text-neon-purple mb-4" />
                {hasGoogleCalendar ? (
                  <div className="text-center px-4">
                    <h3 className="text-lg font-bold text-white mb-2">Google Calendar</h3>
                    <p className="text-xs text-gray-400 mb-6">
                      Sincronizado. La IA tiene acceso a tu agenda principal.
                    </p>
                    <button 
                      onClick={handleOAuth}
                      className="bg-transparent border border-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-all text-xs"
                    >
                      Reconectar Cuenta
                    </button>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <h3 className="text-lg font-medium text-white mb-2">Sin Conexión</h3>
                    <p className="text-xs text-gray-400 mb-6">
                      Autoriza el acceso a Google Calendar para habilitar la IA.
                    </p>
                    <button 
                      onClick={handleOAuth}
                      className="bg-neon-purple hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2 mx-auto text-sm"
                    >
                      <Plus size={16} /> Conectar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events List */}
          {hasGoogleCalendar && (
            <div className="lg:col-span-2 bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Próximos Eventos</h2>
                  <p className="text-sm text-gray-400">Las próximas 10 reuniones en tu agenda de Google.</p>
                </div>
              </div>

              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((ev, idx) => (
                    <div key={idx} className="bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <h3 className="font-medium text-gray-200 text-sm truncate max-w-sm">{ev.summary || "(Sin título)"}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-neon-purple" />
                            {ev.start?.dateTime ? formatEventDate(ev.start.dateTime) : "Todo el día"}
                          </span>
                          {ev.attendees && ev.attendees.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {ev.attendees.length} invitados
                            </span>
                          )}
                        </div>
                      </div>
                      {ev.htmlLink && (
                        <a href={ev.htmlLink} target="_blank" rel="noreferrer" className="text-xs text-neon-purple hover:text-neon-pink font-medium flex items-center gap-1 shrink-0">
                          Ver en Calendar &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Calendar size={48} className="mb-4 opacity-50" />
                  <p>No tienes eventos próximos agendados.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
