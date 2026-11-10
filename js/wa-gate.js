/* YKS · silent AI gate in front of every WhatsApp / quote button.
   It never chats. Before a WhatsApp or quote link opens, the visitor writes one line
   about what they need; the AI (yks-chat /classify) decides client or model.
   Client  → WhatsApp opens with THEIR words (or the quote page).
   Model   → the free YKS Talents application, never WhatsApp.
   Unsure / AI down → one tap: "Booking a shoot" or "I want to model".
   Opt out with data-no-gate on a link. Decision is remembered for the session. */
(function () {
  'use strict';
  if (window.__yksGate) return; window.__yksGate = 1;
  var path = location.pathname;
  if (/^\/(talents\/apply|apply|edit|studio|privacy|admin)|talents-owner|agreement/.test(path)) return;
  var APPLY = '/talents/apply.html';
  var CLS = ((window.YKS_CHAT_ENDPOINT || 'https://yks-chat.ysuresh634.workers.dev').replace(/\/+$/, '')) + '/classify';
  var R_TALENT = /\b(model(l?ing)?\s+(career|work|job|chance|opportunit)|interested\s+in\b[^.]{0,60}\bmodell?ing|i\s*(am|'m)\s*(a\s*)?(model|actor|actress)|aspiring|wann?a\s+(be\s+a\s+)?model|want\s+to\s+(be\s+a\s+|become\s+a\s+|do\s+)?(model|act|modell?ing)|become\s+a\s+(model|actor|actress)|apply\s+(as|to\s+be|for)|how\s+(can|do)\s+i\s+(apply|join)|join\s+(yks|your|the\s+talent)|my\s+portfolio|kaam\s+chahiye|modell?ing\s+(karni|karna|cheyyan|pannanum)|model\s+(aakanam|banna|banana|banni)|chance\s+(venam|venum|chahiye|do))\b/i;
  var R_BRAND = /\b(brand|company|client|campaign|product|catalog(ue)?|e-?com|agency|label|store|shop|cafe|restaurant|startup|business|our|we\s+need|we\s+are|hire|hiring|need\s+(a\s+)?(photographer|videographer|models?)|launch|ad\s*film|hotel|event|wedding|property|villa|real\s*estate)\b/i;
  var memo = null; try { memo = sessionStorage.getItem('yks_gate'); } catch (e) {}

  function isGated(a) {
    if (!a || a.hasAttribute('data-no-gate') || a.closest('[data-no-gate]')) return false;
    var h = a.getAttribute('href') || '';
    return /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(h) || /^whatsapp:/i.test(h) || /(^|\/)quote\.html(\?|#|$)/i.test(h);
  }
  function waNum(h) { var m = /wa\.me\/(\d+)/.exec(h) || /phone=(\d+)/.exec(h); return m ? m[1] : (document.body.getAttribute('data-wa') || '971501955122'); }
  function go(href, blank) { if (blank && !/Android|iPhone|iPad/i.test(navigator.userAgent)) { var w = window.open(href, '_blank', 'noopener'); if (w) return; } location.href = href; }
  function event(n, p) { try { if (window.gtag) gtag('event', n, p || {}); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement('style');
    s.textContent = '.yg{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;background:rgba(5,4,8,.72);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}'
      + '@media(min-width:640px){.yg{align-items:center}}'
      + '.yg-c{width:100%;max-width:460px;background:#121016;color:#f4ede2;border:1px solid rgba(255,140,59,.35);border-radius:18px 18px 0 0;padding:22px 20px 20px;font:15px/1.5 Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}'
      + '@media(min-width:640px){.yg-c{border-radius:18px}}'
      + '.yg-c h3{margin:0 0 6px;font-size:19px;line-height:1.3;color:#f4ede2}.yg-c p{margin:0 0 12px;opacity:.82;font-size:14px}'
      + '.yg-c textarea{width:100%;box-sizing:border-box;min-height:84px;padding:12px;border-radius:12px;border:1px solid rgba(244,237,226,.25);background:#0b0a0e;color:#f4ede2;font:inherit;resize:vertical}'
      + '.yg-c textarea:focus{outline:2px solid #ff8c3b;border-color:transparent}'
      + '.yg-r{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.yg-r>*{flex:1 1 160px}'
      + '.yg-b{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 16px;border-radius:999px;border:0;background:#ff8c3b;color:#0b0a0e;font:600 15px/1 inherit;font-family:inherit;text-decoration:none;cursor:pointer;text-align:center}'
      + '.yg-g{background:transparent;color:#f4ede2;border:1px solid rgba(244,237,226,.35);font-weight:500}'
      + '.yg-x{float:right;background:none;border:0;color:#f4ede2;opacity:.6;font-size:22px;line-height:1;cursor:pointer;margin:-6px -4px 0 8px}'
      + '.yg-s{font-size:12.5px;opacity:.65;margin-top:10px}.yg-b[disabled]{opacity:.6;cursor:default}'
      + '.yg-n{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:rgba(255,140,59,.1);font-size:13px;line-height:1.45}';
    document.head.appendChild(s);
  }
  function modal(html) {
    style(); close();
    var w = document.createElement('div'); w.className = 'yg'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
    w.innerHTML = '<div class="yg-c"><button type="button" class="yg-x" aria-label="Close">×</button>' + html + '</div>';
    w.addEventListener('click', function (e) { if (e.target === w || e.target.classList.contains('yg-x')) close(); });
    document.body.appendChild(w); return w;
  }
  function close() { var o = document.querySelector('.yg'); if (o) o.remove(); }
  addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function remember(v) { memo = v; try { sessionStorage.setItem('yks_gate', v); } catch (e) {} }
  function toClient(a, text) {
    remember('client'); close();
    var h = a.getAttribute('href') || '';
    if (/quote\.html/i.test(h)) { go(h + (text ? (h.indexOf('?') > -1 ? '&' : '?') + 'need=' + encodeURIComponent(text.slice(0, 300)) : ''), false); return; }
    var msg = text ? 'Hi Yedukrishna, ' + text : decodeURIComponent((/[?&]text=([^&]*)/.exec(h) || [, ''])[1].replace(/\+/g, ' ')) || 'Hi Yedukrishna, I’d like to talk about a shoot.';
    go('https://wa.me/' + waNum(h) + '?text=' + encodeURIComponent(msg), true);
  }
  function toTalent(a, text) {
    remember('talent'); event('gate_talent');
    var w = modal('<h3>Want to work as a model? Apply here &mdash; it&rsquo;s free</h3>'
      + '<p>WhatsApp and quotes are only for brands booking shoots. Models and creators join through the YKS Talents application.</p>'
      + '<div class="yg-n">Paid shoots go to talent with experience and good portfolio photos. Mobile or blurry photos are not added to the talent pool. Hum mainly Western fashion shoots karte hain.</div>'
      + '<div class="yg-r"><a class="yg-b" href="' + APPLY + '?from=gate">Apply as a model &rarr;</a></div>'
      + '<div class="yg-r"><button type="button" class="yg-b yg-g" data-c>No, I&rsquo;m booking a shoot</button></div>');
    w.querySelector('[data-c]').addEventListener('click', function () { event('gate_override_client'); toClient(a, text); });
  }
  function choose(a, text) {
    var w = modal('<h3>Just checking &mdash; which one are you?</h3>'
      + '<div class="yg-r"><button type="button" class="yg-b" data-c>I&rsquo;m booking a shoot</button><button type="button" class="yg-b yg-g" data-t>I want to work as a model</button></div>');
    w.querySelector('[data-c]').addEventListener('click', function () { event('gate_pick_client'); toClient(a, text); });
    w.querySelector('[data-t]').addEventListener('click', function () { event('gate_pick_talent'); toTalent(a, text); });
  }
  function classify(text) {
    return new Promise(function (res) {
      var done = false, ctl = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function () { if (!done) { done = true; if (ctl) ctl.abort(); res(null); } }, 7000);
      fetch(CLS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined,
        body: JSON.stringify({ message: text.slice(0, 1500), page: path, form: 'wa-gate', fields: {} }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!done) { done = true; clearTimeout(t); res(j && j.ok ? j : null); } }, function () { if (!done) { done = true; clearTimeout(t); res(null); } });
    });
  }
  function decide(a, text) {
    var r = R_TALENT.test(text) ? 'talent' : (R_BRAND.test(text) ? 'client' : 'none');
    return classify(text).then(function (j) {
      var c = j ? +j.confidence || 0 : 0, type = j && j.type, inj = j && j.injected;
      event('gate_ai', { type: type || 'none', rules: r });
      if (type === 'talent' && !inj && (c >= 0.75 || (r === 'talent' && c >= 0.5))) return toTalent(a, text);
      if (type === 'client' && c >= 0.7 && r !== 'talent') return toClient(a, text);
      if (!j && r === 'talent') return toTalent(a, text);
      if (!j && r === 'client') return toClient(a, text);
      choose(a, text);   // greeting, vague, AI down: one tap decides
    });
  }
  function ask(a) {
    event('gate_open');
    var w = modal('<h3>What do you need?</h3>'
      + '<p>One line is enough &mdash; it gets you to the right place.</p>'
      + '<textarea maxlength="600" placeholder="e.g. Product shoot for my brand in Dubai &middot; or &middot; I want to work as a model"></textarea>'
      + '<div class="yg-r"><button type="button" class="yg-b" data-go>Continue</button></div>'
      + '<div class="yg-s">Models and creators: <a href="' + APPLY + '?from=gate-link" style="color:#ff8c3b">apply here instead</a>.</div>');
    var ta = w.querySelector('textarea'), btn = w.querySelector('[data-go]');
    setTimeout(function () { try { ta.focus(); } catch (e) {} }, 60);
    function submit() {
      var text = ta.value.trim();
      if (text.split(/\s+/).filter(Boolean).length < 2) { choose(a, text); return; }
      btn.disabled = true; btn.textContent = 'One moment…';
      decide(a, text);
    }
    btn.addEventListener('click', submit);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!isGated(a)) return;
    if (memo === 'client') return;              // already told us: let it through
    e.preventDefault(); e.stopPropagation();
    if (memo === 'talent') return toTalent(a, '');
    ask(a);
  }, true);


  /* "Apply as a model" in the site menu on every page, so it can always be found */
  function navLink() {
    var nav = document.querySelector('header nav.links') || document.querySelector('header nav');
    if (!nav || nav.querySelector('a[href*="talents/apply"]')) return;
    var a = document.createElement('a'); a.href = APPLY + '?from=nav'; a.textContent = 'Apply as a model'; a.setAttribute('data-yks-apply-nav', '');
    var cta = nav.querySelector('.nav-panel-cta'); nav.insertBefore(a, cta || null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', navLink); else navLink();

  // for scripts that open WhatsApp themselves (chat, calendar): YKSGate.open(url)
  window.YKSGate = { open: function (href) { if (memo === 'client') return go(href, true); var a = document.createElement('a'); a.setAttribute('href', href); if (memo === 'talent') return toTalent(a, ''); ask(a); } };
})();
