#!/usr/bin/env python3
"""The mentoring page — the offer the site never named.

"Mentoring" appeared nowhere on yksproductions.com, despite being one of the
strongest reasons to pick this board over an agency: it is free, and agencies
routinely charge for all of it. Pageant preparation in particular reaches
people who are serious and self-funded rather than hoping to be discovered.

Nav and footer are lifted from an existing page so this cannot drift.
Nothing here claims a track record — it claims what he actually does: he
casts and shoots, so he sees what panels and clients pick, and he says so.

    python3 tools/build-mentoring-page.py
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corporate-video-bangalore.html')
OUT = os.path.join(ROOT, 'model-mentoring-india.html')
URL = 'https://yksproductions.com/model-mentoring-india.html'

COVERS = [
    ('Your book', 'What a portfolio actually needs, in what order, and which of your photographs are quietly working against you. Most books fail on the second picture, not the first.'),
    ('The walk', 'How to walk, where to look, what to do with your hands when nobody has told you. It is learnable in an afternoon and it is the thing people are most self-conscious about.'),
    ('Castings', 'What happens in the room, what they are deciding while you talk, and why the person who gets booked is often not the best-looking one there.'),
    ('Pageants', 'The walk, the interview round, what a panel is actually scoring, and the book you turn up with. Also an honest answer on whether you are ready to enter this year or should give it six months.'),
    ('The money', 'What a shoot should pay, what a usage buyout means, and which requests are normal versus which ones mean you should leave. Nobody teaches this and it costs people the most.'),
    ('Saying no', 'How to turn something down without burning the contact, and why the people who can do that get booked more, not less.'),
]

FAQS = [
    ('What does the mentoring cost?',
     'Nothing. Not a joining fee, not a session fee, not a percentage of anything you go on to earn or win. If someone in this industry asks a new face for money to be represented or trained, that is the moment to walk away — and I would rather be the counter-example than explain it.'),
    ('Do I have to be on the board to get it?',
     'You have to have applied, because that is how I see your photographs and know what I am talking about. Whether or not I take you on, you get told what is working and what is not. Plenty of people are not right for my roster and still leave knowing what to fix.'),
    ('Can you prepare me for a pageant?',
     'Yes — the walk, the interview round, what the panel is scoring, and the portfolio you arrive with. What I will also do is tell you honestly if you should wait a year, which is not always what people want to hear. I do not take a cut of anything you win, and I am not affiliated with any pageant.'),
    ('Are you a modelling academy or an agency?',
     'Neither, and it matters. I am a photographer and director who casts talent for the productions I shoot. There is no course, no certificate and no contract — you stay free to work with anyone else, always. What I have is the view from the other side of the camera, which is the side that decides.'),
    ('How do shoots and shows come through you?',
     'Briefs arrive from brands and productions, and I put the faces that fit in front of them. The booking, the schedule and the payment run through me, so you are never negotiating alone with someone you have never met. Nobody honest guarantees work — some months there are several briefs, some months none.'),
    ('I am not in a big city. Is it still worth it?',
     'Yes. The mentoring happens over messages and calls, so where you are does not change it, and briefs come in for cities all over the country. Where you live matters for a specific job, not for whether any of this is worth doing.'),
]


def main():
    src = io.open(SRC, encoding='utf-8').read()
    nav = re.search(r'<nav.*?</nav>', src, re.S)
    foot = re.search(r'<footer.*?</footer>', src, re.S)
    scripts = re.findall(r'<script src="/js/[^>]+></script>', src)
    if not (nav and foot):
        sys.exit('  could not lift nav/footer')

    cards = '\n'.join(
        f'      <div class="l-card"><b>{n}</b><p>{d}</p></div>' for n, d in COVERS)
    faqs = '\n'.join(
        f'      <details><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQS)
    faq_ld = ','.join(
        '{"@type":"Question","name":"%s","acceptedAnswer":{"@type":"Answer","text":"%s"}}'
        % (q.replace('"', "'"), a.replace('"', "'")) for q, a in FAQS)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C57X89TN45"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-C57X89TN45');
</script>
<title>Model Mentoring in India — Pageants, Shoots &amp; Shows</title>
<meta name="description" content="Free mentoring for models in India — your portfolio, castings, how to walk and pageant preparation. Shoots and shows come through the board. No fee, no cut." />
<link rel="canonical" href="{URL}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="geo.region" content="IN" />
<meta name="geo.placename" content="India" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="YKS Productions" />
<meta property="og:title" content="Model Mentoring in India — YKS Talents" />
<meta property="og:description" content="Portfolio, castings, the walk and pageant preparation. Free, and no cut of anything you earn." />
<meta property="og:url" content="{URL}" />
<meta property="og:image" content="https://yksproductions.com/assets/og-cover.jpg" />
<meta property="og:image:secure_url" content="https://yksproductions.com/assets/og-cover.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Model Mentoring in India — YKS Talents" />
<meta property="og:locale" content="en_IN" />
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
 "name":"Model mentoring in India",
 "serviceType":"Mentoring for models, including pageant preparation",
 "provider":{{"@type":"LocalBusiness","name":"YKS Productions","url":"https://yksproductions.com/"}},
 "areaServed":{{"@type":"Country","name":"India"}},
 "isAccessibleForFree":true,
 "url":"{URL}"}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_ld}]}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Home","item":"https://yksproductions.com/"}},
  {{"@type":"ListItem","position":2,"name":"Model Mentoring in India","item":"{URL}"}}
]}}
</script>
</head>
<body>
{nav.group(0)}

<section class="l-hero">
  <div class="wrap">
    <p class="l-eyebrow">Mentoring &middot; India</p>
    <h1>Nobody tells new faces <em>how any of this works</em></h1>
    <p class="l-lede">They are told to get pictures taken, to be confident, and to wait. So
    people spend two years and a lot of money learning by accident what somebody could have
    explained in an afternoon. I shoot and cast for the productions I make, which means I sit
    on the side of the camera that decides — and I will tell you what that side is actually
    looking at. It costs nothing, there is no course to buy, and I take no cut of anything you
    go on to earn or win.</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/talents/apply.html">Apply to the board &rarr;</a>
      <a class="btn btn-ghost" href="/talents.html">See how the board works</a>
    </div>
  </div>
</section>

<section class="l-section alt">
  <div class="wrap">
    <p class="l-eyebrow">What it covers</p>
    <h2>The things nobody <em>writes down</em></h2>
    <div class="l-cardgrid">
{cards}
    </div>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <p class="l-eyebrow">Pageants</p>
    <h2>Going in for a <em>pageant</em></h2>
    <p class="l-prose">A pageant is not a modelling job wearing a sash. The walk is different,
    the interview round decides more than people expect, and the panel is scoring things nobody
    announces — how you carry a question you did not prepare for, whether you look like you want
    to be there, whether your book says the same thing your answers do.</p>
    <p class="l-prose">What I can give you is preparation and an honest read: the walk, the
    round, the portfolio you arrive with, and whether you are ready to enter this year or should
    give it six months and go in far stronger. That last answer is the one people least want and
    most need. I am not affiliated with any pageant, I do not sell entries, and I take no
    percentage of anything you win.</p>
  </div>
</section>

<section class="l-section alt">
  <div class="wrap">
    <p class="l-eyebrow">And then the work</p>
    <h2>Shoots and shows come <em>through the board</em></h2>
    <p class="l-prose">Mentoring on its own is advice. The reason it is worth anything here is
    that briefs actually arrive — shoots, campaigns and shows — and they go in front of the faces
    they fit. The booking, the schedule and the payment all run through me, so a client never has
    your number and you are never negotiating alone with somebody you have not met.</p>
    <p class="l-prose">Nobody honest promises work, and I will not. Some months several briefs
    come in, some months none. What I can promise is that when one arrives that fits you, you are
    in front of it. <a href="/talents/apply.html">Apply to the board &rarr;</a></p>
  </div>
</section>

<section class="l-section">
  <div class="wrap">
    <p class="l-eyebrow">Questions</p>
    <h2>The ones people are <em>embarrassed</em> to ask</h2>
    <div class="l-faq">
{faqs}
    </div>
  </div>
</section>

<section class="l-cta">
  <div class="wrap">
    <h2>Start with your <em>photographs</em></h2>
    <p class="l-prose">Send a few — phone pictures are fine — and you will get a straight read on
    what is working, what is not, and what to do next. Free, whether or not you end up on the
    board, and you keep the portfolio you build on the way through.</p>
    <div class="l-cta-row">
      <a class="btn btn-fill" href="/talents/apply.html">Apply to the board &rarr;</a>
    </div>
  </div>
</section>

{foot.group(0)}
{chr(10).join(scripts)}
</body>
</html>
"""
    io.open(OUT, 'w', encoding='utf-8').write(html)
    print('  wrote model-mentoring-india.html')


if __name__ == '__main__':
    main()
