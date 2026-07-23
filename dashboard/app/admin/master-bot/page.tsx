"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle2, Phone, Brain, Loader2 } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function MasterBotPage() {
  const [baileysUrl] = useState("https://qss-baileys-server-production.up.railway.app");
  const [baileysStatus, setBaileysStatus] = useState("disconnected");
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Prompt State
  const { data: session } = useSession();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    async function fetchPrompt() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/chat-widget`, {
          headers: { Authorization: `Bearer ${session.backendToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSystemPrompt(data.system_prompt || "");
        }
      } catch (e) {
        console.error("Failed to fetch widget data", e);
      } finally {
        setIsLoadingPrompt(false);
      }
    }
    fetchPrompt();
  }, [session]);

  useEffect(() => {
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
    if (baileysUrl && isPolling) {
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
  }, [baileysUrl, isPolling]);

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
    if (!confirm("¿Seguro que deseas eliminar la conexión del Master Bot?")) return;
    try {
      await fetch(`${baileysUrl}/api/disconnect`, { method: "POST" }).catch(() => {});
      setBaileysStatus("disconnected");
      setBaileysQr(null);
      setMsg({ type: "ok", text: "Conexión del Master Bot eliminada." });
      setTimeout(() => setMsg(null), 5000);
    } catch (e) {
      console.error(e);
      setBaileysStatus("disconnected");
    }
  }

  const handleSavePrompt = async () => {
    if (!session?.backendToken) return;
    setIsSavingPrompt(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/chat-widget`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.backendToken}`
        },
        body: JSON.stringify({ 
          system_prompt: systemPrompt || null
        })
      });
      
      if (res.ok) {
        setMsg({ type: "ok", text: "Prompt del Autopiloto de Ads actualizado correctamente." });
      } else {
        setMsg({ type: "err", text: "Error al guardar el prompt." });
      }
    } catch (e) {
      console.error(e);
      setMsg({ type: "err", text: "Error de red al guardar el prompt." });
    } finally {
      setIsSavingPrompt(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Phone className="text-orange-500" size={32} />
          QSS Master Bot (WhatsApp Autopilot Central)
        </h1>
        <p className="text-gray-400 text-lg">
          Servidor centralizado 24/7 para notificaciones y ejecución de comandos de Ads por WhatsApp.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${msg.type === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {msg.type === "ok" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      {/* Connection Section */}
      <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-8 flex flex-col items-center">
        {baileysStatus === "disconnected" && (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Master Bot Desconectado</h2>
            <p className="text-gray-400 text-sm mb-8">
              Genera un código QR para enlazar el número central del QSS Autopilot.
            </p>
            <button
              onClick={handleConnectBaileys}
              className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              Generar QR de WhatsApp
            </button>
          </div>
        )}

        {(baileysStatus === "connecting" || (baileysStatus === "qr_ready" && !baileysQr)) && (
          <div className="flex flex-col items-center py-12">
            <Skeleton className="w-64 h-64 rounded-2xl mb-6" />
            <p className="text-orange-400 font-medium animate-pulse">Solicitando QR al servidor de Baileys...</p>
          </div>
        )}

        {baileysStatus === "qr_ready" && baileysQr && (
          <div className="flex flex-col items-center py-8">
            <h2 className="text-xl font-bold text-white mb-6">Escanea el Código QR</h2>
            <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-white/5 mb-6 border-4 border-white/10">
              <QRCodeSVG value={baileysQr} size={256} />
            </div>
            <p className="text-sm text-gray-400">Escanea desde WhatsApp &gt; Dispositivos vinculados en tu teléfono.</p>
          </div>
        )}

        {baileysStatus === "connected" && (
          <div className="text-center w-full max-w-md">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Master Bot Conectado 24/7</h2>
            <p className="text-gray-400 text-sm mb-6">
              El motor de WhatsApp está listo para recibir comandos de tus clientes a cualquier hora (10 PM, 2 AM) sin depender de una PC.
            </p>
            <button
              onClick={handleDisconnectBaileys}
              className="px-6 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-colors text-sm"
            >
              Desconectar Master Bot
            </button>
          </div>
        )}
      </div>

      {/* Autopilot System Prompt Section */}
      <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="text-orange-500" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white">Instrucciones del Autopiloto de Ads (System Prompt)</h2>
            <p className="text-gray-400 text-sm">Define el comportamiento y las reglas de análisis de métricas (CTR, CPA, presupuestos) para la IA.</p>
          </div>
        </div>

        {isLoadingPrompt ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-4">
            <textarea
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Ejemplo: Eres el Director de Ads de QSS. Cuando el usuario te pida revisar el CTR, consulta sus campañas de TikTok y Google Ads. Si un anuncio tiene CTR menor a 0.8%, recomiéndale pausarlo..."
              className="w-full bg-[#12161f] border border-gray-800 text-white rounded-xl p-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-sm leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSavePrompt}
                disabled={isSavingPrompt}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isSavingPrompt && <Loader2 size={16} className="animate-spin" />}
                Guardar Prompt de Autopiloto
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
