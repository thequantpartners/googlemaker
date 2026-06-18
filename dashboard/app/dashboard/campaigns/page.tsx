"use client";

import { useSession } from "next-auth/react";

export default function ClientCampaigns() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="heading-lg" style={{ marginBottom: "24px" }}>Mis Campañas</h1>
      <p className="text-muted" style={{ marginBottom: "40px" }}>
        Listado de campañas activas siendo gestionadas por el orquestador.
      </p>

      <div className="glass-panel" style={{ padding: "32px", textAlign: "center" }}>
        <p className="text-muted">
          Integración con Google Ads en progreso. Las métricas de tus campañas aparecerán aquí en tiempo real.
        </p>
      </div>
    </div>
  );
}
