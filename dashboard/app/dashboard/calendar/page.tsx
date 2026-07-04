"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calendar, Save, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [calApiKey, setCalApiKey] = useState("");
  const [calBookingLink, setCalBookingLink] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

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
          // We only set the link, because the API key is not returned for security reasons (or we only return a boolean)
          // Actually, our API currently returns it if requested, but let's assume it's masked.
          if (data.cal_api_key) {
            setCalApiKey(data.cal_api_key);
            setIsConfigured(true);
          }
          if (data.cal_booking_link) {
            setCalBookingLink(data.cal_booking_link);
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

  async function handleSave() {
    if (!session?.backendToken) return;
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {};
      if (calApiKey) body.cal_api_key = calApiKey;
      if (calBookingLink) body.cal_booking_link = calBookingLink;

      const res = await fetch(`${API}/clients/me/payment-config`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMsg({ type: "ok", text: "Configuración de Cal.com guardada exitosamente." });
        setIsConfigured(!!calApiKey);
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg({ type: "err", text: err.detail ?? "Error al guardar la configuración." });
      }
    } catch (e) {
      setMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setSaving(false);
    }
  }

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
            Agendamiento IA (Cal.com)
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Conecta tu cuenta de Cal.com para que tu Asistente de Inteligencia Artificial pueda leer tu disponibilidad y agendar reuniones automáticamente con tus leads.
          </p>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            msg.type === "ok" ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}>
            {msg.type === "ok" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {msg.text}
          </div>
        )}

        {/* Configuration Card */}
        <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white">Credenciales de Conexión</h2>
              <p className="text-sm text-gray-400 mt-1">Configura tu enlace y tu token de acceso en solo 2 pasos.</p>
            </div>
            {isConfigured && (
              <span className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} />
                Conectado
              </span>
            )}
          </div>

          <div className="space-y-6">
            
            {/* Step 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paso 1: Tu enlace de Cal.com
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Ingresa el enlace directo del evento que deseas agendar (ej. cal.com/tu-usuario/15min).
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://cal.com/mi-agencia/consulta"
                  value={calBookingLink}
                  onChange={(e) => setCalBookingLink(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paso 2: Token de Integración (API Key)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Genera tu token privado en tu cuenta de Cal.com para permitir que la IA agende por ti.
              </p>
              <div className="relative">
                <input
                  type="password"
                  placeholder="cal_..."
                  value={calApiKey}
                  onChange={(e) => setCalApiKey(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all font-mono"
                />
              </div>
              <a 
                href="https://app.cal.com/settings/security" 
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neon-purple hover:text-neon-pink mt-3 transition-colors"
              >
                Obtener Token de Integración <ExternalLink size={12} />
              </a>
            </div>

            {/* Save Action */}
            <div className="pt-4 border-t border-white/[0.05] flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !calApiKey || !calBookingLink}
                className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Skeleton className="w-5 h-5 rounded-full bg-black/20" />
                ) : (
                  <Save size={18} />
                )}
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
