"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface LogOut {
  id: string;
  action: string;
  campaign_id?: string;
  campaign_name?: string;
  reason?: string;
  details?: Record<string, any>;
  is_dry_run: boolean;
  executed_at: string;
}

export default function ClientLogs() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LogOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/logs`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [session]);

  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Historial de Decisiones</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Registro de todas las acciones tomadas por la IA sobre tus campañas.
      </p>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Fecha</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Campaña</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Acción</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: "32px", textAlign: "center" }} className="text-muted">
                  Cargando...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "32px", textAlign: "center" }} className="text-muted">
                  No hay decisiones recientes registradas.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "16px 24px", color: "var(--text-secondary)" }}>
                    {new Date(log.executed_at).toLocaleString()}
                    {log.is_dry_run && (
                      <span className="badge badge-warning" style={{ marginLeft: "8px" }}>Simulación</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {log.campaign_name || log.campaign_id || "N/A"}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span className="badge badge-active">{log.action}</span>
                  </td>
                  <td style={{ padding: "16px 24px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    {log.reason || "Sin detalles"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
