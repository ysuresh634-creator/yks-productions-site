#!/usr/bin/env python3
"""Skin-perfect grade (v3) — the priority is the SKIN, not the cinema look.
Pipeline (in order):
  1.  Highlight rolloff — compress the brightest pixels (kills hot cheeks).
  2.  Local even-tone — gentle frequency-separation to balance left/right
      lit/shadow side of face without flattening detail.
  3.  Skin colour clean-up — pull magenta out of skin hues, anchor to a
      warm neutral. Slight saturation drop ON skin so highlights aren't
      orange.
  4.  Background mood — teal-tinted dark falloff (cinema lives here, not
      on her face).
  5.  Filmic toe + gentle vignette + fine grain.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance, ImageChops

def to_np(img):  return np.asarray(img).astype(np.float32) / 255.0
def to_img(a):   return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    v = mx
    s = np.where(mx > 1e-6, (mx - mn) / (mx + 1e-6), 0)
    C = mx - mn + 1e-6
    h = np.zeros_like(mx)
    m = (mx == r); h[m] = ((g - b)[m] / C[m]) % 6
    m = (mx == g); h[m] = (b - r)[m] / C[m] + 2
    m = (mx == b); h[m] = (r - g)[m] / C[m] + 4
    return h * 60.0, s, v

def grade(src, dst, crop45=None, max_w=2400):
    img = Image.open(src).convert('RGB')

    # crop 16:9 -> 4:5 around the face centre (cx in 0..1)
    if crop45 is not None:
        w, h = img.size
        cw = int(h * 4 / 5)
        x0 = int(max(0, min(w - cw, crop45 * w - cw / 2)))
        img = img.crop((x0, 0, x0 + cw, h))
    if img.width > max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)

    a = to_np(img)
    H, S, V = rgb_to_hsv(a)
    L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]

    # ── 1. SKIN MASK — wider than before, with a soft halo
    skin = (
        ((H > 4) & (H < 48)) &
        (S > 0.10) & (S < 0.78) &
        (L > 0.20) & (L < 0.96)
    ).astype(np.float32)
    sm = Image.fromarray((skin * 255).astype(np.uint8))
    sm = sm.filter(ImageFilter.GaussianBlur(radius=max(8, img.width // 250)))
    skin = np.asarray(sm, np.float32) / 255.0

    # ── 2. HIGHLIGHT ROLLOFF — squash the hottest values so cheeks/forehead
    #    don't read as glowing patches. Operates on luminance to keep colour.
    knee, ceil = 0.78, 1.0
    over = np.clip((L - knee) / (ceil - knee), 0, 1)        # 0..1 in the hot zone
    rolloff = 1 - over * over * 0.32                         # quadratic gentle squash
    a *= rolloff[..., None]
    a = np.clip(a, 0, 1)
    L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]

    # ── 3. EVEN-TONE — large-radius gaussian gives "local average"; subtract
    #    from luminance, scale partially, add back. This evens out brightness
    #    asymmetry across the face WITHOUT killing facial structure.
    bigblur = max(40, img.width // 18)
    Lo = np.asarray(Image.fromarray((L * 255).astype(np.uint8))
                    .filter(ImageFilter.GaussianBlur(bigblur)), np.float32) / 255.0
    avg = float(L.mean())
    # pull only the skin towards the average — background keeps its mood
    correction = (avg - Lo) * 0.42 * skin
    for c in range(3):
        a[..., c] = np.clip(a[..., c] + correction, 0, 1)

    # ── 4. SKIN COLOUR CLEAN-UP — drop magenta in skin hues (slightly cool the
    #    red channel where skin is detected), pull saturation down on skin a
    #    touch so highlights don't read orange.
    a[..., 0] = a[..., 0] - 0.025 * skin                     # red
    a[..., 2] = a[..., 2] + 0.012 * skin                     # tiny blue lift, kills magenta
    a = np.clip(a, 0, 1)
    L2 = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    sat = (1.0 - 0.12 * skin)[..., None]                     # -12% saturation on skin
    a = np.clip(L2 + (a - L2) * sat, 0, 1)

    # ── 5. BACKGROUND MOOD — teal toe in shadows, gentle warm in highlights,
    #    BUT only where skin mask is low.
    notskin = 1 - skin
    Ln = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    shadow_w = (np.clip(1 - Ln, 0, 1) ** 2.4) * notskin
    high_w   = (np.clip(Ln, 0, 1) ** 2.6) * notskin
    a[..., 2] = np.clip(a[..., 2] + 0.055 * shadow_w - 0.020 * high_w, 0, 1)
    a[..., 0] = np.clip(a[..., 0] - 0.018 * shadow_w + 0.022 * high_w, 0, 1)

    # ── 6. Output — filmic gamma, vignette, fine grain
    img = to_img(a)
    img = ImageEnhance.Contrast(img).enhance(1.04)

    w, h = img.size
    mask = Image.new('L', (w // 8, h // 8), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * .04, -h * .04, w / 8 * 1.22, h / 8 * 1.22], fill=255)
    mask = mask.resize((w, h)).filter(ImageFilter.GaussianBlur(min(w, h) // 7))
    dark = ImageEnhance.Brightness(img).enhance(0.80)
    img = Image.composite(img, dark, mask)
    noise = Image.effect_noise((w, h), 3).convert('L')
    img = ImageChops.overlay(img, Image.merge('RGB', (noise, noise, noise)))

    img.save(dst, 'JPEG', quality=90)
    print(dst, img.size, os.path.getsize(dst))

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # featured card uses 09185 (per user choice)
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/feat-rukmini.jpg', crop45=.5)
    # also re-render the row so it stays consistent with the new look
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/rukmini-1.jpg', crop45=.50)
    grade('/tmp/grade-src/ruk-09190.jpg', f'{base}/assets/rukmini/rukmini-2.jpg', crop45=.52)
    grade('/tmp/grade-src/ruk-09191.jpg', f'{base}/assets/rukmini/rukmini-3.jpg', crop45=.55)
    grade('/tmp/grade-src/ruk-09182.jpg', f'{base}/assets/rukmini/rukmini-4.jpg', crop45=.48)
