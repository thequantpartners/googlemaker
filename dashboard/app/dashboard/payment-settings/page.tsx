"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  CreditCard, Zap, Link2, Copy, CheckCircle2, AlertCircle,
  Eye, EyeOff, ExternalLink, Save, RefreshCw,
} from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/50 rounded-xl ${className}`} />;
}

type Provider = "stripe" | "paypal" | "custom";

interface PaymentConfig {
  id: string;
  provider: Provider;
  custom_payment_link: string | null;
  generic_webhook_secret: string | null;
  consultation_fee: number | null;
  has_stripe_key: boolean;
  has_paypal_key: boolean;
}

const PROVIDER_META: Record<Provider, { label: string; color: string; desc: string }> = {
  stripe: {
    label: "Stripe",
    color: "from-[#635BFF]/20 to-[#0A2540]/10 border-[#635BFF]/30",
    desc: "US-based law firms. Accepts cards, Apple Pay, Google Pay.",
  },
  paypal: {
    label: "PayPal",
    color: "from-[#003087]/20 to-[#009CDE]/10 border-[#003087]/30",
    desc: "Global coverage. No monthly fee, 2.9%+$0.30 per transaction.",
  },
  custom: {
    label: "Other / Custom",
    color: "from-neon-green/10 to-emerald-900/10 border-neon-green/20",
    desc: "LawPay, Square, Clio Payments, or any external payment page.",
  },
};

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 " +
  "focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.06] transition-all";

export default function PaymentSettingsPage() {
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);

  // Form state
  const [provider, setProvider] = useState<Provider>("custom");
  const [consultationFee, setConsultationFee] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");

  const webhookBaseUrl = API?.replace("/api", "") ?? "";
  const stripeWebhookUrl = `${webhookBaseUrl}/webhooks/stripe/${session?.user?.id ?? "{your_client_id}"}`;
  const genericWebhookUrl = config
    ? `${webhookBaseUrl}/webhooks/generic/${session?.user?.id ?? "{your_client_id}"}`
    : "";

  useEffect(() => {
    if (!session?.backendToken) return;
    fetchConfig();
  }, [session]);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/me/payment-config`, {
        headers: { Authorization: `Bearer ${session!.backendToken}` },
      });
      if (res.ok) {
        const data: PaymentConfig = await res.json();
        setConfig(data);
        setProvider(data.provider as Provider);
        setConsultationFee(data.consultation_fee?.toString() ?? "");
        setCustomLink(data.custom_payment_link ?? "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!session?.backendToken) return;
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        provider,
        consultation_fee: consultationFee ? parseFloat(consultationFee) : null,
      };
      if (provider === "custom") body.custom_payment_link = customLink || null;
      if (provider === "stripe") {
        if (stripeSecretKey) body.stripe_secret_key = stripeSecretKey;
        if (stripeWebhookSecret) body.stripe_webhook_secret = stripeWebhookSecret;
      }
      if (provider === "paypal") {
        if (paypalClientId) body.paypal_client_id = paypalClientId;
        if (paypalClientSecret) body.paypal_client_secret = paypalClientSecret;
      }

      const res = await fetch(`${API}/clients/me/payment-config`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setMsg({ type: "ok", text: "Payment configuration saved." });
        // Clear sensitive fields after save
        setStripeSecretKey("");
        setStripeWebhookSecret("");
        setPaypalClientSecret("");
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg({ type: "err", text: err.detail ?? "Failed to save." });
      }
    } catch (e) {
      setMsg({ type: "err", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Payment Settings</h1>
        <p className="text-gray-400 text-sm">
          Configure how your clients pay for consultations captured by the chat widget.
        </p>
      </div>

      {msg && (
        <div className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-medium
          ${msg.type === "ok"
            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
            : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {msg.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Consultation Fee ─────────────────────────────────────────────── */}
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
                <CreditCard size={18} className="text-neon-purple" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">Consultation Fee</h2>
                <p className="text-gray-500 text-xs mt-0.5">Charged after lead capture in the widget</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">Set to 0 to disable payment collection.</p>
          </div>

          {/* ── Provider Selection ───────────────────────────────────────────── */}
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
                <Zap size={18} className="text-neon-blue" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">Payment Provider</h2>
                <p className="text-gray-500 text-xs mt-0.5">Choose how you collect payments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {(["stripe", "paypal", "custom"] as Provider[]).map((p) => {
                const meta = PROVIDER_META[p];
                const isActive = provider === p;
                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`relative text-left p-4 rounded-xl border bg-gradient-to-br transition-all duration-200
                      ${isActive
                        ? `${meta.color} shadow-[0_0_20px_rgba(168,85,247,0.1)]`
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute top-2 right-2">
                        <CheckCircle2 size={14} className="text-neon-green" />
                      </span>
                    )}
                    <p className="text-sm font-semibold text-white mb-1">{meta.label}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{meta.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* ── Stripe fields ── */}
            {provider === "stripe" && (
              <div className="space-y-4 border-t border-white/[0.06] pt-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Stripe Credentials</p>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Secret Key
                    {config?.has_stripe_key && (
                      <span className="ml-2 text-neon-green text-[10px]">● Connected</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showStripeKey ? "text" : "password"}
                      placeholder={config?.has_stripe_key ? "sk_live_••••••••••••••••" : "sk_live_..."}
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      onClick={() => setShowStripeKey(!showStripeKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showStripeKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Found in Stripe Dashboard → Developers → API keys
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Webhook Signing Secret</label>
                  <input
                    type="password"
                    placeholder="whsec_..."
                    value={stripeWebhookSecret}
                    onChange={(e) => setStripeWebhookSecret(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Stripe Webhook URL */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 mt-2">
                  <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                    <Link2 size={12} /> Your Stripe Webhook URL
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-300 flex-1 truncate">{stripeWebhookUrl}</code>
                    <button
                      onClick={() => copyToClipboard(stripeWebhookUrl)}
                      className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
                    >
                      {copied ? <CheckCircle2 size={13} className="text-neon-green" /> : <Copy size={13} className="text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-2">
                    Add this URL in Stripe → Developers → Webhooks. Listen to{" "}
                    <code className="text-gray-400">checkout.session.completed</code>.
                  </p>
                </div>
              </div>
            )}

            {/* ── PayPal fields ── */}
            {provider === "paypal" && (
              <div className="space-y-4 border-t border-white/[0.06] pt-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">PayPal Credentials</p>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Client ID
                    {config?.has_paypal_key && (
                      <span className="ml-2 text-neon-green text-[10px]">● Connected</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="AYSq3..."
                    value={paypalClientId}
                    onChange={(e) => setPaypalClientId(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Client Secret</label>
                  <div className="relative">
                    <input
                      type={showPaypalSecret ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      value={paypalClientSecret}
                      onChange={(e) => setPaypalClientSecret(e.target.value)}
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPaypalSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-amber-400">
                    PayPal direct checkout is coming soon. Use the Generic Webhook below to mark payments manually.
                  </p>
                </div>
              </div>
            )}

            {/* ── Custom / Other fields ── */}
            {provider === "custom" && (
              <div className="space-y-4 border-t border-white/[0.06] pt-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Custom Payment Link</p>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Payment Page URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://lawpay.com/pay/your-firm"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      className={inputCls}
                    />
                    {customLink && (
                      <a
                        href={customLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    The widget appends <code className="text-gray-400">?lead_id=XXX&type=consultation</code> automatically.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Generic Webhook (all providers) ─────────────────────────────── */}
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Link2 size={18} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">Generic Webhook</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Notify GMaker of any payment from any provider
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">Webhook Endpoint</p>
                <div className="flex items-center gap-2 bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3">
                  <code className="text-xs text-gray-300 flex-1 truncate">{genericWebhookUrl}</code>
                  <button
                    onClick={() => copyToClipboard(genericWebhookUrl)}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
                  >
                    {copied ? <CheckCircle2 size={13} className="text-neon-green" /> : <Copy size={13} className="text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">Secret Key (header: <code className="text-gray-500">X-Webhook-Secret</code>)</p>
                <div className="flex items-center gap-2 bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3">
                  <code className="text-xs text-gray-300 flex-1 truncate font-mono">
                    {config?.generic_webhook_secret ?? "Loading..."}
                  </code>
                  {config?.generic_webhook_secret && (
                    <button
                      onClick={() => copyToClipboard(config.generic_webhook_secret!)}
                      className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
                    >
                      {copied ? <CheckCircle2 size={13} className="text-neon-green" /> : <Copy size={13} className="text-gray-400" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-black/20 border border-white/[0.04] rounded-xl p-4">
                <p className="text-[11px] text-gray-500 font-medium mb-2">Expected JSON body:</p>
                <pre className="text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
{`{
  "lead_id":      "uuid-of-the-lead",
  "payment_type": "consultation" | "full_case",
  "amount":       150.00
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* ── Save Button ───────────────────────────────────────────────────── */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm text-white
                         bg-gradient-to-r from-neon-purple to-neon-blue
                         hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving…" : "Save Payment Settings"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
