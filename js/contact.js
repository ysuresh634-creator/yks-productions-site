/* Region-aware contact line. A client in India always gets the India number,
   a client in the UAE / Gulf always gets the UAE number, on every page.

   Loaded as the first thing inside <body> (plain <script>, no defer) so it can
   set <body data-wa> before chat.js, landing.js and the rest read it, and swap
   WhatsApp links and tel: links while the page is still being parsed:
   nothing flashes, nothing moves. Numbers are never printed as text (the
   owner's rule): any number a script prints is replaced with words.

   The static HTML keeps each page's own default (Dubai pages +971, India pages
   +91) and the JSON-LD is never touched, so crawlers and no-JS visitors see
   exactly what is in the file. Only real visitors get the swap.

   Detection, all on the device, nothing sent anywhere:
     1. ?region=in|ae (testing / shared links), remembered for the session
     2. timezone  Asia/Kolkata|Calcutta (+ Colombo, Kathmandu, Dhaka, Thimphu) -> India
                  Asia/Dubai|Muscat|Qatar|Riyadh|Bahrain|Kuwait               -> UAE
     3. browser language region  xx-IN -> India,  xx-AE|SA|QA|OM|BH|KW -> UAE
        (only when the timezone says neither, so an Indian expat in Dubai
         still gets the Dubai line)
     4. otherwise: leave the page's own number alone

   Shared helper (for the chat widget and any script):
     YKS.region()          -> 'in' | 'ae' | null      (null = unknown, page default)
     YKS.contactNumber()   -> { region, wa:'971501955122', tel:'+971501955122',
                                display:'+971 50 195 5122', source }
                             (display is for code only; never print it)
     YKS.waLink(text)      -> 'https://wa.me/<number>?text=...'
     YKS.context()         -> { device:'mobile'|'tablet'|'desktop', os, touch,
                                net:{type,saveData,slow}, hour, daypart, weekday,
                                weekend, from:'instagram'|'google'|'linkedin'|
                                'whatsapp'|'facebook'|'youtube'|'search'|'other'|
                                'direct'|'internal', returning, sessions,
                                reducedMotion, dnt, region, regionSource }
   Opt a link or block out of swapping with data-geo-keep (e.g. a link that is
   labelled "WhatsApp · India"). */
(function () {
  var Y = window.YKS = window.YKS || {};
  if (Y.contactNumber) return;
  var LINES = {
    'in': { wa: '919746679720', tel: '+919746679720', display: '+91 97466 79720' },
    'ae': { wa: '971501955122', tel: '+971501955122', display: '+971 50 195 5122' }
  };
  var OTHER = { 'in': 'ae', 'ae': 'in' };

  function detect() {
    var m = /[?&]region=(in|ae|auto)\b/i.exec(location.search), s;
    try {
      if (m) { if (m[1].toLowerCase() === 'auto') sessionStorage.removeItem('yks_region'); else sessionStorage.setItem('yks_region', m[1].toLowerCase()); }
      s = sessionStorage.getItem('yks_region');
    } catch (e) { s = m && m[1].toLowerCase() !== 'auto' ? m[1].toLowerCase() : null; }
    if (s === 'in' || s === 'ae') return { r: s, src: 'chosen' };
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (/Asia\/(Kolkata|Calcutta|Colombo|Kathmandu|Katmandu|Dhaka|Dacca|Thimphu)/i.test(tz)) return { r: 'in', src: 'timezone' };
    if (/Asia\/(Dubai|Muscat|Qatar|Riyadh|Bahrain|Kuwait)/i.test(tz)) return { r: 'ae', src: 'timezone' };
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i] || '');
      if (/-IN$/i.test(l)) return { r: 'in', src: 'language' };
      if (/-(AE|SA|QA|OM|BH|KW)$/i.test(l)) return { r: 'ae', src: 'language' };
    }
    return { r: null, src: 'page' };
  }
  var D = detect(), R = D.r, body = document.body;

  function pageRegion() {
    var b = document.body, n = (b && b.getAttribute('data-wa')) || '';
    if (!n) { var a = document.querySelector('a[href*="wa.me/"]'); n = a ? ((a.getAttribute('href') || '').match(/wa\.me\/(\d+)/) || [])[1] || '' : ''; }
    return n === LINES['in'].wa ? 'in' : n === LINES.ae.wa ? 'ae' : null;
  }
  Y.region = function () { return R; };
  Y.contactNumber = function () {
    var r = R || pageRegion() || 'ae', L = LINES[r];
    return { region: r, wa: L.wa, tel: L.tel, display: L.display, source: R ? D.src : 'page' };
  };
  Y.waNumber = function () { return Y.contactNumber().wa; };
  Y.waLink = function (text) {
    return 'https://wa.me/' + Y.waNumber() + (text ? '?text=' + encodeURIComponent(String(text).slice(0, 1800)) : '');
  };

  /* ---------- visitor context (device, connection, time, source) ----------
     Read from what the browser already exposes to every site. Nothing is
     fingerprinted, nothing is sent anywhere. Used to pick the right kind of
     call to action (tap-to-WhatsApp on phones, the form on desktop), to hold
     back autoplay video on slow or data-saver connections, and for greeting
     copy. Also sets <html data-yks-device="mobile|tablet|desktop"> and
     <html data-yks-net="slow"> (when slow) for CSS and other scripts. */
  function context() {
    var ua = navigator.userAgent || '', w = Math.min(screen.width || 9999, innerWidth || 9999);
    var touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
    var tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
      (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1);
    var mobile = !tablet && (/Mobi|iPhone|iPod|Android.*Mobile|Opera Mini|IEMobile/i.test(ua) || (touch && w < 700));
    var os = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) ? 'ios'
      : /Android/i.test(ua) ? 'android' : /Windows/i.test(ua) ? 'windows' : /Mac OS X|Macintosh/i.test(ua) ? 'mac'
      : /CrOS/i.test(ua) ? 'chromeos' : /Linux/i.test(ua) ? 'linux' : 'other';
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    var et = c && c.effectiveType || '', save = !!(c && c.saveData);
    var slow = save || /^(slow-2g|2g|3g)$/.test(et) || (c && c.downlink > 0 && c.downlink < 1.5);
    var d = new Date(), h = d.getHours(), day = d.getDay();
    var part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night';
    // where they came from: referrer host, utm_source, or the in-app browser
    var ref = '', q = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    try { q = (new URLSearchParams(location.search).get('utm_source') || '').toLowerCase(); } catch (e) {}
    var from = /instagram/.test(q) || /Instagram/.test(ua) || /instagram\.com$/.test(ref) ? 'instagram'
      : /whatsapp/.test(q) || /whatsapp/.test(ref) ? 'whatsapp'
      : /linkedin/.test(q) || /LinkedInApp/.test(ua) || /linkedin\.com$|lnkd\.in$/.test(ref) ? 'linkedin'
      : /facebook|fb\b/.test(q) || /FBAN|FBAV/.test(ua) || /facebook\.com$/.test(ref) ? 'facebook'
      : /youtube/.test(q) || /youtube\.com$/.test(ref) ? 'youtube'
      : /google/.test(q) || /(^|\.)google\./.test(ref) ? 'google'
      : /bing|duckduckgo|yahoo|ecosia|yandex/.test(q + ' ' + ref) ? 'search'
      : ref && ref !== location.hostname && !/yksproductions\.com$/.test(ref) ? 'other'
      : q ? 'other' : (ref ? 'internal' : 'direct');
    // keep the arrival source for the whole visit (this tab only)
    try {
      if (from === 'internal' || from === 'direct') from = sessionStorage.getItem('yks_arr') || from;
      else sessionStorage.setItem('yks_arr', from);
      if (!sessionStorage.getItem('yks_arr')) sessionStorage.setItem('yks_arr', from);
    } catch (e) {}
    // new vs returning: a first-seen day stamp on this device only (skipped under Do Not Track)
    var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
    var returning = false, sessions = 1;
    try {
      if (!dnt && localStorage.getItem('yks_smart_off') !== '1') {
        var seen = JSON.parse(localStorage.getItem('yks_seen_v1') || 'null') || { n: 0, t: 0 };
        if (!sessionStorage.getItem('yks_sess')) { sessionStorage.setItem('yks_sess', '1'); seen.prev = seen.t; seen.n = (seen.n || 0) + 1; seen.t = Date.now(); localStorage.setItem('yks_seen_v1', JSON.stringify(seen)); }
        returning = (seen.n || 0) > 1; sessions = seen.n || 1;
      }
    } catch (e) {}
    var rm = false; try { rm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    return {
      device: mobile ? 'mobile' : tablet ? 'tablet' : 'desktop', os: os, touch: touch,
      net: { type: et || 'unknown', saveData: save, slow: !!slow },
      hour: h, daypart: part, weekday: day, weekend: day === 0 || day === 6,
      from: from, returning: returning, sessions: sessions,
      reducedMotion: rm, dnt: dnt, region: R, regionSource: D.src
    };
  }
  var CTX = context();
  Y.context = function () { return CTX; };
  try {
    var html = document.documentElement;
    html.setAttribute('data-yks-device', CTX.device);
    if (CTX.net.slow) html.setAttribute('data-yks-net', 'slow');
  } catch (e) {}

  /* ---------- no printed numbers ----------
     Owner's rule: the numbers are never shown as text, only linked. Any
     number that any script prints (e.g. the chat menu's "Call" row) is
     replaced, before paint, with words: "Tap to call me" inside a tel: link,
     "Message me on WhatsApp" inside a wa.me link, "my WhatsApp" elsewhere.
     title / aria-label / alt get the same treatment. JSON-LD is untouched. */
  var NUM_RE = /(?:\+?\s?(?:91|971)[\s.-]?)?(?:0?50[\s.-]?195[\s.-]?5122|97466[\s.-]?79720|9746679720)/g;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, TEMPLATE: 1, TITLE: 1 };
  var ATTRS = ['title', 'aria-label', 'alt'];
  function label(el) {
    var a = el && el.closest && el.closest('a[href]'), h = a ? a.getAttribute('href') || '' : '';
    return /^tel:/i.test(h) ? 'Tap to call me' : /wa\.me\//.test(h) ? 'Message me on WhatsApp' : 'my WhatsApp';
  }
  function scrubText(t) {
    var p = t.parentNode, v = t.nodeValue;
    if (!p || SKIP[p.nodeName] || !v || v.length > 4000) return;
    NUM_RE.lastIndex = 0;
    if (NUM_RE.test(v)) { NUM_RE.lastIndex = 0; t.nodeValue = v.replace(NUM_RE, label(p)); }
    NUM_RE.lastIndex = 0;
  }
  function scrubAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (v) { NUM_RE.lastIndex = 0; if (NUM_RE.test(v)) { NUM_RE.lastIndex = 0; el.setAttribute(ATTRS[i], v.replace(NUM_RE, label(el))); } }
    }
    NUM_RE.lastIndex = 0;
  }

  var to = R && LINES[R], other = R && LINES[OTHER[R]];
  if (R && body) body.setAttribute('data-wa', to.wa);   // chat.js, landing.js, geo-wa.js read this
  var WA_RE = R && new RegExp('wa\\.me/' + other.wa, 'g');
  var TEL_RE = R && new RegExp('^tel:\\+?' + other.wa + '$');

  function kept(el) { return el && el.closest && el.closest('[data-geo-keep]'); }
  function fixLink(a) {
    if (!R) return;                                  // unknown region: the page's own line stays
    var h = a.getAttribute('href');
    if (!h || kept(a)) return;
    if (h.indexOf('wa.me/' + other.wa) !== -1) a.setAttribute('href', h.replace(WA_RE, 'wa.me/' + to.wa));
    else if (TEL_RE.test(h)) a.setAttribute('href', 'tel:' + to.tel);
  }
  function scan(n) {
    if (n.nodeType === 3) { scrubText(n); return; }
    if (n.nodeType !== 1 || SKIP[n.nodeName]) return;
    if (n.nodeName === 'A') fixLink(n);
    scrubAttrs(n);
    var as = n.getElementsByTagName ? n.getElementsByTagName('a') : [];
    for (var i = 0; i < as.length; i++) fixLink(as[i]);
    var at = n.querySelectorAll ? n.querySelectorAll('[title],[aria-label],[alt]') : [];
    for (var k = 0; k < at.length; k++) scrubAttrs(at[k]);
    if (n.firstChild) {
      var w = document.createTreeWalker(n, 4, null, false), t;
      while ((t = w.nextNode())) scrubText(t);
    }
  }
  // as the parser (and later, any script) adds nodes
  var mo = window.MutationObserver && new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'attributes') { if (m.attributeName === 'href') { if (m.target.nodeName === 'A') fixLink(m.target); } else scrubAttrs(m.target); continue; }
      if (m.type === 'characterData') { scrubText(m.target); continue; }
      for (var j = 0; j < m.addedNodes.length; j++) scan(m.addedNodes[j]);
    }
  });
  if (mo) mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'title', 'aria-label', 'alt'] });
  function full() {
    var b = document.body; if (!b) return;
    if (R && b.getAttribute('data-wa') !== to.wa) b.setAttribute('data-wa', to.wa);
    scan(b);
  }
  full();
  document.addEventListener('DOMContentLoaded', full);
  if (!R) return;
  // forms that let the visitor pick a WhatsApp line start on theirs
  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('f-region');
    if (sel && sel.querySelector('option[value="' + to.wa + '"]') && !sel.getAttribute('data-touched')) sel.value = to.wa;
  });
})();
