"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsConfigured(data.is_configured);
        } else {
          setIsConfigured(false);
        }
      } catch (err) {
        console.error("Failed to fetch credential status", err);
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [session]);

  const handleConnect = () => {
    if (!session?.backendToken) return;
    // Redirect to backend OAuth login which redirects to Google
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google-ads/login?token=${session.backendToken}`;
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Cargando panel...</div>;
  }

  // --- ONBOARDING STATE ---
  if (!isConfigured) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <h1 className="heading-lg" style={{ marginBottom: "16px" }}>¡Bienvenido a GoogleMaker!</h1>
        <p className="text-muted" style={{ marginBottom: "32px", fontSize: "1.1rem" }}>
          Para comenzar a optimizar tus campañas y ver resultados mágicos, necesitamos conectar tu cuenta de Google Ads de forma segura.
        </p>

        {searchParams.get("connected") === "success" && (
          <div style={{ padding: "16px", background: "rgba(0, 200, 83, 0.1)", border: "1px solid var(--success-color)", color: "var(--success-color)", borderRadius: "8px", marginBottom: "32px" }}>
            Conexión exitosa. Estamos sincronizando tus datos...
          </div>
        )}

        <div className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <div style={{ width: "64px", height: "64px", background: "var(--primary-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
            🔗
          </div>
          <h2 className="heading-md">Paso 1: Conecta tu cuenta</h2>
          <p className="text-muted">
            Solo tomará un par de clics. Autoriza el acceso para que nuestro motor de IA analice tus campañas.
          </p>
          <button className="btn-primary" onClick={handleConnect} style={{ padding: "12px 32px", fontSize: "1.1rem" }}>
            Conectar con Google Ads
          </button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD STATE ---
  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Panel Principal</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Revisa el rendimiento de tus campañas automatizadas.
      </p>

      {searchParams.get("connected") === "success" && (
        <div style={{ padding: "16px", background: "rgba(0, 200, 83, 0.1)", border: "1px solid var(--success-color)", color: "var(--success-color)", borderRadius: "8px", marginBottom: "32px" }}>
          ¡Cuenta de Google Ads conectada con éxito!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
        <div className="glass-card">
          <p className="text-muted">CPA Promedio</p>
          <h2 className="heading-lg" style={{ color: "var(--success-color)" }}>Calculando...</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Conversiones (Mes)</p>
          <h2 className="heading-lg">--</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Gasto (Mes)</p>
          <h2 className="heading-lg">$ 0.00</h2>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "32px" }}>
        <h2 className="heading-md" style={{ marginBottom: "16px" }}>Estado de la Cuenta</h2>
        <div className="flex-center" style={{ gap: "12px", justifyContent: "flex-start" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--success-color)", boxShadow: "0 0 10px var(--success-color)" }}></div>
          <p>Conectado con Google Ads de forma segura.</p>
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Cargando panel...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
