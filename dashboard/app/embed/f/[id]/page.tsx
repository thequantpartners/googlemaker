"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, AlertCircle, Loader2 } from "lucide-react";

export default function EmbeddedMagicForm() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const gclid = searchParams.get("gclid");
  
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState(-1);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/forms/${id}`);
        if (res.ok) {
          setForm(await res.json());
        } else {
          setError("Formulario no disponible.");
        }
      } catch (err) {
        setError("Error de conexión.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchForm();
  }, [id]);

  useEffect(() => {
    // Send height update to parent window for iframe resizing
    const sendHeight = () => {
      if (typeof window !== "undefined" && window.parent) {
        const height = document.body.scrollHeight;
        window.parent.postMessage({ type: 'qss-iframe-resize', height }, '*');
      }
    };
    sendHeight();
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [step, loading, result]);

  const handleNext = () => {
    if (step === -1) {
      if (!contact.name || !contact.email || !contact.phone) {
        alert("Completa tus datos de contacto.");
        return;
      }
    } else if (step >= 0 && step < form.questions.length) {
      const q = form.questions[step];
      const ans = answers[q.id];
      if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && ans.trim() === '')) {
        alert("Por favor responde a esta pregunta.");
        return;
      }
    }

    if (step < form.questions.length - 1) {
      setStep(step + 1);
    } else {
      submitForm();
    }
  };

  const submitForm = async () => {
    setSubmitting(true);
    let totalScore = 0;
    const answersRecord: Record<string, string> = {};
    
    form.questions.forEach((q: any) => {
      const ans = answers[q.id];
      const qType = q.type || 'multiple_choice';
      
      if (qType === 'short_text' || qType === 'long_text') {
        answersRecord[q.id] = ans;
      } else if (qType === 'checkboxes') {
        answersRecord[q.id] = Array.isArray(ans) ? ans.join(', ') : ans;
        if (Array.isArray(ans)) {
          ans.forEach((selectedText: string) => {
            const opt = (q.options || []).find((o: any) => o.text === selectedText);
            if (opt) totalScore += (opt.score || 0);
          });
        }
      } else {
        answersRecord[q.id] = ans;
        const opt = (q.options || []).find((o: any) => o.text === ans);
        if (opt) totalScore += (opt.score || 0);
      }
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/forms/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          score: totalScore,
          answers: answersRecord,
          gclid: gclid || undefined
        })
      });
      
      const data = await res.json();
      setResult({ ok: data.ok, message: data.message });
      setStep(form.questions.length);
      
    } catch (err) {
      alert("Error al enviar el formulario.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
  if (error || !form) return <div className="p-6 text-center text-red-500">{error || "Error"}</div>;

  const isResultScreen = step === form.questions.length;

  // We use transparent background and light borders so it inherits nicely on websites.
  return (
    <div className="w-full bg-transparent font-sans text-gray-800 dark:text-gray-100 p-1">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        
        {/* Header */}
        {!isResultScreen && (
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{form.title}</h1>
            {form.subtitle && <p className="text-sm text-gray-500">{form.subtitle}</p>}
          </div>
        )}

        {/* Step -1: Contact Info */}
        {step === -1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Nombre Completo</label>
              <input type="text" value={contact.name} onChange={e => setContact({...contact, name: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Correo Electrónico</label>
              <input type="email" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">WhatsApp</label>
              <input type="tel" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent focus:border-blue-500 outline-none text-sm"
                placeholder="+51..."
              />
            </div>
          </div>
        )}

        {/* Steps 0...n: Questions */}
        {step >= 0 && !isResultScreen && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{form.questions[step].question}</h2>
            <div className="space-y-2">
              {(() => {
                const q = form.questions[step];
                const qType = q.type || 'multiple_choice';

                if (qType === 'short_text' || qType === 'long_text') {
                  return qType === 'short_text' ? (
                    <input type="text" value={answers[q.id] || ""} onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent focus:border-blue-500 outline-none text-sm"
                    />
                  ) : (
                    <textarea value={answers[q.id] || ""} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} rows={3}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent focus:border-blue-500 outline-none text-sm resize-none"
                    />
                  );
                }

                return (q.options || []).map((opt: any, i: number) => {
                  const isCheckbox = qType === 'checkboxes';
                  const currentAnswers = answers[q.id] || (isCheckbox ? [] : "");
                  const isSelected = isCheckbox ? currentAnswers.includes(opt.text) : currentAnswers === opt.text;
                  return (
                    <button key={i}
                      onClick={() => {
                        if (isCheckbox) {
                          const newAnswers = isSelected ? currentAnswers.filter((a: string) => a !== opt.text) : [...currentAnswers, opt.text];
                          setAnswers({...answers, [q.id]: newAnswers});
                        } else {
                          setAnswers({...answers, [q.id]: opt.text});
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Result Screen */}
        {isResultScreen && result && (
          <div className="text-center py-6">
            {result.ok ? (
              <>
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">¡Solicitud Enviada!</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{result.message}</p>
                <p className="text-green-600 dark:text-green-400 font-semibold mt-4 text-sm">Revisa tu WhatsApp ahora.</p>
              </>
            ) : (
              <>
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Aviso</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{result.message}</p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        {!isResultScreen && (
          <div className="mt-6 flex justify-end">
            <button onClick={handleNext} disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : (step === form.questions.length - 1 ? "Enviar" : "Siguiente")}
              {!submitting && <ChevronRight size={16} />}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
