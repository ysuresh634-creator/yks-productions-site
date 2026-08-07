/* ═══════════════════════════════════════════════════════════════
   Bokeh depth field — the photographic signature, made ambient.
   Out-of-focus highlights drift in three parallax layers behind any
   section marked data-bokeh; the closest layer answers the pointer
   most, the way real bokeh parallaxes when a lens moves.

   Deliberately cheap: one 2D canvas per section, pixel ratio capped,
   paused off-screen via IntersectionObserver, skipped entirely under
   reduced-motion. No document.hidden check — browsers already stop
   rAF in hidden tabs, and some embedded webviews lie about it.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var hosts = document.querySelectorAll('[data-bokeh]');
  if (!hosts.length) return;

  var COLORS = ['255,140,59', '255,201,163', '123,47,247', '255,47,135'];
  var DPR = Math.min(devicePixelRatio || 1, 1.5);

  hosts.forEach(function (host) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    var cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    host.insertBefore(canvas, host.firstChild);
    // content stays above the field
    for (var i = 0; i < host.children.length; i++) {
      var kid = host.children[i];
      if (kid === canvas) continue;
      var kcs = getComputedStyle(kid);
      if (kcs.position === 'static') kid.style.position = 'relative';
    }

    var ctx = canvas.getContext('2d');
    var W, H;
    function size() {
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    addEventListener('resize', size, { passive: true });

    // density scales with area so a tall hero and a short band feel alike
    var n = Math.round(Math.min(70, Math.max(28, (W * H) / 16000)));
    var discs = [];
    for (var j = 0; j < n; j++) {
      var layer = j % 3;
      discs.push({
        x: Math.random(), y: Math.random(),
        r: 5 + layer * 8 + Math.random() * 13,
        c: COLORS[j % COLORS.length],
        a: .04 + layer * .045 + Math.random() * .05,
        sp: .5 + Math.random(),
        ph: Math.random() * 6.28,
        depth: (layer + 1) / 3
      });
    }

    var mx = .5, my = .5, tx = .5, ty = .5, running = false;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
    }, { passive: true });

    new IntersectionObserver(function (en) {
      var was = running;
      running = en[0].isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }, { rootMargin: '60px' }).observe(host);

    function draw(t) {
      if (!running) return;
      requestAnimationFrame(draw);
      mx += (tx - mx) * .04; my += (ty - my) * .04;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < discs.length; i++) {
        var d = discs[i];
        var px = (d.x + Math.sin(t * .00006 * d.sp + d.ph) * .025) * W
               + (mx - .5) * 64 * d.depth;
        var py = (d.y + Math.cos(t * .00005 * d.sp + d.ph * 2) * .03) * H
               + (my - .5) * 42 * d.depth;
        var g = ctx.createRadialGradient(px, py, 0, px, py, d.r);
        g.addColorStop(0, 'rgba(' + d.c + ',' + d.a + ')');
        g.addColorStop(1, 'rgba(' + d.c + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, d.r, 0, 6.2832); ctx.fill();
      }
    }
  });
})();
