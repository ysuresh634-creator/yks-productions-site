# Content for tools/build-talent-guides.py. Executed by that script; it uses fig().
# Rules: no invented stats, quotes or prices; only released, published work as images;
# YKS Talents is a free portfolio platform (women 18-34), not a jobs board, no fees.

CONTENT = []

# ======================================================================= PILLAR
CONTENT.append(dict(
slug='how-to-make-a-modelling-portfolio',
title='How to Make a Modelling Portfolio in India (Free Guide) | YKS Talents',
og_title='How to Make a Modelling Portfolio — With No Experience, for Free',
desc='How to make a modelling portfolio in India with no experience: which shots to take, digitals vs editorial, comp cards, what it costs, mistakes to avoid — and the free route.',
headline='How to make a modelling portfolio in India — with no experience, and for free',
crumb='How to make a modelling portfolio',
eyebrow='Guide · Portfolios',
h1='How to make a <em>modelling portfolio</em>',
lede='A portfolio is not a photo album. It is a short, deliberate edit that tells a client what you look like, how you move and what you could be for their brand. Here is how I would build one in India today — starting from zero, without paying for a package.',
keywords='how to make a modelling portfolio, how to build a modeling portfolio with no experience, free modelling portfolio, model portfolio India, model digitals, comp card',
intro='''<div class="l-prose" style="margin-top:34px">
<p>I&rsquo;m Yedukrishna Suresh. I photograph fashion, portraits and films under YKS Productions, and I run YKS Talents, a free portfolio platform where clients find talent. I&rsquo;ve sat on both sides of the portfolio: shooting them, and looking through them to decide who to cast for my own shoots. This guide is what I wish every new face knew before spending a single rupee. <a href="/talents/guides/modelling-portfolio-kaise-banaye.html" lang="hi">यह गाइड हिंदी में पढ़ें →</a></p>
</div>''',
sections=[
('what-it-is', 'What a modelling portfolio <em>actually is</em>', '''
<p>A modelling portfolio (often just called a &ldquo;book&rdquo;) is a small set of images that answers three questions for whoever is looking at it: what do you really look like, can you take direction, and what range can you cover? Everything in it should serve one of those three questions. Anything that doesn&rsquo;t is noise.</p>
<p>Today most portfolios are viewed on a phone, in a few seconds, before anyone decides to look closer. That changes the priorities. A tight edit of strong, clear images beats a long scroll of &ldquo;good enough&rdquo; ones every time. Clients are not counting photos; they are looking for a reason to say yes, and a single weak or misleading frame can be the reason they don&rsquo;t.</p>
<p>A complete portfolio usually has three parts:</p>
<ul>
<li><strong>Digitals</strong> (also called polaroids) — plain, unretouched photos that show you as you are today.</li>
<li><strong>A small edit of styled images</strong> — portraits, editorial or commercial frames that show expression, movement and range.</li>
<li><strong>Your details</strong> — accurate measurements, height, city, and the kind of work you are open to. On paper this becomes a comp card.</li>
</ul>
'''),
('digitals-vs-editorial', 'Digitals vs <em>editorial</em> — you need both, digitals first', '''
<p>New models almost always get this backwards. They start with an expensive, heavily styled shoot and never take clean digitals. Clients and casting teams usually ask for digitals first, because digitals are the truth: no heavy makeup, no retouching, no dramatic lighting. They are how someone checks that you look like your photos.</p>
<h3>Digitals (polaroids)</h3>
<p>Simple, natural-light images against a plain wall: a front headshot, both profiles, a three-quarter angle, a smile and a neutral face, a waist-up shot and a full-length shot. Fitted, plain clothing, hair off the face, minimal or no makeup. They can be shot on a phone, and they should be updated whenever your hair, weight or look changes. I&rsquo;ve written a full walkthrough in <a href="/talents/guides/model-digitals.html">what to wear for model digitals, poses and phone setup</a>.</p>
<h3>Editorial and commercial images</h3>
<p>This is where personality comes in. <strong>Editorial</strong> images tell a story or carry a mood — the kind of frame you&rsquo;d see in a fashion story. <strong>Commercial</strong> images sell something: they are warm, approachable, believable, the kind of face that sits next to a product. Most working portfolios in India lean commercial, because that&rsquo;s where most briefs sit — ethnic wear, jewellery, beauty, lifestyle and e-commerce. If you can show both, do; if you can only show one, show the one that matches the clients you actually want.</p>
<div class="g-figs">
''' + fig('/assets/behance/divya-04.webp', 1066, 1600, 'Editorial three-quarter-length image of a model in a silver sequinned top and metallic trousers, from a published YKS fashion shoot', 'Editorial — styling, light and expression carry it.') + '''
''' + fig('/assets/behance/ashika-09.webp', 1066, 1600, 'Full-length fashion image of a model in a patterned halter jumpsuit on a rooftop, from a published YKS fashion shoot', 'Full-length — shows proportion, posture and how clothes hang.') + '''
''' + fig('/assets/behance/olivia-07.webp', 1200, 1600, 'Relaxed lifestyle image of a model seated at a café table, natural light, from a published YKS shoot', 'Lifestyle — believable, warm, commercial.') + '''
</div>
<p style="margin-top:18px">These three frames are from my own released fashion work. Notice how each one answers a different question: the editorial frame shows expression and how styling reads on camera, the full-length shows proportion and posture, and the café frame shows that the person can look natural and relaxed in a real setting. A good portfolio edit covers all three.</p>
'''),
('what-shots', 'What shots to take — <em>the starter list</em>', '''
<p>If you are building a modelling portfolio with no experience, you don&rsquo;t need forty images. You need a small set of the right ones. This is the list I recommend:</p>
<ol>
<li><strong>A clean headshot</strong> — face to the camera, natural expression, soft light. This is often the very first image anyone sees.</li>
<li><strong>A smiling headshot and a serious one</strong> — clients want to know you can do both.</li>
<li><strong>Profile and three-quarter angles</strong> — they show your bone structure honestly.</li>
<li><strong>A full-length image</strong> — standing, relaxed, in fitted clothing. Height and proportion matter for fashion and e-commerce.</li>
<li><strong>A waist-up or mid shot</strong> — the most common crop in beauty and lifestyle campaigns.</li>
<li><strong>One movement or candid frame</strong> — walking, turning, laughing. It proves you aren&rsquo;t stiff.</li>
<li><strong>One look that matches your target market</strong> — for many women in India that&rsquo;s an ethnic or festive look; for others it&rsquo;s clean western wear or beauty.</li>
<li><strong>Your digitals</strong> — always, kept separate and clearly labelled.</li>
</ol>
<p>Six to twelve strong styled images plus a current set of digitals is a good, honest starting book. Add images only when they show something the book doesn&rsquo;t already show.</p>
'''),
('no-experience', 'Building a portfolio with <em>no experience</em>', '''
<p>Everyone starts with no experience. Here is the order I would do it in:</p>
<ol>
<li><strong>Shoot your digitals at home this week.</strong> A plain wall, daylight from a window, a friend holding the phone. This costs nothing and is often the most useful thing you&rsquo;ll ever send.</li>
<li><strong>Practise in front of a mirror and a camera.</strong> Learn your angles, how your face reads in a soft smile versus a neutral look, where your hands go. Ten minutes a day is enough.</li>
<li><strong>Choose your direction.</strong> Commercial, fashion, beauty, ethnic and bridal, fitness, lifestyle. You can do several, but your first edit should look like it belongs to one person with a clear identity.</li>
<li><strong>Get a small number of styled images.</strong> A collaborative shoot with a photographer who is also building their work, a shoot with a friend who knows light, or a properly briefed paid session — all are valid. What matters is the result, not the label.</li>
<li><strong>Edit ruthlessly.</strong> Show your shortlist to someone honest. Remove anything where you look unlike yourself, over-filtered or uncomfortable.</li>
<li><strong>Put it somewhere clients can actually find it.</strong> A camera roll isn&rsquo;t a portfolio. Instagram helps, but a curated profile on a platform built for discovery does a different job.</li>
</ol>
<p class="g-callout">A note on safety: if a &ldquo;test shoot&rdquo; comes with pressure — to pay up front, to shoot alone at an unknown location, or to do lingerie or implied nudity you didn&rsquo;t agree to — walk away. I&rsquo;ve written a separate guide on <a href="/talents/guides/modelling-agency-fees-scams-india.html">modelling agency fees and scams in India</a>.</p>
'''),
('comp-card', 'The comp card, <em>explained</em>', '''
<p>A comp card (composite card, sometimes called a Z-card or zed card) is a one-sheet summary of you: usually a strong headshot on the front, and three or four images showing range on the back, with your name, measurements, height, hair and eye colour, and contact route. It has traditionally been printed, commonly at around A5 size, and handed out at castings.</p>
<p>In India today most comp cards are shared as a PDF or an image on WhatsApp or email rather than printed. The rules are the same either way:</p>
<ul>
<li>Use your <strong>best headshot</strong> on the front. Nothing busy.</li>
<li>On the back, show <strong>range</strong>: full-length, a commercial smile, one fashion or editorial frame, one look that suits your market.</li>
<li>Measurements must be <strong>accurate and current</strong>. Being caught out at a fitting is far worse than a number you think is &ldquo;not ideal&rdquo;.</li>
<li>Keep personal details off it. A city is fine; your home address and personal phone number are not necessary.</li>
</ul>
<p>You can make one free, in your browser, with the <a href="/talents/guides/model-comp-card.html">YKS Talents comp card maker</a> — your photos are never uploaded. The same page covers sizes, stats and layout in detail.</p>
'''),
('cost', 'How much does a modelling portfolio <em>cost</em> in India?', '''
<p>Honestly: it can cost nothing, or it can cost a lot, and the price is not a reliable measure of quality. I&rsquo;m not going to quote you a rate card, because prices vary enormously by city, photographer, and what is included. As a rough, approximate picture of how it typically breaks down:</p>
<ul>
<li><strong>Digitals:</strong> free — a phone, a window and a plain wall.</li>
<li><strong>Collaborative (unpaid) shoots:</strong> typically free for both sides, with the images shared for both portfolios. Agree usage in writing first.</li>
<li><strong>A paid portfolio shoot with a professional photographer:</strong> typically priced by the hour or by the number of looks, with hair, makeup and styling often charged separately. Quotes can range widely, from modest studio sessions to multi-look productions.</li>
<li><strong>&ldquo;Portfolio packages&rdquo; sold as a condition of joining an agency:</strong> this is the one to be most careful about. See below.</li>
</ul>
<p>If you do pay for a shoot, pay a photographer for a clearly defined result — a number of edited images, the looks, who owns what, and the delivery date — and never because someone told you it&rsquo;s required to be &ldquo;registered&rdquo; or &ldquo;considered&rdquo;.</p>
'''),
('free-route', 'The free route: <em>YKS Talents</em>', '''
<p>I built YKS Talents because the most common story I heard from new faces was the same: pay a fee to register, pay for a compulsory shoot, then hear nothing. It shouldn&rsquo;t work that way.</p>
<p><a href="/talents.html">YKS Talents</a> is a free, curated portfolio platform for women aged 18 to 34, across India and the Middle East. You create a free modelling portfolio; clients — brands, photographers, stylists and productions — browse the platform to find talent. It is free forever: no joining fee, no registration fee, no paid tiers, no &ldquo;premium&rdquo; upgrade. I also cast my own YKS shoots from it.</p>
<p>To be clear about what it is not: YKS Talents is not a jobs board and not an agency, and I don&rsquo;t promise anyone work. It&rsquo;s a place to be seen properly. Every application is read by me personally.</p>
<ul>
<li><a href="/talents/apply.html">Create your free modelling portfolio</a> — one short form.</li>
<li>See the platform in your city: <a href="/models-in-mumbai.html">Mumbai</a>, <a href="/models-in-delhi.html">Delhi NCR</a>, <a href="/models-in-bangalore.html">Bangalore</a>, <a href="/models-in-hyderabad.html">Hyderabad</a>, <a href="/models-in-chennai.html">Chennai</a>, <a href="/models-in-pune.html">Pune</a>, <a href="/models-in-kolkata.html">Kolkata</a>, <a href="/models-in-ahmedabad.html">Ahmedabad</a>, <a href="/models-in-jaipur.html">Jaipur</a>, <a href="/models-in-chandigarh.html">Chandigarh</a> and <a href="/models-in-dubai.html">Dubai</a>.</li>
</ul>
'''),
('mistakes', 'Mistakes that <em>quietly sink</em> a portfolio', '''
<ul>
<li><strong>Heavy filters and beauty apps.</strong> If you don&rsquo;t look like your photos in person, the portfolio has done its job badly.</li>
<li><strong>Too many images.</strong> Twelve great frames beat forty mixed ones. Every weak image dilutes the strong ones.</li>
<li><strong>All one look.</strong> Ten versions of the same pose, outfit and expression show no range.</li>
<li><strong>Old images.</strong> If your hair or look has changed, update the digitals and the lead image.</li>
<li><strong>Group photos, crops from events, mirror selfies.</strong> They tell a client nothing useful.</li>
<li><strong>Wrong measurements.</strong> Always current, always honest.</li>
<li><strong>Paying to be &ldquo;registered&rdquo;.</strong> A fee to join is not an investment in your career. Read the <a href="/talents/guides/modelling-agency-fees-scams-india.html">fees and scams guide</a> before you pay anyone anything.</li>
<li><strong>Not reading the usage terms.</strong> Know who can use your images, where, and for how long — even on a free shoot.</li>
</ul>
'''),
],
faq=[
('How do I make a modelling portfolio with no experience?', 'Start with free digitals shot at home in daylight against a plain wall, practise your angles, choose a clear direction (commercial, fashion, beauty or ethnic), then add a small number of styled images from a collaborative or clearly-briefed shoot. Edit hard and put it somewhere clients can find it — for example a <a href="/talents/apply.html">free YKS Talents portfolio</a>.'),
('How many photos should a modelling portfolio have?', 'For a new model, roughly six to twelve strong styled images plus a current set of digitals is a good, honest starting point. Add images only when they show something new.'),
('Can I make a modelling portfolio for free?', 'Yes. Digitals cost nothing, collaborative shoots are usually free for both sides, and YKS Talents lets women aged 18 to 34 create a modelling portfolio free forever — no joining fee, no registration fee and no paid tiers.'),
('Do I need a professional photoshoot to start modelling?', 'Not to start. Clean digitals are often the first thing clients ask for. Styled professional images help show range, but they don&rsquo;t need to come from an expensive package.'),
('What should I wear for a portfolio shoot?', 'For digitals: fitted, plain clothing in solid colours and minimal makeup. For styled images, bring looks that match the work you want — ethnic, western, beauty or lifestyle — and keep them simple enough that you stay the focus. More detail is in the <a href="/talents/guides/model-digitals.html">model digitals guide</a>.'),
('Is YKS Talents a modelling agency or a job site?', 'Neither. YKS Talents is a free portfolio platform where clients find talent. It doesn&rsquo;t offer jobs, doesn&rsquo;t charge fees and isn&rsquo;t an agency. I also cast my own YKS shoots from it.'),
],
))

# ======================================================================= DIGITALS
CONTENT.append(dict(
slug='model-digitals',
title='Model Digitals: What to Wear, Poses & Phone Setup | YKS Talents',
og_title='Model Digitals & Polaroids — What to Wear, How to Pose, How to Shoot',
desc='How to shoot model digitals (polaroids) at home in India: what to wear, the poses clients expect, how to use window light, and the right phone camera settings.',
headline='Model digitals and polaroids: what to wear, poses, lighting and phone setup',
crumb='Model digitals',
eyebrow='Guide · Digitals',
h1='Model digitals: <em>what to wear</em>, poses &amp; phone setup',
lede='Digitals are the most useful images a model has, and the easiest to get wrong. They should be plain, honest and current — and you can shoot a strong set at home, on a phone, in under an hour.',
keywords='model digitals, what to wear for model digitals, model polaroids, polaroids for models, model digitals poses, how to take model digitals at home',
intro='''<div class="l-prose" style="margin-top:34px">
<p>When I look at a new face, digitals are what I trust most, because they show what a person looks like on a normal day under normal light. They&rsquo;re also the part of a <a href="/talents/guides/how-to-make-a-modelling-portfolio.html">modelling portfolio</a> that people skip. Here is exactly how to do them well.</p>
</div>''',
sections=[
('what-are-digitals', 'What digitals (polaroids) <em>are for</em>', '''
<p>The term &ldquo;polaroids&rdquo; comes from the instant-film photos models once carried; today they&rsquo;re called digitals and they&rsquo;re shot on any camera, usually a phone. Their whole purpose is honesty. A client looking at them wants to see your natural skin, your hair as it is, your real proportions, and how your face reads from different angles.</p>
<p>That means the rules are almost the opposite of a styled shoot: no heavy makeup, no retouching, no filters, no dramatic poses, no busy background. The less there is to look at, the more clearly they see you.</p>
'''),
('what-to-wear', 'What to wear for <em>model digitals</em>', '''
<p>Keep it simple and fitted. The clothing should show your shape without becoming the subject.</p>
<ul>
<li><strong>A fitted plain top</strong> — a black or neutral tank top or a simple fitted tee. Black is the most common choice because it&rsquo;s clean and doesn&rsquo;t throw colour onto your skin.</li>
<li><strong>Fitted jeans or leggings</strong> — dark, plain, no rips or big logos. Skinny or straight cuts show leg line best.</li>
<li><strong>Footwear</strong> — simple heels for full-length shots are common for fashion; also take a set barefoot or in flats so your true height is clear.</li>
<li><strong>No prints, logos, slogans or heavy textures</strong> — they distract and date the photos.</li>
<li><strong>Minimal or no jewellery</strong> — small studs at most.</li>
<li><strong>Swimwear is optional, never required.</strong> Some fashion clients ask for it later in a process. You should never feel pressured to send it, and never to someone you haven&rsquo;t verified.</li>
</ul>
<h3>Hair and makeup</h3>
<p>Clean, natural skin. A little concealer and a touch of mascara and lip balm is as far as most people go; many shoot completely bare-faced. Do one set with hair down and natural, and one with hair pulled back off the face so your face shape, jawline and hairline are visible. No hair extensions unless you wear them every day.</p>
<h3>Ethnic wear?</h3>
<p>Save sarees, lehengas and festive looks for your styled images — they suit many Indian briefs beautifully, but they belong in the portfolio edit, not the digitals. Digitals need to show your shape and natural look, and heavy drapes and embellishment hide both.</p>
'''),
('poses', 'The poses <em>clients expect</em>', '''
<p>Digitals follow a fairly standard set. Shoot all of these, with a neutral expression and then a soft natural smile where it makes sense:</p>
<ol>
<li><strong>Front headshot</strong> — shoulders square, face straight to the lens, chin level.</li>
<li><strong>Left and right profile</strong> — turn your whole head, not just your eyes.</li>
<li><strong>Three-quarter headshot</strong> — face turned slightly, eyes to the lens.</li>
<li><strong>Smile</strong> — a real one, with teeth. It matters for commercial and beauty work.</li>
<li><strong>Waist-up</strong> — front and three-quarter.</li>
<li><strong>Full-length front</strong> — standing straight, weight even, arms relaxed by your sides.</li>
<li><strong>Full-length side and back</strong> — shows posture and proportion.</li>
<li><strong>Hair back</strong> — repeat the front headshot with hair off the face.</li>
</ol>
<p>Avoid &ldquo;posing&rdquo;. No hand on the hip, no pout, no head tilt, no hand near the face. Stand naturally, breathe out, relax your shoulders and keep your hands loose. The point is to look like yourself.</p>
'''),
('lighting', 'Lighting: <em>window light</em> does the work', '''
<p>The best light for digitals is free: daylight from a large window, ideally indirect. Stand facing the window, a step or two back from it, with a plain wall behind you. The light falls evenly across your face and shows true skin tone.</p>
<ul>
<li><strong>Avoid harsh direct sun.</strong> In much of India the midday sun is strong and creates hard shadows under the eyes and nose. Morning and late afternoon light is softer; an overcast or monsoon sky is excellent for digitals.</li>
<li><strong>Don&rsquo;t mix light sources.</strong> Turn off tube lights and warm bulbs when shooting by the window; mixed light makes skin look green or orange.</li>
<li><strong>No ring light glare or flash.</strong> They flatten the face and leave reflections in the eyes. If you must shoot indoors at night, a large soft light in front of you is better than anything small and bright.</li>
<li><strong>Plain background.</strong> A white, grey or light neutral wall, clear of furniture, switches and posters. Stand a little away from it so you don&rsquo;t cast a hard shadow on it.</li>
</ul>
'''),
('phone-setup', 'Phone setup: <em>settings that matter</em>', '''
<p>Any recent phone is enough. The settings matter far more than the model:</p>
<ul>
<li><strong>Use the rear camera</strong>, not the selfie camera. It&rsquo;s sharper and handles light better. Ask a friend to shoot, or use a tripod and the timer.</li>
<li><strong>Use the main lens (1x)</strong>, never the ultra-wide (0.5x). Wide lenses stretch faces and distort proportions. For headshots, the 2x setting or stepping back slightly is more flattering and more accurate.</li>
<li><strong>Turn off beauty mode, filters and portrait blur.</strong> Many phones smooth skin automatically — switch it off. Portrait mode can blur hair edges unnaturally.</li>
<li><strong>Camera height:</strong> at eye level for headshots; around waist or chest height for full-length shots, so your legs aren&rsquo;t shortened.</li>
<li><strong>Keep the phone straight</strong> — turn on the grid so verticals stay vertical. Shoot portrait orientation.</li>
<li><strong>Tap to focus on your eyes</strong>, and lower exposure slightly if your skin looks washed out.</li>
<li><strong>Wipe the lens.</strong> A smudged lens is the most common reason for soft, hazy digitals.</li>
<li><strong>Don&rsquo;t edit.</strong> Cropping and straightening are fine. Skin smoothing, reshaping and filters are not.</li>
</ul>
'''),
('sending', 'Labelling, sending and <em>keeping them current</em>', '''
<p>Choose the clearest frame of each pose — usually eight to twelve images in total — and name the files simply (your first name and the shot, e.g. &ldquo;front&rdquo;, &ldquo;profile-left&rdquo;, &ldquo;full-length&rdquo;). Add your current height and measurements in text alongside, not written on the photos. If you want a one-page summary to send with them, make a free <a href="/talents/guides/model-comp-card.html">comp card</a> in your browser.</p>
<p>Reshoot whenever you change your hair colour or length, or your look changes noticeably. Old digitals are worse than none, because they set up a mismatch the moment you meet someone.</p>
<p>When you create a <a href="/talents/apply.html">free YKS Talents portfolio</a>, honest digitals are exactly what I want to see. There&rsquo;s no fee, no paid tier, and no need for an expensive shoot first.</p>
'''),
],
faq=[
('What should I wear for model digitals?', 'A fitted plain top (black is common), fitted dark jeans or leggings, simple heels plus a barefoot or flat set, no prints or logos, and minimal jewellery. Swimwear is optional and should never be pressured.'),
('Can I take model digitals on my phone?', 'Yes. Use the rear camera on the main 1x lens, turn off beauty mode and filters, shoot in soft window light against a plain wall, and keep the camera at eye level for headshots and around waist or chest height for full-length.'),
('Should I wear makeup for digitals?', 'Little or none. Clean skin with at most a touch of concealer, mascara and lip balm. Digitals are meant to show your natural look.'),
('What is the difference between digitals and polaroids?', 'They mean the same thing. Polaroids were originally instant-film photos; today the same plain, unretouched images are shot digitally and called digitals.'),
('How often should I update my digitals?', 'Whenever your hair or look changes noticeably, and in any case regularly enough that they always match how you look today.'),
],
))

# ======================================================================= FEES & SCAMS
CONTENT.append(dict(
slug='modelling-agency-fees-scams-india',
title='Modelling Agency Fees & Scams in India: Red Flags | YKS Talents',
og_title='Modelling Agency Fees & Scams in India — Red Flags and How to Verify',
desc='Do modelling agencies in India charge registration fees? The red flags to watch for, how to verify an agency or casting call, and why YKS Talents is free forever.',
headline='Modelling agency fees and scams in India: red flags, and how to verify',
crumb='Agency fees and scams',
eyebrow='Guide · Safety',
h1='Modelling agency fees &amp; <em>scams in India</em>',
lede='The question I&rsquo;m asked most by new faces is some version of &ldquo;they want me to pay to register — is that normal?&rdquo; Here is a straight answer, the warning signs, and how to check anyone before you send money, documents or photos.',
keywords='do modelling agencies charge fees, modelling agency registration fee, modelling scams India, fake modelling agency, how to verify a modelling agency, casting call scam',
intro='''<div class="l-prose" style="margin-top:34px">
<p>I&rsquo;m Yedukrishna Suresh, and I run <a href="/talents.html">YKS Talents</a>, a free portfolio platform for women 18 to 34. I&rsquo;m not going to name or point at any business here. This guide is about patterns, so you can judge any offer for yourself.</p>
</div>''',
sections=[
('do-they-charge', 'Do modelling agencies <em>charge fees</em>?', '''
<p>A legitimate modelling agency&rsquo;s business is representing talent to clients. In the usual arrangement, an agency earns when its talent is paid for assignments it secures — typically as a commission agreed in a written contract — rather than by charging people simply to join.</p>
<p>So the short answer: <strong>an up-front registration or joining fee is a warning sign, not a standard step.</strong> That doesn&rsquo;t mean every request for money is a scam; some agencies may, for example, ask a signed model to contribute to specific costs, and photographers legitimately charge for shoots. The difference is in the conditions:</p>
<ul>
<li>Is the payment a <strong>condition of being considered</strong> or &ldquo;registered&rdquo;? That&rsquo;s the red flag.</li>
<li>Is the money going to a <strong>clearly identified business</strong>, against a written agreement and a proper invoice, for a <strong>specific service</strong> you chose? That&rsquo;s a normal commercial transaction you can evaluate on its merits.</li>
</ul>
'''),
('red-flags', 'Red flags to <em>watch for</em>', '''
<ul>
<li><strong>&ldquo;Pay to register&rdquo;</strong> — a joining, registration, membership or profile fee before anything else happens.</li>
<li><strong>A compulsory portfolio shoot</strong> — you&rsquo;re told you must use their photographer, at their price, to be accepted.</li>
<li><strong>Guaranteed work</strong> — promises of assured jobs, film roles or a fixed income. No honest business can guarantee that.</li>
<li><strong>Urgency</strong> — &ldquo;only two slots left&rdquo;, &ldquo;offer ends today&rdquo;, pressure to pay before you can think.</li>
<li><strong>Payment to a personal account</strong> — a personal UPI ID or bank account rather than a business one, with no invoice.</li>
<li><strong>Escalating payments</strong> — a small fee first, then a &ldquo;processing&rdquo;, &ldquo;audition&rdquo; or &ldquo;certificate&rdquo; fee, then another.</li>
<li><strong>Requests for revealing photos or video calls</strong> — especially early, from unverified accounts, or framed as a &ldquo;test&rdquo;.</li>
<li><strong>Early requests for ID documents</strong> — Aadhaar, PAN or bank details before there&rsquo;s any verified business relationship.</li>
<li><strong>No verifiable work</strong> — no real past clients or campaigns you can trace, only stock-looking images or screenshots.</li>
<li><strong>Celebrity name-dropping</strong> — claims of connections with famous directors or brands that you can&rsquo;t verify independently.</li>
<li><strong>Meetings in odd places</strong> — hotel rooms, private homes, or locations that change at the last minute.</li>
</ul>
<p class="g-callout">If something feels wrong, it&rsquo;s allowed to be wrong. You never owe anyone a payment, a photo or a meeting to &ldquo;prove&rdquo; you&rsquo;re serious.</p>
'''),
('how-to-verify', 'How to <em>verify</em> an agency or casting call', '''
<ol>
<li><strong>Check the business is real.</strong> Ask for the registered company name. In India you can look up companies on the Ministry of Corporate Affairs (MCA) website, and a GSTIN can be checked on the official GST portal. A real business won&rsquo;t mind you checking.</li>
<li><strong>Trace their work.</strong> Ask which campaigns they&rsquo;ve cast and find those campaigns yourself — on the brand&rsquo;s own channels, not just the agency&rsquo;s screenshots.</li>
<li><strong>Talk to people they represent.</strong> Ask to speak to talent they work with, and look for independent mentions rather than only the reviews they show you.</li>
<li><strong>Check the contact details.</strong> A consistent website, business email address and a physical address that matches what they tell you. Be wary of contact only through a freshly created social account.</li>
<li><strong>Read the contract before signing.</strong> Duration, exclusivity, commission, image rights, how you can leave. Take it home; ask someone you trust to read it too.</li>
<li><strong>Go with someone.</strong> For any in-person meeting or shoot, take a friend or family member, and make sure it&rsquo;s at a proper studio or public place.</li>
<li><strong>Pay only against an invoice</strong>, to a business account, for a service you&rsquo;ve chosen — never as a condition of being considered.</li>
</ol>
<h3>If you&rsquo;ve been scammed</h3>
<p>Stop paying, keep every message, screenshot and payment receipt, and report it. In India you can report cyber fraud on the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call the national cyber crime helpline, 1930, and you can file a complaint with your local police. If revealing images are being misused, report the account to the platform as well. Acting quickly, especially on payments, gives you the best chance.</p>
'''),
('safe-shoots', 'Staying safe at castings <em>and shoots</em>', '''
<p>Most of the people you&rsquo;ll meet in this industry are professionals doing honest work. A few simple habits protect you from the ones who aren&rsquo;t, and no genuine client will mind any of them:</p>
<ul>
<li><strong>Get the brief in writing first</strong> — the client, the date, the location, the outfits involved, and whether the shoot is paid or collaborative.</li>
<li><strong>Agree the clothing beforehand.</strong> Swimwear, lingerie or anything revealing should be stated in the brief and agreed by you in advance — never sprung on you at the studio.</li>
<li><strong>Bring someone.</strong> A friend or family member is a normal presence at a shoot. If a team won&rsquo;t allow it, treat that as your answer.</li>
<li><strong>Share your location</strong> with someone you trust and tell them when you expect to finish.</li>
<li><strong>Agree image usage.</strong> Who can use the photos, where and for how long — even on an unpaid test.</li>
<li><strong>Keep your own copies</strong> of the brief, the agreement and any payment receipts.</li>
</ul>
'''),
('why-free', 'Why YKS Talents is <em>free forever</em>', '''
<p>YKS Talents is free forever. There is no joining fee, no registration fee, no compulsory shoot, no &ldquo;premium profile&rdquo; and no paid tier — not now and not later. That&rsquo;s a deliberate decision, not a launch offer.</p>
<p>It can stay free because it isn&rsquo;t how I earn a living. YKS Productions is my photography and film practice; clients pay for shoots and productions. Talent never pays. YKS Talents is the platform where those clients — and others — find talent, and where I cast my own YKS shoots from.</p>
<p>Being equally clear about what it isn&rsquo;t: it&rsquo;s not an agency and not a jobs board, and I don&rsquo;t promise anyone work. It&rsquo;s open to women aged 18 to 34 across India and the Middle East, and every application is read by me personally. I&rsquo;ll never ask you for money, ID documents up front, or revealing images.</p>
<ul>
<li><a href="/talents/apply.html">Create your free modelling portfolio</a></li>
<li><a href="/talents/guides/how-to-make-a-modelling-portfolio.html">How to make a modelling portfolio</a> · <a href="/talents/guides/model-digitals.html">How to shoot your digitals</a> · <a href="/talents/guides/model-comp-card.html">Free comp card maker</a> · <a href="/talents/guides/modelling-portfolio-kaise-banaye.html" lang="hi">हिंदी में पढ़ें</a></li>
<li>By city: <a href="/models-in-mumbai.html">Mumbai</a>, <a href="/models-in-delhi.html">Delhi NCR</a>, <a href="/models-in-bangalore.html">Bangalore</a>, <a href="/models-in-hyderabad.html">Hyderabad</a>, <a href="/models-in-chennai.html">Chennai</a>, <a href="/models-in-pune.html">Pune</a> and more.</li>
</ul>
'''),
],
faq=[
('Do modelling agencies in India charge a registration fee?', 'An up-front registration or joining fee, charged as a condition of being considered, is a common warning sign. Legitimate agencies usually earn a commission on assignments they secure, under a written contract, not by charging people to join.'),
('Is it a scam if an agency asks me to pay for a portfolio shoot?', 'It&rsquo;s a red flag if the shoot is compulsory, with their photographer, as a condition of acceptance. Paying a photographer you chose, for a clearly defined shoot with an invoice, is a normal transaction.'),
('How can I check if a modelling agency is genuine?', 'Ask for the registered company name and check it on the MCA website, verify any GSTIN on the GST portal, trace the campaigns they claim, speak to talent they represent, read the contract in full and never pay to a personal account.'),
('Where do I report a modelling scam in India?', 'Report it on the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call the 1930 helpline, and file a complaint with your local police. Keep all messages and payment records.'),
('Does YKS Talents charge anything?', 'No. YKS Talents is free forever for women aged 18 to 34 — no joining fee, no registration fee and no paid tiers. It&rsquo;s a portfolio platform where clients find talent, not an agency or a jobs board.'),
],
))

# ======================================================================= COMP CARD + MAKER
CC_MAKER = '''<section class="l-section alt" id="maker">
  <div class="wrap">
    <div class="l-head"><p class="l-eyebrow">Free tool</p><h2>Free comp card <em>maker</em></h2>
      <p>Pick a headshot and up to four photos, add your stats, choose a layout, and download a print-ready PDF or a PNG to share. <b>Your photos never leave your device</b> — everything happens inside your browser. Nothing is uploaded, and no account is needed.</p></div>
    <div class="cc" id="ccMaker">
      <div class="cc-controls">
        <fieldset>
          <legend>1 · Photos</legend>
          <label class="cc-file">Headshot <small>front of the card</small><input type="file" id="ccHead" accept="image/*" /></label>
          <label class="cc-range">Headshot crop <small>move the frame up or down</small><input type="range" id="ccFocus" min="0" max="100" value="35" /></label>
          <label class="cc-file">Back photos <small>up to 4 — full-length, smile, editorial, a look for your market</small><input type="file" id="ccBack" accept="image/*" multiple /></label>
        </fieldset>
        <fieldset>
          <legend>2 · Details</legend>
          <div class="cc-grid">
            <label class="cc-wide">Name<input type="text" id="ccName" placeholder="Your name as you work" maxlength="40" autocomplete="off" /></label>
            <label>Height<input type="text" id="cc_height" placeholder="5'7&quot; / 170 cm" maxlength="20" /></label>
            <label>Bust<input type="text" id="cc_bust" placeholder="34&quot;" maxlength="14" /></label>
            <label>Waist<input type="text" id="cc_waist" placeholder="26&quot;" maxlength="14" /></label>
            <label>Hips<input type="text" id="cc_hips" placeholder="36&quot;" maxlength="14" /></label>
            <label>Shoe<input type="text" id="cc_shoe" placeholder="UK 5" maxlength="12" /></label>
            <label>Hair<input type="text" id="cc_hair" placeholder="Black" maxlength="16" /></label>
            <label>Eyes<input type="text" id="cc_eyes" placeholder="Brown" maxlength="16" /></label>
            <label>City<input type="text" id="ccCity" placeholder="Mumbai" maxlength="24" /></label>
            <label>Instagram<input type="text" id="ccIg" placeholder="@yourhandle" maxlength="40" autocapitalize="none" spellcheck="false" /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>3 · Layout &amp; size</legend>
          <div class="cc-radios">
            <label><input type="radio" name="ccLayout" value="classic" checked /> Classic</label>
            <label><input type="radio" name="ccLayout" value="editorial" /> Editorial</label>
            <label><input type="radio" name="ccLayout" value="minimal" /> Minimal</label>
          </div>
          <label class="cc-wide">Paper size<select id="ccPaper"><option value="a5">A5 — 148 × 210 mm</option><option value="halfin">5.5 × 8.5 in</option></select></label>
        </fieldset>
        <div class="cc-actions">
          <button type="button" class="btn btn-fill" id="ccPdf">Download print PDF</button>
          <button type="button" class="btn btn-ghost" id="ccPng">Download PNG</button>
        </div>
        <p class="cc-msg" id="ccMsg" role="status" aria-live="polite" hidden></p>
        <p class="cc-priv">🔒 Private by design: no upload, no server, no sign-up. Close the tab and it&rsquo;s gone.</p>
      </div>
      <div class="cc-preview" aria-label="Comp card preview">
        <figure><canvas id="ccFront" width="252" height="357"></canvas><figcaption>Front</figcaption></figure>
        <figure><canvas id="ccBackCv" width="252" height="357"></canvas><figcaption>Back</figcaption></figure>
      </div>
    </div>
  </div>
</section>
'''

CC_STYLE = '''<style>
.cc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:28px;align-items:start;margin-top:8px}
.cc fieldset{border:1px solid rgba(244,237,226,.1);border-radius:14px;padding:16px 18px 18px;margin:0 0 14px;background:rgba(22,19,28,.5)}
.cc legend{font-family:var(--mono);font-size:11px;letter-spacing:.16em;color:var(--amber);padding:0 6px;text-transform:uppercase}
.cc label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--paper-dim);margin-top:10px}
.cc small{opacity:.7;font-size:11.5px}
.cc input[type=text],.cc select{font:inherit;font-size:16px;color:var(--paper);background:rgba(255,255,255,.05);border:1px solid rgba(244,237,226,.14);border-radius:10px;padding:10px 12px;min-height:44px;width:100%;box-sizing:border-box}
.cc select option{color:#111}
.cc input[type=file]{font-size:13px;color:var(--paper-dim);padding:10px;border:1px dashed rgba(244,237,226,.22);border-radius:10px;background:rgba(255,255,255,.03)}
.cc input[type=range]{accent-color:var(--amber)}
.cc-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 10px}
.cc-grid .cc-wide{grid-column:1/-1}
.cc-radios{display:flex;gap:16px;flex-wrap:wrap}
.cc-radios label{flex-direction:row;align-items:center;gap:8px;font-size:14px;color:var(--paper)}
.cc-radios input{accent-color:var(--amber);width:18px;height:18px}
.cc-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.cc-actions .btn{cursor:pointer;border:0;font:inherit}
.cc-actions .btn:disabled{opacity:.5}
.cc-msg{color:#ff9a6b;font-size:13.5px;margin:10px 0 0}
.cc-priv{font-size:12.5px;color:var(--paper-dim);margin:12px 0 0}
.cc-preview{position:sticky;top:90px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cc-preview figure{margin:0}
.cc-preview canvas{width:100%;height:auto;display:block;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.45);background:#ddd}
.cc-preview figcaption{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;color:rgba(244,237,226,.55);margin-top:8px;text-transform:uppercase;text-align:center}
@media(max-width:860px){.cc{grid-template-columns:1fr}.cc-preview{position:static;order:-1}.cc-grid{grid-template-columns:1fr 1fr}}
</style>'''

CONTENT.append(dict(
slug='model-comp-card',
title='Model Comp Card Template & Free Comp Card Maker | YKS Talents',
og_title='Free Model Comp Card Maker — Make a Print-Ready Comp Card in Your Browser',
desc='Make a model comp card free: a private, in-browser comp card maker (PDF + PNG, A5 or 5.5×8.5 in), plus what to include — sizes, stats, layout, print vs digital and India tips.',
headline='Model comp cards: what to include, sizes and layout — with a free comp card maker',
crumb='Comp card + free maker',
eyebrow='Guide · Comp cards · Free tool',
h1='Model comp card: <em>free maker</em> &amp; guide',
lede='A comp card is the one page a client keeps. Below is a free comp card maker that works entirely in your browser — your photos never leave your phone or laptop — followed by everything worth knowing about getting the card right.',
keywords='model comp card template free, comp card maker free, model comp card, zed card, comp card size, comp card India',
hero_cta='Open the comp card maker ↓', hero_cta_href='#maker',
hero_cta2='Create your free portfolio', hero_cta2_href='/talents/apply.html',
after_hero=CC_MAKER, extra_style=CC_STYLE, scripts=['/js/comp-card-maker.js?v=1'],
extra_graph=[{
  '@type': 'WebApplication',
  '@id': 'https://yksproductions.com/talents/guides/model-comp-card.html#maker',
  'name': 'YKS Talents comp card maker',
  'url': 'https://yksproductions.com/talents/guides/model-comp-card.html#maker',
  'applicationCategory': 'DesignApplication',
  'operatingSystem': 'Any (runs in a web browser)',
  'browserRequirements': 'Requires a modern browser with JavaScript and HTML canvas',
  'description': 'A free, private comp card maker for models. Choose a headshot and up to four photos, enter your measurements, pick a layout and export a print-ready PDF (A5 or 5.5×8.5 in) or a PNG. Runs entirely in the browser; photos are never uploaded.',
  'isAccessibleForFree': True,
  'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'INR'},
  'featureList': ['Headshot plus up to four photos', 'Three layouts', 'A5 and 5.5×8.5 in print PDF', 'PNG export', 'No upload — runs fully in the browser'],
  'provider': {'@id': 'https://yksproductions.com/talents.html#yks-talents'},
  'creator': {'@id': 'https://yksproductions.com/#yedukrishna'},
}],
intro='''<div class="l-prose" style="margin-top:34px">
<p>I&rsquo;m Yedukrishna Suresh — I photograph fashion and portraits under YKS Productions and run YKS Talents, a free portfolio platform where clients find talent. I built this maker because a comp card shouldn&rsquo;t cost money or require handing your photos to a stranger&rsquo;s server. Use it, then read on to make the card itself as strong as possible.</p>
</div>''',
sections=[
('what-is', 'What a comp card <em>is</em>', '''
<p>A comp card — short for composite card, and also called a zed card or Z-card — is a one-sheet summary of a model. The front carries your strongest headshot and your name. The back carries a small selection of images that show range, along with your measurements and how to reach you. It is the page a casting team keeps on file, forwards to a client, or lays on a table next to other options.</p>
<p>Where your <a href="/talents/guides/how-to-make-a-modelling-portfolio.html">portfolio</a> is the full story, the comp card is the summary. It has to work in a few seconds, at a glance, often on a phone screen. That&rsquo;s why the rules are strict: few images, clean layout, accurate numbers.</p>
'''),
('sizes', 'Comp card sizes: <em>A5 and 5.5 × 8.5 in</em>', '''
<p>There are two sizes you&rsquo;ll see most often:</p>
<ul>
<li><strong>A5 — 148 × 210 mm.</strong> The international paper standard, and the most practical choice in India because any print shop can produce it.</li>
<li><strong>5.5 × 8.5 inches</strong> (about 140 × 216 mm). Half of a US letter sheet; common in the US and with international clients.</li>
</ul>
<p>Both are portrait, both are double-sided, and they&rsquo;re close enough that a well-designed card works at either. The maker above exports both. If you&rsquo;re unsure, choose A5.</p>
<p>For print, the file should be high resolution — the maker renders each side at 300 pixels per inch, which is the usual standard for sharp print. Ask your printer whether they need bleed (a few extra millimetres around the edge that gets trimmed); if they do, they&rsquo;ll usually tell you exactly how much.</p>
'''),
('stats', 'Which stats to <em>include</em>', '''
<p>Every number on a comp card is something a client may plan a fitting or a costume around, so accuracy matters far more than flattery. Include:</p>
<ul>
<li><strong>Height</strong> — in feet and inches and in centimetres. Both are used in India; international clients usually prefer centimetres.</li>
<li><strong>Bust, waist and hips</strong> — measured with a soft tape, standing relaxed, over light clothing. Inches are the norm in most Indian studios.</li>
<li><strong>Shoe size</strong> — state the system, e.g. UK or EU, so there&rsquo;s no guessing.</li>
<li><strong>Hair and eye colour</strong> — simple, honest words: black, dark brown, brown, hazel.</li>
<li><strong>City</strong> — where you&rsquo;re based, so clients know whether travel is involved.</li>
<li><strong>A contact route</strong> — a professional email or your Instagram handle is enough.</li>
</ul>
<p>Leave off your date of birth, home address and personal phone number. They aren&rsquo;t needed to assess you for a shoot, and a comp card gets forwarded far beyond the person you first sent it to. Dress size is optional; if you include it, state the system.</p>
'''),
('layout', 'Layout: <em>what goes where</em>', '''
<h3>The front</h3>
<p>One image: your best, clearest headshot — face to camera or a soft three-quarter, natural expression, minimal styling. Your name in large, clean type. Nothing else competes with it. The front is how you&rsquo;re remembered, so choose the image where you look most like yourself on a good day.</p>
<h3>The back</h3>
<p>Two to four images, each answering a different question:</p>
<ol>
<li><strong>A full-length shot</strong> — proportion, posture, how clothes hang.</li>
<li><strong>A commercial smile</strong> — warm, approachable, believable.</li>
<li><strong>An editorial or fashion frame</strong> — mood and styling.</li>
<li><strong>A look for your market</strong> — for many Indian briefs that&rsquo;s an ethnic, festive or bridal look; for beauty, a clean close-up.</li>
</ol>
<p>Then your stats in a single, tidy band, and your name and contact again in small type. Don&rsquo;t repeat the front image on the back, and don&rsquo;t use four versions of the same pose — that&rsquo;s range lost.</p>
<h3>Typography and colour</h3>
<p>Keep it quiet. One typeface for your name, one for the stats, lots of space, and a plain background. The pictures do the work; decoration only distracts. The three layouts in the maker — Classic, Editorial and Minimal — all follow these rules in slightly different ways.</p>
'''),
('digital-print', 'Digital vs <em>print</em>', '''
<p>Most comp cards in India today are shared digitally — as a PDF or an image on WhatsApp or email — rather than handed over in person. You&rsquo;ll still want both versions:</p>
<ul>
<li><strong>PNG</strong> — front and back side by side in one image. Best for WhatsApp, Instagram DMs and quick sharing.</li>
<li><strong>PDF</strong> — two pages, front and back, at print size. Best for email, for clients who keep files, and for taking to a printer.</li>
</ul>
<p>If you print, a matte or silk card stock usually looks more premium than gloss, which shows fingerprints and glare. Print a small number — your look and measurements will change, and an out-of-date card does more harm than none. Keep a fresh set of <a href="/talents/guides/model-digitals.html">digitals</a> alongside the card; a client who likes your card will often ask for them next.</p>
'''),
('india-tips', 'Comp card tips <em>for India</em>', '''
<ul>
<li><strong>Give height both ways.</strong> 5&rsquo;7&Prime; / 170 cm covers every client.</li>
<li><strong>Match the back to the work you want.</strong> Ethnic wear, jewellery and bridal are large categories in India; if that&rsquo;s your direction, show one strong look in it.</li>
<li><strong>Keep the file light enough to send.</strong> If a PDF is too heavy for a client&rsquo;s inbox, share the PNG instead.</li>
<li><strong>Use the name you work under</strong>, consistently, across the card, Instagram and any portfolio.</li>
<li><strong>Be cautious who you send it to.</strong> A comp card is personal information. Send it to verified clients and businesses — read <a href="/talents/guides/modelling-agency-fees-scams-india.html">the fees and scams guide</a> if anything feels off.</li>
<li><strong>Never pay for a &ldquo;compulsory&rdquo; comp card package</strong> as a condition of being considered. You can make a good one here, free.</li>
</ul>
<p>When your card is ready, <a href="/talents/apply.html">create your free YKS Talents portfolio</a>, so clients across India and the Middle East can find you. It&rsquo;s free forever — no joining fee, no registration fee and no paid tiers — and it isn&rsquo;t a jobs board.</p>
'''),
],
faq=[
('Is the comp card maker really free?', 'Yes. It&rsquo;s free, with no sign-up, no watermark and no paid version.'),
('Are my photos uploaded anywhere?', 'No. The maker runs entirely in your browser. Photos are read from your device, drawn on your screen and exported from memory. Nothing is sent to any server, including mine.'),
('What size is a model comp card?', 'The two common sizes are A5 (148 × 210 mm) and 5.5 × 8.5 inches. Both are portrait and double-sided. A5 is the easiest to print in India.'),
('What should be on a model comp card?', 'A headshot and your name on the front; two to four images showing range on the back, with height, bust, waist, hips, shoe size, hair and eye colour, your city and a professional contact route.'),
('Should I print my comp card or send it digitally?', 'Both are useful. Most clients in India receive comp cards as a PDF or image on WhatsApp or email, but a small print run is handy for in-person castings.'),
('Does a comp card get me modelling work?', 'No card guarantees work. It makes you easier to assess and remember. YKS Talents is a free portfolio platform where clients find talent; it doesn&rsquo;t offer jobs.'),
],
))

# ======================================================================= HINDI PILLAR
CONTENT.append(dict(
slug='modelling-portfolio-kaise-banaye', lang='hi',
title='Modelling Portfolio Kaise Banaye? Free Guide (Hindi) | YKS Talents',
og_title='मॉडलिंग पोर्टफोलियो कैसे बनाएं? Free गाइड (हिंदी)',
desc='मॉडलिंग portfolio कैसे बनाएं, model कैसे बनें, कितने पैसे लगते हैं और fees/scam से कैसे बचें — बिना experience के, free में। 18–34 साल की महिलाओं के लिए हिंदी गाइड।',
headline='मॉडलिंग पोर्टफोलियो कैसे बनाएं — बिना experience के, free में',
crumb='मॉडलिंग पोर्टफोलियो कैसे बनाएं',
eyebrow='गाइड · हिंदी',
h1='मॉडलिंग <em>पोर्टफोलियो</em> कैसे बनाएं?',
lede='Portfolio कोई photo album नहीं है। यह कुछ चुनी हुई तस्वीरों का छोटा-सा सेट है, जो client को बताता है कि आप असल में कैसी दिखती हैं, camera के सामने कैसी हैं और उनके brand के लिए क्या बन सकती हैं। यह गाइड बताती है कि शुरुआत से, बिना कोई package ख़रीदे, portfolio कैसे बनाया जाए।',
keywords='modelling portfolio kaise banaye, model kaise bane, model banne ke liye kitne paise lagte hain, मॉडलिंग पोर्टफोलियो कैसे बनाएं, मॉडल कैसे बनें, free modelling portfolio',
alternates=[('hi-IN', 'https://yksproductions.com/talents/guides/modelling-portfolio-kaise-banaye.html'),
            ('en-IN', 'https://yksproductions.com/talents/guides/how-to-make-a-modelling-portfolio.html'),
            ('x-default', 'https://yksproductions.com/talents/guides/how-to-make-a-modelling-portfolio.html')],
intro='''<div class="l-prose" style="margin-top:34px">
<p>मैं यदुकृष्ण सुरेश (Yedukrishna Suresh) हूँ। YKS Productions के नाम से fashion, portrait और films शूट करता हूँ, और YKS Talents चलाता हूँ — एक free portfolio प्लेटफ़ॉर्म, जहाँ clients talent ढूंढते हैं। मैंने portfolio दोनों तरफ़ से देखे हैं: उन्हें शूट करते हुए भी, और अपने shoots के लिए casting करते समय उन्हें परखते हुए भी। यह गाइड वही है जो मैं चाहता हूँ कि हर नया चेहरा एक भी रुपया ख़र्च करने से पहले जान ले। <a href="/talents/guides/how-to-make-a-modelling-portfolio.html" lang="en">Read this guide in English →</a></p>
</div>''',
sections=[
('model-kaise-bane', 'Model कैसे बनें — <em>पहला क़दम</em>', '''
<p>Model बनने के लिए किसी डिग्री या बड़े contact की ज़रूरत नहीं होती। ज़रूरत होती है तीन चीज़ों की: ऐसी तस्वीरें जो आपको सच में दिखाएँ, camera के सामने सहज होना, और सही लोगों तक पहुँचना। ज़्यादातर नए models की ग़लती यह होती है कि वे सीधे किसी महँगे shoot या &ldquo;registration&rdquo; पर पैसे लगा देते हैं, जबकि शुरुआत बिल्कुल free हो सकती है।</p>
<p>सबसे पहले यह तय करें कि आप किस तरह का काम करना चाहती हैं: <strong>commercial</strong> (ads, e-commerce, lifestyle), <strong>fashion और editorial</strong>, <strong>beauty</strong>, या <strong>ethnic और bridal</strong>। भारत में बहुत-से briefs ethnic wear, jewellery, beauty और lifestyle के होते हैं। आप एक से ज़्यादा दिशाओं में काम कर सकती हैं, पर पहला portfolio ऐसा लगना चाहिए जैसे वह एक साफ़ पहचान वाले इंसान का हो।</p>
<p>फिर रोज़ थोड़ा अभ्यास करें — शीशे और phone camera के सामने। अपने angles पहचानें, हल्की मुस्कान और neutral चेहरे का फ़र्क़ देखें, हाथ कहाँ रखने हैं यह सीखें। दिन के दस मिनट काफ़ी हैं।</p>
'''),
('digitals', 'Digitals और editorial — <em>पहले digitals</em>', '''
<p>पूरे portfolio के तीन हिस्से होते हैं:</p>
<ul>
<li><strong>Digitals</strong> (इन्हें polaroids भी कहते हैं) — सादी, बिना edit की तस्वीरें, जो दिखाएँ कि आप आज असल में कैसी दिखती हैं।</li>
<li><strong>Styled तस्वीरें</strong> — portrait, editorial या commercial frames, जो expression, movement और range दिखाएँ।</li>
<li><strong>आपकी details</strong> — सही measurements, height और शहर। छपे रूप में यही <a href="/talents/guides/model-comp-card.html">comp card</a> बनता है।</li>
</ul>
<p>Clients अक्सर सबसे पहले digitals ही माँगते हैं, क्योंकि digitals सच दिखाते हैं — न भारी makeup, न retouching, न dramatic lighting। इन्हें आप घर पर phone से बना सकती हैं: खिड़की की रोशनी, सादी दीवार, fitted और plain कपड़े, बाल चेहरे से पीछे, makeup न के बराबर। Front headshot, दोनों profiles, three-quarter angle, मुस्कान वाली तस्वीर, waist-up और full-length — बस इतना। कपड़ों, poses और phone settings की पूरी जानकारी <a href="/talents/guides/model-digitals.html" lang="en">model digitals गाइड</a> में है (अंग्रेज़ी में)।</p>
<p><strong>Editorial</strong> तस्वीरें कोई मूड या कहानी दिखाती हैं; <strong>commercial</strong> तस्वीरें कुछ बेचती हैं — गर्मजोशी भरी, भरोसेमंद, ऐसा चेहरा जो किसी product के साथ सहज लगे। भारत में ज़्यादातर portfolios commercial की तरफ़ झुके होते हैं, क्योंकि ज़्यादातर briefs वहीं होते हैं।</p>
'''),
('kaun-si-photos', 'कौन-सी तस्वीरें <em>लें</em>', '''
<p>बिना experience के portfolio बनाने के लिए चालीस तस्वीरें नहीं चाहिए। सही छह से बारह styled तस्वीरें और digitals का एक ताज़ा सेट काफ़ी है:</p>
<ol>
<li><strong>साफ़ headshot</strong> — चेहरा camera की ओर, प्राकृतिक भाव, नरम रोशनी।</li>
<li><strong>एक मुस्कुराता और एक गंभीर headshot</strong> — clients जानना चाहते हैं कि आप दोनों कर सकती हैं।</li>
<li><strong>Profile और three-quarter angles</strong> — चेहरे की बनावट ईमानदारी से दिखती है।</li>
<li><strong>Full-length तस्वीर</strong> — सीधी, सहज, fitted कपड़ों में। Fashion और e-commerce के लिए ज़रूरी।</li>
<li><strong>Waist-up या mid shot</strong> — beauty और lifestyle campaigns में सबसे आम crop।</li>
<li><strong>एक movement वाली तस्वीर</strong> — चलते, मुड़ते या हँसते हुए। इससे पता चलता है कि आप अकड़ी हुई नहीं हैं।</li>
<li><strong>आपके market का एक look</strong> — बहुत-सी महिलाओं के लिए यह साड़ी, लहंगा या festive look होता है; दूसरों के लिए साफ़ western wear या beauty।</li>
</ol>
<p>नई तस्वीर तभी जोड़ें जब वह कुछ ऐसा दिखाए जो portfolio में पहले से नहीं है।</p>
'''),
('kitne-paise', 'Model बनने के लिए <em>कितने पैसे लगते हैं</em>?', '''
<p>सीधा जवाब: शुरुआत में कुछ भी नहीं, और बाद में भी उतना ही जितना आप ख़ुद चुनें। मैं कोई rate card नहीं बताऊँगा, क्योंकि दाम शहर, photographer और शामिल चीज़ों के हिसाब से बहुत बदलते हैं। मोटे तौर पर, अनुमानित तस्वीर कुछ ऐसी है:</p>
<ul>
<li><strong>Digitals:</strong> free — phone, खिड़की और सादी दीवार।</li>
<li><strong>Collaborative (बिना भुगतान वाले) shoots:</strong> आम तौर पर दोनों तरफ़ free, तस्वीरें दोनों के portfolio के लिए। Usage पहले लिखित में तय करें।</li>
<li><strong>Professional photographer के साथ paid shoot:</strong> आम तौर पर घंटे या looks के हिसाब से, और hair, makeup व styling अक्सर अलग से। Quotes में बहुत फ़र्क़ हो सकता है।</li>
<li><strong>Agency में &ldquo;join&rdquo; करने की शर्त पर बेचे गए portfolio packages:</strong> इनसे सबसे ज़्यादा सावधान रहें।</li>
</ul>
<p>अगर आप shoot के लिए पैसे देती भी हैं, तो एक साफ़ तय नतीजे के लिए दें — कितनी edited तस्वीरें, कौन-से looks, तस्वीरों पर किसका अधिकार, और delivery कब। इसलिए कभी नहीं कि किसी ने कहा कि &ldquo;register&rdquo; होने के लिए यह ज़रूरी है।</p>
'''),
('scam', 'Fees और scam से <em>सावधान</em>', '''
<p>नए चेहरों से मुझसे सबसे ज़्यादा यही पूछा जाता है: &ldquo;वे register करने के पैसे माँग रहे हैं — क्या यह normal है?&rdquo; आम तौर पर एक असली agency तब कमाती है जब उसका talent किसी लिखित contract के तहत किसी assignment से कमाता है — सिर्फ़ join करवाने के पैसे लेकर नहीं। इसलिए पहले से registration या joining fee माँगना एक चेतावनी का संकेत है।</p>
<p>इन बातों पर ध्यान दें:</p>
<ul>
<li><strong>&ldquo;पहले registration fee भरिए&rdquo;</strong> — कुछ भी होने से पहले पैसे।</li>
<li><strong>ज़बरदस्ती का portfolio shoot</strong> — उनके photographer से, उनके दाम पर, नहीं तो &ldquo;selection&rdquo; नहीं।</li>
<li><strong>पक्के काम का वादा</strong> — कोई भी ईमानदार व्यवसाय काम की guarantee नहीं दे सकता।</li>
<li><strong>Personal UPI या bank account में भुगतान</strong>, बिना invoice के।</li>
<li><strong>शुरुआत में ही revealing तस्वीरें या video call की माँग</strong>, या Aadhaar/PAN जैसी documents की माँग।</li>
<li><strong>Hotel room या बदलती जगहों पर मिलने का दबाव।</strong></li>
</ul>
<p>किसी भी shoot या meeting में किसी दोस्त या परिवार के सदस्य को साथ ले जाएँ। अगर आपके साथ धोखा हुआ है, तो National Cyber Crime Reporting Portal (cybercrime.gov.in) पर शिकायत करें या 1930 helpline पर कॉल करें, और अपने नज़दीकी police station में भी शिकायत दर्ज कराएँ। पूरी जानकारी <a href="/talents/guides/modelling-agency-fees-scams-india.html" lang="en">agency fees और scams गाइड</a> में है (अंग्रेज़ी में)।</p>
'''),
('free-yks', 'Free रास्ता: <em>YKS Talents</em>', '''
<p>मैंने YKS Talents इसलिए बनाया क्योंकि नए चेहरों से सबसे आम कहानी यही सुनने को मिलती थी: register करने के पैसे भरो, ज़बरदस्ती का shoot करवाओ, और फिर कोई ख़बर नहीं। ऐसा नहीं होना चाहिए।</p>
<p><a href="/talents.html">YKS Talents</a> भारत और Middle East में 18 से 34 साल की महिलाओं के लिए एक free, curated portfolio प्लेटफ़ॉर्म है। आप अपना free modelling portfolio बनाती हैं; clients — brands, photographers, stylists और productions — प्लेटफ़ॉर्म पर talent ढूंढते हैं। यह हमेशा free है: कोई joining fee नहीं, कोई registration fee नहीं, कोई paid plan या &ldquo;premium&rdquo; upgrade नहीं। मैं अपने YKS shoots की casting भी यहीं से करता हूँ।</p>
<p>साफ़ कर दूँ कि यह क्या नहीं है: YKS Talents कोई jobs board नहीं है, कोई agency नहीं है, और मैं किसी से काम का वादा नहीं करता। यह ठीक से दिखाई देने की जगह है। हर application मैं ख़ुद पढ़ता हूँ।</p>
<ul>
<li><a href="/talents/apply.html">अपना free modelling portfolio बनाएं</a> — बस एक छोटा-सा form।</li>
<li>अपने शहर में: <a href="/models-in-mumbai.html">Mumbai</a>, <a href="/models-in-delhi.html">Delhi NCR</a>, <a href="/models-in-bangalore.html">Bangalore</a>, <a href="/models-in-hyderabad.html">Hyderabad</a>, <a href="/models-in-chennai.html">Chennai</a>, <a href="/models-in-pune.html">Pune</a>, <a href="/models-in-kolkata.html">Kolkata</a>, <a href="/models-in-ahmedabad.html">Ahmedabad</a>, <a href="/models-in-jaipur.html">Jaipur</a>, <a href="/models-in-chandigarh.html">Chandigarh</a> और <a href="/models-in-dubai.html">Dubai</a>।</li>
</ul>
'''),
('galtiyan', 'आम <em>ग़लतियाँ</em>', '''
<ul>
<li><strong>भारी filters और beauty apps</strong> — अगर आप सामने से तस्वीरों जैसी नहीं दिखतीं, तो portfolio ने अपना काम ठीक से नहीं किया।</li>
<li><strong>बहुत ज़्यादा तस्वीरें</strong> — बारह बेहतरीन frames चालीस मिली-जुली तस्वीरों से बेहतर हैं।</li>
<li><strong>हर तस्वीर में एक ही look</strong> — एक ही pose, कपड़े और भाव कोई range नहीं दिखाते।</li>
<li><strong>पुरानी तस्वीरें</strong> — बाल या look बदला है, तो digitals भी बदलें।</li>
<li><strong>Group photos, events की crop की हुई तस्वीरें, mirror selfies।</strong></li>
<li><strong>ग़लत measurements</strong> — हमेशा ताज़ा और ईमानदार।</li>
<li><strong>&ldquo;Register&rdquo; होने के लिए पैसे देना</strong> — join करने की fee आपके career में निवेश नहीं है।</li>
</ul>
'''),
],
faq=[
('मॉडलिंग portfolio कैसे बनाएं, अगर कोई experience नहीं है?', 'घर पर खिड़की की रोशनी में सादी दीवार के सामने free digitals बनाएं, अपने angles का अभ्यास करें, एक साफ़ दिशा चुनें (commercial, fashion, beauty या ethnic), और फिर किसी collaborative या साफ़ brief वाले shoot से कुछ styled तस्वीरें जोड़ें। फिर उसे ऐसी जगह रखें जहाँ clients ढूंढ सकें — जैसे <a href="/talents/apply.html">YKS Talents पर free portfolio</a>।'),
('Model बनने के लिए कितने पैसे लगते हैं?', 'शुरुआत free हो सकती है: digitals का कोई ख़र्च नहीं और collaborative shoots आम तौर पर दोनों तरफ़ free होते हैं। Paid shoots के दाम शहर और photographer के हिसाब से बहुत बदलते हैं। Join करने या register होने के लिए पैसे माँगना एक चेतावनी का संकेत है।'),
('क्या YKS Talents पर portfolio सच में free है?', 'हाँ। 18 से 34 साल की महिलाओं के लिए यह हमेशा free है — कोई joining fee नहीं, कोई registration fee नहीं और कोई paid plan नहीं।'),
('क्या YKS Talents नौकरी या modelling jobs देता है?', 'नहीं। YKS Talents एक free portfolio प्लेटफ़ॉर्म है जहाँ clients talent ढूंढते हैं। यह jobs नहीं देता, fees नहीं लेता और कोई agency नहीं है। मैं अपने YKS shoots की casting भी यहीं से करता हूँ।'),
('Portfolio में कितनी तस्वीरें होनी चाहिए?', 'नए model के लिए लगभग छह से बारह अच्छी styled तस्वीरें और digitals का एक ताज़ा सेट एक अच्छी, ईमानदार शुरुआत है।'),
('Comp card क्या होता है?', 'Comp card एक पन्ने का सार है: सामने headshot और नाम, पीछे range दिखाने वाली कुछ तस्वीरें और आपके measurements। <a href="/talents/guides/model-comp-card.html">Free comp card maker</a> से आप इसे अपने browser में ही बना सकती हैं।'),
],
))

# English pillar <-> Hindi hreflang pair
for _g in CONTENT:
    if _g['slug'] == 'how-to-make-a-modelling-portfolio':
        _g['alternates'] = [('en-IN', 'https://yksproductions.com/talents/guides/how-to-make-a-modelling-portfolio.html'),
                            ('hi-IN', 'https://yksproductions.com/talents/guides/modelling-portfolio-kaise-banaye.html'),
                            ('x-default', 'https://yksproductions.com/talents/guides/how-to-make-a-modelling-portfolio.html')]
