/* ═══════════════════════════════════════════════════════════════
   YKS · fx.js — interaction layer (site-wide, no dependencies)
   1 · Swipe lightbox        4 · Magnetic buttons
   2 · Video scroll-previews 5 · Cursor image trail
   3 · Page transitions      6 · Before/after grade slider
   Every feature is opt-out-safe: reduced-motion and touch are respected,
   and nothing here is required for the page to work.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ─────────────────────────────────────────────────────────────
     STYLES — injected once, scoped to fx classes
     ───────────────────────────────────────────────────────────── */
  var css = ''
    /* lightbox */
    + '.fx-lb{position:fixed;inset:0;z-index:400;background:rgba(5,4,8,.96);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);'
    + 'display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .35s var(--fx-ease,cubic-bezier(.22,.61,.36,1)),visibility .35s}'
    + '.fx-lb.on{opacity:1;visibility:visible}'
    + '.fx-lb-img{max-width:92vw;max-height:86vh;object-fit:contain;border-radius:4px;box-shadow:0 30px 90px rgba(0,0,0,.7);'
    + 'transform:scale(.97);transition:transform .35s var(--fx-ease,cubic-bezier(.22,.61,.36,1)),opacity .2s;user-select:none;-webkit-user-drag:none}'
    + '.fx-lb.on .fx-lb-img{transform:scale(1)}'
    + '.fx-lb-x,.fx-lb-nav{position:absolute;background:rgba(244,237,226,.08);border:1px solid rgba(244,237,226,.18);color:#f4ede2;'
    + 'width:46px;height:46px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;'
    + 'transition:background .25s,border-color .25s;-webkit-tap-highlight-color:transparent}'
    + '.fx-lb-x:hover,.fx-lb-nav:hover{background:rgba(255,140,59,.9);border-color:transparent;color:#07060a}'
    + '.fx-lb-x{top:18px;right:18px}'
    + '.fx-lb-nav.prev{left:18px;top:50%;margin-top:-23px}.fx-lb-nav.next{right:18px;top:50%;margin-top:-23px}'
    + '.fx-lb-count{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);font-family:var(--font-m,var(--mono,monospace));'
    + 'font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:rgba(244,237,226,.55)}'
    + '@media(max-width:640px){.fx-lb-nav{display:none}.fx-lb-x{top:12px;right:12px;width:42px;height:42px}}'
    /* zoomable images get a hint cursor */
    + '.fx-zoom{cursor:zoom-in}'
    /* Page-transition veil. DEFAULT STATE IS INVISIBLE — the intro fade is a
       CSS animation, never a JS-held opacity. If scripts stall or rAF never
       fires (tab restored from background, prerender), the worst case is
       "no fade", never a stuck black screen over the site. */
    + '.fx-veil{position:fixed;inset:0;z-index:500;background:#07060a;pointer-events:none;opacity:0;transition:opacity .42s var(--fx-ease,cubic-bezier(.22,.61,.36,1))}'
    + '.fx-veil.intro{animation:fxIntro .5s cubic-bezier(.22,.61,.36,1) both}'
    + '@keyframes fxIntro{from{opacity:1}to{opacity:0}}'
    + '.fx-veil.out{animation:none;opacity:1}'
    /* cursor trail */
    + '.fx-trail{position:fixed;top:0;left:0;width:110px;height:140px;z-index:280;pointer-events:none;border-radius:4px;'
    + 'object-fit:cover;opacity:0;will-change:transform,opacity;box-shadow:0 18px 50px rgba(0,0,0,.5)}'
    /* magnetic */
    + '.fx-mag{will-change:transform}'
    /* before / after */
    + '.fx-ba{position:relative;overflow:hidden;border-radius:12px;user-select:none;touch-action:pan-y;cursor:ew-resize;'
    + 'box-shadow:0 30px 80px rgba(0,0,0,.5);border:1px solid rgba(244,237,226,.12)}'
    + '.fx-ba img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none}'
    + '.fx-ba .fx-ba-top{position:absolute;inset:0;overflow:hidden;width:50%}'
    + '.fx-ba .fx-ba-top img{position:absolute;top:0;left:0;height:100%;width:auto;max-width:none}'
    + '.fx-ba-handle{position:absolute;top:0;bottom:0;left:50%;width:2px;background:rgba(244,237,226,.9);transform:translateX(-1px);pointer-events:none}'
    + '.fx-ba-grip{position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;'
    + 'background:rgba(255,140,59,.95);display:flex;align-items:center;justify-content:center;color:#07060a;font-size:15px;'
    + 'box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:none}'
    + '.fx-ba-tag{position:absolute;bottom:14px;font-family:var(--font-m,var(--mono,monospace));font-size:9.5px;letter-spacing:.22em;'
    + 'text-transform:uppercase;color:#f4ede2;text-shadow:0 2px 10px rgba(0,0,0,.9);pointer-events:none}'
    + '.fx-ba-tag.l{left:16px}.fx-ba-tag.r{right:16px}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ─────────────────────────────────────────────────────────────
     1 · LIGHTBOX — click any gallery image, swipe/arrow through
     ───────────────────────────────────────────────────────────── */
  (function lightbox() {
    var SEL = [
      '.l-gallery img', '.l-hero-gallery img', '.l-feed img',
      '.wed-gallery img', '.ruk-grid img', '.klr-grid img',
      '.fashion-card img', '.work-card img', '.feat-photo img',
      '.mosaic img', '.grid-gallery img', '[data-zoom] img', 'img[data-zoom]'
    ].join(',');

    var imgs = $$(SEL).filter(function (im) {
      // skip tiny thumbs, logos and anything inside a link (link wins)
      return im.naturalWidth !== 0 || true;
    }).filter(function (im) {
      return !im.closest('a') && !im.closest('.fx-ba') && im.clientWidth > 60;
    });
    if (!imgs.length) return;

    imgs.forEach(function (im) { im.classList.add('fx-zoom'); });

    var lb = document.createElement('div');
    lb.className = 'fx-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<img class="fx-lb-img" alt="" />' +
      '<button class="fx-lb-x" aria-label="Close">✕</button>' +
      '<button class="fx-lb-nav prev" aria-label="Previous">‹</button>' +
      '<button class="fx-lb-nav next" aria-label="Next">›</button>' +
      '<div class="fx-lb-count"></div>';
    document.body.appendChild(lb);

    var big = lb.querySelector('.fx-lb-img');
    var count = lb.querySelector('.fx-lb-count');
    var i = 0, open = false;

    function show(n) {
      i = (n + imgs.length) % imgs.length;
      var src = imgs[i].dataset.full || imgs[i].currentSrc || imgs[i].src;
      big.style.opacity = '0';
      var pre = new Image();
      pre.onload = function () { big.src = src; big.alt = imgs[i].alt || ''; big.style.opacity = '1'; };
      pre.src = src;
      count.textContent = (i + 1) + ' / ' + imgs.length;
    }
    function openAt(n) {
      show(n); open = true; lb.classList.add('on');
      document.documentElement.style.overflow = 'hidden';
    }
    function close() {
      open = false; lb.classList.remove('on');
      document.documentElement.style.overflow = '';
    }

    imgs.forEach(function (im, n) {
      im.addEventListener('click', function (e) { e.preventDefault(); openAt(n); });
    });
    lb.querySelector('.fx-lb-x').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
    lb.querySelector('.next').addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(i + 1);
      else if (e.key === 'ArrowLeft') show(i - 1);
    });
    /* swipe */
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  })();

  /* ─────────────────────────────────────────────────────────────
     2 · VIDEO SCROLL-PREVIEWS — muted clips play as they enter view
     ───────────────────────────────────────────────────────────── */
  (function videoPreviews() {
    if (!('IntersectionObserver' in window)) return;
    var vids = $$('video').filter(function (v) { return !v.dataset.fxSkip; });
    if (!vids.length) return;

    vids.forEach(function (v) { v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); });

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.3 });
    vids.forEach(function (v) { io.observe(v); });

    /* tap a preview to unmute — desktop hover does the same */
    vids.forEach(function (v) {
      v.addEventListener('click', function () { v.muted = !v.muted; });
    });
  })();

  /* ─────────────────────────────────────────────────────────────
     3 · PAGE TRANSITIONS — cinematic fade between internal pages
     ───────────────────────────────────────────────────────────── */
  (function transitions() {
    if (REDUCED) return;
    var veil = document.createElement('div');
    veil.className = 'fx-veil intro';
    document.body.appendChild(veil);

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href[0] === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.host && a.host !== location.host) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      veil.classList.remove('intro');
      veil.classList.add('out');
      var url = a.href;
      setTimeout(function () { location.href = url; }, 380);
      /* if navigation is blocked or slow, never sit behind a black veil */
      setTimeout(function () { veil.classList.remove('out'); }, 2500);
    });

    /* coming back via the bfcache must not leave the veil down */
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) veil.classList.remove('out');
    });
  })();

  /* ─────────────────────────────────────────────────────────────
     4 · MAGNETIC BUTTONS — desktop pointer only
     ───────────────────────────────────────────────────────────── */
  (function magnetic() {
    if (!FINE || REDUCED) return;
    var els = $$('.btn, .nav-cta, .l-form button, .fx-lb-x, .soc-link, .foot-links a');
    els.forEach(function (el) {
      el.classList.add('fx-mag');
      var raf = null, tx = 0, ty = 0;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
        if (!raf) raf = requestAnimationFrame(function () {
          el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
          raf = null;
        });
      });
      el.addEventListener('mouseleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transition = 'transform .45s cubic-bezier(.22,1.4,.36,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 460);
      });
    });
  })();

  /* ─────────────────────────────────────────────────────────────
     5 · CURSOR IMAGE TRAIL — desktop, over designated sections only
     ───────────────────────────────────────────────────────────── */
  (function trail() {
    if (!FINE || REDUCED) return;
    var zone = document.querySelector('[data-fx-trail]');
    if (!zone) return;

    var pool = (zone.dataset.fxTrail || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (pool.length < 2) {
      pool = $$('img', zone).slice(0, 8).map(function (im) { return im.currentSrc || im.src; });
    }
    if (pool.length < 2) return;

    var nodes = pool.map(function (src) {
      var im = document.createElement('img');
      im.className = 'fx-trail'; im.src = src; im.alt = '';
      document.body.appendChild(im);
      return im;
    });

    var idx = 0, lastX = 0, lastY = 0, dist = 0;
    zone.addEventListener('mousemove', function (e) {
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      dist += Math.sqrt(dx * dx + dy * dy);
      lastX = e.clientX; lastY = e.clientY;
      if (dist < 110) return;
      dist = 0;
      var im = nodes[idx % nodes.length]; idx++;
      im.style.transition = 'none';
      im.style.transform = 'translate(' + (e.clientX - 55) + 'px,' + (e.clientY - 70) + 'px) scale(.82)';
      im.style.opacity = '0';
      requestAnimationFrame(function () {
        im.style.transition = 'transform .95s cubic-bezier(.22,.61,.36,1),opacity .95s';
        im.style.opacity = '.85';
        im.style.transform = 'translate(' + (e.clientX - 55) + 'px,' + (e.clientY - 70 + 26) + 'px) scale(1)';
        setTimeout(function () { im.style.opacity = '0'; }, 340);
      });
    });
  })();

  /* ─────────────────────────────────────────────────────────────
     6 · BEFORE / AFTER — drag to compare, touch + mouse + keyboard
     ───────────────────────────────────────────────────────────── */
  (function beforeAfter() {
    $$('.fx-ba').forEach(function (box) {
      var top = box.querySelector('.fx-ba-top');
      var topImg = top && top.querySelector('img');
      var base = box.querySelector('img:not(.fx-ba-top img)');
      if (!top || !topImg || !base) return;

      function sizeTop() { topImg.style.width = box.clientWidth + 'px'; }
      sizeTop();
      window.addEventListener('resize', sizeTop);
      if (base.complete) sizeTop(); else base.addEventListener('load', sizeTop);

      var handle = box.querySelector('.fx-ba-handle');
      function set(pct) {
        pct = Math.max(0, Math.min(100, pct));
        top.style.width = pct + '%';
        if (handle) handle.style.left = pct + '%';
        box.setAttribute('aria-valuenow', Math.round(pct));
      }
      function fromEvent(e) {
        var r = box.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        set((x / r.width) * 100);
      }
      var dragging = false;
      box.addEventListener('mousedown', function (e) { dragging = true; fromEvent(e); e.preventDefault(); });
      window.addEventListener('mousemove', function (e) { if (dragging) fromEvent(e); });
      window.addEventListener('mouseup', function () { dragging = false; });
      box.addEventListener('touchstart', function (e) { fromEvent(e); }, { passive: true });
      box.addEventListener('touchmove', function (e) { fromEvent(e); }, { passive: true });
      /* hover-scrub on desktop feels magic; drag still works */
      box.addEventListener('mousemove', function (e) { if (!dragging) fromEvent(e); });

      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'slider');
      box.setAttribute('aria-label', 'Compare before and after');
      box.addEventListener('keydown', function (e) {
        var cur = parseFloat(top.style.width) || 50;
        if (e.key === 'ArrowLeft') { set(cur - 4); e.preventDefault(); }
        if (e.key === 'ArrowRight') { set(cur + 4); e.preventDefault(); }
      });
      set(50);
    });
  })();

})();
