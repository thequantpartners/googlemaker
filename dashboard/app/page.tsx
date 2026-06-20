"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Play, TrendingUp, ShieldCheck, Copy, ArrowRight, PlayCircle, Globe, CheckCircle2, ChevronDown, Zap, BarChart3, Clock, Menu, X } from "lucide-react";
import PricingCards from "./components/PricingCards";
import { AnimatedTestimonials } from "../components/ui/animated-testimonials";

const translations = {
  en: {
    nav_features: "Features",
    nav_how: "How it Works",
    nav_pricing: "Pricing",
    nav_faq: "FAQ",
    nav_signin: "Sign In",
    hero_title1: "Stop Burning Ad Spend.",
    hero_title2: "Scale Your Winners.",
    hero_desc: "The hybrid AI autopilot designed exclusively for marketing agencies and high-growth businesses. We protect your capital from bad clicks and automatically scale campaigns that hit your target CPA.",
    hero_btn1: "Start Free Trial",
    hero_btn2: "See How It Works",
    trusted_by: "TRUSTED BY 50+ SCALING AGENCIES IN US & LATAM",
    chart_title: "Ads Profit Graph",
    chart_sub: "Autopilot Dashboard",
    chart_last30: "Last 30 Days",
    chart_rev: "Revenue Generated",
    chart_saved: "Wasted Spend Saved",
    prob_title: "Manual Bidding is Killing Your Margins.",
    prob_desc: "Agencies and business owners spend hours analyzing spreadsheets, only to realize they've wasted thousands of dollars on weekends or overnight when nobody was watching the campaigns.",
    prob_1_t: "Weekend Waste",
    prob_1_d: "Campaigns often spiral out of control during weekends or holidays when your team is offline. GMaker never sleeps.",
    prob_2_t: "Missed Opportunities",
    prob_2_d: "When a campaign hits a winning streak, human reaction time is too slow to scale it before the trend dies down.",
    prob_3_t: "Emotional Decisions",
    prob_3_d: "Humans pause campaigns too early or hold onto losers too long out of hope. Algorithms rely purely on hard mathematics.",
    how_title: "Autopilot in 3 Simple Steps",
    how_desc: "No complex setups. No code. Just connect and let the engine roar.",
    how_1_t: "Connect Google Ads",
    how_1_d: "Securely link your Google Ads account via standard OAuth. Read-only and edit permissions granted instantly.",
    how_2_t: "Set Target Limits",
    how_2_d: "Define your maximum acceptable CPA (Cost Per Acquisition) and let the engine understand your profit margins.",
    how_3_t: "Autopilot Takes Over",
    how_3_d: "The hybrid engine pauses losers instantly and scales winners aggressively. You review the logs.",
    feat_title: "The Engine Under the Hood",
    feat_desc: "Proprietary logic built by media buyers, for media buyers.",
    feat_1_t: "Vertical Scaling",
    feat_1_d: "When a campaign proves to be highly profitable and sits below your Target CPA, we automatically push daily budgets by 15-20% increments to capture maximum market share before the trend cools off.",
    feat_2_t: "Capital Protection",
    feat_2_d: "Our background CRON job analyzes your spend 24/7. If a campaign spends 1.5x your Target CPA without a single conversion (exiting the Learning Phase), we PAUSE it instantly. No more waking up to wasted budgets.",
    feat_3_t: "Horizontal Cloning",
    feat_3_d: "(Coming Soon) Automatically extract search terms that converted exceptionally well and create parallel exact-match expansion campaigns to dominate specific high-intent keywords.",
    test_title: "Built for Agencies That Demand Results",
    test_1: '"We manage over 20 clients in LatAm. Since hooking them up to GMaker, our team saves around 15 hours a week in manual bid adjustments. The Capital Protection alone paid for the software in day two."',
    test_2: '"Scaling winners was always scary because CPA usually shoots up. This hybrid autopilot scales budgets incrementally. We increased our client\'s revenue by 40% without ruining profitability."',
    price_title: "Simple, Transparent Pricing",
    price_desc: "No percentage of ad spend. Just a flat monthly fee to protect your margins.",
    p_basic: "Basic",
    p_scale: "Scale",
    p_growth: "Growth",
    p_mo: "/mo",
    pb_desc: "Ideal for entrepreneurs and local businesses.",
    ps_desc: "For small agencies and growing businesses.",
    pg_desc: "For large agencies and robust operations.",
    pb_1: "1 Google Ads Account",
    pb_2: "Standard Autopilot",
    pb_3: "Basic Analytics",
    ps_1: "Up to 3 Google Ads Accounts",
    ps_2: "Real-time Hybrid Scaling",
    ps_3: "Hourly Account Sync",
    pg_1: "Unlimited Google Ads Accounts",
    pg_2: "Custom CPA Strategies",
    pg_3: "Priority Background Execution",
    btn_basic: "Start Basic",
    btn_scale: "Start Scale",
    btn_growth: "Start Growth",
    popular: "MOST POPULAR",
    faq_title: "Frequently Asked Questions",
    faq_1_q: "Does it alter my existing campaigns?",
    faq_1_a: "No. GMaker reads your data and only makes specific adjustments (like pausing a bad ad group or increasing a budget by 15%) based on your explicit CPA limits. It never deletes your campaigns or rewrites your ad copy.",
    faq_2_q: "How fast does it react to bad spend?",
    faq_2_a: "Our CRON job scans your connected accounts multiple times a day. If a campaign suddenly spikes and spends over 1.5x your target CPA without a conversion, the system pauses it immediately to protect your capital.",
    faq_3_q: "Do I need to be a developer to use this?",
    faq_3_a: "Absolutely not. You just click 'Connect Google Ads', log in with your Google account, and select your Target CPA on the dashboard. The engine does all the mathematical heavy lifting in the background.",
    foot_title: "Ready to scale your agency?",
    foot_desc: "Join the smartest media buyers automating their Google Ads success.",
    foot_btn: "Create Your Account"
  },
  es: {
    nav_features: "Funciones",
    nav_how: "Cómo Funciona",
    nav_pricing: "Precios",
    nav_faq: "Preguntas Frecuentes",
    nav_signin: "Iniciar Sesión",
    hero_title1: "Deja de Quemar Dinero en Clics Basura.",
    hero_title2: "Consigue Casos en Piloto Automático.",
    hero_desc: "El primer piloto automático de IA diseñado exclusivamente para Firmas de Inmigración en EE. UU. Protegemos tu presupuesto de clics irrelevantes y escalamos las campañas que traen clientes reales. Tú concéntrate en ganar casos, nosotros traemos los leads.",
    hero_btn1: "Prueba Gratuita",
    hero_btn2: "Ver Cómo Funciona",
    trusted_by: "CONFIAN MÁS DE 50 FIRMAS DE INMIGRACIÓN EN EE. UU.",
    chart_title: "Retorno de Inversión (Casos)",
    chart_sub: "Panel de Piloto",
    chart_last30: "Últimos 30 Días",
    chart_rev: "Nuevos Casos Generados",
    chart_saved: "Presupuesto Salvado",
    prob_title: "Google Ads Está Devorando tus Márgenes.",
    prob_desc: "Las firmas de inmigración pagan hasta $50 por clic. Pierdes miles de dólares en personas buscando 'abogados gratis' o llamando fuera de horas, mientras tus mejores campañas se quedan sin presupuesto.",
    prob_1_t: "Clics Basura Constantes",
    prob_1_d: "Personas buscando asilo gratis o en estados donde no ejerces agotan tu presupuesto antes del mediodía. GMaker los bloquea 24/7.",
    prob_2_t: "Agencias Costosas y Lentas",
    prob_2_d: "Pagas miles al mes a agencias que revisan tu cuenta una vez por semana. Nuestro algoritmo optimiza tus campañas cada hora, sin días libres.",
    prob_3_t: "Falta de Tiempo",
    prob_3_d: "Eres abogado, no un experto en marketing. Ajustar pujas y analizar métricas te quita tiempo valioso que deberías dedicar a tus clientes.",
    how_title: "Tu Máquina de Casos en 3 Pasos",
    how_desc: "Sin código ni configuraciones confusas. Conecta tu cuenta y activa el piloto automático.",
    how_1_t: "Conecta tu Cuenta",
    how_1_d: "Vincula tu cuenta de Google Ads de forma segura. GMaker lee tu historial y entiende qué tipo de casos son los más rentables para tu firma.",
    how_2_t: "Fija tu Costo por Caso",
    how_2_d: "Dile al sistema cuánto estás dispuesto a pagar por una consulta cualificada (CPA). Ese es nuestro único objetivo.",
    how_3_t: "El Piloto Automático Trabaja",
    how_3_d: "El algoritmo apaga los anuncios que solo gastan y empuja agresivamente los que traen clientes que sí pagan. Así de simple.",
    feat_title: "Tecnología LegalTech Avanzada",
    feat_desc: "El único software que entiende el valor de un caso de inmigración.",
    feat_1_t: "Escalado de Consultas",
    feat_1_d: "Cuando detectamos que una campaña de 'Visas de Trabajo' o 'Petición Familiar' está atrayendo clientes por debajo de tu costo ideal, el piloto aumenta el presupuesto un 15% automáticamente para dominar tu ciudad.",
    feat_2_t: "Escudo Anti-Fraude",
    feat_2_d: "Nuestro centinela monitorea tu inversión cada segundo. Si un anuncio empieza a recibir clics caros sin generar llamadas o formularios, se PAUSA al instante. Se acabó el regalarle dinero a Google.",
    feat_3_t: "Dominio de Palabras Clave",
    feat_3_d: "(Próximamente) El sistema detectará los términos exactos que usan los migrantes para encontrarte y creará campañas blindadas para asegurar que siempre aparezcas primero cuando más te necesitan.",
    test_title: "Diseñado para Abogados que Quieren Crecer",
    test_1: '\"Antes gastábamos $10,000 al mes en Google y la mitad eran llamadas buscando ayuda gratis. Desde que activamos el Piloto Automático de GMaker, nuestro costo por caso bajó un 40% y la calidad de las consultas es excelente.\"',
    test_2: '\"No tengo tiempo para entrar a Google Ads. Este software es como tener a un especialista trabajando 24/7. El escudo protegió nuestro presupuesto un fin de semana que hubo un pico de clics irrelevantes. Se pagó solo.\"',
    price_title: "Inversión Transparente",
    price_desc: "Una tarifa plana que cuesta menos que una hora de tu tiempo facturable.",
    p_basic: "Básico",
    p_scale: "Firma",
    p_growth: "Socio",
    p_mo: "/mes",
    pb_desc: "Para abogados independientes empezando a anunciarse.",
    ps_desc: "Para firmas establecidas buscando escalar sus casos.",
    pg_desc: "Para bufetes grandes con múltiples ubicaciones.",
    pb_1: "1 Cuenta de Google Ads",
    pb_2: "Piloto Automático Estándar",
    pb_3: "Protección Diaria",
    ps_1: "Hasta 3 Cuentas de Ads",
    ps_2: "Escalado de Casos en Tiempo Real",
    ps_3: "Escudo Protector por Hora",
    pg_1: "Cuentas de Ads Ilimitadas",
    pg_2: "Estrategias por Tipo de Caso",
    pg_3: "Soporte Prioritario para Firmas",
    btn_basic: "Empezar Básico",
    btn_scale: "Empezar Firma",
    btn_growth: "Empezar Socio",
    popular: "MÁS POPULAR",
    faq_title: "Preguntas Frecuentes para Abogados",
    faq_1_q: "¿Tienen acceso a la información confidencial de mis clientes?",
    faq_1_a: "No. GMaker solo se conecta a la API de Google Ads para leer métricas de clics, costos y conversiones. No tenemos acceso a tu CRM, correos electrónicos, ni nombres de tus clientes. Todo es 100% confidencial y seguro.",
    faq_2_q: "¿Qué pasa si Google Ads cambia algo, me avisan?",
    faq_2_a: "No tienes que preocuparte. El piloto automático se adapta a las fluctuaciones del mercado. Si el costo por clic sube repentinamente en tu área, el sistema ajustará o pausará la campaña automáticamente para proteger tu inversión.",
    faq_3_q: "¿Funciona si mi campaña está en español y en inglés?",
    faq_3_a: "Totalmente. El algoritmo de GMaker no juzga el idioma, juzga las matemáticas. Identificará rápidamente qué campañas te están trayendo casos al mejor precio.",
    foot_title: "¿Listo para llenar tu agenda de clientes?",
    foot_desc: "Únete a las firmas de inmigración más inteligentes que ya automatizan su captación de casos.",
    foot_btn: "Activar mi Piloto Automático"
  }
};

const enTestimonials = [
  {
    quote: "We manage over 20 clients in LatAm. Since hooking them up to GMaker, our team saves around 15 hours a week in manual bid adjustments. The Capital Protection alone paid for the software in day two.",
    name: "Carlos Rodriguez",
    designation: "Founder at GrowthX Agency",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop"
  },
  {
    quote: "Scaling winners was always scary because CPA usually shoots up. This hybrid autopilot scales budgets incrementally. We increased our client's revenue by 40% without ruining profitability.",
    name: "Sarah Thompson",
    designation: "Senior Media Buyer, US Ads",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop"
  },
  {
    quote: "I used to wake up to thousands of dollars wasted overnight on bad clicks. GMaker's 24/7 monitoring catches spikes before they become disasters. It's like having a senior media buyer that never sleeps.",
    name: "Elena Martinez",
    designation: "Managing Partner, Martinez Law Group",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop"
  },
  {
    quote: "The interface is incredibly intuitive. I connected our Google Ads account in 2 minutes, set our target CPA for family petitions, and the engine just took over. My caseload has doubled.",
    name: "David Chen",
    designation: "Immigration Attorney, Chen & Associates",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop"
  },
  {
    quote: "We fired our expensive ad agency and switched entirely to GMaker. Not only did we save $3,000/mo in retainer fees, but our actual cost-per-lead dropped by 35%. Best investment we've made.",
    name: "Fatima Al-Jamil",
    designation: "Marketing Director, Apex Legal",
    src: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1887&auto=format&fit=crop"
  }
];

const esTestimonials = [
  {
    quote: "Antes gastábamos $10,000 al mes en Google y la mitad eran llamadas buscando ayuda gratis. Desde que activamos el Piloto Automático de GMaker, nuestro costo por caso bajó un 40%.",
    name: "Carlos Rodriguez",
    designation: "Socio Fundador, GrowthX Law",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop"
  },
  {
    quote: "No tengo tiempo para entrar a Google Ads. Este software es como tener a un especialista trabajando 24/7. El escudo protegió nuestro presupuesto un fin de semana que hubo un pico de clics irrelevantes.",
    name: "Sarah Thompson",
    designation: "Directora de Marketing, US Ads",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop"
  },
  {
    quote: "Solía despertarme viendo miles de dólares desperdiciados en la madrugada. El monitoreo 24/7 de GMaker detecta estas anomalías antes de que sean un desastre. Me devolvió la tranquilidad.",
    name: "Elena Martinez",
    designation: "Socia Directora, Martinez Abogados",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop"
  },
  {
    quote: "La plataforma es increíblemente intuitiva. Conecté nuestra cuenta de Google Ads en 2 minutos, definí el CPA para casos de asilo y el motor hizo el resto. Nuestros casos se han duplicado.",
    name: "David Chen",
    designation: "Abogado de Inmigración, Chen & Asociados",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop"
  },
  {
    quote: "Despedimos a nuestra costosa agencia y pasamos todo a GMaker. No solo ahorramos $3,000/mes, sino que nuestro costo por cliente bajó 35%. La mejor inversión tecnológica del año.",
    name: "Fatima Al-Jamil",
    designation: "Directora Operativa, Apex Legal",
    src: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1887&auto=format&fit=crop"
  }
];

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("en");

  const toggleLang = () => setLang(prev => prev === "en" ? "es" : "en");
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative selection:bg-neon-purple selection:text-white font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] rounded-full bg-neon-blue/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-neon-purple/20 blur-[150px] pointer-events-none" />
      
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple font-bold text-lg">
            G
          </div>
          <span className="font-semibold text-xl tracking-tight">GMaker</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">{t.nav_features}</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">{t.nav_how}</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">{t.nav_pricing}</Link>
          <Link href="#faq" className="hover:text-white transition-colors">{t.nav_faq}</Link>
        </div>

        <div className="flex items-center gap-4">
          <div 
            onClick={toggleLang}
            className="hidden sm:flex items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium px-2 py-1 rounded-md hover:bg-white/5"
          >
            <Globe size={16} /> {lang === "en" ? "EN" : "ES"}
          </div>
          <Link 
            href="/login" 
            className="hidden md:inline-flex px-5 py-2.5 rounded-full bg-dark-card border border-dark-card-border text-sm font-medium hover:bg-white/10 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            {t.nav_signin}
          </Link>
          <button 
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-6 right-6 bg-dark-card border border-dark-card-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col gap-6 backdrop-blur-xl">
          <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t.nav_features}</Link>
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t.nav_how}</Link>
          <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t.nav_pricing}</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">{t.nav_faq}</Link>
          <hr className="border-dark-card-border" />
          <div className="flex items-center justify-between">
            <button onClick={() => {toggleLang(); setIsMobileMenuOpen(false);}} className="flex items-center gap-1 text-gray-400 text-sm font-medium">
              <Globe size={16} /> {lang === "en" ? "Switch to ES" : "Switch to EN"}
            </button>
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-sm font-medium text-white text-center shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              {t.nav_signin}
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto pt-16 lg:pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neon-blue w-max">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
              </span>
              Google Ads API v31 Supported
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                {t.hero_title1} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-pink-500">
                  {t.hero_title2}
                </span>
              </h1>
            </div>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              {t.hero_desc}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link 
                href="/login" 
                className="group relative px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full font-semibold text-white overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t.hero_btn1}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="px-6 py-4 rounded-full font-medium text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-colors border border-white/10 sm:border-transparent">
                <PlayCircle size={20} className="text-neon-purple" />
                {t.hero_btn2}
              </button>
            </div>
            
            <div className="pt-8 border-t border-dark-card-border mt-4">
              <p className="text-sm text-gray-500 font-medium mb-4 text-center lg:text-left">{t.trusted_by}</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-8 opacity-50 grayscale">
                <div className="font-bold text-lg md:text-xl tracking-tighter">AGENCY<span className="text-neon-blue">PRO</span></div>
                <div className="font-bold text-lg md:text-xl tracking-tighter">LATAM<span className="text-neon-purple">MARKETING</span></div>
                <div className="font-bold text-lg md:text-xl tracking-tighter">GROWTH<span className="text-neon-green">X</span></div>
              </div>
            </div>
          </div>

          {/* Right Visual (Glassmorphic Graph Card) */}
          <div className="relative w-full aspect-square max-w-[600px] mx-auto lg:mx-0 animate-glow hidden md:block">
            {/* Abstract wireframe glow behind card */}
            <div className="absolute inset-0 rounded-[2rem] border border-neon-blue/30 scale-105 transform rotate-3" />
            <div className="absolute inset-0 rounded-[2rem] border border-neon-purple/30 scale-110 transform -rotate-2" />
            
            {/* Main Glass Card */}
            <div className="relative h-full w-full bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-8 shadow-2xl flex flex-col">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="font-semibold text-lg text-white">{t.chart_title}</h3>
                  <p className="text-sm text-gray-400">{t.chart_sub}</p>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1">
                  {t.chart_last30} <ChevronDown size={12} />
                </div>
              </div>

              {/* Badges Floating */}
              <div className="absolute left-[-20px] top-[40%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform -rotate-3 z-20">
                <div className="text-2xl font-bold text-white">$1.2M+</div>
                <div className="text-xs text-gray-400">{t.chart_rev}</div>
              </div>

              <div className="absolute right-[-10px] bottom-[20%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform rotate-6 z-20">
                <div className="text-2xl font-bold text-white text-red-400">$12k</div>
                <div className="text-xs text-gray-400">{t.chart_saved}</div>
              </div>

              {/* The Chart lines (simulated with SVG) */}
              <div className="flex-1 w-full relative mt-auto z-10">
                <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  
                  {/* Purple subtle line */}
                  <path 
                    d="M 0 180 Q 50 150 100 160 T 200 120 T 300 140 T 400 50" 
                    fill="none" 
                    stroke="#A855F7" 
                    strokeWidth="3" 
                    strokeDasharray="6 6" 
                    opacity="0.5" 
                  />
                  
                  {/* Main Glowing Line */}
                  <path 
                    d="M 0 150 C 100 180, 150 50, 250 80 S 300 120, 400 20" 
                    fill="none" 
                    stroke="url(#lineGrad)" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    filter="url(#glow)" 
                  />
                  
                  <circle cx="100" cy="120" r="6" fill="#0B0E14" stroke="#A855F7" strokeWidth="3" />
                  <circle cx="250" cy="80" r="6" fill="#0B0E14" stroke="#3B82F6" strokeWidth="3" />
                  <circle cx="400" cy="20" r="8" fill="#fff" filter="url(#glow)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* The Problem Section */}
      <section className="relative z-10 py-24 bg-black/40 border-y border-dark-card-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t.prob_title}</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16 text-lg">
            {t.prob_desc}
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-red-500 mb-4 bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><Clock size={24} /></div>
              <h3 className="text-xl font-bold mb-2">{t.prob_1_t}</h3>
              <p className="text-gray-400">{t.prob_1_d}</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-orange-500 mb-4 bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><BarChart3 size={24} /></div>
              <h3 className="text-xl font-bold mb-2">{t.prob_2_t}</h3>
              <p className="text-gray-400">{t.prob_2_d}</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-yellow-500 mb-4 bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><Zap size={24} /></div>
              <h3 className="text-xl font-bold mb-2">{t.prob_3_t}</h3>
              <p className="text-gray-400">{t.prob_3_d}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.how_title}</h2>
            <p className="text-gray-400 text-lg">{t.how_desc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green -translate-y-1/2 opacity-20" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-blue flex items-center justify-center text-2xl font-bold text-neon-blue mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">1</div>
              <h3 className="text-xl font-bold mb-3">{t.how_1_t}</h3>
              <p className="text-gray-400">{t.how_1_d}</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-purple flex items-center justify-center text-2xl font-bold text-neon-purple mb-6 shadow-[0_0_20px_rgba(168,85,247,0.3)]">2</div>
              <h3 className="text-xl font-bold mb-3">{t.how_2_t}</h3>
              <p className="text-gray-400">{t.how_2_d}</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-green flex items-center justify-center text-2xl font-bold text-neon-green mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">3</div>
              <h3 className="text-xl font-bold mb-3">{t.how_3_t}</h3>
              <p className="text-gray-400">{t.how_3_d}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto pb-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.feat_title}</h2>
          <p className="text-gray-400 text-lg">{t.feat_desc}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-purple/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-transparent flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-neon-purple" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t.feat_1_t}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t.feat_1_d}
            </p>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-blue/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-transparent flex items-center justify-center mb-6 border border-neon-blue/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-neon-blue" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t.feat_2_t}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t.feat_2_d}
            </p>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-green/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/20 to-transparent flex items-center justify-center mb-6 border border-neon-green/20 group-hover:scale-110 transition-transform">
              <Copy className="text-neon-green" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t.feat_3_t}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t.feat_3_d}
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials (Social Proof) */}
      <section className="relative z-10 py-24 bg-[#0B0E14] border-y border-dark-card-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.test_title}</h2>
          <AnimatedTestimonials testimonials={lang === 'en' ? enTestimonials : esTestimonials} />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.price_title}</h2>
          <p className="text-gray-400 text-lg mb-16">{t.price_desc}</p>
          
          <PricingCards isLandingPage={true} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-24 bg-black/40 border-t border-dark-card-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.faq_title}</h2>
          <div className="space-y-4">
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                {t.faq_1_q}
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                {t.faq_1_a}
              </p>
            </details>
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                {t.faq_2_q}
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                {t.faq_2_a}
              </p>
            </details>
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                {t.faq_3_q}
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                {t.faq_3_a}
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final Glowing Footer CTA */}
      <footer className="relative z-10 py-24 text-center border-t border-dark-card-border overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-neon-blue/20 blur-[150px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">{t.foot_title}</h2>
          <p className="text-xl text-gray-400 mb-10">{t.foot_desc}</p>
          <Link 
            href="/login" 
            className="inline-flex px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            {t.foot_btn}
          </Link>
          <div className="mt-16 border-t border-dark-card-border/50 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
            <div className="mb-4 md:mb-0">
              © 2026 GMaker. Built by TheQuantPartners.
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/refunds" className="hover:text-white transition-colors">Refund Policy</Link>
              <a href="mailto:partners@thequantpartners.com" className="hover:text-white transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
