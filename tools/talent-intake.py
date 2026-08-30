#!/usr/bin/env python3
"""Turn a talent application into a finished roster entry — in about a minute.

The application arrives as a Web3Forms email with the photos already sitting
in Cloudinary. Getting that person onto the roster used to mean downloading
every shot by hand, renaming them, minting a folder, hand-writing sixty lines
of JSON and remembering to run two builders. Twenty-odd minutes a head, which
is why applications pile up unadded.

This does the whole thing:

    python3 tools/talent-intake.py            # paste the email, Ctrl-D
    python3 tools/talent-intake.py app.txt    # or read it from a file
    python3 tools/talent-intake.py --dry      # parse and show, write nothing

It parses the email, downloads the photos into assets/talents/<code>/,
mints the roster code and the unguessable profile id, fills the specs from
whatever measurements the applicant sent, writes the roster entry, and runs
build-talents.py and build-talent-schema.py for you.

What it will not do, on purpose:

  · invent a bio. The bio is the applicant's own words, tidied. Anything it
    is unsure of is written as REVIEW: so it shows up rather than shipping.
  · carry a contact detail into roster.json. Phone, email and Instagram are
    stripped from every field before writing — build-talents.py aborts on
    them anyway, but failing here gives a better error.
  · add anyone under 18. The roster is 18+ and CLPRA makes that a legal
    line, not a preference.

roster.json is backed up before every write.
"""
import io, os, re, sys, json, shutil, secrets, subprocess
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
ROSTER = P('_data', 'roster.json')

CAT_PREFIX = {'model': 'm', 'influencer': 'i', 'actor': 'a'}
# what the applicant may have typed in the category field → our three buckets
CAT_ALIAS = {
    'model': 'model', 'modelling': 'model', 'modeling': 'model', 'fashion': 'model',
    'influencer': 'influencer', 'creator': 'influencer', 'content creator': 'influencer',
    'content': 'influencer', 'ugc': 'influencer',
    'actor': 'actor', 'actress': 'actor', 'acting': 'actor', 'artist': 'actor',
}
REGION_ALIAS = {
    'india': 'india', 'in': 'india', 'indian': 'india',
    'uae': 'uae', 'dubai': 'uae', 'abu dhabi': 'uae', 'united arab emirates': 'uae', 'ae': 'uae',
}
# city → (country, countryCode, geoRegion) for the places we actually cast in
CITY_GEO = {
    'mumbai': ('India', 'IN', 'IN-MH'), 'pune': ('India', 'IN', 'IN-MH'),
    'delhi': ('India', 'IN', 'IN-DL'), 'new delhi': ('India', 'IN', 'IN-DL'),
    'gurgaon': ('India', 'IN', 'IN-HR'), 'noida': ('India', 'IN', 'IN-UP'),
    'bangalore': ('India', 'IN', 'IN-KA'), 'bengaluru': ('India', 'IN', 'IN-KA'),
    'mysore': ('India', 'IN', 'IN-KA'),
    'hyderabad': ('India', 'IN', 'IN-TG'), 'chennai': ('India', 'IN', 'IN-TN'),
    'kochi': ('India', 'IN', 'IN-KL'), 'cochin': ('India', 'IN', 'IN-KL'),
    'kozhikode': ('India', 'IN', 'IN-KL'), 'thiruvananthapuram': ('India', 'IN', 'IN-KL'),
    'kolkata': ('India', 'IN', 'IN-WB'), 'ahmedabad': ('India', 'IN', 'IN-GJ'),
    'jaipur': ('India', 'IN', 'IN-RJ'), 'chandigarh': ('India', 'IN', 'IN-CH'),
    'goa': ('India', 'IN', 'IN-GA'), 'lucknow': ('India', 'IN', 'IN-UP'),
    'indore': ('India', 'IN', 'IN-MP'),
    'dubai': ('United Arab Emirates', 'AE', 'AE-DU'),
    'abu dhabi': ('United Arab Emirates', 'AE', 'AE-AZ'),
    'sharjah': ('United Arab Emirates', 'AE', 'AE-SH'),
}

# ── what a talent can be cast for, per bucket. Starting point, editable. ──
CASTABLE = {
    'model': ['Fashion / Editorial', 'Commercial / Print', 'Lookbook / E-commerce'],
    'influencer': ['Influencer / Content', 'UGC / Social', 'Brand collaboration'],
    'actor': ['Film & TV / Acting', 'Commercial / TVC', 'Branded narrative'],
}

CONTACT_PATTERNS = [
    (re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+'), ''),
    (re.compile(r'(?<!\d)(?:\+?\d[\d\s-]{8,})(?!\d)'), ''),
    (re.compile(r'(?:https?://)?(?:www\.)?instagram\.com/[\w.\-/]+', re.I), ''),
    (re.compile(r'@[A-Za-z0-9._]{2,}'), ''),
]


def scrub(s):
    """Strip anything that would let a client route around YKS."""
    if not isinstance(s, str):
        return s
    for pat, sub in CONTACT_PATTERNS:
        s = pat.sub(sub, s)
    return re.sub(r'\s{2,}', ' ', s).strip(' ,;·-')


# ══ parsing the application email ══════════════════════════════

FIELD_ALIASES = {
    'name': ('name',),
    'contact': ('phone_whatsapp', 'phone', 'whatsapp', 'contact'),
    'category': ('category',),
    'region': ('based_in', 'region', 'based'),
    'city': ('city',),
    'socials': ('instagram_social', 'socials', 'instagram'),
    'tagline': ('signature_line', 'tagline'),
    'about': ('about', 'bio'),
    'dob': ('date_of_birth', 'dob'),
    'gender': ('gender',),
    'languages': ('languages',),
    'age_group': ('age_group', 'age'),
    'photos': ('photos',),
    'stats': ('stats', 'measurements'),
}


def parse_email(raw):
    """Web3Forms mails arrive as 'Label: value' lines, one per field, with
    multi-line values (the photo URLs) hanging under their label."""
    fields, key, buf = {}, None, []

    def flush():
        if key:
            fields.setdefault(key, '')
            fields[key] = (fields[key] + '\n' + '\n'.join(buf)).strip()

    for line in raw.splitlines():
        m = re.match(r'^\s*([A-Za-z][A-Za-z0-9 _/&-]{1,40})\s*[::]\s*(.*)$', line)
        if m and not m.group(1).lower().startswith('http'):
            flush()
            key = re.sub(r'[\s/&-]+', '_', m.group(1).strip().lower())
            buf = [m.group(2).strip()]
            fields[key] = ''
        elif key is not None:
            buf.append(line.strip())
    flush()

    out = {}
    for want, aliases in FIELD_ALIASES.items():
        for a in aliases:
            if fields.get(a):
                out[want] = fields[a].strip()
                break
    # photo URLs can appear anywhere in the mail, not only under the label
    urls = re.findall(r'https?://res\.cloudinary\.com/\S+?\.(?:jpe?g|png|webp|heic)', raw, re.I)
    if not urls:
        urls = re.findall(r'https?://\S+?\.(?:jpe?g|png|webp)', raw, re.I)
    out['photo_urls'] = list(dict.fromkeys(urls))  # de-dupe, keep order
    out['_raw'] = raw
    return out


# ── measurements: applicants paste comp cards, they never fill 8 fields ──
SPEC_ORDER = ['Height', 'Bust', 'Waist', 'High hip', 'Hips', 'Shoe', 'Hair', 'Eyes', 'Skin']
# label -> the words that introduce it. Order matters: "high hip" must be tried
# before "hip", or every high hip is read as a hip.
SPEC_LABELS = [
    ('High hip', r'high\s*hips?'),
    ('Height', r'height|ht'),
    ('Bust', r'bust|chest'),
    ('Waist', r'waist'),
    ('Hips', r'hips?'),
    ('Shoe', r'shoe(?:\s*size)?|footwear'),
    ('Hair', r'hair(?:\s*colou?r)?'),
    ('Eyes', r'eyes?(?:\s*colou?r)?'),
    ('Skin', r'skin(?:\s*tone)?|complexion'),
]
_LABEL_RE = re.compile(
    r'\b(' + '|'.join(p for _, p in SPEC_LABELS) + r')\b\s*[:\-\u2013]?\s*', re.I)
_LABEL_LOOKUP = [(lab, re.compile(r'^(?:' + pat + r')$', re.I)) for lab, pat in SPEC_LABELS]

SPEC_MAX = {'Height': 14, 'Bust': 8, 'Waist': 8, 'High hip': 8, 'Hips': 8,
            'Shoe': 10, 'Hair': 22, 'Eyes': 22, 'Skin': 22}


def _spec_label(word):
    for lab, rx in _LABEL_LOOKUP:
        if rx.match(word.strip()):
            return lab
    return None


def parse_specs(text):
    """Pull whatever measurements are in the text.

    Applicants write these as one run-on line - Height: 5'8" Bust: 32B Waist:
    26" - so each value is read as everything up to the *next* label rather
    than by a greedy character class, which otherwise swallows the label after
    it ("Hair: Black Eyes").

    Fills only what it finds. A half-filled spec block is honest; an invented
    one is not.
    """
    if not text:
        return {}
    hits = list(_LABEL_RE.finditer(text))
    specs = {}
    for i, m in enumerate(hits):
        lab = _spec_label(m.group(1))
        if not lab or lab in specs:
            continue
        end = hits[i + 1].start() if i + 1 < len(hits) else len(text)
        v = text[m.end():end]
        # a value never runs past the end of its line or its list separator
        v = re.split(r'[\n,;|\u00b7]', v)[0]
        v = re.sub(r'\s+', ' ', v).strip(' .,;:-\u2013')
        if not v or len(v) > SPEC_MAX[lab]:
            continue
        if lab == 'Bust':
            v = re.sub(r'([a-dA-D]{1,2})$', lambda x: x.group(1).upper(), v)
        elif lab == 'Shoe':
            v = v.upper()
        elif lab in ('Hair', 'Eyes', 'Skin'):
            v = v.title()
        specs[lab] = v
    # a bare 34-28-38 triple, the way most comp cards write it
    if 'Bust' not in specs:
        m = re.search(r'\b(\d{2})\s*[-\u2013/x]\s*(\d{2})\s*[-\u2013/x]\s*(\d{2})\b', text)
        if m:
            specs['Bust'], specs['Waist'], specs['Hips'] = (g + '"' for g in m.groups())
    return {k: specs[k] for k in SPEC_ORDER if k in specs}


def strip_specs(text):
    """Take the measurement run-on out of the prose. The numbers live in
    specs; leaving them in the bio too reads like a form, not a person."""
    if not text:
        return text
    real = [m for m in _LABEL_RE.finditer(text) if _spec_label(m.group(1))]
    if len(real) < 3:          # one stray "height" in a sentence is not a spec block
        return text
    head = re.sub(r'\s{2,}', ' ', text[:real[0].start()]).strip(' .,;:-')
    return (head + '.') if head else text



def parse_tags(app, cat):
    """Tags come from what they said they do, not from a guess."""
    vocab = ['Fashion', 'Editorial', 'Runway', 'Commercial', 'Bridal', 'Fitness',
             'Beauty', 'Lifestyle', 'Ecommerce', 'Product', 'Travel', 'Food',
             'Dance', 'Theatre', 'Voice', 'Automotive', 'Jewellery']
    hay = ' '.join(str(app.get(k, '')) for k in ('about', 'tagline', 'category', 'stats')).lower()
    found = [t for t in vocab if t.lower() in hay or t.lower().rstrip('e') in hay]
    if not found:
        found = {'model': ['Fashion', 'Commercial'],
                 'influencer': ['Lifestyle', 'Commercial'],
                 'actor': ['Commercial']}[cat]
    return found[:5]


def norm(value, table, default):
    v = (value or '').strip().lower()
    for k, out in table.items():
        if k in v:
            return out
    return default


ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def mint_suffix(n=10):
    """Unguessable, but still readable when he reads a link down the phone."""
    return ''.join(secrets.choice(ALPHABET) for _ in range(n))


def next_code(roster, cat):
    pre = CAT_PREFIX[cat]
    used = {t['code'] for t in roster if t.get('code', '').startswith(pre)}
    n = 1
    while f'{pre}{n:02d}' in used:
        n += 1
    return f'{pre}{n:02d}'


def slugify(name, code):
    s = re.sub(r'[^a-z0-9]+', '-', (name or '').lower()).strip('-')
    return s or code


def download(urls, dest, dry=False):
    """Cloudinary → assets/talents/<code>/01.jpg. Order is the order they sent."""
    os.makedirs(dest, exist_ok=True)
    saved = []
    for i, u in enumerate(urls, 1):
        ext = re.search(r'\.(jpe?g|png|webp)', u, re.I)
        fn = f'{i:02d}.' + (ext.group(1).lower().replace('jpeg', 'jpg') if ext else 'jpg')
        out = os.path.join(dest, fn)
        if dry:
            print(f'    would download → {fn}')
            saved.append(fn)
            continue
        if os.path.exists(out) and os.path.getsize(out) > 1024:
            print(f'    have {fn}')
            saved.append(fn)
            continue
        try:
            req = Request(u, headers={'User-Agent': 'yks-talent-intake'})
            with urlopen(req, timeout=45) as r, open(out, 'wb') as f:
                shutil.copyfileobj(r, f)
            print(f'    saved {fn}  ({os.path.getsize(out) // 1024} KB)')
            saved.append(fn)
        except (URLError, HTTPError, OSError) as ex:
            print(f'    ✗ {fn} failed: {ex}')
    return saved


def build_entry(app, roster, files):
    cat = norm(app.get('category'), CAT_ALIAS, 'model')
    city_raw = (app.get('city') or '').strip().strip('.,')
    city = city_raw.title() if city_raw else 'REVIEW: city'
    country, cc, geo = CITY_GEO.get(city_raw.lower(), (None, None, None))
    region = norm(app.get('region') or city_raw, REGION_ALIAS, 'india' if cc != 'AE' else 'uae')
    if not country:
        country, cc = ('United Arab Emirates', 'AE') if region == 'uae' else ('India', 'IN')

    code = next_code(roster, cat)
    name = scrub(app.get('name') or '').title() or 'REVIEW: name'
    # the applicant's own words, tidied — never a bio we made up for them
    about = scrub(app.get('about') or '')
    tagline = scrub(app.get('tagline') or '')
    about = strip_specs(about)
    bio = about or 'REVIEW: write the bio — what they are like on set, not adjectives.'
    short = tagline or (about.split('. ')[0] + '.' if about else 'REVIEW: one line for the roster card.')

    specs = parse_specs('\n'.join(filter(None, [app.get('stats'), app.get('about'), app.get('_raw', '')[:4000]])))

    gallery = [{'file': f, 'alt': f'plate {i}', 'label': 'REVIEW: label'}
               for i, f in enumerate(files[1:], 2)]

    entry = {
        'slug': slugify(name, code),
        'name': name,
        'cat': cat,
        'region': region,
        'city': city,
        'country': country,
        'countryCode': cc,
        'gender': (app.get('gender') or '').strip().title() or 'REVIEW: gender',
        'nationality': 'Indian' if cc == 'IN' else 'REVIEW: nationality',
        'over18': True,
        'plate': len(roster) + 1,
        'tags': parse_tags(app, cat),
        'specs': specs,
        'bio': bio,
        'shortBio': short,
        'castableFor': CASTABLE[cat],
        'dir': code,
        'cover': files[0] if files else 'REVIEW: cover',
        'gallery': gallery,
        'code': code,
        'pid': f'{code}-{mint_suffix()}',
    }
    if geo:
        entry['geoRegion'] = geo
    return entry


def check_age(app):
    ag = (app.get('age_group') or '').lower()
    if 'under 18' in ag or 'under18' in ag:
        return 'application says Under 18 — the roster is 18+ (CLPRA). Not added.'
    dob = app.get('dob') or ''
    m = re.search(r'(\d{4})', dob)
    if m and int(m.group(1)) > 2008:
        return f'date of birth {dob} reads as under 18 — check before adding.'
    return None


def main():
    args = [a for a in sys.argv[1:]]
    dry = '--dry' in args
    args = [a for a in args if not a.startswith('--')]

    if args:
        raw = io.open(args[0], encoding='utf-8', errors='replace').read()
    elif not sys.stdin.isatty():
        raw = sys.stdin.read()
    else:
        print('Paste the application email, then press Ctrl-D:\n')
        raw = sys.stdin.read()

    if not raw.strip():
        print('Nothing pasted. Give me the application email.')
        return 1

    app = parse_email(raw)
    if not app.get('name'):
        print('✗ Could not find a Name: line. Is this the application email?')
        return 1

    blocker = check_age(app)
    if blocker:
        print(f'\n✗ STOPPED — {blocker}')
        return 1

    data = json.load(io.open(ROSTER, encoding='utf-8'))
    roster = data['talent']
    cat = norm(app.get('category'), CAT_ALIAS, 'model')
    code = next_code(roster, cat)

    print(f'\n  {app["name"]} → {cat}, {app.get("city", "?")}  ·  roster code {code}')
    print(f'  {len(app["photo_urls"])} photo(s) in the application')

    if any(t.get('name', '').lower() == app['name'].strip().lower() for t in roster):
        print(f'\n  ! {app["name"]} is already on the roster. Nothing written.')
        return 1

    dest = P('assets', 'talents', code)
    files = download(app['photo_urls'], dest, dry=dry)
    if not files:
        print('\n  ! No photos landed. Add them to assets/talents/%s/ and rerun.' % code)
        if not dry:
            return 1

    entry = build_entry(app, roster, files)

    if dry:
        print('\n── would add ──')
        print(json.dumps(entry, indent=2, ensure_ascii=False))
        return 0

    shutil.copy(ROSTER, ROSTER + '.bak')
    data['talent'].append(entry)
    io.open(ROSTER, 'w', encoding='utf-8').write(
        json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    print(f'\n  ✓ added to _data/roster.json  (backup at roster.json.bak)')

    todo = [k for k, v in entry.items() if isinstance(v, str) and v.startswith('REVIEW')]
    todo += ['gallery labels'] if entry['gallery'] else []
    if not entry['specs']:
        todo.append('specs — no measurements found in the mail')

    for tool in ('build-talents.py', 'build-talent-schema.py'):
        print(f'  → {tool}')
        r = subprocess.run([sys.executable, P('tools', tool)], capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stdout + r.stderr)
            print(f'\n  ✗ {tool} refused. roster.json.bak has the version before this.')
            return 1

    print(f'\n  ✓ {entry["name"]} is on the roster as {code}.')
    print(f'    /talents/id/{entry["pid"]}.html')
    if todo:
        print('\n  Before you push, finish these in _data/roster.json:')
        for t in todo:
            print(f'    · {t}')
        print('  Then rerun: python3 tools/build-talents.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
