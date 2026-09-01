/* YKS talent profile — the things a client actually does on this page:
   take the face away as a comp card, pass it to someone, and book it.
   Talent are referenced by roster CODE, never by name: a comp card gets forwarded by
   email and names stay on the roster where a human has to be looking at the site. */
(function () {
  var hero = document.querySelector('.pf-hero'); if (!hero) return;
  var nameEl = document.querySelector('.pf-name');
  var CODE = ((nameEl && nameEl.dataset.tname) || '').toUpperCase();
  var WA = (function () {
    var a = document.querySelector('a[href*="wa.me/"]');
    var m = a && a.getAttribute('href').match(/wa\.me\/(\d+)/);
    return m ? m[1] : '919746679720';
  })();
  function esc(s) { return String(s == null ? '' : s); }
  function meta() {
    var kick = document.querySelector('.tal-kicker');
    var parts = (kick ? kick.textContent : '').split('·');
    return { cat: (parts[0] || 'Talent').trim(), where: (parts.slice(1).join('·') || '').trim() };
  }
  function specs() {
    return Array.prototype.map.call(document.querySelectorAll('.pf-row'), function (r) {
      var dt = r.querySelector('dt'), dd = r.querySelector('dd');
      return [dt ? dt.textContent.trim() : '', dd ? dd.textContent.trim() : ''];
    }).filter(function (p) { return p[0] && p[1]; });
  }
  function shots() {
    var out = [];
    var h = document.querySelector('.pf-hero-img img');
    if (h) out.push(h.getAttribute('src'));
    Array.prototype.forEach.call(document.querySelectorAll('.pf-plate img'), function (i) {
      var s = i.getAttribute('src'); if (s && out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }

  /* ── 1. Sticky book bar — the CTA scrolls away on a long profile ── */
  (function stickyBar() {
    var cta = document.querySelector('.pf-cta a[href*="wa.me/"]'); if (!cta) return;
    var bar = document.createElement('div');
    bar.className = 'pf-stick';
    bar.innerHTML = '<span class="pf-stick-who"><b>' + esc(CODE) + '</b><i>' + esc(meta().cat + (meta().where ? ' · ' + meta().where : '')) + '</i></span>' +
      '<span class="pf-stick-acts">' +
        '<button type="button" class="pf-stick-btn" data-act="card">↓ Comp card</button>' +
        '<button type="button" class="pf-stick-btn" data-act="share">Share</button>' +
        /* Points at the booking desk rather than straight out to WhatsApp.
           The desk collects dates and usage first, so what lands on my phone
           is a brief I can quote instead of "is she free?". It falls back to
           the WhatsApp link if the desk is not on the page. */
        '<a class="pf-stick-btn pf-stick-go" href="#book">Book this face →</a>' +
      '</span>';
    document.body.appendChild(bar);

    var go = bar.querySelector('.pf-stick-go');
    go.addEventListener('click', function (e) {
      var desk = document.getElementById('book');
      if (!desk) {                       // no desk on this page — use WhatsApp
        go.href = cta.getAttribute('href');
        go.target = '_blank';
        return;
      }
      e.preventDefault();
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      desk.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      var f = desk.querySelector('.bk-from');
      if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (err) {} }, reduce ? 0 : 600);
    });
    // a passive scroll check rather than IntersectionObserver: it only reads scrollY against a
    // cached offset, so there is no layout thrash, and it can't be missed if IO never fires.
    // Time-throttled, not requestAnimationFrame: rAF is paused whenever the tab is hidden or
    // backgrounded, and the bar would then never appear. This only reads scrollY, so it is cheap.
    var ctaBottom = 0, last = 0;
    function measure() { var r = cta.getBoundingClientRect(); ctaBottom = r.bottom + window.scrollY; }
    function update() { bar.classList.toggle('on', window.scrollY > ctaBottom - 60); }
    measure(); update();
    window.addEventListener('scroll', function () {
      var now = Date.now(); if (now - last < 80) return; last = now; update();
    }, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'share') doShare(b);
      if (b.dataset.act === 'card') doCard(b);
    });
  })();

  /* ── 2. Share — how casting actually spreads: a face pasted into a group chat ── */
  function doShare(btn) {
    var url = location.href, txt = CODE + ' — ' + meta().cat + (meta().where ? ', ' + meta().where : '') + ' · via YKS Productions';
    if (navigator.share) { navigator.share({ title: 'YKS Talents — ' + CODE, text: txt, url: url }).catch(function () {}); return; }
    var done = function () { var t = btn.textContent; btn.textContent = 'Link copied ✓'; setTimeout(function () { btn.textContent = t; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else window.prompt('Copy this link:', url);
  }

  /* ── 3. Comp card — the agency two-pager, so a client can forward ONE face ── */
  function ensureJsPDF() {
    return new Promise(function (res, rej) {
      if (window.jspdf && window.jspdf.jsPDF) return res(window.jspdf.jsPDF);
      var s = document.createElement('script'); s.src = '/js/vendor/jspdf.umd.min.js';
      s.onload = function () { (window.jspdf && window.jspdf.jsPDF) ? res(window.jspdf.jsPDF) : rej(new Error('lib')); };
      s.onerror = function () { rej(new Error('lib')); };
      document.head.appendChild(s);
    });
  }
  function loadJpeg(src, maxW) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () {
        var sc = Math.min(1, maxW / im.naturalWidth);
        var c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res({ data: c.toDataURL('image/jpeg', 0.86), w: c.width, h: c.height });
      };
      im.onerror = rej; im.src = src;
    });
  }
  function doCard(btn) {
    var orig = btn.textContent; btn.disabled = true; btn.textContent = 'Building…';
    var srcs = shots().slice(0, 5);
    ensureJsPDF().then(function (JsPDF) {
      return Promise.all(srcs.map(function (s) { return loadJpeg(s, 1100).catch(function () { return null; }); }))
        .then(function (imgs) { return { JsPDF: JsPDF, imgs: imgs.filter(Boolean) }; });
    }).then(function (r) {
      buildCompCard(r.JsPDF, r.imgs);
      btn.disabled = false; btn.textContent = 'Saved ✓';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    }).catch(function () {
      btn.disabled = false; btn.textContent = 'Try again';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    });
  }
  window.buildYKSCompCard = buildCompCard;   // exposed so the card can be verified outside the browser
  function buildCompCard(JsPDF, imgs) {
    var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    var W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
    var NIGHT = [12, 10, 16], PAPER = [255, 255, 255], INK = [20, 20, 22], INKSUB = [140, 138, 134],
        LIGHT = [244, 240, 232], MUTE = [196, 190, 180], GOLD = [184, 145, 47];
    var HF = 'helvetica', LG = 'times', m = meta();
    function ct(c) { doc.setTextColor.apply(doc, c); }
    function bg(c) { doc.setFillColor.apply(doc, c); doc.rect(0, 0, W, H, 'F'); }
    function tk(t, x, y, sz, c, o) {
      o = o || {}; doc.setFont(HF, o.bold ? 'bold' : 'normal'); doc.setFontSize(sz); ct(c);
      var s = o.upper === false ? String(t) : String(t).toUpperCase(), ls = o.ls == null ? 1.3 : o.ls;
      if (o.align === 'right') x -= doc.getTextWidth(s) + Math.max(0, s.length - 1) * ls;
      doc.text(s, x, y, { charSpace: ls });
    }
    function hair(x1, y, x2, c, w) { doc.setDrawColor.apply(doc, c); doc.setLineWidth(w || 0.8); doc.line(x1, y, x2, y); }
    function clipDraw(im, x, y, bw, bh) {
      var s = Math.max(bw / im.w, bh / im.h), w = im.w * s, h = im.h * s;
      doc.saveGraphicsState(); doc.rect(x, y, bw, bh, null); doc.clip(); doc.discardPath();
      doc.addImage(im.data, 'JPEG', x + (bw - w) / 2, y + (bh - h) / 2, w, h);
      doc.restoreGraphicsState();
    }
    function logoBox(x, y, w, c) {
      var h = w * 0.6, cx = x + w / 2;
      doc.setDrawColor.apply(doc, c); doc.setLineWidth(0.9); doc.rect(x, y, w, h);
      doc.setFont(LG, 'normal'); ct(c); doc.setFontSize(w * 0.285);
      doc.text('YKS', cx, y + h * 0.5, { align: 'center', charSpace: 1 });
      var py = y + h * 0.8, word = 'PRODUCTIONS', ws = 1.3;
      doc.setFont(HF, 'normal'); doc.setFontSize(w * 0.064);
      var tw = doc.getTextWidth(word) + (word.length - 1) * ws;
      doc.text(word, cx, py, { align: 'center', charSpace: ws });
      doc.setLineWidth(0.5); var g = w * 0.05, d = w * 0.085;
      doc.line(cx - tw / 2 - g - d, py - 2.5, cx - tw / 2 - g, py - 2.5);
      doc.line(cx + tw / 2 + g, py - 2.5, cx + tw / 2 + g + d, py - 2.5);
    }
    var disc = (document.querySelector('.pf-disc') || {}).textContent || '';

    /* FRONT — one face, the mark, the code */
    bg(NIGHT);
    if (imgs[0]) clipDraw(imgs[0], 0, 0, W, H - 170);
    doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.setFillColor(8, 6, 12); doc.rect(0, 0, W, 150, 'F'); doc.restoreGraphicsState();
    logoBox(M, 44, 118, LIGHT);
    hair(M, H - 170, W - M, GOLD, 0.9);
    tk(disc, M, H - 130, 8.5, GOLD, { bold: true, ls: 2 });
    doc.setFont(HF, 'bold'); doc.setFontSize(46); ct(LIGHT); doc.text(CODE, M, H - 78);
    tk(m.cat + (m.where ? '  ·  ' + m.where : ''), M, H - 52, 9, MUTE, { ls: 2 });
    tk('COMP CARD', W - M, H - 130, 8.5, MUTE, { ls: 2, align: 'right' });
    tk('BOOKED THROUGH YKS', W - M, H - 52, 8.5, GOLD, { ls: 2, align: 'right' });

    /* BACK — range + the numbers a casting director scans */
    doc.addPage(); bg(PAPER);
    tk('COMP CARD', M, 60, 8, INK, { bold: true, ls: 1.5 });
    tk(CODE, W - M, 60, 8, INK, { bold: true, ls: 1.5, align: 'right' });
    hair(M, 72, W - M, INK, 1.1);
    // size the grid to the space ABOVE the measurements band, or the photos run over it
    var rest = imgs.slice(1, 5), g2 = 16, gy = 96, sy = H - 214;
    var rows = Math.max(1, Math.ceil(rest.length / 2)), cols = Math.min(2, rest.length) || 1;
    var ch = (sy - 26 - gy - (rows - 1) * g2) / rows, cw = ch * 0.8;
    var gw = cols * cw + (cols - 1) * g2, gx = (W - gw) / 2;
    rest.forEach(function (im, i) { clipDraw(im, gx + (i % 2) * (cw + g2), gy + Math.floor(i / 2) * (ch + g2), cw, ch); });
    tk('MEASUREMENTS', M, sy, 9, INKSUB, { bold: true, ls: 2 });
    hair(M, sy + 9, W - M, INK, 1.1);
    var st = specs(), half = Math.ceil(st.length / 2), colW = CW / 2 - 14;
    st.forEach(function (p, i) {
      var col = i < half ? 0 : 1, row = i < half ? i : i - half;
      var x = M + col * (CW / 2 + 14), y = sy + 30 + row * 17;
      tk(p[0], x, y, 8, INKSUB, { ls: 1.2 });
      doc.setFont(HF, 'bold'); doc.setFontSize(9); ct(INK); doc.text(p[1], x + colW, y, { align: 'right' });
    });
    tk('TO BOOK — QUOTE ' + CODE, M, H - 84, 9, GOLD, { bold: true, ls: 1.6 });
    logoBox(W - M - 72, H - 106, 72, INK);
    hair(M, H - 56, W - M, INK, 1.1);
    tk('+91 ' + WA.slice(2, 7) + ' ' + WA.slice(7), M, H - 40, 7.5, INKSUB, { ls: 1.1 });
    tk('YKSPRODUCTIONS893@GMAIL.COM', W - M, H - 40, 7.5, INKSUB, { ls: 1.1, align: 'right' });

    doc.save('YKS-' + CODE + '-comp-card.pdf');
  }
})();
