#!/usr/bin/env python3
"""Generate /blog/feed.xml (Atom 1.0) from the journal posts.

Google accepts RSS/Atom as a valid sitemap format, and a feed is also how
aggregators, readers and several answer engines pick up new writing without
being told. The journal had none, so eight posts existed only as HTML pages
nobody could subscribe to.

Dates and titles are read out of each post's own JSON-LD rather than retyped,
so the feed cannot drift from the pages.

    python3 tools/build-feed.py
"""
import io, os, re, glob, json, html
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
BASE = 'https://yksproductions.com'
e = html.escape

posts = []
for f in sorted(glob.glob(P('blog', '*.html'))):
    if os.path.basename(f) == 'index.html':
        continue
    s = io.open(f, encoding='utf-8').read()
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    d = re.search(r'name="description" content="([^"]*)"', s)
    pub = re.search(r'"datePublished":\s*"([^"]+)"', s)
    mod = re.search(r'"dateModified":\s*"([^"]+)"', s)
    if not (t and pub):
        continue
    posts.append({
        'url': f'{BASE}/blog/{os.path.basename(f)}',
        'title': html.unescape(t.group(1)).split('—')[0].strip(),
        'summary': html.unescape(d.group(1)) if d else '',
        'pub': pub.group(1),
        'upd': (mod or pub).group(1),
    })

posts.sort(key=lambda p: p['upd'], reverse=True)
newest = posts[0]['upd'] if posts else datetime.now(timezone.utc).strftime('%Y-%m-%d')


def stamp(d):
    return f'{d}T09:00:00+04:00'


entries = '\n'.join(f'''  <entry>
    <title>{e(p['title'])}</title>
    <link href="{p['url']}" />
    <id>{p['url']}</id>
    <published>{stamp(p['pub'])}</published>
    <updated>{stamp(p['upd'])}</updated>
    <summary>{e(p['summary'])}</summary>
    <author><name>Yedukrishna Suresh</name></author>
  </entry>''' for p in posts)

feed = f'''<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>YKS Productions — Journal</title>
  <subtitle>Honest guides on photography, film and casting in India and the UAE.</subtitle>
  <link href="{BASE}/blog/feed.xml" rel="self" />
  <link href="{BASE}/blog/" />
  <id>{BASE}/blog/</id>
  <updated>{stamp(newest)}</updated>
  <author><name>Yedukrishna Suresh</name><uri>{BASE}/</uri></author>
{entries}
</feed>
'''
io.open(P('blog', 'feed.xml'), 'w', encoding='utf-8').write(feed)

# advertise it from every page that has a head, so a reader can autodiscover
link = f'<link rel="alternate" type="application/atom+xml" title="YKS Productions — Journal" href="{BASE}/blog/feed.xml" />'
n = 0
for f in sorted(glob.glob(P('*.html')) + glob.glob(P('*', '*.html'))):
    s = io.open(f, encoding='utf-8').read()
    if '</head>' not in s or 'application/atom+xml' in s:
        continue
    io.open(f, 'w', encoding='utf-8').write(s.replace('</head>', link + '\n</head>', 1))
    n += 1

import xml.etree.ElementTree as ET
ET.fromstring(feed)
print(f'feed entries    : {len(posts)}')
print(f'autodiscovery on: {n} pages')
print('feed parses     : ✓')
