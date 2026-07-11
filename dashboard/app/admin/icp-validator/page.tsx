"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Search, Target, TrendingUp, AlertTriangle } from "lucide-react";

type Criterion = {
  id: string;
  question: string;
  weight: number;
};

const criteria: Criterion[] = [
  { id: "tech", question: "¿Conoce la tecnología lo suficiente para valorar nuestro trabajo?", weight: 10 },
  { id: "google", question: "¿Sus clientes finales buscan su solución activamente en Google (y no tanto en Meta)?", weight: 20 },
  { id: "dependency", question: "¿Depende de Google Ads para su adquisición mensual de leads?", weight: 15 },
  { id: "ltv", question: "¿Tiene un LTV alto (sus propios clientes le pagan recurrentemente)?", weight: 20 },
  { id: "ticket", question: "¿Con solo 1 o 2 ventas ya cubre nuestro Setup (3k) + Fee mensual (2k)?", weight: 20 },
  { id: "easy", question: "¿Es 'fácil' darle resultados? (Nicho claro, urgencia, buena oferta)", weight: 15 },
];

export default function ICPValidator() {
  const [niche, setNiche] = useState("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isCalculated, setIsCalculated] = useState(false);

  const handleAnswer = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const calculateScore = () => {
    return criteria.reduce((total, c) => {
      return total + (answers[c.id] ? c.weight : 0);
    }, 0);
  };

  const score = calculateScore();

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: "ICP IDEAL (Tier 1)", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/50", icon: <CheckCircle2 className="w-12 h-12 text-green-400" /> };
    if (score >= 70) return { label: "Viable (Tier 2)", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/50", icon: <AlertTriangle className="w-12 h-12 text-yellow-400" /> };
    return { label: "Descartar", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/50", icon: <XCircle className="w-12 h-12 text-red-400" /> };
  };

  const status = getScoreStatus(score);

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Target className="text-neon-blue w-8 h-8" />
          <h1 className="text-3xl font-bold">Validador de ICP</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Filtra tus prospectos para asegurar que cumplan tus 6 reglas de oro. Recuerda: solo necesitas 2 clientes top para escalar.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6 bg-dark-card border border-dark-card-border p-6 rounded-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Nicho o Prospecto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="text" 
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                  placeholder="Ej. Clínicas Dentales de Implantes"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-purple" />
                Criterios de Calificación
              </h3>
              
              {criteria.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                  <span className="text-gray-300 text-sm flex-1">{c.question}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleAnswer(c.id, true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        answers[c.id] === true 
                          ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                          : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      Sí
                    </button>
                    <button 
                      onClick={() => handleAnswer(c.id, false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        answers[c.id] === false 
                          ? "bg-red-500/20 text-red-400 border border-red-500/50" 
                          : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsCalculated(true)}
              disabled={Object.keys(answers).length < criteria.length || !niche}
              className="w-full py-4 mt-4 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-bold rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar Score de Viabilidad
            </button>
          </div>

          <div className="md:col-span-1">
            <div className={`sticky top-8 p-6 rounded-2xl border transition-all duration-500 ${isCalculated ? status.bg + " " + status.border : "bg-dark-card border-dark-card-border"}`}>
              <h3 className="text-lg font-semibold mb-6 text-center text-gray-300">Resultado del Scoring</h3>
              
              {isCalculated ? (
                <div className="flex flex-col items-center animate-fade-in-up">
                  <div className="mb-4">{status.icon}</div>
                  <div className="text-5xl font-bold text-white mb-2">{score}<span className="text-2xl text-gray-500">/100</span></div>
                  <div className={`text-xl font-bold mb-4 ${status.color}`}>{status.label}</div>
                  
                  <div className="w-full bg-black/40 rounded-full h-3 mb-6 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  <p className="text-sm text-center text-gray-400">
                    {score >= 90 
                      ? `¡Excelente! ${niche} es un nicho altamente rentable y escalable para tu agencia.`
                      : score >= 70 
                      ? `Puede funcionar, pero ten cuidado con las expectativas de ${niche}.`
                      : `Descartado. Trabajar con ${niche} te costará tiempo y dolores de cabeza. Pasa al siguiente.`
                    }
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Responde todas las preguntas para ver si este prospecto califica.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
