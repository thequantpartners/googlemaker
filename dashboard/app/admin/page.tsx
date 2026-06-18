"use client";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Resumen General</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Bienvenido al panel de administración de The Quant Partners.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
        <div className="glass-card">
          <p className="text-muted">Total Clientes</p>
          <h2 className="heading-lg">3</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Campañas Activas</p>
          <h2 className="heading-lg">12</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted">Decisiones Tomadas</p>
          <h2 className="heading-lg">145</h2>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "32px" }}>
        <h2 className="heading-md" style={{ marginBottom: "16px" }}>Actividad Reciente</h2>
        <p className="text-muted">No hay actividad reciente en el orquestador.</p>
      </div>
    </div>
  );
}
