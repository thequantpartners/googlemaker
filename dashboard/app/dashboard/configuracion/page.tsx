"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User, Mail, CreditCard, AlertTriangle, Activity, Unplug, Send, Phone } from "lucide-react";

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const fetchProfile = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.whatsapp_phone) {
          setWhatsappPhone(data.whatsapp_phone);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect all your Google Ads accounts? You will need to sign in again to reconnect them.")) return;
    
    if (!session?.backendToken) return;
    setDisconnecting(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        setMsg({ text: "Google Ads accounts disconnected successfully.", type: "success" });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMsg({ text: "Error disconnecting accounts.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Network connection error.", type: "error" });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!session?.backendToken) return;
    setSavingWhatsapp(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ whatsapp_phone: whatsappPhone })
      });
      if (res.ok) {
        setMsg({ text: "WhatsApp number saved successfully.", type: "success" });
        fetchProfile();
      } else {
        setMsg({ text: "Error saving WhatsApp number.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Network connection error.", type: "error" });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Activity className="animate-spin text-neon-purple mb-4" size={32} />
        <p className="text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 text-lg">
          Manage your personal profile and account connections.
        </p>
      </div>

      {msg.text && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
          msg.type === "error" 
            ? "bg-red-500/10 border-red-500/30 text-red-500" 
            : "bg-neon-green/10 border-neon-green/30 text-neon-green"
        }`}>
          <AlertTriangle size={20} /> {msg.text}
        </div>
      )}

      {/* PERFIL */}
      <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 mb-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-card-border pb-4">
          <User className="text-neon-purple" size={24} /> User Profile
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <User size={16} /> Name
            </label>
            <input 
              type="text" 
              value={profile?.name || session?.user?.name || ""} 
              disabled 
              className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <Mail size={16} /> Email Address
            </label>
            <input 
              type="email" 
              value={profile?.email || session?.user?.email || ""} 
              disabled 
              className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <CreditCard size={16} /> Current Plan
            </label>
            <input 
              type="text" 
              value={(profile?.tier || "none").toUpperCase()} 
              disabled 
              className="w-full bg-neon-purple/5 border border-neon-purple/20 rounded-xl px-4 py-3 text-neon-purple font-bold focus:outline-none cursor-not-allowed uppercase"
            />
          </div>
        </div>
      </div>

      {/* CONEXIONES */}
      <div className="bg-dark-card backdrop-blur-xl border border-red-500/30 rounded-[2rem] p-6 md:p-8">
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2 border-b border-red-500/10 pb-4">
          <Unplug size={24} /> Active Connections
        </h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          If you are experiencing sync issues or wish to use a different Google account, you can disconnect your current credentials. Access will be revoked, and you can reconnect from the main Dashboard.
        </p>
        <button 
          onClick={handleDisconnect} 
          disabled={disconnecting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 hover:border-red-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Unplug size={18} />
          {disconnecting ? "Disconnecting..." : "Disconnect Google Ads"}
        </button>
      </div>

      {/* WHATSAPP PERSONAL (MASTER SETTER) */}
      <div className="bg-dark-card backdrop-blur-xl border border-neon-green/30 rounded-[2rem] p-6 md:p-8 mt-8">
        <h2 className="text-xl font-bold text-neon-green mb-4 flex items-center gap-2 border-b border-neon-green/10 pb-4">
          <Phone size={24} /> Alertas por WhatsApp (Master Setter)
        </h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          Ingresa tu número de WhatsApp personal con código de país (ej. +51999888777). El Master Setter de la agencia te enviará notificaciones instantáneas aquí cuando consigas un nuevo lead o agendes una cita.
        </p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            type="text"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="+51999888777"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green w-full"
          />
          <button 
            onClick={handleSaveWhatsapp} 
            disabled={savingWhatsapp || !whatsappPhone}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-neon-green/20 hover:bg-neon-green text-neon-green hover:text-[#0B0E14] border border-neon-green/50 hover:border-neon-green rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {savingWhatsapp ? "Guardando..." : "Guardar Número"}
          </button>
        </div>
      </div>
    </div>
  );
}
