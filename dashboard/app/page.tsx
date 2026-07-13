"use client";

import Link from "next/link";
import { CheckCircle2, PlayCircle, XCircle, ArrowRight, TrendingUp, Clock, DollarSign, Target, MessageSquare, Megaphone, Zap } from "lucide-react";
import LeadForm from "@/components/LeadForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080F] text-white selection:bg-neon-green/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* GLOBAL NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06080F]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-[#128C7E] flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(37,211,102,0.3)]">
              Q
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">QSS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors hidden sm:block">
              Iniciar Sesión
            </Link>
            <Link 
              href="#demo" 
              className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-gray-200 hover:scale-105 transition-all shadow-lg"
            >
              Ver Demo Interactiva
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Glows */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon-green/15 rounded-full blur-[120px] pointer-events-none opacity-50" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/20 text-xs font-bold text-neon-green tracking-widest uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
            </span>
            Para Agencias y Negocios Escalables
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight mb-8">
            Multiplica tus Citas y Ventas en Automático, <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-emerald-400 to-teal-500">Sin Contratar Más Personal.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto font-light mb-12">
            QSS es tu nuevo Setter Virtual "Todo en Uno". Captura leads de tus campañas, los califica al instante por WhatsApp y agenda reuniones en tu calendario mientras duermes.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link 
              href="#demo" 
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-neon-green text-black text-xl font-black rounded-2xl overflow-hidden hover:scale-105 transition-all shadow-[0_0_40px_rgba(37,211,102,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Probar Demo en mi WhatsApp</span>
              <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-gray-500 font-medium">No requiere tarjeta de crédito • Respuesta inmediata garantizada</p>
          </div>
        </div>
      </section>

      {/* VSL (VIDEO SALES LETTER) PLACEHOLDER */}
      <section className="relative px-6 pb-24 -mt-10 z-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative aspect-video rounded-[2rem] md:rounded-[3rem] bg-[#0A0D14] border border-white/10 shadow-2xl overflow-hidden group cursor-pointer">
            {/* Glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-neon-green rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,211,102,0.5)] group-hover:scale-110 transition-transform duration-300">
                <PlayCircle className="w-10 h-10 md:w-14 md:h-14 text-black ml-2" />
              </div>
              <p className="mt-6 font-bold text-white tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">DESCUBRE CÓMO FUNCIONA</p>
            </div>

            {/* Thumbnail Mock */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2850&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-700" />
          </div>
        </div>
      </section>

      {/* AGITATION SECTION (THE PROBLEM) */}
      <section className="py-24 lg:py-32 px-6 relative border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Por qué estás perdiendo miles de dólares al mes</h2>
            <p className="text-xl text-gray-400">Si tu proceso de ventas no está 100% automatizado, estás regalando clientes a tu competencia.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* OLD WAY */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hover:border-red-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] group-hover:bg-red-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-8">
                <XCircle className="text-red-500 w-8 h-8" />
                <h3 className="text-2xl font-bold text-white">La Forma Tradicional (Caos)</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "Pagas miles al mes en sueldos de recepcionistas o setters.",
                  "Pagas suscripciones múltiples: Zapier, Calendly, Typeform, CRMs.",
                  "Tus leads esperan HORAS para recibir una respuesta (y se enfrían).",
                  "Tu equipo pierde tiempo hablando con personas sin dinero ni intención."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <XCircle className="w-6 h-6 text-red-500/50 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NEW WAY */}
            <div className="bg-neon-green/5 border border-neon-green/30 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_50px_rgba(37,211,102,0.05)] group hover:border-neon-green/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full blur-[50px] group-hover:bg-neon-green/20 transition-all" />
              <div className="flex items-center gap-3 mb-8">
                <CheckCircle2 className="text-neon-green w-8 h-8" />
                <h3 className="text-2xl font-bold text-white">El Sistema QSS (Escalable)</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "Un solo pago. Formularios, Calificación y Agendamiento en una sola plataforma.",
                  "Atención al instante. El setter virtual responde en menos de 2 segundos, 24/7.",
                  "Atraes, filtras y agendas automáticamente. Sin intervención humana.",
                  "Tu equipo de ventas solo habla con prospectos precalificados listos para pagar."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-6 h-6 text-neon-green shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* THE 3 PILLAR JOURNEY (HOW IT WORKS - BENEFIT DRIVEN) */}
      <section className="py-24 px-6 border-t border-white/5 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-16 md:w-2/3">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Un proceso de ventas perfecto, <br className="hidden md:block"/>de principio a fin.</h2>
            <p className="text-xl text-gray-400">Implementa nuestra metodología de 3 pilares comprobada para convertir desconocidos en ventas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <Megaphone className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Adquisición Automática</h3>
              <p className="text-gray-400 leading-relaxed">
                Conecta tus campañas de Google Ads directamente a nuestro sistema. Nosotros nos encargamos de rastrear qué palabras clave te generan más dinero para que dejes de gastar a ciegas.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <Target className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. Aterrizaje de Alta Conversión</h3>
              <p className="text-gray-400 leading-relaxed">
                Despídete de landing pages lentas. Genera "Magic Forms" interactivos diseñados psicológicamente para filtrar curiosos y obtener los datos clave de tu cliente ideal.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <MessageSquare className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Setter Virtual (WhatsApp)</h3>
              <p className="text-gray-400 leading-relaxed">
                En el instante que llenan el form, nuestro setter virtual abre WhatsApp. Conversa fluidamente, rebate objeciones y revisa tu calendario para agendar la cita. Magia pura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BENEFITS (WHAT THEY ACTUALLY WANT) */}
      <section className="py-24 px-6 border-t border-white/5 bg-black/20">
         <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-center">Tus Beneficios Directos</h2>
            
            <div className="grid md:grid-cols-2 gap-4 lg:gap-8">
               <div className="flex gap-4 items-start bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="bg-emerald-500/20 p-3 rounded-xl shrink-0">
                     <DollarSign className="text-emerald-400" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold mb-2">Ahorro Extremo en Costos Operativos</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Sustituye inmediatamente el sueldo de tu equipo de pre-venta o recepcionistas. QSS trabaja domingos, feriados y madrugadas sin pedir aumentos.</p>
                  </div>
               </div>

               <div className="flex gap-4 items-start bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="bg-blue-500/20 p-3 rounded-xl shrink-0">
                     <TrendingUp className="text-blue-400" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold mb-2">Aumento Radical de Tasas de Cierre</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Estadísticamente, si no respondes en menos de 5 minutos, la probabilidad de cierre cae un 80%. QSS responde en 2 segundos siempre.</p>
                  </div>
               </div>

               <div className="flex gap-4 items-start bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="bg-purple-500/20 p-3 rounded-xl shrink-0">
                     <Clock className="text-purple-400" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold mb-2">Recupera tu Tiempo Valioso</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Deja de lidiar con software desconectado y zaps rotos. Todo vive en un solo panel para que puedas enfocarte en cerrar grandes negocios y entregar tu servicio.</p>
                  </div>
               </div>

               <div className="flex gap-4 items-start bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="bg-pink-500/20 p-3 rounded-xl shrink-0">
                     <CheckCircle2 className="text-pink-400" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold mb-2">Calendario Lleno, 0 Fricción</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Te despertarás cada mañana y verás notificaciones de nuevas reuniones agendadas en tu Google Calendar por prospectos altamente calificados.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FINAL AGGRESSIVE CTA + LEADFORM */}
      <section id="demo" className="py-24 lg:py-32 px-6 relative overflow-hidden">
        {/* Massive background glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-neon-green/10 blur-[150px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            Deja de Perder Dinero. <br className="hidden md:block"/>Sistematiza tus Ventas Hoy.
          </h2>
          <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
            No tienes que creernos. Llena el formulario a continuación y vive en carne propia cómo nuestro Master Setter califica y agenda, directo a tu WhatsApp.
          </p>

          <div className="bg-[#0A0D14]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl mx-auto max-w-xl">
             <div className="bg-[#111520] border border-white/5 rounded-[2rem] p-8 md:p-10 text-left relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-emerald-400 to-teal-500" />
               <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center">
                   <Zap className="text-neon-green" size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold text-white">Empieza tu Demostración</h3>
                   <p className="text-gray-400 text-sm">El setter virtual te escribirá de inmediato por WhatsApp.</p>
                 </div>
               </div>
               
               <LeadForm />
               
             </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-[#06080F] text-center text-gray-500 text-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-white opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
             <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs">Q</div>
             QSS
          </div>
          <p>© {new Date().getFullYear()} The Quant Partners. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
