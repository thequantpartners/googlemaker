"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export interface PricingCardsProps {
  currentTier?: string | null;
  selectingPlan?: boolean;
  onSelectPlan?: (tier: string) => void;
  isLandingPage?: boolean;
}

export default function PricingCards({
  currentTier = null,
  selectingPlan = false,
  onSelectPlan,
  isLandingPage = false,
}: PricingCardsProps) {
  const getButtonProps = (tier: string) => {
    if (isLandingPage) {
      return {
        isLink: true,
        href: "/auth/register",
        text: "Iniciar Prueba Gratis",
        disabled: false,
      };
    }
    const isCurrent = currentTier === tier;
    return {
      isLink: false,
      onClick: () => onSelectPlan && onSelectPlan(tier),
      disabled: selectingPlan || isCurrent,
      text: selectingPlan
        ? "Procesando..."
        : isCurrent
        ? "Plan Actual"
        : "Seleccionar Plan",
    };
  };

  const renderButton = (tier: string, className: string) => {
    const props = getButtonProps(tier);
    if (props.isLink) {
      return (
        <Link href={props.href!} className={`text-center flex items-center justify-center ${className}`}>
          {props.text}
        </Link>
      );
    }
    return (
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        className={className}
      >
        {props.text}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-5xl mx-auto font-sans">
      
      {/* Starter Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col transition-colors ${currentTier === 'starter' ? 'border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/10 hover:border-white/20'}`}>
        <div className="flex-1">
          {currentTier === "starter" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              PLAN ACTUAL
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Starter</h2>
          <div className="text-4xl font-black text-white mb-4 tracking-tight">S/ 97<span className="text-base text-gray-500 font-normal">/mes</span></div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">Ideal para independientes que recién empiezan.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> 500 Mensajes Mensuales</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> Acceso a Snapshots</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> 1 Número de WhatsApp</li>
          </ul>
        </div>
        {renderButton("starter", `w-full py-3.5 rounded-2xl border text-sm transition-colors font-semibold ${currentTier === 'starter' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-white/10 bg-transparent hover:bg-white/5 text-white'}`)}
      </div>

      {/* Growth Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col relative ${currentTier === 'growth' ? 'border-neon-purple shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'border-neon-purple/80 hover:border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.1)]'}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon-purple text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider whitespace-nowrap shadow-[0_4px_14px_rgba(168,85,247,0.39)]">
          {currentTier === "growth" ? "PLAN ACTUAL" : "MÁS POPULAR"}
        </div>
        <div className="flex-1 mt-2">
          <h2 className="text-2xl font-bold text-white mb-2">Growth</h2>
          <div className="text-4xl font-black text-neon-purple mb-4 tracking-tight">S/ 199<span className="text-base text-gray-500 font-normal">/mes</span></div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">Para negocios que reciben buen volumen de leads.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> 2,000 Mensajes Mensuales</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> Agendamiento de Citas</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> Integración CRM</li>
          </ul>
        </div>
        {renderButton("growth", `w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(100,100,255,0.3)] ${currentTier === 'growth' ? 'bg-neon-purple/30 text-neon-purple cursor-not-allowed' : 'bg-gradient-to-r from-[#8B6CE0] to-[#5D85F0] text-white hover:opacity-90'}`)}
      </div>

      {/* Pro Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col transition-colors ${currentTier === 'pro' ? 'border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/10 hover:border-white/20'}`}>
        <div className="flex-1">
          {currentTier === "pro" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              PLAN ACTUAL
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Scale (Pro)</h2>
          <div className="text-4xl font-black text-white mb-4 tracking-tight">S/ 499<span className="text-base text-gray-500 font-normal">/mes</span></div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">El autopilot definitivo para múltiples agentes.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> 10,000 Mensajes Mensuales</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> Múltiples Números</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-purple shrink-0" /> Soporte Dedicado</li>
          </ul>
        </div>
        {renderButton("pro", `w-full py-3.5 rounded-2xl border text-sm transition-colors font-semibold ${currentTier === 'pro' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-white/10 bg-transparent hover:bg-white/5 text-white'}`)}
      </div>
    </div>
  );
}
