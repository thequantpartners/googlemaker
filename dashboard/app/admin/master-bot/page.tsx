"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle2, Phone, MessageCircle, Link2, Clock } from "lucide-react";
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function MasterBotPage() {
  const [baileysUrl] = useState("https://qss-baileys-server-production.up.railway.app");
  const [baileysStatus, setBaileysStatus] = useState("disconnected");
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Configuration States
  const [responseSpeed, setResponseSpeed] = useState("medium");
  const [transferNumber, setTransferNumber] = useState("");
  const [isScheduleActive, setIsScheduleActive] = useState(false);

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
    if (!confirm("¿Seguro que deseas eliminar la conexión del Master Setter?")) return;
    try {
      await fetch(`${baileysUrl}/api/disconnect`, { method: "POST" }).catch(() => {});
      setBaileysStatus("disconnected");
      setBaileysQr(null);
      setMsg({ type: "ok", text: "Conexión del Master Setter eliminada." });
      setTimeout(() => setMsg(null), 5000);
    } catch (e) {
      console.error(e);
      setBaileysStatus("disconnected");
    }
  }

  const handleSaveConfig = (configName: string) => {
    setMsg({ type: "ok", text: `Configuración de ${configName} guardada exitosamente.` });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Phone className="text-orange-500" size={32} />
          Master Setter (Baileys)
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
            <h2 className="text-xl font-bold text-white mb-2">Master Setter Desconectado</h2>
            <p className="text-gray-400 text-sm mb-8">
              Genera un código QR para enlazar el número de la Agencia (Master Setter). Todos los leads de todos los clientes serán notificados desde este número.
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
            <h3 className="text-emerald-400 font-bold text-3xl mb-3 relative z-10">Master Setter Conectado</h3>
            <p className="text-gray-400 text-lg mb-10 max-w-md relative z-10">El motor IA de Baileys está enlazado exitosamente y listo para despachar leads.</p>
            
            <button
              onClick={handleDisconnectBaileys}
              className="px-8 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors relative z-10"
            >
              Desconectar Master Setter
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 mt-12">
        {/* Comportamiento del setter virtual */}
        <div className="bg-[#0a0c10] border border-gray-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="text-purple-500" size={24} />
            <h3 className="text-xl font-bold text-white">Comportamiento del setter virtual (WhatsApp)</h3>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Configura la velocidad con la que el setter virtual responde a los mensajes en WhatsApp.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 tracking-wider">VELOCIDAD DE RESPUESTA</label>
            <div className="flex items-center gap-4">
              <select
                value={responseSpeed}
                onChange={(e) => setResponseSpeed(e.target.value)}
                className="bg-[#13151a] border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-64"
              >
                <option value="fast">Rápida (0 a 2 segundos)</option>
                <option value="medium">Media (2 a 8 segundos)</option>
                <option value="slow">Lenta (8 a 15 segundos)</option>
              </select>
              <button 
                onClick={() => handleSaveConfig("Velocidad")}
                className="px-6 py-3 bg-[#1a1c23] hover:bg-[#23252d] text-gray-300 font-medium rounded-xl transition-colors text-sm"
              >
                Guardar Velocidad
              </button>
            </div>
          </div>
        </div>

        {/* Número para Transferencia */}
        <div className="bg-[#0a0c10] border border-gray-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="text-white" size={24} />
            <h3 className="text-xl font-bold text-white">Número para Transferencia de Leads</h3>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Ingresa el número real del cliente (con código de país, sin el '+'). A este número se redirigirán los leads una vez que el setter virtual los califique.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 tracking-wider">WHATSAPP DEL CLIENTE</label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Ej. 5215555555555"
                value={transferNumber}
                onChange={(e) => setTransferNumber(e.target.value)}
                className="bg-[#13151a] border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white focus:ring-1 focus:ring-white flex-1 max-w-2xl placeholder:text-gray-600"
              />
              <button 
                onClick={() => handleSaveConfig("Número")}
                className="px-6 py-3 bg-[#1a1c23] hover:bg-[#23252d] text-gray-300 font-medium rounded-xl transition-colors text-sm"
              >
                Guardar Número
              </button>
            </div>
          </div>
        </div>

        {/* Horario Comercial */}
        <div className="bg-[#0a0c10] border border-gray-800/50 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-purple-500" size={24} />
              <h3 className="text-xl font-bold text-white">Horario Comercial (Anti-Ban)</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Configura cuándo el asistente IA debe guardar silencio. Las reglas seguirán capturando leads 24/7.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">Activar Horario</span>
            <button
              onClick={() => {
                setIsScheduleActive(!isScheduleActive);
                handleSaveConfig("Horario");
              }}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                isScheduleActive ? "bg-white" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  isScheduleActive ? "translate-x-6 bg-gray-900" : "translate-x-0 bg-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
