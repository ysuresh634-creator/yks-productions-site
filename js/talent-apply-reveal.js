/* ═══════════════════════════════════════════════════════════════
   APPLY — the darkroom reveal

   Everything on this page arrives already finished, which on a dark
   ground makes a long scroll feel flat: blocks appear, and nothing
   about the motion belongs to the subject.

   So sections come up the way a print comes up in developer —
   dark and soft first, then contrast, then resolved. It is the one
   piece of motion on the page that is actually about photography
   rather than about being animated.

   Progressive enhancement: the class that hides anything is only
   ever added by this script, and only when IntersectionObserver
   exists, so no-JS and old browsers get the finished page directly.
   Anyone who has asked for reduced motion gets it too.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var main = document.querySelector('main');
  if (!main) return;

  /* Section-level, not element-level. Developing every heading and every
     paragraph separately reads as a slideshow; developing the block reads
     as the page arriving. */
  var targets = [].slice.call(main.querySelectorAll(
    '.ap-books-head, .ap-books-row, .ap-hero3-art, ' +
    '#is-this-real .l-head, #is-this-real .l-svcside, ' +
    '.ap-flow, .ap-studio, .ap-shoot-grid, .l-faq, .ap-download'
  ));
  if (!targets.length) return;

  targets.forEach(function (el, i) {
    el.classList.add('apr');
    // a short stagger inside a row, capped so nothing waits noticeably
    el.style.setProperty('--apr-d', Math.min(i % 3, 2) * 90 + 'ms');
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-lit');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  targets.forEach(function (el) { io.observe(el); });
})();
