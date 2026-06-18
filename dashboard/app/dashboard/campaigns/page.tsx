"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface ConnectedAccount {
  id: string;
  target_customer_id: string;
  is_verified: boolean;
}

interface CampaignMetric {
  campaign_id: string;
  campaign_name: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

export default function ClientCampaigns() {
  const { data: session } = useSession();
  
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Fetch connected accounts on load
  useEffect(() => {
    async function fetchAccounts() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.connected_accounts || []);
          if (data.connected_accounts?.length > 0) {
            setSelectedAccount(data.connected_accounts[0].target_customer_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    }
    fetchAccounts();
  }, [session]);

  // 2. Fetch campaigns when selectedAccount changes
  useEffect(() => {
    async function fetchCampaigns() {
      if (!session?.backendToken || !selectedAccount) return;
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns?customer_id=${selectedAccount}`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.detail || "Error al obtener campañas.");
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
        setErrorMsg("Fallo en la conexión.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [session, selectedAccount]);

  // KPIs
  const totalCost = campaigns.reduce((acc, c) => acc + c.cost, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
  const avgCpa = totalConversions > 0 ? totalCost / totalConversions : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="heading-lg">Mis Campañas</h1>
        
        {accounts.length > 0 && (
          <select 
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{ 
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-color)",
              color: "white",
              padding: "10px 16px",
              borderRadius: "8px",
              outline: "none",
              cursor: "pointer",
              minWidth: "200px"
            }}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.target_customer_id} style={{ color: "black" }}>
                ID: {acc.target_customer_id}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-muted" style={{ marginBottom: "32px" }}>
        Métricas agregadas de los últimos 30 días para la cuenta seleccionada.
      </p>

      {errorMsg && (
        <div className="glass-panel" style={{ borderLeft: "4px solid #ef4444", padding: "16px", marginBottom: "32px" }}>
          <p style={{ color: "#ef4444", margin: 0 }}>{errorMsg}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Inversión Total</p>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Clics</p>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>{totalClicks.toLocaleString()}</h2>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>CPA Promedio</p>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>${avgCpa.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Conversiones</p>
          <h2 style={{ fontSize: "2rem", margin: 0, color: "var(--primary-light)" }}>{totalConversions.toLocaleString()}</h2>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Campaña</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Estado</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Impresiones</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Clics</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Costo</th>
              <th style={{ padding: "16px 24px", fontWeight: 500 }}>Conversiones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center" }} className="text-muted">
                  Cargando métricas desde Google Ads...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center" }} className="text-muted">
                  {accounts.length === 0 ? "No tienes cuentas de Google Ads conectadas." : "No se encontraron campañas activas en los últimos 30 días."}
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.campaign_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: 500 }}>{c.campaign_name}</div>
                    <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "4px" }}>ID: {c.campaign_id}</div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span className={c.status === "ENABLED" ? "badge badge-active" : "badge badge-warning"}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px" }}>{c.impressions.toLocaleString()}</td>
                  <td style={{ padding: "16px 24px" }}>{c.clicks.toLocaleString()}</td>
                  <td style={{ padding: "16px 24px" }}>${c.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "16px 24px", fontWeight: "bold" }}>{c.conversions.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
