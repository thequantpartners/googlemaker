"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User, Mail, CreditCard, AlertTriangle, Activity, Unplug, Send, Phone, Code, Copy, Check, Sparkles, Globe, Video } from "lucide-react";

const COUNTRIES = [
  { name: "Perú", code: "51", flag: "🇵🇪", digits: 9 },
  { name: "México", code: "52", flag: "🇲🇽", digits: 10 },
  { name: "Colombia", code: "57", flag: "🇨🇴", digits: 10 },
  { name: "Argentina", code: "54", flag: "🇦🇷", digits: 10 },
  { name: "Chile", code: "56", flag: "🇨🇱", digits: 9 },
  { name: "EE.UU. / Canadá", code: "1", flag: "🇺🇸", digits: 10 },
  { name: "España", code: "34", flag: "🇪🇸", digits: 9 },
  { name: "Ecuador", code: "593", flag: "🇪🇨", digits: 9 },
  { name: "Guatemala", code: "502", flag: "🇬🇹", digits: 8 },
  { name: "El Salvador", code: "503", flag: "🇸🇻", digits: 8 },
  { name: "Honduras", code: "504", flag: "🇭🇳", digits: 8 },
  { name: "Nicaragua", code: "505", flag: "🇳🇮", digits: 8 },
  { name: "Costa Rica", code: "506", flag: "🇨🇷", digits: 8 },
  { name: "Panamá", code: "507", flag: "🇵🇦", digits: 8 },
  { name: "Rep. Dominicana", code: "1", flag: "🇩🇴", digits: 10 },
  { name: "Bolivia", code: "591", flag: "🇧🇴", digits: 8 },
  { name: "Paraguay", code: "595", flag: "🇵🇾", digits: 9 },
  { name: "Uruguay", code: "598", flag: "🇺🇾", digits: 8 },
  { name: "Venezuela", code: "58", flag: "🇻🇪", digits: 10 },
  { name: "Brasil", code: "55", flag: "🇧🇷", digits: 11 },
  { name: "Reino Unido", code: "44", flag: "🇬🇧", digits: 10 },
  { name: "Italia", code: "39", flag: "🇮🇹", digits: 10 },
  { name: "Francia", code: "33", flag: "🇫🇷", digits: 9 },
  { name: "Alemania", code: "49", flag: "🇩🇪", digits: 10 },
];

function parsePhoneNumber(rawPhone: string) {
  const cleaned = rawPhone.replace(/\D/g, "");
  if (!cleaned) return { code: "51", local: "" };
  
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const country of sortedCountries) {
    if (cleaned.startsWith(country.code) && cleaned.length > country.code.length) {
      return { code: country.code, local: cleaned.slice(country.code.length) };
    }
  }
  return { code: "51", local: cleaned };
}

function getTiktokPixelScript(pixelId: string) {
  return `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var tt=w[t]=w[t]||[];tt.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","addUserData"],tt.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<tt.methods.length;i++)tt.setAndDefer(tt,tt.methods[i]);tt.instance=function(t){for(var e=tt._i[t]||[],n=0;n<tt.methods.length;n++)tt.setAndDefer(e,tt.methods[n]);return e},tt.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";tt._i=tt._i||{},tt._i[e]=[],tt._i[e]._u=i,tt._t=tt._t||{},tt._t[e]=+new Date,tt._t[e]._o=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  tt.load('${pixelId}');
  tt.page();
}(window, document, 'ttq');
</script>`;
}

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("51");
  const [localPhone, setLocalPhone] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Pixel Manager States
  const [googlePixelSnippet, setGooglePixelSnippet] = useState<string>("");
  const [tiktokPixelId, setTiktokPixelId] = useState<string>("");
  const [copiedGoogle, setCopiedGoogle] = useState(false);
  const [copiedTiktok, setCopiedTiktok] = useState(false);
  const [generatingGooglePixel, setGeneratingGooglePixel] = useState(false);

  const fetchProfile = async () => {
    if (!session?.backendToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.whatsapp_phone) {
          setWhatsappPhone(data.whatsapp_phone);
          const parsed = parsePhoneNumber(data.whatsapp_phone);
          setSelectedCountryCode(parsed.code);
          setLocalPhone(parsed.local);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const country = COUNTRIES.find(c => c.code === code);
    let cleaned = localPhone.replace(/\D/g, "");
    if (country && cleaned.length > country.digits) {
      cleaned = cleaned.slice(0, country.digits);
      setLocalPhone(cleaned);
    }
    setWhatsappPhone(code + cleaned);
  };

  const handleLocalPhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, "");
    
    // Auto-detect pasted full international phone number starting with country code
    const matchedCountry = COUNTRIES.find(c => cleaned.startsWith(c.code) && cleaned.length > c.code.length + 4);
    let codeToUse = selectedCountryCode;
    if (matchedCountry) {
      codeToUse = matchedCountry.code;
      setSelectedCountryCode(matchedCountry.code);
      cleaned = cleaned.slice(matchedCountry.code.length);
    }
    
    const country = COUNTRIES.find(c => c.code === codeToUse);
    const maxDigits = country?.digits || 10;
    if (cleaned.length > maxDigits) {
      cleaned = cleaned.slice(0, maxDigits);
    }

    setLocalPhone(cleaned);
    setWhatsappPhone(codeToUse + cleaned);
  };

  const handleGenerateGooglePixel = async () => {
    if (!session?.backendToken) return;
    setGeneratingGooglePixel(true);
    try {
      const credRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/status`, {
        headers: { Authorization: `Bearer ${session.backendToken}` }
      });
      if (credRes.ok) {
        const data = await credRes.json();
        const connectedCred = data.connected_accounts?.[0];
        if (connectedCred && connectedCred.id) {
          const pixRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials/${connectedCred.id}/pixels`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.backendToken}` }
          });
          if (pixRes.ok) {
            const pixData = await pixRes.json();
            const globalTag = pixData.global_site_tag || pixData.event_snippet || JSON.stringify(pixData, null, 2);
            setGooglePixelSnippet(globalTag);
          } else {
            setGooglePixelSnippet(`<!-- Global Site Tag (gtag.js) - Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-QSS-PIXEL"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-QSS-PIXEL');
</script>`);
          }
        } else {
          alert("Primero conecta tu cuenta de Google Ads en la Conexión 3 Pasos.");
        }
      }
    } catch (e) {
      console.error("Pixel error:", e);
    } finally {
      setGeneratingGooglePixel(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect all your Google Ads accounts? You will need to sign in again to reconnect them.")) return;
    
    if (!session?.backendToken) return;
    setDisconnecting(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me/credentials`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });
      if (res.ok) {
        setMsg({ text: "Google Ads accounts disconnected successfully.", type: "success" });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMsg({ text: "Error disconnecting accounts.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Network connection error.", type: "error" });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!session?.backendToken) return;
    setSavingWhatsapp(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${session.backendToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ whatsapp_phone: whatsappPhone })
      });
      if (res.ok) {
        setMsg({ text: "WhatsApp number saved successfully.", type: "success" });
        fetchProfile();
      } else {
        setMsg({ text: "Error saving WhatsApp number.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Network connection error.", type: "error text-error" });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const currentCountryObj = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Activity className="animate-spin text-neon-purple mb-4" size={32} />
        <p className="text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 text-lg">
          Manage your personal profile and account connections.
        </p>
      </div>

      {msg.text && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
          msg.type === "error" 
            ? "bg-red-500/10 border-red-500/30 text-red-500" 
            : "bg-neon-green/10 border-neon-green/30 text-neon-green"
        }`}>
          <AlertTriangle size={20} /> {msg.text}
        </div>
      )}

      {/* PERFIL */}
      <div className="bg-dark-card backdrop-blur-xl border border-dark-card-border rounded-[2rem] p-6 md:p-8 mb-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-card-border pb-4">
          <User className="text-neon-purple" size={24} /> User Profile
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <User size={16} /> Name
            </label>
            <input 
              type="text" 
              value={profile?.name || session?.user?.name || ""} 
              disabled 
              className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <Mail size={16} /> Email Address
            </label>
            <input 
              type="email" 
              value={profile?.email || session?.user?.email || ""} 
              disabled 
              className="w-full bg-black/20 border border-dark-card-border rounded-xl px-4 py-3 text-white focus:outline-none cursor-not-allowed opacity-70"
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <CreditCard size={16} /> Current Plan
            </label>
            <input 
              type="text" 
              value={(profile?.tier || "none").toUpperCase()} 
              disabled 
              className="w-full bg-neon-purple/5 border border-neon-purple/20 rounded-xl px-4 py-3 text-neon-purple font-bold focus:outline-none cursor-not-allowed uppercase"
            />
          </div>
        </div>
      </div>

      {/* CONEXIONES */}
      <div className="bg-dark-card backdrop-blur-xl border border-red-500/30 rounded-[2rem] p-6 md:p-8">
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2 border-b border-red-500/10 pb-4">
          <Unplug size={24} /> Active Connections
        </h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          If you are experiencing sync issues or wish to use a different Google account, you can disconnect your current credentials. Access will be revoked, and you can reconnect from the main Dashboard.
        </p>
        <button 
          onClick={handleDisconnect} 
          disabled={disconnecting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 hover:border-red-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Unplug size={18} />
          {disconnecting ? "Disconnecting..." : "Disconnect Google Ads"}
        </button>
      </div>

      {/* WHATSAPP PERSONAL (MASTER SETTER) */}
      <div className="bg-dark-card backdrop-blur-xl border border-neon-green/30 rounded-[2rem] p-6 md:p-8 mt-8">
        <h2 className="text-xl font-bold text-neon-green mb-4 flex items-center gap-2 border-b border-neon-green/10 pb-4">
          <Phone size={24} /> Alertas por WhatsApp (Master Setter)
        </h2>
        <p className="text-gray-400 mb-6 leading-relaxed">
          Selecciona el país e ingresa tu número de WhatsApp. El Master Setter te enviará notificaciones instantáneas aquí cuando consigas un nuevo lead o agendes una cita.
        </p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex gap-2.5 flex-1 w-full items-center">
            <select
              value={selectedCountryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all text-sm font-semibold cursor-pointer shrink-0"
            >
              {COUNTRIES.map((c, idx) => (
                <option key={`${c.code}-${c.flag}-${idx}`} value={c.code} className="bg-[#0a0c10] text-white py-1">
                  {c.flag} +{c.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={localPhone}
              onChange={(e) => handleLocalPhoneChange(e.target.value)}
              placeholder="902105668"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green text-sm font-mono tracking-wide"
            />
          </div>
          <button 
            onClick={handleSaveWhatsapp} 
            disabled={savingWhatsapp || !whatsappPhone}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-neon-green/20 hover:bg-neon-green text-neon-green hover:text-[#0B0E14] border border-neon-green/50 hover:border-neon-green rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shrink-0"
          >
            {savingWhatsapp ? "Guardando..." : "Guardar Número"}
          </button>
        </div>
        {whatsappPhone && (
          <div className="flex items-center justify-between text-xs text-gray-400 mt-3 px-1">
            <span className="flex items-center gap-1.5">
              <span>{currentCountryObj.flag} {currentCountryObj.name}:</span>
              <span className="text-neon-green font-mono font-semibold">+{whatsappPhone}</span>
            </span>
            <span className={localPhone.length === currentCountryObj.digits ? "text-emerald-400 font-medium" : "text-gray-500"}>
              {localPhone.length}/{currentCountryObj.digits} dígitos
            </span>
          </div>
        )}
      </div>

      {/* PÍXELES & CÓDIGO DE SEGUIMIENTO (LANDING PAGE) */}
      <div className="bg-dark-card backdrop-blur-xl border border-neon-purple/30 rounded-[2rem] p-6 md:p-8 mt-8">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 border-b border-dark-card-border pb-4">
          <Code className="text-neon-purple" size={24} /> Píxeles & Código de Seguimiento (Landing Page)
        </h2>
        <p className="text-gray-400 mb-6 leading-relaxed text-sm">
          Genera y copia el código de seguimiento oficial para instalar en el <code className="text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded">&lt;head&gt;</code> de tu Landing Page (Shopify, WordPress, Webflow, etc.).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PÍXEL DE GOOGLE ADS */}
          <div className="bg-[#0a0c10] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 font-bold text-white text-base">
                  <Globe className="text-neon-blue" size={20} /> Google Ads Tag (gtag.js)
                </span>
                <span className="text-[10px] bg-neon-blue/10 border border-neon-blue/30 text-neon-blue font-bold px-2 py-0.5 rounded-full uppercase">
                  Auto-Generador
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Mide visitas y conversiones de tus campañas de Google Ads.
              </p>

              {googlePixelSnippet ? (
                <div className="space-y-2">
                  <div className="relative bg-black/40 border border-gray-800 rounded-xl p-3 max-h-36 overflow-y-auto text-[11px] font-mono text-gray-300">
                    <pre className="whitespace-pre-wrap break-all">{googlePixelSnippet}</pre>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(googlePixelSnippet);
                      setCopiedGoogle(true);
                      setTimeout(() => setCopiedGoogle(false), 2500);
                    }}
                    className="w-full py-2.5 rounded-xl bg-neon-blue/20 hover:bg-neon-blue text-neon-blue hover:text-black border border-neon-blue/50 font-bold transition-all text-xs flex items-center justify-center gap-2"
                  >
                    {copiedGoogle ? <Check size={16} /> : <Copy size={16} />}
                    {copiedGoogle ? "¡Código Copiado!" : "Copiar Píxel de Google Ads"}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center space-y-3">
                  <p className="text-xs text-gray-300">
                    Genera tu Global Site Tag directamente conectado con tu cuenta publicitaria.
                  </p>
                  <button
                    onClick={handleGenerateGooglePixel}
                    disabled={generatingGooglePixel}
                    className="px-4 py-2.5 rounded-xl bg-neon-blue text-black font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <Sparkles size={14} />
                    {generatingGooglePixel ? "Generando Píxel..." : "Generar Píxel de Google Ads"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PÍXEL DE TIKTOK ADS */}
          <div className="bg-[#0a0c10] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 font-bold text-white text-base">
                  <Video className="text-neon-pink" size={20} /> TikTok Ads Pixel
                </span>
                <span className="text-[10px] bg-neon-pink/10 border border-neon-pink/30 text-neon-pink font-bold px-2 py-0.5 rounded-full uppercase">
                  Base Code
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Ingresa tu TikTok Pixel ID para formatear tu código listo para copiar.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">TikTok Pixel ID</label>
                  <input
                    type="text"
                    value={tiktokPixelId}
                    onChange={(e) => setTiktokPixelId(e.target.value)}
                    placeholder="Ej: C1234567890ABCDEF"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-neon-pink"
                  />
                </div>

                <div className="relative bg-black/40 border border-gray-800 rounded-xl p-3 max-h-28 overflow-y-auto text-[10px] font-mono text-gray-400">
                  <pre className="whitespace-pre-wrap break-all">
                    {getTiktokPixelScript(tiktokPixelId || "TU_PIXEL_ID")}
                  </pre>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getTiktokPixelScript(tiktokPixelId || "TU_PIXEL_ID"));
                    setCopiedTiktok(true);
                    setTimeout(() => setCopiedTiktok(false), 2500);
                  }}
                  className="w-full py-2.5 rounded-xl bg-neon-pink/20 hover:bg-neon-pink text-neon-pink hover:text-black border border-neon-pink/50 font-bold transition-all text-xs flex items-center justify-center gap-2"
                >
                  {copiedTiktok ? <Check size={16} /> : <Copy size={16} />}
                  {copiedTiktok ? "¡Código Copiado!" : "Copiar Píxel de TikTok Ads"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

