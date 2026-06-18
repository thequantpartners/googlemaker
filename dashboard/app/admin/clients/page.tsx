"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Client {
  id: string;
  email: string;
  name: string;
  status: string;
}

export default function AdminClients() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
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
    }
    fetchClients();
  }, [session]);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "32px" }}>
        <h1 className="heading-lg">Gestión de Clientes</h1>
        <button className="btn-primary" onClick={() => alert("Not implemented yet")}>
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
                <th style={{ padding: "16px 24px", fontWeight: 500 }}>Estado</th>
                <th style={{ padding: "16px 24px", fontWeight: 500, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "16px 24px" }}>{client.name || "Sin nombre"}</td>
                  <td style={{ padding: "16px 24px", color: "var(--text-secondary)" }}>{client.email}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span className={client.status === "active" ? "badge badge-active" : "badge badge-warning"}>
                      {client.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <button className="btn-outline" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
