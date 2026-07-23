"use client";

import { CheckCircle2, ShieldCheck, Zap, Sparkles } from "lucide-react";
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
  const isCurrentPlan = currentTier && currentTier !== "none";
  const tierToUse = "pro";

  const getButtonProps = () => {
    if (isLandingPage) {
      return {
        isLink: true,
        href: "/auth/register",
        text: "Iniciar Prueba Gratis de 7 Días",
        disabled: false,
      };
    }
    return {
      isLink: false,
      onClick: () => onSelectPlan && onSelectPlan(tierToUse),
      disabled: selectingPlan || Boolean(isCurrentPlan),
      text: selectingPlan
        ? "Procesando Mercado Pago..."
        : isCurrentPlan
        ? "✓ Plan Activo"
        : "Comenzar Prueba Gratis de 7 Días",
    };
  };

  const buttonProps = getButtonProps();

  return (
    <div className="w-full max-w-2xl mx-auto font-sans">
      <div className="bg-[#0B0E14] border-2 border-neon-purple/80 rounded-3xl p-8 sm:p-10 relative shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden transition-all hover:border-neon-purple">
        
        {/* Badge superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-purple to-neon-pink text-white px-5 py-1.5 rounded-b-xl text-xs font-extrabold tracking-wider uppercase shadow-[0_4px_14px_rgba(168,85,247,0.4)] flex items-center gap-1.5">
          <Sparkles size={14} /> Plan Todo Incluido · 7 Días Gratis
        </div>

        <div className="mt-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-between gap-2 mb-4">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">QSS Autopilot Pro</h2>
              <p className="text-gray-400 text-sm mt-1">Acceso total a todos los motores de tráfico y bot de WhatsApp.</p>
            </div>
            <div className="text-center sm:text-right mt-2 sm:mt-0">
              <div className="text-5xl font-black text-white tracking-tight flex items-baseline justify-center sm:justify-end gap-1">
                <span className="text-2xl font-bold text-neon-purple">S/</span>99
                <span className="text-sm font-medium text-gray-400">/mes</span>
              </div>
              <span className="inline-block mt-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                🎁 7 días de prueba gratis
              </span>
            </div>
          </div>

          <div className="h-px bg-white/10 my-6"></div>

          {/* Características */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm">
            <div className="flex items-start gap-3 text-gray-200">
              <CheckCircle2 size={18} className="text-neon-purple shrink-0 mt-0.5" />
              <span><strong>WhatsApp Autopiloto 24/7</strong> (Alertas & comandos por chat)</span>
            </div>
            <div className="flex items-start gap-3 text-gray-200">
              <CheckCircle2 size={18} className="text-neon-purple shrink-0 mt-0.5" />
              <span><strong>Motor IA para Anuncios</strong> (Auditoría de CTR y apagado automático)</span>
            </div>
            <div className="flex items-start gap-3 text-gray-200">
              <CheckCircle2 size={18} className="text-neon-purple shrink-0 mt-0.5" />
              <span><strong>Google Ads OAuth</strong> (Remarketing & audiencias automáticas)</span>
            </div>
            <div className="flex items-start gap-3 text-gray-200">
              <CheckCircle2 size={18} className="text-neon-purple shrink-0 mt-0.5" />
              <span><strong>TikTok Ads Manager</strong> (Tráfico offline servidor a servidor)</span>
            </div>
            <div className="flex items-start gap-3 text-gray-200">
              <CheckCircle2 size={18} className="text-neon-purple shrink-0 mt-0.5" />
              <span><strong>Sistema Anti-Baneo Conectado</strong> (Operación segura de cuentas)</span>
            </div>
            <div className="flex items-start gap-3 text-gray-200">
              <CheckCircle2 size={18} className="text-neon-purple shrink-0 mt-0.5" />
              <span><strong>Soporte Prioritario & Actualizaciones</strong> incluidas sin costo extra</span>
            </div>
          </div>

          {/* Botón de pago / registro */}
          {buttonProps.isLink ? (
            <Link
              href={buttonProps.href!}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            >
              <Zap size={20} /> {buttonProps.text}
            </Link>
          ) : (
            <button
              onClick={buttonProps.onClick}
              disabled={buttonProps.disabled}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                isCurrentPlan
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              }`}
            >
              <Zap size={20} /> {buttonProps.text}
            </button>
          )}

          <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" /> Pago 100% seguro con Mercado Pago · Cancela en cualquier momento en 1 clic
          </p>

        </div>
      </div>
    </div>
  );
}

