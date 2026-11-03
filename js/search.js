/* ═══════════════════════════════════════════════════════════════
   YKS SITE SEARCH  ·  retrieval + grounded AI answers
   ───────────────────────────────────────────────────────────────
   Self-contained: injects its own trigger, overlay and styles, so it
   drops onto both page shells (.nav on the homepage, .l-nav on the
   ~70 landing pages) without touching either stylesheet.

   Two layers:
     1. INSTANT — local scoring over search-index.json. Typo-tolerant,
        synonym-aware, grouped by section. Runs on every keystroke.
     2. ANSWER  — the question plus the top-scoring pages go to the Iris
        worker, which answers grounded in those pages and cites them.
        The worker caps 30 messages/IP/day, so this NEVER fires on a
        keystroke: it needs Enter or a click, and answers are cached.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__yksSearch) return;
  window.__yksSearch = true;

  var INDEX_URL = '/search-index.json';
  var RECENT_KEY = 'yksRecent';
  var index = null, vocab = null, loading = null;
  var results = [], rows = [], active = -1, lastQuery = '', corrected = '', activeSub = '';
  var answers = {};        // question -> {text, cites} for this tab
  var pending = false;

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
    '.yks-sbox{max-width:680px;margin:0 auto;background:#100d16;border:1px solid rgba(244,237,226,.14);',
    'border-radius:18px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.6);',
    'transform:translateY(-10px);transition:transform .22s ease}',
    '.yks-sov.in .yks-sbox{transform:none}',
    '.yks-sfield{display:flex;align-items:center;gap:12px;padding:16px 18px;',
    'border-bottom:1px solid rgba(244,237,226,.10)}',
    '.yks-sfield>svg{width:17px;height:17px;flex:none;opacity:.5;color:#f4ede2}',
    '.yks-sin{flex:1;background:none;border:0;outline:0;color:#f4ede2;font-size:16px;',
    "font-family:'Inter',system-ui,sans-serif;min-width:0}",
    '.yks-sin::placeholder{color:rgba(244,237,226,.42)}',
    '.yks-sesc{background:none;border:1px solid rgba(244,237,226,.22);color:rgba(244,237,226,.6);',
    'border-radius:6px;font-size:10px;letter-spacing:.1em;padding:4px 8px;cursor:pointer;flex:none}',
    '.yks-sesc:hover{color:#f4ede2;border-color:rgba(244,237,226,.5)}',
    '.yks-schips{display:flex;gap:7px;padding:11px 18px;overflow-x:auto;scrollbar-width:none;',
    'border-bottom:1px solid rgba(244,237,226,.10)}',
    '.yks-schips::-webkit-scrollbar{display:none}',
    '.yks-schips button{flex:none;background:none;border:1px solid rgba(244,237,226,.20);',
    'color:rgba(244,237,226,.72);border-radius:30px;padding:5px 12px;font:inherit;font-size:11.5px;',
    'cursor:pointer;white-space:nowrap;transition:.2s}',
    '.yks-schips button:hover{color:#f4ede2;border-color:rgba(244,237,226,.45)}',
    '.yks-schips button.on{background:#ff8c3b;border-color:#ff8c3b;color:#0b0910;font-weight:600}',
    '.yks-schips button i{font-style:normal;opacity:.55;margin-left:5px;font-size:10.5px}',
    '.yks-slist{max-height:min(60vh,500px);overflow-y:auto;overscroll-behavior:contain}',
    '.yks-sgrp{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(244,237,226,.38);',
    'padding:14px 18px 6px}',
    '.yks-sr{display:block;padding:11px 18px;text-decoration:none;border-left:2px solid transparent}',
    '.yks-sr b{display:block;color:#f4ede2;font-size:14.5px;font-weight:500;line-height:1.35}',
    '.yks-sr s{display:block;color:rgba(244,237,226,.52);font-size:12.5px;text-decoration:none;',
    'line-height:1.45;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.yks-sr mark,.yks-sfix mark{background:none;color:#ff8c3b}',
    '.yks-sr.on,.yks-sr:hover{background:rgba(255,140,59,.10);border-left-color:#ff8c3b}',
    '.yks-anch b::before{content:"§";color:#ff8c3b;opacity:.75;margin-right:7px;font-weight:400}',
    '.yks-anch s{color:rgba(244,237,226,.40);font-size:11.5px;letter-spacing:.02em}',
    '.yks-smsg{padding:24px 18px;color:rgba(244,237,226,.5);font-size:13.5px;text-align:center;line-height:1.6}',
    '.yks-sfix{padding:9px 18px;font-size:12.5px;color:rgba(244,237,226,.55)}',
    '.yks-sfix button{background:none;border:0;color:#ff8c3b;cursor:pointer;font:inherit;padding:0}',

    /* ask row */
    '.yks-sai{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;',
    'background:none;border:0;border-left:2px solid transparent;padding:12px 18px;font:inherit}',
    '.yks-sai:hover,.yks-sai.on{background:rgba(255,140,59,.10);border-left-color:#ff8c3b}',
    '.yks-sai u,.yks-ans-h u{flex:none;width:26px;height:26px;border-radius:50%;display:grid;',
    'place-items:center;text-decoration:none;background:linear-gradient(135deg,#ff8c3b,#ff2f87);',
    'color:#0b0910;font-size:11px;font-weight:700;font-style:normal}',
    '.yks-sai div{min-width:0}',
    '.yks-sai b{display:block;color:#f4ede2;font-size:14px;font-weight:500;line-height:1.35;',
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.yks-sai s{display:block;color:rgba(244,237,226,.5);font-size:12px;text-decoration:none;margin-top:1px}',

    /* answer card */
    '.yks-ans{margin:4px 14px 12px;padding:14px 16px;border-radius:14px;',
    'background:rgba(255,140,59,.055);border:1px solid rgba(255,140,59,.20)}',
    '.yks-ans-h{display:flex;align-items:center;gap:9px;margin-bottom:9px}',
    '.yks-ans-h b{color:#f4ede2;font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:500}',
    '.yks-ans-t{color:rgba(244,237,226,.90);font-size:14px;line-height:1.62;white-space:pre-wrap;',
    'word-wrap:break-word}',
    '.yks-ans-t a{color:#ff8c3b}',
    '.yks-cites{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}',
    '.yks-cites a{display:inline-block;padding:5px 11px;border-radius:30px;font-size:11.5px;',
    'text-decoration:none;color:rgba(244,237,226,.82);border:1px solid rgba(244,237,226,.20)}',
    '.yks-cites a:hover{border-color:#ff8c3b;color:#ff8c3b}',
    '.yks-more{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}',
    '.yks-more button{background:none;border:1px solid rgba(255,140,59,.35);color:#ff8c3b;',
    'border-radius:30px;padding:5px 11px;font:inherit;font-size:11.5px;cursor:pointer}',
    '.yks-more button:hover{background:rgba(255,140,59,.12)}',
    '.yks-dots span{display:inline-block;width:5px;height:5px;margin-right:4px;border-radius:50%;',
    'background:#ff8c3b;animation:yksb 1s infinite}',
    '.yks-dots span:nth-child(2){animation-delay:.15s}.yks-dots span:nth-child(3){animation-delay:.3s}',
    '@keyframes yksb{0%,60%,100%{opacity:.25}30%{opacity:1}}',

    '.yks-sfoot{display:flex;gap:16px;padding:10px 18px;border-top:1px solid rgba(244,237,226,.10);',
    'font-size:10px;letter-spacing:.1em;color:rgba(244,237,226,.35)}',
    '@media(max-width:640px){.yks-sov{padding:0}.yks-sbox{border-radius:0;max-width:none;height:100%;',
    'display:flex;flex-direction:column}.yks-slist{max-height:none;flex:1}.yks-sfoot{display:none}}',
    '@media(prefers-reduced-motion:reduce){.yks-sov,.yks-sbox{transition:none}.yks-dots span{animation:none}}'
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
        'spellcheck="false" placeholder="Search or ask anything…" aria-label="Search this site" />' +
        '<button class="yks-sesc" type="button">ESC</button>' +
      '</div>' +
      '<div class="yks-schips" role="tablist" aria-label="Filter by subject"></div>' +
      '<div class="yks-slist" role="listbox"></div>' +
      '<div class="yks-sfoot"><span>↑↓ move</span><span>↵ open</span><span>esc close</span></div>' +
    '</div>';

  var input, list, chips, lastFocus = null;

  function mount() {
    document.body.appendChild(ov);
    input = ov.querySelector('.yks-sin');
    list = ov.querySelector('.yks-slist');
    chips = ov.querySelector('.yks-schips');
    ov.querySelector('.yks-sesc').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    input.addEventListener('input', function () { render(input.value); signal(input.value); });
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
        // vocabulary powers typo correction
        var seen = {};
        index.forEach(function (e) {
          (e.t + ' ' + e.k).toLowerCase().split(/[^a-z0-9]+/).forEach(function (w) {
            if (w.length > 3) seen[w] = 1;
          });
        });
        vocab = Object.keys(seen);
        return index;
      })
      .catch(function () { loading = null; index = null; return null; });
    return loading;
  }

  /* ---------- vocabulary: synonyms + stopwords ----------
     Visitors search their own words, not the site's. Nobody writes
     "pricing" here — the pages say quote, cost, rate. */
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
    contact: ['quote', 'book', 'enquire', 'hire'],
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
    ads: ['campaign', 'brand', 'commercial'],
    // how people actually type it — slang, Hinglish, shop-talk
    shoot: ['photography', 'video', 'production', 'shoots'],
    shoots: ['shoot', 'photography', 'video'],
    film: ['films', 'video', 'brand film'],
    films: ['film', 'video'],
    commercial: ['ad film', 'brand', 'campaign'],
    commercials: ['ad film', 'brand', 'campaign'],
    tvc: ['ad film', 'commercial'],
    advertisement: ['ad film', 'campaign'],
    product: ['products', 'e-commerce', 'catalogue'],
    products: ['product', 'e-commerce'],
    ecommerce: ['e-commerce', 'product', 'catalogue'],
    catalog: ['catalogue', 'product', 'e-commerce'],
    catalogue: ['product', 'e-commerce'],
    amazon: ['e-commerce', 'product'],
    flipkart: ['e-commerce', 'product'],
    myntra: ['e-commerce', 'fashion'],
    influencer: ['influencers', 'creator', 'talent'],
    influencers: ['influencer', 'creator', 'talent'],
    creator: ['creators', 'content', 'influencer'],
    creators: ['creator', 'content', 'influencer'],
    ugc: ['content creator', 'reels', 'content'],
    youtube: ['video', 'content', 'reels'],
    instagram: ['reels', 'social', 'content'],
    insta: ['instagram', 'reels', 'social'],
    reels: ['reel', 'instagram', 'social', 'content'],
    shorts: ['reels', 'youtube'],
    wedding: ['weddings', 'bride'],
    weddings: ['wedding'],
    party: ['nights', 'nightlife', 'events'],
    parties: ['party', 'nights', 'nightlife'],
    club: ['nights', 'nightlife'],
    event: ['events', 'launch'],
    events: ['event', 'launch'],
    launch: ['event', 'launches'],
    headshot: ['headshots', 'portrait', 'linkedin'],
    headshots: ['headshot', 'portrait', 'linkedin'],
    hotel: ['hotels', 'resort', 'hospitality'],
    resort: ['hotel', 'hospitality'],
    restaurant: ['food', 'menu', 'cafe'],
    cafe: ['food', 'restaurant'],
    interior: ['real estate', 'property'],
    interiors: ['real estate', 'property'],
    villa: ['real estate', 'property'],
    apartment: ['real estate', 'property'],
    startup: ['corporate', 'brand'],
    company: ['corporate', 'brand'],
    become: ['apply', 'how to become'],
    apply: ['register', 'join', 'talents'],
    register: ['apply', 'join', 'registration'],
    registration: ['apply', 'register'],
    join: ['apply', 'talents'],
    portfolio: ['portfolios', 'talents'],
    modelling: ['model', 'models', 'modeling'],
    modeling: ['modelling', 'model', 'models'],
    actress: ['actor', 'talent', 'casting'],
    audition: ['casting', 'talent'],
    auditions: ['casting', 'talent'],
    scam: ['scams', 'fees', 'red flags'],
    agency: ['agencies', 'production house'],
    freelance: ['independent', 'freelancer']
  };

  /* Whole-phrase rewrites run before splitting — "model banna hai" and
     "ad video" are one idea each, not three words to match one by one. */
  var PHRASES = [
    [/\b(kaise|kese|kaisa|kaise\s+se)\s+(ban\w*)\s+(model|actor|actress)\b/g, 'become a $3'],
    [/\b(model|actor|actress)\s+(kaise|kese|kaisa)\s+(ban\w*)\b/g, 'become a $1'],
    [/\bmodel\s*(banna|banana|bane|banu|banni|bano|aakan\w*|aagan\w*|aaganum)(\s+(hai|h|he|chahta|chahti|hoon|hun|venam|venum))*\b/g, 'become a model'],
    [/\b(actor|actress|heroine|hero)\s*(banna|banana|bane|banu|aakan\w*)(\s+(hai|h|he|chahta|chahti|hoon|hun))*\b/g, 'become an actor talents'],
    [/\b(acting|modell?ing)\s+(chance|chances|career|opportunity|kaam|work)\b/g, 'become a model talents'],
    [/\b(ad|ads|advert|advertisement|advertising|promo|promotional)\s*(video|videos|shoot|shoots|film|films)\b/g, 'ad film'],
    [/\bcommercial\s+(video|shoot|film)s?\b/g, 'ad film'],
    [/\bbrand\s+(video|shoot)s?\b/g, 'brand film'],
    [/\bproduct\s*(shoot|shoots|photo|photos|pics|pictures|images|photoshoot)\b/g, 'product photography'],
    [/\b(e[\s-]?com|ecom|e-?commerce)\b/g, 'e-commerce'],
    [/\b(insta|instagram)\s+(reel|reels|video|videos)\b/g, 'reels'],
    [/\breels?\s+(shoot|making|banana|video|videos|production)\b/g, 'reels production'],
    [/\bpre\s*wedding\b/g, 'pre-wedding'],
    [/\b(shaadi|shadi|vivah|kalyanam|nikah)\b/g, 'wedding'],
    [/\bphoto\s*shoot\b/g, 'shoot'],
    [/\bvideo\s+grapher\b/g, 'videographer'],
    [/\bphoto\s+grapher\b/g, 'photographer'],
    [/\bcasting\s+calls?\b/g, 'casting'],
    [/\bfree\s+(registration|signup|sign up)\b/g, 'apply free'],
    [/\bbengaluru\b/g, 'bangalore'], [/\bbombay\b/g, 'mumbai'], [/\bmadras\b/g, 'chennai'],
    [/\b(gurgaon|gurugram|noida|ncr)\b/g, 'delhi'], [/\babudhabi\b/g, 'abu dhabi'],
    [/\breal\s*estate\b/g, 'real estate']
  ];

  var STOP = ('hai h he hoon hun mujhe mera meri mere chahiye chahta chahti karna karni karwana kya ka ki ke ko se mein '
    + 'ek wala wali venam venum vendi enikku ennu pannanum pls plz bro sir near nearby best good top '
    + 'a an the do does did you your i me my we our is are was be been am can could will '
    + 'would should shall may might have has had of for to in on at by with from as and or but if '
    + 'it its this that these those there here what when where how why who whom which any some '
    + 'about into over under out up down off then than too very just also get got take takes '
    + 'use uses used using need needs want wants looking look please tell show me'
  ).split(' ');

  function phrase(q) {
    var l = ' ' + q.toLowerCase() + ' ';
    PHRASES.forEach(function (p) { l = l.replace(p[0], p[1]); });
    return l.trim();
  }

  // two-word ideas that must match together, or "ad" matches every "made"
  var KEEP = ['ad film', 'brand film', 'product photography', 'real estate', 'abu dhabi', 'content creator', 'how to cast'];

  function terms(q) {
    var l = phrase(q);
    KEEP.forEach(function (k) { l = l.split(k).join(k.replace(/ /g, '\u00a0')); });
    var raw = l.replace(/[?!.,;:'"]/g, ' ').split(/[ \t\n]+/).filter(Boolean).map(function (w) { return w.replace(/\u00a0/g, ' '); });
    var kept = raw.filter(function (w) { return STOP.indexOf(w) === -1; });
    return kept.length ? kept : raw;
  }

  /* ---------- typo tolerance ----------
     Only runs for a term that matched nothing, so the common path stays free. */
  // Levenshtein, abandoned as soon as every cell in a row exceeds max
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var pp = [], prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      var best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
                          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        // swapped neighbours ("dubia", "potrait") count as one slip, not two
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1))
          cur[j] = Math.min(cur[j], pp[j - 2] + 1);
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      pp = prev.slice();
      prev = cur.slice();
    }
    return prev[b.length];
  }

  function fix(w) {
    if (!vocab || w.length < 4) return null;
    // longer words absorb more damage before they stop being recognisable
    var max = w.length >= 7 ? 2 : 1;
    var best = null, bd = max + 1;
    for (var i = 0; i < vocab.length; i++) {
      var v = vocab[i];
      if (Math.abs(v.length - w.length) > max) continue;
      // typos rarely hit the first letter — but phones do, so long words get one free swap
      var firstOk = v.charAt(0) === w.charAt(0);
      if (!firstOk && w.length < 6) continue;
      var d = dist(w, v, firstOk ? max : 1);
      if (!firstOk && d > 1) continue;
      if (d < bd) { bd = d; best = v; if (d === 1) break; }
    }
    return best;
  }

  /* ---------- scoring ---------- */
  function hit(e, t, w) {
    if (e._h.indexOf(w) === -1) return 0;
    var s = 1;
    if (t.indexOf(w) !== -1) s += 10;
    if (t.split(/\W+/).indexOf(w) !== -1) s += 8;
    if (t.indexOf(w) === 0) s += 6;
    if (e.k.toLowerCase().indexOf(w) !== -1) s += 4;
    if (e.d.toLowerCase().indexOf(w) !== -1) s += 2;
    if (e.u.toLowerCase().indexOf(w) !== -1) s += 3;
    return s;
  }

  function score(e, t) {
    var title = e.t.toLowerCase(), total = 0;
    for (var i = 0; i < t.length; i++) {
      var w = t[i], best = hit(e, title, w);
      if (!best) {
        var alts = SYN[w] || [];
        for (var j = 0; j < alts.length; j++) {
          var s = hit(e, title, alts[j]) * 0.45;   // synonyms never outrank a literal hit
          if (s > best) best = s;
        }
      }
      if (!best) return 0;
      total += best;
    }
    total += (CAT_BOOST[e.c] || 0);
    if (e.a) total += 2;              // a section match is more precise than a page
    return total;
  }

  /* Section priority. The portfolio is the point of the site — someone
     filtering "Real estate" wants to SEE the work, not read a pricing
     article about it, so Work leads and Journal/Info trail. */
  var CAT_ORDER = ['Work', 'Market', 'Services', 'Talent', 'Journal', 'Info', 'Home'];
  var CAT_BOOST = { Work: 7, Home: 3, Market: 3, Services: 2, Talent: 2, Journal: 0, Info: 0 };

  function catRank(c) {
    var it = intentNow();
    // someone building a portfolio, or casting one, wants Talent first
    if (c === 'Talent' && it && (it.audience === 'talent' || it.audience === 'cast')) return -1;
    var i = CAT_ORDER.indexOf(c);
    return i < 0 ? 99 : i;
  }

  function inFilter(e) { return !activeSub || (e.g && e.g.indexOf(activeSub) !== -1); }

  /* Does a word occur anywhere on the site (literally or via a synonym)? */
  function known(w) {
    var alts = [w].concat(SYN[w] || []);
    for (var i = 0; i < index.length; i++) {
      for (var j = 0; j < alts.length; j++) if (index[i]._h.indexOf(alts[j]) !== -1) return true;
    }
    return false;
  }

  /* Soft AND: a stray word that exists nowhere on the site ("bro", a typo
     past saving) should not zero out an otherwise good query. Fix it if we
     can, drop it if we can't — as long as something meaningful remains. */
  function tidy(t) {
    var out = [], changed = false;
    t.forEach(function (w) {
      if (known(w)) { out.push(w); return; }
      var f = fix(w);
      if (f && f !== w) { out.push(f); changed = true; }
      else if (t.length > 1) changed = true;              // dropped
      else out.push(w);
    });
    return { t: out.length ? out : t, changed: changed };
  }

  /* On-device intent (js/smart.js) nudges ties, never overrides relevance */
  var SVC_WORDS = {
    adfilm: ['ad film', 'brand film', 'production'], product: ['product', 'e-commerce', 'catalogue'],
    corporate: ['corporate', 'headshot'], events: ['event', 'nights'], realestate: ['real estate', 'property'],
    fashion: ['fashion', 'editorial'], wedding: ['wedding'], reels: ['reels', 'content'],
    hospitality: ['hotel', 'food'], portrait: ['portrait'], marketing: ['marketing'],
    talent: ['apply', 'become', 'portfolio', 'guides'], cast: ['find-models', 'models-in', 'cast']
  };
  function intentNow() {
    try { return window.YKSSmart && window.YKSSmart.enabled() ? window.YKSSmart.intent() : null; } catch (e) { return null; }
  }
  function boost(e, it) {
    if (!it) return 0;
    var b = 0, h = e._h;
    if (it.city && h.indexOf(it.city.replace('-', ' ')) !== -1 || it.city && e.u.indexOf(it.city) !== -1) b += 3;
    var ws = SVC_WORDS[it.service] || [];
    for (var i = 0; i < ws.length; i++) if (h.indexOf(ws[i]) !== -1) { b += 3; break; }
    if (it.audience === 'talent' && e.c === 'Talent' && !/\/talents\/id\//.test(e.u)) b += 3;
    return b;
  }

  function rank(t) {
    var it = intentNow();
    return index.filter(inFilter)
      .map(function (e) { var s = score(e, t); return { e: e, s: s ? s + boost(e, it) : 0 }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (r) { return r.e; });
  }

  /* ---------- subject filters ----------
     "I only want to see weddings" is a browse, not a search — so a chip on
     its own (empty query) lists every page in that subject. */
  var SUB_ORDER = ['Weddings', 'Real estate', 'Fashion', 'Portraits', 'Films',
                   'Models', 'Corporate', 'Events', 'Food'];

  function drawChips() {
    if (!index || !chips) return;
    var count = {};
    index.forEach(function (e) {
      (e.g || []).forEach(function (g) { count[g] = (count[g] || 0) + 1; });
    });
    var have = SUB_ORDER.filter(function (g) { return count[g]; });
    var h = '<button type="button" data-sub="" class="' + (activeSub ? '' : 'on') + '">All' +
      '<i>' + index.length + '</i></button>';
    have.forEach(function (g) {
      h += '<button type="button" data-sub="' + esc(g) + '" class="' + (activeSub === g ? 'on' : '') +
        '">' + esc(g) + '<i>' + count[g] + '</i></button>';
    });
    chips.innerHTML = h;
    Array.prototype.forEach.call(chips.querySelectorAll('[data-sub]'), function (b) {
      b.addEventListener('click', function () {
        activeSub = b.dataset.sub || '';
        drawChips();
        render(input.value);
        input.focus();
      });
    });
  }

  /* ---------- html helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function hl(s, t) {
    var out = esc(s);
    t.forEach(function (w) {
      if (!w) return;
      out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  // the worker replies in light markdown
  function md(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  }

  /* ---------- recent searches ---------- */
  function recent(add) {
    var r = [];
    try { r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) {}
    if (add) {
      r = r.filter(function (x) { return x !== add; });
      r.unshift(add);
      r = r.slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch (e) {}
      signal(add, true);
    }
    return r;
  }

  /* What visitors look for tells js/smart.js what to suggest. The event
     carries the query only; smart.js drops anything that looks personal. */
  var sigTimer = 0, lastSig = '';
  function signal(q, now) {
    clearTimeout(sigTimer);
    q = (q || '').trim();
    if (q.length < 3) return;
    var fire = function () {
      if (q.toLowerCase() === lastSig) return;
      lastSig = q.toLowerCase();
      try { window.dispatchEvent(new CustomEvent('yks:search', { detail: { q: q } })); } catch (e) {}
    };
    if (now) fire(); else sigTimer = setTimeout(fire, 1200);
  }

  /* ---------- AI ---------- */
  function aiReady() { return !!window.YKS_CHAT_ENDPOINT; }

  function isQuestion(q) {
    return /\?$/.test(q) ||
      /^(who|what|when|where|why|how|can|do|does|is|are|will|would|should|could|any|whats|what's)\b/i.test(q) ||
      q.split(/\s+/).length >= 5;
  }

  /* The worker holds Iris's system prompt and her anti-fabrication guards —
     search doesn't add a second brain, it just gives her the pages that
     match so the answer is grounded and can cite them. */
  function askAI(q) {
    if (pending) return;
    var key = q.toLowerCase().trim();
    if (answers[key]) { render(input.value); return; }   // cached — costs no quota

    var cites = rank(terms(q)).slice(0, 5);
    pending = true;
    render(input.value);

    var ctxLines = cites.map(function (e, i) {
      return (i + 1) + '. ' + e.t + ' — ' + e.u + (e.d ? ' — ' + e.d : '');
    }).join('\n');

    var msg = q + (ctxLines
      ? '\n\n---\nPages on yksproductions.com that may be relevant:\n' + ctxLines +
        '\nAnswer from these and what you know about Yedukrishna. If they do not cover it, say so plainly rather than guessing.'
      : '');

    fetch(window.YKS_CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: msg }],
        ctx: {
          page: (document.title || '').slice(0, 120),
          path: location.pathname,
          lang: navigator.language || ''
        }
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        answers[key] = {
          text: (j && j.reply) || 'That one did not reach me. Try again, or message Yedukrishna directly.',
          cites: cites
        };
      })
      .catch(function () {
        answers[key] = { text: '__ERR__', cites: cites };
      })
      .then(function () { pending = false; render(input.value); });
  }

  function followUps(q) {
    var l = q.toLowerCase(), out = [];
    if (!/cost|price|quote|much/.test(l)) out.push('What would this cost?');
    if (!/dubai|india|bangalore/.test(l)) out.push('Do you shoot in Dubai?');
    if (!/available|date|when/.test(l)) out.push('Are you available in 2026?');
    return out.slice(0, 3);
  }

  /* ---------- render ---------- */
  function aiRow(q, i) {
    return '<button class="yks-sai" type="button" data-ai="1" data-i="' + i + '">' +
      '<u>✦</u><div><b>Ask Iris — “' + esc(q) + '”</b>' +
      '<s>A grounded answer, with the pages it came from</s></div></button>';
  }

  function answerCard(q) {
    var a = answers[q.toLowerCase().trim()];
    if (pending && !a) {
      return '<div class="yks-ans"><div class="yks-ans-h"><u>✦</u><b>Iris</b></div>' +
        '<div class="yks-ans-t yks-dots"><span></span><span></span><span></span></div></div>';
    }
    if (!a) return '';
    if (a.text === '__ERR__') {
      return '<div class="yks-ans"><div class="yks-ans-h"><u>✦</u><b>Iris</b></div>' +
        '<div class="yks-ans-t">I can’t reach my brain right now — but the pages below should cover it, ' +
        (/\/talents|\/models-in-|\/casting-|\/become-a-model/.test(location.pathname) ? 'or use the form on this page.' : 'or message Yedukrishna on <a href="https://wa.me/971501955122" target="_blank" rel="noopener">WhatsApp</a>.') +
        '</div></div>';
    }
    var h = '<div class="yks-ans"><div class="yks-ans-h"><u>✦</u><b>Iris</b></div>' +
      '<div class="yks-ans-t">' + md(a.text) + '</div>';
    if (a.cites.length) {
      h += '<div class="yks-cites">' + a.cites.slice(0, 4).map(function (e) {
        return '<a href="' + esc(e.u) + '">' + esc(e.t.split('|')[0].split('—')[0].trim()) + '</a>';
      }).join('') + '</div>';
    }
    var fu = followUps(q);
    if (fu.length) {
      h += '<div class="yks-more">' + fu.map(function (s) {
        return '<button type="button" data-fu="' + esc(s) + '">' + esc(s) + '</button>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  }

  function render(q) {
    q = (q || '').trim();
    corrected = '';

    if (!q) {
      results = []; rows = []; active = -1; lastQuery = '';

      // a chip with no query = browse that subject end to end
      if (activeSub && index) {
        results = index.filter(inFilter).sort(function (a, b) {
          return catRank(a.c) - catRank(b.c) || a.t.localeCompare(b.t);
        });
        var b = '', bg = '', bi = 0;
        results.forEach(function (e) {
          if (e.c !== bg) { bg = e.c; b += '<div class="yks-sgrp">' + esc(bg) + '</div>'; }
          b += '<a class="yks-sr' + (e.a ? ' yks-anch' : '') + '" role="option" data-i="' + (bi++) +
            '" href="' + esc(e.u) + '">' +
            '<b>' + esc(e.t) + '</b><s>' +
            (e.a ? 'section of ' + esc(e.p) : esc(e.d || e.k)) + '</s></a>';
        });
        list.innerHTML = b || '<div class="yks-smsg">Nothing under ' + esc(activeSub) + ' yet.</div>';
        bind(q); active = 0; paint();
        return;
      }

      var r = recent(), sug = [], n = 0;
      try { if (window.YKSSmart && window.YKSSmart.enabled()) sug = window.YKSSmart.suggestQueries(); } catch (e) {}
      sug = sug.filter(function (x) { return r.indexOf(x) === -1; });
      var row = function (s) {
        return '<a class="yks-sr" data-i="' + (n++) + '" data-recent="' + esc(s) + '" href="#"><b>' + esc(s) + '</b></a>';
      };
      var start = r.length || sug.length ? '' : ['ad film production', 'product photography', 'photographer in Dubai', 'become a model'];
      list.innerHTML = (sug.length ? '<div class="yks-sgrp">Suggested for you</div>' + sug.map(row).join('') : '') +
        (r.length ? '<div class="yks-sgrp">Recent</div>' + r.map(row).join('') : '') +
        (start ? '<div class="yks-smsg">Search the whole site, or pick a subject above.' +
          (aiReady() ? '<br>Ask a real question and Iris answers it.' : '') + '</div>' +
          '<div class="yks-sgrp">Try</div>' + start.map(row).join('') : '');
      bind(q);
      return;
    }

    if (!index) { list.innerHTML = '<div class="yks-smsg">Loading…</div>'; return; }

    var t = terms(q), suggest = '';
    var td = tidy(t);
    if (td.changed) {
      var soft = rank(td.t);
      if (soft.length) { results = soft; corrected = td.t.join(' '); t = td.t; }
    }
    if (!corrected) results = rank(t);

    // few results — would a corrected spelling find more? offer it, don't force it
    if (!corrected && results.length && results.length < 3) {
      var alt2 = t.map(function (w) { return w.length >= 5 ? (fix(w) || w) : w; });
      if (alt2.join(' ') !== t.join(' ') && rank(alt2).length > results.length) suggest = alt2.join(' ');
    }

    // nothing matched — try correcting each term once
    if (!results.length) {
      var fixed = t.map(function (w) { return fix(w) || w; });
      if (fixed.join(' ') !== t.join(' ')) {
        var alt = rank(fixed);
        if (alt.length) { results = alt; corrected = fixed.join(' '); t = fixed; }
      }
    }
    // still nothing on a long query ("model banna hai delhi") — accept pages
    // that miss just one of the words, best overall match first
    var nearMode = false;
    if (!results.length && t.length >= 3) {
      nearMode = true;
      var it2 = intentNow(), near = [];
      t.forEach(function (skip, k) {
        var sub = t.filter(function (_, m) { return m !== k; });
        index.filter(inFilter).forEach(function (e) {
          var s = score(e, sub);
          if (s) near.push({ e: e, s: s + boost(e, it2) });
        });
      });
      var seenU = {};
      results = near.sort(function (a, b) { return b.s - a.s; })
        .filter(function (r) { var id = r.e.u + '#' + (r.e.a || ''); if (seenU[id]) return false; seenU[id] = 1; return true; })
        .map(function (r) { return r.e; });
    }

    // Relevance decides WHICH pages make the cut; section priority decides the
    // order they're shown in — so the portfolio is never buried under blog posts
    // and service pages for a query about work he actually shot.
    results = results.slice(0, 24);
    if (!nearMode) results.sort(function (a, b) { return catRank(a.c) - catRank(b.c); });

    var ai = aiReady();
    var key = q.toLowerCase().trim();
    var hasAnswer = !!answers[key] || pending;
    var aiFirst = ai && (isQuestion(q) || !results.length || hasAnswer);
    var out = '', i = 0;

    if (hasAnswer) out += '<div class="yks-sgrp">Answer</div>' + answerCard(q);
    else if (aiFirst) out += '<div class="yks-sgrp">Ask</div>' + aiRow(q, i++);

    if (corrected) {
      out += '<div class="yks-sfix">Showing results for <b>' + esc(corrected) + '</b> — ' +
        '<button type="button" data-exact="1">search ' + esc(q) + ' instead</button></div>';
    } else if (suggest) {
      out += '<div class="yks-sfix">Did you mean <button type="button" data-dym="' + esc(suggest) + '">' +
        esc(suggest) + '</button>?</div>';
    }

    var group = '';
    results.forEach(function (e) {
      if (e.c !== group) { group = e.c; out += '<div class="yks-sgrp">' + esc(group) + '</div>'; }
      out += '<a class="yks-sr' + (e.a ? ' yks-anch' : '') + '" role="option" data-i="' + (i++) +
        '" href="' + esc(e.u) + '">' +
        '<b>' + hl(e.t, t) + '</b><s>' +
        (e.a ? 'section of ' + esc(e.p) : hl(e.d || e.k, t)) + '</s></a>';
    });

    if (ai && !aiFirst) out += '<div class="yks-sgrp">Ask</div>' + aiRow(q, i++);
    if (!results.length && !hasAnswer) {
      out += '<div class="yks-smsg">No ' + (activeSub ? esc(activeSub).toLowerCase() + ' ' : '') +
        'page matches “' + esc(q) + '”' +
        (activeSub ? ' — <button type="button" data-clearsub="1" style="background:none;border:0;' +
          'color:#ff8c3b;cursor:pointer;font:inherit">search everything</button>' : '') +
        (ai ? '<br>Iris can still answer.' : '') + '</div>';
    }

    list.innerHTML = out;
    lastQuery = q;
    bind(q);
    active = 0;
    paint();
  }

  /* An anchor on the page we're already on won't reload, so the overlay would
     stay up covering the very section it just jumped to. Close, then scroll. */
  function samePage(href) {
    var h = href.indexOf('#');
    if (h < 1) return null;
    var path = href.slice(0, h), id = href.slice(h + 1);
    var here = location.pathname;
    if (path === here || (path === '/index.html' && (here === '/' || here === '/index.html'))) return id;
    return null;
  }

  function bind(q) {
    rows = Array.prototype.slice.call(list.querySelectorAll('[data-i]'));
    rows.forEach(function (el) {
      el.addEventListener('mouseenter', function () { active = +el.dataset.i; paint(); });
      if (el.dataset.ai) el.addEventListener('click', function (ev) { ev.preventDefault(); go(q); });
      if (el.dataset.recent) el.addEventListener('click', function (ev) {
        ev.preventDefault(); input.value = el.dataset.recent; render(input.value);
      });
      var id = !el.dataset.ai && !el.dataset.recent && samePage(el.getAttribute('href') || '');
      if (id) el.addEventListener('click', function (ev) { ev.preventDefault(); jump(id, q); });
    });
    var dym = list.querySelector('[data-dym]');
    if (dym) dym.addEventListener('click', function () { input.value = dym.dataset.dym; render(input.value); input.focus(); });
    var ex = list.querySelector('[data-exact]');
    if (ex) ex.addEventListener('click', function () { corrected = ''; askAI(q); });
    var cs = list.querySelector('[data-clearsub]');
    if (cs) cs.addEventListener('click', function () {
      activeSub = ''; drawChips(); render(input.value); input.focus();
    });
    Array.prototype.forEach.call(list.querySelectorAll('[data-fu]'), function (b) {
      b.addEventListener('click', function () {
        input.value = b.dataset.fu; render(input.value); askAI(b.dataset.fu);
      });
    });
  }

  function go(q) { recent(q); askAI(q); }

  function jump(id, q) {
    if (q) recent(q);
    close();
    setTimeout(function () {
      var el = document.getElementById(id);
      if (!el) { location.hash = id; return; }
      // Lenis owns the scroll on the homepage — go through it or the two fight
      if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(el, { offset: -70 });
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + id); } catch (e) {}
    }, 230);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      var pick = rows[active] || rows[0];
      // a question with no row selected still deserves an answer
      if (!pick && aiReady() && input.value.trim()) { go(input.value.trim()); return; }
      if (!pick) return;
      if (pick.dataset.ai) go(lastQuery);
      else if (pick.dataset.recent) { input.value = pick.dataset.recent; render(input.value); }
      else {
        var href = pick.getAttribute('href'), id = samePage(href || '');
        if (id) jump(id, lastQuery);
        else { recent(lastQuery); location.href = href; }
      }
      return;
    }
    if (!rows.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % rows.length; paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + rows.length) % rows.length; paint(); }
  }

  /* ---------- open / close ---------- */
  function open(seed) {
    if (!input) mount();
    lastFocus = document.activeElement;
    clearTimeout(closeT);
    ov.classList.add('on');
    requestAnimationFrame(function () { ov.classList.add('in'); });
    // rAF throttles in background tabs; without this the overlay can sit
    // invisible while still swallowing clicks
    setTimeout(function () { if (ov.classList.contains('on')) ov.classList.add('in'); }, 60);
    document.documentElement.style.overflow = 'hidden';
    input.value = seed || '';
    render(input.value);
    input.focus();
    load().then(function (ok) {
      if (!ok) { list.innerHTML = '<div class="yks-smsg">Search is unavailable right now.</div>'; return; }
      drawChips();
      if (ov.classList.contains('on')) render(input.value);
    });
  }

  var closeT;
  function close() {
    ov.classList.remove('in');
    document.documentElement.style.overflow = '';
    clearTimeout(closeT);
    closeT = setTimeout(function () { ov.classList.remove('on'); }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- trigger ---------- */
  function button() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'yks-sbtn';
    b.setAttribute('aria-label', 'Search this site');
    b.innerHTML = ICON + '<span>Search</span><i>/</i>';
    b.addEventListener('click', function () { open(); });
    return b;
  }

  function attach() {
    /* The rail (js/landing.js) carries search on every page that has it, so
       the nav copy would be a second, worse trigger — on a phone it collapsed
       to a bare unlabelled magnifier. Only fall back to the nav where no rail
       exists, so those pages keep a way in. */
    if (!document.querySelector('.yks-rail')) {
      var links = document.querySelector('.nav .links');         // homepage shell
      if (links && !links.querySelector('.yks-sbtn')) {
        links.insertBefore(button(), links.querySelector('.nav-panel-cta') || null);
      }
      var lnav = document.querySelector('.l-nav');               // landing-page shell
      if (lnav && !lnav.querySelector('.yks-sbtn')) {
        lnav.insertBefore(button(), lnav.querySelector('.l-back') || null);
      }
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-search-open]'), function (el) {
      el.addEventListener('click', function (ev) { ev.preventDefault(); open(el.dataset.searchOpen); });
    });
  }

  addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open(); return; }
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
  });

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', attach);
  else attach();

  window.yksSearch = { open: open, close: close, ask: function (q) { open(q); askAI(q); } };
})();
