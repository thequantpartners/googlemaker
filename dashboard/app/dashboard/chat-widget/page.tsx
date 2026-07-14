"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Palette,
  ListChecks,
  Brain,
  Code2,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface RuleOption {
  text: string;
  points: number;
}

interface RuleQuestion {
  id: string;
  question: string;
  response_type?: string;
  points_if_answered?: number;
  options: RuleOption[];
}

interface WidgetConfig {
  id: string;
  client_id: string;
  is_enabled: boolean;
  widget_name: string;
  welcome_message: string;
  rejection_message: string;
  downsell_url: string | null;
  allowed_domains: string;
  ai_provider: string;
  ai_api_key?: string;
  has_api_key?: boolean;
  theme_color: string;
  rules_config: RuleQuestion[];
  intent_threshold: number;
  system_prompt: string | null;
  security_protocol: string | null;
  temperature: number;
  max_tokens: number;
  ai_apply_chat_widget: boolean;
  ai_apply_whatsapp: boolean;
  ai_goals: string[];
  updated_at: string;
}

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  session_id: string | null;
  created_at: string;
}

/* ── Skeleton helper ──────────────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

/* ── Rules normalizer ─────────────────────────────────────────────────────── */
// The backend may return rules_config as a parsed array OR as a raw JSON string.
// Always coerce it into a valid array so .map()/spread never crash React.
function normalizeRules(raw: unknown): RuleQuestion[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? (value as RuleQuestion[]) : [];
}

/* ── Tab IDs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "apariencia",  label: "Apariencia",    icon: Palette },
  { id: "reglas",      label: "Reglas",         icon: ListChecks },
  { id: "ia",          label: "Intención IA",   icon: Brain },
  { id: "instalacion", label: "Instalación",    icon: Code2 },
  { id: "leads",       label: "Leads",          icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ── Main component ───────────────────────────────────────────────────────── */

export default function ChatWidgetPage() {
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [activeTab, setActiveTab]   = useState<TabId>("apariencia");
  const [config, setConfig]         = useState<WidgetConfig | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied]         = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [hasPaymentConfig, setHasPaymentConfig] = useState(false);
  const [hasCalendarConfig, setHasCalendarConfig] = useState(false);

  // leads sub-state
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  /* ── Fetch config ──────────────────────────────────────────────────────── */

  const fetchConfig = useCallback(async () => {
    if (!session?.backendToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/me/chat-widget`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data: WidgetConfig = await res.json();
        // Ensure rules_config is always a valid array (backend may send a JSON string)
        setConfig({ ...data, rules_config: normalizeRules(data.rules_config) });
      }
      
      const resPayment = await fetch(`${API}/clients/me/payment-config`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (resPayment.ok) {
        const pData = await resPayment.json();
        if (pData.provider && pData.provider !== "none") {
          setHasPaymentConfig(true);
        }
        if (pData.provider_keys && pData.provider_keys.google_calendar_refresh_token) {
          setHasCalendarConfig(true);
        }
      }
    } catch (e) {
      console.error("Failed to load widget config", e);
    } finally {
      setLoading(false);
    }
  }, [session, API]);

  const fetchLeads = useCallback(async () => {
    if (!session?.backendToken) return;
    setLeadsLoading(true);
    try {
      const res = await fetch(`${API}/clients/me/chat-widget/leads`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) setLeads(await res.json());
    } catch (e) {
      console.error("Failed to load leads", e);
    } finally {
      setLeadsLoading(false);
    }
  }, [session, API]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => {
    if (activeTab === "leads") fetchLeads();
  }, [activeTab, fetchLeads]);

  /* ── Save ──────────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    if (!session?.backendToken || !config) return;
    
    // Validar que no haya preguntas u opciones vacías
    const hasEmpty = config.rules_config.some(q => 
      !q.question.trim() || 
      ((!q.response_type || q.response_type === "options") && q.options.some(o => !o.text.trim()))
    );
    if (hasEmpty) {
      setMsg({ text: "Las preguntas y opciones de las reglas no pueden estar vacías.", type: "error" });
      setTimeout(() => setMsg(null), 4000);
      return;
    }

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
          is_enabled:       config.is_enabled,
          widget_name:      config.widget_name,
          welcome_message:  config.welcome_message,
          rejection_message: config.rejection_message,
          downsell_url:     config.downsell_url || null,
          allowed_domains:  config.allowed_domains,
          ai_provider:      config.ai_provider,
          ai_api_key:       config.ai_api_key,
          has_api_key:      config.has_api_key,
          theme_color:      config.theme_color,
          rules_config:     config.rules_config,
          intent_threshold: config.intent_threshold,
          system_prompt:    config.system_prompt,
          security_protocol: config.security_protocol,
          temperature:      config.temperature,
          max_tokens:       config.max_tokens,
          ai_apply_chat_widget: config.ai_apply_chat_widget ?? true,
          ai_apply_whatsapp: config.ai_apply_whatsapp ?? true,
          ai_goals:         config.ai_goals || [],
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig({ ...updated, rules_config: normalizeRules(updated.rules_config) });
        setMsg({ text: "¡Configuración guardada correctamente!", type: "success" });
      } else {
        const err = await res.json().catch(() => ({}));
        let errorMessage = "Error al guardar la configuración.";
        if (typeof err.detail === "string") {
          errorMessage = err.detail;
        } else if (Array.isArray(err.detail) && err.detail.length > 0) {
          errorMessage = err.detail[0].msg || "Error de validación.";
        }
        setMsg({ text: errorMessage, type: "error" });
      }
    } catch {
      setMsg({ text: "Error de red. Inténtalo de nuevo.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  /* ── Rules helpers ─────────────────────────────────────────────────────── */

  const nextId = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addQuestion = () => {
    if (!config) return;
    setConfig({
      ...config,
      rules_config: [
        ...config.rules_config,
        { id: nextId(), question: "", response_type: "options", points_if_answered: 0, options: [{ text: "", points: 5 }] },
      ],
    });
  };

  const removeQuestion = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, rules_config: config.rules_config.filter((_, i) => i !== idx) });
  };

  const updateQuestion = (idx: number, field: keyof RuleQuestion, value: any) => {
    if (!config) return;
    const rules = [...config.rules_config];
    rules[idx] = { ...rules[idx], [field]: value };
    setConfig({ ...config, rules_config: rules });
  };

  const addOption = (qIdx: number) => {
    if (!config) return;
    const rules = [...config.rules_config];
    rules[qIdx] = { ...rules[qIdx], options: [...rules[qIdx].options, { text: "", points: 5 }] };
    setConfig({ ...config, rules_config: rules });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    if (!config) return;
    const rules = [...config.rules_config];
    rules[qIdx] = { ...rules[qIdx], options: rules[qIdx].options.filter((_, i) => i !== oIdx) };
    setConfig({ ...config, rules_config: rules });
  };

  const updateOption = (qIdx: number, oIdx: number, field: keyof RuleOption, value: string | number) => {
    if (!config) return;
    const rules = [...config.rules_config];
    const opts  = [...rules[qIdx].options];
    opts[oIdx]  = { ...opts[oIdx], [field]: value };
    rules[qIdx] = { ...rules[qIdx], options: opts };
    setConfig({ ...config, rules_config: rules });
  };

  /* ── Copy snippet ──────────────────────────────────────────────────────── */

  const snippet = config
    ? `<script src="${API}/static/qss-widget.js?client=${config.client_id}"></script>`
    : "";

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Loading state ─────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-24 animate-fade-in-up space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <AlertTriangle size={40} className="text-yellow-400" />
        <p className="text-gray-300 text-lg">No se pudo cargar la configuración del widget.</p>
        <button onClick={fetchConfig} className="px-4 py-2 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all text-sm font-medium">
          Reintentar
        </button>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-5xl mx-auto pb-28 animate-fade-in-up">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="text-neon-purple" size={32} />
            Leads Widget
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Configura y personaliza el asistente de chat para tu sitio web.
          </p>
        </div>

        {/* Enable toggle */}
        <button
          onClick={() => setConfig({ ...config, is_enabled: !config.is_enabled })}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-semibold text-sm transition-all ${
            config.is_enabled
              ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
              : "bg-white/5 border-dark-card-border text-gray-400"
          }`}
        >
          {config.is_enabled
            ? <><ToggleRight size={20} /> Widget Activo</>
            : <><ToggleLeft  size={20} /> Widget Inactivo</>}
        </button>
      </div>

      {/* ── Feedback banner ── */}
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

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-dark-card-border mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/25"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: APARIENCIA
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "apariencia" && (
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <SectionTitle icon={<Palette size={22} />} title="Apariencia del Widget" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Nombre del widget" hint="Se muestra en el encabezado del chat">
              <input
                type="text"
                value={config.widget_name}
                maxLength={80}
                onChange={(e) => setConfig({ ...config, widget_name: e.target.value })}
                className={inputCls}
                placeholder="Ej: Habla con nosotros"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Mensaje de bienvenida" hint="Primera línea que verá el visitante">
                <textarea
                  value={config.welcome_message}
                  rows={2}
                  maxLength={300}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                  className={textareaCls}
                  placeholder="¡Hola! 👋 ¿En qué podemos ayudarte hoy?"
                />
              </Field>
            </div>

            <div className="md:col-span-1">
              <Field label="Mensaje de despedida" hint="Se muestra si el usuario no alcanza el umbral de IA">
                <textarea
                  value={config.rejection_message || ""}
                  rows={2}
                  maxLength={500}
                  onChange={(e) => setConfig({ ...config, rejection_message: e.target.value })}
                  className={textareaCls}
                  placeholder="Ej: ¡Gracias! Nos pondremos en contacto contigo a la brevedad. 😊"
                />
              </Field>
            </div>

            <div className="md:col-span-1">
              <Field label="URL de Downsell (Opcional)" hint="Enlace u oferta extra para leads no calificados">
                <input
                  type="url"
                  value={config.downsell_url || ""}
                  onChange={(e) => setConfig({ ...config, downsell_url: e.target.value })}
                  className={inputCls}
                  placeholder="https://tudominio.com/oferta"
                />
              </Field>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-2xl bg-black/20 border border-dark-card-border">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Vista previa</p>
            <div className="inline-flex flex-col rounded-2xl overflow-hidden shadow-xl text-sm max-w-[260px]">
              <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-[#4F46E5] to-[#818CF8]">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <div>
                  <p className="text-white font-semibold text-sm">{config.widget_name || "Chat"}</p>
                  <p className="text-white/75 text-xs">● En línea</p>
                </div>
              </div>
              <div className="bg-[#f5f5f7] px-3 py-4 min-h-[80px]">
                <div className="bg-white rounded-xl rounded-bl-sm px-3 py-2 text-gray-700 shadow-sm text-xs max-w-[90%]">
                  {config.welcome_message || "¡Hola! ¿En qué podemos ayudarte hoy?"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: REGLAS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "reglas" && (
        <div className="space-y-5">
          <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-2">
              <SectionTitle icon={<ListChecks size={22} />} title="Constructor de Reglas" />
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-neon-purple/15 text-neon-purple border border-neon-purple/25 hover:bg-neon-purple/25 transition-all flex-shrink-0"
              >
                <Plus size={16} /> Agregar Pregunta
              </button>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Botones Rápidos (Heurística)</h3>
            <p className="text-gray-500 text-sm mb-6">
              Define las preguntas iniciales que hará el setter virtual. Cada opción suma puntos al score de intención.
              Cuando el score supere el <span className="text-neon-purple font-semibold">umbral</span>, la IA toma el control.
            </p>

            {config.rules_config.length === 0 && (
              <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                <ListChecks size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin preguntas todavía. Agrega la primera para empezar.</p>
              </div>
            )}

            <div className="space-y-4">
              {config.rules_config.map((q, qIdx) => (
                <RuleQuestionCard
                  key={q.id}
                  q={q}
                  qIdx={qIdx}
                  totalQuestions={config.rules_config.length}
                  onUpdateQuestion={updateQuestion}
                  onRemoveQuestion={removeQuestion}
                  onAddOption={addOption}
                  onRemoveOption={removeOption}
                  onUpdateOption={updateOption}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: INTENCIÓN IA
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ia" && (
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <SectionTitle icon={<Brain size={22} />} title="Configuración Master IA" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-dark-card-border">
                <div>
                   <h4 className="text-white font-medium text-sm">Chat Widget</h4>
                   <p className="text-gray-400 text-xs mt-0.5">Aplicar estas instrucciones al widget web</p>
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
                   <p className="text-gray-400 text-xs mt-0.5">Aplicar estas instrucciones al bot de WhatsApp</p>
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
              Gemini 2.0 Flash toma el control cuando el score acumula ≥{" "}
              <span className="text-neon-purple font-semibold">{config.intent_threshold} pts</span>.
              Define aquí cómo debe comportarse el asistente una vez en modo IA.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <Field label="Proveedor de IA" hint="Selecciona el modelo de Inteligencia Artificial">
                <select
                  value={config.ai_provider || "openai"}
                  onChange={(e) => setConfig({ ...config, ai_provider: e.target.value })}
                  className={inputCls}
                >
                  <option value="openai">OpenAI (GPT-4o Mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Haiku)</option>
                  <option value="gemini">Google (Gemini 2.0 Flash)</option>
                </select>
              </Field>
            </div>

            <div className="md:col-span-1">
              <Field label={
                <div className="flex items-center gap-2">
                  API Key
                  {config.has_api_key && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-neon-green/20 text-neon-green px-2 py-0.5 rounded-full">
                      ✓ Configurada
                    </span>
                  )}
                </div>
              } hint={config.has_api_key ? "API Key guardada." : "Pega tu clave secreta de la API."}>
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
                      autoFocus
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
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-dark-card-border">
            <Field label="Umbral de intención (pts)" hint="Score mínimo para activar IA">
              <input
                type="number"
                min={0} max={9999}
                value={config.intent_threshold}
                onChange={(e) => setConfig({ ...config, intent_threshold: parseInt(e.target.value) || 0 })}
                className={inputCls}
              />
            </Field>

            <Field label="Temperatura" hint={`Creatividad del modelo (${config.temperature.toFixed(1)})`}>
              <input
                type="range" min={0} max={2} step={0.1}
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-neon-purple mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Preciso</span>
                <span className="text-neon-purple font-semibold">{config.temperature.toFixed(1)}</span>
                <span>Creativo</span>
              </div>
            </Field>

            <Field label="Máx. tokens" hint="Longitud máxima de respuesta">
              <input
                type="number"
                min={64} max={8192}
                value={config.max_tokens}
                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 1024 })}
                className={inputCls}
              />
            </Field>

            <div className="md:col-span-3">
              <Field label="System Prompt" hint="Instrucciones base para la IA (rol, tono, objetivo)">
                <textarea
                  rows={6}
                  value={config.system_prompt ?? ""}
                  onChange={(e) => setConfig({ ...config, system_prompt: e.target.value || null })}
                  className={textareaCls}
                  placeholder="Ej: Eres un asistente comercial amigable de [Tu Empresa]. Tu objetivo es entender las necesidades del cliente y guiarlo hacia una consulta. Habla siempre en español, con tono profesional pero cercano..."
                />
              </Field>
            </div>

            <div className="md:col-span-3">
              <Field
                label="Protocolo de Seguridad"
                hint="Reglas que la IA nunca puede violar (inyectadas al final del prompt)"
              >
                <textarea
                  rows={4}
                  value={config.security_protocol ?? ""}
                  onChange={(e) => setConfig({ ...config, security_protocol: e.target.value || null })}
                  className={textareaCls}
                  placeholder="Ej: Nunca prometas precios exactos. No hagas declaraciones legales. Si el usuario menciona competidores, redirige la conversación hacia nuestras fortalezas..."
                />
              </Field>
            </div>

            <div className="md:col-span-3 pt-6 border-t border-dark-card-border">
              <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-neon-green" />
                Metas (Goals)
              </h4>
              <p className="text-gray-400 text-xs mb-4">Activa las metas que la IA debe perseguir al conversar con los prospectos. Las metas se añadirán automáticamente a las instrucciones de la IA.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${hasCalendarConfig ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                  <div>
                    <h5 className="text-sm text-white flex items-center gap-2">
                      Agendar <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-300 px-1.5 rounded">Calendario</span>
                    </h5>
                    <p className="text-xs text-gray-400 mt-1">
                      {hasCalendarConfig ? 'La IA revisará tu disponibilidad y agendará reuniones.' : 'Conecta tu calendario de Google para activar esta meta.'}
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
                      {hasPaymentConfig ? 'La IA solicitará y gestionará el cobro (consultas, iniciales, etc).' : 'Configura Stripe, PayPal o similar para activar.'}
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: INSTALACIÓN
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "instalacion" && (
        <div className="space-y-6">
          <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Code2 size={18} className="text-neon-purple" />
              Seguridad del script
            </h3>
            <Field label="Dominios Permitidos (Opcional)" hint="Separa los dominios con comas. El widget solo cargará en estos sitios. Déjalo en blanco para permitir todos.">
              <textarea
                value={config.allowed_domains || ""}
                rows={2}
                maxLength={1000}
                onChange={(e) => setConfig({ ...config, allowed_domains: e.target.value })}
                className={textareaCls}
                placeholder="Ej: miempresa.com, www.miempresa.com"
              />
            </Field>
          </div>

          <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8">
            <SectionTitle icon={<Code2 size={22} />} title="Código de Instalación" />
            <p className="text-gray-400 text-sm mb-6 mt-1">
              Pega este código justo antes del cierre de la etiqueta{" "}
              <code className="text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded">&lt;/body&gt;</code>{" "}
              en tu sitio web. El widget se cargará automáticamente.
            </p>

            <div className="relative">
              <pre className="bg-black/40 border border-dark-card-border rounded-2xl p-5 text-sm text-neon-green overflow-x-auto font-mono">
                <code>{snippet}</code>
              </pre>
              <button
                onClick={copySnippet}
                className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  copied
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                    : "bg-white/5 text-gray-300 border border-dark-card-border hover:bg-white/10"
                }`}
              >
                {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
              </button>
            </div>
          </div>

          <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ListChecks size={18} className="text-neon-purple" />
              Guía rápida
            </h3>
            <ol className="space-y-3 text-sm text-gray-400 list-none">
              {[
                "Asegúrate de que el widget esté <strong class='text-white'>Activo</strong> (toggle arriba a la derecha).",
                "Configura al menos una regla o un System Prompt en las pestañas anteriores.",
                "Haz clic en <strong class='text-white'>Guardar Configuración</strong>.",
                "Copia el snippet y pégalo en el HTML de tu web.",
                "El botón de chat aparecerá en la esquina inferior derecha de tu sitio.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/15 text-neon-purple text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: step }} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: LEADS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "leads" && (
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <SectionTitle icon={<Users size={22} />} title="Leads Capturados" />
            <button
              onClick={fetchLeads}
              disabled={leadsLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-dark-card-border rounded-xl hover:bg-white/5 transition-all"
            >
              {leadsLoading ? <Loader2 size={14} className="animate-spin" /> : "↻"} Actualizar
            </button>
          </div>

          {leadsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aún no hay leads. Cuando la IA capture un contacto, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-white/5">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Teléfono</th>
                    <th className="pb-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 pr-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-500 flex-shrink-0" />
                          {lead.name ?? <span className="text-gray-600 italic">—</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-500 flex-shrink-0" />
                          {lead.email ?? <span className="text-gray-600 italic">—</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-500 flex-shrink-0" />
                          {lead.phone ?? <span className="text-gray-600 italic">—</span>}
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">
                        {new Date(lead.created_at).toLocaleString("es-ES", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Floating save bar ── */}
      {activeTab !== "leads" && activeTab !== "instalacion" && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 p-4 border-t border-dark-card-border bg-[#0B0E14]/90 backdrop-blur-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <p className="text-gray-500 text-xs hidden sm:block">
              Los cambios no son públicos hasta que hagas clic en Guardar.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
                : <><Check size={16} /> Guardar Configuración</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
      <span className="text-neon-purple">{icon}</span>
      {title}
    </h2>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode | string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
    </div>
  );
}

function RuleQuestionCard({
  q,
  qIdx,
  totalQuestions,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: {
  q: RuleQuestion;
  qIdx: number;
  totalQuestions: number;
  onUpdateQuestion: (i: number, f: keyof RuleQuestion, v: any) => void;
  onRemoveQuestion: (i: number) => void;
  onAddOption: (i: number) => void;
  onRemoveOption: (qi: number, oi: number) => void;
  onUpdateOption: (qi: number, oi: number, f: keyof RuleOption, v: string | number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-dark-card-border rounded-2xl overflow-hidden bg-black/20">
      {/* Question header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-card-border bg-white/[0.02]">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/15 text-neon-purple text-xs font-bold flex items-center justify-center">
          {qIdx + 1}
        </span>
        <input
          type="text"
          value={q.question}
          onChange={(e) => onUpdateQuestion(qIdx, "question", e.target.value)}
          placeholder="Ej: ¿Cuál es tu presupuesto mensual?"
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button
          onClick={() => onRemoveQuestion(qIdx)}
          className="text-gray-600 hover:text-red-400 transition-colors p-1"
          disabled={totalQuestions === 1}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Options */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="w-1/3">
              <label className="block text-xs font-medium text-gray-400 mb-1">Tipo de Respuesta</label>
              <select
                value={q.response_type || "options"}
                onChange={(e) => onUpdateQuestion(qIdx, "response_type", e.target.value)}
                className={`${inputCls} py-1.5 px-2`}
              >
                <option value="options">Opciones Rápidas</option>
                <option value="text">Texto Libre / Input</option>
                <option value="number">Número</option>
              </select>
            </div>
            
            {(q.response_type === "text" || q.response_type === "number") && (
              <div className="w-1/3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Puntos otorgados</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0} max={999}
                    value={q.points_if_answered || 0}
                    onChange={(e) => onUpdateQuestion(qIdx, "points_if_answered", parseInt(e.target.value) || 0)}
                    className={`${inputCls} py-1.5 px-2 text-center w-20`}
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            )}
          </div>

          {(!q.response_type || q.response_type === "options") && (
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-purple/50 flex-shrink-0" />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => onUpdateOption(qIdx, oIdx, "text", e.target.value)}
                    placeholder="Ej: Opción 1"
                    className={`${inputCls} flex-1`}
                  />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      min={0} max={999}
                      value={opt.points}
                      onChange={(e) => onUpdateOption(qIdx, oIdx, "points", parseInt(e.target.value) || 0)}
                      className={`${inputCls} w-20 text-center`}
                    />
                    <span className="text-xs text-gray-600 whitespace-nowrap">pts</span>
                  </div>
                  <button
                    onClick={() => onRemoveOption(qIdx, oIdx)}
                    disabled={q.options.length === 1}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => onAddOption(qIdx)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-neon-purple transition-colors mt-2 ml-4"
              >
                <Plus size={14} /> Agregar opción
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared style constants ───────────────────────────────────────────────── */

const inputCls =
  "w-full bg-black/20 border border-dark-card-border rounded-xl px-3 py-2.5 text-white text-sm " +
  "focus:outline-none focus:border-neon-purple/50 transition-colors placeholder-gray-600";

const textareaCls =
  "w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white text-sm " +
  "focus:outline-none focus:border-neon-purple/50 transition-colors resize-none placeholder-gray-600 leading-relaxed";
