---
published: false
---
# Smart site layer (js/smart.js + js/search.js)

On-device personalisation and smarter search for yksproductions.com.
Nothing leaves the browser: no new vendors, no server, no cookies, no PII.

## What it does
- **Reads intent** from the pages a visitor opens, dwell and scroll, UTM / `?q=`
  parameters, site searches, WhatsApp / call clicks and the quote / apply form
  category. Scores per service bucket decay with a 21-day half-life.
- **Homepage hero** (`#act-hero .hero-cta`): brand visitors get
  "Get a quote for your {service}" plus a WhatsApp link prefilled for the right
  market (India / UAE). Talent visitors get "Apply to YKS Talents, free" and
  "How YKS Talents works". Casting visitors get "Find talent for your shoot".
- **Picked for you** (homepage, after the hero) and **You may also like**
  (other pages, end of `<main>`): real site pages with existing site photos,
  recently viewed chips, and "Clear my history" / "Turn off suggestions".
- **Smart sticky pill**: one quiet CTA between 28% and 97% scroll, dismissible
  for the session. Kept left of the chat "Let's talk" button on mobile.
- **Search**: fuzzy and typo tolerant (Damerau distance), Hinglish phrases
  ("model banna hai", "kaise bane model", "shaadi", "ad video"), synonyms,
  soft-AND (unknown words get fixed or dropped), near matches for long queries,
  "Did you mean", and a gentle intent tiebreak (city, service, talent).

## Privacy and SEO
- Off when: no localStorage, Do Not Track or Global Privacy Control is on, or the
  user agent looks like a bot or headless browser.
- `?personalise=off` / `?personalise=on` toggles it. The opt-out lives in
  `localStorage.yks_smart_off`.
- Default HTML is unchanged. Everything personal is injected after load with
  `data-nosnippet`, so crawlers and no-JS visitors see the normal page (no cloaking).

## Storage keys
| Key | What |
| --- | --- |
| `localStorage.yks_smart_v1` | profile: bucket scores, cities, last 12 pages (path, title), last 8 searches, 60 events, `intent` |
| `localStorage.yks_smart_off` | `"1"` when the visitor turned suggestions off |
| `sessionStorage.yks_sc_x` | sticky pill dismissed for this session |

## Hooks for other scripts (chat, forms)
Read only. Nothing in `js/chat.js` was changed.

```js
// current guess, or null fields when unsure
window.YKSSmart && YKSSmart.enabled() && YKSSmart.intent();
// -> { audience: 'brand'|'talent'|'cast'|null, service: 'adfilm'|'product'|...,
//      label, market: 'india'|'uae'|'intl', city, cityName, confidence, recent, visits }

YKSSmart.waText();          // WhatsApp prefill text for this visitor
YKSSmart.recommend(4);      // [{u, t, d, img}] real pages
YKSSmart.suggestQueries();  // search ideas
YKSSmart.reset(); YKSSmart.off(); YKSSmart.on();

// fires whenever the intent changes
window.addEventListener('yks:intent', e => console.log(e.detail));

// signals other scripts may send in
window.dispatchEvent(new CustomEvent('yks:search', { detail: { q } }));
window.dispatchEvent(new CustomEvent('yks:classified', { detail: { category, route, service } }));
```
The same intent is mirrored at `JSON.parse(localStorage.yks_smart_v1).intent`.

## Maintenance notes
- New pages: add the `<script src="/js/smart.js?v=1" defer></script>` tag. The
  generators `build-find-models.py`, `build-seo-cluster.py` and
  `build-talent-guides.py` already do. `tools/build-city-pages.py` and
  `tools/seo/production.py` do not, so regenerating with them drops the tag.
- Catalogue of recommendable pages: `CAT` in `js/smart.js`. Use only existing
  site photos.

## Region-aware contact number (js/contact.js)

India visitors always see +91 97466 79720; UAE / Gulf visitors (UAE, Saudi, Qatar, Oman, Bahrain, Kuwait) always see +971 50 195 5122 — on WhatsApp links, tel: links, shown numbers, sticky CTAs and the quote / enquiry WhatsApp fallbacks.

- Loaded as the first sync script inside `<body>` (`/js/contact.js?v=1`), so swaps happen as the parser adds nodes: no flash, no layout shift.
- Detection: `?region=in|ae|auto` (kept for the session) → browser timezone → `navigator.languages` (`-IN` / `-AE|SA|QA|OM|BH|KW`). No IP lookup, no third-party call.
- Unknown visitor (e.g. London, en-GB): nothing is changed, the page's own market number stays.
- Static HTML and JSON-LD `telephone` are never edited — crawlers and no-JS visitors see the per-page defaults.
- Opt out for a block that deliberately shows both numbers: add `data-geo-keep`.
- Sets `body[data-wa]` when a region is detected (the chat widget already reads this).

Helper for any script, including the chat widget:

```js
YKS.region()          // 'in' | 'ae' | null
YKS.contactNumber()   // {region, wa:'919746679720', tel:'+919746679720', display:'+91 97466 79720', source:'timezone'|'language'|'param'|'page'}
YKS.waNumber()        // '919746679720' or '971501955122'
YKS.waLink('Hi ...')  // full wa.me link with the right number
```

Generators carry the tag; `tools/seo/production.py` and the marketing-agency-* pages do not (on purpose).
