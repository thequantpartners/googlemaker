"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Megaphone, Activity, CreditCard, Settings, LogOut, Menu, X, ListChecks, Lock } from "lucide-react";

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
      router.push("/onboarding");
    }
  }, [tier, pathname, router]);

  const hasPlan = tier && tier !== "free" && tier !== "none" && tier !== "";

  const navItems = [
    { name: "Setup Guide", href: "/onboarding", icon: ListChecks, locked: false },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, locked: true },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone, locked: true },
    { name: "Analytics Logs", href: "/dashboard/logs", icon: Activity, locked: true },
    { name: "My Plan", href: "/dashboard/planes", icon: CreditCard, locked: false },
    { name: "Settings", href: "/dashboard/configuracion", icon: Settings, locked: true },
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
        <div className="h-20 flex items-center px-6 gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple font-bold text-white text-lg">
            G
          </div>
          <span className="font-semibold text-lg text-white">GMaker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const itemLocked = item.locked && tier !== null && !hasPlan;

            if (itemLocked) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-medium text-gray-500 bg-white/[0.02] opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="text-gray-500" />
                    {item.name}
                  </div>
                  <Lock size={14} className="text-gray-500" />
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-neon-green" : "text-gray-400"} />
                {item.name}
              </Link>
            );
          })}
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
              {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
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
