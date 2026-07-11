"use client";

import { useState } from "react";
import { Link2, Copy, Check, Plus, Trash2 } from "lucide-react";

export default function OnboardingCreator() {
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [steps, setSteps] = useState([
    { id: 1, title: "Firma de Contrato", description: "Revisión y firma electrónica del acuerdo de servicio." },
    { id: 2, title: "Acceso a Google Ads", description: "Brindar permisos de administrador a nuestra cuenta MCC." },
    { id: 3, title: "Llenado de Briefing", description: "Formulario para conocer el detalle de tus casos rentables." },
    { id: 4, title: "Kickoff Call", description: "Llamada de 30 mins para alinear estrategia." },
  ]);
  
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const generateLink = () => {
    const data = {
      client: clientName,
      company: companyName,
      steps: steps
    };
    
    // Codificamos la data en Base64 para pasarla por URL sin necesidad de base de datos
    const encodedData = btoa(encodeURIComponent(JSON.stringify(data)));
    const baseUrl = window.location.origin;
    setGeneratedLink(`${baseUrl}/welcome/${encodedData}`);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Generador de Onboarding</h1>
        <p className="text-gray-400 mb-8">Crea portales de bienvenida personalizados (SOPs) para tus nuevos clientes.</p>

        <div className="bg-dark-card border border-dark-card-border rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Cliente</label>
              <input 
                type="text" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                placeholder="Ej. Dr. Carlos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Estudio / Empresa</label>
              <input 
                type="text" 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                placeholder="Ej. Abogados & Asociados"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">Pasos del SOP (Onboarding)</label>
              <button 
                onClick={() => setSteps([...steps, { id: Date.now(), title: "Nuevo Paso", description: "Descripción del paso" }])}
                className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> Añadir Paso
              </button>
            </div>
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex gap-4 items-start bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={step.title}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[index].title = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="w-full bg-transparent border-b border-white/20 focus:border-neon-blue pb-1 text-white font-medium focus:outline-none"
                    />
                    <input 
                      type="text" 
                      value={step.description}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[index].description = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="w-full bg-transparent border-b border-white/20 focus:border-neon-blue pb-1 text-gray-400 text-sm focus:outline-none"
                    />
                  </div>
                  <button onClick={() => removeStep(step.id)} className="text-red-400 hover:text-red-300 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button 
              onClick={generateLink}
              disabled={!clientName || !companyName}
              className="w-full py-4 bg-neon-blue hover:bg-blue-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <Link2 size={20} /> Generar Portal de Bienvenida
            </button>
          </div>

          {generatedLink && (
            <div className="mt-6 p-6 bg-neon-blue/10 border border-neon-blue/30 rounded-xl animate-fade-in-up">
              <h3 className="text-sm font-medium text-neon-blue mb-2">Enlace Generado Listo para Enviar:</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Este enlace contiene toda la información cifrada. No caduca y puedes enviarlo por WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
