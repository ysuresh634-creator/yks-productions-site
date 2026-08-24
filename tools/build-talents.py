#!/usr/bin/env python3
"""Build every talent artefact from talents/roster.json.

One command regenerates: each profile page, the roster cards on
talents.html, the ItemList schema, and the sitemap entries. Add a talent
to the JSON and run this — never hand-edit the generated parts.

    python3 tools/build-talents.py

Guard rails enforced here rather than trusted to memory:
  · No talent contact detail may appear anywhere in the data. Bookings
    route through YKS only. The build ABORTS if it finds any.
  · No talent NAME may reach the generated HTML — not the title, meta,
    schema, URL, alt text or body copy. Names live in talents/names.json
    (robots-blocked) and are painted in by JS for human visitors only.
    The build ABORTS if a name leaks into the markup.
  · Profile pages are noindex AND their URLs are unguessable. A sequential
    slug (m01, m02...) let anyone sent one shortlist link type the next
    number and walk the whole roster — and these pages carry a photograph,
    a city and full measurements. noindex does not stop a human. The pid is
    random, minted once, and persisted so links stay stable.
  · The roster is ours to show, not Google's to list.
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
data = json.load(io.open(P('_data', 'roster.json'), encoding='utf-8'))
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
    for k in ('slug', 'code', 'pid', 'name', 'cat', 'region', 'city', 'dir', 'cover'):
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
    code = t['code'].upper()
    # The enquiry opens on the roster code, never the name. JS rewrites it to
    # the name for a human who has the page open; a crawler only ever sees the code.
    msg = quote(f'Hi Yedukrishna, I\'d like to book {code} ({cat}, {t["city"]}) '
                f'from your talent pool. Is this talent available?')
    tagline = ', '.join(x.lower() for x in t.get('tags', [])[:3])
    desc = (f'Roster profile {code} — {tagline} {cat.lower()} based in {where}, '
            f'available for shoots across India. Booked through YKS Productions.')
    ogdesc = f'{cat} · {where} — YKS Talents roster.'
    kw = ''

    specs = '\n'.join(
        f'          <div class="pf-row"><dt>{e(k)}</dt><dd>{e(v)}</dd></div>'
        for k, v in (t.get('specs') or {}).items())
    cast = '\n'.join(f'            <li>{e(c)}</li>' for c in t.get('castableFor', []))
    # Galleries are grouped into sets so a client can jump straight to what they need —
    # the polished book, the plain digitals, or real client work. A talent's photos already
    # carry a category on the apply form; `set` is where that lands. Everything is
    # "Portfolio" unless told otherwise, and the tabs only appear once a second set exists.
    SET_ORDER = ['Portfolio', 'Digitals', 'Client work']
    def gset(g):
        s = (g.get('set') or '').strip()
        if s in SET_ORDER:
            return s
        low = s.lower()
        if low in ('digital', 'digitals', 'snap', 'snaps', 'polaroid'):
            return 'Digitals'
        if low in ('client', 'client work', 'campaign', 'brand'):
            return 'Client work'
        return 'Portfolio'
    groups = {}
    for i, g in enumerate(t.get('gallery', [])):
        groups.setdefault(gset(g), []).append((i, g))
    sets = [k for k in SET_ORDER if groups.get(k)]
    ngal = len(t.get('gallery', []))

    def plate_html(i, g):
        return ('        <figure class="pf-plate"><img src="%s" alt="%s · %s — %s" loading="lazy" decoding="async" />'
                '<figcaption><b>Plate %02d</b><span>%s</span></figcaption></figure>'
                % (img(t, g['file']), cat, e(t['city']), e(g['alt']), i + 2, e(g['label'])))

    tabs = ''
    if len(sets) > 1:
        tabs = ('      <div class="pf-tabs" role="tablist">\n' + '\n'.join(
            '        <button type="button" class="pf-tab%s" data-set="%s" role="tab">%s <i>%d</i></button>'
            % (' on' if n == 0 else '', e(k), e(k), len(groups[k]))
            for n, k in enumerate(sets)) + '\n      </div>\n')
    panels = '\n'.join(
        '      <div class="pf-gallery" data-set="%s"%s>\n%s\n      </div>'
        % (e(k), '' if n == 0 else ' hidden', '\n'.join(plate_html(i, g) for i, g in groups[k]))
        for n, k in enumerate(sets))
    plates = tabs + panels

    # optional video introduction — rendered only when the roster entry has one
    vid = (t.get('video') or '').strip()
    video_html = ('          <a class="pf-intro" href="%s" target="_blank" rel="noopener">'
                  '<span class="pf-intro-play" aria-hidden="true">&#9654;</span> Watch intro</a>\n' % e(vid)) if vid else ''

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
<title>Roster profile {code} — {cat} · {e(where)} | YKS Talents</title>
<meta name="description" content="{e(desc)}" />
<link rel="canonical" href="{BASE}/talents/id/{t['pid']}.html" />
<meta name="robots" content="noindex, nofollow, noimageindex, noarchive" />
<meta name="geo.region" content="{e(t.get('geoRegion', t.get('countryCode', 'IN')))}" />
<meta name="geo.placename" content="{e(where)}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{cat} · {e(where)} — YKS Talents" />
<meta property="og:description" content="{e(ogdesc)}" />
<meta property="og:url" content="{BASE}/talents/id/{t['pid']}.html" />
<meta property="og:image" content="{BASE}{img(t, t['cover'])}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=15" />
<link rel="stylesheet" href="/css/talents.css?v=56" />
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
        <img src="{img(t, t['cover'])}" alt="{cat} · {e(t['city'])} — YKS Talents roster {code}" />
      </div>
      <div class="pf-hero-txt">
        <p class="tal-kicker">{cat} · {e(where)}</p>
        <h1 class="pf-name" data-tname="{t['code']}" data-nosnippet>{cat} {code}</h1>
        <p class="pf-disc">{e(' · '.join(t.get('tags', [])))}</p>
{video_html}        <div class="pf-cta">
          <a class="btn btn-fill" data-tbook="{t['code']}" href="https://wa.me/{wa}?text={msg}" target="_blank" rel="noopener">Enquire to book <span data-tfirst="{t['code']}">this talent</span> →</a>
        </div>
        <p class="pf-priv">Booked only through YKS — no direct contact is shared, and this profile is not published to search engines. I handle availability, rates and the shoot.</p>
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
{plates}
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <p class="tal-kicker">Casting</p>
    <h2>Book <span data-tfirst="{t['code']}" data-nosnippet>this talent</span> <em>for your shoot</em></h2>
    <p>Tell me the dates, the city and what you're shooting — I'll confirm availability and come back with one all-in number.</p>
    <div class="l-cta-row center">
      <a class="btn btn-fill" data-tbook="{t['code']}" href="https://wa.me/{wa}?text={msg}" target="_blank" rel="noopener">Enquire to book <span data-tfirst="{t['code']}">this talent</span> →</a>
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

<script src="/js/talent-names.js?v=2"></script>
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
    tags = ' · '.join(t.get('tags', []))
    href = f'/talents/id/{t["pid"]}.html'
    return (
        f'      <article class="tal" data-cat="{t["cat"]}" data-region="{t["region"]}" '
        f'data-code="{t["code"]}" data-city="{e(t["city"])}, {e(t["country"])}"\n'
        f'        data-tags="{e(tags)}"\n'
        f'        data-stats="{e(stats)}"\n'
        f'        data-bio="{e(t.get("shortBio") or t.get("bio", ""))}"\n'
        f'        data-gallery="{img(t, t["cover"])}|{gal}">\n'
        f'        <a class="tal-open" href="{href}" rel="nofollow">\n'
        f'          <span class="tal-media"><img src="{img(t, t["cover"])}" '
        f'alt="{cat} · {e(t["city"])} — YKS Talents roster" loading="lazy" /></span>\n'
        f'          <span class="tal-grad"></span><span class="tal-cat">{cat}</span>\n'
        f'          <span class="tal-body"><b data-tname="{t["code"]}" data-nosnippet>'
        f'{cat} {t["code"].upper()}</b><small>{e(t["city"])}, {e(t["country"])}</small>'
        f'<em>{e(" · ".join(t.get("tags", [])[:3]))}</em></span>\n'
        f'          <span class="tal-cue">Open profile →</span>\n'
        f'        </a>\n'
        f'      </article>')


os.makedirs(P('talents', 'id'), exist_ok=True)
written = []
for i, t in enumerate(sorted(roster, key=lambda x: x.get('plate', 99)), start=1):
    io.open(P('talents', 'id', t['pid'] + '.html'), 'w',
            encoding='utf-8').write(profile(t, t.get('plate', i)))
    written.append(t['pid'])

# ── names.json — the only place a name is published, and robots blocks it ──
# Human visitors' browsers fetch it and paint the names in; crawlers obey the
# Disallow and never see it, so no name enters a search index.
io.open(P('talents', 'names.json'), 'w', encoding='utf-8').write(json.dumps(
    {t['code']: {'name': t['name'], 'first': t['name'].split()[0]} for t in roster},
    indent=2, ensure_ascii=False) + '\n')

# ── roster grid on talents.html ────────────────────────────────
tp = P('talents.html')
th = io.open(tp, encoding='utf-8').read()
cards = '\n\n'.join(card(t) for t in sorted(roster, key=lambda x: x.get('plate', 99)))
th = re.sub(r'(<!-- TALENT-CARDS:START -->).*?(<!-- TALENT-CARDS:END -->)',
            lambda m: m.group(1) + '\n\n' + cards + '\n\n      ' + m.group(2), th, flags=re.S)
io.open(tp, 'w', encoding='utf-8').write(th)

# ── sitemap: strip any profile URL that a previous build submitted ─────
# These pages are noindex now. Leaving them in the sitemap would be asking
# Google to crawl exactly what we are asking it to forget.
sm_path = P('sitemap.xml')
sm = io.open(sm_path, encoding='utf-8').read()
before = sm
sm = re.sub(r'  <url>\s*<loc>[^<]*/talents/(?!apply\.html)[^<]*</loc>.*?</url>\n',
            '', sm, flags=re.S)
removed = before.count('<loc>') - sm.count('<loc>')
if removed:
    io.open(sm_path, 'w', encoding='utf-8').write(sm)

# ── validate what we generated ─────────────────────────────────
# The load-bearing check: a talent name must not exist in any published
# byte. If one does, the roster has leaked and this build is not shippable.
bad = []
names = [t['name'] for t in roster] + [t['name'].split()[0] for t in roster]
published = [P('talents', 'id', c + '.html') for c in written] + [P('talents.html')]
for f in published:
    s_ = io.open(f, encoding='utf-8').read()
    rel = os.path.relpath(f, ROOT)
    for n in names:
        if n in s_:
            bad.append(f'{rel}: LEAK — talent name "{n}" is in the published HTML')
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s_, re.S):
        try:
            blob_ = json.loads(m.group(1))
        except Exception as ex:
            bad.append(f'{rel}: invalid schema — {ex}')
            continue
        for n in names:
            if n in json.dumps(blob_, ensure_ascii=False):
                bad.append(f'{rel}: LEAK — talent name "{n}" is in the schema')
    for i_ in re.findall(r'<img\b[^>]*>', s_):
        if not re.search(r'alt="[^"]+"', i_):
            bad.append(f'{rel}: image without alt')
for c in written:
    s_ = io.open(P('talents', 'id', c + '.html'), encoding='utf-8').read()
    if 'noindex' not in s_:
        bad.append(f'talents/id/{c}.html: profile is not noindex')

print(f'profiles written : {len(written)}  ({", ".join(written)})  [noindex]')
print(f'names.json       : {len(roster)} (robots-blocked, JS-only)')
print(f'sitemap cleaned  : -{removed} profile URL(s)')
print(f'problems         : {len(bad)}')
for b in bad:
    print('  ✗', b)
sys.exit(1 if bad else 0)
