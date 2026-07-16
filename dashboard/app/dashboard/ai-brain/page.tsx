"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ToggleLeft,
  ToggleRight,
  Save
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface WidgetConfig {
  ai_provider: string;
  ai_api_key?: string;
  has_api_key?: boolean;
  intent_threshold: number;
  system_prompt: string | null;
  security_protocol: string | null;
  temperature: number;
  max_tokens: number;
  ai_apply_chat_widget: boolean;
  ai_apply_whatsapp: boolean;
  ai_goals: string[];
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export default function AIBrainPage() {
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [hasPaymentConfig, setHasPaymentConfig] = useState(false);
  const [hasCalendarConfig, setHasCalendarConfig] = useState(false);

  /* ── Fetch config ──────────────────────────────────────────────────────── */

  const fetchConfig = useCallback(async () => {
    if (!session?.backendToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/me/chat-widget`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        setConfig(await res.json());
      }
      
      const resPayment = await fetch(`${API}/clients/me/payment-config`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (resPayment.ok) {
        const pData = await resPayment.json();
        if (pData.provider && pData.provider !== "none") {
          setHasPaymentConfig(true);
        }
        if (pData.has_google_calendar || (pData.cal_api_key && pData.cal_booking_link)) {
          setHasCalendarConfig(true);
        }
      }
    } catch (e) {
      console.error("Failed to load config", e);
    } finally {
      setLoading(false);
    }
  }, [session, API]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  /* ── Save ──────────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    if (!session?.backendToken || !config) return;

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/clients/me/chat-widget`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ai_provider: config.ai_provider,
          ai_api_key: config.ai_api_key,
          has_api_key: config.has_api_key,
          intent_threshold: config.intent_threshold,
          system_prompt: config.system_prompt,
          security_protocol: config.security_protocol,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          ai_apply_chat_widget: config.ai_apply_chat_widget ?? true,
          ai_apply_whatsapp: config.ai_apply_whatsapp ?? true,
          ai_goals: config.ai_goals || [],
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setIsEditingKey(false);
        setMsg({ text: "¡Configuración del Cerebro IA guardada!", type: "success" });
      } else {
        const err = await res.json().catch(() => ({}));
        let errorMessage = "Error al guardar.";
        if (typeof err.detail === "string") errorMessage = err.detail;
        else if (Array.isArray(err.detail) && err.detail.length > 0) errorMessage = err.detail[0].msg;
        setMsg({ text: errorMessage, type: "error" });
      }
    } catch {
      setMsg({ text: "Error de red. Inténtalo de nuevo.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-24 animate-fade-in-up space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <AlertTriangle size={40} className="text-yellow-400" />
        <p className="text-gray-300 text-lg">No se pudo cargar el Cerebro IA.</p>
        <button onClick={fetchConfig} className="px-4 py-2 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all text-sm font-medium">
          Reintentar
        </button>
      </div>
    );
  }

  const inputCls = "w-full bg-white/5 border border-dark-card-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-purple/50 transition-colors text-sm";
  const textareaCls = "w-full bg-white/5 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple/50 transition-colors text-sm resize-none";

  return (
    <div className="max-w-4xl mx-auto pb-28 animate-fade-in-up">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="text-neon-purple" size={32} />
            Cerebro IA
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Configura la inteligencia, metas y comportamiento de tu agente omnicanal.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-neon-purple text-white rounded-full font-bold shadow-lg shadow-neon-purple/25 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <span className="animate-spin text-xl leading-none">⟳</span> : <Save size={18} />}
          {saving ? "Guardando..." : "Guardar Cerebro IA"}
        </button>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border text-sm ${
          msg.type === "error"
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-neon-green/10 border-neon-green/30 text-neon-green"
        }`}>
          <AlertTriangle size={18} />
          {msg.text}
        </div>
      )}

      {/* ── Main Config ── */}
      <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-dark-card-border">
              <div>
                 <h4 className="text-white font-medium text-sm">Web Chat Widget</h4>
                 <p className="text-gray-400 text-xs mt-0.5">La IA tomará el control en el chat de la web</p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, ai_apply_chat_widget: config.ai_apply_chat_widget === undefined ? false : !config.ai_apply_chat_widget })}
                className={`${(config.ai_apply_chat_widget ?? true) ? 'text-neon-green' : 'text-gray-500 hover:text-gray-400'} transition-colors`}
              >
                {(config.ai_apply_chat_widget ?? true) ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
           </div>
           
           <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-dark-card-border">
              <div>
                 <h4 className="text-white font-medium text-sm">WhatsApp Virtual Setter</h4>
                 <p className="text-gray-400 text-xs mt-0.5">La IA tomará el control en WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, ai_apply_whatsapp: config.ai_apply_whatsapp === undefined ? false : !config.ai_apply_whatsapp })}
                className={`${(config.ai_apply_whatsapp ?? true) ? 'text-neon-purple' : 'text-gray-500 hover:text-gray-400'} transition-colors`}
              >
                {(config.ai_apply_whatsapp ?? true) ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-neon-purple/5 border border-neon-purple/20 text-sm text-gray-300 flex gap-3">
          <Zap size={18} className="text-neon-purple flex-shrink-0 mt-0.5" />
          <span>
            La Inteligencia Artificial toma el control cuando el prospecto acumula ≥{" "}
            <span className="text-neon-purple font-semibold">{config.intent_threshold} pts</span> en calificación.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-white mb-1">Proveedor de IA</label>
            <p className="text-xs text-gray-400 mb-2">Selecciona el modelo de Inteligencia Artificial</p>
            <select
              value={config.ai_provider || "openai"}
              onChange={(e) => setConfig({ ...config, ai_provider: e.target.value })}
              className={inputCls}
            >
              <option value="openai">OpenAI (GPT-4o Mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Haiku)</option>
              <option value="gemini">Google (Gemini 2.0 Flash)</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-2">
                API Key
                {config.has_api_key && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-neon-green/20 text-neon-green px-2 py-0.5 rounded-full">
                    ✓ Configurada
                  </span>
                )}
              </label>
              <p className="text-xs text-gray-400 mb-2">{config.has_api_key ? "API Key guardada." : "Pega tu clave secreta de la API."}</p>
              
              {config.has_api_key && !isEditingKey ? (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value="sk-...*********************************"
                    disabled
                    className={`${inputCls} opacity-50 cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/10 whitespace-nowrap"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={config.ai_api_key || ""}
                    onChange={(e) => setConfig({ ...config, ai_api_key: e.target.value })}
                    className={inputCls}
                    placeholder="sk-..."
                  />
                  {config.has_api_key && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingKey(false);
                        setConfig({ ...config, ai_api_key: "" });
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/20"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-dark-card-border">
          <div>
            <label className="block text-sm font-semibold text-white mb-1">Umbral de intención (pts)</label>
            <p className="text-xs text-gray-400 mb-2">Score mínimo para activar IA</p>
            <input
              type="number"
              min={0} max={9999}
              value={config.intent_threshold}
              onChange={(e) => setConfig({ ...config, intent_threshold: parseInt(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">Temperatura</label>
            <p className="text-xs text-gray-400 mb-2">Creatividad ({config.temperature?.toFixed(1) || '0.7'})</p>
            <input
              type="range" min={0} max={2} step={0.1}
              value={config.temperature || 0.7}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full accent-neon-purple mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Preciso</span>
              <span>Creativo</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">Máx. tokens</label>
            <p className="text-xs text-gray-400 mb-2">Longitud de respuesta</p>
            <input
              type="number"
              min={64} max={8192}
              value={config.max_tokens || 1024}
              onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 1024 })}
              className={inputCls}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-white mb-1">System Prompt</label>
            <p className="text-xs text-gray-400 mb-2">Instrucciones base para la IA (rol, tono, objetivo principal)</p>
            <textarea
              rows={6}
              value={config.system_prompt ?? ""}
              onChange={(e) => setConfig({ ...config, system_prompt: e.target.value || null })}
              className={textareaCls}
              placeholder="Ej: Eres un asistente comercial amigable..."
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-white mb-1">Protocolo de Seguridad</label>
            <p className="text-xs text-gray-400 mb-2">Reglas que la IA nunca puede violar (inyectadas al final)</p>
            <textarea
              rows={4}
              value={config.security_protocol ?? ""}
              onChange={(e) => setConfig({ ...config, security_protocol: e.target.value || null })}
              className={textareaCls}
              placeholder="Ej: Nunca prometas precios exactos. No hagas declaraciones legales..."
            />
          </div>

          <div className="md:col-span-3 pt-6 border-t border-dark-card-border">
            <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-neon-green" />
              Metas y Habilidades (Goals)
            </h4>
            <p className="text-gray-400 text-xs mb-4">Activa las herramientas de las que dispondrá la IA (se reflejará en ambos canales si los activaste).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${hasCalendarConfig ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                <div>
                  <h5 className="text-sm text-white flex items-center gap-2">
                    Agendar <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-300 px-1.5 rounded">Calendario</span>
                  </h5>
                  <p className="text-xs text-gray-400 mt-1">
                    {hasCalendarConfig ? 'La IA revisará tu disponibilidad y agendará reuniones.' : 'Conecta tu calendario para activar.'}
                  </p>
                </div>
                {hasCalendarConfig && (
                  <button
                    type="button"
                    onClick={() => {
                       const goals = config.ai_goals || [];
                       if (goals.includes('agendar')) {
                          setConfig({ ...config, ai_goals: goals.filter((g: string) => g !== 'agendar') });
                       } else {
                          setConfig({ ...config, ai_goals: [...goals, 'agendar'] });
                       }
                    }}
                    className={`${(config.ai_goals || []).includes('agendar') ? 'text-neon-green' : 'text-gray-500'} transition-colors`}
                  >
                    {(config.ai_goals || []).includes('agendar') ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                )}
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${hasPaymentConfig ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                <div>
                  <h5 className="text-sm text-white flex items-center gap-2">
                    Cobrar <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-300 px-1.5 rounded">Pagos</span>
                  </h5>
                  <p className="text-xs text-gray-400 mt-1">
                    {hasPaymentConfig ? 'La IA solicitará y gestionará cobros (ej. iniciales).' : 'Configura Stripe/MercadoPago para activar.'}
                  </p>
                </div>
                {hasPaymentConfig && (
                  <button
                    type="button"
                    onClick={() => {
                       const goals = config.ai_goals || [];
                       if (goals.includes('cobrar')) {
                          setConfig({ ...config, ai_goals: goals.filter((g: string) => g !== 'cobrar') });
                       } else {
                          setConfig({ ...config, ai_goals: [...goals, 'cobrar'] });
                       }
                    }}
                    className={`${(config.ai_goals || []).includes('cobrar') ? 'text-neon-green' : 'text-gray-500'} transition-colors`}
                  >
                    {(config.ai_goals || []).includes('cobrar') ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
