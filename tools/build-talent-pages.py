#!/usr/bin/env python3
"""Generate category x city landing pages from the roster — but only where
there is enough talent to justify one.

This is the client-finds-talent half of the platform. A brand searches
"models in Mumbai", not "talent roster". Each viable combination becomes a
real page listing the actual people.

The gate matters more than the generator. Five thin pages backed by one
model rank badly AND disappoint whoever arrives, which makes rankings
worse. So a page is only written when the roster can actually fill it.

    python3 tools/build-talent-pages.py            # build what qualifies
    python3 tools/build-talent-pages.py --plan     # show what unlocks when
"""
import io, os, re, json, sys, html
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://yksproductions.com'
MIN_PER_PAGE = 3          # below this a page is thinner than it is worth
P = lambda *a: os.path.join(ROOT, *a)
e = html.escape

CAT = {'model': ('Models', 'model'), 'influencer': ('Creators', 'creator'),
       'actor': ('Actors', 'actor')}
WA = {'india': '919746679720', 'uae': '971501955122'}

data = json.load(io.open(P('talents', 'roster.json'), encoding='utf-8'))
roster = [t for t in data['talent'] if t.get('over18')]

# group by (category, city) and (category, country-wide)
by_city, by_region = defaultdict(list), defaultdict(list)
for t in roster:
    by_city[(t['cat'], t['city'], t['country'], t['region'])].append(t)
    by_region[(t['cat'], t['country'], t['region'])].append(t)

plan = []
for (cat, city, country, region), ppl in sorted(by_city.items()):
    plan.append({'kind': 'city', 'cat': cat, 'city': city, 'country': country,
                 'region': region, 'n': len(ppl), 'people': ppl,
                 'slug': f'{CAT[cat][1]}s-in-{re.sub(r"[^a-z0-9]+", "-", city.lower()).strip("-")}'})
for (cat, country, region), ppl in sorted(by_region.items()):
    plan.append({'kind': 'country', 'cat': cat, 'city': None, 'country': country,
                 'region': region, 'n': len(ppl), 'people': ppl,
                 'slug': f'{CAT[cat][1]}s-in-{re.sub(r"[^a-z0-9]+", "-", country.lower()).strip("-")}'})

viable = [p for p in plan if p['n'] >= MIN_PER_PAGE]
waiting = [p for p in plan if p['n'] < MIN_PER_PAGE]

if '--plan' in sys.argv:
    print(f'roster: {len(roster)} talent · threshold: {MIN_PER_PAGE} per page\n')
    print('WOULD BUILD NOW')
    print('  (none)' if not viable else '')
    for p in viable:
        print(f'  /{p["slug"]}.html  — {p["n"]} {p["cat"]}s')
    print('\nWAITING ON MORE TALENT')
    for p in sorted(waiting, key=lambda x: -x['n']):
        where = p['city'] or p['country']
        need = MIN_PER_PAGE - p['n']
        print(f'  /{p["slug"]}.html'.ljust(34)
              + f'{p["n"]}/{MIN_PER_PAGE} {p["cat"]}s in {where} — needs {need} more')
    sys.exit(0)


def card(t):
    d, cov = t['dir'], t['cover']
    label = CAT[t['cat']][0][:-1]
    return (f'        <a class="tal-mini" href="/talents/{t["slug"]}.html">\n'
            f'          <img src="/assets/talents/{d}/{cov}" alt="{e(t["name"])} — '
            f'{label.lower()}, {e(t["city"])}" loading="lazy" />\n'
            f'          <span><b>{e(t["name"])}</b><small>{e(t["city"])} · '
            f'{e(" · ".join(t.get("tags", [])[:3]))}</small></span>\n'
            f'        </a>')


def page(p):
    plural, singular = CAT[p['cat']]
    where = p['city'] or p['country']
    wa = WA.get(p['region'], WA['india'])
    n = p['n']
    title = f'{plural} in {where}'
    people = '\n'.join(card(t) for t in sorted(p['people'], key=lambda x: x.get('plate', 99)))

    faq = [
      (f'How do I book a {singular} in {where}?',
       f'Send the brief — the look, the dates and what it is for. I come back with a shortlist '
       f'and one all-in number covering the {singular} and the shoot together. You book through '
       f'me, not through the talent directly.'),
      (f'Can I contact the {plural.lower()} directly?',
       'No, and that is deliberate. Contact details are never published and never passed on. '
       'Enquiries come to me, I check the booking is real and the dates work, and only then does '
       'the talent hear about it. It is the reason people are willing to be on the list.'),
      (f'Is this a modelling agency in {where}?',
       'No. I am a photographer and director who casts talent for the productions I shoot. There '
       'is no representation contract and nobody is signed to me.'),
      (f'I am a {singular} in {where} — can I join?',
       'Yes, if you are 18 or over. It is free to join, there are no fees of any kind, and your '
       'contact details stay private. Being on the roster is not a guarantee of work.'),
    ]
    faq_html = '\n'.join(f'      <details><summary>{e(q)}</summary><p>{e(a)}</p></details>'
                         for q, a in faq)

    schema = {"@context": "https://schema.org", "@graph": [
      {"@type": "CollectionPage", "name": title,
       "url": f'{BASE}/{p["slug"]}.html',
       "description": f'{n} {plural.lower()} on the YKS roster in {where}, bookable through YKS Productions.',
       "isPartOf": {"@id": f'{BASE}/#website'}},
      {"@type": "ItemList", "numberOfItems": n, "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "item": {
          "@type": "Person", "name": t['name'],
          "jobTitle": CAT[t['cat']][0][:-1],
          "url": f'{BASE}/talents/{t["slug"]}.html',
          "image": f'{BASE}/assets/talents/{t["dir"]}/{t["cover"]}',
          "worksFor": {"@id": f'{BASE}/#business'}}}
        for i, t in enumerate(p['people'])]},
      {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f'{BASE}/'},
        {"@type": "ListItem", "position": 2, "name": "Talents", "item": f'{BASE}/talents.html'},
        {"@type": "ListItem", "position": 3, "name": title, "item": f'{BASE}/{p["slug"]}.html'}]},
      {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
        for q, a in faq]}]}

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
<title>{e(title)} — Book Through YKS Productions</title>
<meta name="description" content="{n} {plural.lower()} available for shoots in {e(where)}. See the roster and book through YKS Productions — one brief, one all-in number." />
<meta name="keywords" content="{plural.lower()} {where.lower()}, book a {singular} {where.lower()}, hire {singular} {where.lower()}, casting {where.lower()}, {singular} for photoshoot {where.lower()}" />
<link rel="canonical" href="{BASE}/{p['slug']}.html" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{e(title)} — YKS Productions" />
<meta property="og:description" content="{n} {plural.lower()} available for shoots in {e(where)}." />
<meta property="og:url" content="{BASE}/{p['slug']}.html" />
<meta property="og:image" content="{BASE}/assets/talents/{p['people'][0]['dir']}/{p['people'][0]['cover']}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=14" />
<script type="application/ld+json">
{json.dumps(schema, indent=2, ensure_ascii=False)}
</script>
</head>
<body data-wa="{wa}">

<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/talents.html">The roster</a>
</nav>

<main>

<section class="l-hero">
  <div class="wrap">
    <p class="l-eyebrow">Casting · {e(where)}</p>
    <h1>{plural} <em>in {e(where)}</em></h1>
    <p class="l-lede">{n} {plural.lower()} on the roster available for shoots in {e(where)}. Browse the faces, then send one brief — I confirm availability and come back with a single all-in number covering the talent and the shoot.</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/casting-india.html#brief">Send a casting brief</a>
      <a class="btn btn-ghost" href="/talents.html">See the full roster</a>
    </div>
  </div>
</section>

<section class="l-section alt">
  <div class="wrap">
    <div class="l-head"><h2>The {plural.lower()} <em>available here</em></h2></div>
    <div class="tal-mini-grid">
{people}
    </div>
    <p class="l-micro" style="margin-top:22px">Contact details are never published. Every booking goes through YKS.</p>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <div class="l-head"><h2>Booking in {e(where)} — <em>questions</em></h2></div>
    <div class="l-faq">
{faq_html}
    </div>
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <h2>Casting in <em>{e(where)}?</em></h2>
    <p>Tell me the look, the dates and what it is for. Shortlist and one number back.</p>
    <div class="l-form-wrap">
      <form class="l-form" data-source="{e(title)}" data-subject="New casting brief — {e(where)}">
        <div class="row2">
          <input type="text" name="name" placeholder="Your name" required />
          <input type="tel" name="contact" placeholder="Phone / WhatsApp" required />
        </div>
        <input type="email" name="email" placeholder="Email (optional)" />
        <textarea name="message" placeholder="The look you need, the dates, and what it is for…"></textarea>
        <button type="submit" class="btn btn-fill">Send the brief →</button>
      </form>
      <p class="l-form-ok">✓ Thank you — your brief is in. I'll come back today.</p>
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


written = []
for p in viable:
    io.open(P(p['slug'] + '.html'), 'w', encoding='utf-8').write(page(p))
    written.append(p['slug'])

# sitemap
if written:
    sp = P('sitemap.xml'); sm = io.open(sp, encoding='utf-8').read(); add = 0
    for slug in written:
        loc = f'{BASE}/{slug}.html'
        if loc in sm: continue
        sm = sm.replace('  <url>\n    <loc>' + BASE + '/talents.html</loc>',
            f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>2026-08-21</lastmod>\n'
            f'    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n'
            + '  <url>\n    <loc>' + BASE + '/talents.html</loc>', 1); add += 1
    if add: io.open(sp, 'w', encoding='utf-8').write(sm)

print(f'roster        : {len(roster)} talent')
print(f'pages written : {len(written)}' + (f'  ({", ".join(written)})' if written else ''))
print(f'held back     : {len(waiting)} (under {MIN_PER_PAGE} talent — would be thin)')
if not written:
    print('\nNothing qualifies yet. Run with --plan to see what unlocks at what roster size.')
