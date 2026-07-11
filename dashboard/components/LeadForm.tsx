"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function LeadForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Aquí puedes integrar el envío a tu backend, CRM o Google Sheets.
    // Por ahora simulamos el envío exitoso para disparar el pixel.
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Aquí podrías disparar eventos de conversión para Google Ads:
      // if (typeof window !== 'undefined' && (window as any).gtag) {
      //   (window as any).gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXX/YYYYYYY' });
      // }
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isSubmitted) {
    // Pantalla de éxito (Thank You Page embebida)
    const waMessage = `Hola, mi nombre es ${formData.name}. Llené el formulario y quiero conocer el sistema para abogados penalistas.`;
    const waLink = `https://wa.me/51924464410?text=${encodeURIComponent(waMessage)}`;

    return (
      <div className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-[#25D366]/30 p-8 rounded-[2rem] text-center max-w-md mx-auto shadow-[0_0_40px_rgba(37,211,102,0.15)] animate-fade-in-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/20 rounded-full blur-[50px] -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-blue/20 rounded-full blur-[50px] -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#25D366]/20 to-[#25D366]/5 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-[#25D366] w-10 h-10" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-white">¡Datos recibidos!</h3>
          <p className="text-gray-300 mb-8">
            Estás a un paso de revolucionar tu captación de clientes. Haz clic abajo para iniciar la conversación privada por WhatsApp con nuestro especialista.
          </p>
          
          <Link 
            href={waLink} 
            target="_blank"
            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl font-bold text-white text-lg overflow-hidden shadow-[0_0_30px_rgba(37,211,102,0.3)] hover:shadow-[0_0_50px_rgba(37,211,102,0.5)] hover:scale-[1.02] transition-all animate-pulse"
          >
            <WhatsAppIcon className="w-6 h-6" />
            <span>Hablar por WhatsApp ahora</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-left max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-[50px] -mr-10 -mt-10" />
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-2 text-white">Verificar Disponibilidad</h3>
        <p className="text-gray-400 text-sm mb-6">
          Completa tus datos para asegurarnos de que podemos ayudarte en tu jurisdicción. Solo atendemos 2 firmas nuevas por mes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
              placeholder="Ej. Dr. Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
              placeholder="tu@estudio.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Teléfono / WhatsApp</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
              placeholder="+51 999 999 999"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-bold text-white text-lg overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
