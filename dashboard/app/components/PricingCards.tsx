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
    if (tier === "elite") {
      return {
        isLink: true,
        href: "mailto:partners@thequantpartners.com",
        text: "Contact Sales",
        disabled: false,
      };
    }
    
    if (isLandingPage) {
      return {
        isLink: true,
        href: "/login",
        text: `Choose ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
        disabled: false,
      };
    }
    const isCurrent = currentTier === tier;
    return {
      isLink: false,
      onClick: () => onSelectPlan && onSelectPlan(tier),
      disabled: selectingPlan || isCurrent,
      text: selectingPlan
        ? "Processing..."
        : isCurrent
        ? "Current Plan"
        : currentTier === "basic" && tier !== "basic" // legacy basic compatibility
        ? `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
        : `Choose ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full max-w-6xl mx-auto font-sans">
      
      {/* Starter Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col transition-colors ${currentTier === 'starter' ? 'border-white/50' : 'border-white/10 hover:border-white/20'}`}>
        <div className="flex-1">
          {currentTier === "starter" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Starter</h2>
          <div className="text-4xl font-black text-[#3B82F6] mb-4 tracking-tight">$49<span className="text-base text-gray-500 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">Up to $1,000/mo in<br/>Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#3B82F6] shrink-0" /> Full Autopilot</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#3B82F6] shrink-0" /> Immigration Templates</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#3B82F6] shrink-0" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("starter", `w-full py-3.5 rounded-2xl border text-sm transition-colors font-semibold ${currentTier === 'starter' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-white/10 bg-transparent hover:bg-white/5 text-white'}`)}
      </div>

      {/* Growth Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col relative ${currentTier === 'growth' ? 'border-[#A855F7] shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-[#A855F7]/80 hover:border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.1)]'}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#A855F7] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider whitespace-nowrap shadow-[0_4px_14px_rgba(168,85,247,0.39)]">
          {currentTier === "growth" ? "CURRENT PLAN" : "MOST POPULAR"}
        </div>
        <div className="flex-1 mt-2">
          <h2 className="text-2xl font-bold text-white mb-2">Growth</h2>
          <div className="text-4xl font-black text-[#A855F7] mb-4 tracking-tight">$199<span className="text-base text-gray-500 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">Up to $5,000/mo in<br/>Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#A855F7] shrink-0" /> Full Autopilot</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#A855F7] shrink-0" /> Immigration Templates</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#A855F7] shrink-0" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("growth", `w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(100,100,255,0.3)] ${currentTier === 'growth' ? 'bg-[#A855F7]/30 text-[#A855F7] cursor-not-allowed' : 'bg-gradient-to-r from-[#8B6CE0] to-[#5D85F0] text-white hover:opacity-90'}`)}
      </div>

      {/* Pro Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col transition-colors ${currentTier === 'pro' ? 'border-white/50' : 'border-white/10 hover:border-white/20'}`}>
        <div className="flex-1">
          {currentTier === "pro" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
          <div className="text-4xl font-black text-[#10B981] mb-4 tracking-tight">$499<span className="text-base text-gray-500 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">Up to $25,000/mo in<br/>Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981] shrink-0" /> Full Autopilot</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981] shrink-0" /> Immigration Templates</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981] shrink-0" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("pro", `w-full py-3.5 rounded-2xl border text-sm transition-colors font-semibold ${currentTier === 'pro' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-white/10 bg-transparent hover:bg-white/5 text-white'}`)}
      </div>

      {/* Elite Plan */}
      <div className={`bg-[#0B0E14] border rounded-3xl p-8 flex flex-col transition-colors ${currentTier === 'elite' ? 'border-white/50' : 'border-white/10 hover:border-white/20'}`}>
        <div className="flex-1">
          {currentTier === "elite" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Elite</h2>
          <div className="text-4xl font-black text-[#F59E0B] mb-4 tracking-tight">Custom</div>
          <p className="text-gray-400 mb-8 h-12 text-sm leading-relaxed">Personalized Ad<br/>Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300 text-sm">
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#F59E0B] shrink-0" /> Full Autopilot</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#F59E0B] shrink-0" /> Immigration Templates</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#F59E0B] shrink-0" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("elite", `w-full py-3.5 rounded-2xl border text-sm transition-colors font-semibold ${currentTier === 'elite' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-white/10 bg-transparent hover:bg-white/5 text-white'}`)}
      </div>
    </div>
  );
}
