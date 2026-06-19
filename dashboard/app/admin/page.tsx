"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Users, Megaphone, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ total_clients: 0, active_campaigns: 0, total_decisions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [session]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Resumen General</h1>
        <p className="text-gray-400">
          Bienvenido al panel de administración de The Quant Partners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col hover:border-orange-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Users className="text-orange-400" size={20} />
            </div>
            <p className="text-gray-400 font-medium">Total Clientes</p>
          </div>
          <h2 className="text-4xl font-bold text-white">{loading ? "--" : stats.total_clients}</h2>
        </div>

        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col hover:border-orange-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Megaphone className="text-orange-400" size={20} />
            </div>
            <p className="text-gray-400 font-medium">Campañas Activas</p>
          </div>
          <h2 className="text-4xl font-bold text-white">{loading ? "--" : stats.active_campaigns}</h2>
        </div>

        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col hover:border-orange-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <CheckCircle className="text-orange-400" size={20} />
            </div>
            <p className="text-gray-400 font-medium">Decisiones Tomadas</p>
          </div>
          <h2 className="text-4xl font-bold text-white">{loading ? "--" : stats.total_decisions}</h2>
        </div>
      </div>

      <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-8 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
        <div className="text-gray-400 flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <CheckCircle className="text-gray-600" size={32} />
          </div>
          <p>No hay actividad reciente en el orquestador.</p>
        </div>
      </div>
    </div>
  );
}
