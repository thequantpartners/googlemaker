"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function PlanesPage() {
  const { data: session } = useSession();
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProfile = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTier(data.tier);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const handleSelectPlan = async (tier: string) => {
    if (!session?.backendToken) return;
    setSelectingPlan(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/tier?tier=${tier}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        await fetchProfile();
        window.location.reload(); // Reload to update limits across the app
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Error al cambiar de plan.");
      }
    } catch (err) {
      setErrorMsg("Error de conexión al cambiar de plan.");
    } finally {
      setSelectingPlan(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "40px auto", textAlign: "center" }}>
        <p className="text-muted">Cargando planes...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "40px" }}>
      <h1 className="heading-lg" style={{ marginBottom: "16px" }}>Mi Plan</h1>
      <p className="text-muted" style={{ marginBottom: "40px", fontSize: "1.1rem" }}>
        Gestiona tu suscripción y desbloquea más capacidades para tu agencia.
      </p>

      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #ef4444" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
        {/* BASIC PLAN */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: currentTier === "basic" ? "2px solid var(--text-color)" : "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            {currentTier === "basic" && (
              <div style={{ background: "var(--text-color)", color: "black", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "0.8rem", marginBottom: "16px", fontWeight: "bold" }}>TU PLAN ACTUAL</div>
            )}
            <h2 className="heading-md">Basic</h2>
            <h1 className="heading-lg" style={{ color: "var(--primary-color)", margin: "16px 0" }}>$5<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mes</span></h1>
            <p className="text-muted" style={{ marginBottom: "24px" }}>Ideal para emprendedores y negocios locales.</p>
            <ul style={{ textAlign: "left", marginBottom: "24px", color: "var(--text-color)" }}>
              <li style={{ marginBottom: "8px" }}>✅ Conectar 1 cuenta de Google Ads</li>
              <li style={{ marginBottom: "8px" }}>✅ Optimización base con IA</li>
              <li style={{ marginBottom: "8px" }}>✅ Reportes semanales</li>
            </ul>
          </div>
          <button 
            className={currentTier === "basic" ? "btn-outline" : "btn-outline"} 
            onClick={() => handleSelectPlan("basic")} 
            disabled={selectingPlan || currentTier === "basic"} 
            style={{ width: "100%", padding: "12px", opacity: currentTier === "basic" ? 0.5 : 1 }}
          >
            {selectingPlan ? "Procesando..." : currentTier === "basic" ? "Plan Actual" : "Cambiar a Basic"}
          </button>
        </div>

        {/* SCALE PLAN */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: currentTier === "scale" ? "2px solid var(--primary-color)" : "2px solid var(--primary-color)", transform: "scale(1.05)" }}>
          <div>
            {currentTier === "scale" ? (
              <div style={{ background: "var(--primary-color)", color: "white", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "0.8rem", marginBottom: "16px", fontWeight: "bold" }}>TU PLAN ACTUAL</div>
            ) : (
              <div style={{ background: "var(--primary-color)", color: "white", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "0.8rem", marginBottom: "16px", fontWeight: "bold" }}>MÁS POPULAR</div>
            )}
            <h2 className="heading-md">Scale</h2>
            <h1 className="heading-lg" style={{ color: "var(--primary-color)", margin: "16px 0" }}>$20<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mes</span></h1>
            <p className="text-muted" style={{ marginBottom: "24px" }}>Para agencias pequeñas y negocios en crecimiento.</p>
            <ul style={{ textAlign: "left", marginBottom: "24px", color: "var(--text-color)" }}>
              <li style={{ marginBottom: "8px" }}>✅ Hasta 3 cuentas de Google Ads</li>
              <li style={{ marginBottom: "8px" }}>✅ Optimización avanzada en tiempo real</li>
              <li style={{ marginBottom: "8px" }}>✅ Acompañamiento básico</li>
            </ul>
          </div>
          <button 
            className={currentTier === "scale" ? "btn-outline" : "btn-primary"} 
            onClick={() => handleSelectPlan("scale")} 
            disabled={selectingPlan || currentTier === "scale"} 
            style={{ width: "100%", padding: "12px", opacity: currentTier === "scale" ? 0.5 : 1 }}
          >
            {selectingPlan ? "Procesando..." : currentTier === "scale" ? "Plan Actual" : "Cambiar a Scale"}
          </button>
        </div>

        {/* GROWTH PLAN */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: currentTier === "growth" ? "2px solid var(--text-color)" : "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            {currentTier === "growth" && (
              <div style={{ background: "var(--text-color)", color: "black", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "0.8rem", marginBottom: "16px", fontWeight: "bold" }}>TU PLAN ACTUAL</div>
            )}
            <h2 className="heading-md">Growth</h2>
            <h1 className="heading-lg" style={{ color: "var(--primary-color)", margin: "16px 0" }}>$99<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mes</span></h1>
            <p className="text-muted" style={{ marginBottom: "24px" }}>Para grandes agencias y operaciones robustas.</p>
            <ul style={{ textAlign: "left", marginBottom: "24px", color: "var(--text-color)" }}>
              <li style={{ marginBottom: "8px" }}>✅ Cuentas de Google Ads ilimitadas</li>
              <li style={{ marginBottom: "8px" }}>✅ Plan personalizado y estrategas</li>
              <li style={{ marginBottom: "8px" }}>✅ Soporte prioritario 24/7</li>
            </ul>
          </div>
          <button 
            className={currentTier === "growth" ? "btn-outline" : "btn-outline"} 
            onClick={() => handleSelectPlan("growth")} 
            disabled={selectingPlan || currentTier === "growth"} 
            style={{ width: "100%", padding: "12px", opacity: currentTier === "growth" ? 0.5 : 1 }}
          >
            {selectingPlan ? "Procesando..." : currentTier === "growth" ? "Plan Actual" : "Cambiar a Growth"}
          </button>
        </div>
      </div>
    </div>
  );
}
