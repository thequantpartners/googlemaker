"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Megaphone, Activity, CreditCard, Settings, LogOut, Menu, X, ListChecks, Lock, MessageSquare, Wallet, Phone, Calendar, LayoutTemplate, BrainCircuit } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTier() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.status === 401) {
          setTier("free");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setTier(data.tier);
        } else {
          setTier("free");
        }
      } catch (err) {
        setTier("free");
      }
    }
    fetchTier();
  }, [session]);

  // Redirect new users to onboarding
  useEffect(() => {
    if (tier && (tier === "free" || tier === "none" || tier === "") && pathname === "/dashboard") {
      router.push("/dashboard/setup-guide");
    }
  }, [tier, pathname, router]);

  // Link Mercado Pago subscription if returning from checkout
  useEffect(() => {
    if (typeof window !== "undefined" && session?.backendToken) {
      const urlParams = new URLSearchParams(window.location.search);
      const preapproval_id = urlParams.get("preapproval_id");
      
      if (preapproval_id) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/link-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.backendToken}`
          },
          body: JSON.stringify({ preapproval_id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success" && data.tier) {
            setTier(data.tier);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(err => console.error("Error linking subscription:", err));
      }
    }
  }, [session]);

  const hasPlan = tier && tier !== "free" && tier !== "none" && tier !== "";

  const navGroups = [
    {
      title: "PRINCIPAL",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, locked: true },
        { name: "Conexión 3 Pasos", href: "/dashboard/setup-guide", icon: ListChecks, locked: false },
      ]
    },
    {
      title: "AUTOPILOT ADS",
      items: [
        { name: "WhatsApp Copilot", href: "/dashboard/setup-guide", icon: Phone, locked: false, badge: "ACTIVO" },
        { name: "Cuentas Conectadas", href: "/dashboard/configuracion", icon: Settings, locked: true },
      ]
    },
    {
      title: "MÓDULOS EXTRAS",
      items: [
        { name: "Setter IA de Leads", href: "/dashboard/whatsapp", icon: MessageSquare, locked: true, badge: "PRÓXIMAMENTE" },
      ]
    },
    {
      title: "MI CUENTA",
      items: [
        { name: "Mi Plan & Facturación", href: "/dashboard/planes", icon: CreditCard, locked: false },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background text-gray-300 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-[#0a0c10] border-r border-dark-card-border flex flex-col z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        
        {/* Logo */}
        <div className="p-4 md:p-6 mb-2 mt-4 flex items-center gap-3 select-none hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            Q
          </div>
          <span className="font-semibold text-lg text-white">QSS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-4 text-[11px] font-bold text-gray-500 tracking-wider mb-2">{group.title}</h3>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const itemLocked = item.locked && tier !== null && !hasPlan;

                if (itemLocked) {
                  return (
                    <div
                      key={item.name}
                      onClick={() => router.push("/dashboard/planes")}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 opacity-60 cursor-pointer hover:bg-white/5 transition-all group"
                      title="Requiere plan activo"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-gray-500" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.badge === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {item.badge}
                          </span>
                        )}
                        <Lock className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-neon-purple/20 to-transparent text-white border-l-2 border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User / Bottom */}
        <div className="p-4 border-t border-dark-card-border">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
        {/* Subtle background glow for main area */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-neon-purple/10 blur-[150px] pointer-events-none" />
        
        {/* Top bar (Global across dashboard) */}
        <header className="h-20 px-6 lg:px-8 flex items-center justify-between border-b border-dark-card-border bg-[#0B0E14]/80 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl lg:text-2xl font-semibold text-white truncate max-w-[150px] sm:max-w-xs">
              {navGroups.flatMap(g => g.items).find(i => i.href === pathname)?.name || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex px-4 py-1.5 rounded-full border border-neon-purple/30 bg-neon-purple/10 text-neon-purple text-xs font-semibold items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              {tier ? `${tier.toUpperCase()} PLAN - Active` : "Loading..."}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-dark-card border border-dark-card-border flex items-center justify-center text-sm font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "JD"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
          {children}
        </div>
      </main>

    </div>
  );
}
