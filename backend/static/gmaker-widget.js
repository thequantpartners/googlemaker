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

  /* ── 2. CSS (all classes prefixed with gm- to avoid host-page conflicts) */

  var CSS = [
    '#gm-root *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:0}',

    /* Toggle button */
    '#gm-btn{position:fixed;bottom:24px;right:24px;z-index:2147483646;',
    'width:60px;height:60px;border-radius:50%;',
    'background:var(--gm-p,#4F46E5);border:none;cursor:pointer;',
    'box-shadow:0 4px 24px rgba(0,0,0,.28);',
    'display:flex;align-items:center;justify-content:center;',
    'transition:transform .2s,box-shadow .2s}',
    '#gm-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(0,0,0,.38)}',
    '#gm-btn svg{width:26px;height:26px;fill:#fff}',

    /* Chat window */
    '#gm-win{position:fixed;bottom:96px;right:24px;z-index:2147483645;',
    'width:360px;max-width:calc(100vw - 32px);',
    'height:520px;max-height:calc(100vh - 120px);',
    'background:#fff;border-radius:20px;',
    'box-shadow:0 8px 48px rgba(0,0,0,.18);',
    'display:flex;flex-direction:column;overflow:hidden;',
    'opacity:0;pointer-events:none;transform:scale(.9) translateY(12px);',
    'transition:opacity .22s,transform .26s cubic-bezier(.34,1.56,.64,1)}',
    '#gm-win.gm-open{opacity:1;pointer-events:all;transform:scale(1) translateY(0)}',

    /* Header */
    '.gm-hdr{padding:14px 16px;background:var(--gm-p,#4F46E5);',
    'display:flex;align-items:center;gap:11px;flex-shrink:0}',
    '.gm-hdr-av{width:36px;height:36px;border-radius:50%;',
    'background:rgba(255,255,255,.25);display:flex;align-items:center;',
    'justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}',
    '.gm-hdr-info{flex:1;overflow:hidden}',
    '.gm-hdr-name{color:#fff;font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.gm-hdr-sub{color:rgba(255,255,255,.8);font-size:11px;margin-top:1px}',
    '.gm-hdr-close{width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;',
    'background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;',
    'flex-shrink:0;transition:background .15s}',
    '.gm-hdr-close:hover{background:rgba(255,255,255,.35)}',
    '.gm-hdr-close svg{width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round}',

    /* Messages area */
    '.gm-msgs{flex:1;overflow-y:auto;padding:14px;',
    'display:flex;flex-direction:column;gap:9px;background:#f5f5f7}',
    '.gm-msgs::-webkit-scrollbar{width:3px}',
    '.gm-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px}',

    /* Bubbles */
    '.gm-bbl{max-width:82%;padding:9px 13px;border-radius:18px;',
    'font-size:14px;line-height:1.5;word-break:break-word;',
    'animation:gmIn .18s ease}',
    '.gm-bot{background:#fff;color:#1a1a1a;border-bottom-left-radius:4px;',
    'box-shadow:0 1px 3px rgba(0,0,0,.08);align-self:flex-start}',
    '.gm-usr{background:var(--gm-p,#4F46E5);color:#fff;',
    'border-bottom-right-radius:4px;align-self:flex-end;margin-left:auto}',

    /* Option buttons */
    '.gm-opts{display:flex;flex-direction:column;gap:7px;width:100%;animation:gmIn .18s ease}',
    '.gm-opt{width:100%;padding:9px 13px;text-align:left;background:#fff;color:#1a1a1a;',
    'border:1.5px solid var(--gm-p,#4F46E5);border-radius:12px;cursor:pointer;',
    'font-size:14px;transition:background .14s,color .14s}',
    '.gm-opt:hover{background:var(--gm-p,#4F46E5);color:#fff}',

    /* Typing indicator */
    '.gm-typing{display:flex;gap:4px;padding:10px 13px;background:#fff;',
    'border-radius:18px;border-bottom-left-radius:4px;',
    'box-shadow:0 1px 3px rgba(0,0,0,.08);align-self:flex-start;width:fit-content}',
    '.gm-typing span{width:7px;height:7px;border-radius:50%;background:#9ca3af;',
    'animation:gmDot 1.1s infinite}',
    '.gm-typing span:nth-child(2){animation-delay:.18s}',
    '.gm-typing span:nth-child(3){animation-delay:.36s}',

    /* Input area */
    '.gm-inp-row{display:flex;gap:8px;padding:11px 14px;',
    'background:#fff;border-top:1px solid #e5e7eb;flex-shrink:0}',
    '.gm-inp{flex:1;padding:9px 13px;border-radius:11px;',
    'border:1.5px solid #e5e7eb;background:#f9fafb;font-size:14px;',
    'outline:none;color:#1a1a1a;transition:border-color .14s}',
    '.gm-inp:focus{border-color:var(--gm-p,#4F46E5);background:#fff}',
    '.gm-inp:disabled,.gm-snd:disabled{opacity:.45;cursor:not-allowed}',
    '.gm-snd{width:38px;height:38px;border-radius:11px;flex-shrink:0;border:none;',
    'background:var(--gm-p,#4F46E5);cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;transition:opacity .14s}',
    '.gm-snd:hover:not(:disabled){opacity:.85}',
    '.gm-snd svg{width:17px;height:17px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}',

    /* Powered-by footer */
    '.gm-pw{text-align:center;padding:5px 0 7px;font-size:10px;color:#9ca3af;background:#fff;flex-shrink:0}',
    '.gm-pw a{color:#9ca3af;text-decoration:none}',
    '.gm-pw a:hover{color:var(--gm-p,#4F46E5)}',

    /* Animations */
    '@keyframes gmIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}',
    '@keyframes gmDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',
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
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
        '</svg>' +
      '</button>' +
      '<div id="gm-win" role="dialog" aria-modal="true" aria-label="Chat de soporte">' +
        '<div class="gm-hdr">' +
          '<div class="gm-hdr-av">AI</div>' +
          '<div class="gm-hdr-info">' +
            '<div class="gm-hdr-name" id="gm-name">' + esc(name) + '</div>' +
            '<div class="gm-hdr-sub">&#9679; En línea</div>' +
          '</div>' +
          '<button class="gm-hdr-close" id="gm-close" aria-label="Cerrar">' +
            '<svg viewBox="0 0 24 24">' +
              '<line x1="18" y1="6" x2="6" y2="18"/>' +
              '<line x1="6" y1="6" x2="18" y2="18"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="gm-msgs" id="gm-msgs"></div>' +
        '<div class="gm-inp-row">' +
          '<input class="gm-inp" id="gm-inp" type="text" placeholder="Escribe un mensaje..." maxlength="500" />' +
          '<button class="gm-snd" id="gm-snd" aria-label="Enviar">' +
            '<svg viewBox="0 0 24 24">' +
              '<line x1="22" y1="2" x2="11" y2="13"/>' +
              '<polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="gm-pw">Powered by <a href="https://gmaker.io" target="_blank" rel="noopener">GMaker</a></div>' +
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

  /* ── 6. API calls ────────────────────────────────────────────────────────── */

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
        if (sessionState !== 'CLOSED') setInputLocked(false);
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
    if (inp) inp.value = '';

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
          localStorage.removeItem(STORAGE_KEY);   // allow fresh start next page load
        } else {
          setInputLocked(false);
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

  /* ── 7. UI toggles ───────────────────────────────────────────────────────── */

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

  /* ── 8. Bootstrap ────────────────────────────────────────────────────────── */

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
