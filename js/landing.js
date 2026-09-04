/* YKS landing-page enquiry forms → Web3Forms (email capture) */
(function () {
  var KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
  document.querySelectorAll('form.l-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      if (!get('name') || !get('contact')) return;
      var btn = form.querySelector('button');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: form.dataset.subject || 'New enquiry — YKS Productions',
          from_name: 'YKS Productions website',
          Source: form.dataset.source || 'Landing page',
          "Found via": (window.YKSSource && window.YKSSource.label()) || '\u2014',
          Name: get('name'),
          Contact: get('contact'),
          Email: get('email') || '—',
          Message: get('message') || '—'
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.success) {
            form.style.display = 'none';
            var ok = form.parentNode.querySelector('.l-form-ok');
            if (ok) ok.style.display = 'block';
          } else {
            btn.textContent = orig; btn.disabled = false;
          }
        })
        .catch(function () { btn.textContent = orig; btn.disabled = false; });
    });
  });
})();

/* Floating WhatsApp + call — one-tap contact from anywhere on the page */
(function () {
  if (document.querySelector('.l-fab')) return;
  var waLink = document.querySelector('a[href*="wa.me/"]');
  var num = (document.body && document.body.getAttribute('data-wa')) || (waLink && (waLink.href.match(/wa\.me\/(\d+)/) || [])[1]) || '971501955122';
  /* The opening line depends on which page you are standing on. This button
     said "I'd like to enquire about a shoot" on every page of the site —
     including the casting board, where it handed people applying for
     work a client's script. They then sent it, because it is what the button
     gave them, and arrived looking like an enquiry that was not one.
     The apply page speaks as an applicant, the roster speaks as a client. */
  var path = location.pathname;
  var line = /\/talents\/apply/.test(path)
    ? "Hi Yedukrishna \u2014 I'd like to apply to the board. I'm 18 or over, and I know the application itself is the form on your site."
    : /\/talents/.test(path)
      ? "Hi Yedukrishna, I'm looking to cast talent from your roster."
      : "Hi Yedukrishna, I'd like to enquire about a shoot.";
  var msg = encodeURIComponent(line);
  var css = '.l-fab{position:fixed;right:18px;bottom:18px;z-index:300;display:flex;flex-direction:column;gap:12px}'
    + '.l-fab a{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.42);transition:transform .25s cubic-bezier(.22,.61,.36,1)}'
    + '.l-fab a:hover{transform:scale(1.09)}'
    + '.l-fab .wa{background:#25D366}.l-fab .tel{background:#ff8c3b}'
    + '.l-fab svg{width:28px;height:28px;display:block}'
    + '@media(max-width:600px){.l-fab{right:14px;bottom:14px}.l-fab a{width:52px;height:52px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var WA = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
  var TEL = '<svg viewBox="0 0 24 24" fill="#07060a"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
  var fab = document.createElement('div'); fab.className = 'l-fab';
  fab.innerHTML = '<a class="wa" href="https://wa.me/' + num + '?text=' + msg + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + WA + '</a>'
    + '<a class="tel" href="tel:+' + num + '" aria-label="Call">' + TEL + '</a>';
  document.body.appendChild(fab);
})();

/* Video facade — poster + play button; the iframe is only created on click,
   so a category page with several films still loads like a static page. */
(function () {
  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('.vfacade');
    if (!f || f.classList.contains('playing')) return;
    var src = f.getAttribute('data-embed');
    if (!src) return;
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.title = f.getAttribute('data-title') || 'Video';
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.setAttribute('allowfullscreen', '');
    f.classList.add('playing');
    f.innerHTML = '';
    f.appendChild(frame);
  });
})();

/* Depth tilt — makes the long-dead data-tilt attribute real.
   Frame, gloss and content read as planes; the card leans toward the
   cursor. Pointer-fine devices only: on touch, cards stay still — the
   gyro version lives in /labs.html where iOS permission is explained.
   One delegated listener, no per-card handlers. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var SEL = '[data-tilt], .pf, .l-places a';
  var current = null;

  var st = document.createElement('style');
  st.textContent =
    '[data-tilt],.pf,.l-places a{will-change:transform}' +
    '.tilting{transition:transform .14s ease-out!important}' +
    '.tilt-reset{transition:transform .45s cubic-bezier(.22,.61,.36,1)!important}';
  document.head.appendChild(st);

  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest(SEL);
    if (el !== current) {
      if (current) release(current);
      current = el;
      if (el) el.classList.add('tilting');
    }
    if (!el) return;
    var r = el.getBoundingClientRect();
    var nx = ((e.clientX - r.left) / r.width - .5) * 2;
    var ny = ((e.clientY - r.top) / r.height - .5) * 2;
    el.style.transform = 'perspective(760px) rotateY(' + (nx * 6).toFixed(2) + 'deg)'
                       + ' rotateX(' + (-ny * 6).toFixed(2) + 'deg) translateY(-3px)';
  }, { passive: true });

  document.addEventListener('pointerout', function (e) {
    if (current && !current.contains(e.relatedTarget)) { release(current); current = null; }
  }, { passive: true });

  function release(el) {
    el.classList.remove('tilting');
    el.classList.add('tilt-reset');
    el.style.transform = '';
    setTimeout(function () { el.classList.remove('tilt-reset'); }, 480);
  }
})();

/* Lightbox — tap any gallery photo to open a full preview.
   Every image inside a .l-gallery, .nights-wide or .l-feature becomes
   tappable; the lightbox steps through that gallery's images with
   arrows, keys and swipe. No dependencies. */
(function () {
  var SEL = '.l-gallery img, .nights-wide img, .l-feature > img, .l-hero-gallery img';
  var imgs = [].slice.call(document.querySelectorAll(SEL));
  if (!imgs.length) return;

  var st = document.createElement('style');
  st.textContent =
    SEL.split(',').map(function (s) { return s + '{cursor:zoom-in}'; }).join('') +
    '.lbx{position:fixed;inset:0;z-index:400;display:none;align-items:center;justify-content:center;' +
    'background:rgba(5,4,8,.95);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
    'opacity:0;transition:opacity .28s ease;touch-action:none}' +
    '.lbx.on{display:flex;opacity:1}' +
    '.lbx-img{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:8px;' +
    'box-shadow:0 30px 90px rgba(0,0,0,.7);transition:transform .3s cubic-bezier(.22,.61,.36,1),opacity .2s;user-select:none;-webkit-user-drag:none}' +
    '.lbx-btn{position:absolute;background:rgba(20,16,24,.66);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
    'border:1px solid rgba(244,237,226,.2);color:#f4ede2;width:52px;height:52px;border-radius:50%;cursor:pointer;' +
    'display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:.2s;z-index:2}' +
    '.lbx-btn:hover{background:#ff8c3b;color:#07060a;border-color:#ff8c3b}' +
    '.lbx-close{top:20px;right:20px;font-size:26px}' +
    '.lbx-prev{left:18px;top:50%;transform:translateY(-50%)}' +
    '.lbx-next{right:18px;top:50%;transform:translateY(-50%)}' +
    '.lbx-count{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font-family:var(--mono,monospace);' +
    'font-size:11px;letter-spacing:.2em;color:rgba(244,237,226,.7)}' +
    '@media(max-width:640px){.lbx-btn{width:44px;height:44px}.lbx-prev{left:8px}.lbx-next{right:8px}.lbx-img{max-width:96vw}}' +
    '@media(prefers-reduced-motion:reduce){.lbx,.lbx-img{transition:none}}';
  document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'lbx'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Photo preview');
  box.innerHTML =
    '<button class="lbx-btn lbx-close" aria-label="Close">&times;</button>' +
    '<button class="lbx-btn lbx-prev" aria-label="Previous">&#8249;</button>' +
    '<img class="lbx-img" alt="" />' +
    '<button class="lbx-btn lbx-next" aria-label="Next">&#8250;</button>' +
    '<span class="lbx-count"></span>';
  document.body.appendChild(box);

  var big = box.querySelector('.lbx-img'), count = box.querySelector('.lbx-count');
  var group = [], idx = 0;

  function show(i) {
    idx = (i + group.length) % group.length;
    var src = group[idx].currentSrc || group[idx].src;
    big.style.opacity = 0;
    var pre = new Image();
    pre.onload = function () { big.src = src; big.alt = group[idx].alt || ''; big.style.opacity = 1; };
    pre.src = src;
    count.textContent = (idx + 1) + ' / ' + group.length;
    box.querySelector('.lbx-prev').style.display = group.length > 1 ? '' : 'none';
    box.querySelector('.lbx-next').style.display = group.length > 1 ? '' : 'none';
    count.style.display = group.length > 1 ? '' : 'none';
  }
  function open(img) {
    // the gallery this image belongs to defines the prev/next set
    var container = img.closest('.l-gallery, .nights-wide, .l-feature, .l-hero-gallery') || document;
    group = [].slice.call(container.querySelectorAll('img')).filter(function (m) { return imgs.indexOf(m) > -1; });
    if (!group.length) group = [img];
    show(group.indexOf(img));
    box.classList.add('on');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() { box.classList.remove('on'); document.documentElement.style.overflow = ''; }

  imgs.forEach(function (img) {
    // if the photo is wrapped in a real link (e.g. a feed post → Instagram),
    // respect the link — don't hijack it with the lightbox
    var link = img.closest('a[href]');
    if (link && !/^#/.test(link.getAttribute('href') || '')) { img.style.cursor = 'pointer'; return; }
    img.addEventListener('click', function (e) { e.preventDefault(); open(img); });
  });
  box.querySelector('.lbx-close').onclick = close;
  box.querySelector('.lbx-prev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
  box.querySelector('.lbx-next').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  // swipe on touch
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 == null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
})();

/* Warm the homepage on hover/tap intent — it's the heaviest page and the
   most-tapped nav item, so start fetching it the instant a Home link is
   touched or hovered, making the actual click feel near-instant. */
(function () {
  var done = false;
  function warm() {
    if (done) return; done = true;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = '/index.html';
    document.head.appendChild(l);
  }
  var homeLinks = document.querySelectorAll('a[href="/index.html"], a[href="/"]');
  homeLinks.forEach(function (a) {
    a.addEventListener('pointerenter', warm, { once: true, passive: true });
    a.addEventListener('touchstart', warm, { once: true, passive: true });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   TRUST LAYER — the three promises + the human behind the lens.
   The homepage already carries "Booking me is the safe call" and the
   Alappuzha story; the 57 service pages carried neither. Injected here
   once so every page gets the same reassurance right where people decide.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var cta = document.querySelector('.l-cta .wrap');
  if (!cta || document.querySelector('.l-promise')) return;

  /* ── the three promises — sit directly above the form, at the decision point ── */
  var wrap = cta.querySelector('.l-form-wrap');
  var promise = document.createElement('ul');
  promise.className = 'l-promise';
  /* Casting pages face two audiences — someone deciding whether to trust us
     with their name, and a brand deciding whether to brief us. "Preview in
     48h" answers neither, so those pages get their own three. */
  // each promise is wrapped in a <span>: the <li> is a flex row, so an unwrapped text node would
  // become its own flex item and sit BESIDE the bold lead-in instead of under it.
  promise.innerHTML = document.body.dataset.page === 'casting'
    ? '<li><span><b>Free to join.</b> No registration fee, no portfolio package, ever.</span></li>'
      + '<li><span><b>Your details stay private.</b> Contact is never published or passed on.</span></li>'
      + '<li><span><b>Same day.</b> You get a reply today — not "we\'ll revert".</span></li>'
    : '<li><span><b>Same day.</b> You get a reply today — not "we\'ll revert".</span></li>'
      + '<li><span><b>One all-in number.</b> Nothing added later, no surprise line items.</span></li>'
      + '<li><span><b>Preview in 48h.</b> First edited frames within two days of the shoot.</span></li>';
  if (wrap) cta.insertBefore(promise, wrap); else cta.appendChild(promise);

  /* ── micro-copy under the send button: removes the last hesitation ── */
  var form = document.querySelector('.l-cta .l-form');
  if (form) {
    var micro = document.createElement('p');
    micro.className = 'l-micro';
    micro.textContent = 'No obligation and no sales call — just a straight answer and one number.';
    form.appendChild(micro);
  }
})();

/* Who's actually behind the camera — a face and a story before the ask.
   People book people, and on a service page there was nothing human at all. */
(function () {
  var ctaSection = document.querySelector('section.l-cta');
  if (!ctaSection || !document.querySelector('.l-cats') || document.querySelector('.l-who')) return;

  var sec = document.createElement('section');
  sec.className = 'l-section l-who-sec';
  sec.innerHTML =
      '<div class="wrap"><div class="l-who">'
    + '<figure class="l-who-photo"><img width="1067" height="1600" src="/assets/yedu-portrait-2.jpg" alt="Yedukrishna Suresh, founder of YKS Productions" loading="lazy" decoding="async" /></figure>'
    + '<div class="l-who-copy">'
    + '<p class="l-eyebrow">The eye behind the lens</p>'
    + '<h2>Why a frame is worth <em>slowing down for</em></h2>'
    + '<p>I grew up in Alappuzha — the backwater town on the Kerala coast where the light moves slow across the water and an ordinary afternoon already looks like a film. Kerala hands you cinema early.</p>'
    + '<p>That pull carried me onto film sets. I shoot stills and cinematography for Malayalam features, and on a set the still is the film\'s first trailer — your job is catching the one frame that makes someone feel the whole story. That\'s the eye I bring to your shoot.</p>'
    + '<p class="l-who-honest"><strong>And the honest part:</strong> I\'m not the cheapest camera in the city. If the lowest quote is the only thing that matters, I\'m genuinely not your guy — and I\'d rather say that now than after. I\'m for people who care how they\'re remembered.</p>'
    + '<p class="l-who-sign">— Yedukrishna Suresh<span>Founder, YKS Productions · FEFKA member</span></p>'
    + '</div></div></div>';
  ctaSection.parentNode.insertBefore(sec, ctaSection);
})();
