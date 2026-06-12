#!/usr/bin/env python3
"""Rukmini grade v4 — GLOBAL-ONLY operations.
Lesson from v3: any spatially-varying correction (skin masks, local
even-tone, blurred region maps) creates visible seams and makes the two
sides of a face look different. So v4 bans spatial ops entirely:
every operation is applied identically to every pixel. The raw frame's
own light does the work; we only polish.

  1. Filmic highlight shoulder (smooth curve, all channels equally —
     tames hot spots without shifting colour).
  2. Tiny lift of the black point (soft cinematic toe).
  3. One global white-balance nudge (kills the slight magenta cast).
  4. Gentle global saturation.
  5. Whisper of vignette (radially symmetric = cannot favour one side).
"""
import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance, ImageChops

def filmic(x):
    """Smooth tone curve: gentle toe, linear mids, soft shoulder.
    Same curve on R,G,B — hue-preserving by construction."""
    toe = 0.015                          # lift blacks a touch
    x = toe + x * (1 - toe)
    # soft shoulder above 0.72: compress overshoot smoothly
    k = 0.72
    hi = x > k
    x_hi = x[hi]
    x[hi] = k + (x_hi - k) * (1 - 0.35 * np.clip((x_hi - k) / (1 - k), 0, 1))
    return np.clip(x, 0, 1)

def grade(src, dst, crop45=None, max_w=2400):
    img = Image.open(src).convert('RGB')

    if crop45 is not None:                      # 16:9 → 4:5 around face centre
        w, h = img.size
        cw = int(h * 4 / 5)
        x0 = int(max(0, min(w - cw, crop45 * w - cw / 2)))
        img = img.crop((x0, 0, x0 + cw, h))
    if img.width > max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)

    a = np.asarray(img).astype(np.float32) / 255.0

    # 1+2. filmic curve, identical per channel
    for c in range(3):
        a[..., c] = filmic(a[..., c])

    # 3. global white balance: a touch less magenta, a touch warmer green
    #    (single multiplier per channel — uniform across the whole frame)
    a[..., 0] *= 0.992        # red down a hair
    a[..., 1] *= 1.006        # green up a hair (anti-magenta)
    a[..., 2] *= 0.996        # blue basically untouched
    a = np.clip(a, 0, 1)

    # 4. gentle global saturation (+4%)
    L = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    a = np.clip(L + (a - L) * 1.04, 0, 1)

    img = Image.fromarray((a * 255).astype(np.uint8))
    img = ImageEnhance.Contrast(img).enhance(1.02)

    # 5. whisper vignette — radially symmetric, very subtle
    w, h = img.size
    mask = Image.new('L', (w // 8, h // 8), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * .06, -h * .06, w / 8 * 1.28, h / 8 * 1.28], fill=255)
    mask = mask.resize((w, h)).filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    dark = ImageEnhance.Brightness(img).enhance(0.90)
    img = Image.composite(img, dark, mask)

    img.save(dst, 'JPEG', quality=92)
    print(dst, img.size, os.path.getsize(dst))

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/feat-rukmini.jpg', crop45=.5)
    grade('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/rukmini-1.jpg', crop45=.50)
    grade('/tmp/grade-src/ruk-09190.jpg', f'{base}/assets/rukmini/rukmini-2.jpg', crop45=.52)
    grade('/tmp/grade-src/ruk-09191.jpg', f'{base}/assets/rukmini/rukmini-3.jpg', crop45=.55)
    grade('/tmp/grade-src/ruk-09182.jpg', f'{base}/assets/rukmini/rukmini-4.jpg', crop45=.48)
