#!/usr/bin/env python3
"""Wire the city pages into the pages that should point at them.

A page nobody links to is a page Google crawls late and trusts little.
These ten only earn their keep if the roster, the casting page and the
application page all hand authority to them — and if each of those three
frames the link for its own audience, because a brand and a model are not
looking for the same thing when they see a list of cities.

Idempotent: re-running replaces the block rather than stacking copies.

    python3 tools/link-city-pages.py
"""
import io, os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
cities = json.load(io.open(P('_data', 'cities.json'), encoding='utf-8'))['cities']
A, B = '<!-- CITY-LINKS:START -->', '<!-- CITY-LINKS:END -->'

links = '\n'.join(
    f'        <a href="/models-in-{c["slug"]}.html">{c["city"]}</a>' for c in cities)


def block(eyebrow, head, lede, tail):
    return f'''{A}
<section class="l-section alt">
  <div class="wrap">
    <div class="l-head">
      <p class="l-eyebrow">{eyebrow}</p>
      <h2>{head}</h2>
      <p>{lede}</p>
    </div>
    <div class="l-citygrid">
{links}
    </div>
    <p class="l-note">{tail}</p>
  </div>
</section>
{B}'''


TARGETS = {
    'talents.html': (
        block('Pan-India',
              'The roster works <em>city by city</em>',
              'Talent join from anywhere in India and are cast wherever the brief lands. '
              'These are the cities where commercial shooting is concentrated — open one to '
              'see how casting works there, from either side.',
              'Not on this list? <a href="/talents/apply.html">Apply from anywhere in India →</a>'),
        '<section class="l-cta">'),
    'casting-india.html': (
        block('Casting by city',
              'Cast a shoot <em>where you are shooting</em>',
              'What a shortlist should be built around changes by city — catalogue stamina in '
              'NCR, availability in Bangalore, costume patience in Jaipur. Each page says what '
              'actually matters there.',
              'Shooting somewhere else in India? <a href="/casting-india.html#brief">Send the brief anyway →</a>'),
        '<footer class="l-foot">'),
    'talents/apply.html': (
        block('Where you are',
              'Modelling work, <em>city by city</em>',
              'What the work looks like where you live, what gets cast there, and what tends to '
              'separate the people who stay booked. Applying is the same free form wherever you are.',
              'Anywhere else in India counts too — <a href="/talents.html">see the roster →</a>'),
        '<footer class="l-foot">'),
}

touched = []
for rel, (blk, anchor) in TARGETS.items():
    p = P(*rel.split('/'))
    s = io.open(p, encoding='utf-8').read()
    if A in s:
        s = re.sub(re.escape(A) + r'.*?' + re.escape(B), lambda _: blk, s, flags=re.S)
    else:
        if anchor not in s:
            sys.exit(f'BUILD ABORTED — anchor {anchor!r} not found in {rel}')
        s = s.replace(anchor, blk + '\n\n' + anchor, 1)
    io.open(p, 'w', encoding='utf-8').write(s)
    touched.append(rel)

print(f'linked from : {", ".join(touched)}')
print(f'cities      : {len(cities)}')
