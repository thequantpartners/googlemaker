"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Plus, X, Search, Activity, AlertCircle, Play, Pause, DollarSign, TrendingUp, CheckCircle2, Copy, ExternalLink, Sparkles } from "lucide-react";

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

export default function ClientCampaigns() {
  const { data: session } = useSession();
  
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [generatedResult, setGeneratedResult] = useState<GeneratedCopy | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here in the future
  };

  const submitGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.backendToken || !businessDescription.trim()) return;
    
    setGenerateLoading(true);
    setGenerateError("");
    setGeneratedResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns/generate`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          business_description: businessDescription
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedResult(data);
      } else {
        const errData = await res.json();
        setGenerateError(errData.detail || "Error generating campaign copy.");
      }
    } catch (err) {
      setGenerateError("Network error when communicating with AI.");
    } finally {
      setGenerateLoading(false);
    }
  };

  useEffect(() => {
    async function fetchAccounts() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.connected_accounts || []);
          if (data.connected_accounts?.length > 0) {
            setSelectedAccount(data.connected_accounts[0].target_customer_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    }
    fetchAccounts();
  }, [session]);

  useEffect(() => {
    async function fetchCampaigns() {
      if (!session?.backendToken || !selectedAccount) return;
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns?customer_id=${selectedAccount}`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.detail || "Error fetching campaigns.");
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
        setErrorMsg("Connection failure.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [session, selectedAccount]);

  // KPIs
  const totalCost = campaigns.reduce((acc, c) => acc + c.cost, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
  const avgCpa = totalConversions > 0 ? totalCost / totalConversions : 0;

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Campaigns</h1>
          <p className="text-gray-400">Aggregated metrics from the last 30 days for the selected account.</p>
        </div>
        
        {accounts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <select 
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-black/20 border border-dark-card-border text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors cursor-pointer min-w-[200px]"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.target_customer_id} className="text-black">
                  ID: {acc.target_customer_id}
                </option>
              ))}
            </select>
            <button 
              onClick={() => {
                setIsModalOpen(true);
                setGeneratedResult(null);
                setBusinessDescription("");
              }}
              className="bg-neon-purple text-white px-5 py-3 rounded-lg font-medium hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> AI Campaign Generator
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col">
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-gray-500" /> Total Spend
          </p>
          <h2 className="text-3xl font-bold text-white">${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col">
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <Activity size={16} className="text-gray-500" /> Clicks
          </p>
          <h2 className="text-3xl font-bold text-white">{totalClicks.toLocaleString("en-US")}</h2>
        </div>
        <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border p-6 rounded-2xl flex flex-col">
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-500" /> Avg. CPA
          </p>
          <h2 className="text-3xl font-bold text-white">${avgCpa.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="bg-dark-card backdrop-blur-xl border border-neon-purple/30 p-6 rounded-2xl flex flex-col shadow-[0_0_20px_rgba(168,85,247,0.05)]">
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-neon-purple" /> Conversions
          </p>
          <h2 className="text-3xl font-bold text-neon-purple">{totalConversions.toLocaleString("en-US")}</h2>
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
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Activity className="animate-spin mx-auto mb-4" size={24} />
                    Loading metrics from Google Ads...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="mx-auto mb-4 opacity-50" size={32} />
                    {accounts.length === 0 ? "You have no Google Ads accounts connected." : "No active campaigns found in the last 30 days."}
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

      {/* CREATE CAMPAIGN AI MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-card-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-dark-card-border flex items-center justify-between bg-[#0B0E14]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-neon-purple" size={24} /> AI Campaign Generator
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-black/40">
              {generateError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} /> {generateError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Prompt */}
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Describe what you are selling or offering. Our AI will craft the perfect keywords, headlines, and descriptions tailored for Google Ads.
                  </p>
                  <form onSubmit={submitGenerate} className="space-y-4">
                    <textarea 
                      required 
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Ej: Somos un despacho de abogados en Miami especializados en inmigración, asilos, visas de trabajo y residencias. Ofrecemos la primera consulta gratis..." 
                      className="w-full bg-black/50 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors min-h-[160px] resize-y"
                    />
                    <button 
                      type="submit" 
                      disabled={generateLoading || !businessDescription.trim()} 
                      className="w-full px-6 py-3 bg-neon-purple text-white rounded-xl font-medium hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generateLoading ? (
                        <><Activity size={18} className="animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles size={18} /> Generate Campaign Copy</>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right Side: Results */}
                <div className="bg-dark-card border border-dark-card-border rounded-xl p-5 overflow-y-auto max-h-[500px]">
                  {!generatedResult && !generateLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
                      <Sparkles size={32} className="opacity-30 mb-3" />
                      <p>Your generated copy will appear here.</p>
                    </div>
                  )}
                  {generateLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-neon-purple min-h-[200px]">
                      <Activity size={32} className="animate-spin mb-3" />
                      <p>Crafting high-converting ad copy...</p>
                    </div>
                  )}
                  {generatedResult && !generateLoading && (
                    <div className="space-y-6 animate-fade-in-up">
                      
                      {/* Campaign Name */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-neon-purple">Campaign Name</label>
                          <button onClick={() => copyToClipboard(generatedResult.campaign_name)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy
                          </button>
                        </div>
                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-white font-medium">
                          {generatedResult.campaign_name}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-neon-purple">Keywords ({generatedResult.keywords.length})</label>
                          <button onClick={() => copyToClipboard(generatedResult.keywords.join("\n"))} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy All
                          </button>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                          {generatedResult.keywords.join("\n")}
                        </div>
                      </div>

                      {/* Headlines */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-neon-purple">Headlines (Max 30 chars)</label>
                          <button onClick={() => copyToClipboard(generatedResult.headlines.join("\n"))} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy All
                          </button>
                        </div>
                        <div className="space-y-2">
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

                      {/* Descriptions */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-semibold text-neon-purple">Descriptions (Max 90 chars)</label>
                          <button onClick={() => copyToClipboard(generatedResult.descriptions.join("\n"))} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <Copy size={14} /> Copy All
                          </button>
                        </div>
                        <div className="space-y-2">
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
                  )}
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-dark-card-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0B0E14]">
              <p className="text-gray-400 text-sm">
                Once generated, copy these into your Google Ads Manager.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 border border-dark-card-border rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors w-full sm:w-auto"
                >
                  Close
                </button>
                <a 
                  href="https://ads.google.com/aw/campaigns" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Open Google Ads <ExternalLink size={16} />
                </a>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
