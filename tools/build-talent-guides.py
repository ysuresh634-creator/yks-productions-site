#!/usr/bin/env python3
"""Build the YKS Talents guides in /talents/guides/.

Each guide is written here as structured content and rendered into the
site's landing.css design (nav, category bar, hero, sections, FAQ, footer),
so the three pages stay consistent and their JSON-LD is always valid JSON.
The business entity block is copied from a talent city page, exactly as
tools/wire-entity.py would project it.

Idempotent: re-running rewrites the three files.

    python3 tools/build-talent-guides.py
"""
import io, os, re, json, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
SITE = 'https://yksproductions.com'
DATE = '2026-10-18'

src = io.open(P('models-in-pune.html'), encoding='utf-8').read()
ENTITY = re.search(r'<!-- ENTITY:START -->.*?<!-- ENTITY:END -->', src, re.S).group(0)

CITIES = [('mumbai', 'Mumbai'), ('delhi', 'Delhi NCR'), ('bangalore', 'Bangalore'),
          ('hyderabad', 'Hyderabad'), ('chennai', 'Chennai'), ('pune', 'Pune'),
          ('kolkata', 'Kolkata'), ('ahmedabad', 'Ahmedabad'), ('jaipur', 'Jaipur'),
          ('chandigarh', 'Chandigarh'), ('dubai', 'Dubai')]

# slug -> (English card title, Hindi card title)
GUIDES = {
  'how-to-make-a-modelling-portfolio': ('How to make a modelling portfolio', 'मॉडलिंग portfolio कैसे बनाएं (English)'),
  'model-digitals': ('What to wear for model digitals', 'Model digitals: क्या पहनें (English)'),
  'model-comp-card': ('Model comp card + free comp card maker', 'Comp card + free comp card maker (English)'),
  'modelling-agency-fees-scams-india': ('Modelling agency fees and scams in India', 'Agency fees और scams (English)'),
  'modelling-portfolio-kaise-banaye': ('मॉडलिंग पोर्टफोलियो कैसे बनाएं (Hindi)', 'मॉडलिंग पोर्टफोलियो कैसे बनाएं'),
}

# Interface strings. Guides set lang='hi' to get the Hindi set.
UI = {
  'en': dict(
    html_lang='en-IN', in_lang='en-IN', og_locale='en_IN',
    og_alt='YKS Talents — free modelling portfolios for women 18–34',
    home='Home', crumb_root='YKS Talents',
    byline='By Yedukrishna Suresh · Photographer &amp; filmmaker, YKS Productions · Updated October 2026',
    cta_build='Build my portfolio — free →', cta_about='About YKS Talents',
    note='Free forever · No joining or registration fees · No paid tiers · Women 18–34 · Not a jobs board',
    toc='IN THIS GUIDE', faq_h='Questions, <em>answered straight</em>',
    more_eyebrow='Keep reading', more_h='More from <em>YKS Talents</em>',
    card_guide='Guide', card_free='Free', card_free_t='Create your free modelling portfolio',
    card_plat='Platform', card_plat_t='About YKS Talents',
    end_h='A considered portfolio, <em>free</em>',
    end_p='Women 18–34 across India and the Middle East. No joining fee, no registration fee, no paid tiers — ever. YKS Talents is a platform where clients find talent; it doesn&rsquo;t offer jobs.',
    end_b1='Build my portfolio — free', end_b2='See how it works',
    foot_city='YKS Talents by city:', foot_guides='Guides:',
  ),
  'hi': dict(
    html_lang='hi', in_lang='hi-IN', og_locale='hi_IN',
    og_alt='YKS Talents — 18 से 34 साल की महिलाओं के लिए free modelling portfolio',
    home='होम', crumb_root='YKS Talents',
    byline='लेखक: यदुकृष्ण सुरेश (Yedukrishna Suresh) · फ़ोटोग्राफ़र और फ़िल्ममेकर, YKS Productions · अपडेट: अक्टूबर 2026',
    cta_build='अपना portfolio free में बनाएं →', cta_about='YKS Talents के बारे में',
    note='हमेशा free · कोई joining या registration fee नहीं · कोई paid plan नहीं · 18–34 साल की महिलाएं · यह jobs board नहीं है',
    toc='इस गाइड में', faq_h='सवाल, <em>सीधे जवाब</em>',
    more_eyebrow='आगे पढ़ें', more_h='YKS Talents की <em>और गाइड</em>',
    card_guide='गाइड', card_free='Free', card_free_t='अपना free modelling portfolio बनाएं',
    card_plat='प्लेटफ़ॉर्म', card_plat_t='YKS Talents के बारे में',
    end_h='एक सधा हुआ portfolio, <em>बिल्कुल free</em>',
    end_p='भारत और Middle East में 18 से 34 साल की महिलाओं के लिए। कोई joining fee नहीं, कोई registration fee नहीं, कोई paid plan नहीं — कभी नहीं। YKS Talents एक प्लेटफ़ॉर्म है जहाँ clients talent ढूंढते हैं; यह jobs नहीं देता।',
    end_b1='अपना portfolio free में बनाएं', end_b2='यह कैसे काम करता है',
    foot_city='शहर के हिसाब से YKS Talents:', foot_guides='गाइड:',
  ),
}

STYLE = """<style>
.l-crumbs{font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:rgba(244,237,226,.5);margin-bottom:18px}
.l-crumbs a{color:inherit;border-bottom:1px solid rgba(255,140,59,.3)}
.g-meta{font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:rgba(244,237,226,.55);margin-top:18px}
.g-toc{max-width:720px;border:1px solid rgba(244,237,226,.1);border-radius:14px;padding:22px 26px;background:rgba(22,19,28,.5)}
.g-toc p{font-family:var(--mono);font-size:11px;letter-spacing:.16em;color:var(--amber);margin-bottom:10px}
.g-toc ol{margin:0;padding-left:20px;color:var(--paper-dim);line-height:1.9;font-size:.98rem}
.g-toc a{color:var(--paper-dim);border-bottom:1px solid rgba(255,140,59,.25)}
.l-prose h3{font-family:var(--serif);font-size:1.3rem;color:var(--paper);margin:30px 0 10px;font-weight:500}
.l-prose ul,.l-prose ol{margin:14px 0 0;padding-left:22px}
.l-prose li{margin:8px 0}
.l-prose li::marker{color:var(--amber)}
.l-prose a{color:var(--amber);border-bottom:1px solid rgba(255,140,59,.35)}
.l-prose p+ul,.l-prose p+ol,.l-prose ul+p,.l-prose ol+p{margin-top:16px}
.g-callout{max-width:720px;margin-top:26px;border-left:2px solid var(--amber);padding:6px 0 6px 20px;color:var(--paper);font-size:1.02rem;line-height:1.75}
.g-figs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:900px;margin-top:30px}
.g-figs figure{margin:0}
.g-figs img{width:100%;height:auto;aspect-ratio:2/3;object-fit:cover;border-radius:12px;display:block}
.g-figs figcaption{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;color:rgba(244,237,226,.55);margin-top:8px;line-height:1.6}
.g-related{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;max-width:900px}
.g-related a{display:block;border:1px solid rgba(244,237,226,.1);border-radius:14px;padding:20px 22px;background:rgba(22,19,28,.5);color:var(--paper);transition:.3s}
.g-related a:hover{border-color:rgba(255,140,59,.4);transform:translateY(-2px)}
.g-related span{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;color:var(--amber);margin-bottom:8px}
html[lang=hi] body{font-family:'Noto Sans Devanagari',var(--sans)}
html[lang=hi] .l-prose,html[lang=hi] .l-lede,html[lang=hi] .l-faq p{line-height:1.9}
html[lang=hi] .l-eyebrow,html[lang=hi] .l-crumbs,html[lang=hi] .g-meta,html[lang=hi] .g-toc p,html[lang=hi] .g-related span,html[lang=hi] .tal-kicker,html[lang=hi] .l-note{letter-spacing:0}
html[lang=hi] h1 em,html[lang=hi] h2 em{font-style:normal;background:none;color:var(--amber);-webkit-text-fill-color:currentColor}
html[lang=hi] .l-eyebrow,html[lang=hi] .l-crumbs,html[lang=hi] .g-meta,html[lang=hi] .g-toc p,html[lang=hi] .g-related span,html[lang=hi] .tal-kicker{font-family:'Noto Sans Devanagari',var(--mono)}
@media(max-width:760px){.g-figs{grid-template-columns:1fr 1fr}.g-figs figure:nth-child(3){display:none}}
</style>"""


def esc(s):
    return html.escape(s, quote=True)


def strip(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def page(g):
    url = f"{SITE}/talents/guides/{g['slug']}.html"
    L = g.get('lang', 'en')
    T = UI[L]
    gi = 1 if L == 'hi' else 0
    graph = [
        {
            '@type': 'Article',
            '@id': url + '#article',
            'headline': g['headline'],
            'description': g['desc'],
            'url': url,
            'mainEntityOfPage': url,
            'inLanguage': T['in_lang'],
            'datePublished': DATE,
            'dateModified': DATE,
            'image': g.get('image_abs', f'{SITE}/assets/og/og-talents.jpg'),
            'author': {
                '@type': 'Person',
                '@id': f'{SITE}/#yedukrishna',
                'name': 'Yedukrishna Suresh',
                'url': f'{SITE}/',
                'jobTitle': 'Photographer and filmmaker, YKS Productions',
                'sameAs': ['https://www.instagram.com/yks_photoworks',
                           'https://www.linkedin.com/in/yedukrishnasuresh'],
            },
            'publisher': {'@id': f'{SITE}/#business'},
            'about': {'@id': f'{SITE}/talents.html#yks-talents'},
            'keywords': g['keywords'],
        },
        {
            '@type': 'BreadcrumbList',
            'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': T['home'], 'item': f'{SITE}/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'YKS Talents', 'item': f'{SITE}/talents.html'},
                {'@type': 'ListItem', 'position': 3, 'name': g['crumb'], 'item': url},
            ],
        },
        {
            '@type': 'Organization',
            '@id': f'{SITE}/talents.html#yks-talents',
            'name': 'YKS Talents',
            'url': f'{SITE}/talents.html',
            'description': 'A free, curated portfolio platform where clients find talent across India and the Middle East. Free forever, with no joining or registration fees and no paid tiers. YKS Talents does not offer jobs.',
            'parentOrganization': {'@id': f'{SITE}/#business'},
            'founder': {'@id': f'{SITE}/#yedukrishna'},
        },
    ]
    if g.get('faq'):
        graph.append({
            '@type': 'FAQPage',
            '@id': url + '#faq',
            'mainEntity': [{'@type': 'Question', 'name': q,
                            'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}}
                           for q, a in g['faq']],
        })
    graph += g.get('extra_graph', [])
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=2)

    toc = ''.join(f'<li><a href="#{sid}">{esc(strip(t))}</a></li>' for sid, t, _ in g['sections'])
    secs = []
    for i, (sid, title, body) in enumerate(g['sections']):
        alt = ' alt' if i % 2 == 0 else ''
        secs.append(f'''<section class="l-section{alt}" id="{sid}">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">{i+1:02d}</p><h2>{title}</h2></div>
    <div class="l-prose">
{body}
    </div>
  </div>
</section>''')
    faq_html = ''
    if g.get('faq'):
        items = '\n'.join(f'      <details><summary>{esc(q)}</summary><p>{a}</p></details>' for q, a in g['faq'])
        faq_html = f"""<section class="l-section" id="faq">
  <div class="wrap">
    <div class="l-head"><h2>{T['faq_h']}</h2></div>
    <div class="l-faq">
{items}
    </div>
  </div>
</section>"""
    related = '\n'.join(
        f'      <a href="/talents/guides/{s}.html"{" lang=\"hi\"" if s.endswith("kaise-banaye") and L != "hi" else ""}><span>{T["card_guide"]}</span>{esc(t[gi])}</a>'
        for s, t in GUIDES.items() if s != g['slug'])
    related += f'\n      <a href="/talents/apply.html"><span>{T["card_free"]}</span>{T["card_free_t"]}</a>'
    related += f'\n      <a href="/talents.html"><span>{T["card_plat"]}</span>{T["card_plat_t"]}</a>'
    city_links = ' · '.join(f'<a href="/models-in-{s}.html">{n}</a>' for s, n in CITIES)
    guide_links = ' · '.join(
        f'<a href="/talents/guides/{s}.html">{esc(t[0])}</a>' for s, t in GUIDES.items())
    alternates = ''.join(f'<link rel="alternate" hreflang="{h}" href="{u}" />\n' for h, u in g.get('alternates', []))
    scripts = ''.join(f'<script src="{x}" defer></script>\n' for x in g.get('scripts', []))

    return f"""<!DOCTYPE html>
<html lang="{T['html_lang']}">
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
<title>{esc(g['title'])}</title>
<meta name="description" content="{esc(g['desc'])}" />
<link rel="canonical" href="{url}" />
{alternates}<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="author" content="Yedukrishna Suresh" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{esc(g['og_title'])}" />
<meta property="og:description" content="{esc(g['desc'])}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{SITE}/assets/og/og-talents.jpg" />
<meta property="og:image:secure_url" content="{SITE}/assets/og/og-talents.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{esc(T['og_alt'])}" />
<meta property="og:locale" content="{T['og_locale']}" />
<meta property="article:published_time" content="{g.get('published', DATE)}" />
<meta property="article:author" content="Yedukrishna Suresh" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{esc(g['og_title'])}" />
<meta name="twitter:description" content="{esc(g['desc'])}" />
<meta name="twitter:image" content="{SITE}/assets/og/og-talents.jpg" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500{'&family=Noto+Sans+Devanagari:wght@400;500;600' if L == 'hi' else ''}&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=26" />
{STYLE}
{g.get('extra_style', '')}
<script type="application/ld+json">
{ld}
</script>
{ENTITY}
<link rel="alternate" type="application/atom+xml" title="YKS Productions — Journal" href="https://yksproductions.com/blog/feed.xml" />
</head>
<body data-page="casting">

<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/talents.html">YKS Talents</a>
</nav>

<div class="l-cats" lang="en">
  <div class="l-cats-inner">
    <a class="l-home" href="/index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Home</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/talents.html">YKS Talents</a>
    <a href="/talents/apply.html">Free portfolio</a>
    <a href="/talents/guides/how-to-make-a-modelling-portfolio.html">Portfolio guide</a>
    <a href="/talents/guides/model-digitals.html">Digitals</a>
    <a href="/talents/guides/model-comp-card.html">Comp card</a>
    <a href="/talents/guides/modelling-agency-fees-scams-india.html">Fees &amp; scams</a>
    <a href="/talents/guides/modelling-portfolio-kaise-banaye.html" lang="hi">हिंदी</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/find-models.html">Find models</a>
    <a href="/blog/">Journal</a>
  </div>
</div>

<main>

<section class="l-hero">
  <div class="wrap">
    <nav class="l-crumbs" aria-label="Breadcrumb"><a href="/">{T['home']}</a> / <a href="/talents.html">{T['crumb_root']}</a> / <span aria-current="page">{esc(g['crumb'])}</span></nav>
    <p class="l-eyebrow">{g['eyebrow']}</p>
    <h1>{g['h1']}</h1>
    <p class="l-lede">{g['lede']}</p>
    <p class="g-meta">{T['byline']}</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="{g.get('hero_cta_href', '/talents/apply.html')}">{g.get('hero_cta', T['cta_build'])}</a>
      <a class="btn btn-ghost" href="{g.get('hero_cta2_href', '/talents.html')}">{g.get('hero_cta2', T['cta_about'])}</a>
    </div>
    <p class="l-note">{T['note']}</p>
  </div>
</section>
{g.get('after_hero', '')}
<section class="l-section">
  <div class="wrap">
    <div class="g-toc">
      <p>{T['toc']}</p>
      <ol>{toc}</ol>
    </div>
    {g.get('intro','')}
  </div>
</section>

{chr(10).join(secs)}

{faq_html}

<section class="l-section alt">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">{T['more_eyebrow']}</p><h2>{T['more_h']}</h2></div>
    <div class="g-related">
{related}
    </div>
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <p class="tal-kicker">YKS Talents</p>
    <h2>{T['end_h']}</h2>
    <p>{T['end_p']}</p>
    <div class="l-cta-row center">
      <a class="btn btn-fill" href="/talents/apply.html">{T['end_b1']}</a>
      <a class="btn btn-ghost" href="/talents.html">{T['end_b2']}</a>
    </div>
  </div>
</section>

</main>

<footer class="l-foot" lang="en">
  <div class="wrap">
    <div class="l-foot-inner">
      <div class="l-foot-brand">YKS<span>.</span>Productions</div>
      <div class="l-foot-links">
        <a href="/talents.html">YKS Talents</a>
        <a href="/talents/apply.html">Free portfolio</a>
        <a href="/find-models.html">Find models</a>
        <a href="/index.html">Portfolio</a>
        <a href="/faq.html">FAQ</a>
        <a href="https://instagram.com/yks_photoworks" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
    <p class="l-related">YKS Talents by city: {city_links}</p>
    <p class="l-related">Guides: {guide_links}</p>
  </div>
</footer>

<script src="/js/landing.js?v=20"></script>
{scripts}</body>
</html>
"""


def fig(src, w, h, alt, cap):
    base = src.rsplit('.', 1)[0]
    return (f'<figure><img src="{src}" srcset="{base}-800.webp 800w, {src} {w}w" '
            f'sizes="(max-width: 760px) 50vw, 300px" width="{w}" height="{h}" '
            f'alt="{esc(alt)}" loading="lazy" decoding="async" /><figcaption>{cap}</figcaption></figure>')


# ---------------------------------------------------------------- guides
exec(io.open(P('tools', 'talent-guides-content.py'), encoding='utf-8').read())

for g in CONTENT:
    out = page(g)
    io.open(P('talents', 'guides', g['slug'] + '.html'), 'w', encoding='utf-8').write(out)
    main = re.search(r'<main>(.*)</main>', out, re.S).group(1)
    words = len(strip(main).split())
    print(f"{g['slug']}.html  words(main)={words}  title={g['title']!r}")
