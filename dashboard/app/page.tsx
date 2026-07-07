"use client";

import Link from "next/link";
import { CheckCircle2, TrendingUp, Clock, Shield } from "lucide-react";

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative selection:bg-neon-purple selection:text-white font-sans pb-24 md:pb-0">
      {/* Ambient background glows */}
      <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] rounded-full bg-neon-blue/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-neon-purple/20 blur-[150px] pointer-events-none" />
      
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 max-w-4xl mx-auto pt-24 lg:pt-32 pb-16 text-center">
        <div className="flex flex-col gap-10 items-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-neon-blue">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
            </span>
            Sistema Exclusivo para Abogados Penalistas en Perú
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Aumentaremos tu facturación en<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-neon-blue to-neon-purple mt-2 block">
              +S/ 10,000 al mes
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl">
            Un caso penal promedio se cobra desde S/ 5,000. Nuestro sistema de adquisición automático filtra a los curiosos para que solo necesites cerrar 2 casos extra al mes y lograr esta meta.
          </p>

          <div className="hidden md:flex flex-col w-full sm:w-auto mt-6">
            <Link 
              href="https://wa.me/51924464410?text=Hola,%20quiero%20conocer%20el%20sistema%20para%20abogados%20penalistas" 
              target="_blank"
              className="group relative px-10 py-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full font-bold text-white text-2xl overflow-hidden shadow-[0_0_50px_rgba(37,211,102,0.4)] hover:shadow-[0_0_80px_rgba(37,211,102,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-4 animate-pulse"
            >
              <WhatsAppIcon className="w-8 h-8" />
              <span className="relative z-10 flex items-center gap-2">
                Verificar Disponibilidad para mi Estudio
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Oferta Section */}
      <section className="relative z-10 py-16 bg-black/40 border-y border-dark-card-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">¿Qué incluye el Sistema?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left mt-12">
            <div className="bg-dark-card border border-dark-card-border p-6 rounded-2xl">
              <div className="text-neon-blue mb-4"><TrendingUp size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Campañas Rentables</h3>
              <p className="text-gray-400">Publicidad en Google Ads optimizada para captar solo casos penales de emergencia (Prisión Preventiva, TID, Lavado de Activos).</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-6 rounded-2xl">
              <div className="text-neon-purple mb-4"><Shield size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Filtro Inteligente (IA)</h3>
              <p className="text-gray-400">Un Asistente Virtual descarta casos civiles, familiares o personas sin presupuesto antes de que lleguen a tu celular.</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-6 rounded-2xl">
              <div className="text-[#25D366] mb-4"><CheckCircle2 size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Cierre Directo</h3>
              <p className="text-gray-400">El prospecto calificado recibe un pase directo a tu WhatsApp personal. Listos para contratar tus honorarios.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Egoístas Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">Por qué los mejores penalistas usan esto</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left relative">
            
            {/* Card 1 */}
            <div className="group relative bg-[#0a0a0b]/80 backdrop-blur-sm border border-white/5 p-8 rounded-[2rem] hover:border-neon-blue/30 transition-all duration-500 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-blue/10 rounded-full blur-[60px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-neon-blue/20 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-neon-blue/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <Clock className="text-neon-blue w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Recupera tu Tiempo y Tranquilidad</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  Tu tiempo vale cientos de dólares la hora. No tiene sentido que respondas llamadas de personas que buscan "abogados gratis". Nuestro sistema atiende la basura y te sirve en bandeja de plata solo los casos rentables.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-[#0a0a0b]/80 backdrop-blur-sm border border-white/5 p-8 rounded-[2rem] hover:border-[#25D366]/30 transition-all duration-500 overflow-hidden shadow-2xl mt-4 md:mt-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#25D366]/10 rounded-full blur-[60px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-[#25D366]/20 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-[#25D366]/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <TrendingUp className="text-[#25D366] w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Multiplica tus Honorarios con Menos Casos</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  Al filtrar a los clientes de bajo presupuesto, tendrás la autoridad para cobrar lo que realmente vale tu experiencia. Trabaja con menos clientes, pero factura el triple gracias a casos de alta complejidad.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-[#0a0a0b]/80 backdrop-blur-sm border border-white/5 p-8 rounded-[2rem] hover:border-neon-purple/30 transition-all duration-500 overflow-hidden shadow-2xl mt-4 md:mt-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-purple/10 rounded-full blur-[60px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-neon-purple/20 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-neon-purple/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <Shield className="text-neon-purple w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Estatus y Exclusividad</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  Eleva la percepción de tu estudio. Cuando un prospecto es filtrado por una IA profesional, entra a tu WhatsApp sabiendo que habla con una firma de alto nivel, no con un abogado desesperado por clientes.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0b]/80 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <Link 
          href="https://wa.me/51924464410?text=Hola,%20quiero%20conocer%20el%20sistema%20para%20abogados%20penalistas" 
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-xl font-bold text-white text-center shadow-[0_0_20px_rgba(37,211,102,0.3)] animate-pulse"
        >
          <WhatsAppIcon className="w-7 h-7" />
          Quiero casos rentables
        </Link>
      </div>
    </div>
  );
}
