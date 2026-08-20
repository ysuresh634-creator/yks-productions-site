#!/usr/bin/env python3
"""Regenerate the talent schema block on talents.html.

This used to lift each roster card into a Person entity so Google could
see who was bookable. That was the wrong trade: it published talent names
into search results. Talent names belong on our roster and nowhere else.

So the schema now describes the SERVICE — a casting and booking pool
operating across India — rather than the people in it. That is also the
thing worth ranking for: nobody searches a talent's name to find an
agency, they search "models in Mumbai" and "how to join a modelling
roster". The people stay ours; the offering goes to Google.

    python3 tools/build-talent-schema.py
"""
import io, os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'talents.html')
BASE = 'https://yksproductions.com'
MARK_A = '<!-- TALENT-SCHEMA:START -->'
MARK_B = '<!-- TALENT-SCHEMA:END -->'

roster = json.load(io.open(os.path.join(ROOT, '_data', 'roster.json'),
                           encoding='utf-8'))['talent']

CAT = {'model': ('Models', 'Fashion, editorial, commercial and runway models'),
       'actor':  ('Actors', 'Actors for film, series, ad films and branded content'),
       'influencer': ('Creators', 'Content creators and influencers for branded work')}

# Only describe a category we can actually cast. Claiming a bench we do not
# have is the one thing that would make the rest of this untrustworthy.
have = [c for c in ('model', 'actor', 'influencer')
        if any(t['cat'] == c for t in roster)]
cities = sorted({t['city'] for t in roster if t.get('country') == 'India'})

graph = [
    {
        '@type': 'CollectionPage',
        '@id': f'{BASE}/talents.html#roster',
        'url': f'{BASE}/talents.html',
        'name': 'Talent roster — models, actors and creators across India',
        'description': (
            'The YKS Talents roster. Brands and casting teams book models, '
            'actors and creators from the pool for shoots anywhere in India. '
            'Every booking is arranged through YKS Productions — talent contact '
            'details are never published.'),
        'isPartOf': {'@id': f'{BASE}/#website'},
        'about': {'@id': f'{BASE}/talents.html#service'},
        'significantLink': [f'{BASE}/casting-india.html',
                            f'{BASE}/talents/apply.html'],
    },
    {
        '@type': 'Service',
        '@id': f'{BASE}/talents.html#service',
        'name': 'Talent casting and booking — India',
        'serviceType': 'Casting and talent booking',
        'description': (
            'A managed talent pool for commercial shoots in India. Brands send '
            'a casting brief and receive a shortlist; talent join the roster '
            'free and are put forward for paid work. YKS Productions handles '
            'availability, booking and the shoot itself.'),
        'provider': {'@id': f'{BASE}/#business'},
        'areaServed': {'@type': 'Country', 'name': 'India'},
        'audience': [
            {'@type': 'BusinessAudience',
             'audienceType': 'Brands, agencies and casting directors'},
            {'@type': 'Audience',
             'audienceType': 'Models, actors and content creators seeking paid work'},
        ],
        'availableChannel': [
            {'@type': 'ServiceChannel',
             'name': 'Casting brief',
             'serviceUrl': f'{BASE}/casting-india.html#brief'},
            {'@type': 'ServiceChannel',
             'name': 'Talent application',
             'serviceUrl': f'{BASE}/talents/apply.html'},
        ],
    },
]

if have:
    graph.append({
        '@type': 'ItemList',
        '@id': f'{BASE}/talents.html#categories',
        'name': 'What can be cast from the roster',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i,
             'item': {'@type': 'Service',
                      'name': CAT[c][0],
                      'description': CAT[c][1],
                      'provider': {'@id': f'{BASE}/#business'},
                      'areaServed': {'@type': 'Country', 'name': 'India'}}}
            for i, c in enumerate(have, start=1)
        ],
    })

block = (MARK_A + '\n<script type="application/ld+json">\n'
         + json.dumps({'@context': 'https://schema.org', '@graph': graph},
                      indent=2, ensure_ascii=False)
         + '\n</script>\n' + MARK_B)

s = io.open(PAGE, encoding='utf-8').read()
if MARK_A not in s or MARK_B not in s:
    sys.exit('BUILD ABORTED — schema markers missing from talents.html')
s = re.sub(re.escape(MARK_A) + r'.*?' + re.escape(MARK_B), lambda _: block, s, flags=re.S)

# the one check that matters
leaked = [t['name'] for t in roster if t['name'] in block]
if leaked:
    sys.exit(f'BUILD ABORTED — talent name(s) in schema: {leaked}')

io.open(PAGE, 'w', encoding='utf-8').write(s)
print(f'talents.html schema : rewritten, {len(graph)} entities, 0 names')
print(f'categories declared : {", ".join(CAT[c][0] for c in have) or "(none — roster empty)"}')
print(f'cities in roster    : {", ".join(cities) or "(none)"}')
