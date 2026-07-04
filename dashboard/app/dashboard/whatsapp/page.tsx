"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
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
  Lock
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
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 " +
  "focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all";

export default function WhatsAppPage() {
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

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

  // Baileys Modal State
  const [isBaileysModalOpen, setIsBaileysModalOpen] = useState(false);
  const [baileysUrl] = useState("https://qss-baileys-server-production.up.railway.app");
  const [baileysStatus, setBaileysStatus] = useState("disconnected");
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);



  const webhookBaseUrl = API?.replace("/api", "") ?? "";
  const masterWebhookUrl = `${webhookBaseUrl}/api/webhooks/ycloud/webhook${config?.user_id ? `?client_id=${config.user_id}` : ""}`;

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
          wa_business_hours_enabled: bHoursEnabled,
          wa_timezone: timezone,
          wa_business_hours: schedule,
          wa_bhours_message: bHoursMsg
        }),
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      setMsg({ type: "ok", text: "WhatsApp Sales System configurado exitosamente." });
      setIsModalOpen(false);
      fetchConfig(); // Reload to get updated state
    } catch (e: any) {
      setMsg({ type: "err", text: e.message || "Error saving configuration" });
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

  useEffect(() => {
    // URL is now hardcoded for simplicity
  }, []);

  useEffect(() => {
    // Check initial Baileys status
    async function checkBaileysStatus() {
      try {
        const res = await fetch(`${baileysUrl}/api/status`);
        if (res.ok) {
          const data = await res.json();
          setBaileysStatus(data.status);
        }
      } catch (e) {
        console.error("Failed to fetch initial Baileys status", e);
      }
    }
    if (baileysUrl) {
      checkBaileysStatus();
    }
  }, [baileysUrl]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBaileysModalOpen && baileysUrl && isPolling) {
        interval = setInterval(async () => {
            try {
                const res = await fetch(`${baileysUrl}/api/status`);
                if (res.ok) {
                    const data = await res.json();
                    setBaileysStatus(data.status);
                    setBaileysQr(data.qr);
                    if (data.status === 'connected') {
                        setIsPolling(false);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [isBaileysModalOpen, baileysUrl, isPolling]);



  async function handleConnectBaileys() {
    if (!baileysUrl) return;
    setBaileysStatus("connecting");
    setBaileysQr(null);
    setIsPolling(true);
    try {
        await fetch(`${baileysUrl}/api/connect`, { method: "POST" });
    } catch (e) {
        console.error("Error triggering connect", e);
    }
  }

  async function handleDisconnectBaileys() {
    if (!confirm("¿Seguro que deseas eliminar la conexión de Baileys?")) return;
    // Lógica para desconectar del servidor Baileys
    try {
      // Intentamos llamar a un endpoint de disconnect si existe, de lo contrario solo actualizamos estado local
      await fetch(`${baileysUrl}/api/disconnect`, { method: "POST" }).catch(() => {});
      setBaileysStatus("disconnected");
      setBaileysQr(null);
      setMsg({ type: "ok", text: "Conexión de Baileys eliminada." });
    } catch (e) {
      console.error(e);
      setBaileysStatus("disconnected");
    }
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="text-green-500" />
            WhatsApp Sales System
          </h1>
          <p className="text-gray-400 mt-1">
            Conecta tu cuenta de YCloud para habilitar el motor IA "Dumb Router" y capturar conversiones offline.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      {!isConnected ? (
        <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Phone size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Conecta tu WhatsApp</h2>
          <p className="text-gray-400 max-w-md mb-8">
            Vincula tu cuenta de YCloud para permitir que el cerebro LLM interactúe directamente con tus leads y sincronice conversiones en tiempo real.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Link2 size={18} />
            Conectar YCloud
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0a0c10] border border-green-500/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">YCloud Conectado</h2>
                <p className="text-gray-400 text-sm">El motor IA tiene acceso a la API de YCloud.</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="z-10 px-4 py-2 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/10 transition-colors"
            >
              Desconectar
            </button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex gap-4 z-10 relative">
              <div className="text-blue-400 mt-1">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">¿Cómo configuro el Chatbot de WhatsApp?</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  WhatsApp utiliza exactamente la misma configuración, reglas y proveedor de IA que tu <strong>Leads Widget</strong> web. No necesitas crear un bot por separado.
                </p>
                <a href="/dashboard/chat-widget" className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors flex items-center gap-1">
                  Ir a configurar el Leads Widget →
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6">
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

            <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6">
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
                        Cambiar clave
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

      {/* Experimental Baileys Section */}
      <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl p-6 relative overflow-hidden mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
        
        <div className="z-10 relative">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-orange-500" />
            Modo Experimental: Conexión vía Baileys
            {baileysStatus === "connected" && (
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/20 ml-2">
                  Conectado
                </span>
            )}
          </h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p className="text-orange-400 font-medium text-xs">⚠️ No recomendado para clientes finales.</p>
            <p>Usa tu propio servidor en Railway para vincular tu WhatsApp escaneando un código QR.</p>
          </div>
        </div>

        <div className="z-10 flex flex-col sm:flex-row gap-3">
          {baileysStatus === "connected" && (
            <button
              onClick={handleDisconnectBaileys}
              className="px-6 py-3 font-semibold rounded-xl transition-colors whitespace-nowrap border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              Eliminar Conexión
            </button>
          )}
          <button
            onClick={() => {
                setIsBaileysModalOpen(true);
                if (baileysStatus !== "connected") {
                  setBaileysStatus("disconnected");
                  setBaileysQr(null);
                }
            }}
            className={`px-6 py-3 font-semibold rounded-xl transition-colors whitespace-nowrap border ${
              baileysStatus === "connected" 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                : "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
            }`}
          >
            {baileysStatus === "connected" ? "Ver Estado" : "Conectar Baileys"}
          </button>
        </div>
      </div>

      {/* Bot Behavior Section */}
      <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6 mt-8">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <MessageCircle size={18} className="text-neon-purple" />
          Comportamiento del Bot (WhatsApp)
        </h3>
        <div className="text-sm text-gray-400 mb-6">
          <p>Configura la velocidad con la que el bot responde a los mensajes en WhatsApp.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Velocidad de Respuesta
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={waDelayMode}
                onChange={(e) => setWaDelayMode(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all"
              >
                <option value="human">Simulación Humana (4 a 15 segundos)</option>
                <option value="medium">Media (2 a 8 segundos)</option>
                <option value="fast">Rápida (1 a 4 segundos)</option>
                <option value="instant">Instantánea (Sin retraso)</option>
              </select>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="whitespace-nowrap bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 px-6 py-3 rounded-xl font-medium text-sm transition-colors border border-white/[0.06]"
              >
                {saving ? "Guardando..." : "Guardar Velocidad"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours Section */}
      <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2">
              <Phone size={18} className="text-neon-purple" />
              Horario Comercial (Anti-Ban)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
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

        {bHoursEnabled && (
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
                Guardar Horario Comercial
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* Baileys Connection Modal */}
      {isBaileysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <button
              onClick={() => { setIsBaileysModalOpen(false); setIsPolling(false); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 w-full">
              <AlertCircle className="text-orange-500" size={24} /> Conectar Baileys
            </h2>
            <p className="text-sm text-gray-400 mb-6 text-left w-full">
              Genera tu código QR para conectar tu número telefónico a QSS.
            </p>

            <div className="w-full space-y-4 mb-6">
              <div className="text-xs text-gray-500 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                <strong>Importante:</strong> Configura en tu Railway las variables <code>QSS_CLIENT_ID={config?.user_id}</code> y <code>QSS_WEBHOOK_SECRET={config?.generic_webhook_secret || '...'}</code> para que funcione.
              </div>
            </div>

            {baileysStatus === "disconnected" && (
              <button
                onClick={handleConnectBaileys}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Generar QR de WhatsApp
              </button>
            )}

            {(baileysStatus === "connecting" || (baileysStatus === "qr_ready" && !baileysQr)) && (
              <div className="flex flex-col items-center py-8">
                <Skeleton className="w-48 h-48 rounded-xl mb-4" />
                <p className="text-orange-400 text-sm animate-pulse">Solicitando QR al servidor...</p>
              </div>
            )}

            {baileysStatus === "qr_ready" && baileysQr && (
              <div className="flex flex-col items-center py-4">
                <div className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                   <QRCodeSVG value={baileysQr} size={200} />
                </div>
                <p className="text-gray-300 text-sm text-center">Abre WhatsApp en tu celular y escanea el código para vincular.</p>
              </div>
            )}

            {baileysStatus === "connected" && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-emerald-400 font-bold text-lg mb-1">¡Conectado!</h3>
                <p className="text-gray-400 text-sm">Tu WhatsApp está enlazado a QSS vía Baileys.</p>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
