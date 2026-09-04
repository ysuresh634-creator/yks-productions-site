/* ═══════════════════════════════════════════════════════════════
   APPLY — one thing at a time

   The application asks for forty fields. Every one of them earns its
   place, but presented as a single five-thousand-pixel column they
   read as a wall, and a wall is what people bounce off. Nobody
   abandons a form because of the work; they abandon it because of
   how much work it *looks* like from the top.

   So this splits the same fields into six short screens with the end
   visible from the start. Nothing is removed, nothing is renamed, no
   field changes its name or id — talent-apply.js keeps every
   reference it already holds. Without JS the page stays exactly as
   it was, all blocks open.

   The order is deliberate:
     1 photos   — no typing at all, and they already have these
     2 basics   — the five required fields, once they're already in
     3 about    — the writing, now that quitting would cost something
     4 stats    — optional, and the paste box does it in one go
     5 extras   — video and an existing portfolio, if they have them
     6 private  — the long tail, clearly marked optional
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('talForm');
  if (!form) return;

  var blocks = [].slice.call(form.children).filter(function (el) {
    return el.classList && el.classList.contains('ap-block');
  });
  if (blocks.length < 5) return;               // markup moved on — leave it alone

  /* title of a block, read from its own heading so the copy stays in the HTML */
  function titleOf(b) {
    var h = b.querySelector('.ap-step');
    if (!h) return '';
    var c = h.cloneNode(true), opt = c.querySelector('.ap-opt');
    if (opt) opt.remove();
    return c.textContent.trim();
  }
  function isOptional(b) { return !!b.querySelector('.ap-step .ap-opt'); }

  /* Panels, by the block order the HTML happens to be in. Each entry is the
     list of blocks that share one screen, plus roughly how long it takes —
     the estimate is what makes the first screen feel finite. */
  var byTitle = {};
  blocks.forEach(function (b) { byTitle[titleOf(b).toLowerCase()] = b; });
  var pick = function () {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      var m = null;
      for (var k in byTitle) {
        if (k.indexOf(arguments[i]) === 0) { m = byTitle[k]; delete byTitle[k]; break; }
      }
      if (m) out.push(m);
    }
    return out;
  };

  var PANELS = [
    { blocks: pick('your photos'),        mins: 1, lead: 'Start with the pictures you already have on your phone.' },
    { blocks: pick('the basics'),         mins: 1, lead: 'The only part I actually need. Five fields.' },
    { blocks: pick('about you'),          mins: 1, lead: 'A few lines in your own words — or let the writer draft it for you.' },
    { blocks: pick('your stats'),         mins: 0, lead: 'Paste a comp card or an old message and it sorts itself.' },
    { blocks: pick('your videos', 'already have'), mins: 0, lead: 'Only if you have them. Skip this if you don’t.' },
    { blocks: pick('more about you'),     mins: 0, lead: 'Private to me, and every field here is optional.' }
  ].filter(function (p) { return p.blocks.length; });

  // anything the mapping missed still has to render — append it rather than
  // silently dropping a block someone adds to the HTML later
  var placed = PANELS.reduce(function (a, p) { return a.concat(p.blocks); }, []);
  var orphans = blocks.filter(function (b) { return placed.indexOf(b) < 0; });
  if (orphans.length) PANELS.push({ blocks: orphans, mins: 0, lead: '' });
  if (PANELS.length < 3) return;

  var N = PANELS.length;

  /* ── chrome ──────────────────────────────────────────────── */
  var bar = document.createElement('div');
  bar.className = 'apw-bar';
  bar.innerHTML =
    '<div class="apw-bar-top">' +
      '<span class="apw-count">Step <b class="apw-i">1</b> of ' + N + '</span>' +
      '<span class="apw-left"></span>' +
    '</div>' +
    '<div class="apw-track"><span class="apw-fill"></span></div>' +
    '<div class="apw-dots" role="tablist" aria-label="Application steps"></div>';
  form.insertBefore(bar, form.firstChild);

  var elI    = bar.querySelector('.apw-i'),
      elLeft = bar.querySelector('.apw-left'),
      elFill = bar.querySelector('.apw-fill'),
      elDots = bar.querySelector('.apw-dots');

  var panelEls = PANELS.map(function (p, i) {
    var wrap = document.createElement('div');
    wrap.className = 'apw-panel';
    wrap.setAttribute('role', 'tabpanel');
    wrap.id = 'apw-panel-' + i;

    if (p.lead) {
      var lead = document.createElement('p');
      lead.className = 'apw-lead';
      lead.textContent = p.lead;
      wrap.appendChild(lead);
    }
    p.blocks.forEach(function (b) { wrap.appendChild(b); });

    var nav = document.createElement('div');
    nav.className = 'apw-nav';
    var optional = p.blocks.every(isOptional);
    nav.innerHTML =
      (i > 0 ? '<button type="button" class="apw-back">← Back</button>' : '<span></span>') +
      '<div class="apw-fwd">' +
        (optional && i < N - 1 ? '<button type="button" class="apw-skip">Skip this</button>' : '') +
        '<button type="button" class="apw-next">' +
          (i === N - 1 ? 'Done — take me to my portfolio ↓' : 'Continue →') +
        '</button>' +
      '</div>';
    wrap.appendChild(nav);
    form.appendChild(wrap);

    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'apw-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-controls', wrap.id);
    dot.title = titleOf(p.blocks[0]) || ('Step ' + (i + 1));
    dot.innerHTML = '<span>' + dot.title + '</span>';
    dot.addEventListener('click', function () { go(i); });
    elDots.appendChild(dot);

    return wrap;
  });

  /* The site nav is fixed at z-index 100, so a sticky bar at top:0 slides
     underneath it. Measure the nav rather than hard-coding a height — it
     differs between the mobile and desktop layouts. */
  /* The nav is fixed and *animates* its height once the page scrolls, so a
     sticky bar at top:0 slides under it and a height sampled at load — or
     mid-transition — leaves a sliver of scrolling text showing above the bar.
     ResizeObserver fires when the height actually settles, which a scroll
     listener does not. */
  var nav = document.querySelector('.l-nav'), seatH = -1;
  function seatBar() {
    var h = nav ? Math.round(nav.getBoundingClientRect().height) : 64;
    if (h !== seatH) { seatH = h; form.style.setProperty('--apw-top', h + 'px'); }
    return h;
  }
  seatBar();
  if (nav && window.ResizeObserver) {
    new ResizeObserver(seatBar).observe(nav);
  } else {
    window.addEventListener('resize', seatBar, { passive: true });
    window.addEventListener('scroll', seatBar, { passive: true });
  }

  form.classList.add('apw-on');

  /* ── state ───────────────────────────────────────────────── */
  var at = 0, seen = 0;

  function minsLeft(from) {
    var m = 0;
    for (var i = from; i < N; i++) m += PANELS[i].mins;
    if (m <= 0) return 'Nearly there';
    return 'About ' + m + ' min' + (m > 1 ? 's' : '') + ' left';
  }

  function go(i, quiet) {
    at = Math.max(0, Math.min(N - 1, i));
    seen = Math.max(seen, at);
    panelEls.forEach(function (el, k) { el.classList.toggle('is-on', k === at); });
    [].forEach.call(elDots.children, function (d, k) {
      d.classList.toggle('is-on', k === at);
      d.classList.toggle('is-done', k < seen);
      d.setAttribute('aria-selected', k === at ? 'true' : 'false');
    });
    elI.textContent = String(at + 1);
    elLeft.textContent = minsLeft(at);
    // the bar never starts empty — a form that shows 0% done reads as untouched
    elFill.style.width = (8 + (at / (N - 1)) * 92) + '%';

    if (!quiet) {
      var top = bar.getBoundingClientRect().top + window.scrollY - (seatBar() + 14);
      window.scrollTo({ top: top, behavior: reduced() ? 'auto' : 'smooth' });
      var first = panelEls[at].querySelector('input:not([type=file]),select,textarea');
      if (first && window.innerWidth > 820) { try { first.focus({ preventScroll: true }); } catch (e) {} }
    }
  }
  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  form.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('.apw-next') || t.closest('.apw-skip')) {
      e.preventDefault();
      if (at === N - 1) {
        var studio = document.querySelector('.ap-studio') || document.querySelector('.ap-tail');
        if (studio) studio.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      go(at + 1);
    } else if (t.closest('.apw-back')) {
      e.preventDefault();
      go(at - 1);
    }
  });

  /* Enter inside a single-line field advances instead of submitting from
     step two — submitting half a form is the one thing worse than a wall. */
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var t = e.target;
    if (!t.matches || !t.matches('input:not([type=file]):not([type=checkbox])')) return;
    if (at >= N - 1) return;
    e.preventDefault();
    go(at + 1);
  });

  /* ── photographs are the application ────────────────────────
     They live in a JS array rather than a form control, so checkValidity()
     never sees them and an application could be sent with none at all — which
     is most of what arrives from someone not really applying. Three is the
     floor: the page asks for six to ten, and the three a casting director
     wants first are a headshot, a full-length and digitals. */
  var MIN_PHOTOS = 3;
  function photoCount() {
    return document.querySelectorAll('#apThumbs .ap-thumb').length;
  }
  function photoNotice(n) {
    var host = document.getElementById('apThumbs');
    if (!host) return;
    var el = document.getElementById('apwPhotoWarn');
    if (!el) {
      el = document.createElement('p');
      el.id = 'apwPhotoWarn';
      el.className = 'apw-warn';
      el.setAttribute('role', 'alert');
      host.parentNode.insertBefore(el, host.nextSibling);
    }
    el.textContent = n === 0
      ? 'An application needs photographs — add at least ' + MIN_PHOTOS + ' before sending.'
      : 'That is ' + n + '. Add ' + (MIN_PHOTOS - n) + ' more — a headshot, a full-length and a set of digitals is the minimum anyone can cast from.';
    el.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    if (photoCount() < MIN_PHOTOS) {
      e.preventDefault();
      e.stopImmediatePropagation();          // do not let the sender run
      photoNotice(photoCount());
      go(0);                                  // the photos step
      var w = document.getElementById('apwPhotoWarn');
      if (w) w.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    var w = document.getElementById('apwPhotoWarn');
    if (w) w.hidden = true;
  }, true);

  /* A required field sitting in a hidden panel cannot be focused, so the
     browser refuses to report it and the submit dies silently. Capture the
     event before talent-apply.js sees it and surface the panel first. */
  form.addEventListener('submit', function () {
    if (form.checkValidity()) return;
    for (var i = 0; i < N; i++) {
      if (panelEls[i].querySelector(':invalid')) {
        if (i !== at) go(i);
        break;
      }
    }
  }, true);

  go(0, true);
})();

/* "Not sure this call is for you?" — the honest answer lives in the FAQ
   rather than on a sign over the door. Anyone who wonders clicks and is told;
   nobody merely browsing gets a billboard about who is excluded. Someone
   messaged to ask exactly this, so the question needed an answer on the page
   rather than in his inbox. */
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href="#faq-who"]') : null;
  if (!a) return;
  var d = document.getElementById('faq-who');
  if (!d) return;
  e.preventDefault();
  d.open = true;
  d.scrollIntoView({ behavior: 'smooth', block: 'center' });
  var sum = d.querySelector('summary');
  if (sum) sum.focus({ preventScroll: true });
});
