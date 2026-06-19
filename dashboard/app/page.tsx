import Link from "next/link";
import { Search, Play, TrendingUp, ShieldCheck, Copy, ArrowRight, PlayCircle, Globe, CheckCircle2, ChevronDown, Zap, BarChart3, Clock } from "lucide-react";

export default function LandingPage() {
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
          <span className="font-semibold text-xl tracking-tight">GoogleMaker</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium px-2 py-1 rounded-md hover:bg-white/5">
            <Globe size={16} /> EN <ChevronDown size={14} />
          </div>
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neon-blue w-max">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
              </span>
              Google Ads API v31 Supported
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                Stop Burning Ad Spend. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-pink-500">
                  Scale Your Winners.
                </span>
              </h1>
            </div>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              The hybrid AI autopilot designed exclusively for marketing agencies and high-growth businesses. We protect your capital from bad clicks and automatically scale campaigns that hit your target CPA.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link 
                href="/login" 
                className="group relative px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full font-semibold text-white overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="px-6 py-4 rounded-full font-medium text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
                <PlayCircle size={20} className="text-neon-purple" />
                See How It Works
              </button>
            </div>
            
            <div className="pt-8 border-t border-dark-card-border mt-4">
              <p className="text-sm text-gray-500 font-medium mb-4">TRUSTED BY 50+ SCALING AGENCIES IN US & LATAM</p>
              <div className="flex gap-8 opacity-50 grayscale">
                <div className="font-bold text-xl tracking-tighter">AGENCY<span className="text-neon-blue">PRO</span></div>
                <div className="font-bold text-xl tracking-tighter">LATAM<span className="text-neon-purple">MARKETING</span></div>
                <div className="font-bold text-xl tracking-tighter">GROWTH<span className="text-neon-green">X</span></div>
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
                  <h3 className="font-semibold text-lg text-white">Ads Profit Graph</h3>
                  <p className="text-sm text-gray-400">Autopilot Dashboard</p>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1">
                  Last 30 Days <ChevronDown size={12} />
                </div>
              </div>

              {/* Badges Floating */}
              <div className="absolute left-[-20px] top-[40%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform -rotate-3 z-20">
                <div className="text-2xl font-bold text-white">$1.2M+</div>
                <div className="text-xs text-gray-400">Revenue Generated</div>
              </div>

              <div className="absolute right-[-10px] bottom-[20%] bg-dark-card backdrop-blur-md border border-dark-card-border px-4 py-3 rounded-xl shadow-lg transform rotate-6 z-20">
                <div className="text-2xl font-bold text-white text-red-400">$12k</div>
                <div className="text-xs text-gray-400">Wasted Spend Saved</div>
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
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Manual Bidding is Killing Your Margins.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16 text-lg">
            Agencies and business owners spend hours analyzing spreadsheets, only to realize they've wasted thousands of dollars on weekends or overnight when nobody was watching the campaigns.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-red-500 mb-4 bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><Clock size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Weekend Waste</h3>
              <p className="text-gray-400">Campaigns often spiral out of control during weekends or holidays when your team is offline. GoogleMaker never sleeps.</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-orange-500 mb-4 bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><BarChart3 size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Missed Opportunities</h3>
              <p className="text-gray-400">When a campaign hits a winning streak, human reaction time is too slow to scale it before the trend dies down.</p>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="text-yellow-500 mb-4 bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center"><Zap size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Emotional Decisions</h3>
              <p className="text-gray-400">Humans pause campaigns too early or hold onto losers too long out of hope. Algorithms rely purely on hard mathematics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Autopilot in 3 Simple Steps</h2>
            <p className="text-gray-400 text-lg">No complex setups. No code. Just connect and let the engine roar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green -translate-y-1/2 opacity-20" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-blue flex items-center justify-center text-2xl font-bold text-neon-blue mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">1</div>
              <h3 className="text-xl font-bold mb-3">Connect Google Ads</h3>
              <p className="text-gray-400">Securely link your Google Ads account via standard OAuth. Read-only and edit permissions granted instantly.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-purple flex items-center justify-center text-2xl font-bold text-neon-purple mb-6 shadow-[0_0_20px_rgba(168,85,247,0.3)]">2</div>
              <h3 className="text-xl font-bold mb-3">Set Target Limits</h3>
              <p className="text-gray-400">Define your maximum acceptable CPA (Cost Per Acquisition) and let the engine understand your profit margins.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-neon-green flex items-center justify-center text-2xl font-bold text-neon-green mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">3</div>
              <h3 className="text-xl font-bold mb-3">Autopilot Takes Over</h3>
              <p className="text-gray-400">The hybrid engine pauses losers instantly and scales winners aggressively. You review the logs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto pb-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">The Engine Under the Hood</h2>
          <p className="text-gray-400 text-lg">Proprietary logic built by media buyers, for media buyers.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-purple/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-transparent flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-neon-purple" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Vertical Scaling</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              When a campaign proves to be highly profitable and sits below your Target CPA, we automatically push daily budgets by 15-20% increments to capture maximum market share before the trend cools off.
            </p>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-blue/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-transparent flex items-center justify-center mb-6 border border-neon-blue/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-neon-blue" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Capital Protection</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Our background CRON job analyzes your spend 24/7. If a campaign spends 1.5x your Target CPA without a single conversion (exiting the Learning Phase), we PAUSE it instantly. No more waking up to wasted budgets.
            </p>
          </div>

          <div className="bg-dark-card backdrop-blur-lg border border-dark-card-border p-8 rounded-[24px] hover:border-neon-green/50 hover:bg-white/[0.03] transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/20 to-transparent flex items-center justify-center mb-6 border border-neon-green/20 group-hover:scale-110 transition-transform">
              <Copy className="text-neon-green" size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Horizontal Cloning</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              (Coming Soon) Automatically extract search terms that converted exceptionally well and create parallel exact-match expansion campaigns to dominate specific high-intent keywords.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials (Social Proof) */}
      <section className="relative z-10 py-24 bg-[#0B0E14] border-y border-dark-card-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-12 text-center">Built for Agencies That Demand Results</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="flex text-yellow-400 mb-4">{"★★★★★"}</div>
              <p className="text-lg text-gray-300 italic mb-6">
                "We manage over 20 clients in LatAm. Since hooking them up to GoogleMaker, our team saves around 15 hours a week in manual bid adjustments. The Capital Protection alone paid for the software in day two."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div>
                  <div className="font-bold">Carlos R.</div>
                  <div className="text-sm text-gray-500">Founder, GrowthX Agency</div>
                </div>
              </div>
            </div>
            <div className="bg-dark-card border border-dark-card-border p-8 rounded-2xl">
              <div className="flex text-yellow-400 mb-4">{"★★★★★"}</div>
              <p className="text-lg text-gray-300 italic mb-6">
                "Scaling winners was always scary because CPA usually shoots up. This hybrid autopilot scales budgets incrementally. We increased our client's revenue by 40% without ruining profitability."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div>
                  <div className="font-bold">Sarah T.</div>
                  <div className="text-sm text-gray-500">Senior Media Buyer, US Ads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 text-lg mb-16">No percentage of ad spend. Just a flat monthly fee to protect your margins.</p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-8 rounded-[2rem] flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <div className="text-4xl font-extrabold text-white mb-6">$5<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-blue" /> 1 Google Ads Account</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-blue" /> Basic AI Optimization</li>
              </ul>
              <Link href="/login" className="text-center w-full py-4 rounded-full border border-dark-card-border hover:bg-white/5 transition-colors font-semibold text-white">Start Basic</Link>
            </div>

            <div className="bg-dark-card backdrop-blur-xl border border-neon-purple p-8 rounded-[2rem] flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon-purple text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider">MOST POPULAR</div>
              <h3 className="text-2xl font-bold text-white mb-2">Scale</h3>
              <div className="text-4xl font-extrabold text-neon-purple mb-6">$20<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-purple" /> Up to 3 Ad Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-purple" /> Real-time Hybrid Scaling</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-purple" /> Priority Execution</li>
              </ul>
              <Link href="/login" className="text-center w-full py-4 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue font-semibold text-white hover:opacity-90 transition-opacity">Start Scale</Link>
            </div>

            <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-8 rounded-[2rem] flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
              <div className="text-4xl font-extrabold text-white mb-6">$99<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-green" /> Unlimited Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-green" /> Custom CPA Strategies</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-green" /> Dedicated Support</li>
              </ul>
              <Link href="/login" className="text-center w-full py-4 rounded-full border border-dark-card-border hover:bg-white/5 transition-colors font-semibold text-white">Start Growth</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-24 bg-black/40 border-t border-dark-card-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                Does it alter my existing campaigns?
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                No. GoogleMaker reads your data and only makes specific adjustments (like pausing a bad ad group or increasing a budget by 15%) based on your explicit CPA limits. It never deletes your campaigns or rewrites your ad copy.
              </p>
            </details>
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                How fast does it react to bad spend?
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Our CRON job scans your connected accounts multiple times a day. If a campaign suddenly spikes and spends over 1.5x your target CPA without a conversion, the system pauses it immediately to protect your capital.
              </p>
            </details>
            <details className="group bg-dark-card border border-dark-card-border rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-white">
                Do I need to be a developer to use this?
                <ChevronDown className="transition duration-300 group-open:-rotate-180 text-gray-400" />
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Absolutely not. You just click "Connect Google Ads", log in with your Google account, and select your Target CPA on the dashboard. The engine does all the mathematical heavy lifting in the background.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final Glowing Footer CTA */}
      <footer className="relative z-10 py-24 text-center border-t border-dark-card-border overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-neon-blue/20 blur-[150px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to scale your agency?</h2>
          <p className="text-xl text-gray-400 mb-10">Join the smartest media buyers automating their Google Ads success.</p>
          <Link 
            href="/login" 
            className="inline-flex px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Create Your Account
          </Link>
          <div className="mt-16 text-gray-500 text-sm">
            © 2026 GoogleMaker. Built by TheQuantPartners.
          </div>
        </div>
      </footer>

    </div>
  );
}
