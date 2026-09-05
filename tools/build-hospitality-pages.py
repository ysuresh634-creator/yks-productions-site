#!/usr/bin/env python3
"""Hotel and resort pages — the one premium vertical the site never targeted.

The site had 6 real-estate pages, 7 wedding pages and zero for hospitality,
despite the strongest credential on it being a Marriott resort campaign. Hotels
are the client a photographer wants: they re-shoot on refurbishment, they need
stills and film and social from the same visit, and they buy annually rather
than once.

Nav and footer are lifted from an existing service page rather than retyped, so
these cannot drift from the rest of the site.

    python3 tools/build-hospitality-pages.py

Every claim here traces to work already published on /marriott.html. Nothing is
invented, and there are no prices — those are quoted per property.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'corporate-video-bangalore.html')


def e(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


PAGES = [
    dict(
        slug='hotel-photographer-bangalore',
        title='Hotel &amp; Resort Photographer in Bangalore | YKS Productions',
        desc='Hotel and resort photography and film in Bangalore and Karnataka — rooms, suites, F&amp;B, amenities and property films. Shot the Marriott campaign in Coorg.',
        ogt='Hotel &amp; Resort Photographer in Bangalore — YKS Productions',
        ogd='Rooms, suites, F&amp;B and property films for hotels across Karnataka.',
        region='IN-KA', place='Bengaluru, Karnataka, India', locale='en_IN',
        city='Bangalore', area='Karnataka',
        h1='Hotel &amp; resort photography in <em>Bangalore</em>',
        lede="""A hotel doesn't sell a room. It sells the ten seconds someone spends
        imagining themselves in it — and that decision gets made on a phone, on a listing
        page, weeks before anyone arrives. I shoot properties across Bangalore and Karnataka
        so that moment lands: rooms and suites, the restaurant at the hour it actually looks
        best, the pool, the spa, the arrival. Stills and film from the same visit, because
        booking two crews for one property is money you don't need to spend.""",
        proof="""The Marriott resort in Coorg is the clearest example — a cinematic brand
        film through the Western Ghats plus seven social-first reels, shot, graded and
        delivered by me. Hospitality is its own discipline: you're photographing a feeling
        that has to survive being cropped into a thumbnail.""",
        localnote="""Karnataka gives you three different properties in one state — city
        business hotels around MG Road and Whitefield, the plantation resorts up in Coorg
        and Chikmagalur, and the heritage places further out. They photograph nothing alike.
        A city hotel lives or dies on its rooms and its breakfast; a plantation resort sells
        the drive in and the mist at six in the morning, which means being there at six in
        the morning.""",
    ),
    dict(
        slug='hotel-photographer-dubai',
        title='Hotel &amp; Resort Photographer in Dubai | YKS Productions',
        desc='Hotel and resort photography and film in Dubai and the UAE — rooms, suites, F&amp;B, amenities and property films. Stills and motion from one visit.',
        ogt='Hotel &amp; Resort Photographer in Dubai — YKS Productions',
        ogd='Rooms, suites, F&amp;B and property films for hotels across the UAE.',
        region='AE-DU', place='Dubai, United Arab Emirates', locale='en_AE',
        city='Dubai', area='the UAE',
        h1='Hotel &amp; resort photography in <em>Dubai</em>',
        lede="""Dubai has more good-looking hotels per square kilometre than almost anywhere,
        which is exactly the problem: looking good is the baseline, not the differentiator.
        What sells a suite here is specificity — the light at the hour your property actually
        owns, the view only your floor has, the detail a guest tells someone about afterwards.
        I shoot rooms, suites, F&amp;B, spa and arrival across Dubai and the UAE, stills and
        film together, so the brand site, the OTA listing and the reels all come out of one
        visit and look like one property.""",
        proof="""My last hospitality campaign was for the Marriott resort in Coorg, India —
        a cinematic brand film plus seven social reels, shot, graded and delivered end to end.
        Different country, same discipline: photographing a feeling that still reads at
        thumbnail size on a phone.""",
        localnote="""The UAE brief usually isn't one property, it's one property in four
        registers — the brand site, the OTA listing, the trade deck and the social feed, each
        wanting a different crop and a different energy from the same suite. Planning the
        shot list around all four from the start is the difference between one shoot and
        three. Golden hour here is short and the light is hard; the schedule gets built
        around that, not around the hotel's convenience.""",
    ),
]

NEEDS = [
    ('Rooms &amp; suites',      'Every category, shot consistently so a guest comparing two room types is comparing the rooms, not the photography.'),
    ('Food &amp; beverage',     'The restaurant, the bar, the breakfast spread — shot at the hour the room actually looks like that, which is rarely the hour that suits the kitchen.'),
    ('Amenities &amp; arrival', 'Pool, spa, gym, lobby, the walk in from the car. The parts people picture before they picture the bed.'),
]

NEEDS_LOCAL = {
    'hotel-photographer-bangalore': [
        ('Grounds &amp; the drive in', 'For plantation and heritage properties the approach is half the sell — the road, the gate, the first view of the building through the trees.'),
        ('Weddings &amp; events',      'Karnataka resorts live on the wedding season. Venue sets that show scale honestly get you enquiries the brochure shots never will.'),
    ],
    'hotel-photographer-dubai': [
        ('Views &amp; skyline',  'The thing your floor has that the floor below does not. Shot at the hour it actually looks like that, which is usually a narrow window.'),
        ('Trade &amp; MICE',     'Ballrooms, meeting floors and event set-ups for the trade decks — the buyer here is a corporate planner, not a holidaymaker, and they are reading for capacity.'),
    ],
}
_NEEDS_TAIL = [
    ('Property film',           'One cinematic piece for the brand site and the trade decks, cut so it still works with the sound off.'),
    ('Social reels',            'Vertical, shot on the same visit rather than salvaged from the film afterwards. It shows when they are salvaged.'),
    ('Listing &amp; OTA sets',  'Correctly proportioned, honestly lit sets for the booking platforms, where most of the decision actually happens.'),
]

FAQS_SHARED = [
    ('Do you shoot stills and video on the same visit?',
     'Yes, and it is usually the whole reason to book me rather than two suppliers. The lighting setup for a suite is most of the work; shooting motion from the same setup costs hours, not days, and everything matches afterwards because it came from one camera and one grade.'),
    ('How long does a property take?',
     'It depends on room categories more than on size. A city hotel with four room types, a restaurant and a pool is usually a full day plus an early start. A resort with villas spread over acres is two to three, because you are chasing the same hour of light across a lot of ground.'),
    ('Can we use the images on Booking.com and Expedia?',
     'Yes. You get full usage for your own marketing — brand site, OTA listings, trade decks, print, paid social, in perpetuity. I do not licence hospitality work by the year or by the channel; you paid for the shoot, the pictures are yours.'),
    ('Do you work with the hotel&rsquo;s brand guidelines?',
     'Always, and it is easier when I get them early. Group properties usually arrive with a photography standard from head office covering angles, styling and grade. Send it before the recce and the shot list gets built against it, rather than reshot afterwards.'),
    ('What does it cost?',
     'One all-in number per property, quoted after a short call about categories, dates and where the images need to run. It covers the shoot, the edit and the grade — no per-image fees and no separate licensing line later.'),
]

# Three more per property type. A plantation resort and a city tower do not
# have the same problems, and answering both on one page helps neither.
FAQS_LOCAL = {
    'hotel-photographer-bangalore': [
        ('We have refurbished two floors. Can you match the old set?',
         'Usually, yes — that is a normal hospitality job. If the original set is mine I have the grade and the camera notes. If it is not, send me the existing images and I will match the look closely enough that a guest scrolling the gallery cannot tell which floor was shot when.'),
        ('Our resort is in Coorg, not Bangalore. Do you travel?',
         'Constantly — the Marriott campaign was shot in Coorg. Anywhere in Karnataka is a drive, and travel for a multi-day resort shoot is built into the one number rather than added afterwards. Chikmagalur, Hampi, Mysore and the coast are all normal.'),
        ('The monsoon makes our property look completely different. When should we shoot?',
         'That depends on which version you are selling. Post-monsoon, roughly October to February, gives you the green without the grey, and it is when most of Karnataka photographs best. But if your guests come for the rain — and in the plantations plenty do — then shooting in it is the honest answer, and it makes far better film than stills.'),
    ],
    'hotel-photographer-dubai': [
        ('Can you work around occupancy? We cannot empty the floor.',
         'That is the normal condition, not a complication. Show apartments and turnover rooms get shot first, the rest fits around housekeeping, and I work with your duty manager on a running order rather than a fixed schedule. It is slower than an empty property and entirely doable.'),
        ('Do you shoot in summer?',
         'Yes, with the schedule inverted. From roughly June to September everything exterior happens either side of the heat — early morning and the last hour before dark — and the middle of the day goes to rooms, spa and F&amp;B. It is a planning problem, not a reason to wait until November.'),
        ('We need assets for the brand site, the OTAs and the trade deck. Same shoot?',
         'Same shoot, and it should be planned that way from the start. Those four channels want different crops and different energy from the same suite, so the shot list gets built against all of them up front. Deciding afterwards is how a property ends up paying for the same room twice.'),
    ],
}


def build(src, p):
    nav = re.search(r'<nav.*?</nav>', src, re.S)
    foot = re.search(r'<footer.*?</footer>', src, re.S)
    scripts = re.findall(r'<script src="/js/[^>]+></script>', src)
    if not (nav and foot):
        sys.exit('  could not lift nav/footer from the template')

    url = f"https://yksproductions.com/{p['slug']}.html"
    page_needs = NEEDS + NEEDS_LOCAL[p['slug']] + _NEEDS_TAIL
    page_faqs = FAQS_SHARED + FAQS_LOCAL[p['slug']]
    needs = '\n'.join(
        f'      <div class="l-card"><b>{n}</b><p>{d}</p></div>' for n, d in page_needs)
    faqs = '\n'.join(
        f'      <details><summary>{q}</summary><p>{a}</p></details>' for q, a in page_faqs)
    faq_ld = ','.join(
        '{"@type":"Question","name":"%s","acceptedAnswer":{"@type":"Answer","text":"%s"}}'
        % (re.sub(r'&[a-z]+;', "'", q).replace('"', "'"),
           re.sub(r'&[a-z]+;', "'", re.sub(r'<[^>]+>', '', a)).replace('"', "'"))
        for q, a in page_faqs)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C57X89TN45"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-C57X89TN45');
</script>

<title>{p['title']}</title>
<meta name="description" content="{p['desc']}" />
<link rel="canonical" href="{url}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="geo.region" content="{p['region']}" />
<meta name="geo.placename" content="{p['place']}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="{p['ogt']}" />
<meta property="og:description" content="{p['ogd']}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="https://yksproductions.com/assets/og-cover.jpg" />
<meta property="og:image:secure_url" content="https://yksproductions.com/assets/og-cover.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{p['ogt']}" />
<meta property="og:locale" content="{p['locale']}" />
<meta name="twitter:image" content="https://yksproductions.com/assets/og-cover.jpg" />
<meta name="twitter:card" content="summary_large_image" />

<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
<link rel="apple-touch-icon" href="/assets/favicon-192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/landing.css?v=25" />
<style>
.l-cardgrid{{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:26px}}
.l-card{{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:4px;padding:24px 22px}}
.l-card b{{display:block;font-family:var(--serif);font-size:21px;font-weight:500;margin-bottom:9px}}
.l-card p{{margin:0;font-size:14.5px;line-height:1.68;color:var(--paper-dim)}}
@media(max-width:900px){{.l-cardgrid{{grid-template-columns:1fr}}}}
</style>

<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"Service",
 "name":"Hotel and resort photography and film in {p['city']}",
 "serviceType":"Hospitality photography and video production",
 "provider":{{"@type":"LocalBusiness","name":"YKS Productions","url":"https://yksproductions.com/"}},
 "areaServed":{{"@type":"Place","name":"{p['city']}"}},
 "url":"{url}"}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_ld}]}}
</script>
</head>
<body>
{nav.group(0)}

<section class="l-hero">
  <div class="wrap">
    <p class="l-eyebrow">Hospitality &middot; {p['city']}</p>
    <h1>{p['h1']}</h1>
    <p class="l-lede">{p['lede']}</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/quote.html">Get a quote for your property &rarr;</a>
      <a class="btn btn-ghost" href="/marriott.html">See the Marriott resort campaign</a>
    </div>
  </div>
</section>

<section class="l-section alt">
  <div class="wrap">
    <p class="l-eyebrow">Proof</p>
    <h2>Shot for <em>Marriott</em>, Coorg</h2>
    <p class="l-prose">{p['proof']}</p>
    <p class="l-prose"><a href="/marriott.html">Watch the campaign film and the reels &rarr;</a></p>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <p class="l-eyebrow">What a property usually needs</p>
    <h2>Everything the booking <em>decision</em> runs on</h2>
    <div class="l-cardgrid">
{needs}
    </div>
  </div>
</section>

<section class="l-section alt">
  <div class="wrap">
    <p class="l-eyebrow">{p['city']}</p>
    <h2>What&rsquo;s different <em>here</em></h2>
    <p class="l-prose">{p['localnote']}</p>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <p class="l-eyebrow">Questions</p>
    <h2>The ones hotels <em>actually</em> ask</h2>
    <div class="l-faq">
{faqs}
    </div>
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <h2>Tell me about the <em>property</em></h2>
    <p class="l-prose">Room categories, the dates you are thinking about, and where the
    images need to run. I&rsquo;ll come back with one all-in number covering the shoot,
    the edit and the grade.</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/quote.html">Get a quote &rarr;</a>
      <a class="btn btn-ghost" href="/index.html">See the full portfolio</a>
    </div>
  </div>
</section>

{foot.group(0)}
{chr(10).join(scripts)}
</body>
</html>
"""


def main():
    src = io.open(SRC, encoding='utf-8').read()
    for p in PAGES:
        out = os.path.join(ROOT, p['slug'] + '.html')
        io.open(out, 'w', encoding='utf-8').write(build(src, p))
        print(f"  wrote {p['slug']}.html")
    print('  done — remember to add them to the sitemap and link them in')


if __name__ == '__main__':
    main()
