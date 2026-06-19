"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Plus, X, Search, Activity, AlertCircle, Play, Pause, DollarSign, TrendingUp, CheckCircle2 } from "lucide-react";

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

export default function ClientCampaigns() {
  const { data: session } = useSession();
  
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    campaign_name: "",
    daily_budget: 50,
    final_url: "",
    keywords_text: "",
    headlines: ["", "", ""], // min 3
    descriptions: ["", ""] // min 2
  });

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: 'headlines' | 'descriptions', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'headlines' | 'descriptions') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field: 'headlines' | 'descriptions', index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const submitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.backendToken || !selectedAccount) return;
    
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    
    const keywords = formData.keywords_text.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    const validHeadlines = formData.headlines.map(h => h.trim()).filter(h => h.length > 0);
    const validDescriptions = formData.descriptions.map(d => d.trim()).filter(d => d.length > 0);
    
    if (validHeadlines.length < 3) {
      setCreateError("You must enter at least 3 headlines.");
      setCreateLoading(false);
      return;
    }
    if (validDescriptions.length < 2) {
      setCreateError("You must enter at least 2 descriptions.");
      setCreateLoading(false);
      return;
    }
    if (keywords.length === 0) {
      setCreateError("You must enter at least 1 keyword.");
      setCreateLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/campaigns?customer_id=${selectedAccount}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          campaign_name: formData.campaign_name,
          daily_budget: formData.daily_budget,
          final_url: formData.final_url,
          keywords: keywords,
          headlines: validHeadlines,
          descriptions: validDescriptions
        })
      });
      
      if (res.ok) {
        setCreateSuccess("Campaign successfully created. It will appear in the table shortly.");
        setTimeout(() => {
          setIsModalOpen(false);
          setCreateSuccess("");
          setFormData({
            campaign_name: "",
            daily_budget: 50,
            final_url: "",
            keywords_text: "",
            headlines: ["", "", ""],
            descriptions: ["", ""]
          });
          setLoading(true);
          window.location.reload();
        }, 2000);
      } else {
        const errData = await res.json();
        setCreateError(errData.detail || "Error creating campaign.");
      }
    } catch (err) {
      setCreateError("Network error when creating campaign.");
    } finally {
      setCreateLoading(false);
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
              onClick={() => setIsModalOpen(true)}
              className="bg-neon-purple text-white px-5 py-3 rounded-lg font-medium hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Create Campaign
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

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-card-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-dark-card-border flex items-center justify-between bg-[#0B0E14]">
              <h2 className="text-xl font-bold text-white">Create Search Campaign</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {createError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} /> {createError}
                </div>
              )}
              {createSuccess && (
                <div className="mb-6 p-4 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={20} /> {createSuccess}
                </div>
              )}

              <form id="createCampaignForm" onSubmit={submitCampaign} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Campaign Name</label>
                  <input 
                    required 
                    type="text" 
                    name="campaign_name" 
                    value={formData.campaign_name} 
                    onChange={handleFormChange} 
                    className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Daily Budget (USD)</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      step="0.01" 
                      name="daily_budget" 
                      value={formData.daily_budget} 
                      onChange={handleFormChange} 
                      className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Final Landing URL</label>
                    <input 
                      required 
                      type="url" 
                      name="final_url" 
                      placeholder="https://..." 
                      value={formData.final_url} 
                      onChange={handleFormChange} 
                      className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Keywords (one per line)</label>
                  <textarea 
                    required 
                    name="keywords_text" 
                    value={formData.keywords_text} 
                    onChange={handleFormChange} 
                    placeholder={"e.g.: buy shoes\nfashion shoes"} 
                    className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors min-h-[100px] resize-y" 
                  />
                </div>

                <div className="bg-white/[0.02] border border-dark-card-border p-4 rounded-xl">
                  <label className="block text-sm font-medium text-white mb-1">Ad Headlines</label>
                  <p className="text-gray-500 text-xs mb-4">Min 3, Max 15. Maximum 30 characters each.</p>
                  <div className="space-y-3">
                    {formData.headlines.map((hl, i) => (
                      <div key={`hl-${i}`} className="flex gap-2 items-center">
                        <input 
                          required={i < 3} 
                          type="text" 
                          maxLength={30} 
                          value={hl} 
                          onChange={(e) => handleArrayChange('headlines', i, e.target.value)} 
                          placeholder={`Headline ${i + 1}`} 
                          className="flex-1 bg-black/20 border border-dark-card-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-neon-purple transition-colors text-sm" 
                        />
                        {i >= 3 && (
                          <button type="button" onClick={() => removeArrayItem('headlines', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.headlines.length < 15 && (
                    <button type="button" onClick={() => addArrayItem('headlines')} className="mt-4 text-neon-purple text-sm font-medium hover:underline flex items-center gap-1">
                      <Plus size={16} /> Add Headline
                    </button>
                  )}
                </div>

                <div className="bg-white/[0.02] border border-dark-card-border p-4 rounded-xl">
                  <label className="block text-sm font-medium text-white mb-1">Ad Descriptions</label>
                  <p className="text-gray-500 text-xs mb-4">Min 2, Max 4. Maximum 90 characters each.</p>
                  <div className="space-y-3">
                    {formData.descriptions.map((desc, i) => (
                      <div key={`desc-${i}`} className="flex gap-2 items-center">
                        <input 
                          required={i < 2} 
                          type="text" 
                          maxLength={90} 
                          value={desc} 
                          onChange={(e) => handleArrayChange('descriptions', i, e.target.value)} 
                          placeholder={`Description ${i + 1}`} 
                          className="flex-1 bg-black/20 border border-dark-card-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-neon-purple transition-colors text-sm" 
                        />
                        {i >= 2 && (
                          <button type="button" onClick={() => removeArrayItem('descriptions', i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.descriptions.length < 4 && (
                    <button type="button" onClick={() => addArrayItem('descriptions')} className="mt-4 text-neon-purple text-sm font-medium hover:underline flex items-center gap-1">
                      <Plus size={16} /> Add Description
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-dark-card-border flex flex-col sm:flex-row justify-end gap-3 bg-[#0B0E14]">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-2.5 border border-dark-card-border rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="createCampaignForm"
                disabled={createLoading} 
                className="px-6 py-2.5 bg-neon-purple text-white rounded-xl font-medium hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 w-full sm:w-auto flex items-center justify-center"
              >
                {createLoading ? "Creating..." : "Create (Starts Paused)"}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
