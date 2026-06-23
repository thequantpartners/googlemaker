"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { X, Activity, AlertCircle, Play, Pause, DollarSign, TrendingUp, CheckCircle2, Copy, ExternalLink, Sparkles, Target, Globe, ChevronRight, Save, Trash2, Lightbulb } from "lucide-react";

interface ConnectedAccount {
  id: string;
  target_customer_id: string;
  is_verified: boolean;
}

interface CampaignMetric {
  campaign_id: string;
  campaign_name: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface GeneratedCopy {
  campaign_name: string;
  keywords: string[];
  headlines: string[];
  descriptions: string[];
}

interface SavedStrategy {
  id: string;
  campaign_name: string;
  keywords: string[];
  headlines: string[];
  descriptions: string[];
  created_at: string;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

export default function ClientCampaigns() {
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // AI Wizard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(2);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Wizard Inputs
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [generatedResult, setGeneratedResult] = useState<GeneratedCopy | null>(null);
  const [findCompetitorsLoading, setFindCompetitorsLoading] = useState(false);

  // Saved Strategies State
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const submitGenerate = async () => {
    if (!session?.backendToken || !websiteUrl.trim()) return;
    setWizardStep(3);
    setGenerateLoading(true);
    setGenerateError("");
    setGeneratedResult(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: websiteUrl, competitors: competitors || null, campaign_type: "Search" }),
      });
      if (res.ok) {
        setGeneratedResult(await res.json());
        setWizardStep(4);
      } else {
        const errData = await res.json();
        setGenerateError(errData.detail || "Error generating campaign copy.");
        setWizardStep(2);
      }
    } catch (err) {
      console.error("Failed to generate campaign", err);
      setGenerateError("Network error. Please try again.");
      setWizardStep(2);
    } finally {
      setGenerateLoading(false);
    }
  };

  const autoFindCompetitors = async () => {
    if (!session?.backendToken || !websiteUrl.trim()) return;
    setFindCompetitorsLoading(true);
    setGenerateError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns/competitors`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.backendToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.competitors.join(", ");
        setCompetitors(competitors.trim() ? `${competitors}, ${found}` : found);
      } else {
        const errData = await res.json();
        setGenerateError(errData.detail || "Error finding competitors.");
      }
    } catch {
      setGenerateError("Network error when finding competitors.");
    } finally {
      setFindCompetitorsLoading(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!session?.backendToken || !generatedResult) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.backendToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(generatedResult),
      });
      if (res.ok) {
        setSavedStrategies([await res.json(), ...savedStrategies]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save strategy", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteStrategy = async (strategyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.backendToken || !window.confirm("Are you sure you want to delete this strategy?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns/saved/${strategyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) setSavedStrategies((prev) => prev.filter((s) => s.id !== strategyId));
    } catch (err) {
      console.error("Failed to delete strategy", err);
    }
  };

  useEffect(() => {
    async function fetchAccounts() {
      if (!session?.backendToken) {
        if (status === "unauthenticated") {
          setAccountsLoaded(true);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.connected_accounts || []);
          if (data.connected_accounts?.length > 0) {
            setSelectedAccount(data.connected_accounts[0].target_customer_id);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
        setLoading(false);
      } finally {
        setAccountsLoaded(true);
      }
    }
    if (status !== "loading") fetchAccounts();
  }, [session, status]);

  useEffect(() => {
    async function fetchCampaigns() {
      if (!session?.backendToken || !selectedAccount) return;
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns?customer_id=${selectedAccount}`,
          { headers: { Authorization: `Bearer ${session.backendToken}` } }
        );
        if (res.ok) {
          setCampaigns(await res.json());
        } else {
          const errData = await res.json();
          setErrorMsg(errData.detail || "Error fetching campaigns.");
        }
      } catch {
        setErrorMsg("Connection failure.");
      } finally {
        setLoading(false);
      }
    }
    if (accountsLoaded) fetchCampaigns();
  }, [session, selectedAccount, accountsLoaded]);

  useEffect(() => {
    async function fetchSavedStrategies() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns/saved`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) setSavedStrategies(await res.json());
      } catch (err) {
        console.error("Failed to fetch saved strategies", err);
      }
    }
    fetchSavedStrategies();
  }, [session]);

  const totalCost = campaigns.reduce((acc, c) => acc + c.cost, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
  const avgCpa = totalConversions > 0 ? totalCost / totalConversions : 0;

  const headerLoading = status === "loading" || !accountsLoaded;

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">

      {/* Header — title always visible, controls skeleton while session loads */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Campaigns</h1>
          <p className="text-gray-400">Aggregated metrics from the last 30 days for the selected account.</p>
        </div>

        {headerLoading ? (
          <div className="flex gap-4 w-full md:w-auto">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-12 w-52" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-black/20 border border-dark-card-border text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors cursor-pointer min-w-[200px]"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.target_customer_id} className="text-black">
                  ID: {acc.target_customer_id}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setWizardStep(2);
                setWebsiteUrl("");
                setCompetitors("");
                setIsModalOpen(true);
                setGeneratedResult(null);
                setGenerateError("");
              }}
              className="bg-neon-purple text-white px-5 py-3 rounded-lg font-medium hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> AI Campaign Generator
            </button>
          </div>
        ) : null}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      {/* KPI Cards — card shells always render, values skeleton while loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col">
          <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-gray-500" /> Total Spend
          </p>
          {loading
            ? <Skeleton className="h-9 w-32" />
            : <h2 className="text-3xl font-bold text-white">${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          }
        </div>

        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col">
          <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <Activity size={16} className="text-gray-500" /> Clicks
          </p>
          {loading
            ? <Skeleton className="h-9 w-24" />
            : <h2 className="text-3xl font-bold text-white">{totalClicks.toLocaleString("en-US")}</h2>
          }
        </div>

        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col">
          <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-500" /> Avg. CPA
          </p>
          {loading
            ? <Skeleton className="h-9 w-28" />
            : <h2 className="text-3xl font-bold text-white">${avgCpa.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          }
        </div>

        <div className="bg-dark-card backdrop-blur-xl border border-neon-purple/30 p-6 rounded-2xl flex flex-col shadow-[0_0_20px_rgba(168,85,247,0.05)]">
          <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-neon-purple" /> Conversions
          </p>
          {loading
            ? <Skeleton className="h-9 w-20" />
            : <h2 className="text-3xl font-bold text-neon-purple">{totalConversions.toLocaleString("en-US")}</h2>
          }
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-dark-card border border-dark-card-border rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-dark-card-border bg-black/20 text-gray-400 text-sm uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Impressions</th>
                <th className="px-6 py-4 text-right">Clicks</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4 text-right">Conversions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-card-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-dark-card-border">
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-10 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="mx-auto mb-4 opacity-50" size={32} />
                    {accounts.length === 0
                      ? "You have no Google Ads accounts connected."
                      : "No active campaigns found in the last 30 days."}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.campaign_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{c.campaign_name}</div>
                      <div className="text-gray-500 text-xs mt-1">ID: {c.campaign_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === "ENABLED" ? (
                        <span className="px-3 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                          <Play size={12} fill="currentColor" /> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                          <Pause size={12} fill="currentColor" /> Paused
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300">{c.impressions.toLocaleString("en-US")}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{c.clicks.toLocaleString("en-US")}</td>
                    <td className="px-6 py-4 text-right text-gray-300">${c.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">{c.conversions.toLocaleString("en-US")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {campaigns.length > 0 && (
        <div className="bg-gradient-to-r from-neon-purple/10 to-blue-500/10 border border-neon-purple/20 p-6 rounded-2xl flex items-start gap-4">
          <Lightbulb className="text-neon-purple shrink-0 mt-1" size={28} />
          <div>
            <h3 className="text-lg font-bold text-white mb-2">GMaker Recommendations</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm">
              <li><strong>Track Conversions:</strong> Make sure you have installed the Google Tag (gtag.js) on your website to accurately track conversions. Without it, our autopilot cannot optimize effectively.</li>
              <li><strong>Sitelink Extensions:</strong> Add at least 4 sitelink extensions to your campaigns in Google Ads to improve your ad's real estate on search results and increase CTR.</li>
              <li><strong>Autopilot:</strong> Our orchestrator will automatically monitor your campaigns every hour and pause them if the CPA exceeds your limits. Sit back and relax!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Saved Strategies Vault */}
      {savedStrategies.length > 0 && (
        <div className="bg-[#0B0E14] border border-white/5 rounded-[2rem] p-8 overflow-hidden relative shadow-[0_0_50px_rgba(168,85,247,0.03)]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={100} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
            <Save className="text-neon-purple" size={24} /> Saved Strategies Vault
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {savedStrategies.map((strategy) => (
              <div key={strategy.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-neon-purple/50 hover:bg-white/10 transition-all group flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2" title={strategy.campaign_name}>{strategy.campaign_name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{new Date(strategy.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-black/40 text-[10px] uppercase font-bold text-gray-300 rounded-md border border-white/5">{strategy.keywords.length} KW</span>
                    <span className="px-2 py-1 bg-black/40 text-[10px] uppercase font-bold text-gray-300 rounded-md border border-white/5">{strategy.headlines.length} HL</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={(e) => handleDeleteStrategy(strategy.id, e)}
                      className="text-red-500/70 hover:text-red-500 transition-colors text-sm font-semibold flex items-center p-1.5 opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedResult({
                          campaign_name: strategy.campaign_name,
                          keywords: strategy.keywords,
                          headlines: strategy.headlines,
                          descriptions: strategy.descriptions,
                        });
                        setWizardStep(4);
                        setIsModalOpen(true);
                        setSaveSuccess(true);
                      }}
                      className="text-neon-purple hover:text-white transition-colors text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      View <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Campaign Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0E14] border border-dark-card-border rounded-2xl w-full max-w-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-neon-purple" size={24} /> AI Marketing Strategist
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              {generateError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3 animate-pulse">
                  <AlertCircle size={20} /> {generateError}
                </div>
              )}

              {/* Step 2: Details */}
              {wizardStep === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-2xl font-bold text-white mb-2">Let the AI analyze your business</h3>
                  <p className="text-gray-400 mb-6">We will scrape your website to understand your unique selling propositions and analyze your competitors to steal their traffic.</p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Globe size={16} className="text-neon-purple" /> Your Website URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://mybusiness.com"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <Target size={16} className="text-neon-purple" /> Competitors to target (Optional)
                        </label>
                        <button
                          onClick={autoFindCompetitors}
                          disabled={!websiteUrl.trim() || findCompetitorsLoading}
                          className="text-neon-purple hover:text-white transition-colors flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {findCompetitorsLoading ? <Activity className="animate-spin" size={14} /> : <Sparkles size={14} />}
                          Auto-Find
                        </button>
                      </div>
                      <textarea
                        value={competitors}
                        onChange={(e) => setCompetitors(e.target.value)}
                        placeholder="e.g., LegalZoom, local law firms, etc."
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors min-h-[100px] resize-y"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 <strong>Smart Targeting:</strong> We will analyze your competitors' market positioning to discover high-value keywords and uncover hidden traffic opportunities for your business.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={submitGenerate}
                      disabled={!websiteUrl.trim()}
                      className="px-6 py-3 bg-neon-purple text-white rounded-xl font-bold hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles size={18} /> Generate Strategy
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Loading */}
              {wizardStep === 3 && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-neon-purple animate-pulse" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-8 mb-2">Scraping website & analyzing competitors...</h3>
                  <p className="text-gray-400 text-center max-w-md">Our AI is reading your content, extracting your Unique Selling Propositions, and crafting high-converting ad copy.</p>
                </div>
              )}

              {/* Step 4: Results */}
              {wizardStep === 4 && generatedResult && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Your Search Strategy is ready</h3>
                    <button onClick={() => { setWizardStep(2); setSaveSuccess(false); }} className="text-sm text-neon-purple hover:underline">Start Over</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-gray-300">Campaign Name</label>
                          <button onClick={() => copyToClipboard(generatedResult.campaign_name)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy
                          </button>
                        </div>
                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-white font-medium">
                          {generatedResult.campaign_name}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-gray-300">Keywords ({generatedResult.keywords.length})</label>
                          <button onClick={() => copyToClipboard(generatedResult.keywords.join("\n"))} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy All
                          </button>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm h-[200px] overflow-y-auto whitespace-pre-wrap font-mono">
                          {generatedResult.keywords.join("\n")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-gray-300">Headlines (Max 30 chars)</label>
                          <button onClick={() => copyToClipboard(generatedResult.headlines.join("\n"))} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy All
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                          {generatedResult.headlines.map((hl, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/30 p-2.5 rounded-lg border border-white/5 group">
                              <span className="text-white text-sm">{hl}</span>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs ${hl.length > 30 ? 'text-red-400' : 'text-gray-500'}`}>{hl.length}/30</span>
                                <button onClick={() => copyToClipboard(hl)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-gray-300">Descriptions (Max 90 chars)</label>
                          <button onClick={() => copyToClipboard(generatedResult.descriptions.join("\n"))} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy All
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2">
                          {generatedResult.descriptions.map((desc, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/30 p-2.5 rounded-lg border border-white/5 group">
                              <span className="text-white text-sm">{desc}</span>
                              <div className="flex items-center gap-3 min-w-max ml-2">
                                <span className={`text-xs ${desc.length > 90 ? 'text-red-400' : 'text-gray-500'}`}>{desc.length}/90</span>
                                <button onClick={() => copyToClipboard(desc)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {wizardStep === 4 && (
              <div className="px-8 py-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/30">
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-neon-green" /> Copy generated successfully
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleSaveStrategy}
                    disabled={saveLoading || saveSuccess}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-colors w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saveSuccess ? <><CheckCircle2 size={16} className="text-neon-green" /> Saved</> : saveLoading ? "Saving..." : <><Save size={16} /> Save Strategy</>}
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors w-full sm:w-auto"
                  >
                    Close
                  </button>
                  <a
                    href="https://ads.google.com/aw/campaigns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-neon-purple text-white rounded-xl font-bold hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    Open Google Ads <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
