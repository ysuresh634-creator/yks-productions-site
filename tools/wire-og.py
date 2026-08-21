#!/usr/bin/env python3
"""Point every public page at a correct 1200x630 Open Graph card, and give
the platforms the rest of what they need to render it.

WhatsApp, Reddit, Quora, Facebook, Snapchat, Slack, LinkedIn and iMessage all
build their link preview from these tags. Three things were wrong:
  · 21 pages pointed at a portrait photograph, which every one of those
    platforms crops into a band across the subject's chest
  · the talent application page had no og:image at all
  · nothing declared og:image:width/height, so a scraper has to download the
    image before it can lay out the card — and several of them just give up

Internal pages (contact sheets, client review, previews) are skipped: they are
robots-disallowed and are not meant to be shared.

    python3 tools/wire-og.py
"""
import io, os, re, json, glob, sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
BASE = 'https://yksproductions.com'
W, H = 1200, 630

SKIP = {'contact-sheet.html', 'cs-couple.html', 'cs-rukmini.html', 'cs-wedding.html',
        'ruk-choose.html', 'review.html', 'edit.html', 'labs.html', 'studio.html',
        'work-preview.html', 'hero-motion-preview.html', '_fonts-preview.html',
        'yks-productions-onepage.html'}

# Pages that must never carry a talent's face into a public forum.
TALENT_CARD = {
    'talents.html': ('og-talents.jpg', 'The YKS Talents roster — models, actors and creators across India'),
    'talents/apply.html': ('og-talent-apply.jpg', 'Join the YKS Talents roster — free, no registration fee, open across India'),
    'casting-india.html': ('og-casting.jpg', 'Send a casting brief and get a shortlist — models, actors and creators in India'),
}
for c in json.load(io.open(P('_data', 'cities.json'), encoding='utf-8'))['cities']:
    TALENT_CARD[f'models-in-{c["slug"]}.html'] = (
        f'og-city-{c["slug"]}.jpg',
        f'Models, actors and creators in {c["city"]} — cast for a shoot or join the roster')


def photo_card(src, dst):
    """Landscape crop biased to the upper third — on a standing portrait the
    face is never in the middle, and a centre crop decapitates the subject."""
    im = Image.open(src).convert('RGB')
    w, h = im.size
    im = im.resize((W, max(1, int(h * (W / w)))), Image.LANCZOS)
    w, h = im.size
    if h <= H:
        im = im.resize((W, H), Image.LANCZOS)
    else:
        top = min(max(0, int(h * 0.16)), h - H)
        im = im.crop((0, top, W, top + H))
    grad = Image.new('L', (1, H), 0)
    for y in range(H):
        t = max(0.0, (y - H * 0.62) / (H * 0.38))
        grad.putpixel((0, y), int(150 * (t ** 1.7)))
    im = Image.composite(Image.new('RGB', (W, H), (7, 6, 10)), im, grad.resize((W, H)))
    im.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)


def alt_for(page, s):
    m = re.search(r'<title>([^<|]+)', s)
    return (m.group(1).strip() if m else 'YKS Productions') + ' — YKS Productions'


pages = [f for f in sorted(glob.glob('*.html') + glob.glob('*/*.html'))
         if os.path.basename(f) not in SKIP and not f.startswith('google')
         and not f.startswith('talents/id/')]

cropped, rewired, enriched, skipped = 0, 0, 0, []
for f in pages:
    s = io.open(P(f), encoding='utf-8').read()
    if '<head>' not in s:
        continue
    key = f.replace(os.sep, '/')

    # ── 1. choose the right card ──
    if key in TALENT_CARD:
        fn, alt = TALENT_CARD[key]
        url = f'{BASE}/assets/og/{fn}'
    else:
        m = re.search(r'og:image" content="([^"]+)"', s)
        alt = alt_for(f, s)
        if not m:
            url = f'{BASE}/assets/og-cover.jpg'
        else:
            rel = m.group(1).replace(BASE, '').split('?')[0]
            src = P(*rel.lstrip('/').split('/'))
            if not os.path.exists(src):
                url = f'{BASE}/assets/og-cover.jpg'
            else:
                im = Image.open(src)
                if im.size[0] / im.size[1] >= 1.3:
                    url = BASE + rel            # already landscape, leave it
                else:
                    out = 'og-' + os.path.splitext(os.path.basename(rel))[0] + '.jpg'
                    dst = P('assets', 'og', out)
                    if not os.path.exists(dst):
                        photo_card(src, dst)
                        cropped += 1
                    url = f'{BASE}/assets/og/{out}'

    if re.search(r'og:image" content="[^"]+"', s):
        new = re.sub(r'og:image" content="[^"]+"', f'og:image" content="{url}"', s, count=1)
        if new != s:
            rewired += 1
        s = new
    else:
        s = s.replace('<meta name="twitter:card"',
                      f'<meta property="og:image" content="{url}" />\n<meta name="twitter:card"', 1)
        if f'og:image" content="{url}"' not in s:      # no twitter:card either
            s = s.replace('</head>', f'<meta property="og:image" content="{url}" />\n</head>', 1)
        rewired += 1

    # ── 2. the tags that let a scraper lay the card out without downloading it ──
    s = re.sub(r'\s*<meta property="og:image:(?:width|height|alt|type)"[^>]*>', '', s)
    s = re.sub(r'\s*<meta property="og:locale"[^>]*>', '', s)
    s = re.sub(r'\s*<meta name="twitter:image"[^>]*>', '', s)
    block = (f'<meta property="og:image" content="{url}" />\n'
             f'<meta property="og:image:secure_url" content="{url}" />\n'
             f'<meta property="og:image:type" content="image/jpeg" />\n'
             f'<meta property="og:image:width" content="1200" />\n'
             f'<meta property="og:image:height" content="630" />\n'
             f'<meta property="og:image:alt" content="{alt[:190]}" />\n'
             f'<meta property="og:locale" content="en_IN" />\n'
             f'<meta name="twitter:image" content="{url}" />')
    s = re.sub(r'\s*<meta property="og:image:secure_url"[^>]*>', '', s)
    s = re.sub(r'<meta property="og:image" content="[^"]+" />', block, s, count=1)
    enriched += 1

    io.open(P(f), 'w', encoding='utf-8').write(s)

print(f'public pages     : {len(pages)}')
print(f'landscape crops  : {cropped} new')
print(f'og:image rewired : {rewired}')
print(f'preview metadata : {enriched} pages now carry width/height/alt/locale')
