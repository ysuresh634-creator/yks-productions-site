/* Region-aware contact line. A client in India always gets the India number,
   a client in the UAE / Gulf always gets the UAE number, on every page.

   Loaded as the first thing inside <body> (plain <script>, no defer) so it can
   set <body data-wa> before chat.js, landing.js and the rest read it, and swap
   WhatsApp links, tel: links and printed numbers while the page is still being
   parsed: nothing flashes, nothing moves.

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
     YKS.waLink(text)      -> 'https://wa.me/<number>?text=...'
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
  if (!R) return;                                   // unknown: the page's own line stays

  var to = LINES[R], from = LINES[OTHER[R]];
  if (body) body.setAttribute('data-wa', to.wa);   // chat.js, landing.js, geo-wa.js read this
  var WA_RE = new RegExp('wa\\.me/' + from.wa, 'g');
  var TEL_RE = new RegExp('^tel:\\+?' + from.wa + '$');
  // every way the other number is printed on the site
  var TXT_RE = R === 'in'
    ? /\+971[\s-]?50[\s-]?195[\s-]?5122/g
    : /\+91[\s-]?97466[\s-]?79720|\+91[\s-]?9746679720/g;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, TEMPLATE: 1, TITLE: 1 };

  function kept(el) { return el && el.closest && el.closest('[data-geo-keep]'); }
  function fixLink(a) {
    var h = a.getAttribute('href');
    if (!h || kept(a)) return;
    if (h.indexOf('wa.me/' + from.wa) !== -1) a.setAttribute('href', h.replace(WA_RE, 'wa.me/' + to.wa));
    else if (TEL_RE.test(h)) a.setAttribute('href', 'tel:' + to.tel);
  }
  function fixText(t) {
    var p = t.parentNode;
    if (!p || SKIP[p.nodeName] || kept(p)) return;
    var v = t.nodeValue;
    if (v && v.length < 4000 && TXT_RE.test(v)) { TXT_RE.lastIndex = 0; t.nodeValue = v.replace(TXT_RE, to.display); }
    TXT_RE.lastIndex = 0;
  }
  function scan(n) {
    if (n.nodeType === 3) { fixText(n); return; }
    if (n.nodeType !== 1 || SKIP[n.nodeName]) return;
    if (n.nodeName === 'A') fixLink(n);
    var as = n.getElementsByTagName ? n.getElementsByTagName('a') : [];
    for (var i = 0; i < as.length; i++) fixLink(as[i]);
    if (n.firstChild) {
      var w = document.createTreeWalker(n, 4, null, false), t;
      while ((t = w.nextNode())) fixText(t);
    }
  }
  // swap as the parser (and later, any script) adds nodes
  var mo = window.MutationObserver && new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'attributes') { if (m.target.nodeName === 'A') fixLink(m.target); continue; }
      if (m.type === 'characterData') { fixText(m.target); continue; }
      for (var j = 0; j < m.addedNodes.length; j++) scan(m.addedNodes[j]);
    }
  });
  if (mo) mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href'] });
  function full() { if (document.body) { if (!document.body.getAttribute('data-wa') || document.body.getAttribute('data-wa') !== to.wa) document.body.setAttribute('data-wa', to.wa); scan(document.body); } }
  full();
  document.addEventListener('DOMContentLoaded', full);
  // forms that let the visitor pick a WhatsApp line start on theirs
  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('f-region');
    if (sel && sel.querySelector('option[value="' + to.wa + '"]') && !sel.getAttribute('data-touched')) sel.value = to.wa;
  });
})();
