"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, X, Search, MoreHorizontal } from "lucide-react";

interface Client {
  id: string;
  email: string;
  name: string;
  status: string;
  tier: string;
  role: string;
}

export default function AdminClients() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Dropdown & Delete state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.backendToken}` },
      });
      if (res.ok) {
        setClientToDelete(null);
        setOpenMenuId(null);
        fetchClients();
      } else {
        alert("Error al eliminar cliente. Puede que sea superadmin.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Clientes</h1>
          <p className="text-gray-400">Administra los accesos y planes de los usuarios.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-dark-card border border-dark-card-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-dark-card-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              className="w-full bg-black/20 border border-dark-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-4" />
              Cargando clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search size={32} />
              </div>
              <p>No hay clientes registrados aún.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-dark-card-border bg-black/20">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre / Empresa</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan Activo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-card-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm shadow-sm">
                          {client.name ? client.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="font-medium text-white">{client.name || "Sin nombre"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{client.email}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={client.tier} 
                        onChange={(e) => handleUpdateTier(client.id, e.target.value)}
                        className="bg-black/30 text-white border border-dark-card-border text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer hover:bg-black/50 transition-colors"
                      >
                        <option value="none" className="text-black">Sin Plan</option>
                        <option value="starter" className="text-black">Starter</option>
                        <option value="growth" className="text-black">Growth</option>
                        <option value="pro" className="text-black">Pro</option>
                        <option value="elite" className="text-black">Elite</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={client.status} 
                        onChange={(e) => handleUpdateStatus(client.id, e.target.value)}
                        className={`text-sm rounded-full px-3 py-1 border focus:outline-none appearance-none cursor-pointer transition-colors ${
                          client.status === "active" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        <option value="active" className="text-black">Activo</option>
                        <option value="suspended" className="text-black">Suspendido</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      
                      {openMenuId === client.id && client.role !== 'superadmin' && (
                        <div className="absolute right-6 top-12 mt-2 w-40 bg-[#12161f] border border-dark-card-border rounded-xl shadow-2xl z-20 py-2 animate-fade-in-up">
                          <button
                            onClick={() => {
                              setClientToDelete(client);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 transition-colors text-sm font-medium"
                          >
                            Eliminar Cliente
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-card-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-dark-card-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Registrar Nuevo Cliente</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre o Empresa</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                    placeholder="Ej. The Quant Partners"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Correo Electrónico (Cuenta de Google)</label>
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                    placeholder="cliente@gmail.com"
                  />
                </div>
                
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <X className="text-red-400 mt-0.5" size={16} />
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-dark-card-border text-white font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cliente */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-card-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up p-6">
            <h2 className="text-xl font-bold text-white mb-2">¿Eliminar Cliente?</h2>
            <p className="text-gray-400 mb-6">
              Estás a punto de eliminar al cliente <span className="text-white font-bold">{clientToDelete.email}</span>. 
              Esta acción es permanente y eliminará todas sus campañas y credenciales asociadas.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-dark-card-border text-white font-medium hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/50 font-bold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
