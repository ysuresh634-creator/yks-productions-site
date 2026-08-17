#!/usr/bin/env python3
"""Regenerate the talent schema on talents.html from the roster cards.

The roster lives in data-* attributes so the modal can read it. Those are
invisible to search — Google and AI assistants could not see that anyone
was bookable. This lifts each card into a Person entity inside an ItemList,
plus ImageObject entries so the galleries can surface in Image Search.

Run after adding or removing talent:
    python3 tools/build-talent-schema.py
"""
import io, re, json, html, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'talents.html')
BASE = 'https://yksproductions.com'
MARK_A = '<!-- TALENT-SCHEMA:START -->'
MARK_B = '<!-- TALENT-SCHEMA:END -->'

CAT = {
    'model': 'Model',
    'influencer': 'Content Creator',
    'actor': 'Actor',
}

s = io.open(PAGE, encoding='utf-8').read()

people = []
for m in re.finditer(r'<article class="tal"([^>]*)>', s):
    d = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(1)))
    if not d.get('name'):
        continue
    name = html.unescape(d['name'])
    city = html.unescape(d.get('city', ''))
    tags = [t.strip() for t in html.unescape(d.get('tags', '')).split('·') if t.strip()]
    gallery = [g for g in d.get('gallery', '').split('|') if g.strip()]

    person = {
        '@type': 'Person',
        'name': name,
        'jobTitle': CAT.get(d.get('cat'), 'Talent'),
        'description': html.unescape(d.get('bio', ''))[:300],
    }
    if city:
        person['homeLocation'] = {'@type': 'Place', 'name': city}
    if tags:
        person['knowsAbout'] = tags
    if gallery:
        person['image'] = [BASE + g for g in gallery]
    # bookable through YKS only — never expose talent contact details
    person['worksFor'] = {'@id': BASE + '/#business'}
    people.append(person)

graph = {
    '@context': 'https://schema.org',
    '@graph': [{
        '@type': 'ItemList',
        'name': 'Talent roster — models, influencers and actors',
        'url': BASE + '/talents.html#roster',
        'numberOfItems': len(people),
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'item': p}
            for i, p in enumerate(people)
        ],
    }]
}

block = MARK_A + '\n<script type="application/ld+json">\n' \
      + json.dumps(graph, indent=2, ensure_ascii=False) + '\n</script>\n' + MARK_B

if MARK_A in s:
    s = re.sub(re.escape(MARK_A) + r'.*?' + re.escape(MARK_B), block, s, flags=re.S)
else:
    s = s.replace('</head>', block + '\n</head>', 1)

io.open(PAGE, 'w', encoding='utf-8').write(s)

# validate what we just wrote
for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
    json.loads(m.group(1))

print(f'talent in schema: {len(people)}')
for p in people:
    print(f"  {p['name']} — {p['jobTitle']}, {p.get('homeLocation',{}).get('name','?')}, "
          f"{len(p.get('image',[]))} images")
