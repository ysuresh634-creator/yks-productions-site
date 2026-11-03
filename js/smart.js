/* ═══════════════════════════════════════════════════════════════
   YKS SMART — on-device visitor understanding + personalisation
   ───────────────────────────────────────────────────────────────
   Reads what a visitor does on THIS site, on THIS device, and uses it
   to put the right page in front of them — the way a good shop
   remembers what you were looking at. Nothing leaves the browser:
   no network calls, no cookies, no vendor, no personal details.

   What it learns (localStorage key `yks_smart_v1`, ~2 KB):
     · interest scores per service bucket (ad film, product, ...)
     · audience: brand / talent applicant / brand casting talent
     · market + city: from pages and searches, else timezone/language
     · the last few pages viewed, searches typed, and a short event log
   Signals: pages viewed, active time, scroll depth, internal clicks,
   site-search terms (from search.js), UTM tags + landing page
   (source.js), the enquiry classifier verdict (landing.js).

   What visitors see (only once there is something to go on):
     · homepage hero CTAs tuned to intent
     · "Picked for you" / "You may also like" + "Recently viewed"
     · a small sticky CTA tuned to intent
   First visit, crawlers, Do Not Track / Global Privacy Control,
   or "Turn off" → the page exactly as published. No cloaking.

   Hook for other scripts (e.g. the chat widget):
     window.YKSSmart.intent()  → { audience, service, label, market,
                                   city, confidence, recent:[paths] }
     window.addEventListener('yks:intent', e => e.detail)  // same shape
     localStorage 'yks_smart_v1' → .intent holds the same summary
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.YKSSmart) return;

  var KEY = 'yks_smart_v1', OFF = 'yks_smart_off', DAY = 864e5, HALF_LIFE = 21;
  var path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/';
  if (path.length > 1) path = path.replace(/\/$/, '') || '/';
  var isHome = path === '/' ;

  /* ---------- privacy gates ---------- */
  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1' ||
    navigator.globalPrivacyControl === true;
  var bot = /bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent || '');
  var ls = null;
  try { var k = '__yks_p'; localStorage.setItem(k, '1'); localStorage.removeItem(k); ls = localStorage; } catch (e) {}
  try {
    var qp = new URLSearchParams(location.search).get('personalise');
    if (ls && qp === 'off') { ls.setItem(OFF, '1'); ls.removeItem(KEY); }
    if (ls && qp === 'on') ls.removeItem(OFF);
  } catch (e) {}
  var off = !ls || dnt || bot || (ls && ls.getItem(OFF) === '1');

  /* ---------- vocabulary ---------- */
  var LABEL = {
    adfilm: 'ad and brand films', product: 'product photography', corporate: 'corporate video',
    events: 'event coverage', realestate: 'real estate films', fashion: 'fashion shoots',
    wedding: 'weddings', reels: 'reels and social content', hospitality: 'hotel and food shoots',
    portrait: 'portraits and headshots', marketing: 'brand marketing',
    talent: 'YKS Talents', cast: 'casting talent for a shoot'
  };
  var SHORT = {
    adfilm: 'ad film', product: 'product shoot', corporate: 'corporate video', events: 'event shoot',
    realestate: 'property film', fashion: 'fashion shoot', wedding: 'wedding', reels: 'reels shoot',
    hospitality: 'hotel or food shoot', portrait: 'portrait shoot', marketing: 'brand project', cast: 'casting'
  };
  var CITY = {
    mumbai: 'Mumbai', delhi: 'Delhi NCR', bangalore: 'Bangalore', hyderabad: 'Hyderabad', chennai: 'Chennai',
    pune: 'Pune', kolkata: 'Kolkata', ahmedabad: 'Ahmedabad', jaipur: 'Jaipur', chandigarh: 'Chandigarh',
    goa: 'Goa', dubai: 'Dubai', 'abu-dhabi': 'Abu Dhabi', sharjah: 'Sharjah'
  };
  var UAE_CITIES = { dubai: 1, 'abu-dhabi': 1, sharjah: 1 };

  /* page path → interest. First match per rule; several rules can add. */
  var PAGE_RULES = [
    [/ad-film|production-house|brand-film/, { adfilm: 3, corporate: 0.5 }],
    [/video-production|videographer/, { adfilm: 1.5, corporate: 1.5, events: 0.5 }],
    [/product-photography/, { product: 3 }],
    [/^\/photography$/, { product: 1.2, events: 0.8, hospitality: 0.8 }],
    [/corporate|headshot|linkedin-headshots/, { corporate: 3 }],
    [/event-photographer|\/nights/, { events: 3 }],
    [/real-estate/, { realestate: 3 }],
    [/fashion/, { fashion: 3 }],
    [/wedding|maternity/, { wedding: 3 }],
    [/reels-production|content-creat|social-media-marketing/, { reels: 3 }],
    [/food-photographer|hotel-photographer|\/marriott/, { hospitality: 3 }],
    [/portrait/, { portrait: 2.5 }],
    [/\/films$/, { adfilm: 1 }],
    [/^\/(marketing|brand-strategy|performance-marketing|linkedin-marketing)$/, { marketing: 3 }],
    [/^\/talents\/apply/, { talent: 7 }],
    [/^\/talents\/guides\/how-to-cast/, { cast: 3 }],
    [/^\/talents\/guides\/(?!how-to-cast)/, { talent: 3 }],
    [/model-mentoring/, { talent: 3 }],
    [/^\/talents\/id\//, { cast: 1.2, talent: 0.8 }],
    [/^\/talents(\/|$)/, { talent: 1.5, cast: 1 }],
    [/find-models|models-in-|casting/, { cast: 3 }],
    [/^\/quote$/, { _brand: 3 }]
  ];

  /* words (search terms, UTM tags, form text) → interest.
     English, Hinglish and romanised Malayalam/Tamil slang. */
  var WORD_RULES = [
    [/\b(model\s*(banna|banana|banni|bane|banu|aakan\w*|aagan\w*|aagan)|become\s+(a\s+)?(model|actor|actress)|modell?ing\s+(career|kaise|portfolio)|portfolio\s+(kaise|for\s+me|banaye|banana)|acting\s+(chance|career|role)|actor\s+ban\w*|heroine\s+ban\w*|nadikk?an|chance\s+(venam|venum|chahiye|do)|kaam\s+chahiye|audition|apply|register|registration|join\s+(yks\s+)?talents?|free\s+portfolio|my\s+portfolio|aspiring|fresher)\b/, { talent: 4 }],
    [/\b(find|book|hire|need|cast|casting)\s+(a\s+)?(models?|talents?|actors?|influencers?|faces?)\b|\bmodels?\s+for\s+(my|our|a)\b|\bmodels?\s+(in|from)\s+\w+/, { cast: 3.5 }],
    [/\b(ad\s*(film|video|shoot)s?|tvc|commercials?|brand\s*(film|video)s?|advert\w*|ads?\s+shoot|promo(tional)?\s+video|launch\s+(film|video))\b/, { adfilm: 3 }],
    [/\b(product|e-?com\w*|catalog\w*|packshot|amazon|flipkart|myntra|meesho|white\s*background|jewell?e?ry|cosmetics?)\b/, { product: 3 }],
    [/\b(corporate|company\s+(video|profile)|testimonial|headshots?|linkedin|conference|office)\b/, { corporate: 3 }],
    [/\b(events?|launch\s+event|gala|party|parties|nightlife|club|concert|exhibition)\b/, { events: 3 }],
    [/\b(real\s*estate|property|properties|villa|apartment|tower|developer|broker|interiors?)\b/, { realestate: 3 }],
    [/\b(fashion|lookbook|editorial|designer|apparel|clothing|boutique)\b/, { fashion: 3 }],
    [/\b(wedding|shaadi|shadi|kalyanam|engagement|pre-?wedding|maternity|baby\s*shoot)\b/, { wedding: 3 }],
    [/\b(reels?|shorts|ugc|instagram|insta|youtube|social\s*media|content\s*creat\w*|influencer\s+content)\b/, { reels: 3 }],
    [/\b(food|restaurant|cafe|menu|hotel|resort|hospitality|zomato|swiggy|talabat)\b/, { hospitality: 3 }],
    [/\b(portrait|portfolio\s+shoot|personal\s+brand\w*|actor\s+portfolio)\b/, { portrait: 2 }],
    [/\b(marketing|strategy|meta\s+ads|google\s+ads|performance|branding)\b/, { marketing: 2 }]
  ];
  var CITY_WORDS = /\b(mumbai|bombay|delhi|ncr|gurgaon|gurugram|noida|bangalore|bengaluru|hyderabad|chennai|madras|pune|kolkata|calcutta|ahmedabad|jaipur|chandigarh|goa|dubai|abu\s*dhabi|sharjah|uae)\b/;
  var CITY_ALIAS = { bombay: 'mumbai', ncr: 'delhi', gurgaon: 'delhi', gurugram: 'delhi', noida: 'delhi',
    bengaluru: 'bangalore', madras: 'chennai', calcutta: 'kolkata', uae: 'dubai' };

  /* ---------- catalogue: pages worth recommending ----------
     Only real pages, only photos already on the site. */
  var IMG = {
    film: '/assets/posters/marriott-film.webp', product: '/assets/navthumbs/nav-marriott-800.webp',
    estate: '/assets/craft/realestate-800.webp', fashion: '/assets/navthumbs/nav-fashion-800.webp',
    wedding: '/assets/craft/weddings-800.webp', portrait: '/assets/craft/portfolios-800.webp',
    nights: '/assets/navthumbs/nav-nights-800.webp', dubai: '/assets/navthumbs/nav-dubai-800.webp',
    india: '/assets/craft/india-market-800.webp', reel: '/assets/posters/reel-topreel.webp',
    stills: '/assets/craft/films-800.webp'
  };
  var CAT = [
    ['/ad-film-production.html', 'Ad & brand films', 'Concept, casting, shoot and edit by one director', 'film', { adfilm: 3, corporate: 1 }],
    ['/product-photography.html', 'Product & e-commerce photography', 'Marketplace-ready and catalogue shoots', 'product', { product: 3, fashion: 0.5 }],
    ['/video-production.html', 'Video production', 'Brand, commercial and corporate video', 'film', { corporate: 2, adfilm: 2, events: 0.5 }],
    ['/reels-production.html', 'Reels for brands', 'Batch shoot days for Reels and Shorts', 'reel', { reels: 3, adfilm: 0.5 }],
    ['/content-creation.html', 'Content creator for brands', 'Reels, UGC, YouTube and photos', 'reel', { reels: 2.5, marketing: 0.5 }],
    ['/photography.html', 'Photography for brands', 'Product, food, events, fashion and more', 'product', { product: 1.5, events: 1, hospitality: 1 }],
    ['/real-estate.html', 'Real estate films', 'Cinematic property films across Dubai', 'estate', { realestate: 3 }, 'uae'],
    ['/fashion.html', 'Fashion & editorial', 'Lookbooks, designer collaborations, editorials', 'fashion', { fashion: 3, portrait: 0.5 }],
    ['/weddings.html', 'Weddings', 'Engagement films, ceremonies and couple portraits', 'wedding', { wedding: 3 }],
    ['/portraits.html', 'Portraits & portfolios', 'Actor and model portfolios, personal branding', 'portrait', { portrait: 3, talent: 0.6 }],
    ['/nights.html', 'Party & nightlife', 'Clubs, brand launches and after-dark events', 'nights', { events: 2.5 }],
    ['/marriott.html', 'Brand campaigns', 'Marriott, Ranger Apparels, Evantha and more', 'film', { hospitality: 2, adfilm: 1.5, corporate: 1 }],
    ['/films.html', 'Film stills & BTS', 'On-set stills and making-of for feature films', 'stills', { adfilm: 1 }],
    ['/production-house-india.html', 'Independent production house · India', 'Brand films, ad films, product shoots and reels', 'india', { adfilm: 2, corporate: 1, product: 1 }, 'india'],
    ['/dubai/', 'Dubai & the UAE', 'Property, brand video, food and social content', 'dubai', { realestate: 1, hospitality: 1 }, 'uae'],
    ['/india/', 'Bangalore & India', 'Fashion, brand and film work across India', 'india', { fashion: 1, adfilm: 1 }, 'india'],
    ['/marketing.html', 'Marketing consultant', 'Strategy, content and ads for brands', 'reel', { marketing: 3 }],
    ['/find-models.html', 'Find models & talent', 'Browse portfolios on YKS Talents for your shoot', 'portrait', { cast: 3.5, adfilm: 0.6, fashion: 0.6, product: 0.4 }, '', 'brand'],
    ['/talents/guides/how-to-cast-models-for-a-brand-shoot.html', 'How to cast models for a brand shoot', 'Brief, faces, models vs creators', 'portrait', { cast: 2.5 }, '', 'brand'],
    ['/talents/apply.html', 'Apply to YKS Talents · free', 'A free portfolio that brands can find', 'portrait', { talent: 4 }, '', 'talent'],
    ['/talents.html', 'YKS Talents', 'Models, influencers, creators and actors · 100% free', 'portrait', { talent: 2.5, cast: 1.5 }],
    ['/talents/guides/how-to-become-a-model-in-india.html', 'How to become a model in India', 'Step-by-step, with no experience', 'portrait', { talent: 3 }, 'india', 'talent'],
    ['/talents/guides/how-to-make-a-modelling-portfolio.html', 'How to make a modelling portfolio', 'Which shots, digitals vs editorial, comp cards', 'portrait', { talent: 2.8 }, '', 'talent'],
    ['/talents/guides/modelling-agency-fees-scams-india.html', 'Modelling fees & scams: red flags', 'How to verify a casting call', 'portrait', { talent: 2.5 }, 'india', 'talent'],
    ['/talents/guides/modelling-portfolio-kaise-banaye.html', 'Modelling portfolio kaise banaye?', 'Free guide in Hindi', 'portrait', { talent: 2.4 }, 'india', 'talent'],
    ['/model-mentoring-india.html', 'Model mentoring', 'Portfolio, castings, walk and pageant prep', 'portrait', { talent: 2.2 }, 'india', 'talent'],
    ['/quote.html', 'Get a quote in 60 seconds', 'A few quick questions, one all-in number', 'film', { _brand: 1 }, '', 'brand']
  ];

  /* city landing pages that exist (never Kochi, never the marketing-agency set) */
  var CITY_PAGES = {
    'production-house': 'mumbai delhi bangalore hyderabad chennai pune dubai',
    'photographer': 'mumbai delhi bangalore hyderabad chennai pune kolkata goa dubai abu-dhabi',
    'videographer': 'mumbai delhi bangalore dubai abu-dhabi',
    'corporate-video': 'bangalore dubai', 'event-photographer': 'bangalore dubai',
    'fashion-photographer': 'bangalore dubai', 'hotel-photographer': 'bangalore dubai',
    'food-photographer': 'dubai', 'portrait-photographer': 'bangalore dubai',
    'real-estate-videographer': 'bangalore dubai', 'real-estate-photographer': 'bangalore dubai abu-dhabi',
    'wedding-photographer': 'bangalore dubai abu-dhabi', 'wedding-videographer': 'dubai',
    'content-creator': 'bangalore dubai', 'social-media-marketing': 'bangalore dubai',
    'corporate-headshots': 'dubai',
    'models-in': 'mumbai delhi bangalore hyderabad chennai pune kolkata ahmedabad jaipur chandigarh dubai'
  };
  var CITY_PREF = {
    adfilm: ['production-house', 'videographer'], corporate: ['corporate-video', 'corporate-headshots', 'production-house', 'videographer'],
    product: ['photographer', 'production-house'], events: ['event-photographer', 'photographer'],
    realestate: ['real-estate-videographer', 'real-estate-photographer'], fashion: ['fashion-photographer', 'photographer'],
    wedding: ['wedding-photographer', 'wedding-videographer'], reels: ['content-creator', 'social-media-marketing', 'production-house'],
    hospitality: ['hotel-photographer', 'food-photographer', 'photographer'], portrait: ['portrait-photographer', 'photographer'],
    marketing: ['social-media-marketing', 'content-creator'], cast: ['models-in'],
    _any: ['production-house', 'photographer', 'videographer']
  };
  var PREFIX_LABEL = {
    'production-house': 'Production house in', photographer: 'Photographer in', videographer: 'Videographer in',
    'corporate-video': 'Corporate video in', 'event-photographer': 'Event photographer in',
    'fashion-photographer': 'Fashion photographer in', 'hotel-photographer': 'Hotel photographer in',
    'food-photographer': 'Food photographer in', 'portrait-photographer': 'Portrait photographer in',
    'real-estate-videographer': 'Real estate videographer in', 'real-estate-photographer': 'Real estate photographer in',
    'wedding-photographer': 'Wedding photographer in', 'wedding-videographer': 'Wedding videographer in',
    'content-creator': 'Content creator in', 'social-media-marketing': 'Social media content in',
    'corporate-headshots': 'Corporate headshots in', 'models-in': 'Models & talent in'
  };
  function cityPage(city, bucket) {
    var prefs = (CITY_PREF[bucket] || []).concat(CITY_PREF._any);
    for (var i = 0; i < prefs.length; i++) {
      var list = ' ' + (CITY_PAGES[prefs[i]] || '') + ' ';
      if (list.indexOf(' ' + city + ' ') > -1) {
        var u = '/' + prefs[i] + (prefs[i] === 'models-in' ? '-' : '-') + city + '.html';
        return [u, PREFIX_LABEL[prefs[i]] + ' ' + CITY[city], bucket === 'cast' ? 'Cast for your shoot' : 'Shoots in and around ' + CITY[city],
          UAE_CITIES[city] ? 'dubai' : (IMG_FOR[bucket] || 'india'), {}, UAE_CITIES[city] ? 'uae' : 'india', bucket === 'cast' ? 'brand' : ''];
      }
    }
    return null;
  }
  var IMG_FOR = { adfilm: 'film', corporate: 'film', product: 'product', events: 'nights', realestate: 'estate', fashion: 'fashion',
    wedding: 'wedding', reels: 'reel', hospitality: 'product', portrait: 'portrait', marketing: 'reel', cast: 'portrait' };

  /* ---------- profile ---------- */
  function blank() {
    return { v: 1, first: Date.now(), last: Date.now(), visits: 0, s: {}, cities: {}, pages: [], q: [], ev: [], src: null, cls: null };
  }
  function load() {
    if (off) return blank();
    try { var p = JSON.parse(ls.getItem(KEY) || 'null'); if (p && p.v === 1) return p; } catch (e) {}
    return blank();
  }
  var P = load();
  function save() {
    if (off) return;
    P.intent = intent();
    try { ls.setItem(KEY, JSON.stringify(P)); } catch (e) {}
  }

  /* decay so last month's wedding browsing does not drive today's page */
  (function decay() {
    var days = (Date.now() - (P.last || Date.now())) / DAY;
    if (days > 0.5) {
      var f = Math.pow(0.5, days / HALF_LIFE);
      Object.keys(P.s).forEach(function (k) { P.s[k] = +(P.s[k] * f).toFixed(3); if (P.s[k] < 0.05) delete P.s[k]; });
      Object.keys(P.cities).forEach(function (k) { P.cities[k] = +(P.cities[k] * f).toFixed(3); if (P.cities[k] < 0.05) delete P.cities[k]; });
    }
    if (days > 0.02 || !P.visits) P.visits = (P.visits || 0) + (days > 0.02 || !P.visits ? 1 : 0);
  })();

  function add(map, w) {
    Object.keys(map).forEach(function (k) { P.s[k] = +((P.s[k] || 0) + map[k] * w).toFixed(3); });
  }
  function addCity(c, w) { if (CITY[c]) P.cities[c] = +((P.cities[c] || 0) + w).toFixed(3); }
  function log(k, v) {
    P.ev.push([Math.round(Date.now() / 1000), k, String(v || '').slice(0, 60)]);
    if (P.ev.length > 60) P.ev = P.ev.slice(-60);
  }

  function pageSignals(p) {
    var out = {};
    PAGE_RULES.forEach(function (r) {
      if (r[0].test(p)) Object.keys(r[1]).forEach(function (k) { out[k] = Math.max(out[k] || 0, r[1][k]); });
    });
    return out;
  }
  function pageCity(p) {
    var m = p.match(/(?:-|\/)(mumbai|delhi|bangalore|hyderabad|chennai|pune|kolkata|ahmedabad|jaipur|chandigarh|goa|dubai|abu-dhabi|sharjah)(?:\/|$|-)/);
    return m ? m[1] : (/^\/dubai/.test(p) ? 'dubai' : null);
  }
  function textSignals(text) {
    var t = String(text || '').toLowerCase(), out = {}, any = false;
    WORD_RULES.forEach(function (r) {
      if (r[0].test(t)) { any = true; Object.keys(r[1]).forEach(function (k) { out[k] = Math.max(out[k] || 0, r[1][k]); }); }
    });
    var c = t.match(CITY_WORDS);
    var city = c ? (CITY_ALIAS[c[1].replace(/\s+/g, '')] || c[1].replace(/\s+/g, '-')) : null;
    return { s: out, city: city, any: any };
  }
  /* no personal data: drop anything that looks like an email, phone or URL */
  function clean(q) {
    q = String(q || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!q || q.length > 80 || /@|https?:|www\.|\d{5,}/.test(q)) return '';
    return q;
  }

  /* ---------- region ---------- */
  function region() {
    var tz = '', lang = (navigator.language || '').toLowerCase();
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var market = /Kolkata|Calcutta/.test(tz) ? 'india'
      : /Dubai|Muscat|Riyadh|Qatar|Bahrain|Kuwait|Aden/.test(tz) || /^ar\b/.test(lang) ? 'uae'
      : 'intl';
    return { tz: tz, lang: lang, market: market };
  }

  /* ---------- device / visit context (js/contact.js) ---------- */
  function ctx() {
    try { if (window.YKS && YKS.context) return YKS.context(); } catch (e) {}
    var h = new Date().getHours();
    return { device: (innerWidth || 1200) < 700 ? 'mobile' : 'desktop', os: 'other', net: { slow: false },
      hour: h, daypart: h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night',
      from: 'direct', returning: (P && P.visits > 1), reducedMotion: false };
  }
  function greet() {
    var c = ctx(), g = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' }[c.daypart] || 'Hello';
    return g + (c.returning || (P.visits || 1) > 1 ? ', welcome back' : '');
  }

  /* ---------- intent ---------- */
  var SERVICES = ['adfilm', 'product', 'corporate', 'events', 'realestate', 'fashion', 'wedding', 'reels', 'hospitality', 'portrait', 'marketing'];
  function intent() {
    var s = P.s || {}, best = null, bv = 0, brand = (s._brand || 0) + (s.cast || 0);
    SERVICES.forEach(function (k) { brand += s[k] || 0; if ((s[k] || 0) > bv) { bv = s[k]; best = k; } });
    var tal = s.talent || 0, cast = s.cast || 0, audience = null;
    if (tal >= 3 && tal > brand * 0.8) audience = 'talent';
    else if (cast >= 3 && cast >= bv) audience = 'cast';
    else if (brand >= 3) audience = 'brand';
    var city = null, cv = 0;
    Object.keys(P.cities || {}).forEach(function (c) { if (P.cities[c] > cv) { cv = P.cities[c]; city = c; } });
    if (cv < 1) city = null;
    var reg = region();
    var market = city ? (UAE_CITIES[city] ? 'uae' : 'india') : reg.market;
    var service = audience === 'talent' ? 'talent' : audience === 'cast' ? 'cast' : (bv >= 2 ? best : null);
    var total = brand + tal;
    return {
      audience: audience,
      service: service,
      label: service ? LABEL[service] : null,
      market: market,
      region: reg.market,
      city: city,
      cityName: city ? CITY[city] : null,
      confidence: +Math.min(1, total / 12).toFixed(2),
      recent: (P.pages || []).slice(0, 5).map(function (x) { return x.p; }),
      visits: P.visits || 1
    };
  }

  /* ---------- this page view ---------- */
  var viewBase = pageSignals(path);
  var hereCity = pageCity(path);
  var startCity = JSON.stringify(P.cities);
  if (!off) {
    add(viewBase, 1);
    if (hereCity) addCity(hereCity, 1.5);
    log('view', path);
    try {
      if (!sessionStorage.getItem('yks_from')) { var cf = ctx(); sessionStorage.setItem('yks_from', cf.from); log('from', cf.from + ' ' + cf.device); P.from = cf.from; }
    } catch (e) {}

    // first-touch context — UTM tags and the landing page (source.js)
    try {
      var sp = new URLSearchParams(location.search);
      var utm = ['utm_campaign', 'utm_term', 'utm_content', 'q'].map(function (k) { return sp.get(k) || ''; }).join(' ').replace(/[_+-]/g, ' ');
      if (utm.trim()) {
        var ts = textSignals(utm);
        add(ts.s, 1.2); if (ts.city) addCity(ts.city, 2); log('utm', clean(utm));
      }
      if (!P.src) {
        var src = JSON.parse(ls.getItem('yks_src_v1') || 'null');
        if (src && src.src) P.src = { src: String(src.src).slice(0, 40), land: String(src.land || '').slice(0, 60) };
      }
    } catch (e) {}

    // recently viewed — own pages only, never utility pages or individual profiles
    var title = (document.title || '').split(/\s[|·]\s|\s—\s/)[0].replace(/&amp;/g, '&').trim().slice(0, 70);
    if (!/^\/(quote|faq|edit|apply|404|links)|agreement|^\/talents\/(apply|id\/)|^\/$/.test(path) && title) {
      P.pages = (P.pages || []).filter(function (x) { return x.p !== path; });
      P.pages.unshift({ p: path, t: title, ts: Math.round(Date.now() / 1000) });
      P.pages = P.pages.slice(0, 12);
    }
    P.last = Date.now();
    save();
  }
  var startIntent = intent();

  /* engagement: active time + scroll depth add weight on leave */
  var active = 0, tick = Date.now(), maxScroll = 0, flushed = false;
  function onVis() {
    if (document.visibilityState === 'hidden') { active += Date.now() - tick; flush(); }
    else { tick = Date.now(); flushed = false; }
  }
  function onScroll() {
    var h = document.documentElement, d = (h.scrollHeight - innerHeight) || 1;
    var f = Math.min(1, (scrollY || h.scrollTop) / d);
    if (f > maxScroll) maxScroll = f;
  }
  function flush() {
    if (off || flushed) return; flushed = true;
    var sec = active / 1000;
    var extra = Math.min(sec / 45, 1.5) + maxScroll * 0.8;     // 0 … 2.3
    if (extra > 0.15) { add(viewBase, extra); if (hereCity) addCity(hereCity, extra * 0.5); }
    log('dwell', path + ' ' + Math.round(sec) + 's ' + Math.round(maxScroll * 100) + '%');
    save();
  }
  /* live engagement for this page: active seconds, deepest scroll, 0-1 score */
  function engagement() {
    var sec = (active + (document.visibilityState === 'hidden' ? 0 : Date.now() - tick)) / 1000;
    return { sec: Math.round(sec), depth: +maxScroll.toFixed(2), score: +Math.min(1, Math.min(sec / 60, 1) * 0.5 + maxScroll * 0.5).toFixed(2) };
  }
  var contacted = false;
  if (!off) {
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    addEventListener('pagehide', function () { if (document.visibilityState !== 'hidden') active += Date.now() - tick; flush(); });

    // clicks: internal links hint at the next interest; contact taps are intent
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (/wa\.me|whatsapp|^tel:/.test(href)) { contacted = true; add({ _brand: 1 }, 1); log('contact', path); save(); return; }
      if (/quote|talents\/apply|find-models/.test(href)) contacted = true;
      try {
        var u = new URL(href, location.href);
        if (u.origin !== location.origin) return;
        var p2 = u.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
        add(pageSignals(p2), 0.5);
        var c2 = pageCity(p2); if (c2) addCity(c2, 0.5);
        log('click', p2 + (a.hasAttribute('data-yks-rec') ? ' rec' : ''));
        save();
      } catch (err) {}
    }, true);

    // site search (search.js dispatches this)
    addEventListener('yks:search', function (e) {
      var q = clean(e.detail && e.detail.q);
      if (!q) return;
      var ts = textSignals(q);
      add(ts.s, 1); if (ts.city) addCity(ts.city, 1.5);
      P.q = (P.q || []).filter(function (x) { return x !== q; }); P.q.unshift(q); P.q = P.q.slice(0, 8);
      log('search', q); save(); announce();
    });

    // enquiry classifier verdict (landing.js dispatches this)
    addEventListener('yks:classified', function (e) {
      var d = e.detail || {};
      if (d.category === 'talent' || d.route === 'talent') add({ talent: 6 }, 1);
      else if (d.category === 'client') {
        add({ _brand: 3 }, 1);
        var ts = textSignals(d.service || ''); add(ts.s, 1.5); if (ts.city) addCity(ts.city, 1);
      }
      P.cls = { c: String(d.category || ''), t: Math.round(Date.now() / 1000) };
      log('classified', d.category); save(); announce();
    });
  }

  var lastSent = '';
  function announce() {
    var it = intent(), sig = [it.audience, it.service, it.city, it.market].join('|');
    if (sig === lastSent) return;
    lastSent = sig;
    try { dispatchEvent(new CustomEvent('yks:intent', { detail: it })); } catch (e) {}
  }

  /* ---------- recommendations ---------- */
  function recommend(n, opts) {
    opts = opts || {};
    var it = intent(), s = P.s || {}, seen = {};
    (P.pages || []).forEach(function (x, i) { seen[x.p] = i; });
    var norm = function (u) { return u.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/(.)\/$/, '$1'); };
    var pool = CAT.slice();
    var c = it.city || (it.market === 'uae' ? 'dubai' : null);
    if (c && it.audience !== 'talent') {
      var cp = cityPage(c, it.service || '_any');
      if (cp) pool.unshift(cp);
      if (it.service && it.service !== 'cast' && it.audience !== 'cast') { var cm = cityPage(c, 'cast'); if (cm && (s.cast || 0) > 1) pool.push(cm); }
    }
    var scored = pool.map(function (e, idx) {
      var u = norm(e[0]), sc = 0;
      if (u === path || (u === '/' && isHome)) return null;
      Object.keys(e[4]).forEach(function (k) { sc += (s[k] || 0) * e[4][k]; });
      if (idx === 0 && e[5] && c) sc += 8 + (it.confidence * 10);          // the city page
      if (e[5] && e[5] !== it.market && it.market !== 'intl') sc *= 0.35;  // wrong market
      if (e[6] === 'talent' && it.audience !== 'talent') sc *= it.audience ? 0.1 : 0.5;
      if (e[6] === 'brand' && it.audience === 'talent') sc *= 0.05;
      if (it.audience === 'talent' && e[0] === '/talents/apply.html') sc += 40;
      if (it.audience === 'cast' && e[0] === '/find-models.html') sc += 30;
      if (u in seen) sc *= 0.3 + Math.min(seen[u], 6) * 0.05;               // seen it already
      return sc > 0.5 ? { e: e, s: sc + (pool.length - idx) * 0.01 } : null;
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; });
    var out = [], used = {};
    for (var i = 0; i < scored.length && out.length < n; i++) {
      var u = norm(scored[i].e[0]); if (used[u]) continue; used[u] = 1;
      out.push({ u: scored[i].e[0], t: scored[i].e[1], d: scored[i].e[2], img: IMG[scored[i].e[3]] || IMG.india });
    }
    return out;
  }

  function suggestQueries() {
    var it = intent(), city = it.cityName;
    var map = {
      talent: ['how to become a model', 'free portfolio', 'modelling portfolio kaise banaye', 'model comp card'],
      cast: ['find models' + (city ? ' in ' + city : ''), 'cast models for an ad shoot', 'influencers for a brand shoot'],
      adfilm: ['ad film production', 'brand film' + (city ? ' ' + city : ''), 'reels for brands'],
      product: ['product photography', 'e-commerce catalogue shoot', 'photographer' + (city ? ' ' + city : '')],
      corporate: ['corporate video', 'corporate headshots', 'video production'],
      events: ['event photographer', 'launch event coverage', 'nightlife'],
      realestate: ['real estate video', 'property photography', 'Dubai'],
      fashion: ['fashion photographer', 'lookbook shoot', 'editorial'],
      wedding: ['wedding photographer', 'wedding videographer', 'pre-wedding'],
      reels: ['reels production', 'content creator for brands', 'UGC'],
      hospitality: ['hotel photographer', 'food photographer', 'restaurant shoot'],
      portrait: ['portraits', 'actor portfolio', 'headshots'],
      marketing: ['marketing consultant', 'social media marketing', 'brand strategy']
    };
    return (map[it.service] || []).slice(0, 3);
  }

  var EXTRA_KEYS = ['yks_form_v1', 'yks_seen_v1', 'yks_src_v1'];
  function reset() {
    try { ls && ls.removeItem(KEY); EXTRA_KEYS.forEach(function (k) { ls.removeItem(k); }); sessionStorage.removeItem('yks_exit'); sessionStorage.removeItem('yks_sc_x'); sessionStorage.removeItem('yks_from'); sessionStorage.removeItem('yks_arr'); } catch (e) {}
    P = blank(); announce();
  }
  function setOff(v) {
    try { if (v) { ls.setItem(OFF, '1'); ls.removeItem(KEY); EXTRA_KEYS.forEach(function (k) { ls.removeItem(k); }); } else ls.removeItem(OFF); } catch (e) {}
    off = !!v || dnt || bot || !ls;
  }

  /* ---------- UI ---------- */
  var CSS = [
    '.yks-fy{padding:56px 0 44px;color:#f4ede2;font-family:Inter,system-ui,sans-serif;contain:layout}',
    '.yks-fy-in{max-width:1200px;margin:0 auto;padding:0 clamp(18px,4vw,40px)}',
    '.yks-fy-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px 24px;flex-wrap:wrap;margin-bottom:18px}',
    '.yks-fy-h h2{margin:0;font-size:clamp(1.3rem,2.4vw,1.8rem);font-weight:500;letter-spacing:-.01em;line-height:1.2}',
    '.yks-fy-h p{margin:4px 0 0;font-size:.88rem;color:rgba(244,237,226,.6)}',
    '.yks-fy-k{font-family:"Space Grotesk",ui-monospace,monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#ff8c3b;margin:0 0 8px}',
    '.yks-fy-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}',
    '@media(max-width:900px){.yks-fy-g{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.yks-fy-c{display:block;text-decoration:none;color:inherit;border-radius:12px;overflow:hidden;background:#141019;',
    'border:1px solid rgba(244,237,226,.10);transition:border-color .25s,transform .25s}',
    '.yks-fy-c:hover,.yks-fy-c:focus-visible{border-color:rgba(255,140,59,.6);transform:translateY(-2px)}',
    '.yks-fy-c:focus-visible{outline:2px solid #ff8c3b;outline-offset:2px}',
    '.yks-fy-m{display:block;aspect-ratio:4/3;background:#1d1824;overflow:hidden}',
    '.yks-fy-m img{width:100%;height:100%;object-fit:cover;display:block}',
    '.yks-fy-b{display:block;padding:11px 13px 13px}',
    '.yks-fy-b b{display:block;font-size:.95rem;font-weight:500;line-height:1.3}',
    '.yks-fy-b small{display:block;margin-top:3px;font-size:.78rem;line-height:1.4;color:rgba(244,237,226,.58)}',
    '.yks-fy-r{margin-top:22px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.yks-fy-r span{font-family:"Space Grotesk",ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(244,237,226,.45);margin-right:4px}',
    '.yks-fy-r a{font-size:.8rem;color:rgba(244,237,226,.82);text-decoration:none;border:1px solid rgba(244,237,226,.18);border-radius:30px;padding:6px 12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.yks-fy-r a:hover{border-color:#ff8c3b;color:#ff8c3b}',
    '.yks-fy-n{margin-top:16px;font-size:.74rem;color:rgba(244,237,226,.42);line-height:1.5}',
    '.yks-fy-n button{background:none;border:0;padding:0;font:inherit;color:rgba(255,140,59,.85);cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
    '.yks-fy-n button:hover{color:#ff8c3b}.yks-fy-n a{color:rgba(244,237,226,.6)}',
    /* sticky CTA — bottom left on phones (chat owns bottom right), centred on desktop */
    '.yks-sc{position:fixed;z-index:299;bottom:22px;left:50%;transform:translate(-50%,16px);opacity:0;pointer-events:none;',
    'display:flex;align-items:center;gap:2px;transition:opacity .35s,transform .35s;font-family:Inter,system-ui,sans-serif}',
    '.yks-sc.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}',
    '.yks-sc a{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px 0 0 999px;',
    'background:rgba(12,10,16,.94);border:1px solid rgba(255,140,59,.55);border-right:0;color:#f4ede2;text-decoration:none;font-size:13.5px;',
    'white-space:nowrap;box-shadow:0 10px 28px -12px rgba(0,0,0,.9);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '.yks-sc a b{color:#ff8c3b;font-weight:600;margin-left:6px}',
    '.yks-sc button{min-height:44px;width:36px;border-radius:0 999px 999px 0;border:1px solid rgba(255,140,59,.55);border-left:1px solid rgba(244,237,226,.12);',
    'background:rgba(12,10,16,.94);color:rgba(244,237,226,.6);cursor:pointer;font-size:15px;line-height:1}',
    '.yks-sc a:focus-visible,.yks-sc button:focus-visible{outline:2px solid #ff8c3b;outline-offset:2px}',
    '.yks-sc .yks-scs{display:none}',
    '@media(max-width:640px){.yks-sc{left:14px;bottom:14px;transform:translateY(16px);max-width:calc(100vw - 210px)}',
    '.yks-sc.on{transform:none}.yks-sc a{padding:0 12px;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.yks-sc a b{display:none}.yks-sc .yks-scl{display:none}.yks-sc .yks-scs{display:inline}}',
    '.yks-ex{position:fixed;z-index:300;right:22px;bottom:22px;width:min(380px,calc(100vw - 28px));padding:20px 20px 14px;border-radius:16px;',
    'background:rgba(14,11,18,.97);border:1px solid rgba(255,140,59,.45);color:#f4ede2;font-family:Inter,system-ui,sans-serif;',
    'box-shadow:0 24px 60px -20px rgba(0,0,0,.9);opacity:0;transform:translateY(14px);transition:opacity .3s,transform .3s}',
    '.yks-ex.on{opacity:1;transform:none}',
    '.yks-ex h2{margin:0 0 6px;font-size:1.15rem;font-weight:500;line-height:1.3;padding-right:24px}',
    '.yks-ex p{margin:0 0 10px;font-size:.88rem;line-height:1.5;color:rgba(244,237,226,.78)}',
    '.yks-ex .yks-ex-pr{font-size:.78rem;color:rgba(244,237,226,.55)}',
    '.yks-ex-a{display:flex;flex-direction:column;gap:8px;margin:4px 0 8px}',
    '.yks-ex-p{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:999px;background:#ff8c3b;color:#140f0a;font-weight:600;text-decoration:none;font-size:.92rem}',
    '.yks-ex-g{font-size:.84rem;color:#ff8c3b;text-decoration:underline;text-underline-offset:3px;text-align:center;padding:4px 0}',
    '.yks-ex-w{margin:0!important;text-align:center}.yks-ex-w a{font-size:.72rem;color:rgba(244,237,226,.45)}',
    '.yks-ex-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;background:none;color:rgba(244,237,226,.6);font-size:20px;cursor:pointer;border-radius:50%}',
    '.yks-ex-x:hover{color:#fff}.yks-ex a:focus-visible,.yks-ex-x:focus-visible{outline:2px solid #ff8c3b;outline-offset:2px}',
    '@media(max-width:640px){.yks-ex{right:14px;left:14px;bottom:14px;width:auto}}',
    '@media(prefers-reduced-motion:reduce){.yks-sc,.yks-fy-c,.yks-ex{transition:none}}'
  ].join('');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var cssOn = false;
  function style() { if (cssOn) return; cssOn = true; var st = document.createElement('style'); st.id = 'yks-smart-css'; st.textContent = CSS; document.head.appendChild(st); }

  function reasonLine(it) {
    if (it.audience === 'talent') return 'Because you were looking at YKS Talents. It is 100% free, with no fees ever.';
    if (it.audience === 'cast') return 'Because you were looking for talent' + (it.cityName ? ' in ' + it.cityName : '') + ' for a shoot.';
    if (it.service) return 'Because you looked at ' + it.label + (it.cityName ? ' and ' + it.cityName : '') + '.';
    if (it.cityName) return 'Because you looked at work in ' + it.cityName + '.';
    return 'Based on the pages you opened.';
  }

  function block(kind) {
    var it = intent(), recs = recommend(4);
    if (recs.length < 2) return null;
    style();
    var sec = document.createElement('section');
    sec.className = 'yks-fy';
    sec.setAttribute('aria-label', kind === 'home' ? 'Picked for you' : 'You may also like');
    sec.setAttribute('data-nosnippet', '');
    var recent = (P.pages || []).filter(function (x) { return x.p !== path; }).slice(0, 5);
    sec.innerHTML = '<div class="yks-fy-in">' +
      '<div class="yks-fy-h"><div><p class="yks-fy-k">' + (kind === 'home' ? 'Picked for you' : 'You may also like') + '</p>' +
      '<h2>' + (kind === 'home' ? esc(greet()) + '. ' + (it.audience === 'talent' ? 'Your next step on YKS Talents' : 'Pick up where you left off') : 'More you might want to see') + '</h2>' +
      '<p>' + esc(reasonLine(it)) + '</p></div></div>' +
      '<div class="yks-fy-g">' + recs.map(function (r, i) {
        return '<a class="yks-fy-c" data-yks-rec="' + i + '" href="' + esc(r.u) + '"><span class="yks-fy-m"><img src="' + esc(r.img) +
          '" alt="" width="400" height="300" loading="lazy" decoding="async"></span><span class="yks-fy-b"><b>' + esc(r.t) +
          '</b><small>' + esc(r.d) + '</small></span></a>';
      }).join('') + '</div>' +
      (recent.length ? '<div class="yks-fy-r"><span>Recently viewed</span>' + recent.map(function (x) {
        return '<a href="' + esc(x.p === '/' ? '/' : x.p + (/\/$/.test(x.p) ? '' : '.html')) + '">' + esc(x.t) + '</a>';
      }).join('') + '</div>' : '') +
      '<p class="yks-fy-n">Suggested from the pages you opened on this device. It stays in your browser and is never sent anywhere. ' +
      '<button type="button" data-yks-reset>Clear my history</button> · <button type="button" data-yks-off>Turn off suggestions</button> · <a href="/privacy.html#personalisation">How this works</a></p>' +
      '</div>';
    sec.querySelector('[data-yks-reset]').addEventListener('click', function () { reset(); sec.remove(); refreshScroll(); });
    sec.querySelector('[data-yks-off]').addEventListener('click', function () { setOff(true); sec.remove(); var s = document.querySelector('.yks-sc'); if (s) s.remove(); refreshScroll(); });
    return sec;
  }
  function refreshScroll() { try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) {} }

  function art(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }
  function waGeo() {
    // js/contact.js decides the line when it knows the visitor's region
    try { if (window.YKS && YKS.region && YKS.region()) return YKS.waNumber(); } catch (e) {}
    var it = intent();
    return it.market === 'india' ? '919746679720' : '971501955122';
  }
  function waText() {
    var it = intent();
    if (!it.service || it.audience === 'talent') return null;
    if (it.audience === 'cast') return 'Hi Yedukrishna, I’m looking to cast talent for a shoot' + (it.cityName ? ' in ' + it.cityName : '') + '.';
    return 'Hi Yedukrishna, I’d like a quote for ' + art(SHORT[it.service]) + (it.cityName ? ' in ' + it.cityName : '') + '.';
  }

  function heroTune() {
    var box = document.querySelector('.act-hero .hero-cta');
    if (!box) return;
    var it = intent(), main = box.querySelector('.btn.fill'), wa = box.querySelector('.hero-cta-wa');
    if (!main || !it.audience) return;
    if (it.audience === 'talent') {
      main.textContent = 'Apply to YKS Talents, free';
      main.href = '/talents/apply.html?from=home';
      if (wa) { wa.textContent = 'How YKS Talents works'; wa.href = '/talents.html'; wa.removeAttribute('target'); wa.removeAttribute('data-wa-geo'); }
    } else if (it.audience === 'cast') {
      main.textContent = 'Find talent for your shoot';
      main.href = '/find-models.html';
    } else if (it.service) {
      main.textContent = 'Get a quote for your ' + SHORT[it.service];
    }
    if (wa && it.audience !== 'talent') {
      var t = waText();
      if (t) wa.href = 'https://wa.me/' + waGeo() + '?text=' + encodeURIComponent(t);
    }
    box.setAttribute('data-yks-tuned', it.audience + (it.service ? ':' + it.service : ''));
  }

  /* who this page is for, when the visitor has no history yet */
  function pageAudience() {
    if (viewBase.talent) return 'talent';
    if (viewBase.cast) return 'cast';
    for (var i = 0; i < SERVICES.length; i++) if (viewBase[SERVICES[i]]) return 'brand';
    if (/photograph|videograph|video|film|shoot|production|marketing|content|reels|ugc|campaign|^\/(dubai|india)\//.test(path)) return 'brand';
    return null;
  }
  var NO_CTA = /^\/(quote|talents\/apply|apply|edit|studio|privacy)|agreement|^\/links/;
  function waHref(text) {
    var t = text || 'Hi Yedukrishna, I’d like a quick quote for a shoot.';
    return 'https://wa.me/' + waGeo() + '?text=' + encodeURIComponent(t);
  }

  /* sticky CTA. Phones get the smallest step (tap to WhatsApp), desktops get
     the 60-second quote form. Shows once there is intent: a known audience
     from history, or real engagement with this page (40% scrolled + 25s). */
  function sticky() {
    if (NO_CTA.test(path)) return;
    var it = intent(), aud = it.audience, c = ctx();
    if (aud === 'talent' && /^\/talents/.test(path)) return;      // the page already says it
    if (aud === 'cast' && /find-models|models-in-/.test(path)) return;
    try { if (sessionStorage.getItem('yks_sc_x')) return; } catch (e) {}
    var earned = !!aud;
    aud = aud || pageAudience();
    if (!aud) return;
    var phone = c.device === 'mobile', href, label, tail, short, ext = false;
    if (aud === 'talent') { href = '/talents/apply.html?from=sticky'; label = 'Get your free portfolio'; short = 'Free portfolio'; tail = 'Apply →'; }
    else if (aud === 'cast') { href = '/find-models.html'; label = 'Find talent' + (it.cityName ? ' in ' + it.cityName : ''); short = 'Find talent'; tail = 'Browse →'; }
    else if (phone) { href = waHref(waText()); label = 'Quick quote on WhatsApp'; short = 'Quote on WhatsApp'; tail = ''; ext = true; }
    else { href = '/quote.html'; label = it.service ? 'Quote for your ' + SHORT[it.service] : 'Get a quote'; short = 'Get a quote'; tail = '60 sec →'; }
    style();
    var el = document.createElement('div');
    el.className = 'yks-sc';
    el.setAttribute('data-nosnippet', '');
    el.innerHTML = '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + ' data-yks-sticky="' + aud + (phone ? ':wa' : '') + '"><span class="yks-scl">' + esc(label) + '</span><span class="yks-scs">' + esc(short) + '</span>' + (tail ? '<b>' + tail + '</b>' : '') + '</a>' +
      '<button type="button" aria-label="Hide this suggestion">×</button>';
    el.querySelector('button').addEventListener('click', function () {
      el.remove(); try { sessionStorage.setItem('yks_sc_x', '1'); } catch (e) {}
    });
    document.body.appendChild(el);
    var shown = false, fast = c.from === 'instagram' || c.from === 'whatsapp';
    function check() {
      var h = document.documentElement, d = (h.scrollHeight - innerHeight) || 1;
      var f = (scrollY || h.scrollTop) / d, e = engagement();
      var ready = earned || fast ? f > 0.28 : (f > 0.4 && e.sec >= 25);
      var on = ready && f < 0.97 && !document.querySelector('.yks-ex.on');
      if (on !== shown) { shown = on; el.classList.toggle('on', on); }
    }
    addEventListener('scroll', check, { passive: true }); check();
    if (!earned) setInterval(check, 5000);
  }

  /* free guides worth giving away (reciprocity) — real pages on this site */
  function guideFor(it, aud) {
    var dxb = it.market === 'uae', sv = it.service || (function () { var b = null, v = 0; Object.keys(viewBase).forEach(function (k) { if (SERVICES.indexOf(k) > -1 && viewBase[k] > v) { v = viewBase[k]; b = k; } }); return b; })();
    if (aud === 'talent') return ['/talents/guides/how-to-make-a-modelling-portfolio.html', 'How to make a modelling portfolio'];
    if (aud === 'cast') return ['/talents/guides/how-to-cast-models-for-a-brand-shoot.html', 'How to cast models for a brand shoot'];
    if (sv === 'realestate') return dxb ? ['/blog/real-estate-video-cost-dubai.html', 'What a real estate video costs in Dubai'] : ['/blog/how-to-choose-real-estate-videographer-dubai.html', 'How to choose a real estate videographer'];
    if (sv === 'corporate') return dxb ? ['/blog/corporate-video-cost-dubai.html', 'What a corporate video costs in Dubai'] : ['/blog/brand-video-cost-bangalore.html', 'What drives the cost of a brand video'];
    if (sv === 'wedding') return dxb ? ['/blog/wedding-photographer-cost-dubai.html', 'What a wedding photographer costs in Dubai'] : ['/blog/best-wedding-venues-dubai-photos.html', 'Best wedding venues in Dubai for photos'];
    if (sv === 'marketing') return dxb ? ['/blog/social-media-management-cost-dubai.html', 'What social media management costs in Dubai'] : ['/blog/linkedin-personal-branding-founders-mumbai.html', 'LinkedIn personal branding for founders'];
    if (sv === 'adfilm') return ['/blog/brand-video-cost-bangalore.html', 'What drives the cost of a brand video'];
    return ['/blog/plan-a-content-shoot-day.html', 'How to plan a content shoot day'];
  }

  /* exit intent: one gentle, dismissible nudge per session, never on forms.
     Desktop: the pointer leaves through the top of the window.
     Phone: a fast scroll back up after reading at least half the page. */
  function exitNudge() {
    if (NO_CTA.test(path)) return;
    try { if (sessionStorage.getItem('yks_exit')) return; } catch (e) { return; }
    var c = ctx(), phone = c.device !== 'desktop', done = false;
    function busy() {   // a form field the visitor is actually using (on screen and focused)
      var a = document.activeElement; if (!a || !/INPUT|TEXTAREA|SELECT/.test(a.nodeName)) return false;
      var r = a.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    }
    function show(why) {
      if (done || contacted || busy() || document.querySelector('.yks-chat-open,[aria-modal="true"]:not([hidden])')) return;
      var e = engagement();
      if (e.sec < (phone ? 20 : 10)) return;
      var it = intent(), aud = it.audience || pageAudience() || 'brand';
      if (aud === 'talent' && /^\/talents\/apply/.test(path)) return;
      done = true; try { sessionStorage.setItem('yks_exit', why); } catch (er) {}
      log('exit-nudge', why); save();
      var g = guideFor(it, aud), head, line, cta, href, ext = false;
      if (aud === 'talent') {
        head = 'Your free portfolio is one form away';
        line = 'YKS Talents is free, with no fees ever. Apply in a few minutes and I’ll take it from there.';
        cta = 'Apply free'; href = '/talents/apply.html?from=exit';
      } else if (aud === 'cast') {
        head = 'Still casting' + (it.cityName ? ' in ' + it.cityName : '') + '?';
        line = 'Tell me the brief and the dates, and I’ll shortlist talent that fits.';
        cta = phone ? 'Send the brief on WhatsApp' : 'Browse talent'; href = phone ? waHref('Hi Yedukrishna, I’m casting talent for a shoot' + (it.cityName ? ' in ' + it.cityName : '') + '.') : '/find-models.html'; ext = phone;
      } else {
        head = (it.service ? 'Planning ' + art(SHORT[it.service]) : 'Planning a shoot') + '?';
        line = 'Send me one line about it and I’ll reply with availability and a rough number. No forms, no obligation.';
        cta = phone ? 'Get a quick quote on WhatsApp' : 'Get a quote in 60 seconds'; href = phone ? waHref(waText()) : '/quote.html?from=exit'; ext = phone;
      }
      style();
      var box = document.createElement('aside');
      box.className = 'yks-ex'; box.setAttribute('data-nosnippet', ''); box.setAttribute('aria-label', 'Before you go'); box.setAttribute('aria-live', 'polite');
      box.innerHTML = '<button type="button" class="yks-ex-x" aria-label="Close">×</button>' +
        '<p class="yks-fy-k">Before you go</p><h2>' + esc(head) + '</h2><p>' + esc(line) + '</p>' +
        (aud === 'brand' ? '<p class="yks-ex-pr">Brands I’ve shot for include Marriott, Vaseline (Unilever), Atlantis The Royal and Cindrebay School of Design. One campaign reel crossed 3.3M views.</p>' : '') +
        '<div class="yks-ex-a"><a class="yks-ex-p" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + ' data-yks-exit="' + aud + '">' + esc(cta) + '</a>' +
        '<a class="yks-ex-g" href="' + g[0] + '">Free guide: ' + esc(g[1]) + '</a></div>' +
        '<p class="yks-ex-w"><a href="/privacy.html#personalisation">Why am I seeing this?</a></p>';
      function close() { box.classList.remove('on'); setTimeout(function () { box.remove(); }, 300); removeEventListener('keydown', key); }
      function key(ev) { if (ev.key === 'Escape') close(); }
      box.querySelector('.yks-ex-x').addEventListener('click', close);
      box.addEventListener('click', function (ev) { if (ev.target.closest('a')) setTimeout(close, 50); });
      addEventListener('keydown', key);
      document.body.appendChild(box);
      requestAnimationFrame(function () { box.classList.add('on'); var sc = document.querySelector('.yks-sc.on'); if (sc) sc.classList.remove('on'); });
      teardown();
    }
    function out(e) { if (!e.relatedTarget && e.clientY <= 0) show('leave-top'); }
    var prevY = scrollY, prevT = Date.now(), startY = scrollY, startT = prevT;
    function up() {   // a quick flick back up: >0.9 screen within 700 ms
      var y = scrollY, t = Date.now();
      if (t - prevT > 250 || y > prevY) { startY = prevY; startT = prevT; }   // a new gesture starts here
      prevY = y; prevT = t;
      if (startY - y > innerHeight * 0.9 && t - startT < 700 && maxScroll >= 0.45) show('scroll-up');
    }
    function teardown() { document.removeEventListener('mouseout', out); removeEventListener('scroll', up); }
    if (!phone) document.addEventListener('mouseout', out);
    else addEventListener('scroll', up, { passive: true });
  }

  /* progressive profiling: what the visitor typed in a contact form before
     comes back pre-filled next time. Stored on this device only, under
     'yks_form_v1'; cleared by "Clear my history" / the privacy page. Never on
     the talent application forms. */
  var FORM_KEY = 'yks_form_v1';
  var FIELDS = {
    name: 'form.l-form [name="name"], #f-name, #cN',
    phone: 'form.l-form [name="contact"], #f-phone, #cP',
    email: 'form.l-form [name="email"], #cE'
  };
  function remember() {
    if (/^\/talents\/(apply|edit)|^\/(apply|edit)|agreement|studio/.test(path)) return;
    var F = {}; try { F = JSON.parse(ls.getItem(FORM_KEY) || '{}') || {}; } catch (e) {}
    function fill(root) {
      Object.keys(FIELDS).forEach(function (k) {
        if (!F[k]) return;
        (root.querySelectorAll ? root : document).querySelectorAll(FIELDS[k]).forEach(function (el) {
          if (!el.value && !el.getAttribute('data-yks-filled')) { el.value = F[k]; el.setAttribute('data-yks-filled', '1'); }
        });
      });
    }
    fill(document);
    document.addEventListener('change', function (e) {
      var el = e.target; if (!el || !el.matches) return;
      Object.keys(FIELDS).forEach(function (k) {
        if (el.matches(FIELDS[k])) {
          var v = String(el.value || '').trim().slice(0, 80);
          if (k === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return;
          if (v) F[k] = v; else delete F[k];
          try { if (!off) ls.setItem(FORM_KEY, JSON.stringify(F)); } catch (er) {}
        }
      });
    }, true);
    // the quote flow builds its contact step later
    if (path === '/quote' && window.MutationObserver) {
      new MutationObserver(function (m) { m.forEach(function (r) { r.addedNodes.forEach(function (n) { if (n.nodeType === 1) fill(n); }); }); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }

  function mount() {
    if (off) return;
    var it = startIntent;
    var has = (P.pages || []).length + Object.keys(P.s || {}).length;
    if (isHome) {
      heroTune();
      // only once there is real history beyond this landing
      if (it.confidence >= 0.25 || (P.pages || []).length >= 2) {
        var b = block('home'), hero = document.getElementById('act-hero');
        if (b && hero && hero.parentNode) { hero.parentNode.insertBefore(b, hero.nextSibling); refreshScroll(); }
      }
    } else if (has && (P.pages || []).filter(function (x) { return x.p !== path; }).length >= 1 &&
               !/^\/(quote|talents\/apply|apply|edit)|agreement/.test(path)) {
      var b2 = block('page');
      var main = document.querySelector('main');
      if (b2 && main) main.appendChild(b2);
      else if (b2) { var f = document.querySelector('footer'); if (f) f.parentNode.insertBefore(b2, f); }
    }
    sticky();
    exitNudge();
    remember();
    announce();
  }

  window.YKSSmart = {
    intent: intent,
    recommend: recommend,
    suggestQueries: suggestQueries,
    waText: waText,
    context: ctx,
    engagement: engagement,
    profile: function () { return off ? null : JSON.parse(JSON.stringify(P)); },
    signals: textSignals,
    reset: reset,
    off: function () { setOff(true); },
    on: function () { setOff(false); },
    enabled: function () { return !off; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
