"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LayoutTemplate, Save, Plus, Trash2, ArrowLeft, ExternalLink, Settings2, ListChecks, Check } from "lucide-react";
import Link from "next/link";

export default function MagicFormBuilder() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function fetchForm() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/forms/${id}`);
        if (res.ok) {
          setForm(await res.json());
        } else {
          router.push("/dashboard/magic-forms");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [id, session, router]);

  const saveForm = async () => {
    if (!session?.backendToken || !form) return;
    setSaving(true);
    
    try {
      // Delete old and recreate because backend API currently expects POST for create.
      // We should ideally have a PUT for update, but we can do a quick delete + post trick 
      // OR better, since I didn't add a PUT endpoint in the backend, I'll just delete and post with the SAME ID. 
      // Wait, POST generates a new ID. Let's just create a quick PUT endpoint or... wait, the router `clients.py` doesn't have PUT for magic forms.
      // Ah, I missed adding a PUT endpoint in the backend. Let me handle that gracefully or just add it now if needed. 
      // Actually, since I didn't add PUT, I will need to call backend to update.
      // I'll make a POST request and assume the backend can handle it, or I can just modify the backend.
      // Wait, let's just make a PUT request anyway and I will add it to the backend next.
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/magic-forms/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg({ text: "Guardado correctamente", type: "success" });
      } else {
        setMsg({ text: "Error al guardar", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Error de conexión", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        { id: `q_${Date.now()}`, type: "multiple_choice", question: "¿Nueva Pregunta?", options: [{ text: "Opción 1", score: 10 }] }
      ]
    });
  };

  const removeQuestion = (idx: number) => {
    const q = [...form.questions];
    q.splice(idx, 1);
    setForm({ ...form, questions: q });
  };

  const updateQuestionType = (idx: number, type: string) => {
    const q = [...form.questions];
    q[idx].type = type;
    if (!q[idx].options) q[idx].options = [{ text: "Opción 1", score: 10 }];
    setForm({ ...form, questions: q });
  };

  const updateQuestion = (idx: number, val: string) => {
    const q = [...form.questions];
    q[idx].question = val;
    setForm({ ...form, questions: q });
  };

  const addOption = (qIdx: number) => {
    const q = [...form.questions];
    q[qIdx].options.push({ text: "", score: 0 });
    setForm({ ...form, questions: q });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const q = [...form.questions];
    q[qIdx].options.splice(oIdx, 1);
    setForm({ ...form, questions: q });
  };

  const updateOption = (qIdx: number, oIdx: number, field: "text"|"score", val: any) => {
    const q = [...form.questions];
    q[qIdx].options[oIdx] = { ...q[qIdx].options[oIdx], [field]: val };
    setForm({ ...form, questions: q });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando constructor...</div>;
  if (!form) return null;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/magic-forms" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutTemplate className="text-neon-purple" />
            Editar Magic Form
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={`/f/${form.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all"
          >
            <ExternalLink size={16} /> Ver en vivo
          </a>
          <button 
            onClick={saveForm}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-neon-purple hover:bg-neon-purple/90 rounded-xl shadow-lg shadow-neon-purple/20 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm ${msg.type === "success" ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
          <Check size={16} /> {msg.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-dark-card border border-dark-card-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings2 size={18} className="text-gray-400" />
            Textos de la Landing
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título Principal</label>
              <input 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Subtítulo</label>
              <textarea 
                value={form.subtitle || ""}
                onChange={e => setForm({...form, subtitle: e.target.value})}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
              />
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-dark-card border border-dark-card-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ExternalLink size={18} className="text-neon-green" />
            Compartir y Embeber
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Enlace Público (Quiz Interactivo)</label>
              <input 
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form.id}`}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Código Embebido (Iframe para tu web)</label>
              <textarea 
                readOnly
                value={`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/f/${form.id}" width="100%" style="border:none;min-height:600px;" title="Magic Form"></iframe>`}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none resize-none font-mono text-sm"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          </div>
        </div>

        {/* Heuristics Config */}
        <div className="bg-dark-card border border-dark-card-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ListChecks size={18} className="text-neon-purple" />
            Preguntas Filtro (Heurística)
          </h2>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="block text-sm font-medium text-gray-300 mb-1">Puntaje Mínimo para Aprobar</label>
              <input 
                type="number"
                value={form.min_score_to_qualify}
                onChange={e => setForm({...form, min_score_to_qualify: parseInt(e.target.value) || 0})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-neon-purple outline-none"
              />
            </div>
            <div className="flex-[2] bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="block text-sm font-medium text-gray-300 mb-1">Mensaje de Rechazo</label>
              <input 
                value={form.rejection_message}
                onChange={e => setForm({...form, rejection_message: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-neon-purple outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {form.questions.map((q: any, qIdx: number) => (
              <div key={q.id} className="border border-white/10 bg-black/20 rounded-xl p-4">
                <div className="flex gap-2 mb-4">
                  <input 
                    value={q.question}
                    onChange={e => updateQuestion(qIdx, e.target.value)}
                    className="flex-1 bg-transparent border-b border-white/20 px-2 py-1 text-white font-medium focus:border-neon-purple outline-none"
                    placeholder="Ej: ¿Cuál es tu presupuesto?"
                  />
                  <select
                    value={q.type || "multiple_choice"}
                    onChange={e => updateQuestionType(qIdx, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-gray-300 focus:border-neon-purple outline-none"
                  >
                    <option value="short_text">Texto corto</option>
                    <option value="long_text">Párrafo</option>
                    <option value="multiple_choice">Opción múltiple</option>
                    <option value="checkboxes">Casillas</option>
                  </select>
                  <button onClick={() => removeQuestion(qIdx)} className="text-gray-500 hover:text-red-500 p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {(q.type === 'short_text' || q.type === 'long_text') ? (
                  <div className="pl-4 pt-2">
                    <input 
                      disabled 
                      placeholder={q.type === 'short_text' ? "Texto de respuesta corta" : "Texto de respuesta larga"} 
                      className="w-full bg-white/5 border border-dashed border-white/20 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                ) : (
                <div className="space-y-2 pl-4">
                  {(q.options || []).map((opt: any, oIdx: number) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-neon-purple/50" />
                      <input 
                        value={opt.text}
                        onChange={e => updateOption(qIdx, oIdx, "text", e.target.value)}
                        placeholder="Respuesta"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-neon-purple outline-none"
                      />
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-gray-400">Pts:</span>
                        <input 
                          type="number"
                          value={opt.score}
                          onChange={e => updateOption(qIdx, oIdx, "score", parseInt(e.target.value) || 0)}
                          className="w-12 bg-transparent text-sm text-white outline-none text-right"
                        />
                      </div>
                      <button onClick={() => removeOption(qIdx, oIdx)} className="text-gray-600 hover:text-red-400 p-1">
                        <X_ICON />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIdx)} className="text-xs text-neon-purple hover:text-neon-purple/80 font-medium flex items-center gap-1 mt-2">
                    <Plus size={12} /> Añadir opción
                  </button>
                </div>
                )}
              </div>
            ))}
            
            <button onClick={addQuestion} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex justify-center items-center gap-2 text-sm font-medium">
              <Plus size={16} /> Añadir Pregunta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function X_ICON() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
