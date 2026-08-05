/* ═══════════════════════════════════════════════════════════════
   YKS Productions — AI chat widget
   Talks to the Cloudflare Worker (worker/yks-chat-worker.js) so the
   API key is never in the browser.

   Activate by setting the endpoint in js/chat-config.js:
       window.YKS_CHAT_ENDPOINT = 'https://<your-worker>.workers.dev';
   If it's empty, the widget simply doesn't render — nothing breaks.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var EP = (window.YKS_CHAT_ENDPOINT || '').trim();
  if (!EP) return;                          // not configured yet — stay invisible
  if (document.querySelector('.yc-btn')) return;

  var WA = '971501955122';
  var GREET = "Hi! I'm Yedukrishna's assistant. Ask me anything — gear, availability, how a shoot works, or tell me what you're planning and I'll help you get a quote.";
  var CHIPS = ['What do you charge?', 'Real estate video in Dubai', 'Wedding photography', "I'd like a quote"];

  var css = ''
    + '.yc-btn{position:fixed;right:18px;bottom:150px;z-index:301;width:54px;height:54px;border-radius:50%;border:0;cursor:pointer;'
    + 'background:linear-gradient(135deg,#ff8c3b,#ffc9a3);box-shadow:0 10px 26px rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;'
    + 'transition:transform .25s cubic-bezier(.22,.61,.36,1)}'
    + '.yc-btn:hover{transform:scale(1.09)}'
    + '.yc-btn svg{width:26px;height:26px}'
    + '.yc-dot{position:absolute;top:-2px;right:-2px;width:13px;height:13px;border-radius:50%;background:#1fd6c9;border:2px solid #07060a}'
    + '.yc-panel{position:fixed;right:18px;bottom:150px;z-index:302;width:min(380px,calc(100vw - 36px));height:min(560px,calc(100vh - 190px));'
    + 'background:#0d0b12;border:1px solid rgba(244,237,226,.14);border-radius:18px;display:none;flex-direction:column;overflow:hidden;'
    + 'box-shadow:0 30px 80px rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif}'
    + '.yc-panel.on{display:flex;animation:ycIn .3s cubic-bezier(.22,.61,.36,1)}'
    + '@keyframes ycIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
    + '.yc-head{display:flex;align-items:center;gap:11px;padding:15px 16px;border-bottom:1px solid rgba(244,237,226,.12);background:rgba(244,237,226,.03)}'
    + '.yc-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#ff8c3b,#ffc9a3);display:flex;align-items:center;justify-content:center;'
    + 'font-family:"Playfair Display",Georgia,serif;font-weight:600;color:#07060a;font-size:15px;flex:none}'
    + '.yc-ttl{flex:1;min-width:0}'
    + '.yc-ttl b{display:block;font-size:13.5px;color:#f4ede2;font-weight:600;line-height:1.2}'
    + '.yc-ttl span{font-size:11px;color:rgba(244,237,226,.55)}'
    + '.yc-x{background:none;border:0;color:rgba(244,237,226,.6);font-size:22px;cursor:pointer;line-height:1;padding:4px 6px}'
    + '.yc-x:hover{color:#ff8c3b}'
    + '.yc-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:11px}'
    + '.yc-msg{max-width:86%;padding:11px 14px;border-radius:14px;font-size:13.8px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word}'
    + '.yc-msg.bot{align-self:flex-start;background:rgba(244,237,226,.07);color:#f4ede2;border-top-left-radius:4px}'
    + '.yc-msg.me{align-self:flex-end;background:rgba(255,140,59,.18);color:#f4ede2;border:1px solid rgba(255,140,59,.3);border-top-right-radius:4px}'
    + '.yc-msg a{color:#ff8c3b;text-decoration:underline}'
    + '.yc-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 16px 12px}'
    + '.yc-chip{font-size:11.5px;padding:8px 13px;border-radius:30px;border:1px solid rgba(244,237,226,.22);background:transparent;color:#f4ede2;cursor:pointer;transition:.2s}'
    + '.yc-chip:hover{border-color:#ff8c3b;color:#ff8c3b}'
    + '.yc-foot{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(244,237,226,.12);align-items:flex-end}'
    + '.yc-in{flex:1;background:rgba(244,237,226,.06);border:1px solid rgba(244,237,226,.16);border-radius:12px;padding:11px 13px;color:#f4ede2;'
    + 'font-family:inherit;font-size:13.5px;outline:none;resize:none;max-height:96px;line-height:1.5}'
    + '.yc-in:focus{border-color:#ff8c3b}'
    + '.yc-in::placeholder{color:rgba(244,237,226,.38)}'
    + '.yc-send{flex:none;width:38px;height:38px;border-radius:10px;border:0;background:#ff8c3b;color:#07060a;cursor:pointer;font-size:16px;transition:.2s}'
    + '.yc-send:hover{background:#ffc9a3}.yc-send:disabled{opacity:.45;cursor:default}'
    + '.yc-typing{display:flex;gap:4px;padding:12px 14px}'
    + '.yc-typing i{width:6px;height:6px;border-radius:50%;background:rgba(244,237,226,.5);animation:ycB 1.2s infinite}'
    + '.yc-typing i:nth-child(2){animation-delay:.15s}.yc-typing i:nth-child(3){animation-delay:.3s}'
    + '@keyframes ycB{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}'
    + '.yc-note{font-size:10px;color:rgba(244,237,226,.4);text-align:center;padding:0 16px 10px}'
    + '@media(max-width:600px){.yc-btn{bottom:140px;right:14px}.yc-panel{right:10px;left:10px;width:auto;bottom:140px;height:min(70vh,520px)}}';

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.className = 'yc-btn'; btn.setAttribute('aria-label', 'Chat with the YKS assistant');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="#07060a"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 9h10v2H7V9zm7 5H7v-2h7v2zm3-6H7V6h10v2z"/></svg><span class="yc-dot"></span>';
  document.body.appendChild(btn);

  var panel = document.createElement('div');
  panel.className = 'yc-panel';
  panel.innerHTML =
      '<div class="yc-head"><div class="yc-av">Y</div>'
    + '<div class="yc-ttl"><b>Ask YKS Productions</b><span>AI assistant · replies instantly</span></div>'
    + '<button class="yc-x" aria-label="Close chat">&times;</button></div>'
    + '<div class="yc-log" id="ycLog"></div>'
    + '<div class="yc-chips" id="ycChips"></div>'
    + '<div class="yc-foot"><textarea class="yc-in" id="ycIn" rows="1" placeholder="Ask anything…"></textarea>'
    + '<button class="yc-send" id="ycSend" aria-label="Send">&#8593;</button></div>'
    + '<div class="yc-note">AI assistant — for anything urgent, <a href="https://wa.me/' + WA + '" target="_blank" rel="noopener" style="color:#ff8c3b">WhatsApp Yedukrishna</a></div>';
  document.body.appendChild(panel);

  var log = panel.querySelector('#ycLog'), input = panel.querySelector('#ycIn'),
      send = panel.querySelector('#ycSend'), chips = panel.querySelector('#ycChips');
  var history = [], busy = false, started = false;

  function esc(s) { return String(s).replace(/[<>&]/g, function (c) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]; }); }
  function md(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])((?:https?:\/\/|\/)[^\s<)]+\.(?:html|com|ae|in)[^\s<)]*)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  function add(who, text) {
    var d = document.createElement('div');
    d.className = 'yc-msg ' + who;
    d.innerHTML = who === 'bot' ? md(text) : esc(text);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d;
  }
  function typing(on) {
    var t = log.querySelector('.yc-typing');
    if (on && !t) {
      var d = document.createElement('div');
      d.className = 'yc-msg bot yc-typing';
      d.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(d); log.scrollTop = log.scrollHeight;
    } else if (!on && t) { t.remove(); }
  }
  function renderChips() {
    chips.innerHTML = '';
    if (history.length) return;
    CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'yc-chip'; b.textContent = c;
      b.onclick = function () { ask(c); };
      chips.appendChild(b);
    });
  }

  function ask(text) {
    text = (text || input.value).trim();
    if (!text || busy) return;
    input.value = ''; input.style.height = 'auto';
    add('me', text);
    history.push({ role: 'user', content: text });
    chips.innerHTML = '';
    busy = true; send.disabled = true; typing(true);

    if (window.gtag && history.length === 1) gtag('event', 'chat_started', { method: 'ai_widget' });

    fetch(EP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        typing(false);
        var reply = j && j.reply ? j.reply : "Sorry — I didn't catch that. Try again, or WhatsApp Yedukrishna: https://wa.me/" + WA;
        add('bot', reply);
        history.push({ role: 'assistant', content: reply });
      })
      .catch(function () {
        typing(false);
        add('bot', "I'm having trouble connecting. You can reach Yedukrishna directly on WhatsApp: https://wa.me/" + WA + " — or use the quote form at /quote.html");
      })
      .then(function () { busy = false; send.disabled = false; input.focus(); });
  }

  btn.onclick = function () {
    panel.classList.add('on'); btn.style.display = 'none';
    if (!started) { started = true; add('bot', GREET); renderChips(); }
    setTimeout(function () { input.focus(); }, 120);
  };
  panel.querySelector('.yc-x').onclick = function () { panel.classList.remove('on'); btn.style.display = 'flex'; };
  send.onclick = function () { ask(); };
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }
  });
  input.addEventListener('input', function () {
    input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  });
})();
