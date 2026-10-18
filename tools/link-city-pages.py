#!/usr/bin/env python3
"""Wire the city pages into the pages that should point at them.

A page nobody links to is a page Google crawls late and trusts little.
These only earn their keep if the roster, the find-models page and the
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


# YKS Talents works across India and the Middle East. talents.html links every
# India city page in cities.json plus Dubai (a hand-built page outside cities.json).
TALENT_CITIES = [(c['slug'], c['city']) for c in cities] + [('dubai', 'Dubai')]
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
              'YKS Talents works across India and the Middle East. Open a city to see how casting works there.',
              'Based in India or the Middle East? <a href="/talents/apply.html">Build your portfolio — free →</a>',
              links=talent_links),
        '<section class="l-cta">'),
    'find-models.html': (
        block('Female models by city',
              'Find models <em>where you are shooting</em>',
              'What clients look for changes by city — catalogue stamina in NCR, availability in '
              'Bangalore, costume patience in Jaipur. Each page says what actually matters there.',
              'Shooting somewhere else in India or the Middle East? <a href="/find-models.html#brief">Send the brief anyway →</a>',
              links=talent_links),
        '<footer class="l-foot">'),
    'talents/apply.html': (
        block('Where you are',
              'YKS Talents, <em>city by city</em>',
              'Your free portfolio works the same wherever you are. Open your city to see how '
              'YKS Talents works there and what clients look for.',
              'Anywhere else in India or the Middle East counts too — <a href="/talents.html">about YKS Talents →</a>',
              links=talent_links),
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
