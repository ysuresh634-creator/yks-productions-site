/* ═══════════════════════════════════════════════════════════════
   YKS PRODUCTIONS — scroll direction (GSAP ScrollTrigger + Lenis)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 768px)').matches;

  /* ─────────── smooth scroll ─────────── */
  history.scrollRestoration = 'manual';
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // rAF pauses while the tab is hidden; if the scroll position moved
  // meanwhile (anchors, restored position), resync Lenis so it doesn't
  // yank the page back to its stale internal position on wake
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    }
  });

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    $('#burger') && $('#burger').classList.remove('open');
    $('.nav .links').classList.remove('open');
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  }));

  /* ─────────── mobile menu ─────────── */
  $('#burger').addEventListener('click', () => {
    $('#burger').classList.toggle('open');
    $('.nav .links').classList.toggle('open');
  });

  /* ─────────── text splitting ─────────── */
  $$('[data-split]').forEach(el => {
    const mode = el.dataset.split;
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    if (mode === 'chars') {
      text.split('').forEach(ch => {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(s);
      });
    } else {
      text.split(/\s+/).forEach((w, i, arr) => {
        const s = document.createElement('span');
        s.className = 'word';
        s.textContent = w;
        el.appendChild(s);
        if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
      });
    }
  });

  /* ─────────── loader ─────────── */
  const loader = $('#loader'), loaderFill = $('#loaderFill');
  let fakeP = 0;
  const loadTick = setInterval(() => {
    fakeP = Math.min(fakeP + Math.random() * 14, 92);
    loaderFill.style.width = fakeP + '%';
  }, 110);

  function finishLoad() {
    clearInterval(loadTick);
    loaderFill.style.width = '100%';
    setTimeout(() => {
      loader.classList.add('done');
      heroIntro();
    }, 320);
  }
  if (document.readyState === 'complete') setTimeout(finishLoad, 500);
  else window.addEventListener('load', () => setTimeout(finishLoad, 350));
  setTimeout(finishLoad, 5200); // hard cap — never trap the visitor

  /* ─────────── hero intro ─────────── */
  let introDone = false;
  function heroIntro() {
    if (introDone) return; introDone = true;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-eyebrow .char', { yPercent: 120, opacity: 0, stagger: .014, duration: .9 })
      .from('.hero-title .char', { yPercent: 130, opacity: 0, rotateX: -50, stagger: .03, duration: 1.25 }, '-=.55')
      .from('.hero-name .char', { yPercent: 120, opacity: 0, stagger: .04, duration: .9 }, '-=.75')
      .from('.hero-roles .word', { y: 26, opacity: 0, stagger: .05, duration: .8 }, '-=.7')
      .from('.hero-meta > div', { y: 30, opacity: 0, stagger: .1, duration: .7 }, '-=.55')
      .from('.hero-scrollcue, .hero-frameinfo', { opacity: 0, duration: .8 }, '-=.4');
  }

  /* ─────────── cinema scenes (async boot) ─────────── */
  const scenes = {};
  const cinemaPins = {}; // filled below once the pin triggers exist
  async function bootScenes() {
    scenes.hero = await YKSCinema.create('hero', $('#heroCanvas'));
    scenes.dubai = await YKSCinema.create('dubai', $('#dubaiCanvas'));
  }
  bootScenes();
  // render only near the pinned range — checked against the pin triggers'
  // live start/end so it survives refreshes, resizes and pin spacers
  gsap.ticker.add(() => {
    const y = window.scrollY;
    for (const key in cinemaPins) {
      const t = cinemaPins[key], s = scenes[key];
      if (t && s) s.setActive(y > t.start - innerHeight && y < t.end + innerHeight);
    }
  });

  /* ─────────── letterbox bars ─────────── */
  const lbT = $('#lbTop'), lbB = $('#lbBot');
  function letterbox(on) {
    gsap.to([lbT, lbB], { height: on ? '7vh' : 0, duration: .8, ease: 'power3.inOut', overwrite: 'auto' });
  }

  /* ─────────── ACT I · hero scrub ─────────── */
  const heroTC = $('#heroTC');
  cinemaPins.hero = ScrollTrigger.create({
    trigger: '#act-hero', start: 'top top', end: mobile ? '+=65%' : '+=140%',
    pin: '.act-hero .cinema-stage', scrub: true, anticipatePin: 1,
    onToggle: self => letterbox(self.isActive),
    onUpdate: self => {
      const p = self.progress;
      if (scenes.hero) scenes.hero.setProgress(p);
      // title drifts apart + fades as the camera pushes in
      gsap.set('.hero-content', { y: -p * 200, opacity: 1 - Math.max(0, p - .3) * 1.7, scale: 1 + p * .1 });
      gsap.set('.hero-scrollcue', { opacity: Math.max(0, 1 - p * 4) });
      const totalFrames = Math.round(p * 192); // 8s @ 24fps
      const ss = String(Math.floor(totalFrames / 24)).padStart(2, '0');
      const ff = String(totalFrames % 24).padStart(2, '0');
      heroTC.textContent = '00:00:' + ss + ':' + ff;
    }
  });

  /* ─────────── stats counters ─────────── */
  $$('.strip .n[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = String(el.dataset.count).includes('.') ? 1 : 0;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => {
        el.textContent = (decimals ? obj.v.toFixed(1) : Math.round(obj.v).toLocaleString()) + suffix;
      }
    });
  });

  /* ─────────── reveals via IntersectionObserver ───────────
     (immune to layout shifts from lazy images, unlike
     position-based ScrollTriggers which drift and leave
     blocks invisible) */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));
  $$('h2[data-split], .about-lead, .films-quote, .foot h3, .dubai-title span, .dubai-title em').forEach(el => {
    if (el.closest('.act-hero') || !$$('.word', el).length) return;
    el.classList.add('splitR');
    $$('.word', el).forEach((w, i) => w.style.transitionDelay = (i * 35) + 'ms');
    io.observe(el);
  });
  // keep pinned-section geometry honest as lazy images land
  let refreshT;
  $$('img[loading="lazy"]').forEach(im => im.addEventListener('load', () => {
    clearTimeout(refreshT);
    refreshT = setTimeout(() => ScrollTrigger.refresh(), 350);
  }, { once: true }));

  /* ─────────── portrait + service-card tilt ─────────── */
  if (!reduced && matchMedia('(hover:hover)').matches) {
    const frame = $('.portrait-frame');
    $('#portraitTilt').addEventListener('mousemove', e => {
      const r = frame.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - .5) * -10;
      const ry = ((e.clientX - r.left) / r.width - .5) * 12;
      gsap.to(frame, { rotateX: rx, rotateY: ry, duration: .6, ease: 'power2.out' });
    });
    $('#portraitTilt').addEventListener('mouseleave', () =>
      gsap.to(frame, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.5)' }));

    $$('.svc').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        const ry = ((e.clientX - r.left) / r.width - .5) * 7;
        const rx = ((e.clientY - r.top) / r.height - .5) * -7;
        gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 700, duration: .5 });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7 }));
    });
  }

  /* ─────────── ACT III · horizontal work reel ─────────── */
  const track = $('#workTrack'), workIdx = $('#workIdx');
  const cards = $$('.work-card', track).length;
  function workDistance() { return Math.max(0, track.scrollWidth - innerWidth); }
  ScrollTrigger.create({
    trigger: '#act-work', start: 'top top', end: () => '+=' + (workDistance() + innerHeight * .4),
    pin: '#workPin', scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: self => {
      gsap.set(track, { x: -self.progress * workDistance() });
      workIdx.textContent = String(Math.min(cards, 1 + Math.floor(self.progress * cards))).padStart(2, '0');
    }
  });

  /* ─────────── ACT IV · Dubai sunset scrub ─────────── */
  const phaseEl = $('#dubaiPhase');
  const PHASES = [[0, 'GOLDEN HOUR'], [.32, 'SUNSET'], [.58, 'BLUE HOUR'], [.8, 'NIGHT']];
  cinemaPins.dubai = ScrollTrigger.create({
    trigger: '#act-dubai', start: 'top top', end: mobile ? '+=110%' : '+=170%',
    pin: '.act-dubai .cinema-stage', scrub: true, anticipatePin: 1,
    onToggle: self => letterbox(self.isActive),
    onUpdate: self => {
      const p = self.progress;
      if (scenes.dubai) scenes.dubai.setProgress(p);
      let label = PHASES[0][1];
      for (const [at, name] of PHASES) if (p >= at) label = name;
      if (phaseEl.textContent !== label) phaseEl.textContent = label;
      gsap.set('.dubai-content', { y: -p * 60 });
    }
  });

  /* ─────────── films marquee drift ─────────── */
  $$('.m-row').forEach(row => {
    const dir = parseFloat(row.dataset.speed) || 1;
    gsap.fromTo(row, { xPercent: dir > 0 ? 0 : -22 }, {
      xPercent: dir > 0 ? -22 : 0, ease: 'none',
      scrollTrigger: { trigger: '#act-films', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ─────────── ACT V · 3D frame tunnel ─────────── */
  const TUNNEL_IMGS = [
    ['assets/behance/tun-sharmiela.jpg', 'Sharmiela Mandre'],
    ['assets/behance/tun-olivia2.jpg', 'Olivia, morning'],
    ['assets/behance/tun-ashika.jpg', 'Ashika Ranganath'],
    ['assets/behance/tun-olivia.jpg', 'Sunday with Olivia'],
    ['assets/behance/tun-divya.jpg', 'Divya Pandey'],
    ['assets/behance/tun-sonika.jpg', 'Sonika Gowda'],
    ['assets/behance/tun-suman.jpg', 'Suman'],
    ['assets/behance/tun-ashika2.jpg', 'An evening with Ashika'],
    ['assets/behance/tun-divya2.jpg', 'Divya, again']
  ];
  const world = $('#tunnelWorld');
  const STEP = 640; // z-distance between frames
  const frames = TUNNEL_IMGS.map(([src, cap], i) => {
    const f = document.createElement('figure');
    f.className = 't-frame';
    const xo = [(-28), 24, -20, 30, -32, 22, -24, 28, 0][i % 9];
    const yo = [(-6), 8, 10, -10, 6, -8, 9, -5, 0][i % 9];
    f.dataset.z = -(i + 1) * STEP;
    f.dataset.x = xo; f.dataset.y = yo;
    f.innerHTML = '<img loading="lazy" src="' + src + '" alt="' + cap + '"/><figcaption>' + String(i + 1).padStart(2, '0') + ' · ' + cap + '</figcaption>';
    world.appendChild(f);
    return f;
  });
  const tunnelDepth = (frames.length + 1.4) * STEP;
  function placeTunnel(p) {
    const camZ = p * tunnelDepth;
    frames.forEach(f => {
      const z = parseFloat(f.dataset.z) + camZ;
      const op = z > 160 ? 0 : z < -STEP * 3.4 ? 0 : z > -120 ? gsap.utils.mapRange(160, -120, 0, 1, z) : 1;
      f.style.transform = 'translate(-50%,-50%) translate3d(' + f.dataset.x + 'vw,' + f.dataset.y + 'vh,' + z + 'px) rotateY(' + (f.dataset.x * -.25) + 'deg)';
      f.style.opacity = Math.max(0, Math.min(1, op));
    });
  }
  placeTunnel(0);
  ScrollTrigger.create({
    trigger: '#act-tunnel', start: 'top top', end: mobile ? '+=130%' : '+=200%',
    pin: '#tunnelPin', scrub: true, anticipatePin: 1,
    onToggle: self => letterbox(self.isActive),
    onUpdate: self => placeTunnel(self.progress)
  });

  /* ─────────── nav + progress + cursor ─────────── */
  const nav = $('#nav');
  ScrollTrigger.create({
    start: 80, end: 'max',
    onUpdate: () => nav.classList.add('scrolled'),
    onToggle: self => nav.classList.toggle('scrolled', self.isActive)
  });
  gsap.to('#progress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .3 }
  });

  const cursor = $('#cursor');
  if (matchMedia('(hover:hover)').matches) {
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }, tgt = { ...pos };
    addEventListener('mousemove', e => { tgt.x = e.clientX; tgt.y = e.clientY; });
    gsap.ticker.add(() => {
      pos.x += (tgt.x - pos.x) * .16; pos.y += (tgt.y - pos.y) * .16;
      cursor.style.transform = 'translate(' + (pos.x - 9) + 'px,' + (pos.y - 9) + 'px)';
    });
    $$('a,button,.work-card,.svc').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
    });
  }

  /* ─────────── video facades: load player on tap ─────────── */
  $$('.vfacade[data-embed]').forEach(f => {
    f.addEventListener('click', () => {
      if (f.classList.contains('on')) return;
      f.classList.add('on');
      const ifr = document.createElement('iframe');
      ifr.src = f.dataset.embed;
      ifr.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      ifr.allowFullscreen = true;
      f.appendChild(ifr);
      const p = f.querySelector('.vplay'); if (p) p.remove();
      const t = f.querySelector('.vtag'); if (t) t.remove();
    });
  });

  /* ─────────── booking → WhatsApp ─────────── */
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = id => ($('#' + id).value || '').trim();
    if (!v('f-name') || !v('f-phone') || !v('f-date')) {
      gsap.fromTo('#bookForm', { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' });
      return;
    }
    const msg =
      'Hi Yedukrishna! I’d like to book a shoot.\n' +
      '• Name: ' + v('f-name') + '\n' +
      '• Contact: ' + v('f-phone') + '\n' +
      '• Date: ' + v('f-date') + (v('f-time') ? ' at ' + v('f-time') : '') + '\n' +
      '• Type: ' + v('f-type') + '\n' +
      (v('f-msg') ? '• Project: ' + v('f-msg') + '\n' : '') +
      '— sent from the YKS Productions site';
    const num = $('#f-region').value;
    open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  /* refresh pins once everything (fonts/images) settles */
  addEventListener('load', () => {
    ScrollTrigger.refresh();
    // re-aim any #hash deep link — pin spacers shift anchors after load
    if (location.hash) {
      const target = $(location.hash);
      if (target) lenis.scrollTo(target, { immediate: true, offset: -80 });
    }
  });
})();
