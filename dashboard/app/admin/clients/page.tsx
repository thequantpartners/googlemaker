"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Client {
  id: string;
  email: string;
  name: string;
  status: string;
  tier: string;
}

export default function AdminClients() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchClients = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [session]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      setErrorMsg("Todos los campos son obligatorios");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.backendToken}`,
        },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Error al crear cliente");
      } else {
        setIsModalOpen(false);
        setNewName("");
        setNewEmail("");
        fetchClients(); // Refresh list
      }
    } catch (err) {
      setErrorMsg("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTier = async (clientId: string, newTier: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/tier?tier=${newTier}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session?.backendToken}` },
      });
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (clientId: string, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session?.backendToken}` },
      });
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "32px" }}>
        <h1 className="heading-lg">Gestión de Clientes</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center" }}>Cargando clientes...</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center" }} className="text-muted">
            No hay clientes registrados aún.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "16px 24px", fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: "16px 24px", fontWeight: 500 }}>Email</th>
                <th style={{ padding: "16px 24px", fontWeight: 500 }}>Plan</th>
                <th style={{ padding: "16px 24px", fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "16px 24px" }}>{client.name || "Sin nombre"}</td>
                  <td style={{ padding: "16px 24px", color: "var(--text-secondary)" }}>{client.email}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <select 
                      value={client.tier} 
                      onChange={(e) => handleUpdateTier(client.id, e.target.value)}
                      style={{ 
                        background: "rgba(255,255,255,0.05)", 
                        color: "white", 
                        border: "1px solid var(--border-color)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="none" style={{ color: "black" }}>Sin Plan</option>
                      <option value="basic" style={{ color: "black" }}>Basic</option>
                      <option value="scale" style={{ color: "black" }}>Scale</option>
                      <option value="growth" style={{ color: "black" }}>Growth</option>
                    </select>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <select 
                      value={client.status} 
                      onChange={(e) => handleUpdateStatus(client.id, e.target.value)}
                      style={{ 
                        background: client.status === "active" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                        color: client.status === "active" ? "#10b981" : "#f59e0b", 
                        border: `1px solid ${client.status === "active" ? "#10b981" : "#f59e0b"}`,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="active" style={{ color: "black" }}>Activo</option>
                      <option value="suspended" style={{ color: "black" }}>Suspendido</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: "400px", padding: "24px" }}>
            <h2 className="heading-md" style={{ marginBottom: "24px" }}>Registrar Nuevo Cliente</h2>
            <form onSubmit={handleCreateClient}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}>Nombre o Empresa</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="glass-panel"
                  style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "white", borderRadius: "8px" }}
                  placeholder="Ej. The Quant Partners"
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}>Correo Electrónico (Google)</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  className="glass-panel"
                  style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "white", borderRadius: "8px" }}
                  placeholder="cliente@gmail.com"
                />
              </div>
              
              {errorMsg && <p style={{ color: "var(--color-danger)", marginBottom: "16px", fontSize: "0.9rem" }}>{errorMsg}</p>}

              <div className="flex-between">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
