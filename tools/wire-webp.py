#!/usr/bin/env python3
"""Point <img> tags at WebP derivatives (from build-webp.py) with an 800w/1600w
srcset, fill width/height, lazy-load below the fold and give the first (hero)
image fetchpriority=high. JPEG originals stay on disk for OG cards / fallback
(data-full keeps lightboxes at full size). Idempotent."""
import os, re, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SKIP = ('studio.html', 'creator-agreement.html', 'talent-agreement.html', 'agreement.html', 'agreement-short.html')
def attr(t, k):
    m = re.search(r'\s%s="([^"]*)"' % k, t); return m.group(1) if m else None
def setattr_(t, k, v):
    if attr(t, k) is not None: return re.sub(r'(\s%s=")[^"]*(")' % k, lambda m: m.group(1) + v + m.group(2), t, count=1)
    return t[:-2].rstrip() + ' %s="%s" />' % (k, v) if t.endswith('/>') else t[:-1] + ' %s="%s">' % (k, v)
changed = 0
for page in sorted(glob.glob('*.html') + glob.glob('*/*.html') + glob.glob('*/*/*.html')):
    if os.path.basename(page) in SKIP: continue
    s = open(page, encoding='utf-8').read()
    body_at = s.find('<body')
    first = [True]
    def fix(m):
        t = m.group(0)
        src = attr(t, 'src')
        if not src or src.startswith(('http', 'data:')): return t
        path = src.split('?')[0]
        disk = path.lstrip('/') if path.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(page), path))
        is_first = first[0]; first[0] = False
        if disk.lower().endswith(('.jpg', '.jpeg', '.png')) and os.path.exists(disk):
            base_disk = os.path.splitext(disk)[0]; base_url = os.path.splitext(path)[0]
            if os.path.exists(base_disk + '.webp'):
                W, H = Image.open(disk).size
                if attr(t, 'width') is None or attr(t, 'height') is None:
                    t = setattr_(t, 'width', str(W)); t = setattr_(t, 'height', str(H))
                if attr(t, 'data-full') is None: t = setattr_(t, 'data-full', base_url + '.webp')
                t = setattr_(t, 'src', base_url + '.webp')
                if W > 800 and attr(t, 'srcset') is None:
                    t = setattr_(t, 'srcset', f'{base_url}-800.webp 800w, {base_url}.webp {min(W,1600)}w')
                    t = setattr_(t, 'sizes', '(max-width: 800px) 100vw, 800px')
        if is_first and attr(t, 'loading') != 'lazy':
            # the first image the author didn't mark lazy is the hero
            if attr(t, 'fetchpriority') is None: t = setattr_(t, 'fetchpriority', 'high')
        elif attr(t, 'loading') is None:
            t = setattr_(t, 'loading', 'lazy')
        if attr(t, 'decoding') is None: t = setattr_(t, 'decoding', 'async')
        return t
    head, body = s[:body_at], s[body_at:]
    nb = re.sub(r'<img\b[^>]*>', fix, body)
    if nb != body:
        open(page, 'w', encoding='utf-8').write(head + nb); changed += 1
print('pages updated:', changed)
