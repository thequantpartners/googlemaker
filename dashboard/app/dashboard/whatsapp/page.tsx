"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Link2,
  Lock,
  Plug,
  Zap,
  Clock
} from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

interface WhatsAppConfig {
  id: string;
  user_id: string;
  generic_webhook_secret: string | null;
  ycloud_api_key: string | null;
  ycloud_webhook_secret: string | null;
  wa_delay_mode: string | null;
  wa_business_hours_enabled: boolean | null;
  wa_timezone: string | null;
  wa_business_hours: any | null;
  wa_bhours_message: string | null;
  wa_client_handoff_number?: string | null;
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 " +
  "focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all";

const TABS = [
  { id: "conexion", label: "Conexión", icon: Plug },
  { id: "comportamiento", label: "Comportamiento", icon: Zap },
  { id: "horarios", label: "Horarios", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function WhatsAppPage() {
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [activeTab, setActiveTab] = useState<TabId>("conexion");
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  // Form State
  const [ycloudKey, setYcloudKey] = useState("");
  const [ycloudWebhookSecret, setYcloudWebhookSecret] = useState("");
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [waDelayMode, setWaDelayMode] = useState("human");
  const [handoffNumber, setHandoffNumber] = useState("");

  // Business Hours State
  const [bHoursEnabled, setBHoursEnabled] = useState(false);
  const [timezone, setTimezone] = useState("America/Lima");
  const [bHoursMsg, setBHoursMsg] = useState("¡Hola! En este momento nuestra oficina está cerrada. Por favor, déjanos tu consulta y te contactaremos a primera hora en nuestro próximo día laborable.");
  const defaultSchedule = { enabled: true, start: "09:00", end: "18:00" };
  const closedSchedule = { enabled: false, start: "09:00", end: "18:00" };
  const [schedule, setSchedule] = useState({
    monday: { ...defaultSchedule },
    tuesday: { ...defaultSchedule },
    wednesday: { ...defaultSchedule },
    thursday: { ...defaultSchedule },
    friday: { ...defaultSchedule },
    saturday: { ...closedSchedule },
    sunday: { ...closedSchedule },
  });

  const webhookBaseUrl = API?.replace("/api", "") ?? "";
  const masterWebhookUrl = `${webhookBaseUrl}/webhooks/ycloud/webhook${config?.user_id ? `?client_id=${config.user_id}` : ""}`;

  useEffect(() => {
    if (!session?.backendToken) return;
    fetchConfig();
  }, [session]);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/me/payment-config`, {
        headers: { Authorization: `Bearer ${session!.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setYcloudKey(data.ycloud_api_key ?? "");
        setYcloudWebhookSecret(data.ycloud_webhook_secret ?? "");
        setWaDelayMode(data.wa_delay_mode ?? "human");
        setHandoffNumber(data.wa_client_handoff_number ?? "");
        setBHoursEnabled(data.wa_business_hours_enabled ?? false);
        setTimezone(data.wa_timezone ?? "America/Lima");
        if (data.wa_bhours_message) setBHoursMsg(data.wa_bhours_message);
        if (data.wa_business_hours) setSchedule(data.wa_business_hours);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/clients/me/payment-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.backendToken}`,
        },
        body: JSON.stringify({
          ycloud_api_key: ycloudKey || "",
          ycloud_webhook_secret: ycloudWebhookSecret || "",
          wa_delay_mode: waDelayMode || "human",
          wa_client_handoff_number: handoffNumber || null,
          wa_business_hours_enabled: bHoursEnabled,
          wa_timezone: timezone,
          wa_business_hours: schedule,
          wa_bhours_message: bHoursMsg
        }),
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      setMsg({ type: "ok", text: "Configuración guardada exitosamente." });
      setIsModalOpen(false);
      fetchConfig();
    } catch (e: any) {
      setMsg({ type: "err", text: e.message || "Error al guardar configuración" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Estás seguro de desconectar YCloud? Se perderá el enrutamiento de IA.")) return;
    
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/clients/me/payment-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.backendToken}`,
        },
        body: JSON.stringify({
          ycloud_api_key: "",
          ycloud_webhook_secret: "",
        }),
      });
      if (!res.ok) throw new Error("Failed to disconnect configuration");
      setMsg({ type: "ok", text: "YCloud desconectado exitosamente." });
      setYcloudKey("");
      setYcloudWebhookSecret("");
      fetchConfig();
    } catch (e: any) {
      setMsg({ type: "err", text: e.message || "Error al desconectar" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  function copyToClip(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isConnected = !!config?.ycloud_api_key;

  return (
    <div className="max-w-5xl mx-auto pb-28 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">WhatsApp Setter Config <span className="px-3 py-1 rounded-full bg-neon-green/20 text-neon-green text-xs font-bold uppercase tracking-widest border border-neon-green/30">Alpha</span></h1>
          <p className="text-gray-400">Integra tu propio número de WhatsApp o usa la API Oficial para automatizar respuestas.</p>
        </div>
        
        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-semibold text-sm ${
          isConnected
            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
            : "bg-white/5 border-dark-card-border text-gray-400"
        }`}>
          {isConnected ? <><CheckCircle2 size={18} /> Conectado</> : <><AlertCircle size={18} /> Desconectado</>}
        </div>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border text-sm ${
          msg.type === "err"
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-neon-green/10 border-neon-green/30 text-neon-green"
        }`}>
          {msg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
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

      {/* TAB: CONEXIÓN */}
      {activeTab === "conexion" && (
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Plug size={22} className="text-neon-purple" />
            <h2 className="text-xl font-bold text-white">Conexión con YCloud</h2>
          </div>
          
          {!isConnected ? (
            <div className="space-y-6">
              <div className="text-sm text-gray-400 mb-6">
                Conecta tu proveedor de WhatsApp Oficial (YCloud) para procesar leads.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/20 border border-dark-card-border rounded-2xl overflow-hidden hover:border-green-500/50 transition-all group">
                  <div className="h-40 relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-b border-dark-card-border flex items-center justify-center">
                     <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                       <MessageCircle size={32} className="text-green-400" />
                     </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">WhatsApp API Oficial</h3>
                    <p className="text-sm text-gray-400 mb-6 h-16">
                      Integración con la API Oficial de WhatsApp (YCloud). Diseñado para alta disponibilidad, múltiples agentes y escalabilidad sin riesgo de baneo.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-white text-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-200 w-auto inline-flex items-center gap-2"
                    >
                      Conectar YCloud <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-black/20 border border-green-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 z-10">
                  <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">YCloud Conectado</h2>
                    <p className="text-gray-400 text-sm">El motor IA tiene acceso a la API de YCloud en modo producción.</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="z-10 px-4 py-2 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  Desconectar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/20 border border-dark-card-border rounded-2xl p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <ExternalLink size={18} className="text-neon-purple" />
                    Webhook Endpoint
                  </h3>
                  <div className="text-sm text-gray-400 mb-6 space-y-2">
                    <p>Crea 1 solo webhook en YCloud pegando esta URL en "Endpoint URL".</p>
                    <p>Marca <strong>únicamente</strong> el evento: <code className="text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded break-all">whatsapp.inbound_message.received</code></p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Master Webhook (Chat + Conversiones)
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={masterWebhookUrl}
                          className="flex-1 min-w-0 bg-white/[0.02] border border-white/[0.06] rounded-l-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                        />
                        <button
                          onClick={() => copyToClip(masterWebhookUrl)}
                          className="bg-white/[0.05] border border-l-0 border-white/[0.06] rounded-r-lg px-3 hover:bg-white/[0.1] transition-colors"
                        >
                          <Copy size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 border border-dark-card-border rounded-2xl p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Lock className="text-neon-pink" />
                    Secreto del Webhook
                  </h3>
                  <div className="text-sm text-gray-400 mb-6 space-y-2">
                    <p>YCloud te proporcionará un <strong>Webhook Secret</strong> al crear el webhook. Pégalo aquí para asegurar tus peticiones.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          YCloud Webhook Secret
                        </label>
                        {config?.ycloud_webhook_secret && !isEditingSecret && (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/20">
                            Configurada
                          </span>
                        )}
                      </div>
                      
                      {config?.ycloud_webhook_secret && !isEditingSecret ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            readOnly
                            value="••••••••••••••••••••••••••••••••"
                            className="flex-1 min-w-0 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-500 font-mono outline-none"
                          />
                          <button
                            onClick={() => {
                              setIsEditingSecret(true);
                              setYcloudWebhookSecret("");
                            }}
                            className="w-full sm:w-auto whitespace-nowrap bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-white/[0.06]"
                          >
                            Cambiar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={ycloudWebhookSecret}
                            onChange={(e) => setYcloudWebhookSecret(e.target.value)}
                            placeholder="Pega el Webhook Secret aquí..."
                            className="flex-1 min-w-0 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none focus:border-neon-pink/50 transition-colors"
                          />
                          <button
                            onClick={async () => {
                              await handleSave();
                              setIsEditingSecret(false);
                            }}
                            disabled={saving}
                            className="w-full sm:w-auto whitespace-nowrap bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                          >
                            {saving ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPORTAMIENTO */}
      {activeTab === "comportamiento" && (
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="bg-[#111520] border border-dark-card-border rounded-[2rem] p-6 lg:p-10 mb-8 shadow-xl">
            <h2 className="text-xl font-bold text-white">Comportamiento del Setter</h2>
            <p className="text-sm text-gray-400 mt-2 mb-8">Ajusta cómo la Inteligencia Artificial interactúa en WhatsApp.</p>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1A1F2B] p-6 rounded-2xl border border-white/5 mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Velocidad de Respuesta (Retraso Humano)</label>
                <p className="text-sm text-gray-400 mb-6">Configura el tiempo que tarda el setter virtual en enviar el mensaje. La simulación humana añade pausas para que parezca que alguien está escribiendo.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={waDelayMode}
                    onChange={(e) => setWaDelayMode(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all"
                  >
                    <option value="human">Simulación Humana (4 a 15 segundos)</option>
                    <option value="medium">Media (2 a 8 segundos)</option>
                    <option value="fast">Rápida (1 a 4 segundos)</option>
                    <option value="instant">Instantánea (Sin retraso)</option>
                  </select>
                  
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 w-full bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 px-6 py-3 rounded-xl font-medium text-sm transition-colors border border-white/[0.06]"
                  >
                    {saving ? "Guardando..." : "Guardar Velocidad"}
                  </button>
                </div>
              </div>

              <div className="bg-[#1A1F2B] p-6 rounded-2xl border border-white/5 mb-8">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Link2 size={18} className="text-neon-pink" />
                  Transferencia de Leads
                </h3>
                <p className="text-sm text-gray-400 mb-6">Ingresa el número real (con código de país, sin el '+'). A este número se transferirán los leads si se requiere atención humana.</p>

                <div>
                  <input
                    type="text"
                    value={handoffNumber}
                    onChange={(e) => setHandoffNumber(e.target.value)}
                    placeholder="Ej. 5215555555555"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-pink/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 w-full bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 px-6 py-3 rounded-xl font-medium text-sm transition-colors border border-white/[0.06]"
                  >
                    {saving ? "Guardando..." : "Guardar Número"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HORARIOS */}
      {activeTab === "horarios" && (
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dark-card-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={22} className="text-neon-purple" />
                <h2 className="text-xl font-bold text-white">Horario Comercial (Anti-Ban)</h2>
              </div>
              <p className="text-sm text-gray-400">
                Configura cuándo el asistente IA debe guardar silencio. Las reglas seguirán capturando leads 24/7.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.05]">
              <span className="text-sm font-medium text-gray-300">Activar Horario</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={bHoursEnabled}
                  onChange={(e) => setBHoursEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
              </label>
            </div>
          </div>

          {bHoursEnabled ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Timezone */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Zona Horaria
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full sm:w-1/2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all"
                >
                  <option value="America/Lima">America/Lima (Perú, Colombia)</option>
                  <option value="America/Mexico_City">America/Mexico_City</option>
                  <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
                  <option value="America/Santiago">America/Santiago (Chile)</option>
                  <option value="America/Bogota">America/Bogota</option>
                  <option value="America/Caracas">America/Caracas</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/Madrid">Europe/Madrid (España)</option>
                </select>
              </div>

              {/* Matrix */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Días de Atención
                </label>
                <div className="grid gap-3">
                  {[
                    { id: 'monday', label: 'Lunes' },
                    { id: 'tuesday', label: 'Martes' },
                    { id: 'wednesday', label: 'Miércoles' },
                    { id: 'thursday', label: 'Jueves' },
                    { id: 'friday', label: 'Viernes' },
                    { id: 'saturday', label: 'Sábado' },
                    { id: 'sunday', label: 'Domingo' }
                  ].map(day => (
                    <div key={day.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                      <div className="w-32 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={schedule[day.id as keyof typeof schedule]?.enabled || false}
                          onChange={(e) => setSchedule(prev => ({ ...prev, [day.id]: { ...prev[day.id as keyof typeof prev], enabled: e.target.checked } }))}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-neon-purple focus:ring-neon-purple focus:ring-offset-gray-900"
                        />
                        <span className="text-sm text-gray-300 font-medium">{day.label}</span>
                      </div>
                      {schedule[day.id as keyof typeof schedule]?.enabled ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule[day.id as keyof typeof schedule]?.start || "09:00"}
                            onChange={(e) => setSchedule(prev => ({ ...prev, [day.id]: { ...prev[day.id as keyof typeof prev], start: e.target.value } }))}
                            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-neon-purple/50"
                          />
                          <span className="text-gray-500 text-sm">a</span>
                          <input
                            type="time"
                            value={schedule[day.id as keyof typeof schedule]?.end || "18:00"}
                            onChange={(e) => setSchedule(prev => ({ ...prev, [day.id]: { ...prev[day.id as keyof typeof prev], end: e.target.value } }))}
                            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-neon-purple/50"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium px-3 py-1.5 bg-gray-800/50 rounded-lg">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Out of hours message */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Mensaje de Ausencia
                </label>
                <textarea
                  value={bHoursMsg}
                  onChange={(e) => setBHoursMsg(e.target.value)}
                  rows={3}
                  placeholder="Mensaje que se enviará cuando el lead complete las preguntas fuera de horario..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Este mensaje solo se enviará una vez por día a cada lead que interactúe fuera de horario.
                </p>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-neon-purple hover:bg-neon-purple/80 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Skeleton className="w-5 h-5 rounded-full" /> : <Save size={16} />}
                  Guardar Horarios
                </button>
              </div>
            </div>
          ) : (
             <div className="bg-[#1A1F2B] p-8 text-center rounded-2xl border border-white/5">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10"><Clock className="text-gray-400" size={32} /></div>
               <h3 className="text-lg font-bold text-white mb-2">Horario 24/7 Activo</h3>
               <p className="text-sm max-w-md mx-auto">El horario comercial está desactivado. El setter virtual responderá las 24 horas del día, los 7 días de la semana.</p>
            </div>
          )}
        </div>
      )}

      {/* Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Conectar YCloud</h2>
            <div className="text-sm text-gray-400 mb-6 space-y-2">
              <p>Para obtener tu API Key en YCloud:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Inicia sesión en YCloud.</li>
                <li>Ve al menú izquierdo y haz clic en <strong>Developers &gt; API Key</strong>.</li>
                <li>Genera o copia tu clave secreta y pégala aquí.</li>
              </ol>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YCloud API Key
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={ycloudKey}
                    onChange={(e) => setYcloudKey(e.target.value)}
                    placeholder="363f84..."
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                  >
                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !ycloudKey}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {saving ? <Skeleton className="h-5 w-5 rounded-full" /> : <Save size={16} />}
                Conectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
