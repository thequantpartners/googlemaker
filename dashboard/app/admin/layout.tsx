"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, LogOut, Menu, X, Rocket, Target, LayoutTemplate } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Clientes", href: "/admin/clients", icon: Users },
    { name: "Creador Onboarding", href: "/admin/onboarding-creator", icon: Rocket },
    { name: "Validador ICP", href: "/admin/icp-validator", icon: Target },
    { name: "Gen. Landings", href: "/admin/landing-generator", icon: LayoutTemplate },
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
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 font-bold text-white text-lg">
            S
          </div>
          <span className="font-semibold text-lg text-white">SuperAdmin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-orange-400" : "text-gray-400"} />
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
            Cerrar Sesión
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
        {/* Subtle background glow for main area */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-[150px] pointer-events-none" />
        
        {/* Top bar */}
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
            <div className="hidden sm:flex px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              SYSTEM ADMIN
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
