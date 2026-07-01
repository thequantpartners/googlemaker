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

  const webhookBaseUrl = API?.replace("/api", "") ?? "";
  const conversionWebhookUrl = `${webhookBaseUrl}/api/webhooks/ycloud/conversion${config?.user_id ? `?client_id=${config.user_id}` : ""}`;
  const chatWebhookUrl = `${webhookBaseUrl}/api/webhooks/ycloud/chat${config?.user_id ? `?client_id=${config.user_id}` : ""}`;

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
          ycloud_api_key: ycloudKey || null,
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

  function handleDisconnect() {
    if (!confirm("¿Estás seguro de desconectar YCloud? Se perderá el enrutamiento de IA.")) return;
    setYcloudKey("");
    handleSave();
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <ExternalLink size={18} className="text-neon-purple" />
                Endpoints de Webhook
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Configura estos URLs como endpoints de tus webhooks en YCloud.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Webhook de Conversión (Upsert)
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={conversionWebhookUrl}
                      className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-l-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                    />
                    <button
                      onClick={() => copyToClip(conversionWebhookUrl)}
                      className="bg-white/[0.05] border border-l-0 border-white/[0.06] rounded-r-lg px-3 hover:bg-white/[0.1] transition-colors"
                    >
                      <Copy size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Webhook de Chat (LLM Brain)
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={chatWebhookUrl}
                      className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-l-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                    />
                    <button
                      onClick={() => copyToClip(chatWebhookUrl)}
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
                Secreto de Autenticación
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Agrega este Header en todos tus bloques de "External Request" para autenticar las peticiones hacia QSS.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Header Name
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value="x-ycloud-secret"
                      className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-l-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                    />
                    <button
                      onClick={() => copyToClip("x-ycloud-secret")}
                      className="bg-white/[0.05] border border-l-0 border-white/[0.06] rounded-r-lg px-3 hover:bg-white/[0.1] transition-colors"
                    >
                      <Copy size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Header Value
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={config?.generic_webhook_secret || ""}
                      className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-l-lg px-3 py-2 text-sm text-gray-300 font-mono outline-none"
                    />
                    <button
                      onClick={() => copyToClip(config?.generic_webhook_secret || "")}
                      className="bg-white/[0.05] border border-l-0 border-white/[0.06] rounded-r-lg px-3 hover:bg-white/[0.1] transition-colors"
                    >
                      <Copy size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <p className="text-sm text-gray-400 mb-6">
              Ingresa el API Key de YCloud (obtenlo en Developers {">"} API Key).
            </p>

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
