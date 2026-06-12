#!/usr/bin/env python3
"""Skin-protective cinematic grade (v2) for the Rukmini set.
Philosophy: skin stays neutral and natural — the cinema happens in the
shadows (teal toe), the highlights (gentle gold) and the frame (vignette).
Skin hues are masked in HSV space and shielded from saturation/warm pushes."""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance, ImageChops
import os, sys

def soft_s(x, s=0.16):                      # gentle filmic S on 0..1
    return np.clip(x + s * 4 * x * (1 - x) * (x - 0.5), 0, 1)

def grade_skin(src, dst, crop45=None, max_w=1600):
    img = Image.open(src).convert('RGB')
    if crop45 is not None:
        w, h = img.size
        cw = int(h * 4 / 5)
        x0 = int(max(0, min(w - cw, crop45 * w - cw / 2)))
        img = img.crop((x0, 0, x0 + cw, h))
    if img.width > max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)

    a = np.asarray(img).astype(np.float32) / 255.0
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    L = 0.299 * R + 0.587 * G + 0.114 * B

    # skin mask in HSV: warm hues, moderate saturation, lit
    mx, mn = a.max(-1), a.min(-1)
    C = mx - mn + 1e-6
    hue = np.zeros_like(mx)
    m = (mx == R); hue[m] = ((G - B)[m] / C[m]) % 6
    m = (mx == G); hue[m] = (B - R)[m] / C[m] + 2
    m = (mx == B); hue[m] = (R - G)[m] / C[m] + 4
    hue *= 60.0
    sat = C / (mx + 1e-6)
    skin = ((hue > 5) & (hue < 50) & (sat > 0.12) & (sat < 0.72) & (L > 0.22) & (L < 0.95)).astype(np.float32)
    skin = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9)), np.float32) / 255.0

    # tone: gentle S-curve on all channels (same curve = no cast on mids)
    for i in range(3):
        a[..., i] = soft_s(a[..., i])

    # split tone OUTSIDE skin: teal toe, gold shoulder
    ws = np.clip(1 - L, 0, 1) ** 2.4 * (1 - skin)
    wh = np.clip(L, 0, 1) ** 2.6 * (1 - skin)
    a[..., 2] = np.clip(a[..., 2] + 0.050 * ws - 0.022 * wh, 0, 1)   # blue: up in shadows, down in highs
    a[..., 0] = np.clip(a[..., 0] - 0.018 * ws + 0.028 * wh, 0, 1)   # red: down in shadows, up in highs

    # saturation: +7% scene, ~+1% on skin
    L2 = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    satf = (1.07 - 0.06 * skin)[..., None]
    a = np.clip(L2 + (a - L2) * satf, 0, 1)

    img = Image.fromarray((a * 255).astype(np.uint8))
    img = ImageEnhance.Contrast(img).enhance(1.025)

    # mild vignette + fine grain
    w, h = img.size
    mask = Image.new('L', (w // 8, h // 8), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * .03, -h * .03, w / 8 * 1.22, h / 8 * 1.22], fill=255)
    mask = mask.resize((w, h)).filter(ImageFilter.GaussianBlur(min(w, h) // 7))
    dark = ImageEnhance.Brightness(img).enhance(0.78)
    img = Image.composite(img, dark, mask)
    noise = Image.effect_noise((w, h), 4).convert('L')
    img = ImageChops.overlay(img, Image.merge('RGB', (noise, noise, noise)))

    img.save(dst, 'JPEG', quality=88)
    print(dst, img.size, os.path.getsize(dst))

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    grade_skin('/tmp/grade-src/ruk-09185.jpg', f'{base}/assets/rukmini/rukmini-1.jpg', crop45=.50)
    grade_skin('/tmp/grade-src/ruk-09190.jpg', f'{base}/assets/rukmini/rukmini-2.jpg', crop45=.52)
    grade_skin('/tmp/grade-src/ruk-09191.jpg', f'{base}/assets/rukmini/rukmini-3.jpg', crop45=.55)
    grade_skin('/tmp/grade-src/ruk-09182.jpg', f'{base}/assets/rukmini/rukmini-4.jpg', crop45=.48)
