"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ChevronRight, AlertCircle, Bot, Loader2 } from "lucide-react";

export default function PublicMagicForm() {
  const { id } = useParams();
  
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState(-1); // -1 = contact info, 0...n = questions, n+1 = success/reject
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/forms/${id}`);
        if (res.ok) {
          setForm(await res.json());
        } else {
          setError("Formulario no encontrado o no disponible.");
        }
      } catch (err) {
        setError("Error de conexión al cargar el formulario.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchForm();
  }, [id]);

  const handleNext = () => {
    // Validate contact info if on step -1
    if (step === -1) {
      if (!contact.name || !contact.email || !contact.phone) {
        alert("Por favor completa todos tus datos de contacto para continuar.");
        return;
      }
    } else if (step >= 0 && step < form.questions.length) {
      const q = form.questions[step];
      if (!answers[q.id]) {
        alert("Por favor selecciona una opción.");
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
    
    // Calculate total score based on selected options
    let totalScore = 0;
    const answersRecord: Record<string, string> = {};
    
    form.questions.forEach((q: any) => {
      const selectedOptionText = answers[q.id];
      answersRecord[q.id] = selectedOptionText;
      
      const opt = q.options.find((o: any) => o.text === selectedOptionText);
      if (opt) totalScore += opt.score;
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
          answers: answersRecord
        })
      });
      
      const data = await res.json();
      setResult({ ok: data.ok, message: data.message });
      setStep(form.questions.length); // move to result screen
      
      // Fire Google Ads Pixel if successful (if gtag is available in window)
      if (data.ok && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-CONVERSION_ID/LABEL' // This would ideally be dynamic per client
        });
      }
      
    } catch (err) {
      alert("Ocurrió un error al enviar el formulario.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080F] flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-green" size={40} />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-[#06080F] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Oops</h1>
        <p className="text-gray-400">{error || "Algo salió mal"}</p>
      </div>
    );
  }

  const isResultScreen = step === form.questions.length;
  const progress = isResultScreen ? 100 : Math.max(5, ((step + 1) / (form.questions.length + 1)) * 100);

  return (
    <div className="min-h-screen bg-[#06080F] text-white font-sans selection:bg-neon-purple/30 flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div 
          className="h-full bg-gradient-to-r from-neon-purple to-neon-green transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-neon-green/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-xl w-full bg-[#0B0E14]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
          
          {/* Header */}
          {!isResultScreen && (
            <div className="text-center mb-10 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">{form.title}</h1>
              {form.subtitle && <p className="text-gray-400 text-lg">{form.subtitle}</p>}
            </div>
          )}

          {/* Step -1: Contact Info */}
          {step === -1 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={contact.name}
                  onChange={e => setContact({...contact, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={contact.email}
                  onChange={e => setContact({...contact, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"
                  placeholder="juan@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">WhatsApp</label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 font-medium">
                    +
                  </span>
                  <input 
                    type="tel" 
                    value={contact.phone}
                    onChange={e => setContact({...contact, phone: e.target.value})}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"
                    placeholder="51999888777"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Steps 0...n: Questions */}
          {step >= 0 && !isResultScreen && (
            <div className="animate-fade-in-up" key={step}>
              <h2 className="text-2xl font-bold mb-6 text-center">{form.questions[step].question}</h2>
              <div className="space-y-3">
                {form.questions[step].options.map((opt: any, i: number) => {
                  const isSelected = answers[form.questions[step].id] === opt.text;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({...answers, [form.questions[step].id]: opt.text})}
                      className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                        isSelected 
                          ? "bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] scale-[1.02]" 
                          : "bg-black/20 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{opt.text}</span>
                        {isSelected && <CheckCircle2 className="text-neon-purple" size={20} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result Screen */}
          {isResultScreen && result && (
            <div className="text-center animate-fade-in-up py-8">
              {result.ok ? (
                <>
                  <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(37,211,102,0.3)]">
                    <Bot size={40} className="text-neon-green" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">¡Todo listo!</h2>
                  <p className="text-gray-300 text-lg leading-relaxed">{result.message}</p>
                  <p className="text-neon-green font-medium mt-6 text-sm">Revisa tu WhatsApp en este momento.</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Aviso</h2>
                  <p className="text-gray-400 text-lg">{result.message}</p>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          {!isResultScreen && (
            <div className="mt-10 flex justify-end">
              <button
                onClick={handleNext}
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {step === form.questions.length - 1 ? "Enviar" : "Siguiente"}
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
        
        {/* Branding Footer */}
        <div className="mt-8 opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            Powered by <span className="font-bold text-white flex items-center gap-1"><div className="w-3 h-3 rounded-[3px] bg-gradient-to-r from-neon-purple to-neon-pink" /> QSS</span>
          </p>
        </div>
      </main>
    </div>
  );
}
