#!/usr/bin/env python3
"""Generate 1200x630 Open Graph cards.

Every platform he wants to surface on — WhatsApp, Reddit, Quora, Facebook,
Snapchat, Slack, LinkedIn, iMessage — renders a shared link from the same
og:image. 21 pages were handing them a portrait photograph, which those
platforms centre-crop into a band across someone's torso, and the talent
application page had no image at all.

Two kinds of card:

  photo  — for the photography service pages. A landscape crop biased to the
           upper third, because on a portrait photograph of a person the face
           is never in the middle, and a centre crop decapitates them.

  talent — for the roster, casting and city pages. TYPESET, not photographic:
           these get shared into modelling groups and public forums, and using
           a talent's face as the image that follows the link around the
           internet is exactly what we spent the morning preventing.

    python3 tools/build-og-cards.py
"""
import io, os, re, json, sys, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
W, H = 1200, 630

SERIF = '/System/Library/Fonts/Supplemental/Didot.ttc'
SERIF_ALT = '/System/Library/Fonts/Supplemental/Baskerville.ttc'
SANS = '/System/Library/Fonts/Supplemental/Futura.ttc'
SANS_ALT = '/System/Library/Fonts/Avenir Next.ttc'

INK = (7, 6, 10)
PAPER = (244, 237, 226)
AMBER = (255, 140, 59)
DIM = (150, 143, 133)


def font(path, size, index=0):
    for p in ([path] if isinstance(path, str) else path):
        try:
            return ImageFont.truetype(p, size, index=index)
        except Exception:
            continue
    return ImageFont.load_default()


# ── photo cards: crop biased to where a face actually is ──────────
def photo_card(src, dst):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    scale = W / w
    im = im.resize((W, max(1, int(h * scale))), Image.LANCZOS)
    w, h = im.size
    if h <= H:
        im = im.resize((W, H), Image.LANCZOS)
    else:
        # 16% down from the top: keeps heads in frame on a standing portrait,
        # and on a wider source it still reads as the top of the composition.
        top = min(max(0, int(h * 0.16)), h - H)
        im = im.crop((0, top, W, top + H))

    # a whisper of a bottom vignette so any platform's overlaid text stays legible
    grad = Image.new('L', (1, H), 0)
    for y in range(H):
        t = max(0.0, (y - H * 0.62) / (H * 0.38))
        grad.putpixel((0, y), int(150 * (t ** 1.7)))
    im = Image.composite(Image.new('RGB', (W, H), INK), im, grad.resize((W, H)))
    im.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)
    return os.path.getsize(dst)


# ── talent cards: typeset, no faces ───────────────────────────────
def talent_card(dst, kicker, headline, sub):
    im = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(im)

    # warm bloom from the lower left, same light as the site
    glow = Image.new('L', (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-360, H - 300, 760, H + 420], fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(190))
    im = Image.composite(Image.new('RGB', (W, H), (58, 26, 10)), im, glow)
    d = ImageDraw.Draw(im)

    f_kick = font([SANS, SANS_ALT], 21)
    f_head = font([SERIF, SERIF_ALT], 88)
    f_head2 = font([SERIF, SERIF_ALT], 88, index=1)
    f_sub = font([SANS_ALT, SANS], 27)
    f_brand = font([SERIF, SERIF_ALT], 30)

    x = 78
    d.text((x, 96), kicker.upper(), font=f_kick, fill=AMBER)
    d.line([(x, 138), (x + 62, 138)], fill=AMBER, width=2)

    y = 186
    for i, line in enumerate(headline):
        f = f_head2 if line.startswith('*') else f_head
        txt = line.lstrip('*')
        d.text((x, y), txt, font=f, fill=PAPER if not line.startswith('*') else AMBER)
        y += 100

    d.text((x, y + 26), sub, font=f_sub, fill=DIM)

    d.text((x, H - 92), 'YKS', font=f_brand, fill=PAPER)
    bw = d.textlength('YKS', font=f_brand)
    d.text((x + bw, H - 92), '.', font=f_brand, fill=AMBER)
    d.text((x + bw + 14, H - 84), 'Productions', font=font([SANS_ALT, SANS], 21), fill=DIM)

    im.save(dst, 'JPEG', quality=88, optimize=True, progressive=True)
    return os.path.getsize(dst)


made = []

# roster / casting / apply
for name, kicker, head, sub in [
    ('og-talents', 'YKS Talents · India',
     ['The roster', '*models · actors · creators'],
     'Cast from it, or join it. Free for talent, anywhere in India.'),
    ('og-talent-apply', 'Join the roster · India',
     ['Modelling work,', '*without the fee'],
     'No registration fee. No portfolio package. Open across India.'),
    ('og-casting', 'Casting · India',
     ['Send a brief,', '*get a shortlist'],
     'Models, actors and creators for shoots anywhere in India.'),
]:
    p = P('assets', 'og', name + '.jpg')
    made.append((name + '.jpg', talent_card(p, kicker, head, sub)))

# one per city — a Mumbai link previews as "Models in Mumbai"
cities = json.load(io.open(P('_data', 'cities.json'), encoding='utf-8'))['cities']
for c in cities:
    p = P('assets', 'og', f'og-city-{c["slug"]}.jpg')
    made.append((f'og-city-{c["slug"]}.jpg', talent_card(
        p, f'Talent · {c["city"]}',
        ['Models in', f'*{c["city"]}'],
        'Cast for a shoot, or join the roster. Free for talent.')))

print(f'talent cards : {len(made)}')
for n, sz in made[:4]:
    print(f'  {n:30} {sz // 1024}KB')
print(f'  … and {len(made) - 4} city cards')
oversize = [n for n, sz in made if sz > 300 * 1024]
print(f'over WhatsApp 300KB ceiling : {len(oversize)}')
