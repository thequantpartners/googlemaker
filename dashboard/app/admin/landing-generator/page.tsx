"use client";

import { useState } from "react";
import { Download, LayoutTemplate, FileCode2 } from "lucide-react";
// @ts-ignore
import JSZip from "jszip";
// @ts-ignore
import { saveAs } from "file-saver";

export default function LandingGenerator() {
  const [formData, setFormData] = useState({
    title: "Aumentaremos tu facturación en +S/ 10,000 al mes",
    subtitle: "Un caso penal promedio se cobra desde S/ 5,000. Nuestro sistema filtra a los curiosos para que solo necesites cerrar 2 casos.",
    badge: "Sistema Exclusivo para Abogados",
    whatsappUrl: "https://wa.me/51999999999",
    whatsappText: "Verificar Disponibilidad",
    benefit1Title: "Campañas Rentables",
    benefit1Desc: "Publicidad en Google Ads optimizada.",
    benefit2Title: "Filtro Inteligente",
    benefit2Desc: "Un Asistente Virtual descarta casos civiles.",
    benefit3Title: "Cierre Directo",
    benefit3Desc: "El prospecto calificado recibe un pase directo a tu WhatsApp."
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateZip = async () => {
    setIsGenerating(true);
    try {
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { background: '#050505', neonBlue: '#3b82f6', neonPurple: '#8b5cf6', darkCard: '#0a0a0b', darkBorder: 'rgba(255,255,255,0.1)' }
        }
      }
    }
  </script>
  <style>
    body { background-color: #050505; color: white; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
    .bg-grid { background-image: linear-gradient(to right, rgba(128,128,128,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.07) 1px, transparent 1px); background-size: 40px 40px; }
  </style>
</head>
<body class="relative pb-20">
  <!-- Glows -->
  <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px] -z-10"></div>
  <div class="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/20 blur-[150px] -z-10"></div>
  <div class="absolute inset-0 bg-grid -z-20"></div>

  <!-- Hero -->
  <main class="px-6 max-w-4xl mx-auto pt-24 lg:pt-32 pb-16 text-center">
    <div class="flex flex-col gap-8 items-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-blue-400">
        ${formData.badge}
      </div>
      <h1 class="text-4xl md:text-6xl font-bold leading-tight">
        ${formData.title}
      </h1>
      <p class="text-xl text-gray-400 max-w-3xl">
        ${formData.subtitle}
      </p>
      <a href="${formData.whatsappUrl}" target="_blank" class="mt-8 px-10 py-5 bg-gradient-to-r from-green-500 to-green-600 rounded-full font-bold text-white text-xl shadow-[0_0_40px_rgba(37,211,102,0.4)] hover:scale-105 transition-transform flex items-center gap-3">
        ${formData.whatsappText}
      </a>
    </div>
  </main>

  <!-- Benefits -->
  <section class="py-16 bg-black/40 border-y border-white/10">
    <div class="max-w-5xl mx-auto px-6 text-center">
      <h2 class="text-3xl font-bold mb-12">¿Qué incluye?</h2>
      <div class="grid md:grid-cols-3 gap-6 text-left">
        <div class="bg-darkCard border border-darkBorder p-8 rounded-2xl">
          <h3 class="text-xl font-bold mb-2 text-blue-400">${formData.benefit1Title}</h3>
          <p class="text-gray-400">${formData.benefit1Desc}</p>
        </div>
        <div class="bg-darkCard border border-darkBorder p-8 rounded-2xl">
          <h3 class="text-xl font-bold mb-2 text-purple-400">${formData.benefit2Title}</h3>
          <p class="text-gray-400">${formData.benefit2Desc}</p>
        </div>
        <div class="bg-darkCard border border-darkBorder p-8 rounded-2xl">
          <h3 class="text-xl font-bold mb-2 text-green-400">${formData.benefit3Title}</h3>
          <p class="text-gray-400">${formData.benefit3Desc}</p>
        </div>
      </div>
    </div>
  </section>
</body>
</html>
      `;

      const zip = new JSZip();
      zip.file("index.html", htmlContent);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "landing-page.zip");
      
    } catch (error) {
      console.error("Error generating zip", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <LayoutTemplate className="text-neon-purple w-8 h-8" />
          <h1 className="text-3xl font-bold">Generador de Landing Pages</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Completa los datos de tu cliente y descarga un archivo `.zip` con la landing page lista (HTML + Tailwind) para subir a su hosting.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-card-border p-6 rounded-2xl space-y-4">
              <h3 className="font-semibold text-lg border-b border-white/10 pb-2 mb-4">Sección Principal (Hero)</h3>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Etiqueta (Badge)</label>
                <input name="badge" value={formData.badge} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-purple focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título Principal (Oferta de Valor)</label>
                <textarea name="title" value={formData.title} onChange={handleChange} rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-purple focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subtítulo (Descripción larga)</label>
                <textarea name="subtitle" value={formData.subtitle} onChange={handleChange} rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-purple focus:outline-none" />
              </div>
            </div>

            <div className="bg-dark-card border border-dark-card-border p-6 rounded-2xl space-y-4">
              <h3 className="font-semibold text-lg border-b border-white/10 pb-2 mb-4">Llamado a la Acción (CTA)</h3>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Texto del Botón</label>
                <input name="whatsappText" value={formData.whatsappText} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-purple focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL de Destino (Link de WhatsApp)</label>
                <input name="whatsappUrl" value={formData.whatsappUrl} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-purple focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-card-border p-6 rounded-2xl space-y-4">
              <h3 className="font-semibold text-lg border-b border-white/10 pb-2 mb-4">Beneficios / Características</h3>
              
              <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-blue-400 uppercase">Beneficio 1</label>
                <input name="benefit1Title" value={formData.benefit1Title} onChange={handleChange} className="w-full bg-transparent border-b border-white/20 pb-1 text-white focus:border-neon-purple focus:outline-none" placeholder="Título" />
                <input name="benefit1Desc" value={formData.benefit1Desc} onChange={handleChange} className="w-full bg-transparent border-b border-white/20 pb-1 text-gray-400 text-sm focus:border-neon-purple focus:outline-none" placeholder="Descripción" />
              </div>

              <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-purple-400 uppercase">Beneficio 2</label>
                <input name="benefit2Title" value={formData.benefit2Title} onChange={handleChange} className="w-full bg-transparent border-b border-white/20 pb-1 text-white focus:border-neon-purple focus:outline-none" placeholder="Título" />
                <input name="benefit2Desc" value={formData.benefit2Desc} onChange={handleChange} className="w-full bg-transparent border-b border-white/20 pb-1 text-gray-400 text-sm focus:border-neon-purple focus:outline-none" placeholder="Descripción" />
              </div>

              <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-green-400 uppercase">Beneficio 3</label>
                <input name="benefit3Title" value={formData.benefit3Title} onChange={handleChange} className="w-full bg-transparent border-b border-white/20 pb-1 text-white focus:border-neon-purple focus:outline-none" placeholder="Título" />
                <input name="benefit3Desc" value={formData.benefit3Desc} onChange={handleChange} className="w-full bg-transparent border-b border-white/20 pb-1 text-gray-400 text-sm focus:border-neon-purple focus:outline-none" placeholder="Descripción" />
              </div>
            </div>

            <button 
              onClick={generateZip}
              disabled={isGenerating}
              className="w-full py-5 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isGenerating ? "Empaquetando..." : (
                <>
                  <Download size={24} />
                  Descargar Código (.zip)
                </>
              )}
            </button>
            <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <FileCode2 size={16} />
              Incluye un archivo index.html auto-contenido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
