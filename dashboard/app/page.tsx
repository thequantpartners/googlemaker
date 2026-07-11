"use client";

import Link from "next/link";
import { CheckCircle2, Bot, Clock, MessageSquare, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative selection:bg-neon-purple selection:text-white font-sans pb-24 md:pb-0">
      {/* Ambient background glows */}
      <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] rounded-full bg-neon-purple/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-neon-blue/20 blur-[150px] pointer-events-none" />
      
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Navigation (Simple) */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="text-neon-purple" /> QSS
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition px-4 py-2">
            Iniciar Sesión
          </Link>
          <Link href="/login" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition">
            Crear Cuenta
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 max-w-5xl mx-auto pt-16 lg:pt-24 pb-16 text-center">
        <div className="flex flex-col gap-8 items-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-neon-purple">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple"></span>
            </span>
            El Autopilot para WhatsApp
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
            El Recepcionista IA para<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink mt-2 block">
              Empresas y Agencias
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-3xl font-light mt-4">
            Atiende a tus clientes 24/7, califica prospectos en WhatsApp y agenda citas automáticamente. Plantillas pre-entrenadas para Clínicas, Inmobiliarias, Abogados y más.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-neon-purple text-lg font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
            >
              Comenzar Prueba Gratis <ArrowRight size={20} />
            </Link>
            <Link 
              href="#caracteristicas" 
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </main>

      {/* Snapshots (Industries) Section */}
      <section className="relative z-10 py-16" id="caracteristicas">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-8">Un Snapshot para cada Industria</h2>
          <div className="flex flex-wrap justify-center gap-4 opacity-80">
            {['Salud & Clínicas', 'Firmas Legales', 'Bienes Raíces', 'Agencias de Marketing', 'Gimnasios', 'Restaurantes'].map((niche) => (
              <span key={niche} className="px-6 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-gray-300 font-medium">
                {niche}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 bg-black/40 border-y border-dark-card-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">Todo lo que necesitas para escalar</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left relative">
            {/* Card 1 */}
            <div className="group relative bg-[#0a0a0b]/80 backdrop-blur-sm border border-white/5 p-8 rounded-[2rem] hover:border-neon-purple/30 transition-all duration-500 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-purple/10 rounded-full blur-[60px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-neon-purple/20 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-neon-purple/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <Clock className="text-neon-purple w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Cero Tiempos de Espera</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  Responde al instante a cada lead que entra por WhatsApp. La IA conversa como un humano, haciendo preguntas clave para calificar al cliente antes de pasarlo a un vendedor.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-[#0a0a0b]/80 backdrop-blur-sm border border-white/5 p-8 rounded-[2rem] hover:border-neon-blue/30 transition-all duration-500 overflow-hidden shadow-2xl mt-4 md:mt-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-blue/10 rounded-full blur-[60px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-neon-blue/20 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-neon-blue/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <Bot className="text-neon-blue w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Modelos Entrenados</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  No necesitas programar prompts. Nuestros "Snapshots" ya saben cómo agendar citas para un doctor o pedir el presupuesto a un comprador de inmuebles. Solo actívalo y listo.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-[#0a0a0b]/80 backdrop-blur-sm border border-white/5 p-8 rounded-[2rem] hover:border-neon-pink/30 transition-all duration-500 overflow-hidden shadow-2xl mt-4 md:mt-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-pink/10 rounded-full blur-[60px] -mr-10 -mt-10 transition-all duration-700 group-hover:bg-neon-pink/20 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-neon-pink/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <MessageSquare className="text-neon-pink w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">API Oficial o Código QR</h3>
                <p className="text-gray-400 leading-relaxed text-base">
                  Empieza hoy mismo escaneando un código QR (modo prueba) o conecta la API Oficial de Meta (YCloud) para escalar a miles de mensajes sin riesgo de bloqueo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Deja de perder ventas por responder tarde</h2>
          <p className="text-xl text-gray-400 mb-10">Regístrate ahora y configura tu primer recepcionista de IA en menos de 5 minutos.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-white text-black text-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <Link 
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-neon-purple text-lg font-bold text-white text-center shadow-[0_0_20px_rgba(139,92,246,0.3)]"
        >
          Empezar Ahora
        </Link>
      </div>
    </div>
  );
}
