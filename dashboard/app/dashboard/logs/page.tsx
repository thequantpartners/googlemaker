"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Activity, Check, X, Clock, AlertCircle } from "lucide-react";

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
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Historial de Decisiones</h1>
        <p className="text-gray-400">
          Registro de todas las acciones tomadas por la IA sobre tus campañas.
        </p>
      </div>

      <div className="bg-dark-card border border-dark-card-border rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-dark-card-border bg-black/20 text-gray-400 text-sm uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Campaña</th>
                <th className="px-6 py-4">Acción</th>
                <th className="px-6 py-4">Motivo</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-card-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Activity className="animate-spin mx-auto mb-4" size={24} />
                    Cargando historial de decisiones...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Clock className="mx-auto mb-4 opacity-50" size={32} />
                    No hay decisiones recientes registradas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-gray-300 font-medium">{new Date(log.executed_at).toLocaleString()}</div>
                      {log.is_dry_run && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Simulación
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{log.campaign_name || "Desconocida"}</div>
                      <div className="text-gray-500 text-xs mt-1">ID: {log.campaign_id || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-neon-purple/10 text-neon-purple border border-neon-purple/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 max-w-xs leading-relaxed">
                        {log.reason || "Sin detalles"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.status === "auto_applied" && (
                        <span className="flex items-center gap-1.5 text-neon-green text-sm font-medium">
                          <Check size={16} /> Auto-Ejecutado
                        </span>
                      )}
                      {log.status === "approved" && (
                        <span className="flex items-center gap-1.5 text-neon-blue text-sm font-medium">
                          <Check size={16} /> Aprobado por ti
                        </span>
                      )}
                      {log.status === "rejected" && (
                        <span className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                          <X size={16} /> Rechazado
                        </span>
                      )}
                      {log.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAction(log.id, "approve")}
                            disabled={actionLoading === log.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <Check size={14} /> Aprobar
                          </button>
                          <button 
                            onClick={() => handleAction(log.id, "reject")}
                            disabled={actionLoading === log.id}
                            className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/5 text-gray-400 border border-dark-card-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <X size={14} /> Rechazar
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
    </div>
  );
}
