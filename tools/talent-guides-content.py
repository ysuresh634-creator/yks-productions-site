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
<p>I&rsquo;m Yedukrishna Suresh. I photograph fashion, portraits and films under YKS Productions, and I run YKS Talents, a free portfolio platform where clients find talent. I&rsquo;ve sat on both sides of the portfolio: shooting them, and looking through them to decide who to cast for my own shoots. This guide is what I wish every new face knew before spending a single rupee.</p>
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
<p>Choose the clearest frame of each pose — usually eight to twelve images in total — and name the files simply (your first name and the shot, e.g. &ldquo;front&rdquo;, &ldquo;profile-left&rdquo;, &ldquo;full-length&rdquo;). Add your current height and measurements in text alongside, not written on the photos.</p>
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
<li><a href="/talents/guides/how-to-make-a-modelling-portfolio.html">How to make a modelling portfolio</a> · <a href="/talents/guides/model-digitals.html">How to shoot your digitals</a></li>
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
