/* ═══════════════════════════════════════════════════════════════
   YKS SITE SEARCH
   Self-contained: injects its own trigger, overlay and styles, so it
   drops onto both page shells (.nav on the homepage, .l-nav on the
   ~70 landing pages) without touching either stylesheet.
   The index (search-index.json) is fetched lazily on first open.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__yksSearch) return;
  window.__yksSearch = true;

  var INDEX_URL = '/search-index.json';
  var index = null, loading = null;
  var results = [], active = -1, rows = [], lastQuery = '';

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.yks-sbtn{background:none;border:0;cursor:pointer;color:inherit;display:inline-flex;align-items:center;',
    'gap:7px;font:inherit;font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.78;',
    'padding:8px 10px;border-radius:30px;transition:opacity .25s,background .25s}',
    '.yks-sbtn:hover,.yks-sbtn:focus-visible{opacity:1;background:rgba(244,237,226,.08)}',
    '.yks-sbtn svg{width:14px;height:14px;flex:none}',
    '.yks-sbtn i{font-style:normal;font-size:10px;opacity:.5;border:1px solid currentColor;',
    'border-radius:4px;padding:1px 5px;letter-spacing:.06em}',
    '@media(max-width:900px){.yks-sbtn i{display:none}.yks-sbtn span{display:none}}',

    '.yks-sov{position:fixed;inset:0;z-index:99999;display:none;padding:9vh 20px 20px;',
    'background:rgba(6,5,10,.86);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);',
    'opacity:0;transition:opacity .22s ease}',
    '.yks-sov.on{display:block}.yks-sov.in{opacity:1}',
    '.yks-sbox{max-width:660px;margin:0 auto;background:#100d16;border:1px solid rgba(244,237,226,.14);',
    'border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.6);',
    'transform:translateY(-10px);transition:transform .22s ease}',
    '.yks-sov.in .yks-sbox{transform:none}',
    '.yks-sfield{display:flex;align-items:center;gap:12px;padding:16px 18px;',
    'border-bottom:1px solid rgba(244,237,226,.10)}',
    '.yks-sfield svg{width:17px;height:17px;flex:none;opacity:.5;color:#f4ede2}',
    '.yks-sin{flex:1;background:none;border:0;outline:0;color:#f4ede2;font-size:16px;',
    "font-family:'Inter',system-ui,sans-serif}",
    '.yks-sin::placeholder{color:rgba(244,237,226,.42)}',
    '.yks-sesc{background:none;border:1px solid rgba(244,237,226,.22);color:rgba(244,237,226,.6);',
    'border-radius:6px;font-size:10px;letter-spacing:.1em;padding:4px 8px;cursor:pointer}',
    '.yks-sesc:hover{color:#f4ede2;border-color:rgba(244,237,226,.5)}',
    '.yks-slist{max-height:min(58vh,460px);overflow-y:auto;overscroll-behavior:contain}',
    '.yks-sgrp{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(244,237,226,.38);',
    'padding:14px 18px 6px}',
    '.yks-sr{display:block;padding:11px 18px;text-decoration:none;border-left:2px solid transparent}',
    '.yks-sr b{display:block;color:#f4ede2;font-size:14.5px;font-weight:500;line-height:1.35}',
    '.yks-sr s{display:block;color:rgba(244,237,226,.52);font-size:12.5px;text-decoration:none;',
    'line-height:1.45;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.yks-sr mark{background:none;color:#ff8c3b}',
    '.yks-sr.on,.yks-sr:hover{background:rgba(255,140,59,.10);border-left-color:#ff8c3b}',
    '.yks-smsg{padding:26px 18px;color:rgba(244,237,226,.5);font-size:13.5px;text-align:center}',
    '.yks-sai{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;',
    'background:none;border:0;border-left:2px solid transparent;padding:12px 18px;font:inherit}',
    '.yks-sai:hover,.yks-sai.on{background:rgba(255,140,59,.10);border-left-color:#ff8c3b}',
    '.yks-sai u{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;',
    'text-decoration:none;background:linear-gradient(135deg,#ff8c3b,#ff2f87);color:#0b0910;',
    'font-size:11px;font-weight:700;font-style:normal}',
    '.yks-sai div{min-width:0}',
    '.yks-sai b{display:block;color:#f4ede2;font-size:14px;font-weight:500;line-height:1.35;',
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.yks-sai s{display:block;color:rgba(244,237,226,.5);font-size:12px;text-decoration:none;margin-top:1px}',
    '.yks-sfoot{display:flex;gap:16px;padding:10px 18px;border-top:1px solid rgba(244,237,226,.10);',
    'font-size:10px;letter-spacing:.1em;color:rgba(244,237,226,.35)}',
    '@media(max-width:640px){.yks-sov{padding:0}.yks-sbox{border-radius:0;max-width:none;height:100%;',
    'display:flex;flex-direction:column}.yks-slist{max-height:none;flex:1}.yks-sfoot{display:none}}',
    '@media(prefers-reduced-motion:reduce){.yks-sov,.yks-sbox{transition:none}}'
  ].join('');
  document.head.appendChild(css);

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>';

  /* ---------- overlay ---------- */
  var ov = document.createElement('div');
  ov.className = 'yks-sov';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Search this site');
  ov.innerHTML =
    '<div class="yks-sbox">' +
      '<div class="yks-sfield">' + ICON +
        '<input class="yks-sin" type="search" autocomplete="off" autocorrect="off" ' +
        'spellcheck="false" placeholder="Search — try &quot;Dubai real estate&quot;, &quot;models in Mumbai&quot;, &quot;pricing&quot;" ' +
        'aria-label="Search this site" />' +
        '<button class="yks-sesc" type="button">ESC</button>' +
      '</div>' +
      '<div class="yks-slist" role="listbox"></div>' +
      '<div class="yks-sfoot"><span>↑↓ to move</span><span>↵ to open</span><span>esc to close</span></div>' +
    '</div>';

  var input, list, lastFocus = null;

  function mount() {
    document.body.appendChild(ov);
    input = ov.querySelector('.yks-sin');
    list = ov.querySelector('.yks-slist');
    ov.querySelector('.yks-sesc').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    input.addEventListener('input', function () { run(input.value); });
    input.addEventListener('keydown', onKey);
  }

  /* ---------- index ---------- */
  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(INDEX_URL)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        index = d.map(function (e) {
          e._h = (e.t + ' ' + e.d + ' ' + e.k + ' ' + e.u).toLowerCase();
          return e;
        });
        return index;
      })
      .catch(function () { loading = null; index = null; return null; });
    return loading;
  }

  /* ---------- synonyms ----------
     Visitors search their own vocabulary, not the site's. Nobody writes
     "pricing" here — the pages say quote, cost, rate — so map the common
     asks onto the words that actually exist. */
  var SYN = {
    pricing: ['price', 'cost', 'rate', 'quote', 'budget', 'charge', 'fee'],
    price: ['pricing', 'cost', 'rate', 'quote', 'budget', 'charge', 'fee'],
    prices: ['price', 'pricing', 'cost', 'rate', 'quote'],
    cost: ['price', 'pricing', 'rate', 'quote', 'budget'],
    costs: ['cost', 'price', 'pricing', 'quote'],
    rate: ['price', 'pricing', 'cost', 'quote'],
    rates: ['rate', 'price', 'pricing', 'cost', 'quote'],
    fee: ['price', 'cost', 'quote', 'charge'],
    fees: ['fee', 'price', 'cost', 'quote'],
    charges: ['charge', 'price', 'cost', 'quote'],
    budget: ['price', 'cost', 'quote'],
    quote: ['price', 'cost', 'pricing'],
    contact: ['quote', 'book', 'enquire', 'hire', 'get in touch'],
    hire: ['book', 'quote', 'booking'],
    book: ['booking', 'quote', 'hire'],
    booking: ['book', 'quote', 'hire'],
    video: ['film', 'videographer', 'videography'],
    videos: ['video', 'film', 'videographer'],
    videography: ['video', 'film', 'videographer'],
    photo: ['photography', 'photographer', 'stills'],
    photos: ['photo', 'photography', 'photographer'],
    photography: ['photo', 'photographer'],
    about: ['story'],
    cv: ['story', 'about'],
    resume: ['story', 'about'],
    model: ['models', 'talent', 'casting'],
    models: ['model', 'talent', 'casting'],
    actor: ['talent', 'casting', 'model'],
    actors: ['talent', 'casting', 'model'],
    talent: ['talents', 'casting', 'model'],
    camera: ['gear', 'kit'],
    equipment: ['gear', 'kit'],
    property: ['real estate'],
    realestate: ['real estate', 'property'],
    bts: ['behind the scenes', 'on-set', 'stills'],
    reel: ['reels', 'instagram', 'social'],
    ad: ['campaign', 'brand', 'commercial'],
    ads: ['campaign', 'brand', 'commercial']
  };

  /* ---------- scoring ---------- */
  function hit(e, t, w) {
    if (e._h.indexOf(w) === -1) return 0;
    var s = 1;
    if (t.indexOf(w) !== -1) s += 10;              // title hit
    if (t.split(/\W+/).indexOf(w) !== -1) s += 8;  // whole word in title
    if (t.indexOf(w) === 0) s += 6;                // title starts with it
    if (e.k.toLowerCase().indexOf(w) !== -1) s += 4;
    if (e.d.toLowerCase().indexOf(w) !== -1) s += 2;
    if (e.u.toLowerCase().indexOf(w) !== -1) s += 3;
    return s;
  }

  function score(e, terms) {
    var t = e.t.toLowerCase(), total = 0;
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i];
      var best = hit(e, t, w);
      if (!best) {                                  // fall back to synonyms
        var alts = SYN[w] || [];
        for (var j = 0; j < alts.length; j++) {
          var s = hit(e, t, alts[j]) * 0.45;        // never outranks a literal match
          if (s > best) best = s;
        }
      }
      if (!best) return 0;                          // every term must land somehow
      total += best;
    }
    if (e.c === 'Home') total += 3;
    if (e.c === 'Work') total += 2;
    return total;
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function hl(s, terms) {
    var out = esc(s);
    terms.forEach(function (w) {
      if (!w) return;
      out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'),
        '<mark>$1</mark>');
    });
    return out;
  }

  /* ---------- AI hand-off ----------
     Iris (js/chat.js) is already on every page and already carries the
     anti-fabrication guards, so search doesn't add a second assistant —
     it just hands the question over. */
  function aiReady() { return !!(window.yksIris && window.YKS_CHAT_ENDPOINT); }

  // a real question deserves an answer, not a list of pages
  function isQuestion(q) {
    return /\?$/.test(q) ||
      /^(who|what|when|where|why|how|can|do|does|is|are|will|would|should|could|any|whats|what's)\b/i.test(q) ||
      q.split(/\s+/).length >= 5;
  }

  /* Natural questions carry filler that matches no page. Drop it before
     scoring, so "do you shoot weddings in dubai?" still surfaces the
     wedding pages under the Ask row instead of returning nothing. */
  var STOP = ('a an the do does did you your i me my we our is are was be been am can could will '
    + 'would should shall may might have has had of for to in on at by with from as and or but if '
    + 'it its this that these those there here what when where how why who whom which any some '
    + 'about into over under out up down off then than too very just also get got take takes '
    + 'use uses used using need needs want wants looking look please tell show me'
  ).split(' ');

  function terms(q) {
    var raw = q.toLowerCase().replace(/[?!.,;:]/g, ' ').split(/\s+/).filter(Boolean);
    var kept = raw.filter(function (w) { return STOP.indexOf(w) === -1; });
    return kept.length ? kept : raw;   // an all-filler query still gets to try
  }

  function aiRow(q, i) {
    return '<button class="yks-sai" type="button" data-ai="1" data-i="' + i + '">' +
      '<u>✦</u><div><b>Ask Iris — “' + esc(q) + '”</b>' +
      '<s>Get a straight answer about gear, pricing, availability or a shoot</s></div></button>';
  }

  function fireAI(q) {
    close();
    setTimeout(function () { window.yksIris.ask(q); }, 220);
  }

  /* ---------- render ---------- */
  function run(q) {
    q = (q || '').trim();
    if (!q) {
      results = []; rows = []; active = -1; lastQuery = '';
      list.innerHTML = '<div class="yks-smsg">Search the whole site — work, cities, services, journal.' +
        (aiReady() ? '<br>Or ask a full question and Iris will answer it.' : '') + '</div>';
      return;
    }
    if (!index) { list.innerHTML = '<div class="yks-smsg">Loading…</div>'; return; }

    var t = terms(q);
    results = index.map(function (e) { return { e: e, s: score(e, t) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 24)
      .map(function (r) { return r.e; });

    var ai = aiReady();
    // question-shaped, or nothing matched → AI leads; otherwise it tails the list
    var aiFirst = ai && (isQuestion(q) || !results.length);
    var htm = '';

    if (!results.length && !ai) {
      list.innerHTML = '<div class="yks-smsg">Nothing for “' + esc(q) + '”.<br>' +
        'Try a city, a service, or a kind of shoot.</div>';
      return;
    }

    if (aiFirst) {
      htm += '<div class="yks-sgrp">Ask</div>' + aiRow(q, 0);
    }

    var group = '';
    results.forEach(function (e, n) {
      var i = n + (aiFirst ? 1 : 0);
      if (e.c !== group) { group = e.c; htm += '<div class="yks-sgrp">' + esc(group) + '</div>'; }
      htm += '<a class="yks-sr" role="option" data-i="' + i + '" href="' + esc(e.u) + '">' +
        '<b>' + hl(e.t, t) + '</b><s>' + hl(e.d || e.k, t) + '</s></a>';
    });

    if (ai && !aiFirst) {
      htm += '<div class="yks-sgrp">Ask</div>' + aiRow(q, results.length);
    }
    if (!results.length && ai) {
      htm += '<div class="yks-smsg">No page matches “' + esc(q) + '” — Iris can still answer.</div>';
    }

    list.innerHTML = htm;
    // rows array mirrors what's on screen, so arrows/enter treat AI as one of them
    rows = Array.prototype.slice.call(list.querySelectorAll('[data-i]'));
    active = 0;
    paint();

    rows.forEach(function (el) {
      el.addEventListener('mouseenter', function () { active = +el.dataset.i; paint(); });
      if (el.dataset.ai) el.addEventListener('click', function () { fireAI(q); });
    });
    lastQuery = q;
  }

  function paint() {
    rows.forEach(function (r, i) {
      r.classList.toggle('on', i === active);
      if (i === active) {
        r.setAttribute('aria-selected', 'true');
        if (r.scrollIntoView) r.scrollIntoView({ block: 'nearest' });
      } else r.removeAttribute('aria-selected');
    });
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!rows.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % rows.length; paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + rows.length) % rows.length; paint(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      var pick = rows[active] || rows[0];
      if (!pick) return;
      if (pick.dataset.ai) fireAI(lastQuery);
      else location.href = pick.getAttribute('href');
    }
  }

  /* ---------- open / close ---------- */
  function open() {
    if (!input) mount();
    lastFocus = document.activeElement;
    ov.classList.add('on');
    // rAF throttles in background/low-power tabs; without the timeout fallback
    // the overlay can sit at opacity 0 while still swallowing clicks
    requestAnimationFrame(function () { ov.classList.add('in'); });
    setTimeout(function () { if (ov.classList.contains('on')) ov.classList.add('in'); }, 60);
    document.documentElement.style.overflow = 'hidden';
    input.value = '';
    run('');
    input.focus();
    load().then(function (ok) {
      if (!ok) { list.innerHTML = '<div class="yks-smsg">Search is unavailable right now.</div>'; return; }
      if (ov.classList.contains('on')) run(input.value);
    });
  }

  function close() {
    ov.classList.remove('in');
    document.documentElement.style.overflow = '';
    setTimeout(function () { ov.classList.remove('on'); }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- trigger ---------- */
  function button() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'yks-sbtn';
    b.setAttribute('aria-label', 'Search this site');
    b.innerHTML = ICON + '<span>Search</span><i>/</i>';
    b.addEventListener('click', open);
    return b;
  }

  function attach() {
    // homepage shell
    var links = document.querySelector('.nav .links');
    if (links) {
      var cta = links.querySelector('.nav-panel-cta');
      links.insertBefore(button(), cta || null);
    }
    // landing-page shell
    var lnav = document.querySelector('.l-nav');
    if (lnav && !lnav.querySelector('.yks-sbtn')) {
      var back = lnav.querySelector('.l-back');
      lnav.insertBefore(button(), back || null);
    }
    // anything the markup opts in explicitly
    Array.prototype.forEach.call(document.querySelectorAll('[data-search-open]'), function (el) {
      el.addEventListener('click', function (ev) { ev.preventDefault(); open(); });
    });
  }

  // "/" anywhere, and cmd/ctrl-K, open search
  addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open(); return; }
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
  });

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', attach);
  else attach();

  window.yksSearch = { open: open, close: close };
})();
