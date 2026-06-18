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
  status: string;
  executed_at: string;
}

export default function ClientLogs() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LogOut[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchLogs();
  }, [session]);

  const handleAction = async (logId: string, action: "approve" | "reject") => {
    if (!session?.backendToken) return;
    setActionLoading(logId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/logs/${logId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        await fetchLogs(); // refresh the list
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al procesar la acción.");
    } finally {
      setActionLoading(null);
    }
  };

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
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px", textAlign: "center" }} className="text-muted">
                  Cargando...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px", textAlign: "center" }} className="text-muted">
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
                  <td style={{ padding: "16px 24px" }}>
                    {log.status === "auto_applied" && (
                      <span style={{ color: "var(--success-color)", fontSize: "0.9rem" }}>✅ Ejecutado Automáticamente</span>
                    )}
                    {log.status === "approved" && (
                      <span style={{ color: "var(--primary-light)", fontSize: "0.9rem" }}>✅ Aprobado por ti</span>
                    )}
                    {log.status === "rejected" && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>❌ Ignorado</span>
                    )}
                    {log.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          onClick={() => handleAction(log.id, "approve")}
                          disabled={actionLoading === log.id}
                          style={{ padding: "6px 12px", background: "var(--success-color)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", opacity: actionLoading === log.id ? 0.5 : 1 }}
                        >
                          {actionLoading === log.id ? "Procesando..." : "✅ Aprobar"}
                        </button>
                        <button 
                          onClick={() => handleAction(log.id, "reject")}
                          disabled={actionLoading === log.id}
                          style={{ padding: "6px 12px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", opacity: actionLoading === log.id ? 0.5 : 1 }}
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    )}
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
