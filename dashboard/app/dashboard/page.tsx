"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);

  async function checkStatus() {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      } else if (res.status === 403) {
        setStatusData({ user_status: 'suspended' });
      } else {
        setStatusData(null);
      }
    } catch (err) {
      console.error("Failed to fetch credential status", err);
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
  }, [session]);

  const handleConnect = () => {
    if (!session?.backendToken) return;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google-ads/login?token=${session.backendToken}`;
  };

  const handleSelectPlan = async (tier: string) => {
    if (!session?.backendToken) return;
    setSelectingPlan(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/tier?tier=${tier}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      await checkStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setSelectingPlan(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Cargando panel...</div>;
  }

  // --- SUSPENDED STATE ---
  if (statusData?.user_status === 'suspended') {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center", padding: "40px" }} className="glass-panel">
        <div style={{ width: "80px", height: "80px", background: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 24px" }}>
          🚫
        </div>
        <h1 className="heading-lg" style={{ color: "#ef4444", marginBottom: "16px" }}>Cuenta Suspendida</h1>
        <p className="text-muted" style={{ fontSize: "1.1rem" }}>
          Tu cuenta ha sido suspendida. No puedes realizar acciones en el panel principal ni conectar cuentas de Google Ads.
        </p>
      </div>
    );
  }

  // --- PAYWALL STATE ---
  if (statusData?.plan_limit === 0) {
    return (
      <div style={{ maxWidth: "1000px", margin: "40px auto", textAlign: "center" }}>
        <h1 className="heading-lg" style={{ marginBottom: "16px" }}>Elige tu Plan</h1>
        <p className="text-muted" style={{ marginBottom: "40px", fontSize: "1.1rem" }}>
          Desbloquea el poder de la optimización automática con GoogleMaker.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 className="heading-md">Basic</h2>
              <h1 className="heading-lg" style={{ color: "var(--primary-color)", margin: "16px 0" }}>$5<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mes</span></h1>
              <p className="text-muted" style={{ marginBottom: "24px" }}>Ideal para emprendedores y negocios locales.</p>
              <ul style={{ textAlign: "left", marginBottom: "24px", color: "var(--text-color)" }}>
                <li style={{ marginBottom: "8px" }}>✅ Conectar 1 cuenta de Google Ads</li>
                <li style={{ marginBottom: "8px" }}>✅ Optimización base con IA</li>
                <li style={{ marginBottom: "8px" }}>✅ Reportes semanales</li>
              </ul>
            </div>
            <button className="btn-outline" onClick={() => handleSelectPlan("basic")} disabled={selectingPlan} style={{ width: "100%", padding: "12px" }}>
              {selectingPlan ? "Activando..." : "Elegir Basic"}
            </button>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "2px solid var(--primary-color)", transform: "scale(1.05)" }}>
            <div>
              <div style={{ background: "var(--primary-color)", color: "white", padding: "4px 12px", borderRadius: "20px", display: "inline-block", fontSize: "0.8rem", marginBottom: "16px", fontWeight: "bold" }}>MÁS POPULAR</div>
              <h2 className="heading-md">Scale</h2>
              <h1 className="heading-lg" style={{ color: "var(--primary-color)", margin: "16px 0" }}>$20<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mes</span></h1>
              <p className="text-muted" style={{ marginBottom: "24px" }}>Para agencias pequeñas y negocios en crecimiento.</p>
              <ul style={{ textAlign: "left", marginBottom: "24px", color: "var(--text-color)" }}>
                <li style={{ marginBottom: "8px" }}>✅ Hasta 3 cuentas de Google Ads</li>
                <li style={{ marginBottom: "8px" }}>✅ Optimización avanzada en tiempo real</li>
                <li style={{ marginBottom: "8px" }}>✅ Acompañamiento básico</li>
              </ul>
            </div>
            <button className="btn-primary" onClick={() => handleSelectPlan("scale")} disabled={selectingPlan} style={{ width: "100%", padding: "12px" }}>
              {selectingPlan ? "Activando..." : "Elegir Scale"}
            </button>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 className="heading-md">Growth</h2>
              <h1 className="heading-lg" style={{ color: "var(--primary-color)", margin: "16px 0" }}>$99<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mes</span></h1>
              <p className="text-muted" style={{ marginBottom: "24px" }}>Para grandes agencias y operaciones robustas.</p>
              <ul style={{ textAlign: "left", marginBottom: "24px", color: "var(--text-color)" }}>
                <li style={{ marginBottom: "8px" }}>✅ Cuentas de Google Ads ilimitadas</li>
                <li style={{ marginBottom: "8px" }}>✅ Plan personalizado y estrategas</li>
                <li style={{ marginBottom: "8px" }}>✅ Soporte prioritario 24/7</li>
              </ul>
            </div>
            <button className="btn-outline" onClick={() => handleSelectPlan("growth")} disabled={selectingPlan} style={{ width: "100%", padding: "12px" }}>
              {selectingPlan ? "Activando..." : "Elegir Growth"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD STATE ---
  const connectedCount = statusData?.connected_accounts?.length || 0;
  const isUnlimited = statusData?.plan_limit === null;
  const canConnectMore = isUnlimited || connectedCount < statusData?.plan_limit;
  const isSuspended = statusData?.user_status === 'suspended';

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="heading-lg">Panel Principal</h1>
        {canConnectMore && (
          <button 
            className="btn-primary" 
            onClick={isSuspended ? undefined : handleConnect} 
            disabled={isSuspended}
            style={{ 
              padding: "8px 16px",
              opacity: isSuspended ? 0.5 : 1,
              cursor: isSuspended ? "not-allowed" : "pointer"
            }}
          >
            + Conectar Google Ads
          </button>
        )}
      </div>
      
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        {isUnlimited 
          ? `Tienes cuentas ilimitadas. (${connectedCount} conectadas)`
          : `Has conectado ${connectedCount} de ${statusData?.plan_limit} cuentas permitidas en tu plan.`}
      </p>

      {searchParams.get("connected") === "success" && (
        <div style={{ padding: "16px", background: "rgba(0, 200, 83, 0.1)", border: "1px solid var(--success-color)", color: "var(--success-color)", borderRadius: "8px", marginBottom: "32px" }}>
          ¡Cuenta de Google Ads conectada con éxito!
        </div>
      )}

      {connectedCount === 0 ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", background: "var(--primary-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 16px" }}>
            🔗
          </div>
          <h2 className="heading-md">Sin cuentas conectadas</h2>
          <p className="text-muted" style={{ marginBottom: "24px" }}>
            Aún no has conectado ninguna cuenta de Google Ads.
          </p>
          <button 
            className="btn-primary" 
            onClick={isSuspended ? undefined : handleConnect} 
            disabled={isSuspended}
            style={{ 
              padding: "12px 32px",
              opacity: isSuspended ? 0.5 : 1,
              cursor: isSuspended ? "not-allowed" : "pointer"
            }}
          >
            Conectar Ahora
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
            <div className="glass-card">
              <p className="text-muted">Cuentas Activas</p>
              <h2 className="heading-lg" style={{ color: "var(--success-color)" }}>{connectedCount}</h2>
            </div>
            <div className="glass-card">
              <p className="text-muted">Conversiones (Mes)</p>
              <h2 className="heading-lg">--</h2>
            </div>
            <div className="glass-card">
              <p className="text-muted">Gasto (Mes)</p>
              <h2 className="heading-lg">$ 0.00</h2>
            </div>
          </div>

          <h2 className="heading-md" style={{ marginBottom: "16px" }}>Cuentas Conectadas</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {statusData?.connected_accounts?.map((acc: any, index: number) => {
              const isInvalid = acc.target_customer_id === "Unknown" || acc.target_customer_id === "Unknown:1" || acc.target_customer_id === "PENDING" || acc.target_customer_id === "PENDING:1";
              return (
              <div key={index} className="glass-panel" style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: isInvalid ? "4px solid #ef4444" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                    {isInvalid ? "⚠️" : "📊"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0 }}>Customer ID: {acc.target_customer_id}</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>Credencial ID: {acc.id.split("-")[0]}</p>
                    {isInvalid && <p style={{ color: "#ef4444", margin: "4px 0 0 0", fontSize: "0.85rem" }}>Esta credencial está corrupta o caducada. Por favor, elimínala y vuelve a conectar.</p>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {!isInvalid && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--success-color)" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success-color)", boxShadow: "0 0 10px var(--success-color)" }}></div>
                      <span>Sincronizada</span>
                    </div>
                  )}
                  <button 
                    onClick={async () => {
                      if (confirm("¿Estás seguro de que deseas desconectar tus cuentas de Google Ads? Tendrás que volver a conectarlas.")) {
                        try {
                          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${session?.backendToken}` }
                          });
                          window.location.reload();
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                    style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )})}
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Cargando panel...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
