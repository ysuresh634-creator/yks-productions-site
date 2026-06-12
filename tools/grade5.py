#!/usr/bin/env python3
"""Rukmini grade v5 = v4 global look + proper retouching.
Two additions over v4, both seam-safe (weights are smooth functions of
each pixel's own colour/brightness — never of position):

  A. Specular suppression — the harsh hot light on face/neck. Pixels that
     are BOTH skin-hued AND very bright get blended toward the local
     diffuse skin colour (large blur carries it) and slightly darkened.
     Smooth luminance ramp = no edges.
  B. Skin smoothing — frequency separation: mid-frequency blotchiness is
     smoothed, fine pore/texture detail is preserved and re-added, so it
     looks like skin, not plastic. Applied only on skin-hued pixels at
     ~55% strength.

Then the approved v4 global finish: filmic shoulder, WB nudge, +4% sat,
symmetric vignette.
"""
import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0 + 1e-6), 0, 1)
    return t * t * (3 - 2 * t)

def gblur(a, r):
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(r)), np.float32) / 255.0

def filmic(x):
    toe = 0.015
    x = toe + x * (1 - toe)
    k = 0.72
    hi = x > k
    x_hi = x[hi]
    x[hi] = k + (x_hi - k) * (1 - 0.35 * np.clip((x_hi - k) / (1 - k), 0, 1))
    return np.clip(x, 0, 1)

def grade(src, dst, crop45=None, max_w=2400):
    img = Image.open(src).convert('RGB')
    if crop45 is not None:
        w, h = img.size
        cw = int(h * 4 / 5)
        x0 = int(max(0, min(w - cw, crop45 * w - cw / 2)))
        img = img.crop((x0, 0, x0 + cw, h))
    if img.width > max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)

    a = np.asarray(img).astype(np.float32) / 255.0
    W = img.width

    # ----- smooth skin weight (pixel-colour-keyed, fully continuous)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1); C = mx - mn + 1e-6
    hue = np.zeros_like(mx)
    m = (mx == R); hue[m] = ((G - B)[m] / C[m]) % 6
    m = (mx == G); hue[m] = (B - R)[m] / C[m] + 2
    m = (mx == B); hue[m] = (R - G)[m] / C[m] + 4
    hue *= 60.0
    sat = C / (mx + 1e-6)
    L = 0.299 * R + 0.587 * G + 0.114 * B
    skinw = (np.exp(-(((hue - 26) / 24) ** 2))          # warm hues, gaussian falloff
             * smoothstep(0.06, 0.16, sat) * (1 - smoothstep(0.68, 0.82, sat))
             * smoothstep(0.18, 0.30, L))

    # ----- A. specular suppression (harsh light on face/neck)
    shine = smoothstep(0.70, 0.92, L) * skinw            # only bright skin
    diffuse = gblur(a, max(10, W // 90))                 # local diffuse skin colour
    k = (0.55 * shine)[..., None]
    a = a * (1 - k) + diffuse * k                        # fill shine with skin tone
    a *= (1 - 0.12 * shine)[..., None]                   # and bring it down a stop
    a = np.clip(a, 0, 1)

    # ----- B. skin smoothing with texture preservation
    base   = gblur(a, max(6, W // 140))                  # smooths blotchiness
    fine   = a - gblur(a, max(2, W // 600))              # pore-level detail
    smooth = np.clip(base + fine * 0.9, 0, 1)            # smooth tones + real texture
    kk = (0.55 * skinw)[..., None]
    a = a * (1 - kk) + smooth * kk

    # ----- approved v4 global finish
    for c in range(3):
        a[..., c] = filmic(a[..., c])
    a[..., 0] *= 0.992; a[..., 1] *= 1.006; a[..., 2] *= 0.996
    a = np.clip(a, 0, 1)
    L2 = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    a = np.clip(L2 + (a - L2) * 1.04, 0, 1)

    out = Image.fromarray((a * 255).astype(np.uint8))
    out = ImageEnhance.Contrast(out).enhance(1.02)

    w, h = out.size
    mask = Image.new('L', (w // 8, h // 8), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * .06, -h * .06, w / 8 * 1.28, h / 8 * 1.28], fill=255)
    mask = mask.resize((w, h)).filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    dark = ImageEnhance.Brightness(out).enhance(0.90)
    out = Image.composite(out, dark, mask)

    out.save(dst, 'JPEG', quality=92)
    print(dst, out.size, os.path.getsize(dst))

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/feat-rukmini.jpg', crop45=.5)
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/rukmini-1.jpg', crop45=.50)
    grade('/tmp/grade-src/ruk-09190.jpg', f'{base}/assets/rukmini/rukmini-2.jpg', crop45=.52)
    grade('/tmp/grade-src/ruk-09191.jpg', f'{base}/assets/rukmini/rukmini-3.jpg', crop45=.55)
    grade('/tmp/grade-src/ruk-09182.jpg', f'{base}/assets/rukmini/rukmini-4.jpg', crop45=.48)
