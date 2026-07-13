"use client";

import Link from "next/link";
import { CheckCircle2, PlayCircle, XCircle, ArrowRight, Bot, Target, CalendarDays, ShieldCheck, Zap, LineChart } from "lucide-react";
import LeadForm from "@/components/LeadForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080F] text-white selection:bg-[#25D366]/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* GLOBAL NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06080F]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(37,211,102,0.3)]">
              Q
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">QSS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors hidden sm:block">
              Iniciar Sesión
            </Link>
            <Link 
              href="/login" 
              className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-lg"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Glows */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#25D366]/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-xs font-bold text-[#25D366] tracking-widest uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
            </span>
            Atención Agencias y Firmas B2B
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight mb-8">
            El Primer Sistema Todo-en-Uno Que <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">Captura, Califica y Cierra</span> Leads por WhatsApp.
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto font-light mb-12">
            Reemplaza a tu recepcionista humano y elimina tu ecosistema fragmentado de herramientas. 
            Nuestra IA responde en 2 segundos, 24/7, agendando citas automáticamente.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link 
              href="/login" 
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#25D366] text-black text-xl font-black rounded-2xl overflow-hidden hover:scale-105 transition-all shadow-[0_0_40px_rgba(37,211,102,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Comienza tu Prueba de 14 Días</span>
              <ArrowRight className="relative z-10 w-6 h-6" />
            </Link>
            <p className="text-sm text-gray-500 font-medium">Configuración en 5 minutos • No requiere tarjeta de crédito</p>
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
              <div className="w-20 h-20 md:w-28 md:h-28 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,211,102,0.5)] group-hover:scale-110 transition-transform duration-300">
                <PlayCircle className="w-10 h-10 md:w-14 md:h-14 text-black ml-2" />
              </div>
              <p className="mt-6 font-bold text-white tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">VER DEMOSTRACIÓN COMPLETA</p>
            </div>

            {/* Thumbnail Mock */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2850&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-700" />
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-12 border-y border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-gray-600 tracking-[0.2em] uppercase mb-8">Utilizado por las firmas de mayor crecimiento</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            {/* Fake logos using text for now, but keeping them sleek */}
            <span className="font-black text-2xl tracking-tighter">AcmeLaw</span>
            <span className="font-black text-2xl tracking-widest">GLOBAL REALTY</span>
            <span className="font-bold text-2xl italic">MedCare</span>
            <span className="font-extrabold text-2xl">NEXUS AGENCIA</span>
          </div>
        </div>
      </section>

      {/* OLD WAY VS NEW WAY */}
      <section className="py-24 lg:py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Por qué las herramientas actuales te hacen perder dinero</h2>
            <p className="text-xl text-gray-400">Deja de unir piezas con cinta adhesiva. Consolida tu negocio.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* OLD WAY */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px]" />
              <div className="flex items-center gap-3 mb-8">
                <XCircle className="text-red-500 w-8 h-8" />
                <h3 className="text-2xl font-bold text-white">El Viejo Camino</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "Pagas por Zapier, Calendly, Typeform y Mailchimp por separado.",
                  "Tus leads esperan horas a que un humano les responda por WhatsApp.",
                  "Riesgo altísimo de baneos de WhatsApp al intentar automatizar sin API Oficial.",
                  "Los prospectos se enfrían y se van con la competencia."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <XCircle className="w-6 h-6 text-red-500/50 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NEW WAY */}
            <div className="bg-[#25D366]/5 border border-[#25D366]/30 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_50px_rgba(37,211,102,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/10 rounded-full blur-[50px]" />
              <div className="flex items-center gap-3 mb-8">
                <CheckCircle2 className="text-[#25D366] w-8 h-8" />
                <h3 className="text-2xl font-bold text-white">El Sistema QSS</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "Un solo pago mensual. Tienes formularios, CRM, agenda y bot integrados.",
                  "Nuestra IA pre-entrenada atiende y califica en menos de 2 segundos.",
                  "Modo Anti-Ban nativo con retrasos simulados y horarios comerciales.",
                  "Conversiones disparadas al atender a tus clientes cuando están calientes."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-6 h-6 text-[#25D366] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (BENTO GRID) */}
      <section className="py-24 px-6 bg-black/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 md:w-2/3">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Captura, Nutre y Cierra.<br />Todo en piloto automático.</h2>
            <p className="text-xl text-gray-400">Una infraestructura diseñada obsesivamente para convertir tráfico en ventas tangibles.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="md:col-span-2 bg-[#0B0E14] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-[#25D366]/10 group-hover:border-[#25D366]/30 transition-all">
                <Target className="text-white group-hover:text-[#25D366] transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Captura (Smart Forms)</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                No uses más formularios aburridos. Nuestros Smart Forms inician directamente una conversación de WhatsApp al enviarse, saltando la fricción del correo electrónico.
              </p>
              {/* Mini visual */}
              <div className="h-32 rounded-xl bg-gradient-to-r from-black to-white/5 border border-white/5 flex items-center justify-start p-6">
                 <div className="w-full max-w-sm space-y-3">
                   <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                   <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                   <div className="h-8 w-1/3 bg-[#25D366] rounded-md mt-4" />
                 </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-[#25D366]/10 group-hover:border-[#25D366]/30 transition-all">
                <Bot className="text-white group-hover:text-[#25D366] transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. Nutre (IA Humanizada)</h3>
              <p className="text-gray-400 leading-relaxed">
                Asignamos un Master Bot a tu agencia. Él se encarga de calificar al prospecto simulando pausas humanas para evitar bloqueos de Meta.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-[#25D366]/10 group-hover:border-[#25D366]/30 transition-all">
                <CalendarDays className="text-white group-hover:text-[#25D366] transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Cierra (Agendamiento)</h3>
              <p className="text-gray-400 leading-relaxed">
                El bot revisa tu Google Calendar en tiempo real y ofrece horarios disponibles, cerrando la cita sin intervención humana.
              </p>
            </div>

            {/* Card 4 */}
            <div className="md:col-span-2 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366]/20 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#25D366] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <ShieldCheck className="text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">YCloud Oficial & Modo Baileys</h3>
                <p className="text-gray-300 leading-relaxed max-w-lg mb-6">
                  Ya sea que quieras la seguridad corporativa de la API Oficial de Meta (YCloud) o la flexibilidad extrema de Baileys para números personales, QSS soporta ambas infraestructuras nativamente.
                </p>
                <div className="flex gap-4">
                   <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold">API META</span>
                   <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold">BAILEYS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL AGGRESSIVE CTA + LEADFORM */}
      <section className="py-24 lg:py-32 px-6 relative overflow-hidden">
        {/* Massive background glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#25D366]/10 blur-[150px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            No pierdas otro Lead por <br className="hidden md:block"/>responder tarde.
          </h2>
          <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
            Vive la experiencia ahora mismo. Llena el formulario y nuestro Master Bot te enviará una demo interactiva directamente a tu WhatsApp personal.
          </p>

          <div className="bg-[#0A0D14]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl mx-auto max-w-xl">
             <div className="bg-[#111520] border border-white/5 rounded-[2rem] p-8 md:p-10 text-left">
               <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                   <Zap className="text-[#25D366]" size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold text-white">Recibe tu Demo</h3>
                   <p className="text-gray-400 text-sm">Prueba el sistema en vivo por WhatsApp</p>
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
          <div className="flex items-center gap-2 font-bold text-white opacity-50">
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
