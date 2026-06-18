"use client";

import { useSession } from "next-auth/react";

export default function ClientDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Panel Principal</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Revisa el rendimiento de tus campañas automatizadas.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
        <div className="glass-card">
          <p className="text-muted">CPA Promedio</p>
          <h2 className="heading-lg" style={{ color: "var(--success-color)" }}>$12.45</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Conversiones (Mes)</p>
          <h2 className="heading-lg">1,245</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Gasto (Mes)</p>
          <h2 className="heading-lg">$15,490</h2>
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
