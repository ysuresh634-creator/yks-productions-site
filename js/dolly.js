/* ═══════════════════════════════════════════════════════════════
   Dolly gallery — scroll pushes the camera forward through floating
   frames; the visitor performs the camera move themselves.

   Markup contract:
     <div class="dolly-wrap" data-dolly>
       <div class="dolly-view">
         <div class="dolly-scene">
           <figure class="dolly-plane"><img …><figcaption>…</figcaption></figure>
           … one figure per frame …
         </div>
         <p class="dolly-hint">…</p>
       </div>
     </div>

   No pinning library and no scroll hijack — a sticky viewport and one
   transform, so it cannot desync the way the old pinned homepage did.
   Under reduced-motion the same figures lay out as a flat grid.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var wrap = document.querySelector('[data-dolly]');
  if (!wrap) return;

  var scene = wrap.querySelector('.dolly-scene');
  var planes = [].slice.call(scene.querySelectorAll('.dolly-plane'));
  if (!planes.length) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wrap.classList.add('dolly-flat');
    return;
  }

  var SPACING = 600, START = -420;
  planes.forEach(function (el, i) {
    var side = (i % 2 ? 1 : -1) * (24 + (i % 3) * 7);
    var z = START - i * SPACING;
    el.dataset.z = z;
    el.style.transform = 'translate(-50%,-50%) translate3d(' + side + '%,'
                       + ((i % 3 - 1) * 11) + '%,' + z + 'px)';
  });

  var travel = -START + (planes.length - 1) * SPACING;
  var ticking = false;

  function dolly() {
    ticking = false;
    var r = wrap.getBoundingClientRect();
    var span = r.height - innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    var camZ = p * travel;
    scene.style.transform = 'translateZ(' + camZ + 'px)';
    for (var i = 0; i < planes.length; i++) {
      var rel = parseFloat(planes[i].dataset.z) + camZ;   // >0 = behind the camera
      planes[i].style.opacity =
        rel > 40 ? 0 : rel > -140 ? ((140 + Math.min(rel, 0)) / 140) * .4 + .6 : 1;
    }
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(dolly); }
  }, { passive: true });
  addEventListener('resize', dolly, { passive: true });
  dolly();
})();
