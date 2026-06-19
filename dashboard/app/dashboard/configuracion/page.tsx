"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User, Mail, CreditCard, AlertTriangle, Activity, Unplug } from "lucide-react";

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const fetchProfile = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
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
    if (!confirm("¿Estás seguro de que deseas desconectar todas tus cuentas de Google Ads? Tendrás que volver a iniciar sesión en Google para reconectarlas.")) return;
    
    if (!session?.backendToken) return;
    setDisconnecting(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        setMsg({ text: "Cuentas de Google Ads desconectadas exitosamente.", type: "success" });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMsg({ text: "Error al desconectar las cuentas.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Error de conexión.", type: "error" });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Activity className="animate-spin text-neon-purple mb-4" size={32} />
        <p className="text-gray-400">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
        <p className="text-gray-400 text-lg">
          Administra tu perfil personal y las conexiones de tu cuenta.
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
          <User className="text-neon-purple" size={24} /> Perfil del Usuario
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <User size={16} /> Nombre
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
              <Mail size={16} /> Correo Electrónico
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
              <CreditCard size={16} /> Plan Actual
            </label>
            <input 
              type="text" 
              value={(profile?.tier || "ninguno").toUpperCase()} 
              disabled 
              className="w-full bg-neon-purple/5 border border-neon-purple/20 rounded-xl px-4 py-3 text-neon-purple font-bold focus:outline-none cursor-not-allowed uppercase"
            />
          </div>
        </div>
      </div>

      {/* CONEXIONES */}
      <div className="bg-dark-card backdrop-blur-xl border border-red-500/30 rounded-[2rem] p-6 md:p-8">
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2 border-b border-red-500/10 pb-4">
          <Unplug size={24} /> Conexiones Activas
        </h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          Si tienes problemas de sincronización o quieres usar una cuenta de Google diferente, puedes desconectar tus credenciales actuales. Se revocarán los accesos y podrás volver a conectar desde el Panel Principal.
        </p>
        <button 
          onClick={handleDisconnect} 
          disabled={disconnecting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 hover:border-red-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Unplug size={18} />
          {disconnecting ? "Desconectando..." : "Desconectar Google Ads"}
        </button>
      </div>
    </div>
  );
}
