"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function MasterBotPage() {
  const [baileysUrl] = useState("https://qss-baileys-server-production.up.railway.app");
  const [baileysStatus, setBaileysStatus] = useState("disconnected");
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Phone className="text-orange-500" size={32} />
          Master Bot (Baileys)
        </h1>
        <p className="text-gray-400 text-lg">
          Servidor centralizado para notificar Leads a los clientes directamente a sus números personales.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${msg.type === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {msg.type === "ok" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      <div className="bg-[#0a0c10] border border-dark-card-border rounded-2xl p-8 flex flex-col items-center">
        {baileysStatus === "disconnected" && (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Master Bot Desconectado</h2>
            <p className="text-gray-400 text-sm mb-8">
              Genera un código QR para enlazar el número de la Agencia (Master Bot). Todos los leads de todos los clientes serán notificados desde este número.
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
            <p className="text-gray-300 text-center max-w-sm">Abre WhatsApp en el celular de la Agencia, ve a "Dispositivos Vinculados" y escanea este código.</p>
          </div>
        )}

        {baileysStatus === "connected" && (
          <div className="flex flex-col items-center py-12 text-center w-full relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <h3 className="text-emerald-400 font-bold text-3xl mb-3 relative z-10">Master Bot Conectado</h3>
            <p className="text-gray-400 text-lg mb-10 max-w-md relative z-10">El motor IA de Baileys está enlazado exitosamente y listo para despachar leads.</p>
            
            <button
              onClick={handleDisconnectBaileys}
              className="px-8 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors relative z-10"
            >
              Desconectar Master Bot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
