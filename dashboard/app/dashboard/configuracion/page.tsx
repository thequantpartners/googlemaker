"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
        // Give the user a moment to read the success message before reloading
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
      <div style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
        <p className="text-muted">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      <h1 className="heading-lg" style={{ marginBottom: "16px" }}>Configuración</h1>
      <p className="text-muted" style={{ marginBottom: "40px", fontSize: "1.1rem" }}>
        Administra tu perfil personal y las conexiones de tu cuenta.
      </p>

      {msg.text && (
        <div style={{ 
          background: msg.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", 
          color: msg.type === "error" ? "#ef4444" : "#10b981", 
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "24px", 
          border: `1px solid ${msg.type === "error" ? "#ef4444" : "#10b981"}` 
        }}>
          {msg.text}
        </div>
      )}

      {/* PERFIL */}
      <div className="glass-card" style={{ marginBottom: "24px" }}>
        <h2 className="heading-md" style={{ marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>Perfil del Usuario</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px" }}>Nombre</label>
            <input 
              type="text" 
              value={profile?.name || session?.user?.name || ""} 
              disabled 
              style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-color)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px" }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={profile?.email || session?.user?.email || ""} 
              disabled 
              style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-color)" }}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px" }}>Plan Actual</label>
            <input 
              type="text" 
              value={(profile?.tier || "ninguno").toUpperCase()} 
              disabled 
              style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--primary-color)", fontWeight: "bold" }}
            />
          </div>
        </div>
      </div>

      {/* CONEXIONES */}
      <div className="glass-card" style={{ border: "1px solid rgba(239, 68, 68, 0.3)" }}>
        <h2 className="heading-md" style={{ marginBottom: "16px", color: "#ef4444", borderBottom: "1px solid rgba(239, 68, 68, 0.1)", paddingBottom: "12px" }}>Conexiones Activas</h2>
        <p className="text-muted" style={{ marginBottom: "24px" }}>
          Si tienes problemas de sincronización o quieres usar una cuenta de Google diferente, puedes desconectar tus credenciales actuales. Se revocarán los accesos y podrás volver a conectar desde el Panel Principal.
        </p>
        <button 
          onClick={handleDisconnect} 
          disabled={disconnecting}
          style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "#ef4444", 
            border: "1px solid #ef4444", 
            padding: "10px 20px", 
            borderRadius: "8px", 
            cursor: disconnecting ? "not-allowed" : "pointer",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            if(!disconnecting) {
              e.currentTarget.style.background = "#ef4444";
              e.currentTarget.style.color = "white";
            }
          }}
          onMouseOut={(e) => {
            if(!disconnecting) {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "#ef4444";
            }
          }}
        >
          {disconnecting ? "Desconectando..." : "Desconectar Google Ads"}
        </button>
      </div>
    </div>
  );
}
