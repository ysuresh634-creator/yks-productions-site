#!/usr/bin/env python3
"""Put the business entity on every page, not just the homepage.

An AI assistant answering "who shoots fashion in Bangalore" fetches ONE page.
73 public pages carried only a dangling reference — {"@id": ".../#business"} —
pointing at a node that exists nowhere on the page being read. The assistant
sees a pointer to nothing and learns nothing about who the business is. Same
for a city page: the roster's provider was an @id with no entity behind it.

This projects a compact version of the homepage's own entity onto every page.
The canonical values are READ FROM index.html rather than retyped here, because
two copies of an entity that disagree is worse than one copy that is missing —
conflicting names, URLs or sameAs sets are how an entity gets split in two.

Email is deliberately not propagated. The homepage publishes it; putting it on
73 more pages only feeds scrapers, and the contact points carry the real route.

Idempotent. Run after adding pages.

    python3 tools/wire-entity.py
"""
import io, os, re, json, glob, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
A, B = '<!-- ENTITY:START -->', '<!-- ENTITY:END -->'

SKIP_PREFIX = ('contact-sheet', 'cs-', 'ruk-', 'review', 'edit', 'labs', 'studio',
               'work-preview', 'hero-', '_fonts', 'google', 'yks-productions-onepage',
               'talents/id/')

# ── read the canonical entity out of the homepage ──────────────
home = io.open(P('index.html'), encoding='utf-8').read()
biz = person = None
for blob in re.findall(r'<script type="application/ld\+json">(.*?)</script>', home, re.S):
    try:
        j = json.loads(blob)
    except Exception:
        continue
    for n in (j.get('@graph') or [j]):
        if n.get('@id', '').endswith('#business'):
            biz = n
        if n.get('@id', '').endswith('#yedukrishna') and n.get('@type') == 'Person':
            person = n
if not biz or not person:
    sys.exit('BUILD ABORTED — could not read the canonical entity from index.html')

compact = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': biz['@type'],
            '@id': biz['@id'],
            'name': biz['name'],
            'alternateName': biz.get('alternateName'),
            'description': biz.get('description'),
            'url': biz['url'],
            'logo': biz.get('logo'),
            'image': biz.get('image'),
            'sameAs': biz.get('sameAs', []),
            'areaServed': biz.get('areaServed'),
            'contactPoint': biz.get('contactPoint'),
            'founder': {'@id': person['@id']},
        },
        {
            '@type': 'Person',
            '@id': person['@id'],
            'name': person['name'],
            'jobTitle': person.get('jobTitle'),
            'hasOccupation': person.get('hasOccupation'),
            'image': person.get('image'),
            'url': person['url'],
            'sameAs': biz.get('sameAs', []),
            'worksFor': {'@id': biz['@id']},
            'knowsLanguage': person.get('knowsLanguage'),
            'workLocation': person.get('workLocation'),
        },
    ],
}
compact['@graph'] = [{k: v for k, v in n.items() if v is not None} for n in compact['@graph']]
block = (A + '\n<script type="application/ld+json">\n'
         + json.dumps(compact, indent=2, ensure_ascii=False)
         + '\n</script>\n' + B)

pages = [f for f in sorted(glob.glob('*.html') + glob.glob('*/*.html'))
         if not f.replace(os.sep, '/').startswith(SKIP_PREFIX) and f != 'index.html']

added = refreshed = 0
for f in pages:
    s = io.open(P(f), encoding='utf-8').read()
    if '</head>' not in s:
        continue
    if A in s:
        s = re.sub(re.escape(A) + r'.*?' + re.escape(B), lambda _: block, s, flags=re.S)
        refreshed += 1
    else:
        s = s.replace('</head>', block + '\n</head>', 1)
        added += 1
    io.open(P(f), 'w', encoding='utf-8').write(s)

# ── validate: every page parses, and nobody contradicts the homepage ──
bad = []
for f in pages + ['index.html']:
    s = io.open(P(f), encoding='utf-8').read()
    ids = {}
    for blob in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            j = json.loads(blob)
        except Exception as ex:
            bad.append(f'{f}: invalid JSON-LD — {ex}')
            continue
        for n in (j.get('@graph') or [j]):
            i = n.get('@id')
            if not i or not n.get('name'):
                continue
            if i in ids and ids[i] != n['name']:
                bad.append(f'{f}: {i} is named both "{ids[i]}" and "{n["name"]}"')
            ids[i] = n['name']
    for i, nm in ids.items():
        if i == biz['@id'] and nm != biz['name']:
            bad.append(f'{f}: business entity name drifted to "{nm}"')
        if i == person['@id'] and nm != person['name']:
            bad.append(f'{f}: person entity name drifted to "{nm}"')

print(f'entity added to    : {added} pages')
print(f'entity refreshed on: {refreshed} pages')
print(f'sameAs propagated  : {len(biz.get("sameAs", []))} profile links to every page')
print(f'contradictions     : {len(bad)}')
for b in bad[:10]:
    print('  ✗', b)
sys.exit(1 if bad else 0)
