"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, LayoutTemplate, Trash2, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MagicFormsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchForms = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/magic-forms`, {
        headers: { Authorization: `Bearer ${session.backendToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [session]);

  const createForm = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/magic-forms`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Inicia tu consulta gratis",
          subtitle: "Completa este breve formulario para que nuestro Asistente Virtual evalúe tu caso.",
          questions: [],
          min_score_to_qualify: 10,
          rejection_message: "Lamentablemente en este momento no podemos tomar tu caso. Gracias por tu interés."
        })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/magic-forms/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteForm = async (id: string) => {
    if (!session?.backendToken) return;
    if (!confirm("¿Seguro que deseas eliminar este Magic Form?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/magic-forms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.backendToken}` }
      });
      fetchForms();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutTemplate className="text-neon-purple" />
            Magic Forms
          </h1>
          <p className="text-gray-400 mt-2">
            Crea páginas de aterrizaje hiper-optimizadas con formularios heurísticos que filtran a tus leads antes de enviarlos a WhatsApp.
          </p>
        </div>
        <button 
          onClick={createForm}
          className="bg-neon-purple hover:bg-neon-purple/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-neon-purple/20 transition-all"
        >
          <Plus size={20} />
          Nuevo Magic Form
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Cargando formularios...</div>
      ) : forms.length === 0 ? (
        <div className="bg-dark-card border border-dark-card-border p-12 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 bg-neon-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutTemplate size={32} className="text-neon-purple" />
          </div>
          <h3 className="text-xl font-bold text-white">No tienes ningún Magic Form</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Crea tu primer formulario heurístico para empezar a filtrar curiosos y enviar solo leads ultra calificados a tu Master Setter.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-dark-card border border-dark-card-border rounded-2xl p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-[40px]" />
              
              <h3 className="text-lg font-bold text-white mb-2 truncate pr-8">{form.title}</h3>
              <p className="text-sm text-gray-500 mb-6 truncate">{form.subtitle}</p>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="text-xs font-bold text-neon-green bg-neon-green/10 px-3 py-1 rounded-full border border-neon-green/20">
                  {form.questions?.length || 0} Preguntas
                </div>
                <div className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  Min: {form.min_score_to_qualify} pts
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-dark-card-border">
                <Link 
                  href={`/dashboard/magic-forms/${form.id}`}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 rounded-lg text-center transition-colors"
                >
                  Editar
                </Link>
                <a 
                  href={`/f/${form.id}`} 
                  target="_blank"
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Ver en vivo"
                >
                  <ExternalLink size={18} />
                </a>
                <button 
                  onClick={() => deleteForm(form.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
