#!/usr/bin/env node
/* YKS Talents — profile generator.
   Turns one submission's data into (a) a roster card <article> for talents.html
   and (b) a full profile page matching talents/shalini-singh.html.
   Used by the review pipeline: a submission is auto-built into a DRAFT that YKS
   approves before it goes public. Contact is NEVER emitted — booking always
   routes through YKS's own WhatsApp, same privacy spine as the rest.

   Usage:  node tools/gen-talent.mjs <submission.json> [--out talents/_pending]
   The JSON is one submission (see FIELDS below). Photos are Cloudinary URLs. */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/* ── helpers ── */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escAttr = (s) => esc(s).replace(/'/g, '&#39;');
const enc = (s) => encodeURIComponent(String(s == null ? '' : s));
const slugify = (s) => String(s || 'talent').toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'talent';

const WA = '919746679720';
const CAT_MAP = { 'model': 'model', 'influencer / creator': 'influencer', 'influencer': 'influencer', 'creator': 'influencer', 'actor': 'actor' };
const REGION_MAP = { 'india': 'india', 'uae': 'uae' };
const STAT_LABELS = [
  ['stat_height', 'Height'], ['stat_bust', 'Bust'], ['stat_waist', 'Waist'],
  ['stat_hips', 'Hips'], ['stat_shoe', 'Shoe'], ['stat_hair', 'Hair'],
  ['stat_eyes', 'Eyes'], ['stat_skin', 'Skin']
];

/* ── eligibility: the roster only ever carries YKS-branded portfolios.
   Every profile this file emits IS YKS-branded by construction (YKS nav,
   "YKS Talent Edit" folio, booking through YKS only). The one thing we must
   refuse is a submission with no real portfolio behind it — no photos means
   no YKS-built book, so it can't go on the roster. ── */
export function isEligible(d) {
  const photos = (d && d.photos || []).filter((p) => p && p.url);
  return { ok: photos.length > 0, photoCount: photos.length,
    reason: photos.length ? '' : 'no photos — no YKS-branded portfolio to show' };
}

/* ── core: build card + profile from a submission ── */
export function generateTalent(d) {
  const name = (d.name || '').trim() || 'New Talent';
  const slug = slugify(name);
  const catKey = CAT_MAP[(d.category || '').toLowerCase().trim()] || 'model';
  const catLabel = catKey === 'influencer' ? 'Influencer' : catKey === 'actor' ? 'Actor' : 'Model';
  const region = REGION_MAP[(d.based_in || '').toLowerCase().trim()] || 'india';
  const city = (d.city || '').trim();
  const cityFull = city ? city + (region === 'uae' ? ', UAE' : ', India') : (region === 'uae' ? 'UAE' : 'India');

  // disciplines / tags — from the work-preference chips, else a sensible default
  let discList = (d.work_preferences || '').split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  if (!discList.length) discList = catKey === 'actor' ? ['Film & TV', 'Ad films', 'Commercial']
    : catKey === 'influencer' ? ['Content', 'Commercial', 'Fashion'] : ['Fashion', 'Editorial', 'Commercial'];
  const tags = discList.join(' · ');
  const tags3 = discList.slice(0, 3).join(' · ');

  // photos — cover first, rest become plates; caption plates by their section
  const photos = (d.photos || []).filter((p) => p && p.url);
  const cover = (d.cover_url || (photos[0] && photos[0].url) || '').trim();
  const gallery = photos.map((p) => p.url).join('|');
  const plates = photos.filter((p) => p.url !== cover);

  // stats → spec rows + data-stats
  const statRows = STAT_LABELS.filter(([k]) => (d[k] || '').trim())
    .map(([k, label]) => ({ label, val: (d[k] || '').trim() }));
  const dataStats = statRows.map((r) => r.label + ':' + r.val).join('|');

  const bio = (d.about || '').trim() ||
    `${name} is a ${catLabel.toLowerCase()} based in ${cityFull}, represented by YKS Productions and castable across ${tags3.toLowerCase()}.`;

  /* ── (a) roster card ── */
  const card =
`      <article class="tal" data-cat="${escAttr(catKey)}" data-region="${escAttr(region)}" data-name="${escAttr(name)}" data-city="${escAttr(cityFull)}"
        data-tags="${escAttr(tags)}"${dataStats ? `\n        data-stats="${escAttr(dataStats)}"` : ''}
        data-bio="${escAttr(bio)}"
        data-gallery="${escAttr(gallery)}">
        <a class="tal-open" href="/talents/${slug}.html">
          <span class="tal-media"><img src="${escAttr(cover)}" alt="${escAttr(name)} — ${escAttr(catLabel.toLowerCase())}, ${escAttr(city || cityFull)}" loading="lazy" /></span>
          <span class="tal-grad"></span><span class="tal-cat">${esc(catLabel)}</span>
          <span class="tal-body"><b>${esc(name)}</b><small>${esc(cityFull)}</small><em>${esc(tags3)}</em></span>
          <span class="tal-cue">Open profile →</span>
        </a>
      </article>`;

  /* ── (b) full profile page ── */
  const bookMsg = `Hi Yedukrishna, I'd like to book ${name} (${catLabel}, ${city || cityFull}) from your talent pool. Is she available?`;
  const bookHref = `https://wa.me/${WA}?text=${enc(bookMsg)}`;
  const geo = region === 'uae' ? { region: 'AE', place: city ? city + ', UAE' : 'UAE', country: 'AE' }
    : { region: 'IN', place: city ? city + ', India' : 'India', country: 'IN' };
  const specRows = statRows.map((r) =>
    `          <div class="pf-row"><dt>${esc(r.label)}</dt><dd>${esc(r.val)}</dd></div>`).join('\n')
    || '          <div class="pf-row"><dt>Details</dt><dd>On request</dd></div>';
  const castItems = discList.map((t) => `            <li>${esc(t)}</li>`).join('\n');
  const platesHtml = plates.map((p, i) => {
    const capMain = (p.cat || catLabel).trim();
    return `      <figure class="pf-plate"><img src="${escAttr(p.url)}" alt="${escAttr(name)} — ${escAttr(capMain.toLowerCase())}" loading="lazy" /><figcaption><b>Plate ${String(i + 2).padStart(2, '0')}</b><span>${esc(capMain)}</span></figcaption></figure>`;
  }).join('\n') || `      <figure class="pf-plate"><img src="${escAttr(cover)}" alt="${escAttr(name)}" loading="lazy" /><figcaption><b>Plate 02</b><span>${esc(catLabel)}</span></figcaption></figure>`;
  const knowsAbout = JSON.stringify(discList);
  const plateRange = plates.length ? `Plates 02 – ${String(plates.length + 1).padStart(2, '0')}` : 'Plate 02';

  const profile =
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C57X89TN45"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-C57X89TN45');
</script>

<title>${esc(name)} — ${esc(catLabel)} · ${esc(cityFull)} | YKS Talents</title>
<meta name="description" content="${escAttr(name)} — ${escAttr(catLabel.toLowerCase())} based in ${escAttr(cityFull)}. See the portfolio, stats and range, and book through YKS Productions." />
<link rel="canonical" href="https://yksproductions.com/talents/${slug}.html" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="geo.region" content="${esc(geo.region)}" />
<meta name="geo.placename" content="${escAttr(geo.place)}" />

<meta property="og:type" content="profile" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="${escAttr(name)} — ${escAttr(catLabel)} · ${escAttr(cityFull)}" />
<meta property="og:description" content="${escAttr(tags)}. See the portfolio and book through YKS Productions." />
<meta property="og:url" content="https://yksproductions.com/talents/${slug}.html" />
<meta property="og:image" content="${escAttr(cover)}" />
<meta name="twitter:card" content="summary_large_image" />

<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=13" />
<link rel="stylesheet" href="/css/talents.css?v=6" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "url": "https://yksproductions.com/talents/${slug}.html",
  "mainEntity": {
    "@type": "Person",
    "name": ${JSON.stringify(name)},
    "jobTitle": ${JSON.stringify(catLabel)},
    "address": { "@type": "PostalAddress", "addressLocality": ${JSON.stringify(city || geo.place)}, "addressCountry": ${JSON.stringify(geo.country)} },
    "image": ${JSON.stringify(cover)},
    "worksFor": { "@type": "Organization", "name": "YKS Productions", "url": "https://yksproductions.com/" },
    "knowsAbout": ${knowsAbout}
  },
  "isPartOf": { "@id": "https://yksproductions.com/#website" }
}
</script>
</head>
<body>

<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/talents.html">Back to the edit</a>
</nav>

<div class="l-cats">
  <div class="l-cats-inner">
    <a class="l-home" href="/index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Home</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/talents.html" aria-current="page">Talents</a>
    <a href="/dubai/">Dubai &amp; UAE</a>
    <a href="/india/">India</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/fashion.html">Fashion</a>
    <a href="/films.html">Films &amp; BTS</a>
    <a href="/weddings.html">Weddings</a>
    <a href="/blog/">Journal</a>
  </div>
</div>

<main>

<!-- PROFILE HERO -->
<section class="pf-hero">
  <div class="wrap">
    <a class="pf-back" href="/talents.html">Back to the edit</a>
    <div class="mag-folio">
      <span>YKS Talent Edit</span>
      <span>${esc(catLabel)}</span>
    </div>
    <div class="pf-hero-grid">
      <div class="pf-hero-img">
        <img src="${escAttr(cover)}" alt="${escAttr(name)} — ${escAttr(catLabel.toLowerCase())}, ${escAttr(city || cityFull)}" />
      </div>
      <div class="pf-hero-txt">
        <p class="tal-kicker">${esc(catLabel)} · ${esc(cityFull)}</p>
        <h1 class="pf-name">${esc(name)}</h1>
        <p class="pf-disc">${esc(tags)}</p>
        <div class="pf-cta">
          <a class="btn btn-fill" href="${escAttr(bookHref)}" target="_blank" rel="noopener">Enquire to book ${esc(name.split(' ')[0])} →</a>
        </div>
        <p class="pf-priv">Booked only through YKS — no direct contact is shared. I handle availability, rates and the shoot.</p>
      </div>
    </div>
  </div>
</section>

<!-- SPEC SHEET + PROFILE -->
<section class="l-section pf-detail">
  <div class="wrap">
    <div class="pf-detail-grid">
      <div class="pf-spec">
        <p class="pf-block-k">Specifications</p>
        <dl>
${specRows}
        </dl>
      </div>
      <div class="pf-about">
        <p class="pf-block-k">Profile</p>
        <p class="pf-bio">${esc(bio)}</p>
        <div class="pf-about-cast">
          <p class="pf-block-k">Castable for</p>
          <ul class="pf-cast">
${castItems}
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PORTFOLIO -->
<section class="l-section alt pf-work">
  <div class="wrap">
    <div class="pf-work-head">
      <h2>Selected work</h2>
      <span>${esc(plateRange)}</span>
    </div>
    <div class="pf-gallery">
${platesHtml}
    </div>
  </div>
</section>

<!-- BOOK CTA -->
<section class="l-cta">
  <div class="wrap">
    <p class="tal-kicker">Casting</p>
    <h2>Book ${esc(name.split(' ')[0])} for your <em>shoot</em></h2>
    <p>Tell me the brief — the look, the dates, the city — and I'll confirm availability and come back with one all-in number.</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="${escAttr(bookHref)}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
      <a class="btn btn-ghost" href="/quote.html">Send a casting brief</a>
    </div>
  </div>
</section>

</main>

<footer class="l-foot">
  <div class="wrap">
    <div class="l-foot-inner">
      <div class="l-foot-brand">YKS<span>.</span>Productions</div>
      <div class="l-foot-links">
        <a href="/index.html">Portfolio</a>
        <a href="/talents.html">Talents</a>
        <a href="/dubai/">Dubai &amp; UAE</a>
        <a href="/india/">India</a>
        <a href="/quote.html">Get a quote</a>
        <a href="https://instagram.com/yks_photoworks" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
  </div>
</footer>

<script src="/js/landing.js?v=10"></script>
<script src="/js/chat-config.js"></script>
<script src="/js/chat.js?v=5"></script>
</body>
</html>
`;

  return { slug, name, catKey, catLabel, region, cityFull, card, profile };
}

/* ── CLI ── */
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const jsonPath = args.find((a) => !a.startsWith('--'));
  const outIdx = args.indexOf('--out');
  const outDir = outIdx > -1 ? args[outIdx + 1] : 'talents/_pending';
  if (!jsonPath) { console.error('usage: node tools/gen-talent.mjs <submission.json> [--out dir]'); process.exit(1); }
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const gate = isEligible(data);
  if (!gate.ok) { console.error('SKIPPED — ' + (data.name || 'applicant') + ': ' + gate.reason + '. Roster only accepts YKS-branded portfolios.'); process.exit(2); }
  const { slug, name, card, profile } = generateTalent(data);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, slug + '.html'), profile);
  writeFileSync(join(outDir, slug + '.card.html'), card);
  console.log(`Generated draft for ${name} → ${join(outDir, slug + '.html')} (+ .card.html)`);
}
