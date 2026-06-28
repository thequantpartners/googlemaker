"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Play, TrendingUp, ShieldCheck, Copy, ArrowRight, PlayCircle, Globe, CheckCircle2, ChevronDown, Zap, BarChart3, Clock, Menu, X, MessageCircle } from "lucide-react";
import PricingCards from "./components/PricingCards";
import { AnimatedTestimonials } from "../components/ui/animated-testimonials";

const testimonials = [
  {
    quote: "We used to spend $10,000 a month on Google and half were calls looking for free help. Since we turned on QSS's Autopilot, our cost per case dropped 40% and the consultation quality is excellent.",
    name: "Carlos Rodriguez",
    designation: "Founding Partner, GrowthX Law",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop"
  },
  {
    quote: "I don't have time to log into Google Ads. The Telegram bot sends me instant notifications when we get a new lead, and the Autopilot handles the rest. It's like having a specialist working 24/7.",
    name: "Sarah Thompson",
    designation: "Marketing Director, US Legal Ads",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop"
  },
  {
    quote: "The AI Strategist is mind-blowing. It analyzed our website and created complete, high-converting Google Ads campaigns in minutes. It saved us weeks of copywriting work.",
    name: "Elena Martinez",
    designation: "Managing Partner, Martinez Law Group",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop"
  },
  {
    quote: "The interface is incredibly intuitive. I connected our Google Ads account in 2 minutes, set our CPA for asylum cases, and the engine did the rest. Our caseload has doubled.",
    name: "David Chen",
    designation: "Immigration Attorney, Chen & Associates",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop"
  },
  {
    quote: "We fired our expensive ad agency and switched entirely to QSS. Not only did we save $3,000/mo, but our actual cost per client dropped by 35%. Best legal tech investment of the year.",
    name: "Fatima Al-Jamil",
    designation: "Managing Director, Apex Legal",
    src: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1887&auto=format&fit=crop"
  }
];

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <span className="font-semibold text-xl tracking-tight">QSS</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="hidden md:inline-flex px-5 py-2.5 rounded-full bg-dark-card border border-dark-card-border text-sm font-medium hover:bg-white/10 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            Sign In
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
          <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">Features</Link>
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">How it Works</Link>
          <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">Pricing</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">FAQ</Link>
          <hr className="border-dark-card-border" />
          <div className="flex justify-center">
            <Link 
              href="/login" 
              className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-base font-bold text-white text-center shadow-[0_0_15px_rgba(168,85,247,0.4)] w-full"
            >
              Sign In
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
                Stop Burning Money on Junk Clicks.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-pink-500">
                  Get Cases on Autopilot.
                </span>
              </h1>
            </div>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              The first AI autopilot built exclusively for US Immigration Law Firms. We protect your ad budget from irrelevant clicks, automate your campaign strategies, and send real-time leads directly to your Telegram. You focus on winning cases, we bring the leads.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link 
                href="/login" 
                className="group relative px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full font-semibold text-white overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start 14-Day Free Trial
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="px-6 py-4 rounded-full font-medium text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-colors border border-white/10 sm:border-transparent">
                <PlayCircle size={20} className="text-neon-purple" />
                See How It Works
              </button>
            </div>
            
            <div className="pt-8 border-t border-dark-card-border mt-4">
              <p className="text-sm text-gray-500 font-medium mb-4 text-center lg:text-left">TRUSTED BY 50+ IMMIGRATION LAW FIRMS ACROSS THE US</p>
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
                  <h3 className="font-semibold text-lg text-white">Return on Investment (Cases)</h3>
                  <p className="text-sm text-gray-400">Autopilot Dashboard</p>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1">
                  Last 30 Days <ChevronDown size={12} />
                </div>
              </div>

              {/* Badges Floating */}
              <div className="absolute left-[-20px] top-[40%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform -rotate-3 z-20">
                <div className="text-2xl font-bold text-white">$1.2M+</div>
                <div className="text-xs text-gray-400">New Cases Generated</div>
              </div>

              <div className="absolute right-[-10px] bottom-[20%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform rotate-6 z-20">
                <div className="text-2xl font-bold text-white text-red-400">$12k</div>
                <div className="text-xs text-gray-400">Budget Saved</div>
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
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Google Ads is Devouring Your Margins.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16 text-lg">
            Immigration firms pay up to $50 per click. You lose thousands of dollars on people searching for 'free lawyers' or calling after hours, while your best campaigns run out of budget.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-red-500 mb-4 bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><Clock size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Constant Junk Clicks</h3>
              <p className="text-gray-400">People looking for free asylum help or out-of-state services drain your budget by noon. QSS blocks them 24/7.</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-orange-500 mb-4 bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><BarChart3 size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Slow & Expensive Agencies</h3>
              <p className="text-gray-400">You pay thousands a month to agencies that check your account once a week. Our algorithm optimizes your campaigns every single hour, no days off.</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-yellow-500 mb-4 bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><Zap size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Lack of Time</h3>
              <p className="text-gray-400">You're an attorney, not a marketing expert. Adjusting bids and analyzing metrics takes away valuable time you should be dedicating to your clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Your Case-Generating Machine in 3 Steps</h2>
            <p className="text-gray-400 text-lg">No coding or confusing setups. Connect your account and turn on the autopilot.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green opacity-20" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-blue flex items-center justify-center text-2xl font-bold text-neon-blue mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">1</div>
              <h3 className="text-xl font-bold mb-3">Connect Your Accounts</h3>
              <p className="text-gray-400">Securely link your Google Ads account and connect our Telegram Bot. QSS reads your history and prepares your notification channels.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-purple flex items-center justify-center text-2xl font-bold text-neon-purple mb-6 shadow-[0_0_20px_rgba(168,85,247,0.3)]">2</div>
              <h3 className="text-xl font-bold mb-3">Generate AI Strategy</h3>
              <p className="text-gray-400">Input your website URL and let our AI Marketing Strategist automatically craft high-converting campaigns and ad copy tailored for your firm.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-green flex items-center justify-center text-2xl font-bold text-neon-green mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">3</div>
              <h3 className="text-xl font-bold mb-3">Autopilot Takes Over</h3>
              <p className="text-gray-400">The algorithm shuts down ads that only spend and scales winners. You get real-time lead notifications directly to your phone via Telegram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto pb-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Advanced LegalTech Technology</h2>
          <p className="text-gray-400 text-lg">The only software suite built specifically for immigration attorneys.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-purple/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-transparent flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-neon-purple" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Full Autopilot Optimization</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Our algorithm analyzes your campaigns every single hour. It automatically adjusts bids, pauses underperforming ads, and scales budgets on the campaigns bringing in qualified consultation calls.
            </p>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-blue/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-transparent flex items-center justify-center mb-6 border border-neon-blue/20 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-neon-blue" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Telegram Bot Integration</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Never miss a client. Our dedicated Telegram bot sends you instant, real-time push notifications the exact second a new lead submits a form or makes a call, straight to your phone.
            </p>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-green/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/20 to-transparent flex items-center justify-center mb-6 border border-neon-green/20 group-hover:scale-110 transition-transform">
              <Zap className="text-neon-green" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Marketing Strategist</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Just type your website URL, and our AI Strategist will instantly scrape your firm's value propositions to generate dozens of highly targeted, proven ad headlines and keywords.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials (Social Proof) */}
      <section className="relative z-10 py-24 bg-[#0B0E14] border-y border-dark-card-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-12 text-center">Built for Attorneys Who Want to Grow</h2>
          <AnimatedTestimonials testimonials={testimonials} />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Transparent Investment</h2>
          <p className="text-gray-400 text-lg mb-16 max-w-2xl mx-auto">A flat rate that costs less than one hour of your billable time.</p>
          
          <PricingCards isLandingPage={true} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-24 bg-black/40 border-t border-dark-card-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions for Attorneys</h2>
          <div className="space-y-4">
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                Do you have access to my clients' confidential information?
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                No. QSS only connects to the Google Ads API to read click, cost, and conversion metrics. We have absolutely no access to your CRM, emails, or client names. Everything is 100% confidential and secure.
              </p>
            </details>
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                What happens if Google Ads changes something, will I be notified?
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                You don't have to worry. The autopilot adapts to market fluctuations. Our Telegram Bot integration will send you immediate alerts if budgets are exceeded or if critical ad issues arise.
              </p>
            </details>
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                Does it work if my campaign is in Spanish and English?
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Absolutely. QSS's algorithm doesn't judge the language, it judges the math. It will quickly identify which campaigns are bringing you cases at the best price, regardless of language.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final Glowing Footer CTA */}
      <footer className="relative z-10 py-24 text-center border-t border-dark-card-border overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-neon-blue/20 blur-[150px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to fill your calendar with paying clients?</h2>
          <p className="text-xl text-gray-400 mb-10">Join the smartest immigration law firms already automating their case acquisition.</p>
          <Link 
            href="/login" 
            className="inline-flex px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Activate My Autopilot
          </Link>
          <div className="mt-16 border-t border-dark-card-border/50 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
            <div className="mb-4 md:mb-0">
              © 2026 QSS. Built by TheQuantPartners.
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
