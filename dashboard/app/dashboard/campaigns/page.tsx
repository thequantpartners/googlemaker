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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    campaign_name: "",
    daily_budget: 50,
    final_url: "",
    keywords_text: "",
    headlines: ["", "", ""], // min 3
    descriptions: ["", ""] // min 2
  });

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: 'headlines' | 'descriptions', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'headlines' | 'descriptions') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field: 'headlines' | 'descriptions', index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const submitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.backendToken || !selectedAccount) return;
    
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    
    const keywords = formData.keywords_text.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    const validHeadlines = formData.headlines.map(h => h.trim()).filter(h => h.length > 0);
    const validDescriptions = formData.descriptions.map(d => d.trim()).filter(d => d.length > 0);
    
    if (validHeadlines.length < 3) {
      setCreateError("Debes ingresar al menos 3 títulos.");
      setCreateLoading(false);
      return;
    }
    if (validDescriptions.length < 2) {
      setCreateError("Debes ingresar al menos 2 descripciones.");
      setCreateLoading(false);
      return;
    }
    if (keywords.length === 0) {
      setCreateError("Debes ingresar al menos 1 palabra clave.");
      setCreateLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns?customer_id=${selectedAccount}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          campaign_name: formData.campaign_name,
          daily_budget: formData.daily_budget,
          final_url: formData.final_url,
          keywords: keywords,
          headlines: validHeadlines,
          descriptions: validDescriptions
        })
      });
      
      if (res.ok) {
        setCreateSuccess("Campaña creada exitosamente. Aparecerá en la tabla pronto.");
        setTimeout(() => {
          setIsModalOpen(false);
          setCreateSuccess("");
          // Reset form
          setFormData({
            campaign_name: "",
            daily_budget: 50,
            final_url: "",
            keywords_text: "",
            headlines: ["", "", ""],
            descriptions: ["", ""]
          });
          // Refresh campaigns
          setLoading(true);
          // Trigger re-fetch somehow (we can just call the API again or wait for user to refresh)
          window.location.reload();
        }, 2000);
      } else {
        const errData = await res.json();
        setCreateError(errData.detail || "Error al crear la campaña.");
      }
    } catch (err) {
      setCreateError("Fallo de red al crear la campaña.");
    } finally {
      setCreateLoading(false);
    }
  };

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
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
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
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              ➕ Crear Campaña
            </button>
          </div>
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
          <h2 style={{ fontSize: "2rem", margin: 0 }}>${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Clics</p>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>{totalClicks.toLocaleString("en-US")}</h2>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>CPA Promedio</p>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>${avgCpa.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Conversiones</p>
          <h2 style={{ fontSize: "2rem", margin: 0, color: "var(--primary-light)" }}>{totalConversions.toLocaleString("en-US")}</h2>
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
                  <td style={{ padding: "16px 24px" }}>{c.impressions.toLocaleString("en-US")}</td>
                  <td style={{ padding: "16px 24px" }}>{c.clicks.toLocaleString("en-US")}</td>
                  <td style={{ padding: "16px 24px" }}>${c.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "16px 24px", fontWeight: "bold" }}>{c.conversions.toLocaleString("en-US")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "32px", position: "relative" }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: "absolute", top: "24px", right: "24px", background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <h2 className="heading-md" style={{ marginBottom: "24px" }}>Crear Campaña de Búsqueda</h2>
            
            {createError && <div style={{ padding: "12px", background: "rgba(255,59,48,0.1)", color: "var(--error-color)", borderRadius: "8px", marginBottom: "16px" }}>{createError}</div>}
            {createSuccess && <div style={{ padding: "12px", background: "rgba(0,200,83,0.1)", color: "var(--success-color)", borderRadius: "8px", marginBottom: "16px" }}>{createSuccess}</div>}

            <form onSubmit={submitCampaign} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Nombre de la Campaña</label>
                <input required type="text" name="campaign_name" value={formData.campaign_name} onChange={handleFormChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Presupuesto Diario (USD)</label>
                  <input required type="number" min="1" step="0.01" name="daily_budget" value={formData.daily_budget} onChange={handleFormChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>URL Final de Destino</label>
                  <input required type="url" name="final_url" placeholder="https://..." value={formData.final_url} onChange={handleFormChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Palabras Clave (una por línea)</label>
                <textarea required name="keywords_text" value={formData.keywords_text} onChange={handleFormChange} placeholder={"ej: comprar zapatos\nzapatos de moda"} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none", minHeight: "100px", resize: "vertical" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Títulos del Anuncio (Mínimo 3, Max 15)</label>
                <p className="text-muted" style={{ fontSize: "0.8rem", marginBottom: "8px" }}>Máximo 30 caracteres cada uno.</p>
                {formData.headlines.map((hl, i) => (
                  <div key={`hl-${i}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input required={i < 3} type="text" maxLength={30} value={hl} onChange={(e) => handleArrayChange('headlines', i, e.target.value)} placeholder={`Título ${i + 1}`} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }} />
                    {i >= 3 && <button type="button" onClick={() => removeArrayItem('headlines', i)} style={{ padding: "0 16px", background: "rgba(255,59,48,0.2)", color: "var(--error-color)", border: "none", borderRadius: "8px", cursor: "pointer" }}>✕</button>}
                  </div>
                ))}
                {formData.headlines.length < 15 && (
                  <button type="button" onClick={() => addArrayItem('headlines')} style={{ padding: "8px 16px", background: "none", border: "1px dashed var(--border-color)", color: "var(--primary-light)", borderRadius: "8px", cursor: "pointer", width: "100%", marginTop: "8px" }}>+ Añadir Título</button>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Descripciones del Anuncio (Mínimo 2, Max 4)</label>
                <p className="text-muted" style={{ fontSize: "0.8rem", marginBottom: "8px" }}>Máximo 90 caracteres cada una.</p>
                {formData.descriptions.map((desc, i) => (
                  <div key={`desc-${i}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input required={i < 2} type="text" maxLength={90} value={desc} onChange={(e) => handleArrayChange('descriptions', i, e.target.value)} placeholder={`Descripción ${i + 1}`} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }} />
                    {i >= 2 && <button type="button" onClick={() => removeArrayItem('descriptions', i)} style={{ padding: "0 16px", background: "rgba(255,59,48,0.2)", color: "var(--error-color)", border: "none", borderRadius: "8px", cursor: "pointer" }}>✕</button>}
                  </div>
                ))}
                {formData.descriptions.length < 4 && (
                  <button type="button" onClick={() => addArrayItem('descriptions')} style={{ padding: "8px 16px", background: "none", border: "1px dashed var(--border-color)", color: "var(--primary-light)", borderRadius: "8px", cursor: "pointer", width: "100%", marginTop: "8px" }}>+ Añadir Descripción</button>
                )}
              </div>

              <div style={{ marginTop: "16px", paddingTop: "24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "12px 24px", background: "transparent", color: "white", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={createLoading} className="btn-primary">
                  {createLoading ? "Creando..." : "Crear Campaña (Iniciará Pausada)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
