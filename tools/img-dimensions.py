#!/usr/bin/env python3
"""Give every <img> its real width and height.

An <img> with no dimensions reserves no space until it decodes. With 190
lazy-loaded images across the site that means the page grows underneath the
reader as they scroll — worst during the momentum after a finger lifts, when
the most images enter the viewport at once. The page appears to rock up and
down. It is layout shift, and it is the single biggest one this site has.

Giving the browser the intrinsic size lets it reserve the box before the
bytes arrive, so nothing moves. It is also most of a CLS score.

    python3 tools/img-dimensions.py          # write the attributes
    python3 tools/img-dimensions.py --dry    # report only

Only touches local raster images it can actually measure. Leaves alone:
remote URLs, SVGs (no intrinsic pixel size worth pinning), data URIs, and any
tag that already carries both attributes.

CSS must pair with this — `img { height: auto }` — or a width-constrained
image would be squashed to the literal height. The script checks for it.
"""
import io, os, re, sys, glob, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry' in sys.argv

SKIP_DIR = re.compile(r'(^_|node_modules|/vendor/)')
IMG = re.compile(r'<img\b[^>]*>', re.I)
SRC = re.compile(r'\bsrc\s*=\s*"([^"]+)"', re.I)
HAS_W = re.compile(r'\bwidth\s*=', re.I)
HAS_H = re.compile(r'\bheight\s*=', re.I)

_cache = {}


def dimensions(path):
    """(w, h) in pixels, or None if it cannot be measured."""
    if path in _cache:
        return _cache[path]
    out = None
    try:
        r = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path],
                           capture_output=True, text=True, timeout=20)
        w = re.search(r'pixelWidth:\s*(\d+)', r.stdout)
        h = re.search(r'pixelHeight:\s*(\d+)', r.stdout)
        if w and h:
            out = (int(w.group(1)), int(h.group(1)))
    except Exception:
        out = None
    _cache[path] = out
    return out


def resolve(src, html_path):
    """Site-absolute and page-relative both land on a real file."""
    if re.match(r'^(https?:)?//|^data:', src):
        return None
    src = src.split('?')[0].split('#')[0]
    if src.lower().endswith('.svg'):
        return None
    p = os.path.join(ROOT, src.lstrip('/')) if src.startswith('/') \
        else os.path.normpath(os.path.join(os.path.dirname(html_path), src))
    return p if os.path.isfile(p) else None


def main():
    files = [f for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True)
             if not SKIP_DIR.search(os.path.relpath(f, ROOT))]
    touched = added = skipped = unmeasurable = 0

    for f in sorted(files):
        html = io.open(f, encoding='utf-8', errors='replace').read()
        changed = False

        def fix(m):
            nonlocal added, skipped, unmeasurable, changed
            tag = m.group(0)
            if HAS_W.search(tag) and HAS_H.search(tag):
                skipped += 1
                return tag
            s = SRC.search(tag)
            if not s:
                return tag
            path = resolve(s.group(1), f)
            if not path:
                skipped += 1
                return tag
            d = dimensions(path)
            if not d:
                unmeasurable += 1
                return tag
            w, h = d
            # insert right after <img so the attributes read first in source
            new = re.sub(r'^<img\b', '<img width="%d" height="%d"' % (w, h), tag, count=1, flags=re.I)
            added += 1
            changed = True
            return new

        out = IMG.sub(fix, html)
        if changed and not DRY:
            io.open(f, 'w', encoding='utf-8').write(out)
        if changed:
            touched += 1

    print(('  would add' if DRY else '  added   ') + ' dimensions to %d images' % added)
    print('  files %s          : %d' % ('affected' if DRY else 'written ', touched))
    print('  already had them / not local: %d' % skipped)
    if unmeasurable:
        print('  could not measure           : %d' % unmeasurable)

    # the CSS half of the fix — without height:auto a constrained image squashes
    for css in ('css/style.css', 'css/landing.css'):
        p = os.path.join(ROOT, css)
        if os.path.isfile(p):
            body = io.open(p, encoding='utf-8').read()
            rule = re.search(r'^img\{([^}]*)\}', body, re.M)
            ok = rule and 'height:auto' in rule.group(1)
            print('  %-18s img{height:auto} %s' % (css, 'present' if ok else 'MISSING — images will squash'))


if __name__ == '__main__':
    main()
