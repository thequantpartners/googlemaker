import Link from "next/link";
import { Search, Play, TrendingUp, ShieldCheck, Copy, ArrowRight, PlayCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative selection:bg-neon-purple selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-neon-blue/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-neon-purple/20 blur-[150px] pointer-events-none" />
      
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple font-bold text-lg">
            G
          </div>
          <span className="font-semibold text-xl tracking-tight">GoogleMaker</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#case-studies" className="hover:text-white transition-colors">Case Studies</Link>
          <Link href="#blog" className="hover:text-white transition-colors">Blog</Link>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            <Search size={20} />
          </button>
          <Link 
            href="/login" 
            className="px-5 py-2.5 rounded-full bg-dark-card border border-dark-card-border text-sm font-medium hover:bg-white/10 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto pt-16 lg:pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="space-y-4">
              <p className="text-gray-400 font-medium tracking-wider uppercase text-sm">
                Automate. Optimize. Dominate.
              </p>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                Your Google Ads Agency <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                  on Autopilot.
                </span>
              </h1>
            </div>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              Leverage AI to scale campaigns, protect capital, and maximize ROI effortlessly. GoogleMaker handles the ads; you drive the strategy.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link 
                href="/login" 
                className="group relative px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full font-semibold text-white overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="px-6 py-4 rounded-full font-medium text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
                <PlayCircle size={20} className="text-neon-purple" />
                Watch 2 Min Demo
              </button>
            </div>
          </div>

          {/* Right Visual (Glassmorphic Graph Card) */}
          <div className="relative w-full aspect-square max-w-[600px] mx-auto lg:mx-0 animate-glow">
            {/* Abstract wireframe glow behind card */}
            <div className="absolute inset-0 rounded-[2rem] border border-neon-blue/30 scale-105 transform rotate-3" />
            <div className="absolute inset-0 rounded-[2rem] border border-neon-purple/30 scale-110 transform -rotate-2" />
            
            {/* Main Glass Card */}
            <div className="relative h-full w-full bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-8 shadow-2xl flex flex-col">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="font-semibold text-lg text-white">Ads Profit Graph</h3>
                  <p className="text-sm text-gray-400">Performance Autopilot Dashboard</p>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1">
                  Last 30 Days <span className="ml-1 text-gray-500">▼</span>
                </div>
              </div>

              {/* Badges Floating */}
              <div className="absolute left-[-20px] top-[40%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform -rotate-3">
                <div className="text-2xl font-bold text-white">$1.2M+</div>
                <div className="text-xs text-gray-400">Revenue</div>
              </div>

              <div className="absolute right-[-10px] bottom-[20%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform rotate-6">
                <div className="text-2xl font-bold text-white">$250k+</div>
                <div className="text-xs text-gray-400">Spend</div>
              </div>

              <div className="absolute top-[25%] right-[20%] px-3 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm font-semibold rounded-full flex items-center gap-1">
                <TrendingUp size={14} /> 12.4x ROI
              </div>

              {/* The Chart lines (simulated with SVG) */}
              <div className="flex-1 w-full relative mt-auto">
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
                  
                  {/* Data Points */}
                  <circle cx="100" cy="120" r="6" fill="#0B0E14" stroke="#A855F7" strokeWidth="3" />
                  <circle cx="250" cy="80" r="6" fill="#0B0E14" stroke="#3B82F6" strokeWidth="3" />
                  <circle cx="400" cy="20" r="8" fill="#fff" filter="url(#glow)" />
                  
                  {/* Arrow at end */}
                  <path d="M 380 5 L 405 15 L 400 40" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                </svg>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-purple/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-transparent flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-neon-purple" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Vertical Scaling</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Automatically increase budgets on winning campaigns to maximize profit without increasing CPA.
            </p>
            <Link href="#" className="text-neon-purple text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Learn More <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-blue/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-transparent flex items-center justify-center mb-6 border border-neon-blue/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-neon-blue" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Capital Protection</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              AI safeguards immediately pause underperforming ads and protect your budget from waste.
            </p>
            <Link href="#" className="text-neon-blue text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Learn More <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-green/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/20 to-transparent flex items-center justify-center mb-6 border border-neon-green/20 group-hover:scale-110 transition-transform">
              <Copy className="text-neon-green" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Horizontal Cloning</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Instantly replicate high-performing strategies across new audiences and markets.
            </p>
            <Link href="#" className="text-neon-green text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Learn More <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
