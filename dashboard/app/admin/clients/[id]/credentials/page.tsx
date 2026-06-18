"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ClientCredentials({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    developer_token: "",
    oauth_client_id: "",
    oauth_client_secret: "",
    refresh_token: "",
    login_customer_id: "",
    target_customer_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.backendToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${params.id}/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.backendToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Credenciales guardadas y encriptadas correctamente.");
      } else {
        alert("Error al guardar credenciales");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Credenciales de Google Ads</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Configura el acceso a la cuenta del cliente. Las credenciales se encriptarán (AES-256) antes de guardarse en la base de datos.
      </p>

      <div className="glass-panel" style={{ padding: "32px", maxWidth: "600px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>Developer Token</label>
            <input 
              type="password" 
              className="input-field" 
              onChange={e => setFormData({...formData, developer_token: e.target.value})} 
              required 
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>OAuth Client ID</label>
            <input 
              type="password" 
              className="input-field" 
              onChange={e => setFormData({...formData, oauth_client_id: e.target.value})} 
              required 
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>OAuth Client Secret</label>
            <input 
              type="password" 
              className="input-field" 
              onChange={e => setFormData({...formData, oauth_client_secret: e.target.value})} 
              required 
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>Refresh Token</label>
            <input 
              type="password" 
              className="input-field" 
              onChange={e => setFormData({...formData, refresh_token: e.target.value})} 
              required 
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Login Customer ID (MCC)</label>
              <input 
                type="text" 
                className="input-field" 
                onChange={e => setFormData({...formData, login_customer_id: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Target Customer ID</label>
              <input 
                type="text" 
                className="input-field" 
                onChange={e => setFormData({...formData, target_customer_id: e.target.value})} 
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: "16px" }}>
            Guardar y Encriptar
          </button>
        </form>
      </div>
    </div>
  );
}
