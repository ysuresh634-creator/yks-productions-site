#!/usr/bin/env python3
"""Build one two-sided city page per entry in _data/cities.json.

The point of these pages is that they work with an empty roster and with
no client on the other end. A talent in Pune searching "modelling agency
in Pune" and a brand searching "book models in Pune" land on the same
page, and each finds their own door on it. Nothing here depends on how
many people are on the roster today — the roster strip simply appears
once there is someone in that city to show.

That is deliberate. Waiting for inventory before publishing means the
pages start ranking six months after they could have.

The gate against these becoming doorway pages is the data file: a city
with no hand-written market/talent/client copy does not get a page.

    python3 tools/build-city-pages.py [--plan]
"""
import io, os, re, json, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://yksproductions.com'
P = lambda *a: os.path.join(ROOT, *a)
e = html.escape
PLAN = '--plan' in sys.argv

cities = json.load(io.open(P('_data', 'cities.json'), encoding='utf-8'))['cities']
roster = json.load(io.open(P('_data', 'roster.json'), encoding='utf-8'))['talent']
CAT_LABEL = {'model': 'Model', 'influencer': 'Creator', 'actor': 'Actor'}

# Existing city photographer pages — link the pair together where both exist.
SHOOTS = {'mumbai': '/photographer-mumbai.html', 'delhi': '/photographer-delhi.html',
          'hyderabad': '/photographer-hyderabad.html', 'chennai': '/photographer-chennai.html',
          'bangalore': '/fashion-photographer-bangalore.html'}

# ── guard rails ────────────────────────────────────────────────
errs = []
for c in cities:
    for k in ('slug', 'city', 'state', 'geo', 'market', 'talent', 'client'):
        if not c.get(k):
            errs.append(f'{c.get("city", "?")}: missing hand-written field "{k}" — no page without it')
    for k in ('market', 'talent', 'client'):
        if c.get(k) and len(c[k]) < 120:
            errs.append(f'{c["city"]}: "{k}" is too thin ({len(c.get(k, ""))} chars) to justify a page')
BANNED = re.compile(r'\b(best|no\.?\s*1|number one|leading|top|#1|guarantee\w*|assured)\b', re.I)
for c in cities:
    for k in ('market', 'talent', 'client'):
        if c.get(k) and BANNED.search(c[k]):
            errs.append(f'{c["city"]}: "{k}" makes an unsubstantiable claim — {BANNED.search(c[k]).group(0)!r}')
if errs:
    print('BUILD ABORTED\n' + '\n'.join('  ✗ ' + x for x in errs))
    sys.exit(1)


def nav(city):
    return f'''<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/talents.html">The roster</a>
</nav>

<div class="l-cats">
  <div class="l-cats-inner">
    <a class="l-home" href="/index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Home</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/talents.html">The roster</a>
    <a href="/talents/apply.html">Join as talent</a>
    <a href="/casting-india.html">Cast for a shoot</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/india/">India</a>
    <a href="/blog/">Journal</a>
  </div>
</div>'''


def foot(c):
    others = [x for x in cities if x['slug'] != c['slug']]
    links = ' · '.join(f'<a href="/models-in-{o["slug"]}.html">{e(o["city"])}</a>' for o in others)
    pair = (f'<br />Shooting in {e(c["city"])} rather than casting? '
            f'<a href="{SHOOTS[c["slug"]]}">Photography and film in {e(c["city"])} →</a>'
            if c['slug'] in SHOOTS else '')
    return f'''<footer class="l-foot">
  <div class="wrap">
    <div class="l-foot-inner">
      <div class="l-foot-brand">YKS<span>.</span>Productions</div>
      <div class="l-foot-links">
        <a href="/talents.html">The roster</a>
        <a href="/talents/apply.html">Talent — apply</a>
        <a href="/casting-india.html">Casting · India</a>
        <a href="/index.html">Portfolio</a>
        <a href="/faq.html">FAQ</a>
      </div>
    </div>
    <p class="l-related">Talent and casting in other cities: {links}{pair}</p>
  </div>
</footer>'''


def faqs(c):
    """City-specific first, then the questions every fresh talent actually types."""
    return [
        (f'How do I join a modelling roster in {c["city"]}?',
         f'Send your details and photographs through the application form. You do not need '
         f'professional pictures to apply — clear, unedited photographs taken on a phone in '
         f'daylight are enough to assess, and are what we ask for first. Applying is free and '
         f'stays free. If you are put forward for a job, you are paid for that job.'),
        (f'Does YKS charge {c["city"]} models a joining or portfolio fee?',
         'No. There is no joining fee, no registration fee, no portfolio package and no '
         'compulsory shoot. Anyone in India asking a model to pay to be represented is '
         'running a different kind of business, and it is the clearest warning sign there is.'),
        (f'Can brands book a model in {c["city"]} directly?',
         'No, and that is deliberate. Talent contact details are never published and are never '
         'passed on. A brand sends a brief, receives a shortlist, and the booking is arranged '
         'through YKS Productions — which is what keeps talent safe and the shoot organised.'),
        (f'I am not from {c["city"]} — can I still apply?',
         f'Yes. The roster is open to talent anywhere in India, not only {c["city"]} or the '
         f'cities listed. Where you are based matters for local jobs, but a brief that fits '
         f'you can come from anywhere, and travel is arranged as part of the booking.'),
        ('Do I need experience or an existing portfolio?',
         'No. New faces are cast constantly, and every model on any roster started without a '
         'credit. What is actually required is being over 18, being reachable, and turning up '
         'when you say you will.'),
        (f'What does it cost to cast a model in {c["city"]}?',
         'It depends on the shoot — the number of days, the usage you need and how many people '
         'you are casting. Send the brief and you get one all-in number back covering the talent '
         'and the arrangement, so there is nothing to reconcile afterwards.'),
    ]


def roster_strip(c):
    """Appears only when there is someone in this city to show. Codes, never names."""
    here = [t for t in roster
            if t.get('country') == 'India'
            and t['city'].lower().split(',')[0].strip() in
                [c['city'].lower().split()[0]] + [a.lower() for a in c.get('also', [])]]
    if not here:
        return ''
    cards = '\n'.join(
        f'''        <a class="tal-mini" href="/talents/id/{t["pid"]}.html" rel="nofollow">
          <img src="/assets/talents/{t["dir"]}/{t["cover"]}" alt="{CAT_LABEL.get(t["cat"], "Talent")} · {e(t["city"])} — YKS Talents roster" loading="lazy" />
          <span><b data-tname="{t["code"]}" data-nosnippet>{CAT_LABEL.get(t["cat"], "Talent")} {t["code"].upper()}</b>
          <small>{e(" · ".join(t.get("tags", [])[:3]))}</small></span>
        </a>''' for t in here)
    n = len(here)
    return f'''
<section class="l-section">
  <div class="wrap">
    <div class="l-head">
      <h2>On the roster in <em>{e(c["city"])}</em></h2>
      <p>{n} {"profile" if n == 1 else "profiles"} currently based here. Open one to see the full
      book, or send a brief and get a shortlist built against it. Names and contact details stay
      with us either way.</p>
    </div>
    <div class="tal-mini-grid">
{cards}
    </div>
    <p class="l-note"><a href="/talents.html">See the whole roster →</a></p>
  </div>
</section>
'''


def page(c):
    url = f'{BASE}/models-in-{c["slug"]}.html'
    also = ', '.join(c.get('also', []))
    fq = faqs(c)
    faq_html = '\n'.join(
        f'''      <details>
        <summary>{e(q)}</summary>
        <p>{e(a)}</p>
      </details>''' for q, a in fq)

    schema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage', '@id': url + '#page', 'url': url,
                'name': f'Models in {c["city"]} — cast for a shoot, or join the roster',
                'description': (f'Cast models, actors and creators in {c["city"]}, or join the '
                                f'YKS Talents roster from {c["city"]}. Free to join, bookings '
                                f'arranged through YKS Productions.'),
                'isPartOf': {'@id': f'{BASE}/#website'},
                'about': {'@id': url + '#service'},
                'significantLink': [f'{BASE}/talents/apply.html', f'{BASE}/casting-india.html'],
            },
            {
                '@type': 'Service', '@id': url + '#service',
                'name': f'Talent casting and booking in {c["city"]}',
                'serviceType': 'Casting and talent booking',
                'provider': {'@id': f'{BASE}/#business'},
                'areaServed': [
                    {'@type': 'City', 'name': c['city'],
                     'containedInPlace': {'@type': 'AdministrativeArea', 'name': c['state']}},
                    *[{'@type': 'City', 'name': a} for a in c.get('also', [])],
                ],
                'audience': [
                    {'@type': 'BusinessAudience',
                     'audienceType': f'Brands and agencies casting in {c["city"]}'},
                    {'@type': 'Audience',
                     'audienceType': f'Models, actors and creators in {c["city"]} seeking paid work'},
                ],
                'availableChannel': [
                    {'@type': 'ServiceChannel', 'name': 'Casting brief',
                     'serviceUrl': f'{BASE}/casting-india.html#brief'},
                    {'@type': 'ServiceChannel', 'name': 'Talent application',
                     'serviceUrl': f'{BASE}/talents/apply.html'},
                ],
            },
            {
                '@type': 'FAQPage', '@id': url + '#faq',
                'mainEntity': [{'@type': 'Question', 'name': q,
                                'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in fq],
            },
            {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE + '/'},
                    {'@type': 'ListItem', 'position': 2, 'name': 'Talents',
                     'item': f'{BASE}/talents.html'},
                    {'@type': 'ListItem', 'position': 3, 'name': f'{c["city"]}', 'item': url},
                ],
            },
        ],
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
<title>Book Models in {e(c['city'])} — Casting &amp; Talent | YKS Talents</title>
<meta name="description" content="Cast models, actors and creators in {e(c['city'])} — send a brief, get a shortlist. Every booking runs through YKS. Working talent can apply to the board." />
<link rel="canonical" href="{url}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="geo.region" content="{e(c['geo'])}" />
<meta name="geo.placename" content="{e(c['city'])}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="Models in {e(c['city'])} — cast for a shoot, or join the roster" />
<meta property="og:description" content="A talent pool open to anyone in India, and a casting service for brands. Free to join. Bookings arranged through YKS Productions." />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{BASE}/assets/og-cover.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=23" />
<script type="application/ld+json">
{json.dumps(schema, indent=2, ensure_ascii=False)}
</script>
</head>
<body data-page="casting">

{nav(c)}

<main>

<section class="l-hero">
  <div class="wrap">
    <p class="l-eyebrow">Talent · {e(c['city'])} · {e(c['state'])}</p>
    <h1>Models in {e(c['city'])}</h1>
    <p class="tal-h1sub">Modelling, acting and creator work in {e(c['city'])} — for the people doing it, and the brands casting it.</p>
    <p class="l-lede">{e(c['market'])}</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/casting-india.html#brief">I&rsquo;m casting — send a brief</a>
      <a class="btn btn-ghost" href="/talents/apply.html">I&rsquo;m talent — apply to the board →</a>
    </div>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <div class="l-twoside">

      <div class="l-svcside">
        <p class="l-eyebrow">For talent in {e(c['city'])}</p>
        <h2>The board is <em>open in {e(c['city'])}</em></h2>
        <p class="l-prose">{e(c['talent'])}</p>
        <p class="l-prose">Over 18, photographs plain enough to see you properly, and no fee at
        any point — not to join, not to stay on it, and not for the portfolio you build here on
        the way through. You keep that PDF either way. If your pictures aren&rsquo;t working I
        will tell you why and what to shoot instead, which is the conversation most new faces
        never get. Every brief that comes through is paid work for a real client. Nobody honest
        promises work; what I can promise is that briefs from {e(c['city'])} go in front of the
        right faces, and that the booking, the schedule and the payment all run through me.
        <a href="/talents/apply.html">The full terms are on the board &rarr;</a></p>
        <div class="l-cta-row">
          <a class="btn btn-fill" href="/talents/apply.html">Apply from {e(c['city'])} →</a>
        </div>
      </div>

      <div class="l-svcside">
        <p class="l-eyebrow">For brands casting in {e(c['city'])}</p>
        <h2>Send a brief, get a <em>shortlist</em></h2>
        <p class="l-prose">{e(c['client'])}</p>
        <p class="l-prose">Dates, the look and how you intend to use the images — that is the
        whole brief. Back comes a shortlist built against it and one all-in number, rather than a
        directory to sift through. Contact details are never shared in either direction.
        <a href="/casting-india.html">How a casting runs &rarr;</a></p>
        <div class="l-cta-row">
          <a class="btn btn-fill" href="/casting-india.html#brief">Send a {e(c['city'])} brief →</a>
        </div>
      </div>

    </div>
  </div>
</section>
{roster_strip(c)}
<section class="l-section alt">
  <div class="wrap">
    <div class="l-head">
      <h2>Where we cast around <em>{e(c['city'])}</em></h2>
      <p>Talent based in and around {e(c['city'])}{' — including ' + e(also) if also else ''} —
      are all within the same casting radius. Anywhere else in India, apply anyway: the roster
      is pan-India and travel is arranged as part of a booking.</p>
    </div>
    <div class="l-cta-row">
      <a class="btn btn-ghost" href="/talents.html">See the roster</a>
      <a class="btn btn-ghost" href="/talents/apply.html">Join from anywhere in India</a>
    </div>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <div class="l-head"><h2>Questions, <em>answered straight</em></h2></div>
    <div class="l-faq">
{faq_html}
    </div>
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <p class="tal-kicker">{e(c['city'])}</p>
    <h2>Two doors, <em>one roster</em></h2>
    <p>If you're talent, join it. If you're casting, brief it. Either takes a couple of minutes.</p>
    <div class="l-cta-row center">
      <a class="btn btn-fill" href="/talents/apply.html">Join the roster</a>
      <a class="btn btn-ghost" href="/casting-india.html#brief">Send a casting brief</a>
    </div>
  </div>
</section>

</main>

{foot(c)}

<script src="/js/talent-names.js?v=1"></script>
<script src="/js/landing.js?v=13"></script>
<script src="/js/chat-config.js"></script>
<script src="/js/chat.js?v=4"></script>
</body>
</html>
'''


# ── write ──────────────────────────────────────────────────────
if PLAN:
    print(f'{len(cities)} city pages · roster: {len(roster)} talent\n')
    for c in cities:
        strip = 'roster strip' if roster_strip(c) else 'no roster yet (page still ships)'
        print(f'  /models-in-{c["slug"]}.html'.ljust(34) + f'{c["city"]} — {strip}')
    sys.exit(0)

written, bad = [], []
names = [t['name'] for t in roster] + [t['name'].split()[0] for t in roster]
for c in cities:
    p = P(f'models-in-{c["slug"]}.html')
    io.open(p, 'w', encoding='utf-8').write(page(c))
    written.append(f'models-in-{c["slug"]}.html')
    s = io.open(p, encoding='utf-8').read()
    for n in names:
        if n in s:
            bad.append(f'{c["slug"]}: LEAK — talent name "{n}" in published HTML')
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            json.loads(m.group(1))
        except Exception as ex:
            bad.append(f'{c["slug"]}: invalid schema — {ex}')
    for i in re.findall(r'<img\b[^>]*>', s):
        if not re.search(r'alt="[^"]+"', i):
            bad.append(f'{c["slug"]}: image without alt')
    if re.search(r'(₹|INR|AED|USD|\$)\s?\d', s):
        bad.append(f'{c["slug"]}: a price reached the page')

# ── sitemap ────────────────────────────────────────────────────
sm_path = P('sitemap.xml')
sm = io.open(sm_path, encoding='utf-8').read()
added = 0
anchor = f'  <url>\n    <loc>{BASE}/talents.html</loc>'
for c in cities:
    loc = f'{BASE}/models-in-{c["slug"]}.html'
    if loc in sm:
        continue
    sm = sm.replace(anchor, (f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>2026-08-21</lastmod>\n'
                             f'    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n'
                             f'  </url>\n') + anchor, 1)
    added += 1
if added:
    io.open(sm_path, 'w', encoding='utf-8').write(sm)

print(f'city pages written : {len(written)}')
print(f'with roster strip  : {sum(1 for c in cities if roster_strip(c))}')
print(f'sitemap entries    : +{added}')
print(f'problems           : {len(bad)}')
for b in bad:
    print('  ✗', b)
sys.exit(1 if bad else 0)
