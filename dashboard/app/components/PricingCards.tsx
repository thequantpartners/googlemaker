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
    <div className="grid md:grid-cols-4 gap-6 text-left w-full">
      {/* Starter Plan */}
      <div className={`bg-dark-card backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col hover:border-neon-blue/50 transition-colors ${currentTier === 'starter' ? 'border-white/50' : 'border-dark-card-border'}`}>
        <div className="flex-1">
          {currentTier === "starter" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Starter</h2>
          <div className="text-4xl font-extrabold text-neon-blue mb-4">$49<span className="text-lg text-gray-500 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 h-12">Up to $1,000/mo in Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-blue" /> Full Autopilot</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-blue" /> Immigration Templates</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-blue" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("starter", `w-full py-4 rounded-full border transition-colors font-semibold ${currentTier === 'starter' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-dark-card-border hover:bg-white/5 text-white'}`)}
      </div>

      {/* Growth Plan */}
      <div className={`bg-dark-card backdrop-blur-xl border p-8 rounded-[2rem] flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] ${currentTier === 'growth' ? 'border-neon-purple' : 'border-neon-purple/50'}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon-purple text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider whitespace-nowrap">
          {currentTier === "growth" ? "CURRENT PLAN" : "MOST POPULAR"}
        </div>
        <div className="flex-1 mt-4">
          <h2 className="text-2xl font-bold text-white mb-2">Growth</h2>
          <div className="text-4xl font-extrabold text-neon-purple mb-4">$199<span className="text-lg text-gray-500 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 h-12">Up to $5,000/mo in Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-purple" /> Full Autopilot</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-purple" /> Dedicated Support</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-purple" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("growth", `w-full py-4 rounded-full font-semibold transition-all ${currentTier === 'growth' ? 'bg-neon-purple/20 text-neon-purple cursor-not-allowed' : 'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 shadow-[0_0_15px_rgba(168,85,247,0.4)]'}`)}
      </div>

      {/* Pro Plan */}
      <div className={`bg-dark-card backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col hover:border-neon-green/50 transition-colors ${currentTier === 'pro' ? 'border-white/50' : 'border-dark-card-border'}`}>
        <div className="flex-1">
          {currentTier === "pro" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
          <div className="text-4xl font-extrabold text-neon-green mb-4">$499<span className="text-lg text-gray-500 font-normal">/mo</span></div>
          <p className="text-gray-400 mb-8 h-12">Up to $25,000/mo in Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-green" /> Full Autopilot</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-green" /> Custom Automations</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-neon-green" /> Unlimited Accounts</li>
          </ul>
        </div>
        {renderButton("pro", `w-full py-4 rounded-full border transition-colors font-semibold ${currentTier === 'pro' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-dark-card-border hover:bg-white/5 text-white'}`)}
      </div>

      {/* Elite Plan */}
      <div className={`bg-dark-card backdrop-blur-xl border rounded-[2rem] p-8 flex flex-col hover:border-amber-500/50 transition-colors ${currentTier === 'elite' ? 'border-white/50' : 'border-dark-card-border'}`}>
        <div className="flex-1">
          {currentTier === "elite" && (
            <div className="inline-block bg-white text-black px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-6">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Elite</h2>
          <div className="text-4xl font-extrabold text-amber-500 mb-4">Custom</div>
          <p className="text-gray-400 mb-8 h-12">Personalized Ad Spend.</p>
          <ul className="space-y-4 mb-8 text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-500" /> Full Autopilot</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-500" /> Account Manager</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-500" /> Priority Execution</li>
          </ul>
        </div>
        {renderButton("elite", `w-full py-4 rounded-full border transition-colors font-semibold ${currentTier === 'elite' ? 'bg-white/10 text-gray-400 border-white/10 cursor-not-allowed' : 'border-dark-card-border hover:bg-white/5 text-white'}`)}
      </div>
    </div>
  );
}
