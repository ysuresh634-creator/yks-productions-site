#!/usr/bin/env python3
"""Production-house landing pages (client-side, non-branded intent).

Builds the city "production house" pages, the India and Dubai hubs, and three
service pages (ad & brand films, product photography, reels production).

Honesty rules baked into the copy (from the owner):
  * YKS Productions is ONE person, Yedukrishna Suresh. No office, no team,
    no studio. Extra hands are freelancers hired per project only.
  * No invented crew sizes, clients, awards, numbers, reviews or prices.
  * Brands named: Marriott, Vaseline (Unilever). Proof reel: 3.3M views.
  * Only images already published on the site. No drones. Not an
    editor-for-hire (I edit what I shoot).

Idempotent:  python3 tools/seo/production.py
"""
import io, os, re, json, html
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(ROOT, *a)
SITE = 'https://yksproductions.com'
WA = '919746679720'
REEL = 'https://www.instagram.com/reel/DYYl0i7zet7/'

# Entity block is copied verbatim from an existing page so it never drifts.
_src = io.open(P('corporate-video-bangalore.html'), encoding='utf-8').read()
ENTITY = _src[_src.index('<!-- ENTITY:START -->'):_src.index('<!-- ENTITY:END -->') + len('<!-- ENTITY:END -->')]
CATS = _src[_src.index('<!-- CATEGORY STRIP'):_src.index('<main>')].rstrip()

def wa(text):
    return f'https://wa.me/{WA}?text=' + quote(text, safe='')

def img(path, w, h, alt, eager=False):
    base = path.rsplit('.', 1)[0]
    s = f'/assets/{base}'
    return (f'<img width="{w}" height="{h}" src="{s}.webp" alt="{alt}" '
            f'loading="{"eager" if eager else "lazy"}" data-full="{s}.webp" '
            f'srcset="{s}-800.webp 800w, {s}.webp {w}w" sizes="(max-width: 800px) 100vw, 800px" decoding="async" />')

# Published images only (all already used on the site).
IM = {
    'marriott7': ('posters/marriott-r7', 608, 1080, 'Marriott brand campaign reel still'),
    'marriott1': ('posters/marriott-r1', 608, 1080, 'Marriott Coorg campaign reel still'),
    'marriott3': ('posters/marriott-r3', 608, 1080, 'Hotel campaign reel, plantation scene'),
    'topreel':   ('posters/reel-topreel', 640, 1136, 'Campaign reel that crossed 3.3 million views'),
    'ranger':    ('posters/ranger', 1200, 675, 'Apparel brand film still'),
    'evantha':   ('posters/evantha', 1200, 675, 'Customer testimonial film still'),
    'samyakk':   ('posters/ig-samyakk', 720, 1280, 'Saree brand campaign reel still'),
    'fashion':   ('craft/fashion', 760, 950, 'Fashion campaign photography'),
    'suman':     ('behance/fash-suman', 1067, 1600, 'Editorial fashion shoot for a label'),
    'olivia':    ('behance/fash-olivia', 1200, 1600, 'Lookbook fashion photograph'),
    'showreel':  ('posters/vimeo-showreel', 900, 1600, 'Dubai real-estate showreel still'),
    'dxb1':      ('posters/ig-dxb1', 900, 1600, 'Dubai property reel still'),
    'dxb3':      ('posters/ig-dxb3', 901, 1600, 'Dubai property film still'),
    'tower':     ('work/atlantis-tower', 720, 1280, 'Luxury property film still, Dubai'),
    'realestate':('craft/realestate', 760, 950, 'Real estate and brand film work'),
    'india':     ('craft/india-market', 900, 620, 'Brand and fashion work across India'),
}

def gallery(keys, city=''):
    out = []
    for k in keys:
        p, w, h, alt = IM[k]
        a = alt + (f' — production house work for brands in {city}' if city and k in ('fashion','realestate','suman') else '')
        out.append('      ' + img(p, w, h, html.escape(a, quote=True)))
    return '\n'.join(out)

MARRIOTT_FILM = '''    <div class="vfacade" data-embed="https://drive.google.com/file/d/1UdWdt6mB_X9cNiW7jMEDpo7gDuAMB2v_/preview" data-title="Marriott Coorg campaign film">
        <img width="1200" height="675" src="/assets/posters/marriott-film.webp" alt="Marriott Coorg campaign film by YKS Productions" loading="lazy" data-full="/assets/posters/marriott-film.webp" srcset="/assets/posters/marriott-film-800.webp 800w, /assets/posters/marriott-film.webp 1200w" sizes="(max-width: 800px) 100vw, 800px" decoding="async" />
        <span class="vplay"></span><span class="vtag">Marriott campaign film · play</span>
      </div>'''

PROOF = '''    <div class="l-proof">
      <div><b>8<span>+</span></b><i>Years behind the camera</i></div>
      <div><b>3.3M<span>+</span></b><i>Views · top campaign reel</i></div>
      <div><b>Marriott</b><i>Hotel campaign film &amp; reels</i></div>
      <div><b>Vaseline</b><i>Unilever brand content</i></div>
    </div>'''

def who(place):
    return f'''<section class="l-section alt">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">Who you&rsquo;re hiring</p>
      <h2>One person, <em>start to finish</em></h2>
    </div>
    <div class="l-prose">
      <p>I want to be straight about this, because most production-house websites aren&rsquo;t. <strong>YKS Productions is me, Yedukrishna Suresh.</strong> There is no office, no account manager and no junior who turns up on the day instead of the person you briefed. I write the treatment, direct, shoot and edit.</p>
      <p>When a brief genuinely needs more hands (a gaffer for a big lighting set-up, a sound recordist for interviews, a stylist or a make-up artist), I bring in freelancers for that project only. They report to me, they&rsquo;re in the quote from the start, and you still deal with one person from first message to final file. If the shoot needs faces, I can cast them through <a href="/find-models.html">YKS Talents</a>.</p>
      <p>What that means for a brand in {place}: one conversation instead of a chain of hand-offs, decisions made on set by the person who will edit the footage, and a quote that is one all-in number rather than a rate card with extras.</p>
    </div>
  </div>
</section>'''

STEPS = '''    <div class="l-steps">
      <div class="l-step"><span class="n">1</span><h3>Brief</h3><p>Send the brief on WhatsApp or through the <a href="/quote.html">quote form</a>: what you are launching, who it is for, where it will run, and the date you need it by.</p></div>
      <div class="l-step"><span class="n">2</span><h3>Treatment &amp; quote</h3><p>I come back with an approach (look, references, shot list outline) and one all-in number covering shoot, edit and any freelancers the brief needs.</p></div>
      <div class="l-step"><span class="n">3</span><h3>Pre-production</h3><p>Locations, permissions, casting, props and a call sheet. You approve the plan before anyone is booked, so the shoot day has no surprises.</p></div>
      <div class="l-step"><span class="n">4</span><h3>Shoot</h3><p>Sony FX3 for video, Sony A7 IV for stills, real lighting and a gimbal. I direct and operate the camera myself, so what we agree is what gets shot.</p></div>
      <div class="l-step"><span class="n">5</span><h3>Edit, grade, deliver</h3><p>I edit and colour-grade what I shoot, then deliver every cut and aspect ratio you need for web, social and ads, with revisions as agreed in the quote.</p></div>
    </div>'''

COMMON_FAQ = [
    ('How much does it cost?', 'Every project is quoted as one all-in number once I know the brief: number of shoot days, locations, cast, and how many cuts you need. There is no public rate card because two &ldquo;brand films&rdquo; can be completely different jobs. The fastest route is the <a href="/quote.html">60-second quote form</a> or a WhatsApp message.'),
    ('Do you own the footage, or do we?', 'You get full usage rights to the delivered films and photos for your brand, including paid ads, as set out in the quote. If a cast member&rsquo;s usage needs to be limited (for example to a period or a market), that is agreed up front.'),
    ('Can you edit footage we already shot?', 'No. I edit what I shoot, because the edit is planned on set. I&rsquo;m not an editor-for-hire for other people&rsquo;s footage.'),
]

def faq_html(faqs):
    out = []
    for q, a in faqs:
        out.append(f'      <details>\n        <summary>{q}</summary>\n        <p>{a}</p>\n      </details>')
    return '\n'.join(out)

def strip_tags(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s))

def citygrid(current):
    links = [('production-house-bangalore', 'Bangalore'), ('production-house-mumbai', 'Mumbai'),
             ('production-house-delhi', 'Delhi NCR'), ('production-house-hyderabad', 'Hyderabad'),
             ('production-house-chennai', 'Chennai'), ('production-house-pune', 'Pune'),
             ('production-house-dubai', 'Dubai &amp; UAE'), ('production-house-india', 'All of India')]
    return '\n'.join(f'        <a href="/{s}.html">{n}</a>' for s, n in links if s != current)

SERVICES = '''        <a href="/ad-film-production.html">Ad &amp; brand films</a>
        <a href="/corporate-video-bangalore.html">Corporate video</a>
        <a href="/product-photography.html">Product &amp; e-commerce shoots</a>
        <a href="/reels-production.html">Reels for brands</a>
        <a href="/fashion-photographer-bangalore.html">Fashion &amp; lookbooks</a>
        <a href="/real-estate.html">Real estate films</a>'''

def page(d):
    slug = d['slug']; url = f'{SITE}/{slug}.html'
    faqs = d['faq'] + COMMON_FAQ
    area = d['area']
    graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {'@type': 'Service', '@id': url + '#service', 'name': d['service_name'],
             'serviceType': d['service_type'], 'url': url, 'description': strip_tags(d['desc']),
             'provider': {'@id': f'{SITE}/#business'}, 'areaServed': area,
             'availableChannel': {'@type': 'ServiceChannel', 'serviceUrl': f'{SITE}/quote.html'}},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': d['crumb_parent'][0], 'item': SITE + d['crumb_parent'][1]},
                {'@type': 'ListItem', 'position': 3, 'name': d['crumb'], 'item': url}]},
            {'@type': 'FAQPage', 'mainEntity': [
                {'@type': 'Question', 'name': strip_tags(q),
                 'acceptedAnswer': {'@type': 'Answer', 'text': strip_tags(a)}} for q, a in faqs]},
        ]}
    if d['crumb_parent'][1] == '/' + slug + '.html':
        graph['@graph'][1]['itemListElement'] = graph['@graph'][1]['itemListElement'][::2]
        graph['@graph'][1]['itemListElement'][1]['position'] = 2
    ld = json.dumps(graph, ensure_ascii=False, indent=2)
    wat = wa(d['wa'])
    sections = '\n\n'.join(d['body'])
    geo = ''
    if d.get('geo'):
        geo = f'<meta name="geo.region" content="{d["geo"][0]}" />\n<meta name="geo.placename" content="{d["geo"][1]}" />\n'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C57X89TN45"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-C57X89TN45');
</script>

<title>{d['title']}</title>
<meta name="description" content="{d['desc']}" />
<link rel="canonical" href="{url}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
{geo}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{d['og']}" />
<meta property="og:description" content="{d['desc']}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{SITE}/assets/og-cover.jpg" />
<meta property="og:image:secure_url" content="{SITE}/assets/og-cover.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{d['og']}" />
<meta property="og:locale" content="en_IN" />
<meta name="twitter:image" content="{SITE}/assets/og-cover.jpg" />
<meta name="twitter:card" content="summary_large_image" />

<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=26" />
<style>
.l-proof{{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:6px}}
.l-proof div{{border:1px solid var(--line);border-radius:14px;padding:22px 18px;text-align:center}}
.l-proof b{{display:block;font-family:'Playfair Display',serif;font-size:clamp(24px,3vw,34px);line-height:1;color:var(--ink)}}
.l-proof b span{{color:var(--accent)}}
.l-proof i{{display:block;margin-top:9px;font-style:normal;font-size:13px;letter-spacing:.04em;color:var(--muted)}}
@media(max-width:760px){{.l-proof{{grid-template-columns:1fr 1fr}}}}
.l-proofnote{{margin-top:14px;font-size:14px;color:var(--muted)}}
</style>

<script type="application/ld+json">
{ld}
</script>
{ENTITY}
<link rel="alternate" type="application/atom+xml" title="YKS Productions — Journal" href="https://yksproductions.com/blog/feed.xml" />
</head>
<body data-wa="{WA}">

<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/index.html">Back to portfolio</a>
</nav>
{CATS}

<main>

<!-- HERO -->
<section class="l-hero">
  <div class="wrap">
    <p class="l-eyebrow">{d['eyebrow']}</p>
    <h1>{d['h1']}</h1>
    <p class="l-lede"><strong class="l-hook">{d['hook']}</strong> {d['lede']}</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/quote.html">Get a quote</a>
      <a class="btn btn-ghost" href="{wat}" target="_blank" rel="noopener">WhatsApp me</a>
    </div>
  </div>
</section>

<!-- PROOF -->
<section class="l-section alt">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">Proof, not promises</p>
      <h2>Work brands have <em>actually run</em></h2>
      <p>{d['proof_line']}</p>
    </div>
{PROOF}
    <div style="margin-top:28px">
{MARRIOTT_FILM}
    </div>
    <p class="l-proofnote">Above: the campaign film from the <a href="/marriott.html">Marriott Coorg project</a>. Brand content for Vaseline (Unilever). And a <a href="{REEL}" target="_blank" rel="noopener">campaign reel that crossed 3.3M views</a> on Instagram.</p>
  </div>
</section>

{sections}

<!-- WORK -->
<section class="l-section">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">Recent work</p><h2>Stills from <em>brand productions</em></h2></div>
    <div class="l-gallery">
{gallery(d['gallery'], d.get('city',''))}
    </div>
    <p class="l-proofnote">More on the <a href="/marriott.html">brand work page</a>, <a href="/fashion.html">fashion</a> and <a href="/real-estate.html">real estate films</a>.</p>
  </div>
</section>

{who(d['place'])}

<!-- PROCESS -->
<section class="l-section">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">How it works</p><h2>From brief to <em>final cut</em></h2></div>
{STEPS}
  </div>
</section>

<!-- FAQ -->
<section class="l-section alt">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">FAQ</p><h2>Questions brands <em>ask first</em></h2></div>
    <div class="l-faq">
{faq_html(faqs)}
    </div>
  </div>
</section>

<!-- MORE -->
<section class="l-section">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">Services</p><h2>What brands <em>book</em></h2></div>
    <div class="l-citygrid">
{SERVICES}
    </div>
    <div class="l-head" style="margin-top:34px"><p class="l-eyebrow">Cities</p><h2>Production <em>by city</em></h2></div>
    <div class="l-citygrid">
{citygrid(slug)}
    </div>
  </div>
</section>

</main>

<!-- CTA -->
<section class="l-cta">
  <div class="wrap">
    <h2>{d['cta_h']}</h2>
    <p>Tell me what you&rsquo;re making and when it needs to go live. I&rsquo;ll reply with an approach and one all-in quote. Prefer a guided brief? Use the <a href="/quote.html">60-second quote form</a>.</p>
    <div class="l-form-wrap">
      <form class="l-form" data-source="{d['source']}" data-subject="New enquiry — {d['source']}">
        <div class="row2">
          <input type="text" name="name" placeholder="Your name / brand" required />
          <input type="tel" name="contact" placeholder="Phone / WhatsApp" required />
        </div>
        <input type="email" name="email" placeholder="Email (optional)" />
        <textarea name="message" placeholder="{d['placeholder']}"></textarea>
        <button type="submit" class="btn btn-fill">Send enquiry →</button>
      </form>
      <p class="l-form-ok">✓ Thank you — your enquiry is in. I'll be in touch shortly.</p>
      <p class="l-form-alt">Prefer to chat? <a href="{wat}" target="_blank" rel="noopener">Message me on WhatsApp →</a></p>
    </div>
  </div>
</section>

<footer class="l-foot">
  <div class="wrap">
    <div class="l-foot-inner">
      <div class="l-foot-brand">YKS<span>.</span>Productions</div>
      <div class="l-foot-links">
        <a href="/index.html">Portfolio</a>
        <a href="/production-house-india.html">Production house</a>
        <a href="/faq.html">FAQ</a>
        <a href="/quote.html">Get a quote</a>
        <a href="https://instagram.com/yks_photoworks" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
    <p class="l-related">
      Production house: <a href="/production-house-bangalore.html">Bangalore</a> · <a href="/production-house-mumbai.html">Mumbai</a> · <a href="/production-house-delhi.html">Delhi NCR</a> · <a href="/production-house-hyderabad.html">Hyderabad</a> · <a href="/production-house-chennai.html">Chennai</a> · <a href="/production-house-pune.html">Pune</a> · <a href="/production-house-dubai.html">Dubai</a>
    </p>
    <p class="l-related">
      Services: <a href="/ad-film-production.html">Ad &amp; brand films</a> · <a href="/video-production.html">Video production</a> · <a href="/corporate-video-bangalore.html">Corporate video</a> · <a href="/product-photography.html">Product photography</a> · <a href="/reels-production.html">Reels production</a> · <a href="/photography.html">Photography</a> · <a href="/content-creation.html">Content creator</a>
    </p>
  </div>
</footer>

<script src="/js/landing.js?v=20"></script>
<script src="/js/fx.js?v=6"></script>
<script src="/js/lead.js?v=3"></script>
<script src="/js/chat-config.js"></script>
<script src="/js/chat.js?v=9"></script>
  <script src="/js/search.js?v=12" defer></script>
<script src="/js/source.js?v=1"></script>
<script src="/js/preferred-source.js?v=1" defer></script>
<script src="/js/rail.js?v=6"></script>
</body>
</html>
'''

def sec(eyebrow, h2, inner, alt=False):
    return f'''<section class="l-section{' alt' if alt else ''}">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">{eyebrow}</p><h2>{h2}</h2></div>
{inner}
  </div>
</section>'''

def prose(*ps):
    return '    <div class="l-prose">\n' + '\n'.join(f'      <p>{p}</p>' for p in ps) + '\n    </div>'

def cards(items):
    out = ['    <div class="l-grid">']
    for t, h, p in items:
        out.append(f'      <div class="l-card"><span class="t">{t}</span><h3>{h}</h3><p>{p}</p></div>')
    out.append('    </div>')
    return '\n'.join(out)

def table(head, rows):
    th = ''.join(f'<th>{h}</th>' for h in head)
    trs = '\n'.join('          <tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'''    <div class="l-tablewrap">
      <table class="l-table">
        <thead><tr>{th}</tr></thead>
        <tbody>
{trs}
        </tbody>
      </table>
    </div>'''

DELIVERABLES = table(['Format', 'What it&rsquo;s for', 'Typical cuts'], [
    ['Brand film', 'Homepage, launch, investor and sales decks', '60&ndash;120 s master + short cut-downs'],
    ['Ad film (digital)', 'Meta, YouTube and OTT pre-roll campaigns', '6 s, 15 s, 30 s versions in 9:16, 1:1, 16:9'],
    ['Corporate video', 'Company profile, culture, hiring, events', 'Master film + social edits'],
    ['Product video &amp; stills', 'E-commerce listings, launches, ads', 'Hero shots, detail shots, short loops'],
    ['Reels batch', 'Instagram and YouTube Shorts', 'A month of vertical edits from one shoot day'],
    ['Testimonials', 'Customer and founder stories', 'Interview cuts with b-roll'],
])

# ─────────────────────────── PAGE COPY ───────────────────────────
PAGES = []

def city_page(slug, city, place, title, desc, og, h1, hook, lede, proof_line, body, faq, gal, geo, area, wa_text, cta_h, source):
    PAGES.append(dict(slug=slug, city=city, place=place, title=title, desc=desc, og=og,
        eyebrow=f'Production house · {city}', h1=h1, hook=hook, lede=lede, proof_line=proof_line,
        body=body, faq=faq, gallery=gal, geo=geo, area=area, wa=wa_text, cta_h=cta_h, source=source,
        service_name=f'Video production & brand films in {city}', service_type='Video production',
        crumb=f'Production house in {city}', crumb_parent=('Production house in India', '/production-house-india.html'),
        placeholder='What are you making — brand film, ad, product shoot, reels, corporate video…'))

def city_area(name, region, country='India'):
    return {'@type': 'City', 'name': name, 'containedInPlace': {'@type': 'State' if country == 'India' else 'AdministrativeArea', 'name': region, 'containedInPlace': {'@type': 'Country', 'name': country}}}

# ── BANGALORE (home base, flagship) ──
city_page('production-house-bangalore', 'Bangalore', 'Bangalore',
  'Production House in Bangalore | Brand Films, Ads &amp; Shoots',
  'Independent production house in Bangalore for brand films, ad films, corporate video, product shoots and reels. Directed, shot and edited by Yedukrishna Suresh.',
  'Production House in Bangalore — YKS Productions',
  'An independent production house <em>in Bangalore</em>',
  'Brand films, ad films, product shoots and reels, made by the person you actually brief.',
  'I&rsquo;m Yedukrishna Suresh. YKS Productions is my independent production house, based in Bangalore. I direct, shoot and edit video and photography for startups, D2C labels, hotels, real-estate developers and companies who want work that looks like it cost more than it did, without a big-agency chain in the middle.',
  'Bangalore is home base, so there is no travel line in a Bangalore quote.',
  [sec('Why brands here call me', 'Bangalore has plenty of production houses. <em>Here&rsquo;s the difference.</em>', prose(
     'Search &ldquo;production house in Bangalore&rdquo; and you get two kinds of result: big ad-film houses built for TV-scale budgets, and directory listings that send your number to ten vendors at once. Most Bangalore briefs sit between those two: a launch film for a funded startup, a month of reels for a D2C brand, a product shoot for a new range, a culture film for hiring.',
     'That middle is where I work. You get <strong>cinema-grade camera, light and grade</strong> (Sony FX3, Aputure and Godox lighting, a gimbal and slider) with <strong>one decision-maker</strong>. The person who reads your brief is the person behind the camera and the person in the edit, which is why the film comes back looking like the treatment you approved.',
     'Bangalore companies tend to need the same footage working in many places at once: the homepage, a LinkedIn launch post, Meta ads, a sales deck and a hiring page. I plan the shoot for that from day one, so a single production day returns a master film, short ad cut-downs and vertical edits instead of one video that only fits one slot.')),
   sec('What I make in Bangalore', 'Five kinds of <em>production</em>', cards([
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Brand films and digital ads</a>', 'Launch films, brand stories and 6/15/30-second ad cuts for Meta and YouTube. Concept, casting and shoot in one quote.'),
     ('Corporate', '<a href="/corporate-video-bangalore.html">Corporate video</a>', 'Company profiles, founder films, culture and hiring videos, testimonials and event recaps for Bangalore offices and tech parks.'),
     ('Products', '<a href="/product-photography.html">Product &amp; e-commerce shoots</a>', 'Marketplace-ready white-background stills, lifestyle sets and short product loops for launches and listings.'),
     ('Social', '<a href="/reels-production.html">Reels for brands</a>', 'Batch shoot days that return a month of vertical edits. The approach behind a campaign reel past 3.3M views.'),
     ('Fashion', '<a href="/fashion-photographer-bangalore.html">Fashion &amp; lookbooks</a>', 'Campaigns, lookbooks and catalogue shoots for labels, with models cast through YKS Talents if you need them.'),
     ('Hospitality', '<a href="/hotel-photographer-bangalore.html">Hotels &amp; resorts</a>', 'Property films, rooms, F&amp;B and reels. The Marriott Coorg campaign is a short drive from here.')]), alt=True),
   sec('Locations', 'Shooting around <em>Bangalore</em>', prose(
     'The city gives a lot of looks within an hour: glass and steel along Outer Ring Road and Whitefield for tech and corporate work; the older bungalows and tree cover of Basavanagudi, Malleshwaram and Frazer Town for warmer brand stories; cafés and streets in Indiranagar and Koramangala for lifestyle and D2C; and Nandi Hills or the roads out towards Kanakapura when a launch film wants open sky.',
     'Office and tech-park shoots usually need a facilities pass and a security briefing, and public parks or heritage spots can need written permission. I flag what each location needs in the pre-production plan, so nothing gets stopped at a gate on the morning of the shoot.',
     'For studio looks (seamless backdrops, controlled product light) we hire a studio floor for the day and it goes into the same quote. I don&rsquo;t own a studio, and I won&rsquo;t pretend to.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Are you a production house or a freelancer?', 'Both, honestly. YKS Productions is an independent production house run by one person, me. I take a project end to end (concept, casting, shoot, edit and delivery) the way a production house does, and I bring in freelancers per project only when a brief needs them. There is no permanent crew and no office.'),
   ('What does a production house actually do?', 'A production house turns a brief into finished video or photography. That covers pre-production (concept, script or shot list, locations, casting, permissions), production (the shoot) and post-production (edit, colour, sound, every export). An ad agency decides the message; the production house makes it.'),
   ('Can you shoot at our office or tech park in Bangalore?', 'Yes. I&rsquo;ll need the facilities contact early to arrange passes and any building rules on filming, and I plan around working hours so the shoot doesn&rsquo;t disrupt your team.'),
   ('Can you cast models or actors for the shoot?', 'Yes, through <a href="/find-models.html">YKS Talents</a>. Usage for the cast is agreed in the quote.')],
  ['marriott7','topreel','fashion','marriott1','suman','realestate'],
  ('IN-KA', 'Bengaluru, Karnataka, India'), city_area('Bengaluru', 'Karnataka'),
  'Hi Yedukrishna, I\'d like a quote for a production in Bangalore.',
  'Make something in Bangalore <em>worth watching</em>', 'Production House · Bangalore')

# ── MUMBAI ──
city_page('production-house-mumbai', 'Mumbai', 'Mumbai',
  'Production House in Mumbai | Ad Films, Brand Films, Reels',
  'An independent production house for Mumbai brands: digital ad films, brand films, catalogue and product shoots and reels, directed, shot and edited by Yedukrishna Suresh.',
  'Production House in Mumbai — YKS Productions',
  'A small production house <em>for Mumbai brands</em>',
  'Mumbai is India&rsquo;s ad-film capital. Not every brief needs an ad-film-house budget.',
  'I&rsquo;m Yedukrishna Suresh, and YKS Productions is my independent production house. I work between Bangalore, Mumbai and Dubai, making digital ad films, brand films, product and catalogue shoots and reels for Mumbai labels, D2C brands and companies that want the finish of a big production with one person accountable for it.',
  'I work between Bangalore, Mumbai and Dubai. Travel is folded into one all-in quote.',
  [sec('Why a smaller production house', 'The gap between <em>ad-film houses and freelancers</em>', prose(
     'People in Mumbai search for &ldquo;small production houses&rdquo; for a reason. The city&rsquo;s big ad-film houses are built for broadcast TVCs with large units, and their minimums show it. At the other end, a freelancer with a camera can shoot, but may not handle concept, casting, permissions and the edit.',
     'I sit in between. For a <strong>digital ad, a brand film, a catalogue shoot or a reels batch</strong>, you get treatment, casting, shoot, edit and grade from one person, with freelancers added per project only when the brief calls for them. It suits D2C fashion and beauty labels, consumer brands launching on Instagram and YouTube, and corporate teams who need a film without a pitch process.',
     'If your brief genuinely needs a large broadcast unit, I&rsquo;ll say so in the first reply rather than stretching to fit it.')),
   sec('What Mumbai brands book', 'Where I&rsquo;m <em>most useful</em>', cards([
     ('Digital ads', '<a href="/ad-film-production.html">Ad films for Meta &amp; YouTube</a>', 'Concept-led 15 and 30-second spots with 9:16 and 1:1 versions, built for performance, not just a showreel.'),
     ('Fashion', '<a href="/fashion.html">Catalogue &amp; lookbook shoots</a>', 'Model-on catalogue, lookbooks and campaign stills for labels, with a short reel cut from the same day.'),
     ('Beauty &amp; personal care', 'Product-led brand content', 'Packshots, texture and on-skin frames for personal-care launches. My brand work includes content for Vaseline (Unilever).'),
     ('Products', '<a href="/product-photography.html">Product &amp; e-commerce</a>', 'Marketplace white-background images plus lifestyle frames and loops.'),
     ('Social', '<a href="/reels-production.html">Reels production</a>', 'A month of vertical content from one planned shoot day.'),
     ('Corporate', 'Company &amp; founder films', 'For BKC, Lower Parel and Andheri offices: profile films, leadership messages, event recaps.')]), alt=True),
   sec('Locations', 'Shooting in <em>Mumbai</em>', prose(
     'Mumbai gives a production more texture per kilometre than almost anywhere: Art Deco along Marine Drive, the old streets of Colaba, Fort and Bandra, sea-facing light at Worli and Juhu, and modern towers around BKC for corporate work. For controlled set-ups there are plenty of hireable studio floors in Andheri and Goregaon; we book one for the day and it sits inside the quote.',
     'Two planning notes. Public locations, railway property and beaches often need permission, and some need it well ahead, so I build that into pre-production. And the <strong>monsoon (roughly June to September)</strong> changes outdoor plans: I schedule exteriors around it or design the shoot for interiors from the start.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Are you based in Mumbai?', 'I&rsquo;m based in Bangalore and work between Bangalore, Mumbai and Dubai. For Mumbai shoots I travel in, and travel is included in the one all-in quote rather than added later.'),
   ('Can you make a TV commercial?', 'My work is built for digital: Meta, YouTube, OTT pre-roll and the web. For a broadcast TVC with a large unit and agency approvals at every stage, a bigger ad-film house is the right call, and I&rsquo;ll tell you that honestly.'),
   ('Can you handle a catalogue shoot with models?', 'Yes. I plan the looks, cast models through <a href="/find-models.html">YKS Talents</a>, book the studio and stylist as needed, and deliver edited catalogue images plus optional reels from the same day.'),
   ('Do you work with ad agencies in Mumbai?', 'Yes. If your agency owns the idea, I can take the production side: treatment, shoot and edit. The agency or brand keeps creative sign-off.')],
  ['suman','topreel','olivia','marriott1','fashion','dxb3'],
  ('IN-MH', 'Mumbai, Maharashtra, India'), city_area('Mumbai', 'Maharashtra'),
  'Hi Yedukrishna, I\'d like a quote for a production in Mumbai.',
  'Make your next Mumbai shoot <em>count</em>', 'Production House · Mumbai')

# ── DELHI NCR ──
city_page('production-house-delhi', 'Delhi NCR', 'Delhi NCR',
  'Production House in Delhi NCR | Corporate &amp; Brand Films',
  'Independent production house for Delhi, Gurugram and Noida: corporate films, brand films, digital ads, product shoots and reels, directed and shot by Yedukrishna Suresh.',
  'Production House in Delhi NCR — YKS Productions',
  'Corporate and brand films <em>across Delhi NCR</em>',
  'From Gurugram boardrooms to Delhi fashion labels: one director, start to finish.',
  'I&rsquo;m Yedukrishna Suresh, and YKS Productions is my independent production house. For companies and brands in Delhi, Gurugram and Noida I make corporate films, brand films, digital ad films, product shoots and reels, and I take each one from brief to final cut myself.',
  'Delhi NCR shoots are planned as travel shoots, with travel inside one all-in quote.',
  [sec('Why NCR teams call me', 'Independent corporate film-making, <em>without the chain</em>', prose(
     'NCR is where many Indian head offices sit: corporate towers in Gurugram&rsquo;s Cyber City and Golf Course Road, tech and media in Noida, and the policy and consulting world in central Delhi. That means a lot of <strong>corporate film</strong> work: profile films, leadership messages, CSR stories, culture and hiring videos, conference recaps.',
     'The usual problem with corporate film is that it looks like corporate film: flat light, stiff interviews, a stock track. I come from cinematography, so I light interviews properly, record clean sound, find real b-roll in your office or plant, and cut to a pulse. You approve a treatment first, so there are no surprises in the edit.',
     'Delhi is also one of India&rsquo;s biggest fashion and ethnic-wear markets, and I shoot <a href="/fashion.html">lookbooks and campaign films</a> for labels as well as corporate work.')),
   sec('What NCR brands book', 'Common <em>briefs</em>', cards([
     ('Corporate', 'Company profile &amp; leadership films', 'For Gurugram, Noida and Delhi offices: interviews, b-roll, motion titles and a master film with social cut-downs.'),
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Digital ad films</a>', '15 and 30-second spots and launch films built for Meta, YouTube and LinkedIn.'),
     ('Explainers', 'Product &amp; explainer videos', 'Live-action explainers for SaaS and services: a founder or product expert on camera, real screens, clear story.'),
     ('Fashion', 'Ethnic-wear &amp; label campaigns', 'Lookbooks, catalogue and campaign reels, with models cast via YKS Talents.'),
     ('Products', '<a href="/product-photography.html">Product shoots</a>', 'E-commerce and lifestyle imagery for D2C brands launching on marketplaces.'),
     ('Social', '<a href="/reels-production.html">Reels batches</a>', 'A month of vertical content for brand and founder accounts.')]), alt=True),
   sec('Locations &amp; seasons', 'Shooting in <em>Delhi, Gurugram and Noida</em>', prose(
     'Delhi has some of the best architecture in the country for a brand film: Lutyens&rsquo; avenues, Lodhi Garden, Mehrauli, Hauz Khas and the old lanes of Chandni Chowk. Many monuments and protected sites need a filming permission, so I check that while planning rather than on the day. For corporate work, Gurugram and Noida campuses give clean, modern backdrops; building security and facilities passes go into the pre-production plan.',
     'Seasons matter more in NCR than most cities. <strong>October to March</strong> gives the best outdoor light, while peak summer afternoons and winter smog both shape when we schedule exteriors. When a date can&rsquo;t move, I design the film around interiors.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Do you cover Gurugram and Noida as well as Delhi?', 'Yes, all of NCR. Many corporate shoots are in Gurugram and Noida; brand and fashion work often uses Delhi locations.'),
   ('Are you an independent corporate film maker?', 'Yes. YKS Productions is independent and run by one person: I direct, shoot and edit, and bring in freelancers per project only when the brief needs them.'),
   ('Can you film a conference or internal event?', 'Yes. Event recaps and highlight films are a common NCR brief. I plan the key moments with you beforehand so the recap tells a story rather than just showing a crowd.'),
   ('Where are you based?', 'Bangalore. I travel for Delhi NCR shoots, and travel is included in the all-in quote.')],
  ['dxb3','marriott7','suman','topreel','realestate','olivia'],
  ('IN-DL', 'New Delhi, Delhi, India'),
  [city_area('New Delhi', 'Delhi'), city_area('Gurugram', 'Haryana'), city_area('Noida', 'Uttar Pradesh')],
  'Hi Yedukrishna, I\'d like a quote for a production in Delhi NCR.',
  'Make a corporate film people <em>actually watch</em>', 'Production House · Delhi NCR')

# ── HYDERABAD ──
city_page('production-house-hyderabad', 'Hyderabad', 'Hyderabad',
  'Production House in Hyderabad | Corporate &amp; Brand Films',
  'Independent production house for Hyderabad: corporate films for HITEC City companies, brand and ad films, real-estate launch films, product shoots and reels by Yedukrishna Suresh.',
  'Production House in Hyderabad — YKS Productions',
  'Brand and corporate films <em>for Hyderabad</em>',
  'Tech campuses, pharma, real estate and fast-growing consumer brands, filmed like cinema.',
  'I&rsquo;m Yedukrishna Suresh. YKS Productions is my independent production house. For Hyderabad companies and brands I make corporate films, brand and ad films, real-estate launch films, product shoots and reels, and I direct, shoot and edit every one myself.',
  'Hyderabad shoots are planned as travel shoots, with travel inside one all-in quote.',
  [sec('Why Hyderabad teams call me', 'A city of <em>launches</em>', prose(
     'Hyderabad keeps launching things: new tech and GCC campuses in HITEC City, Gachibowli and the Financial District, pharma and life-sciences facilities, residential and commercial projects across the west of the city, and consumer brands growing out of all of it. Each of those needs film: a campus or culture film for hiring, a capability film for a plant, a <strong>launch film for a project</strong>, product content for a D2C label.',
     'I make that work with one decision-maker. You brief me, I write the treatment, direct and shoot it, and cut it. That is especially useful for <a href="/real-estate.html">real-estate launch films</a>, where I&rsquo;ve built a body of property work in Dubai: walkthroughs, lifestyle sequences and vertical reels made to sell a project before it&rsquo;s finished.',
     'For regulated settings like pharma plants and labs, I work to your site rules on what can and can&rsquo;t be filmed, and the edit goes through your compliance review before anything is published.')),
   sec('What Hyderabad brands book', 'Common <em>briefs</em>', cards([
     ('Corporate', 'Campus, culture &amp; hiring films', 'For tech and GCC teams: real people, real spaces, interviews lit properly.'),
     ('Real estate', '<a href="/real-estate.html">Project launch films</a>', 'Show-flat walkthroughs, amenity films, lifestyle sequences and reels for launches.'),
     ('Industrial', 'Plant &amp; capability films', 'Manufacturing and pharma capability films for investors, partners and trade shows.'),
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Digital ad films</a>', 'Launch spots and brand stories cut for Meta, YouTube and LinkedIn.'),
     ('Products', '<a href="/product-photography.html">Product shoots</a>', 'E-commerce and lifestyle stills for consumer brands.'),
     ('Social', '<a href="/reels-production.html">Reels production</a>', 'Batch shoot days that return a month of vertical content.')]), alt=True),
   sec('Locations', 'Shooting in <em>Hyderabad</em>', prose(
     'The contrast is the point in Hyderabad: glass towers and wide roads in the Financial District against the old city around Charminar, the Qutb Shahi tombs, and the rocky landscapes on the edge of town. Heritage and protected sites usually need permission, and some campuses have strict visitor and photography rules, so both go into the pre-production plan.',
     'Summer afternoons are harsh, so exteriors get scheduled for early morning and the last hour of light. Interiors and corporate interviews run through the middle of the day.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Do you make corporate films in Hyderabad?', 'Yes: company profiles, campus and culture films, leadership messages, capability films and event recaps. I travel in from Bangalore and include travel in the quote.'),
   ('Can you make a launch film for a real-estate project?', 'Yes. I plan around what exists on the day (a show flat, amenities, the site, renders you supply) and build a film and reels that sell the lifestyle. See the <a href="/real-estate.html">real estate work</a>.'),
   ('Can you film inside a pharma or manufacturing facility?', 'Yes, within your site&rsquo;s safety and confidentiality rules. Tell me the restrictions at the brief stage, and the edit goes through your review before release.'),
   ('Are you a production house or a freelancer?', 'An independent production house run by one person, me. Freelancers join per project only when a brief needs them.')],
  ['tower','realestate','topreel','marriott7','dxb1','fashion'],
  ('IN-TG', 'Hyderabad, Telangana, India'), city_area('Hyderabad', 'Telangana'),
  'Hi Yedukrishna, I\'d like a quote for a production in Hyderabad.',
  'Launching something in Hyderabad? <em>Let&rsquo;s film it.</em>', 'Production House · Hyderabad')

# ── CHENNAI ──
city_page('production-house-chennai', 'Chennai', 'Chennai',
  'Production House in Chennai | Brand Films, Ads &amp; Reels',
  'Independent production house for Chennai brands: brand films, digital ads, corporate and capability films, product and catalogue shoots and vertical reels by Yedukrishna Suresh.',
  'Production House in Chennai — YKS Productions',
  'Brand films and reels <em>for Chennai</em>',
  'Manufacturing, SaaS, silk, jewellery and food: Chennai brands have stories worth filming properly.',
  'I&rsquo;m Yedukrishna Suresh, and YKS Productions is my independent production house. For Chennai brands and companies I make brand films, digital ad films, corporate and capability films, product and catalogue shoots and vertical reels, directing, shooting and editing them myself.',
  'Chennai shoots are planned as travel shoots, with travel inside one all-in quote.',
  [sec('Why Chennai brands call me', 'Craft brands and <em>engineering brands</em>', prose(
     'Chennai has two kinds of brand that rarely get filmed well. One is the <strong>craft brand</strong>: silk, jewellery, textiles and food businesses with decades of heritage, now selling on Instagram and marketplaces. The other is the <strong>engineering brand</strong>: auto components, manufacturing and SaaS companies that need to explain what they do to investors, partners and hires.',
     'Both need the same thing: someone who can find the beauty in the process. For a craft label that means texture, hands and close detail, and models who wear the product well. For an engineering company it means lighting a factory floor or a product so it looks precise rather than industrial, and an edit that explains without boring.',
     'Vertical video is a big part of what Chennai brands ask for, so most shoots are planned to deliver <a href="/reels-production.html">reels</a> alongside the main film.')),
   sec('What Chennai brands book', 'Common <em>briefs</em>', cards([
     ('Fashion &amp; silk', 'Saree, textile &amp; jewellery campaigns', 'Campaign stills, catalogue images and reels, with models cast via YKS Talents.'),
     ('Industrial', 'Capability &amp; plant films', 'For auto, manufacturing and engineering companies: process, precision, people.'),
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Digital ad films</a>', 'Launch spots and brand stories cut for Meta and YouTube.'),
     ('Corporate', 'SaaS &amp; company films', 'Culture, hiring and founder films for Chennai&rsquo;s tech companies.'),
     ('Products', '<a href="/product-photography.html">Product &amp; catalogue</a>', 'Marketplace-ready product images and lifestyle frames.'),
     ('Food', 'Restaurant &amp; food brands', 'Hero dishes, process shots and short food reels.')]), alt=True),
   sec('Locations', 'Shooting in <em>Chennai</em>', prose(
     'Chennai has a strong visual identity: the temple streets and colourful houses of Mylapore, colonial buildings around George Town and Egmore, long beaches along Marina and the East Coast Road, and modern tech corridors on OMR. Temples, heritage buildings and beaches can need permission, and I check that during planning.',
     'Heat and humidity shape the schedule for much of the year, so outdoor work goes early morning or late afternoon, and kit and talent get proper breaks. The northeast monsoon (roughly October to December) is the main season to plan around.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Do you shoot saree and jewellery campaigns?', 'Yes. Fashion and textile work is a big part of my portfolio, including campaign reels for a saree label. I can cast models through <a href="/find-models.html">YKS Talents</a> and deliver stills and reels from the same day.'),
   ('Can you make vertical video for our brand?', 'Yes. Most shoots are planned to return 9:16 edits for Instagram and YouTube Shorts as well as the main film. See <a href="/reels-production.html">reels production</a>.'),
   ('Do you make factory or capability films?', 'Yes, within your plant&rsquo;s safety rules. I plan the shot list with your team so production isn&rsquo;t disrupted.'),
   ('Where are you based?', 'Bangalore. Chennai is a short trip, and travel is folded into the all-in quote.')],
  ['suman','fashion','topreel','marriott3','olivia','realestate'],
  ('IN-TN', 'Chennai, Tamil Nadu, India'), city_area('Chennai', 'Tamil Nadu'),
  'Hi Yedukrishna, I\'d like a quote for a production in Chennai.',
  'Give your Chennai brand <em>the film it deserves</em>', 'Production House · Chennai')

# ── PUNE ──
city_page('production-house-pune', 'Pune', 'Pune',
  'Production House in Pune | Corporate Video &amp; Brand Films',
  'Independent production house for Pune: corporate video, capability films, brand and ad films, product shoots and reels for IT, manufacturing, education and real-estate brands.',
  'Production House in Pune — YKS Productions',
  'Corporate video and brand films <em>in Pune</em>',
  'IT parks, auto plants, campuses and new homes: Pune is full of work that deserves better video.',
  'I&rsquo;m Yedukrishna Suresh, and YKS Productions is my independent production house. For Pune companies I make corporate videos, capability films, brand and ad films, product shoots and reels, directing, shooting and editing each one myself.',
  'Pune shoots are planned as travel shoots, often paired with Mumbai, with travel inside one all-in quote.',
  [sec('Why Pune teams call me', 'Corporate video <em>that doesn&rsquo;t look corporate</em>', prose(
     'Pune&rsquo;s economy is unusually varied: IT and services in Hinjewadi, Kharadi and Magarpatta; automotive and engineering around Chakan and Pimpri-Chinchwad; one of India&rsquo;s biggest concentrations of colleges and universities; and a steady pipeline of residential projects. That makes Pune one of the strongest markets for <strong>corporate video production</strong>: profile films, capability films, campus films and launch videos.',
     'My job is to make that work feel human. Real people interviewed well, b-roll that shows what actually happens in your building, light that flatters a factory floor or a lecture hall, and an edit with a clear story. You get a master film plus the cut-downs your HR, sales and social teams need.',
     'Because Pune is close to Mumbai, a lot of my Pune work is planned alongside Mumbai shoots, which keeps travel efficient for both.')),
   sec('What Pune brands book', 'Common <em>briefs</em>', cards([
     ('Corporate', 'Company profile &amp; culture films', 'For IT and services teams: leadership, culture and hiring videos with social cut-downs.'),
     ('Industrial', 'Capability &amp; plant films', 'For auto and engineering firms: process, quality and scale, shot to your safety rules.'),
     ('Education', 'Campus &amp; admissions films', 'For colleges and institutes: campus life, faculty and student stories, reels for admissions season.'),
     ('Real estate', '<a href="/real-estate.html">Project launch films</a>', 'Show-flat walkthroughs, amenity films and reels for launches.'),
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Digital ad films</a>', 'Spots and brand stories for Meta, YouTube and LinkedIn.'),
     ('Social', '<a href="/reels-production.html">Reels production</a>', 'Batch shoot days for brand and founder accounts.')]), alt=True),
   sec('Locations', 'Shooting in <em>Pune</em>', prose(
     'Pune offers old and new within a short drive: the wadas and lanes of the old Peth areas, leafy Koregaon Park and the Camp area, modern IT campuses in Hinjewadi and Kharadi, and the Sahyadri ghats just outside the city, which turn green and dramatic after the monsoon. Campuses and plants usually need visitor passes and photography approvals, which I arrange through your facilities team during planning.',
     'The monsoon (roughly June to September) is beautiful on camera but unpredictable, so I schedule exteriors with a weather fallback.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Do you offer corporate video production in Pune?', 'Yes: profile films, capability films, culture and hiring videos, campus films and event recaps. Travel from Bangalore is included in the all-in quote.'),
   ('Can you film inside our plant?', 'Yes, within your safety and confidentiality rules. Share the restrictions at the brief stage and we plan the shot list around them.'),
   ('Can you make admissions content for a college?', 'Yes. A campus film plus a set of vertical reels from the same shoot covers most admissions campaigns.'),
   ('Are you a production house or a freelancer?', 'An independent production house run by one person, me. I bring in freelancers per project only when a brief needs them.')],
  ['realestate','topreel','marriott3','fashion','dxb3','suman'],
  ('IN-MH', 'Pune, Maharashtra, India'), city_area('Pune', 'Maharashtra'),
  'Hi Yedukrishna, I\'d like a quote for a production in Pune.',
  'Make a Pune film people <em>remember</em>', 'Production House · Pune')

# ── DUBAI (phase 2) ──
city_page('production-house-dubai', 'Dubai', 'Dubai',
  'Production House in Dubai | Brand, Corporate &amp; Property Films',
  'Independent production house in Dubai for brand films, corporate video, real-estate films, product shoots and reels across the UAE, directed, shot and edited by Yedukrishna Suresh.',
  'Production House in Dubai — YKS Productions',
  'An independent production house <em>in Dubai</em>',
  'Brand films, property films and reels for UAE brands, from one director, not a production chain.',
  'I&rsquo;m Yedukrishna Suresh. YKS Productions is my independent production house, working between Dubai and Bangalore. In the UAE I make real-estate and property films, brand and corporate films, product shoots and reels for developers, brokerages, hospitality and consumer brands.',
  'I work between Dubai and Bangalore. UAE quotes are one all-in number.',
  [sec('Why UAE brands call me', 'Dubai has hundreds of production companies. <em>Here&rsquo;s the difference.</em>', prose(
     'Most &ldquo;production companies in Dubai&rdquo; are built around a sales team, a producer and a crew list. That suits a big TVC. Most UAE briefs are smaller and faster: a <strong>project launch film for a developer</strong>, a month of reels for a brokerage, a brand film for a restaurant or hotel, a corporate profile for a free-zone company.',
     'For those, you get better work and fewer hand-offs from one person who writes the treatment, directs, shoots and edits. My Dubai portfolio is weighted towards <a href="/real-estate.html">luxury real-estate films</a>: walkthroughs, lifestyle sequences and vertical reels that sell a property. My India work adds the brand side: the Marriott campaign, Vaseline (Unilever) content, and a campaign reel past 3.3M views.',
     'For deeper UAE detail, see <a href="/corporate-video-dubai.html">corporate video in Dubai</a> and <a href="/videographer-dubai.html">videographer in Dubai</a>.')),
   sec('What UAE brands book', 'Common <em>briefs</em>', cards([
     ('Real estate', '<a href="/real-estate-videographer-dubai.html">Property &amp; launch films</a>', 'Walkthroughs, amenity and lifestyle films, and reels for portals and social.'),
     ('Corporate', '<a href="/corporate-video-dubai.html">Corporate video</a>', 'Company profiles, founder films and event recaps for Dubai and Abu Dhabi offices.'),
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Brand &amp; digital ad films</a>', 'Launch films and short spots for Meta, YouTube and LinkedIn.'),
     ('Hospitality', 'Hotels, restaurants &amp; venues', 'Property films, F&amp;B stills and reels, the same kind of work as the Marriott campaign.'),
     ('Products', '<a href="/product-photography.html">Product shoots</a>', 'E-commerce and lifestyle imagery for UAE consumer brands.'),
     ('Social', '<a href="/reels-production.html">Reels production</a>', 'A month of vertical content from one planned shoot day.')]), alt=True),
   sec('Locations &amp; permits', 'Shooting in <em>Dubai and the UAE</em>', prose(
     'Dubai can look like ten different cities in a day: Downtown and DIFC towers, the Marina and JBR waterfront, Palm Jumeirah, Al Fahidi and the creek for heritage texture, and the desert an hour out. Filming in many public places in Dubai needs a permit, and malls, hotels and developments have their own approval processes, so I plan locations around what is permitted and allow time for approvals.',
     'The best outdoor months are roughly <strong>October to April</strong>. In summer, exteriors move to sunrise and the hour before sunset, and the rest of the day goes to interiors. I also shoot in Abu Dhabi and across the UAE. For Riyadh, Doha or Muscat briefs, ask and I&rsquo;ll tell you honestly whether I can do it well.')),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  [('Are you a production company in Dubai?', 'I run YKS Productions, an independent production house, between Dubai and Bangalore. It&rsquo;s one person, me: I direct, shoot and edit, and bring in freelancers per project only when a brief needs them.'),
   ('Do you handle filming permits?', 'I plan every location around what&rsquo;s permitted and flag where a permit or venue approval is needed, then build the timeline around it. Tell me your locations early and I&rsquo;ll say what each one needs.'),
   ('Do you shoot in Abu Dhabi and the other emirates?', 'Yes. See <a href="/videographer-abu-dhabi.html">videographer in Abu Dhabi</a> for more.'),
   ('Can you make property films for off-plan launches?', 'Yes. I work with what exists (show units, amenities, the site and any renders you supply) and build a film and reels around the lifestyle you&rsquo;re selling. See the <a href="/real-estate.html">real estate work</a>.')],
  ['tower','dxb1','dxb3','realestate','topreel','marriott7'],
  ('AE-DU', 'Dubai, United Arab Emirates'),
  [{'@type': 'City', 'name': 'Dubai', 'containedInPlace': {'@type': 'Country', 'name': 'United Arab Emirates'}},
   {'@type': 'City', 'name': 'Abu Dhabi', 'containedInPlace': {'@type': 'Country', 'name': 'United Arab Emirates'}}],
  'Hi Yedukrishna, I\'d like a quote for a production in Dubai.',
  'Make your next UAE launch <em>look the part</em>', 'Production House · Dubai')
for d in PAGES:
    if d['slug'] == 'production-house-dubai':
        d['crumb_parent'] = ('Dubai & UAE', '/dubai/')

INDIA_AREA = {'@type': 'Country', 'name': 'India'}
INDIA_UAE = [{'@type': 'Country', 'name': 'India'}, {'@type': 'Country', 'name': 'United Arab Emirates'}]

def svc_page(**k):
    k.setdefault('city', ''); k.setdefault('geo', None)
    k.setdefault('crumb_parent', ('Production house in India', '/production-house-india.html'))
    PAGES.append(k)

# ── INDIA HUB ──
svc_page(slug='production-house-india', place='India',
  title='Independent Production House in India | YKS Productions',
  desc='YKS Productions is an independent production house in India run by Yedukrishna Suresh: brand films, ad films, corporate video, product shoots and reels in Bangalore, Mumbai, Delhi NCR and beyond.',
  og='Independent Production House in India — YKS Productions',
  eyebrow='Production house · India', h1='An independent production house, <em>run by one director</em>',
  hook='Brand films, ad films, corporate video, product shoots and reels, made end to end by the person you brief.',
  lede='I&rsquo;m Yedukrishna Suresh. YKS Productions is my independent production house, based in Bangalore and working across India and the UAE. No office, no layers: I take a project from brief to final cut, and bring in freelancers per project only when the work needs them.',
  proof_line='Eight years behind the camera, brand work for Marriott and Vaseline (Unilever), and a campaign reel past 3.3M views.',
  body=[sec('What a production house does', 'What does a production house <em>actually do?</em>', prose(
     'A production house turns an idea into finished film or photography. Agencies and brands decide <em>what</em> to say; the production house works out <em>how</em> to make it, then makes it. The work runs in three stages:',
     '<strong>Pre-production:</strong> treatment, script or shot list, locations and permissions, casting, schedule and call sheet. <strong>Production:</strong> the shoot itself, with camera, lighting, sound and direction. <strong>Post-production:</strong> edit, colour grade, sound, titles and every export you need, from a 16:9 master to 9:16 reels.',
     'Large production houses split those stages across departments. In mine, one person carries the idea from the first call to the final file, which is why the finished work tends to match the treatment you approved.')),
   sec('Big house vs independent', 'Which kind of production house <em>do you need?</em>', table(
     ['', 'Large ad-film house', 'Independent (YKS Productions)'],
     [['Best for', 'Broadcast TVCs, celebrity shoots, large units', 'Digital ads, brand films, corporate video, product shoots, reels'],
      ['Who you deal with', 'Producer, then director, then editor', 'One person, start to finish'],
      ['Crew', 'Large permanent crew', 'Me, plus freelancers hired per project when needed'],
      ['Quote', 'Itemised budget with many lines', 'One all-in number'],
      ['Speed', 'Approvals at every department', 'Fewer hand-offs, faster decisions']]), alt=True),
   sec('Cities', 'Production house <em>by city</em>', '''    <div class="l-citygrid">
        <a href="/production-house-bangalore.html">Bangalore (home base)</a>
        <a href="/production-house-mumbai.html">Mumbai</a>
        <a href="/production-house-delhi.html">Delhi NCR</a>
        <a href="/production-house-hyderabad.html">Hyderabad</a>
        <a href="/production-house-chennai.html">Chennai</a>
        <a href="/production-house-pune.html">Pune</a>
        <a href="/production-house-dubai.html">Dubai &amp; UAE</a>
    </div>
''' + prose('Based in Bangalore, so Bangalore quotes carry no travel. For every other city I travel in, and travel sits inside the same all-in quote. Shoots in two cities are often cheaper planned as one production.')),
   sec('Services', 'What brands <em>book</em>', cards([
     ('Brand &amp; ad films', '<a href="/ad-film-production.html">Ad film &amp; brand film production</a>', 'Launch films, brand stories and digital ad spots for Meta, YouTube and OTT.'),
     ('Corporate', '<a href="/corporate-video-bangalore.html">Corporate video</a>', 'Company profiles, founder films, culture, hiring and event films.'),
     ('Products', '<a href="/product-photography.html">Product &amp; e-commerce photography</a>', 'Marketplace-ready product images, catalogue shoots and lifestyle sets.'),
     ('Social', '<a href="/reels-production.html">Reels production for brands</a>', 'A month of vertical content from one planned shoot day.'),
     ('Fashion', '<a href="/fashion.html">Fashion &amp; lookbooks</a>', 'Campaigns, lookbooks and catalogue shoots for labels.'),
     ('Property', '<a href="/real-estate.html">Real estate films</a>', 'Project launch films, walkthroughs and reels for developers.')])),
   sec('Deliverables', 'What you <em>walk away with</em>', DELIVERABLES, alt=True)],
  faq=[('How does a production house work with a brand?', 'You share a brief (goal, audience, where it will run, deadline). The production house replies with a treatment and quote, plans the shoot once you approve, shoots, edits and delivers. With me, every one of those steps is handled by the same person.'),
   ('Is YKS Productions a big production house?', 'No, and it doesn&rsquo;t pretend to be. It&rsquo;s an independent production house run by one person, Yedukrishna Suresh, with freelancers brought in per project only when a brief needs them.'),
   ('Which cities do you work in?', 'Bangalore is home base. I regularly work in Mumbai and Dubai, and travel for shoots across India, including Delhi NCR, Hyderabad, Chennai and Pune.'),
('Do you do drone or aerial shots?', 'No. I don&rsquo;t fly drones, and I&rsquo;ll tell you up front if a brief depends on aerials so you can plan for it. Everything I deliver is shot from the ground.'),
   ('What is a brand film?', 'A brand film tells the story of who a company is and why it exists, rather than selling one product. It usually runs 60 to 120 seconds and is cut down into shorter versions for ads and social. More on the <a href="/ad-film-production.html">ad and brand film page</a>.')],
  gallery=['marriott7','topreel','fashion','dxb3','tower','suman'], geo=None, area=INDIA_UAE,
  wa='Hi Yedukrishna, I\'d like a quote for a production.',
  cta_h='Tell me what you&rsquo;re <em>making</em>', source='Production House · India',
  service_name='Independent production house: video production and photography', service_type='Video production',
  crumb='Production house in India', crumb_parent=('Production house in India', '/production-house-india.html'),
  placeholder='What are you making, and in which city?')

# ── AD & BRAND FILMS ──
svc_page(slug='ad-film-production', place='your city',
  title='Ad Film &amp; Brand Film Production in India | YKS Productions',
  desc='Ad film and brand film production for Indian and UAE brands: concept, casting, shoot and edit by one director. Digital ads for Meta and YouTube, launch films and brand stories.',
  og='Ad Film & Brand Film Production — YKS Productions',
  eyebrow='Ad films &amp; brand films', h1='Ad films and brand films, <em>made by one director</em>',
  hook='From the idea to the 6-second cut-down, one person owns the film.',
  lede='I&rsquo;m Yedukrishna Suresh, an independent director and cinematographer. I make digital ad films and brand films for brands in Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune and Dubai: concept, casting, shoot, edit and grade, with every version your media plan needs.',
  proof_line='The Marriott campaign film, brand content for Vaseline (Unilever), and a campaign reel past 3.3M views.',
  body=[sec('Brand film vs ad film', 'What&rsquo;s the difference, <em>and which do you need?</em>', table(
     ['', 'Brand film', 'Ad film (digital)'],
     [['Job', 'Tells who you are and why you exist', 'Gets a specific action: click, buy, sign up'],
      ['Length', 'Usually 60&ndash;120 s', '6, 15 or 30 s, often in several versions'],
      ['Where it runs', 'Homepage, launch, LinkedIn, decks, events', 'Meta, YouTube, OTT pre-roll'],
      ['How it&rsquo;s judged', 'Does it make people feel something about the brand?', 'Hook rate, watch time, cost per result'],
      ['Best together', 'One shoot, planned for both', 'Cut-downs from the brand film footage']]) + prose(
     'Most brands need both, and the efficient way is <strong>one production planned for both</strong>: the brand film as the master, and ad cuts designed into the shot list from the start, not chopped out afterwards.')),
   sec('Approach', 'How I make <em>ad films that work</em>', prose(
     '<strong>Hook first.</strong> On Meta and YouTube, the first second decides whether anyone sees the rest. Every ad I make has its opening frame and line planned in the treatment, and I&rsquo;ll often shoot two or three alternative openings so you can test them.',
     '<strong>Made for the platform.</strong> Vertical isn&rsquo;t a crop of horizontal. Where an ad will run 9:16, it&rsquo;s framed for 9:16 on the day, with text-safe areas and captions planned.',
     '<strong>Cinema craft, digital speed.</strong> Real lighting, motivated camera movement, clean sound and a proper grade, but without a broadcast-scale unit, so the budget goes on screen.',
     'If your brief needs a broadcast TVC with a large unit, a celebrity and agency approvals at every stage, a large ad-film house is the better fit and I&rsquo;ll tell you so.'), alt=True),
   sec('What&rsquo;s in a production', 'Inside one <em>ad film production</em>', cards([
     ('1', 'Treatment', 'The idea, tone, references, a shot outline and the list of cuts you&rsquo;ll get.'),
     ('2', 'Casting', 'Faces cast through <a href="/find-models.html">YKS Talents</a> or your own talent, with usage agreed up front.'),
     ('3', 'Locations', 'Scouting, permissions, and a studio floor hired for the day if needed.'),
     ('4', 'Shoot', 'Directed and shot by me, with freelancers for lighting, sound, styling or make-up only if the brief needs them.'),
     ('5', 'Edit &amp; grade', 'Master film, ad cut-downs, alternative hooks, captions and every aspect ratio.'),
     ('6', 'Delivery', 'Files ready for upload to Meta, YouTube and your website.')])),
   sec('Cities', 'Ad film production <em>by city</em>', '''    <div class="l-citygrid">
        <a href="/production-house-bangalore.html">Ad film makers in Bangalore</a>
        <a href="/production-house-mumbai.html">Ad films in Mumbai</a>
        <a href="/production-house-delhi.html">Ad films in Delhi NCR</a>
        <a href="/production-house-hyderabad.html">Ad films in Hyderabad</a>
        <a href="/production-house-chennai.html">Ad films in Chennai</a>
        <a href="/production-house-pune.html">Ad films in Pune</a>
        <a href="/production-house-dubai.html">Ad films in Dubai</a>
    </div>''', alt=True)],
  faq=[('What is a brand film?', 'A brand film tells the story of a company: what it believes, who it serves and why it exists, rather than pushing one product. It usually runs 60 to 120 seconds and is cut into shorter versions for ads and social.'),
   ('How long should an ad film be?', 'For digital, plan for 6, 15 and 30-second versions. Six seconds works as a reminder, 15 as the workhorse on Meta and YouTube, and 30 when the product needs explaining. I plan all three into one shoot.'),
   ('Do you write the concept, or do we?', 'Either. I can write the concept and treatment from your brief, or produce an idea your team or agency already owns.'),
   ('Can you make an ad film with actors or models?', 'Yes. I cast through <a href="/find-models.html">YKS Talents</a> or work with talent you&rsquo;ve booked. Usage terms are agreed in the quote.')],
  gallery=['marriott7','topreel','marriott1','dxb3','realestate','suman'], area=INDIA_UAE,
  wa='Hi Yedukrishna, I\'d like a quote for an ad film / brand film.',
  cta_h='Brief me on your <em>next film</em>', source='Ad & Brand Film Production',
  service_name='Ad film and brand film production', service_type='Advertising film production',
  crumb='Ad &amp; brand film production',
  placeholder='What is the film for, where will it run, and when do you need it?')

# ── PRODUCT PHOTOGRAPHY ──
svc_page(slug='product-photography', place='your city',
  title='Product &amp; E-commerce Photography | Catalogue Shoots | YKS',
  desc='Product, e-commerce and catalogue photography for brands in Bangalore, Mumbai, Delhi NCR and across India: marketplace-ready white-background images, lifestyle sets and product video.',
  og='Product & E-commerce Photography — YKS Productions',
  eyebrow='Product &amp; commercial photography', h1='Product and e-commerce photography <em>that sells</em>',
  hook='Marketplace-ready listings, lifestyle images and product video, planned as one shoot.',
  lede='I&rsquo;m Yedukrishna Suresh, a commercial photographer and director running YKS Productions. I shoot products, catalogues and lifestyle images for D2C brands, labels and companies across India and the UAE, and can shoot product video and reels on the same day.',
  proof_line='My brand work includes Marriott and Vaseline (Unilever), and a campaign reel past 3.3M views.',
  body=[sec('Three kinds of product image', 'Every listing needs <em>three jobs done</em>', cards([
     ('Listing', 'White-background packshots', 'Clean, colour-accurate images on pure white, framed to marketplace rules so your listing isn&rsquo;t rejected or buried.'),
     ('Detail', 'Close-ups &amp; texture', 'Fabric, finish, stitching, ingredients, ports and buttons: the frames that answer questions before a buyer asks them.'),
     ('Lifestyle', 'In-use &amp; on-model', 'The product in a real setting or on a model, for ads, social and the second half of your listing.')]) + prose(
     'Most brands only budget for the first, then use phone shots for the rest. Planning all three into one shoot day is usually the better use of the budget, and the lifestyle frames double as ad creative.')),
   sec('Marketplace standards', 'Built for <em>Amazon, Flipkart, Myntra and your own store</em>', prose(
     'Each marketplace has its own image rules, and they change. Amazon&rsquo;s main image, for example, needs a pure white background with the product filling most of the frame and no added text or props. Fashion marketplaces want consistent model poses and crops across a range. Your own Shopify or D2C store has none of those limits, which is where lifestyle and editorial frames earn their place.',
     'Before the shoot I confirm where each image will be used and work to the current guidelines for those channels, so you get a shot list per channel instead of one set of files that only fits one of them.',
     'Colour accuracy matters most for apparel and cosmetics, where returns often start with &ldquo;it looked different online&rdquo;. I shoot with controlled light and colour references, and grade consistently across a range.'), alt=True),
   sec('Catalogue shoots', 'Catalogue shoots with models', prose(
     'For fashion, jewellery and accessories, a catalogue shoot means photographing a whole range consistently: same light, same poses, same crops, so the collection looks like a collection. I plan the looks with you, cast models through <a href="/find-models.html">YKS Talents</a> if you need them, book a studio floor and a stylist where the brief calls for it, and deliver retouched images in every crop your channels need.',
     'See the <a href="/fashion.html">fashion work</a> and the <a href="/fashion-photographer-bangalore.html">fashion photographer in Bangalore</a> page for the editorial side.')),
   sec('Add video', 'Product video <em>from the same day</em>', prose(
     'Short product loops, unboxing and in-use clips and a 15-second ad can come from the same set-up as the stills. That&rsquo;s where most of the saving is: one day, one set, one light plan. See <a href="/reels-production.html">reels production</a> and <a href="/ad-film-production.html">ad films</a>.'), alt=True)],
  faq=[('What is a catalogue shoot? (catalogue shoot meaning)', 'A catalogue shoot photographs a full product range in a consistent style (same light, background, poses and crops), so it can be used on an e-commerce store, a marketplace or a printed lookbook.'),
   ('Catalogue shoot ka matlab kya hai?', 'Catalogue shoot ka matlab hai aapke poore product range ki ek jaisi photography: same light, same background, same poses. Taaki website, Amazon, Myntra ya lookbook par poora collection ek saath achha dikhe.'),
   ('How much does product photography cost?', 'It depends on the number of products, how many images each needs, whether you need models or a studio, and whether video is included. I quote one all-in number per project. Use the <a href="/quote.html">quote form</a> with a rough product count for the fastest answer.'),
   ('Can you shoot at our warehouse or office?', 'Often, yes. If there&rsquo;s a suitable space I can set up packshots at your premises; otherwise we hire a studio floor for the day. Lifestyle and on-model work can use real locations.')],
  gallery=['suman','olivia','fashion','marriott3','realestate','marriott1'], area=INDIA_UAE,
  wa='Hi Yedukrishna, I\'d like a quote for a product / e-commerce shoot.',
  cta_h='How many products are <em>we shooting?</em>', source='Product Photography',
  service_name='Product, e-commerce and catalogue photography', service_type='Commercial product photography',
  crumb='Product &amp; e-commerce photography',
  placeholder='Roughly how many products, which channels (Amazon, Myntra, your store), and do you need models or video?')

# ── REELS PRODUCTION ──
svc_page(slug='reels-production', place='your city',
  title='Reels Production for Brands | Instagram Reels Shoot | YKS',
  desc='Reels production for brands in India and the UAE: planned batch shoot days that return a month of Instagram Reels and YouTube Shorts, from the director behind a 3.3M-view campaign reel.',
  og='Reels Production for Brands — YKS Productions',
  eyebrow='Reels &amp; social video', h1='Reels production <em>for brands</em>',
  hook='One planned shoot day, a month of vertical content, made by the director behind a 3.3M-view campaign reel.',
  lede='I&rsquo;m Yedukrishna Suresh, and through YKS Productions I plan, shoot and edit Instagram Reels and YouTube Shorts for brands in Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune and Dubai. Not phone content and not a TV crew: cinema-grade vertical video, planned for how people actually scroll.',
  proof_line='A campaign reel past 3.3M views, plus reels for the Marriott campaign and brand content for Vaseline (Unilever).',
  body=[sec('The 3.3M-view reel', 'What a reel <em>that travels</em> has in common', '''    <div class="l-feature">
      <a href="''' + REEL + '''" target="_blank" rel="noopener" aria-label="Watch the 3.3M-view campaign reel on Instagram">''' + img('posters/reel-topreel', 640, 1136, 'Campaign reel that crossed 3.3 million views') + '''</a>
      <div>
''' + prose('<strong>The first second earns the rest.</strong> The opening frame is planned in the brief, not found in the edit.',
            '<strong>It&rsquo;s made vertical.</strong> Framed for 9:16 on set, with captions and text-safe areas in mind.',
            '<strong>It looks better than the feed around it.</strong> Real light, a proper grade, clean sound.',
            '<a href="' + REEL + '" target="_blank" rel="noopener">Watch the reel on Instagram &rarr;</a>') + '''
      </div>
    </div>'''),
   sec('How a batch day works', 'A month of reels <em>from one day</em>', cards([
     ('Before', 'Content plan', 'We agree the month: hooks, formats (product, behind-the-scenes, founder, trend, testimonial) and a shot list for each reel.'),
     ('On the day', 'Batch shoot', 'Several reels shot back to back across a few set-ups, so the day is efficient and the look stays consistent.'),
     ('After', 'Edit &amp; deliver', 'Each reel edited, graded and captioned, plus cover frames, ready to schedule. Paid-ad versions on request.')]) + prose(
     'Batching is the difference between a brand that posts good reels every week and one that posts a good reel every few months. The planning matters as much as the camera.'), alt=True),
   sec('Who it&rsquo;s for', 'Brands that <em>book reels</em>', cards([
     ('D2C &amp; fashion', 'Product and drop content', 'New collections, styling, try-ons and launches.'),
     ('Hospitality', 'Hotels, cafés &amp; restaurants', 'Rooms, food, experiences: the kind of work done for Marriott.'),
     ('Real estate', 'Project and listing reels', 'Walkthroughs and lifestyle reels for developers and brokerages.'),
     ('Founders', 'Founder &amp; expert content', 'Talking-head reels that don&rsquo;t look like talking heads.'),
     ('Corporate', 'Culture &amp; hiring', 'Vertical edits from corporate shoots for LinkedIn and Instagram.'),
     ('Events', 'Launch &amp; event reels', 'Same-day or next-day reels from launches and events.')])),
   sec('Reels or a content creator?', 'Production house <em>or creator?</em>', prose(
     'If you want a face to post on your behalf, that&rsquo;s a <a href="/content-creation.html">content creator</a> brief. If you want your brand, products and people filmed well and posted on your own account, that&rsquo;s reels production, and it&rsquo;s what this page is about. Many brands do both, and the same shoot day can cover both.'), alt=True)],
  faq=[('How many reels do I get from one shoot day?', 'It depends on the formats and number of set-ups. A simple talking-head plan returns more reels than a multi-location product story. We agree the exact count in the content plan before the quote is final.'),
   ('Reels shoot kitne ka hota hai?', 'Price project par depend karta hai: kitne reels, kitni locations, models chahiye ya nahi. Main ek all-in quote deta hoon, koi hidden charges nahi. <a href="/quote.html">Quote form</a> bhariye ya WhatsApp kariye.'),
   ('Do you post the reels or manage our account?', 'I plan, shoot and edit the reels and deliver them ready to post. Posting stays with your team.'),
   ('Can reels be used as ads?', 'Yes. Usage for paid ads is included as agreed in the quote, and I can cut ad versions with stronger hooks and calls to action.')],
  gallery=['topreel','marriott7','marriott1','marriott3','dxb1','dxb3'], area=INDIA_UAE,
  wa='Hi Yedukrishna, I\'d like a quote for reels production for my brand.',
  cta_h='Plan a month of reels <em>in one day</em>', source='Reels Production',
  service_name='Reels and short-form video production for brands', service_type='Social media video production',
  crumb='Reels production for brands',
  placeholder='What does your brand sell, which account, and how many reels a month?')


if __name__ == '__main__':
    for d in PAGES:
        out = page(d)
        io.open(P(d['slug'] + '.html'), 'w', encoding='utf-8').write(out)
        words = len(re.sub(r'<[^>]+>', ' ', out.split('<main>')[1].split('</main>')[0]).split())
        print(f"{d['slug']}.html  {words} words")
