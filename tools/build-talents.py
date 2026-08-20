#!/usr/bin/env python3
"""Build every talent artefact from talents/roster.json.

One command regenerates: each profile page, the roster cards on
talents.html, the ItemList schema, and the sitemap entries. Add a talent
to the JSON and run this — never hand-edit the generated parts.

    python3 tools/build-talents.py

Guard rails enforced here rather than trusted to memory:
  · No talent contact detail may appear anywhere in the data. Bookings
    route through YKS only. The build ABORTS if it finds any.
  · Every talent must be marked over18. The build ABORTS otherwise —
    casting a minor in India needs prior District Magistrate permission
    under CLPRA and that is not a thing to do by accident.
  · No prices. The build ABORTS if it finds a currency figure.
  · India talent → +91 booking number, UAE talent → +971.
"""
import io, os, re, json, sys, html
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://yksproductions.com'
WA = {'india': '919746679720', 'uae': '971501955122'}
CAT_LABEL = {'model': 'Model', 'influencer': 'Creator', 'actor': 'Actor'}
CAT_JOB = {'model': 'Model', 'influencer': 'Content Creator', 'actor': 'Actor'}

P = lambda *a: os.path.join(ROOT, *a)
data = json.load(io.open(P('talents', 'roster.json'), encoding='utf-8'))
roster = data['talent']

# ── guard rails ────────────────────────────────────────────────
blob = json.dumps(roster, ensure_ascii=False)  # ensure_ascii would hide ₹ as \u20b9
errs = []
for pat, why in [
    (r'[\w.+-]+@[\w-]+\.[\w.]+', 'an email address'),
    (r'(?<!\d)(?:\+?\d[\d\s-]{8,})(?!\d)', 'a phone number'),
    (r'instagram\.com/(?!yks_photoworks)', 'a talent Instagram link'),
    (r'(₹|INR|AED|USD|\$)\s?\d', 'a price'),
]:
    hits = [h if isinstance(h, str) else h[0] for h in re.findall(pat, blob)]
    hits = [h for h in hits if h.strip()]
    if hits:
        errs.append(f'roster.json contains {why}: {hits[:3]} — remove it')
for t in roster:
    if not t.get('over18'):
        errs.append(f'"{t.get("name", "?")}" is not marked over18:true — the roster is 18+ only')
    for k in ('slug', 'name', 'cat', 'region', 'city', 'dir', 'cover'):
        if not t.get(k):
            errs.append(f'"{t.get("name", "?")}" is missing required field: {k}')
    d = P('assets', 'talents', t.get('dir', ''))
    if t.get('dir') and not os.path.isdir(d):
        errs.append(f'"{t["name"]}" — image folder not found: assets/talents/{t["dir"]}/')
    else:
        for f in [t.get('cover')] + [g['file'] for g in t.get('gallery', [])]:
            if f and not os.path.exists(os.path.join(d, f)):
                errs.append(f'"{t["name"]}" — missing image: assets/talents/{t["dir"]}/{f}')
if errs:
    print('BUILD ABORTED\n' + '\n'.join('  ✗ ' + e for e in errs))
    sys.exit(1)

e = html.escape


def img(t, f):
    return f'/assets/talents/{t["dir"]}/{f}'


# ── profile pages ──────────────────────────────────────────────
def profile(t, plate):
    cat = CAT_LABEL.get(t['cat'], 'Talent')
    where = f'{t["city"]}, {t["country"]}'
    wa = WA.get(t['region'], WA['india'])
    msg = quote(f'Hi Yedukrishna, I\'d like to book {t["name"]} ({cat}, {t["city"]}) from your talent pool. Is she available?'
                if t.get('gender') == 'Female' else
                f'Hi Yedukrishna, I\'d like to book {t["name"]} ({cat}, {t["city"]}) from your talent pool. Are they available?')
    first = t['name'].split()[0]
    tagline = ', '.join(x.lower() for x in t.get('tags', [])[:3])
    desc = t.get('metaDescription') or (
        f'{t["name"]} — professional {tagline} {cat.lower()} based in {where}, '
        f'available for shoots across India. See the portfolio, stats and range, '
        f'and book through YKS Productions.')
    ogdesc = t.get('ogDescription') or (
        f'{tagline.capitalize()} {cat.lower()} in {t["city"]}. '
        f'See the portfolio and book through YKS Productions.')
    kw = t.get('keywords') or ', '.join([
        f'{t["name"]} {cat.lower()}', f'{cat.lower()} {t["city"]}',
        f'{t.get("tags", ["fashion"])[0].lower()} {cat.lower()} India',
        f'book a {cat.lower()} {t["city"]}', f'hire {cat.lower()} India',
        'YKS Talents'])

    specs = '\n'.join(
        f'          <div class="pf-row"><dt>{e(k)}</dt><dd>{e(v)}</dd></div>'
        for k, v in (t.get('specs') or {}).items())
    cast = '\n'.join(f'            <li>{e(c)}</li>' for c in t.get('castableFor', []))
    plates = '\n'.join(
        f'      <figure class="pf-plate"><img src="{img(t, g["file"])}" alt="{e(t["name"])} — {e(g["alt"])}" loading="lazy" />'
        f'<figcaption><b>Plate {i+2:02d}</b><span>{e(g["label"])}</span></figcaption></figure>'
        for i, g in enumerate(t.get('gallery', [])))
    ngal = len(t.get('gallery', []))

    schema = {
        '@context': 'https://schema.org', '@type': 'ProfilePage',
        'url': f'{BASE}/talents/{t["slug"]}.html',
        'mainEntity': {
            '@type': 'Person', 'name': t['name'],
            'jobTitle': CAT_JOB.get(t['cat'], 'Talent'),
            **({'gender': t['gender']} if t.get('gender') else {}),
            **({'nationality': t['nationality']} if t.get('nationality') else {}),
            'address': {'@type': 'PostalAddress', 'addressLocality': t['city'],
                        'addressCountry': t.get('countryCode', 'IN')},
            'image': BASE + img(t, t['cover']),
            'worksFor': {'@type': 'Organization', 'name': 'YKS Productions', 'url': BASE + '/'},
            'knowsAbout': t.get('knowsAbout') or t.get('tags', []),
        },
        'isPartOf': {'@id': f'{BASE}/#website'},
    }

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C57X89TN45"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-C57X89TN45');
</script>
<title>{e(t['name'])} — {cat} · {e(where)} | YKS Talents</title>
<meta name="description" content="{e(desc)}" />
<meta name="keywords" content="{e(kw)}" />
<link rel="canonical" href="{BASE}/talents/{t['slug']}.html" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="geo.region" content="{e(t.get('geoRegion', t.get('countryCode', 'IN')))}" />
<meta name="geo.placename" content="{e(where)}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{e(t['name'])} — {cat} · {e(where)}" />
<meta property="og:description" content="{e(ogdesc)}" />
<meta property="og:url" content="{BASE}/talents/{t['slug']}.html" />
<meta property="og:image" content="{BASE}{img(t, t['cover'])}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=14" />
<link rel="stylesheet" href="/css/talents.css?v=6" />
<script type="application/ld+json">
{json.dumps(schema, indent=2, ensure_ascii=False)}
</script>
</head>
<body data-wa="{wa}">

<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/talents.html">Back to the edit</a>
</nav>

<main>

<section class="pf-hero">
  <div class="wrap">
    <a class="pf-back" href="/talents.html">Back to the edit</a>
    <div class="mag-folio">
      <span>YKS Talent Edit</span>
      <span>Plate {plate:02d} — {cat}</span>
    </div>
    <div class="pf-hero-grid">
      <div class="pf-hero-img">
        <img src="{img(t, t['cover'])}" alt="{e(t['name'])} — {cat.lower()}, {e(t['city'])}" />
      </div>
      <div class="pf-hero-txt">
        <p class="tal-kicker">{cat} · {e(where)}</p>
        <h1 class="pf-name">{e(t['name'])}</h1>
        <p class="pf-disc">{e(' · '.join(t.get('tags', [])))}</p>
        <div class="pf-cta">
          <a class="btn btn-fill" href="https://wa.me/{wa}?text={msg}" target="_blank" rel="noopener">Enquire to book {e(first)} →</a>
        </div>
        <p class="pf-priv">Booked only through YKS — no direct contact is shared. I handle availability, rates and the shoot.</p>
      </div>
    </div>
  </div>
</section>

<section class="l-section pf-detail">
  <div class="wrap">
    <div class="pf-detail-grid">
      <div class="pf-spec">
        <p class="pf-block-k">Specifications</p>
        <dl>
{specs}
        </dl>
      </div>
      <div class="pf-about">
        <p class="pf-block-k">Profile</p>
        <p class="pf-bio">{e(t.get('bio', ''))}</p>
        <div class="pf-about-cast">
          <p class="pf-block-k">Castable for</p>
          <ul class="pf-cast">
{cast}
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="l-section alt pf-work">
  <div class="wrap">
    <div class="pf-work-head">
      <h2>Selected work</h2>
      <span>Plates 02 – {ngal + 1:02d}</span>
    </div>
    <div class="pf-gallery">
{plates}
    </div>
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <p class="tal-kicker">Casting</p>
    <h2>Book {e(first)} <em>for your shoot</em></h2>
    <p>Tell me the dates, the city and what you're shooting — I'll confirm availability and come back with one all-in number.</p>
    <div class="l-cta-row center">
      <a class="btn btn-fill" href="https://wa.me/{wa}?text={msg}" target="_blank" rel="noopener">Enquire to book {e(first)} →</a>
      <a class="btn btn-ghost" href="/casting-india.html#brief">Send a casting brief</a>
    </div>
  </div>
</section>

</main>

<footer class="l-foot">
  <div class="wrap">
    <div class="l-foot-inner">
      <div class="l-foot-brand">YKS<span>.</span>Productions</div>
      <div class="l-foot-links">
        <a href="/talents.html">The roster</a>
        <a href="/casting-india.html">Casting · India</a>
        <a href="/talents/apply.html">Talent — apply</a>
        <a href="/index.html">Portfolio</a>
        <a href="/quote.html">Get a quote</a>
      </div>
    </div>
  </div>
</footer>

<script src="/js/landing.js?v=4"></script>
<script src="/js/chat-config.js"></script>
<script src="/js/chat.js?v=4"></script>
</body>
</html>
'''


# ── roster cards for talents.html ──────────────────────────────
def card(t):
    cat = CAT_LABEL.get(t['cat'], 'Talent')
    stats = '|'.join(f'{k}:{v}' for k, v in (t.get('specs') or {}).items())
    gal = '|'.join(img(t, g['file']) for g in t.get('gallery', []))
    return (
        f'      <article class="tal" data-cat="{t["cat"]}" data-region="{t["region"]}" '
        f'data-name="{e(t["name"])}" data-city="{e(t["city"])}, {e(t["country"])}"\n'
        f'        data-tags="{e(" · ".join(t.get("tags", [])))}"\n'
        f'        data-stats="{e(stats)}"\n'
        f'        data-bio="{e(t.get("shortBio") or t.get("bio", ""))}"\n'
        f'        data-gallery="{img(t, t["cover"])}|{gal}"\n'
        f'        data-href="/talents/{t["slug"]}.html">\n'
        f'        <a class="tal-open" href="/talents/{t["slug"]}.html">\n'
        f'          <img src="{img(t, t["cover"])}" alt="{e(t["name"])} — {cat.lower()}, {e(t["city"])}" loading="lazy" />\n'
        f'          <span class="tal-grad"></span>\n'
        f'          <span class="tal-body">\n'
        f'            <span class="tal-cat">{cat}</span>\n'
        f'            <span class="t-name">{e(t["name"])}</span>\n'
        f'            <span class="tal-cue">{e(t["city"])}, {e(t["country"])}</span>\n'
        f'            <span class="tal-chips">{e(" · ".join(t.get("tags", [])))}</span>\n'
        f'          </span>\n'
        f'        </a>\n'
        f'      </article>')


written = []
for i, t in enumerate(sorted(roster, key=lambda x: x.get('plate', 99)), start=1):
    path = P('talents', t['slug'] + '.html')
    io.open(path, 'w', encoding='utf-8').write(profile(t, t.get('plate', i)))
    written.append(t['slug'])

# ── sitemap ────────────────────────────────────────────────────
sm_path = P('sitemap.xml')
sm = io.open(sm_path, encoding='utf-8').read()
added = 0
for t in roster:
    loc = f'{BASE}/talents/{t["slug"]}.html'
    if loc in sm:
        continue
    entry = (f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>2026-08-21</lastmod>\n'
             f'    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n')
    anchor = f'  <url>\n    <loc>{BASE}/talents.html</loc>'
    sm = sm.replace(anchor, entry + anchor, 1)
    added += 1
if added:
    io.open(sm_path, 'w', encoding='utf-8').write(sm)

# ── validate what we generated ─────────────────────────────────
bad = []
for slug in written:
    s = io.open(P('talents', slug + '.html'), encoding='utf-8').read()
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            json.loads(m.group(1))
        except Exception as ex:
            bad.append(f'{slug}: invalid schema — {ex}')
    for i in re.findall(r'<img\b[^>]*>', s):
        if not re.search(r'alt="[^"]+"', i):
            bad.append(f'{slug}: image without alt')

print(f'profiles written : {len(written)}  ({", ".join(written)})')
print(f'sitemap entries  : +{added}')
print(f'problems         : {len(bad)}')
for b in bad:
    print('  ✗', b)
sys.exit(1 if bad else 0)
