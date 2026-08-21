#!/usr/bin/env python3
"""Notify the IndexNow participants that pages changed.

Google does not participate; Bing, Yandex, Naver, Seznam, Yep and Amazon do,
and a submission to one endpoint is shared with the rest. That matters more
than it sounds for this site: Bing is what sits behind Copilot, and several
answer engines lean on non-Google indexes.

Submits the sitemap's URLs by default, or specific ones passed as arguments.

    python3 tools/indexnow.py                      # everything in the sitemap
    python3 tools/indexnow.py /models-in-pune.html # just these
"""
import io, os, sys, json, urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = 'yksproductions.com'
KEY = io.open(os.path.join(ROOT, '_data', 'indexnow-key.txt')).read().strip()

if len(sys.argv) > 1:
    urls = [u if u.startswith('http') else f'https://{HOST}{u}' for u in sys.argv[1:]]
else:
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    t = ET.parse(os.path.join(ROOT, 'sitemap.xml'))
    urls = [u.find('s:loc', ns).text for u in t.getroot()]

payload = json.dumps({
    'host': HOST,
    'key': KEY,
    'keyLocation': f'https://{HOST}/{KEY}.txt',
    'urlList': urls,
}).encode()

req = urllib.request.Request('https://api.indexnow.org/indexnow', data=payload,
                             headers={'Content-Type': 'application/json; charset=utf-8'})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f'submitted {len(urls)} URLs → HTTP {r.status}')
        print('200/202 = accepted and shared with Bing, Yandex, Naver, Seznam, Yep, Amazon')
except urllib.error.HTTPError as ex:
    body = ex.read().decode()[:300]
    print(f'HTTP {ex.code}: {body}')
    print('422 usually means the key file is not live yet — deploy first, then retry.')
    sys.exit(1)
