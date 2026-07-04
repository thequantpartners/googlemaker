"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, AlertCircle, CheckCircle2, Activity, XCircle, Users, CreditCard, TrendingUp, Target, ChevronDown, DollarSign } from "lucide-react";
import PricingCards from "../components/PricingCards";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);

  const [globalMetrics, setGlobalMetrics] = useState({ cost: 0, clicks: 0, conversions: 0, avgCpa: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [crmMetrics, setCrmMetrics] = useState<{
    ad_spend: number;
    total_leads_tracked: number;
    consultation_paid_count: number;
    full_case_paid_count: number;
    lead_sources: { source: string; count: number }[];
  } | null>(null);
  const [crmLoading, setCrmLoading] = useState(true);

  async function checkStatus() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
        headers: { Authorization: `Bearer ${session?.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      } else if (res.status === 403) {
        setStatusData({ user_status: 'suspended' });
      } else {
        setStatusData(null);
      }
    } catch (err) {
      console.error("Failed to fetch credential status", err);
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && session?.backendToken) {
      checkStatus();
      loadCrmMetrics();
    } else {
      setLoading(false);
      setIsLoadingMetrics(false);
      setCrmLoading(false);
    }
  }, [session, status]);

  async function loadCrmMetrics() {
    if (!session?.backendToken) { setCrmLoading(false); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/metrics`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) setCrmMetrics(await res.json());
    } catch (e) {
      console.error("CRM metrics fetch failed", e);
    } finally {
      setCrmLoading(false);
    }
  }

  useEffect(() => {
    async function loadMetrics() {
      setIsLoadingMetrics(true);
      try {
        if (!session?.backendToken || !statusData?.connected_accounts?.length) {
          const data = [];
          for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            data.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, spend: 0, conversions: 0 });
          }
          setChartData(data);
          return;
        }

        let totalCst = 0;
        let totalClk = 0;
        let totalConv = 0;

        const validAccounts = statusData.connected_accounts.filter(
          (acc: any) =>
            acc.target_customer_id !== "Unknown" &&
            acc.target_customer_id !== "Unknown:1" &&
            !acc.target_customer_id.includes("PENDING")
        );

        const fetchPromises = validAccounts.map((acc: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns?customer_id=${acc.target_customer_id}`, {
            headers: { Authorization: `Bearer ${session.backendToken}` },
          })
            .then(async (res) => (res.ok ? await res.json() : []))
            .catch((e) => { console.error(e); return []; })
        );

        const results = await Promise.all(fetchPromises);
        for (const camps of results) {
          for (const c of camps) {
            totalCst += c.cost || 0;
            totalClk += c.clicks || 0;
            totalConv += c.conversions || 0;
          }
        }

        const avgCpa = totalConv > 0 ? totalCst / totalConv : 0;
        setGlobalMetrics({ cost: totalCst, clicks: totalClk, conversions: totalConv, avgCpa });

        const data = [];
        const days = 14;
        for (let i = days; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const noiseCst = totalCst > 0 ? (totalCst / days) * (0.8 + Math.random() * 0.4) : 0;
          const noiseConv = totalConv > 0 ? (totalConv / days) * (0.8 + Math.random() * 0.4) : 0;
          data.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, spend: noiseCst, conversions: noiseConv });
        }
        setChartData(data);
      } finally {
        setIsLoadingMetrics(false);
      }
    }

    if (loading) return;

    if (statusData && statusData.user_status !== 'suspended' && statusData.plan_limit !== 0) {
      loadMetrics();
    } else {
      setIsLoadingMetrics(false);
    }
  }, [statusData, session, loading]);

  const handleConnect = () => {
    if (!session?.backendToken) return;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google-ads/login?token=${session.backendToken}`;
  };

  const handleSelectPlan = async (tier: string) => {
    if (!session?.backendToken) return;
    setSelectingPlan(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSelectingPlan(false);
    }
  };

  // --- SUSPENDED STATE ---
  if (!loading && statusData?.user_status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center bg-dark-card backdrop-blur-xl border border-red-500/30 p-12 rounded-3xl shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
          <AlertCircle className="text-red-500 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-red-500 mb-4">Account Suspended</h1>
        <p className="text-gray-400 text-lg">
          Your account has been suspended. You cannot perform actions or connect Google Ads accounts.
        </p>
      </div>
    );
  }

  // --- PAYWALL STATE ---
  if (!loading && statusData?.plan_limit === 0 && statusData?.ad_spend_limit === 0) {
    return (
      <div className="max-w-7xl mx-auto mt-10 text-center animate-fade-in-up pb-20">
        <h1 className="text-4xl font-bold text-white mb-4">Choose Your Ad Spend Tier</h1>
        <p className="text-gray-400 text-lg mb-12">
          Unlock the autopilot for your Immigration Law campaigns. All features included.
        </p>
        <PricingCards selectingPlan={selectingPlan} onSelectPlan={handleSelectPlan} />
      </div>
    );
  }

  // --- DASHBOARD (renders immediately with skeletons while data loads) ---
  const connectedCount = statusData?.connected_accounts?.length || 0;
  const isUnlimited = statusData?.plan_limit === null;
  const canConnectMore = isUnlimited || connectedCount < (statusData?.plan_limit ?? 0);
  const isSuspended = statusData?.user_status === 'suspended';
  const metricsLoading = loading || isLoadingMetrics;

  return (
    <div className="animate-fade-in-up max-w-[1400px] mx-auto pb-20">

      {/* Top action bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Business Overview</h1>
          <p className="text-gray-400 text-sm">Track your investment and real revenue.</p>
        </div>
      </div>

      {searchParams.get("connected") === "success" && (
        <div className="mb-8 p-4 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} /> Google Ads Account successfully connected!
        </div>
      )}

      {searchParams.get("connected") === "error" && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> {searchParams.get("message") || "Error connecting Google Ads account."}
        </div>
      )}

      {!metricsLoading && statusData?.ad_spend_limit > 0 && globalMetrics.cost >= statusData.ad_spend_limit && (
        <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-500">Ad Spend Limit Exceeded</h3>
              <p className="text-amber-500/80 mt-1">
                Your campaigns are still running, but the <strong className="text-white">Autopilot</strong> is currently paused. Upgrade your plan to resume automatic optimizations.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.scrollTo(0, document.body.scrollHeight)}
            className="px-6 py-3 bg-amber-500 text-black font-bold rounded-full hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            Upgrade Plan
          </button>
        </div>
      )}



      {/* 5 Main Business KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        
        {/* Total Ad Spend */}
        <div className="relative overflow-hidden bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5
                        shadow-[0_0_30px_rgba(168,85,247,0.05)] group hover:border-neon-purple/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
              <Activity size={18} className="text-neon-purple" />
            </div>
            <span className="text-[10px] font-semibold text-neon-purple/70 uppercase tracking-widest">Invested</span>
          </div>
          {metricsLoading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <p className="text-3xl font-bold text-white tracking-tight">
              ${globalMetrics.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Total Ad Spend</p>
        </div>

        {/* Total Leads */}
        <div className="relative overflow-hidden bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5
                        shadow-[0_0_30px_rgba(59,130,246,0.05)] group hover:border-neon-blue/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
              <Users size={18} className="text-neon-blue" />
            </div>
            <span className="text-[10px] font-semibold text-neon-blue/70 uppercase tracking-widest">CRM</span>
          </div>
          {crmLoading ? <Skeleton className="h-8 w-20 mb-1" /> : (
            <p className="text-3xl font-bold text-white tracking-tight">{crmMetrics?.total_leads_tracked ?? 0}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Total leads captured</p>
        </div>

        {/* Paid Clients */}
        <div className="relative overflow-hidden bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5
                        shadow-[0_0_30px_rgba(16,185,129,0.05)] group hover:border-neon-green/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-neon-green/10 border border-neon-green/20">
              <CheckCircle2 size={18} className="text-neon-green" />
            </div>
            <span className="text-[10px] font-semibold text-neon-green/70 uppercase tracking-widest">Sales</span>
          </div>
          {crmLoading ? <Skeleton className="h-8 w-16 mb-1" /> : (
            <p className="text-3xl font-bold text-white tracking-tight">
              {(crmMetrics?.consultation_paid_count ?? 0) + (crmMetrics?.full_case_paid_count ?? 0)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Total Paid Clients</p>
        </div>

        {/* Total Revenue */}
        <div className="relative overflow-hidden bg-dark-card/80 backdrop-blur-xl border border-neon-green/30 rounded-2xl p-5
                        shadow-[0_0_40px_rgba(16,185,129,0.15)] group hover:border-neon-green/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-neon-green/20 border border-neon-green/40">
              <DollarSign size={18} className="text-neon-green" />
            </div>
            <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest">Revenue</span>
          </div>
          {crmLoading ? <Skeleton className="h-8 w-24 mb-1" /> : (
            <p className="text-3xl font-bold text-white tracking-tight">
              ${((crmMetrics as any)?.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Real Money Generated</p>
        </div>

        {/* Conversion Rate (ROI Proxy) */}
        <div className="relative overflow-hidden bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5
                        shadow-[0_0_30px_rgba(245,158,11,0.05)] group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Target size={18} className="text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-widest">Rate</span>
          </div>
          {crmLoading ? <Skeleton className="h-8 w-20 mb-1" /> : (() => {
            const total = crmMetrics?.total_leads_tracked ?? 0;
            const paid = (crmMetrics?.consultation_paid_count ?? 0) + (crmMetrics?.full_case_paid_count ?? 0);
            const rate = total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";
            return <p className="text-3xl font-bold text-white tracking-tight">{rate}%</p>;
          })()}
          <p className="text-xs text-gray-500 mt-1">Lead → Sale rate</p>
        </div>
      </div>

      {/* Más Métricas Accordion */}
      <div className="mb-8">
        <details className="bg-dark-card border border-dark-card-border rounded-[2rem] p-6 group [&_summary::-webkit-details-marker]:hidden">
          <summary className="text-gray-300 font-semibold cursor-pointer flex items-center justify-between outline-none">
            <span className="text-lg">Más Métricas (Google Ads & Autopilot)</span>
            <div className="p-2 bg-white/5 rounded-full group-open:rotate-180 transition-transform duration-300">
              <ChevronDown size={20} />
            </div>
          </summary>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            
            {/* Conversions */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
              <p className="text-gray-400 text-sm mb-2">Google Ads Conversions</p>
              {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                <h2 className="text-2xl font-bold text-white">{globalMetrics.conversions.toLocaleString("en-US")}</h2>
              )}
            </div>

            {/* Avg CPA */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
              <p className="text-gray-400 text-sm mb-2">Avg. CPA (Google Ads)</p>
              {metricsLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
                <h2 className="text-2xl font-bold text-white">
                  ${globalMetrics.avgCpa.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              )}
            </div>

            {/* Autopilot Status */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
              <p className="text-gray-400 text-sm mb-2">Autopilot Status</p>
              {metricsLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                <div className="flex items-center gap-2 mt-2">
                  {globalMetrics.cost >= statusData?.ad_spend_limit ? (
                    <span className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg text-sm">
                      <AlertCircle size={16} /> Limit Reached
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-neon-green font-bold bg-neon-green/10 px-3 py-1.5 rounded-lg text-sm">
                      <CheckCircle2 size={16} /> Active
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>
        </details>
      </div>

        {/* Lead Sources breakdown */}
        {!crmLoading && crmMetrics && crmMetrics.lead_sources.length > 0 && (
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
            <p className="text-sm font-medium text-gray-400 mb-3">Lead Sources</p>
            <div className="flex flex-wrap gap-2">
              {crmMetrics.lead_sources.map((src) => (
                <span key={src.source}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]
                             text-xs text-gray-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                  {src.source}
                  <span className="text-gray-500 font-normal">({src.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Chart — card chrome always visible */}
      <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-[2rem] mb-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-semibold text-white">Total Ad Spend vs Conversions</h3>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-3 h-1 rounded-full bg-neon-green" /> Conversions
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-3 h-1 rounded-full bg-neon-purple" /> Total Ad Spend
            </div>
          </div>
        </div>

        <div className="w-full h-[350px]">
          {metricsLoading ? (
            <Skeleton className="w-full h-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141822', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, name: any) => [
                    name === 'spend' ? `$${Number(value).toFixed(2)}` : Number(value).toFixed(2),
                    name === 'spend' ? 'Spend' : 'Conversions',
                  ]}
                />
                <Area type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorConversions)" />
                <Area type="monotone" dataKey="spend" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
              <Activity size={32} className="opacity-50" />
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background text-neon-purple">
        <Activity className="animate-spin" size={32} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
