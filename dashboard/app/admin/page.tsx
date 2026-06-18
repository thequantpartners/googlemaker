"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ total_clients: 0, active_campaigns: 0, total_decisions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [session]);

  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Resumen General</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Bienvenido al panel de administración de The Quant Partners.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
        <div className="glass-card">
          <p className="text-muted">Total Clientes</p>
          <h2 className="heading-lg">{loading ? "--" : stats.total_clients}</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Campañas Activas</p>
          <h2 className="heading-lg">{loading ? "--" : stats.active_campaigns}</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Decisiones Tomadas</p>
          <h2 className="heading-lg">{loading ? "--" : stats.total_decisions}</h2>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "32px" }}>
        <h2 className="heading-md" style={{ marginBottom: "16px" }}>Actividad Reciente</h2>
        <p className="text-muted">No hay actividad reciente en el orquestador.</p>
      </div>
    </div>
  );
}
