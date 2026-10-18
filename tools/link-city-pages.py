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


# YKS Talents targets Bangalore, Mumbai and Dubai only. talents.html links just
# those three (Dubai has a hand-built page outside cities.json); the other city
# pages are kept but noindex, and stay linked only from the casting/apply grids.
TALENT_CITIES = [('bangalore', 'Bangalore'), ('mumbai', 'Mumbai'), ('dubai', 'Dubai')]
talent_links = '\n'.join(
    f'        <a href="/models-in-{slug}.html">{name}</a>' for slug, name in TALENT_CITIES)


def block(eyebrow, head, lede, tail, links=links):
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
        block('Cities',
              'The roster works <em>city by city</em>',
              'YKS Talents is focused on Bangalore, Mumbai and Dubai. Open a city to see how casting works there.',
              'Based in Bangalore, Mumbai or Dubai? <a href="/talents/apply.html">Build your portfolio — free →</a>',
              links=talent_links),
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
