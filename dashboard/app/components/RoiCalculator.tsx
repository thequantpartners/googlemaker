"use client";

import { useState } from "react";
import { ArrowRight, Calculator, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default function RoiCalculator() {
  const [investment, setInvestment] = useState(2000);
  const [fee, setFee] = useState(5000);

  // Constants based on market research
  const CPA = 600; // S/ 600 per closed case

  // Calculations
  const casesGenerated = Math.floor(investment / CPA);
  const projectedRevenue = casesGenerated * fee;
  const netProfit = projectedRevenue - investment;
  const roiMultiplier = investment > 0 ? (projectedRevenue / investment).toFixed(1) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-dark-card border border-dark-card-border rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Controls */}
        <div className="space-y-10">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-gray-300 font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-neon-blue" />
                Inversión Mensual en Google Ads
              </label>
              <span className="text-white font-bold text-xl">{formatCurrency(investment)}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="10000"
              step="500"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
              style={{ accentColor: '#3B82F6' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Mínimo Rentable (S/ 2,000)</span>
              <span>S/ 10,000+</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-4">
              <label className="text-gray-300 font-semibold flex items-center gap-2">
                <Calculator size={18} className="text-neon-purple" />
                Honorario Promedio por Caso Penal
              </label>
              <span className="text-white font-bold text-xl">{formatCurrency(fee)}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="20000"
              step="1000"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-purple"
              style={{ accentColor: '#A855F7' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>S/ 3,000</span>
              <span>S/ 20,000</span>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 leading-relaxed">
              * Cálculos basados en datos del mercado peruano (2026). Asume un Costo por Adquisición (CPA) de S/ 600 por caso cerrado gracias al filtro de IA.
            </p>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="bg-[#0B0E14] border border-[#A855F7]/30 rounded-2xl p-8 relative shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-blue to-neon-purple text-white px-6 py-1.5 rounded-full text-sm font-bold tracking-wider shadow-lg whitespace-nowrap">
            RESULTADOS ESTIMADOS
          </div>
          
          <div className="space-y-8 mt-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Nuevos Casos Mensuales</div>
                  <div className="text-3xl font-bold text-white">{casesGenerated}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <div className="text-gray-400 text-sm mb-1">Ingreso Bruto Proyectado</div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                  {formatCurrency(projectedRevenue)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-1">Retorno de Inversión (ROI)</div>
                <div className="text-3xl font-bold text-[#A855F7]">{roiMultiplier}x</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-1">Beneficio Neto</div>
                <div className="text-xl font-bold text-white">+{formatCurrency(netProfit)}</div>
              </div>
            </div>
            
            <div className="pt-4">
              <Link 
                href="https://wa.me/51924464410?text=Hola,%20quiero%20conocer%20el%20sistema%20para%20abogados%20penalistas" 
                target="_blank"
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl font-bold text-white hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                Quiero Estos Resultados
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
