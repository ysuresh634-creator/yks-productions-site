#!/usr/bin/env python3
"""Build the marketing/services SEO cluster: pillar hubs, city pages, journal guides.
Content lives in tools/seo/*.py. Run from repo root."""
import os, re, json, sys, html
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'seo'))
from pillars import P
from cities import C
from blogs import B
from extra import PX, CX
for k in PX: P[k]['sections'] = P[k]['sections'] + PX[k]
for k in CX: C[k]['sections'] = C[k]['sections'] + [CX[k]]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://yksproductions.com'
TODAY = '2026-10-12'
tpl = open(os.path.join(ROOT, 'social-media-marketing-dubai.html')).read()
ENTITY = tpl[tpl.index('<!-- ENTITY:START -->'):tpl.index('<!-- ENTITY:END -->') + len('<!-- ENTITY:END -->')]
HEAD_GA = tpl[tpl.index('<!-- Google Analytics'):tpl.index('<title>')]

IMG = {
 'mkt': [('posters/ig-dxb1.jpg','Dubai brand reel frame shot for social media marketing'),('posters/marriott-film.jpg','Marriott hospitality film still by YKS Productions'),('posters/photo-27k.jpg','Brand photo content created for Instagram'),('behance/tun-sonika.jpg','Editorial fashion campaign portrait'),('realestate-reel.jpg','Cinematic real estate reel frame'),('posters/reel-topreel.jpg','Campaign reel frame from a 3.3M-view reel')],
 'ads': [('posters/ig-dxb2.jpg','Vertical ad creative frame for Instagram Reels'),('posters/ig-dxb3.jpg','Short-form ad creative shot in Dubai'),('posters/marriott-r1.jpg','Hospitality reel creative for Marriott'),('posters/reel-topreel.jpg','High-performing campaign reel frame'),('behance/work-divya.jpg','Fashion product creative for paid social'),('posters/ig-dxb4.jpg','Lifestyle ad creative in portrait format')],
 'brand': [('posters/marriott-film.jpg','Brand film still for Marriott'),('craft/fashion.jpg','Fashion brand visual direction example'),('craft/films.jpg','Cinematic film frame showing visual style'),('behance/tun-olivia2.jpg','Lookbook image with consistent brand styling'),('posters/photo-27k.jpg','Social photo with a defined brand look'),('babygirl/babygirl-promo.jpg','Film promotional still from Baby Girl')],
 'social': [('posters/ig-dxb1.jpg','Instagram reel content shot in Dubai'),('posters/ig-dxb2.jpg','Short-form social video frame'),('posters/ig-dxb3.jpg','Reel content for a lifestyle brand'),('posters/ig-dxb4.jpg','Vertical social content frame'),('posters/reel-topreel.jpg','Campaign reel that reached 3.3M views'),('posters/marriott-r2.jpg','Hospitality reel for Marriott')],
 'linkedin': [('yedu-portrait.jpg','Yedukrishna Suresh, founder of YKS Productions'),('kishore/ks-02.jpg','Professional portrait with natural light'),('rukmini/rukmini-1.jpg','Personal branding portrait session'),('behance/tun-sonika.jpg','Studio portrait with clean lighting'),('kishore/ks-05.jpg','Environmental portrait for a professional profile'),('yedu-portrait-2.jpg','Founder portrait for LinkedIn')],
 'content': [('posters/reel-topreel.jpg','Reel created for a brand campaign'),('posters/ig-dxb2.jpg','Vertical content shot for Instagram'),('posters/marriott-r3.jpg','Hotel reel content for Marriott'),('behance/work-ashika.jpg','Fashion content photo for social'),('party/party-01.jpg','Event content captured for social media'),('posters/vimeo-showreel.jpg','Showreel frame by YKS Productions')],
 'video': [('posters/marriott-film.jpg','Marriott brand film still'),('realestate-reel.jpg','Real estate video walkthrough frame'),('posters/vimeo-showreel.jpg','Videographer showreel frame'),('babygirl/babygirl-promo.jpg','Still from the Malayalam film Baby Girl'),('work/atlantis-sea.jpg','Hospitality video frame by the sea in Dubai'),('soothravakyam/poster.jpg','Soothravakyam film poster, stills by Yedukrishna Suresh')],
 'events': [('party/floor-01.jpg','Event photography on the dance floor'),('party/party-03.jpg','Guests at a private event'),('party/party-05.jpg','Candid event moment'),('party/hang-01.jpg','Event atmosphere photography'),('party/floor-04.jpg','Celebration photographed at night'),('party/party-10.jpg','Event coverage frame')],
 'hotel': [('posters/marriott-film.jpg','Marriott hotel film still'),('posters/marriott-r1.jpg','Hotel reel frame for Marriott'),('work/atlantis-tower.jpg','Luxury resort tower shot in the UAE'),('work/atlantis-sea.jpg','Resort sea view video frame'),('posters/marriott-r7.jpg','Hospitality short-form video for Marriott'),('realestate-reel.jpg','Property walkthrough video frame')],
 'photo': [('behance/tun-sonika.jpg','Fashion editorial photography'),('wedding/wed-couple.jpg','Wedding couple portrait'),('party/floor-01.jpg','Event photography'),('wed-haldi/bride-red.jpg','Haldi ceremony bridal portrait'),('rithu-kevin/rk-04.jpg','Pre-wedding couple shoot'),('craft/realestate.jpg','Real estate interior photography')],
}

def esc(s): return html.escape(s, quote=True)
def strip(s): return html.unescape(re.sub(r'<[^>]+>', '', s))

LABEL = {}
for f in os.listdir(ROOT):
    if f.endswith('.html'):
        m = re.search(r'<title>(.*?)</title>', open(os.path.join(ROOT, f), errors='ignore').read(), re.S)
        if m: LABEL[f] = html.unescape(m.group(1)).split('|')[0].split(' — ')[0].strip()
for d in (P.values(),): pass
for k, v in P.items(): LABEL[v['slug']] = strip(v['h1'] + ' ' + v['h1em'])
for k, v in C.items(): LABEL[k] = strip(v['h1'] + ' ' + v['h1em'])
for k, v in B.items(): LABEL[k] = strip(v['h1'] + ' ' + v['h1em'])

def gallery(key):
    out = []
    for src, alt in IMG[key]:
        w, h = Image.open(os.path.join(ROOT, 'assets', src)).size
        out.append(f'      <img width="{w}" height="{h}" src="/assets/{src}" alt="{esc(alt)}" loading="lazy" decoding="async" />')
    return '    <div class="l-gallery">\n' + '\n'.join(out) + '\n    </div>'

CATS = '''<div class="l-cats">
  <div class="l-cats-inner">
    <a class="l-home" href="/index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Home</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/marketing.html">Marketing</a>
    <a href="/performance-marketing.html">Ads</a>
    <a href="/content-creation.html">Content</a>
    <a href="/video-production.html">Video</a>
    <a href="/photography.html">Photography</a>
    <span class="l-cats-div" aria-hidden="true"></span>
    <a href="/dubai/">Dubai &amp; UAE</a>
    <a href="/india/">India</a>
    <a href="/real-estate.html">Real estate</a>
    <a href="/fashion.html">Fashion</a>
    <a href="/weddings.html">Weddings</a>
    <a href="/blog/">Journal</a>
  </div>
</div>'''

SERVICES_FOOT = '''    <p class="l-related">
      Services: <a href="/marketing.html">Marketing consultant</a> · <a href="/brand-strategy.html">Brand strategy</a> · <a href="/performance-marketing.html">Performance marketing</a> · <a href="/linkedin-marketing.html">LinkedIn marketing</a> · <a href="/social-media-marketing.html">Social media marketing</a> · <a href="/content-creation.html">Content creator</a> · <a href="/video-production.html">Video production</a> · <a href="/photography.html">Photography</a>
    </p>
    <p class="l-related">
      Cities: <a href="/marketing-agency-dubai.html">Marketing in Dubai</a> · <a href="/marketing-agency-abu-dhabi.html">Abu Dhabi</a> · <a href="/marketing-agency-bangalore.html">Bangalore</a> · <a href="/marketing-agency-mumbai.html">Mumbai</a> · <a href="/marketing-agency-delhi.html">Delhi NCR</a>
    </p>'''

AUTHOR = '''<section class="l-section l-author">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">Who you&rsquo;ll work with</p><h2>About <em>Yedukrishna Suresh</em></h2></div>
    <div class="l-authorbox">
      <img src="/assets/yedu-portrait.jpg" width="{w}" height="{h}" alt="Yedukrishna Suresh, marketing specialist, photographer and videographer" loading="lazy" decoding="async" />
      <div class="l-prose">
        <p>I&rsquo;m a marketing specialist with 8 years in content, video and photography, and the founder of YKS Productions. I&rsquo;ve created for brands including <strong>Vaseline (Unilever)</strong>, <strong>Marriott</strong>, <strong>KL Rahul</strong> and <strong>Cindrebay School of Design</strong>, and worked as still photographer on the Malayalam films <strong>Soothravakyam</strong> and <strong>Baby Girl</strong>. One campaign reel I made reached <strong>3.3M views</strong>, and my Instagram <a href="https://www.instagram.com/yks_photoworks/" target="_blank" rel="noopener">@yks_photoworks</a> has passed <strong>1.4M profile views</strong>.</p>
        <p>I work independently, with no office or staff, and travel to clients in Dubai, Abu Dhabi, Bangalore, Mumbai and Delhi NCR. Email <a href="mailto:yksproductions893@gmail.com">yksproductions893@gmail.com</a> or WhatsApp {phone}.</p>
      </div>
    </div>
  </div>
</section>'''

STYLE = '''<style>
.l-crumbs{font-size:13px;color:var(--muted);margin-bottom:14px}.l-crumbs a{color:inherit}
.l-authorbox{display:grid;grid-template-columns:160px 1fr;gap:28px;align-items:start}
.l-authorbox img{width:160px;height:200px;object-fit:cover;border-radius:14px}
@media(max-width:760px){.l-authorbox{grid-template-columns:1fr}}
</style>'''

PERSON = {"@type": "Person", "@id": SITE + "/#yedukrishna", "name": "Yedukrishna Suresh",
  "jobTitle": "Marketing specialist, photographer and videographer", "worksFor": {"@id": SITE + "/#business"},
  "image": SITE + "/assets/yedu-portrait.jpg",
  "sameAs": ["https://www.instagram.com/yks_photoworks", "https://www.linkedin.com/in/yedukrishnasuresh"]}

def place(city, country):
    if city is None:
        return [{"@type": "City", "name": n, "containedInPlace": {"@type": "Country", "name": c}} for n, c in
                [("Dubai","United Arab Emirates"),("Abu Dhabi","United Arab Emirates"),("Bangalore","India"),("Mumbai","India"),("Delhi","India")]]
    return {"@type": "City", "name": city.replace(' NCR', ''), "containedInPlace": {"@type": "Country", "name": country}}

def entity(cc):
    if not cc: return ENTITY
    a = ENTITY.index('<script type="application/ld+json">') + len('<script type="application/ld+json">')
    b = ENTITY.index('</script>', a)
    d = json.loads(ENTITY[a:b])
    for n in d['@graph']:
        if 'contactPoint' in n: n['contactPoint'] = [c for c in n['contactPoint'] if c.get('areaServed') == cc]
    return ENTITY[:a] + '\n' + json.dumps(d, indent=1, ensure_ascii=False) + '\n' + ENTITY[b:]

def head(path, title, desc, ogtitle, schema, region=None, placename=None, ogtype='website'):
    url = f'{SITE}/{path}'
    geo = f'<meta name="geo.region" content="{region}" />\n<meta name="geo.placename" content="{esc(placename)}" />\n' if region else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

{HEAD_GA}<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}" />
<link rel="canonical" href="{url}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
{geo}
<meta property="og:type" content="{ogtype}" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{esc(ogtitle)}" />
<meta property="og:description" content="{esc(desc)}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{SITE}/assets/og-cover.jpg" />
<meta property="og:image:alt" content="{esc(ogtitle)}" />
<meta property="og:locale" content="en_IN" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{SITE}/assets/og-cover.jpg" />

<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=25" />
{STYLE}
<script type="application/ld+json">
{json.dumps(schema, indent=1, ensure_ascii=False)}
</script>
{entity(CUR['cc'])}
<link rel="alternate" type="application/atom+xml" title="YKS Productions — Journal" href="https://yksproductions.com/blog/feed.xml" />
</head>
<body{(' data-wa="' + NUM[CUR['cc']][0] + '"') if CUR['cc'] else ''}>

<nav class="l-nav">
  <a class="l-brand" href="/index.html">YKS<span>.</span><em>Productions</em></a>
  <a class="l-back" href="/index.html">Back to portfolio</a>
</nav>
{CATS}

<main>
'''

def crumbs_html(crumbs):
    parts = []
    for i, (name, href) in enumerate(crumbs):
        parts.append(f'<a href="{href}">{esc(name)}</a>' if i < len(crumbs) - 1 else f'<span aria-current="page">{esc(name)}</span>')
    return '<nav class="l-crumbs" aria-label="Breadcrumb">' + ' / '.join(parts) + '</nav>'

def crumbs_ld(crumbs):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + h} for i, (n, h) in enumerate(crumbs)]}

def faq_ld(faqs):
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": strip(q),
        "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faqs]}

NUM = {'AE': ('971501955122', '+971 50 195 5122', '+971-50-195-5122'), 'IN': ('919746679720', '+91 97466 79720', '+91-9746679720')}
CUR = {'cc': None}
def wa(text):
    from urllib.parse import quote
    n = NUM[CUR['cc'] or 'AE'][0]
    return f'https://wa.me/{n}?text=' + quote(text)

def hero(eyebrow, h1, h1em, lede, crumbs, watext):
    return f'''
<section class="l-hero">
  <div class="wrap">
    {crumbs_html(crumbs)}
    <p class="l-eyebrow">{eyebrow}</p>
    <h1>{h1} <em>{h1em}</em></h1>
    <p class="l-lede">{lede}</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="{wa(watext)}" target="_blank" rel="noopener">Get a quote</a>
      <a class="btn btn-ghost" href="https://instagram.com/yks_photoworks" target="_blank" rel="noopener">See the work</a>
    </div>
  </div>
</section>
'''

def prose_sections(sections, start=1):
    out = []
    for i, (h2, paras) in enumerate(sections):
        alt = ' alt' if i % 2 else ''
        ps = '\n'.join(f'      <p>{p}</p>' for p in paras)
        out.append(f'''<section class="l-section{alt}">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">{i+start:02d}</p><h2>{h2}</h2></div>
    <div class="l-prose">
{ps}
    </div>
  </div>
</section>''')
    return '\n'.join(out)

def block(title, inner, alt=False):
    return f'''<section class="l-section{' alt' if alt else ''}">
  <div class="wrap">
    <div class="l-head"><h2>{title}</h2></div>
{inner}
  </div>
</section>'''

def cards_html(cards):
    return '    <div class="l-grid">\n' + '\n'.join(f'      <div class="l-card"><span class="t">{t}</span><h3>{h}</h3><p>{p}</p></div>' for t, h, p in cards) + '\n    </div>'

def steps_html(steps):
    return '    <div class="l-steps">\n' + '\n'.join(f'      <div class="l-step"><span class="n">Step {i+1:02d}</span><h3>{h}</h3><p>{p}</p></div>' for i, (h, p) in enumerate(steps)) + '\n    </div>'

def faq_html(faqs):
    return '    <div class="l-faq">\n' + '\n'.join(f'      <details{" open" if i == 0 else ""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(faqs)) + '\n    </div>'

def places(links):
    items = []
    for l in links:
        lab = LABEL.get(l) or LABEL.get(l.rstrip('/') + '/index.html') or l
        href = '/' + l if not l.startswith('/') else l
        items.append(f'      <a href="{href}"><b>{esc(lab)}</b></a>')
    return '    <div class="l-places">\n' + '\n'.join(items) + '\n    </div>'

def tail(source, watext, related_line=''):
    aw, ah = Image.open(os.path.join(ROOT, 'assets/yedu-portrait.jpg')).size
    cc = CUR['cc']
    phone = f'<a href="https://wa.me/{NUM[cc][0]}">{NUM[cc][1]}</a>' if cc else '<a href="https://wa.me/971501955122" data-geo-phone>+971 50 195 5122</a>'
    geo = '' if cc else '<script src="/js/geo-wa.js?v=1"></script>\n'
    return AUTHOR.replace('{w}', str(aw)).replace('{h}', str(ah)).replace('{phone}', phone) + f'''

</main>

<section class="l-cta">
  <div class="wrap">
    <h2>Tell me what you&rsquo;re <em>trying to grow</em></h2>
    <p>Share your brand, your goal and your timeline. I&rsquo;ll reply with a plan and a written quote.</p>
    <div class="l-form-wrap">
      <form class="l-form" data-source="{esc(source)}" data-subject="New enquiry — {esc(source)}">
        <div class="row2">
          <input type="text" name="name" placeholder="Your name / brand" required />
          <input type="tel" name="contact" placeholder="Phone / WhatsApp" required />
        </div>
        <input type="email" name="email" placeholder="Email (optional)" />
        <textarea name="message" placeholder="What do you need, and by when?"></textarea>
        <button type="submit" class="btn btn-fill">Send enquiry →</button>
      </form>
      <p class="l-form-ok">✓ Thank you — your enquiry is in. I'll be in touch shortly.</p>
      <p class="l-form-alt">Prefer to chat? <a href="{wa(watext)}" target="_blank" rel="noopener">Message me on WhatsApp →</a> · <a href="mailto:yksproductions893@gmail.com">yksproductions893@gmail.com</a></p>
    </div>
  </div>
</section>

<footer class="l-foot">
  <div class="wrap">
    <div class="l-foot-inner">
      <div class="l-foot-brand">YKS<span>.</span>Productions</div>
      <div class="l-foot-links">
        <a href="/index.html">Portfolio</a>
        <a href="/marketing.html">Marketing</a>
        <a href="/blog/">Journal</a>
        <a href="/faq.html">FAQ</a>
        <a href="/quote.html">Get a quote</a>
        <a href="https://instagram.com/yks_photoworks" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
{SERVICES_FOOT}
  </div>
</footer>

{geo}<script src="/js/landing.js?v=17"></script>
<script src="/js/fx.js?v=6"></script>
<script src="/js/lead.js?v=2"></script>
<script src="/js/chat-config.js"></script>
<script src="/js/chat.js?v=9"></script>
<script src="/js/search.js?v=11" defer></script>
<script src="/js/source.js?v=1"></script>
<script src="/js/preferred-source.js?v=1" defer></script>
<script src="/js/rail.js?v=6"></script>
</body>
</html>
'''

def service_ld(name, stype, desc, url, area):
    return {"@type": "Service", "name": name, "serviceType": stype, "description": desc, "url": url,
            "provider": {"@type": "LocalBusiness", "@id": SITE + "/#business", "name": "YKS Productions", "url": SITE + "/",
                         "email": "yksproductions893@gmail.com", **({"telephone": NUM[CUR['cc']][2]} if CUR['cc'] else {}), "areaServed": area},
            "areaServed": area}

written = []
def write(path, s):
    open(os.path.join(ROOT, path), 'w').write(s); written.append(path)

# Pillars
CITY_LINKS = {
 'marketing': ['marketing-agency-dubai.html','marketing-agency-abu-dhabi.html','marketing-agency-bangalore.html','marketing-agency-mumbai.html','marketing-agency-delhi.html'],
 'performance': ['marketing-agency-dubai.html','marketing-agency-bangalore.html','marketing-agency-mumbai.html','marketing-agency-delhi.html','marketing-agency-abu-dhabi.html'],
 'brand': ['marketing-agency-bangalore.html','marketing-agency-mumbai.html','marketing-agency-dubai.html'],
 'social': ['social-media-marketing-dubai.html','social-media-marketing-bangalore.html','content-creator-dubai.html','content-creator-bangalore.html'],
 'linkedin': ['linkedin-headshots-dubai.html','corporate-headshots-dubai.html','marketing-agency-delhi.html','marketing-agency-mumbai.html'],
 'content': ['content-creator-dubai.html','content-creator-bangalore.html','social-media-marketing-dubai.html','social-media-marketing-bangalore.html'],
 'video': ['videographer-dubai.html','videographer-abu-dhabi.html','videographer-bangalore.html','videographer-mumbai.html','videographer-delhi.html','corporate-video-dubai.html','corporate-video-bangalore.html','real-estate-videographer-dubai.html','wedding-videographer-dubai.html'],
 'photo': ['photographer-dubai.html','photographer-abu-dhabi.html','photographer-bangalore.html','photographer-mumbai.html','photographer-delhi.html','food-photographer-dubai.html','event-photographer-dubai.html','event-photographer-bangalore.html','fashion-photographer-dubai.html','real-estate-photographer-dubai.html','wedding-photographer-dubai.html'],
}
BLOG_LINKS = {k: [b for b, v in B.items() if P[k]['slug'] in v['links']] for k in P}

for k, p in P.items():
    CUR['cc'] = None
    url = f"{SITE}/{p['slug']}"
    name = strip(p['h1'] + ' ' + p['h1em'])
    crumbs = [('Home', '/'), ('Services', '/marketing.html'), (p['key'], '/' + p['slug'])] if k != 'marketing' else [('Home', '/'), (p['key'], '/marketing.html')]
    schema = {"@context": "https://schema.org", "@graph": [service_ld(name, p['key'], strip(p['desc']), url, place(None, None)), crumbs_ld(crumbs), faq_ld(p['faqs']), PERSON]}
    watext = f"Hi Yedukrishna, I'd like a quote for {p['key'].lower()}."
    body = hero(p['eyebrow'], p['h1'], p['h1em'], p['lede'], crumbs, watext)
    body += block('Recent <em>work</em>', gallery(p['imgs']), alt=True) + '\n'
    body += prose_sections(p['sections'])
    body += '\n' + block('What&rsquo;s <em>included</em>', cards_html(p['cards']), alt=True)
    body += '\n' + block('How it <em>works</em>', steps_html(p['steps']))
    body += '\n' + block('By <em>city</em>', places(CITY_LINKS[k]), alt=True)
    body += '\n' + block('Common <em>questions</em>', faq_html(p['faqs']))
    rel = [r for r in p['related'] if r not in CITY_LINKS[k]] + BLOG_LINKS[k]
    body += '\n' + block('Related <em>services &amp; guides</em>', places(rel), alt=True) + '\n'
    write(p['slug'], head(p['slug'], p['title'], p['desc'], name + ' — YKS Productions', schema) + body + tail(p['key'], watext))

# Cities
HUBKEY = {v['slug']: k for k, v in P.items()}
SIBS = {'marketing': [k for k, v in C.items() if v['kind'] == 'marketing'], 'video': ['videographer-dubai.html','videographer-abu-dhabi.html','videographer-bangalore.html','videographer-mumbai.html','videographer-delhi.html'],
        'photo': ['photographer-dubai.html','photographer-abu-dhabi.html','photographer-bangalore.html','photographer-mumbai.html','photographer-delhi.html']}
CITY_EXTRA = {
 'Dubai': ['social-media-marketing-dubai.html','content-creator-dubai.html','videographer-dubai.html','photographer-dubai.html','corporate-video-dubai.html'],
 'Abu Dhabi': ['photographer-abu-dhabi.html','videographer-abu-dhabi.html','marketing-agency-abu-dhabi.html','real-estate-photographer-abu-dhabi.html','wedding-photographer-abu-dhabi.html'],
 'Bangalore': ['social-media-marketing-bangalore.html','content-creator-bangalore.html','videographer-bangalore.html','photographer-bangalore.html','corporate-video-bangalore.html','marketing-agency-bangalore.html'],
 'Mumbai': ['marketing-agency-mumbai.html','videographer-mumbai.html','photographer-mumbai.html','models-in-mumbai.html'],
 'Delhi NCR': ['marketing-agency-delhi.html','videographer-delhi.html','photographer-delhi.html','models-in-delhi.html'],
}
for path, c in C.items():
    CUR['cc'] = c['cc']
    hk = HUBKEY[c['hub']]; hub = P[hk]
    url = f'{SITE}/{path}'
    name = strip(c['h1'] + ' ' + c['h1em'])
    crumbs = [('Home', '/'), (hub['key'], '/' + c['hub']), (c['city'], '/' + path)]
    schema = {"@context": "https://schema.org", "@graph": [service_ld(name, hub['key'], strip(c['desc']), url, place(c['city'], c['country'])), crumbs_ld(crumbs), faq_ld(c['faqs']), PERSON]}
    watext = f"Hi Yedukrishna, I'd like a quote for {hub['key'].lower()} in {c['city']}."
    lede = strip(c['sections'][0][1][0]).split('. ')[0] + '.'
    lede = f"{esc(lede)} I&rsquo;m Yedukrishna Suresh of YKS Productions: {hub['key'].lower()} in {c['city']}, planned, shot and delivered by one specialist."
    body = hero(f"{hub['key']} · {c['city']}", c['h1'], c['h1em'], lede, crumbs, watext)
    body += prose_sections(c['sections'])
    body += '\n' + block(f'Work from <em>recent shoots</em>', gallery(c['imgs']), alt=True)
    body += '\n' + block(f'How we&rsquo;d work <em>in {c["city"]}</em>', steps_html(hub['steps']))
    body += '\n' + block(f'{c["city"]} <em>questions</em>', faq_html(c['faqs']), alt=True)
    links = [c['hub']] + [s for s in SIBS[c['kind']] if s != path] + [l for l in CITY_EXTRA[c['city']] if l != path] + [c['blog']]
    if c['kind'] == 'marketing': links[1:1] = ['performance-marketing.html', 'brand-strategy.html', 'social-media-marketing.html']
    seen = []; [seen.append(l) for l in links if l not in seen and os.path.exists(os.path.join(ROOT, l)) or l in C or l in B]
    body += '\n' + block('Related <em>pages</em>', places(list(dict.fromkeys(links)))) + '\n'
    write(path, head(path, c['title'], c['desc'], name + ' — YKS Productions', schema, c['region'], c['city'] + ', ' + c['country']) + body + tail(f"{hub['key']} · {c['city']}", watext))

# Blogs
BCC = {'blog/meta-ads-vs-google-ads-dubai.html': 'AE', 'blog/brand-video-cost-bangalore.html': 'IN', 'blog/linkedin-personal-branding-founders-mumbai.html': 'IN', 'blog/marketing-agency-vs-consultant-india.html': 'IN'}
for path, b in B.items():
    CUR['cc'] = BCC.get(path)
    url = f'{SITE}/{path}'
    name = strip(b['h1'] + ' ' + b['h1em'])
    crumbs = [('Home', '/'), ('Journal', '/blog/'), (name, '/' + path)]
    art = {"@type": "BlogPosting", "headline": name, "description": strip(b['desc']), "url": url, "mainEntityOfPage": url,
           "datePublished": TODAY, "dateModified": TODAY, "image": SITE + '/assets/og-cover.jpg',
           "author": {"@id": SITE + "/#yedukrishna"}, "publisher": {"@id": SITE + "/#business"}}
    schema = {"@context": "https://schema.org", "@graph": [art, crumbs_ld(crumbs), faq_ld(b['faqs']), PERSON]}
    watext = "Hi Yedukrishna, I read your guide and would like a quote."
    lede = strip(b['sections'][0][1][0]).split('. ')[0] + '.'
    body = hero(b['eyebrow'], b['h1'], b['h1em'], esc(lede) + '</p><p class="l-meta">Updated October 2026 · by Yedukrishna Suresh', crumbs, watext)
    body += prose_sections(b['sections'])
    body += '\n' + block('Visual <em>examples</em>', gallery(b['imgs']), alt=True)
    body += '\n' + block('Quick <em>answers</em>', faq_html(b['faqs']))
    body += '\n' + block('Related <em>services</em>', places(b['links']), alt=True) + '\n'
    write(path, head(path, b['title'], b['desc'], name, schema, ogtype='article').replace('href="/index.html">Back to portfolio', 'href="/blog/">← Journal') + body + tail('Journal · ' + b['title'], watext))

open(os.path.join(ROOT, 'tools/seo/written.txt'), 'w').write('\n'.join(written))
print(len(written), 'pages written')
