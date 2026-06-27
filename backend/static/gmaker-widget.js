/**
 * gmaker-widget.js — GMaker Chat Widget
 * Self-contained, zero-dependency script.
 *
 * Usage:
 *   <script src="https://YOUR_API/static/gmaker-widget.js?client=CLIENT_ID"></script>
 *
 * The widget derives its API base URL from the script's own src, so no
 * hard-coded domain is needed.  It stores the session_id in localStorage
 * scoped to the client_id so multiple widgets on different domains never clash.
 */
(function (win, doc) {
  'use strict';

  /* ── 1. Bootstrap: extract client_id and API origin from script src ───── */

  var scriptEl = doc.currentScript || (function () {
    var scripts = doc.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var scriptSrc  = scriptEl.src;
  var scriptUrl  = new URL(scriptSrc);
  var CLIENT_ID  = scriptUrl.searchParams.get('client');
  // API origin is everything before "/static/"
  var BASE_URL   = scriptSrc.split('/static/')[0].replace(/\/$/, '');

  if (!CLIENT_ID) {
    console.warn('[GMaker] Missing ?client=ID on the script tag.');
    return;
  }

  var API         = BASE_URL + '/widget/chat/' + CLIENT_ID;
  var STORAGE_KEY = 'gm_sid_' + CLIENT_ID;
  var sessionId   = localStorage.getItem(STORAGE_KEY);
  var sessionState = 'RULES_MODE';
  var initialized  = false;
  var sending      = false;

  /* ── UTM / gclid tracking from page URL ───────────────────────────────── */

  function _getTrackingData() {
    try {
      var params = new URLSearchParams(win.location.search);
      return {
        gclid:        params.get('gclid')        || undefined,
        utm_source:   params.get('utm_source')   || undefined,
        utm_medium:   params.get('utm_medium')   || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
      };
    } catch (e) { return {}; }
  }

  var trackingData = _getTrackingData();

  /* ── 2. CSS (all classes prefixed with gm- to avoid host-page conflicts) */

  var CSS = [
    '#gm-root{all:initial} #gm-root *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:0}',
    '#gm-root #gm-btn{position:fixed;bottom:24px;right:24px;z-index:2147483646;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(168,85,247,0.9) 100%);box-shadow:0 0 20px rgba(139, 92, 246, 0.7), 0 0 40px rgba(124, 58, 237, 0.5), 0 0 60px rgba(109, 40, 217, 0.3);border:2px solid rgba(255, 255, 255, 0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.5s}',
    '#gm-root #gm-btn::before{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);opacity:0.3;border:2px solid rgba(255,255,255,0.1);pointer-events:none}',
    '#gm-root #gm-btn::after{content:"";position:absolute;inset:0;border-radius:50%;background:#6366f1;opacity:0.2;pointer-events:none;animation:gmPing 2s cubic-bezier(0, 0, 0.2, 1) infinite}',
    '#gm-root #gm-btn svg{width:32px;height:32px;color:#fff;position:relative;z-index:10;transition:transform 0.3s;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '#gm-root .gm-open #gm-btn{transform:rotate(90deg)}',
    '#gm-root .gm-open #gm-btn svg.gm-bot-icon{display:none}',
    '#gm-root .gm-open #gm-btn svg.gm-close-icon{display:block}',
    '#gm-root #gm-btn svg.gm-close-icon{display:none}',
    
    '#gm-root #gm-win{position:fixed;bottom:100px;right:24px;z-index:2147483645;width:420px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:linear-gradient(to bottom right, rgba(39,39,42,0.9), rgba(24,24,27,0.95));border:1px solid rgba(113,113,122,0.5);border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);display:flex;flex-direction:column;overflow:hidden;opacity:0;pointer-events:none;transform:scale(0.8) translateY(20px);transform-origin:bottom right;transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);color:#f4f4f5}',
    '#gm-root #gm-win::before{content:"";position:absolute;inset:0;border-radius:24px;pointer-events:none;background:linear-gradient(135deg, rgba(239,68,68,0.05), transparent, rgba(147,51,234,0.05))}',
    '#gm-root #gm-win.gm-open{opacity:1;pointer-events:all;transform:scale(1) translateY(0)}',
    
    '#gm-root .gm-hdr{padding:16px 24px 8px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:10}',
    '#gm-root .gm-hdr-left{display:flex;align-items:center;gap:6px}',
    '#gm-root .gm-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:gmPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite}',
    '#gm-root .gm-hdr-title{font-size:12px;font-weight:500;color:#a1a1aa}',
    '#gm-root .gm-hdr-right{display:flex;align-items:center;gap:8px}',
    '#gm-root .gm-hdr-close{padding:6px;border-radius:50%;border:none;background:transparent;cursor:pointer;transition:background 0.2s;display:flex}',
    '#gm-root .gm-hdr-close:hover{background:rgba(63,63,70,0.5)}',
    '#gm-root .gm-hdr-close svg{width:16px;height:16px;stroke:#a1a1aa;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    
    '#gm-root .gm-msgs{flex:1;overflow-y:auto;padding:16px 24px;display:flex;flex-direction:column;gap:12px;position:relative;z-index:10}',
    '#gm-root .gm-msgs::-webkit-scrollbar{width:0px}',
    
    '#gm-root .gm-bbl{max-width:85%;padding:12px 16px;border-radius:16px;font-size:15px;line-height:1.5;word-break:break-word;animation:gmIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)}',
    '#gm-root .gm-bot{background:rgba(39,39,42,0.6);color:#f4f4f5;border-bottom-left-radius:4px;border:1px solid rgba(63,63,70,0.5);align-self:flex-start}',
    '#gm-root .gm-usr{background:linear-gradient(135deg, rgba(99,102,241,0.8), rgba(168,85,247,0.8));color:#fff;border-bottom-right-radius:4px;align-self:flex-end;margin-left:auto;box-shadow:0 4px 12px rgba(139, 92, 246, 0.2)}',
    
    '#gm-root .gm-opts{display:flex;flex-direction:column;gap:8px;width:100%;animation:gmIn 0.3s ease;position:relative;z-index:10}',
    '#gm-root .gm-opt{width:100%;padding:12px 16px;text-align:left;background:rgba(39,39,42,0.6);color:#f4f4f5;border:1px solid rgba(99,102,241,0.5);border-radius:12px;cursor:pointer;font-size:14px;transition:all 0.2s}',
    '#gm-root .gm-opt:hover{background:rgba(99,102,241,0.2);border-color:rgba(99,102,241,0.8);transform:translateY(-1px)}',
    
    '#gm-root .gm-typing{display:flex;gap:6px;padding:14px 16px;background:rgba(39,39,42,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:16px;border-bottom-left-radius:4px;align-self:flex-start;width:fit-content;position:relative;z-index:10}',
    '#gm-root .gm-typing span{width:6px;height:6px;border-radius:50%;background:#a1a1aa;animation:gmBounce 1.4s infinite ease-in-out both}',
    '#gm-root .gm-typing span:nth-child(1){animation-delay:-0.32s}',
    '#gm-root .gm-typing span:nth-child(2){animation-delay:-0.16s}',
    
    '#gm-root .gm-inp-container{display:flex;flex-direction:column;position:relative;z-index:10;background:rgba(24,24,27,0.6);border-top:1px solid rgba(63,63,70,0.5);padding:16px 20px 12px;border-bottom-left-radius:24px;border-bottom-right-radius:24px}',
    '#gm-root .gm-inp-row{display:flex;align-items:flex-end;gap:10px;width:100%}',
    '#gm-root .gm-inp-wrapper{flex:1;position:relative}',
    '#gm-root .gm-inp{width:100%;min-height:44px;max-height:120px;padding:12px 16px;background:rgba(39,39,42,0.8);border:1px solid rgba(82,82,91,0.6);border-radius:18px;outline:none;resize:none;font-size:14px;color:#f4f4f5;font-family:inherit;scrollbar-width:none;line-height:1.4;transition:border-color 0.2s, background 0.2s}',
    '#gm-root .gm-inp:focus{border-color:rgba(99,102,241,0.6);background:rgba(39,39,42,1)}',
    '#gm-root .gm-inp::placeholder{color:#71717a}',
    
    '#gm-root .gm-actions{display:flex;align-items:center;gap:8px;padding-bottom:2px}',
    
    '#gm-root .gm-mic{width:36px;height:36px;border-radius:10px;border:1px solid rgba(113,113,122,0.3);background:transparent;color:#71717a;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s}',
    '#gm-root .gm-mic:hover{color:#ef4444;background:rgba(39,39,42,0.8);border-color:rgba(239,68,68,0.3);transform:scale(1.05)}',
    '#gm-root .gm-mic svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    
    '#gm-root .gm-snd{position:relative;width:44px;height:44px;border-radius:12px;border:none;background:linear-gradient(to right, #dc2626, #ef4444);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(239, 68, 68, 0.4);transition:all 0.3s}',
    '#gm-root .gm-snd:hover:not(:disabled){transform:scale(1.05) translateY(-2px);box-shadow:0 15px 20px -3px rgba(239, 68, 68, 0.5)}',
    '#gm-root .gm-snd:active:not(:disabled){transform:scale(0.95)}',
    '#gm-root .gm-snd:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none}',
    '#gm-root .gm-snd svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:all 0.3s}',
    '#gm-root .gm-snd:hover:not(:disabled) svg{transform:translateX(2px) translateY(-2px) rotate(10deg)}',
    
    '#gm-root .gm-footer{display:flex;align-items:center;justify-content:center;width:100%;margin-top:20px;font-size:10px;color:#71717a}',
    '#gm-root .gm-pw a{color:#71717a;text-decoration:none;transition:color 0.2s}',
    '#gm-root .gm-pw a:hover{color:#a1a1aa}',
    
    '#gm-root .gm-pay-cta{padding:16px 24px;background:rgba(39,39,42,0.8);border-top:1px solid rgba(63,63,70,0.5);position:relative;z-index:10}',
    '#gm-root .gm-pay-btn{width:100%;padding:12px;border-radius:12px;border:none;cursor:pointer;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(to right, #dc2626, #ef4444);box-shadow:0 4px 12px rgba(239, 68, 68, 0.3);transition:all 0.2s}',
    '#gm-root .gm-pay-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(239, 68, 68, 0.4)}',
    '#gm-root .gm-pay-label{font-size:11px;color:#a1a1aa;text-align:center;margin-top:8px}',
    
    '@keyframes gmIn{from{opacity:0;transform:scale(0.9) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}',
    '@keyframes gmPing{75%, 100%{transform:scale(1.4);opacity:0}}',
    '@keyframes gmPulse{0%, 100%{opacity:1}50%{opacity:0.4}}',
    '@keyframes gmBounce{0%, 80%, 100%{transform:scale(0)}40%{transform:scale(1)}}'
  ].join('');

  /* ── 3. HTML template ────────────────────────────────────────────────────── */

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildHTML(name) {
    return (
      '<button id="gm-btn" aria-label="Abrir chat">' +
        '<svg class="gm-bot-icon" viewBox="0 0 24 24"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>' +
        '<svg class="gm-close-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<div id="gm-win" role="dialog" aria-modal="true" aria-label="Chat de soporte">' +
        '<div class="gm-hdr">' +
          '<div class="gm-hdr-left">' +
            '<div class="gm-dot"></div>' +
            '<div class="gm-hdr-title" id="gm-name">' + esc(name) + '</div>' +
          '</div>' +
          '<div class="gm-hdr-right">' +
            '<button class="gm-hdr-close" id="gm-close" aria-label="Cerrar">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="gm-msgs" id="gm-msgs"></div>' +
        '<div class="gm-inp-container">' +
          '<div class="gm-inp-row">' +
            '<div class="gm-inp-wrapper">' +
              '<textarea class="gm-inp" id="gm-inp" placeholder="Escribe un mensaje..." maxlength="2000" rows="1"></textarea>' +
            '</div>' +
            '<div class="gm-actions">' +
              '<button class="gm-mic" aria-label="Audio" title="Audio no disponible por ahora" onclick="alert(\'Función de audio próximamente\')">' +
                '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>' +
              '</button>' +
              '<button class="gm-snd" id="gm-snd" aria-label="Enviar">' +
                '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="gm-footer">' +
            '<div class="gm-pw">Powered by <a href="https://www.thequantpartners.com" target="_blank" rel="noopener">Quant Partners</a></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── 4. DOM helpers ──────────────────────────────────────────────────────── */

  function msgsEl()  { return doc.getElementById('gm-msgs'); }
  function inpEl()   { return doc.getElementById('gm-inp'); }
  function sndEl()   { return doc.getElementById('gm-snd'); }

  function scrollBottom() {
    var el = msgsEl();
    if (el) el.scrollTop = el.scrollHeight;
  }

  function setInputLocked(locked) {
    var i = inpEl(), s = sndEl();
    if (i) i.disabled = locked;
    if (s) s.disabled = locked;
    if (i && !locked) { i.focus(); }
  }

  function addBotBubble(text) {
    var el = doc.createElement('div');
    el.className = 'gm-bbl gm-bot';
    el.textContent = text;
    msgsEl().appendChild(el);
    scrollBottom();
  }

  function addUserBubble(text) {
    var el = doc.createElement('div');
    el.className = 'gm-bbl gm-usr';
    el.textContent = text;
    msgsEl().appendChild(el);
    scrollBottom();
  }

  function addOptionButtons(options, onSelect) {
    var wrap = doc.createElement('div');
    wrap.className = 'gm-opts';
    options.forEach(function (opt) {
      var btn = doc.createElement('button');
      btn.className = 'gm-opt';
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        wrap.remove();           // collapse buttons after selection
        onSelect(opt);
      });
      wrap.appendChild(btn);
    });
    msgsEl().appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    var el = doc.createElement('div');
    el.className = 'gm-typing';
    el.id = 'gm-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgsEl().appendChild(el);
    scrollBottom();
  }

  function removeTyping() {
    var el = doc.getElementById('gm-typing');
    if (el) el.remove();
  }

  /* ── 5. Render server messages ────────────────────────────────────────────── */

  function renderMessages(messages) {
    messages.forEach(function (msg) {
      if (msg.type === 'buttons' && msg.options && msg.options.length) {
        addBotBubble(msg.content);
        addOptionButtons(msg.options, handleSend);
      } else {
        addBotBubble(msg.content);
      }
    });
  }

  /* ── 6. Payment CTA ─────────────────────────────────────────────────────── */

  function showPaymentCTA(paymentInfo, leadId) {
    var chatWinEl = doc.getElementById('gm-win');
    // Remove existing CTA if any
    var existing = doc.getElementById('gm-pay-cta');
    if (existing) existing.remove();

    var provider = paymentInfo.provider;
    var amount   = paymentInfo.amount;
    var btnLabel = 'Pay $' + (amount ? amount.toFixed(2) : '0.00') + ' — Book Consultation';

    var ctaEl = doc.createElement('div');
    ctaEl.id = 'gm-pay-cta';
    ctaEl.className = 'gm-pay-cta';
    ctaEl.innerHTML =
      '<button class="gm-pay-btn" id="gm-pay-btn">' + btnLabel + '</button>' +
      '<p class="gm-pay-label">Secure payment · No commitment after consultation</p>';

    // Insert before footer
    var footer = chatWinEl ? chatWinEl.querySelector('.gm-pw') : null;
    if (chatWinEl) chatWinEl.insertBefore(ctaEl, footer);

    doc.getElementById('gm-pay-btn').addEventListener('click', function () {
      if (provider === 'custom' && paymentInfo.payment_url) {
        win.location.href = paymentInfo.payment_url;
      } else if (provider === 'stripe') {
        _createStripeCheckout(leadId);
      }
    });
  }

  function _createStripeCheckout(leadId) {
    var btn = doc.getElementById('gm-pay-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Redirecting…'; }

    fetch(API + '/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: leadId,
        payment_type: 'consultation',
        return_url: win.location.href,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.checkout_url) {
          win.location.href = data.checkout_url;
        } else {
          if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
        }
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
      });
  }

  /* ── 7. API calls ────────────────────────────────────────────────────────── */

  function applyTheme(color, name) {
    if (color) {
      doc.getElementById('gm-root').style.setProperty('--gm-p', color);
    }
    if (name) {
      var nameEl = doc.getElementById('gm-name');
      if (nameEl) nameEl.textContent = name;
    }
  }

  function startSession() {
    setInputLocked(true);
    fetch(API + '/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('start:' + r.status);
        return r.json();
      })
      .then(function (data) {
        sessionId    = data.session_id;
        sessionState = data.state;
        localStorage.setItem(STORAGE_KEY, sessionId);
        applyTheme(data.theme_color, data.widget_name);
        renderMessages(data.messages);
        
        if (sessionState === 'CLOSED') {
          setInputLocked(true);
        } else {
          var lastMsg = data.messages && data.messages[data.messages.length - 1];
          var needsOptions = lastMsg && lastMsg.type === 'buttons' && lastMsg.options && lastMsg.options.length > 0;
          setInputLocked(needsOptions);
        }
      })
      .catch(function (err) {
        console.error('[GMaker] start error:', err);
        addBotBubble('El chat no está disponible ahora mismo. Por favor, inténtalo más tarde.');
      });
  }

  function handleSend(text) {
    if (sending || !text || !text.trim() || !sessionId) return;
    text = text.trim();

    var inp = inpEl();
    if (inp) {
      inp.value = '';
      var charSpan = doc.getElementById('gm-char');
      if (charSpan) charSpan.textContent = '0';
    }

    addUserBubble(text);
    setInputLocked(true);
    sending = true;
    showTyping();

    fetch(API + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message: text }),
    })
      .then(function (r) {
        if (r.status === 404) {
          // Session expired server-side
          localStorage.removeItem(STORAGE_KEY);
          sessionId = null;
          removeTyping();
          addBotBubble('Tu sesión ha expirado. Por favor, recarga la página para continuar.');
          return null;
        }
        if (!r.ok) throw new Error('msg:' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        removeTyping();
        sessionState = data.state;
        renderMessages(data.messages);

        if (data.state === 'CLOSED') {
          setInputLocked(true);
          localStorage.removeItem(STORAGE_KEY);
          // Show payment CTA if the backend returned payment info
          if (data.lead_captured && data.payment_info && data.payment_info.required) {
            showPaymentCTA(data.payment_info, data.lead_id);
          }
        } else {
          var lastMsg = data.messages && data.messages[data.messages.length - 1];
          var needsOptions = lastMsg && lastMsg.type === 'buttons' && lastMsg.options && lastMsg.options.length > 0;
          setInputLocked(needsOptions);
        }
      })
      .catch(function (err) {
        removeTyping();
        console.error('[GMaker] message error:', err);
        addBotBubble('Error de conexión. Por favor, intenta de nuevo.');
        setInputLocked(false);
      })
      .finally(function () {
        sending = false;
      });
  }

  /* ── 8. UI toggles ───────────────────────────────────────────────────────── */

  function openChat() {
    doc.getElementById('gm-win').classList.add('gm-open');
    if (!sessionId) {
      startSession();
    } else {
      // Session exists — input enabled unless CLOSED
      if (sessionState !== 'CLOSED') setInputLocked(false);
    }
  }

  function closeChat() {
    doc.getElementById('gm-win').classList.remove('gm-open');
  }

  /* ── 9. Bootstrap ────────────────────────────────────────────────────────── */

  function init() {
    if (initialized) return;
    initialized = true;

    // Inject <style>
    var styleEl = doc.createElement('style');
    styleEl.textContent = CSS;
    doc.head.appendChild(styleEl);

    // Inject widget root
    var root = doc.createElement('div');
    root.id = 'gm-root';
    root.style.setProperty('--gm-p', '#4F46E5');
    root.innerHTML = buildHTML('Chat');
    doc.body.appendChild(root);

    // Wire events
    doc.getElementById('gm-btn').addEventListener('click', openChat);
    doc.getElementById('gm-close').addEventListener('click', closeChat);

    doc.getElementById('gm-snd').addEventListener('click', function () {
      var val = (inpEl() || {}).value || '';
      handleSend(val);
    });

    doc.getElementById('gm-inp').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        var val = (inpEl() || {}).value || '';
        handleSend(val);
      }
    });

    var inp = doc.getElementById('gm-inp');
    var charSpan = doc.getElementById('gm-char');
    if (inp && charSpan) {
      inp.addEventListener('input', function(e) {
        charSpan.textContent = e.target.value.length;
      });
    }

    // Start input as locked until a session is opened
    setInputLocked(true);
  }

  // Defer until DOM is ready
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
