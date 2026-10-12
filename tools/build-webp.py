#!/usr/bin/env python3
"""Generate WebP derivatives for every JPEG/PNG under assets/ (originals kept for
OG cards and as fallback). For foo.jpg writes foo.webp (<=1600w) and
foo-800.webp (<=800w). Idempotent: skips up-to-date outputs."""
import os, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ('assets/og/', 'assets/favicon')
n = 0
for src in glob.glob(os.path.join(ROOT, 'assets', '**', '*'), recursive=True):
    rel = os.path.relpath(src, ROOT)
    if not rel.lower().endswith(('.jpg', '.jpeg', '.png')) or rel.startswith(SKIP):
        continue
    base = os.path.splitext(src)[0]
    for w, out in ((1600, base + '.webp'), (800, base + '-800.webp')):
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            continue
        im = Image.open(src)
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        q = 80
        while True:
            im.save(out, 'WEBP', quality=q, method=6)
            if os.path.getsize(out) < 200_000 or q <= 50: break
            q -= 8
        n += 1
print('webp written:', n)
