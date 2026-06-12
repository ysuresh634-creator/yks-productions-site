#!/usr/bin/env python3
"""Cinematic colour grade for YKS picks — PIL implementation of a
Lightroom-style recipe: per-channel tone curves (lifted teal blacks,
warm highlights), saturation, clarity-ish contrast, vignette, grain."""
from PIL import Image, ImageEnhance, ImageChops, ImageFilter, ImageDraw
import sys, os

def lut(points):
    out = []
    for i in range(256):
        x = i / 255
        y = points[-1][1]
        for (x0, y0), (x1, y1) in zip(points, points[1:]):
            if x <= x1:
                t = (x - x0) / (x1 - x0) if x1 > x0 else 0
                y = y0 + (y1 - y0) * t
                break
        out.append(max(0, min(255, round(y * 255))))
    return out

PROFILES = {
    # warm gold night portraits (Rukmini) — silk glow, teal night shadows
    # "+ grade" pass: deeper toe, hotter golds, stronger vignette
    'gold': dict(
        r=lut([(0, .012), (.22, .225), (.5, .560), (.75, .830), (1, 1.0)]),
        g=lut([(0, .018), (.22, .198), (.5, .512), (.75, .780), (1, .970)]),
        b=lut([(0, .060), (.22, .220), (.5, .462), (.75, .700), (1, .890)]),
        sat=1.16, con=1.11, bri=1.03, vig=.40, grain=7),
    # moody campaign noir (KL Rahul) — crushed teal blacks, ember reds kept hot
    'noir': dict(
        r=lut([(0, .012), (.25, .205), (.5, .530), (.75, .815), (1, 1.0)]),
        g=lut([(0, .020), (.25, .190), (.5, .495), (.75, .775), (1, .975)]),
        b=lut([(0, .055), (.25, .225), (.5, .470), (.75, .715), (1, .905)]),
        sat=1.13, con=1.09, bri=1.04, vig=.38, grain=8),
}

def vignette(img, strength):
    w, h = img.size
    m = Image.new('L', (w // 8, h // 8), 0)
    d = ImageDraw.Draw(m)
    mw, mh = m.size
    d.ellipse([-mw * .25, -mh * .25, mw * 1.25, mh * 1.25], fill=255)
    m = m.resize((w, h)).filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    dark = ImageEnhance.Brightness(img).enhance(1 - strength)
    return Image.composite(img, dark, m)

def grade(src, dst, profile, crop45=None, max_w=1600):
    p = PROFILES[profile]
    img = Image.open(src).convert('RGB')
    if crop45 is not None:                     # crop 16:9 → 4:5, cx = subject centre 0..1
        w, h = img.size
        cw = int(h * 4 / 5)
        x0 = int(max(0, min(w - cw, crop45 * w - cw / 2)))
        img = img.crop((x0, 0, x0 + cw, h))
    if img.width > max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)
    img = img.point(p['r'] + p['g'] + p['b'])
    img = ImageEnhance.Color(img).enhance(p['sat'])
    img = ImageEnhance.Contrast(img).enhance(p['con'])
    img = ImageEnhance.Brightness(img).enhance(p['bri'])
    img = vignette(img, p['vig'])
    noise = Image.effect_noise(img.size, p['grain']).convert('L')
    img = ImageChops.overlay(img, Image.merge('RGB', (noise, noise, noise)))
    img.save(dst, 'JPEG', quality=86)
    print(dst, img.size, os.path.getsize(dst))

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(f'{base}/assets/rukmini', exist_ok=True)
    os.makedirs(f'{base}/assets/klr', exist_ok=True)
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/rukmini-1.jpg', 'gold', crop45=.50)
    grade('/tmp/grade-src/ruk-09188.jpg', f'{base}/assets/rukmini/rukmini-2.jpg', 'gold', crop45=.42)
    grade('/tmp/grade-src/ruk-09191.jpg', f'{base}/assets/rukmini/rukmini-3.jpg', 'gold', crop45=.55)
    grade('/tmp/grade-src/ruk-09199.jpg', f'{base}/assets/rukmini/rukmini-4.jpg', 'gold', crop45=.50)
