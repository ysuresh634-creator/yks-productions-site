/* YKS Talents — free comp card maker.
   Runs entirely in the browser: photos are read from the device with
   URL.createObjectURL, drawn to <canvas>, and exported as PNG / PDF from
   memory. Nothing is uploaded, posted or stored anywhere — this file makes
   no network requests at all. The PDF is written by hand (two JPEG pages,
   DCTDecode) so no library is needed. */
(function () {
  'use strict';
  var root = document.getElementById('ccMaker');
  if (!root) return;

  var $ = function (id) { return document.getElementById(id); };
  var PAPER = {               // millimetres
    a5:     { w: 148,   h: 210,   pt: [419.53, 595.28], label: 'A5' },
    halfin: { w: 139.7, h: 215.9, pt: [396, 612],       label: '5.5x8.5in' }
  };
  var DPI = 300;
  var FIELDS = [['height', 'Height'], ['bust', 'Bust'], ['waist', 'Waist'], ['hips', 'Hips'],
                ['shoe', 'Shoe'], ['hair', 'Hair'], ['eyes', 'Eyes']];
  var THEMES = {
    classic:   { bg: '#ffffff', ink: '#141414', soft: '#6b6b6b', serif: true },
    editorial: { bg: '#f4ede2', ink: '#1b1712', soft: '#7a6f62', serif: true },
    minimal:   { bg: '#ffffff', ink: '#111111', soft: '#8a8a8a', serif: false }
  };
  var state = { head: null, back: [], focus: 35 };

  /* ── image loading (local only) ───────────────────────────── */
  function loadFile(file) {
    return new Promise(function (res, rej) {
      if (!file || !/^image\//.test(file.type || 'image/')) return rej(new Error('type'));
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      im.src = url;
    });
  }
  function msg(t) { var m = $('ccMsg'); m.textContent = t || ''; m.hidden = !t; }

  $('ccHead').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    loadFile(f).then(function (im) { state.head = im; msg(''); render(); })
      .catch(function () { msg('That photo could not be opened. Try a JPG or PNG.'); });
  });
  $('ccBack').addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files || [], 0, 4);
    if ((e.target.files || []).length > 4) msg('Up to 4 photos for the back — the first 4 were used.'); else msg('');
    Promise.all(files.map(function (f) { return loadFile(f).catch(function () { return null; }); }))
      .then(function (ims) { state.back = ims.filter(Boolean); render(); });
  });
  ['ccFocus'].forEach(function (id) {
    $(id).addEventListener('input', function (e) { state.focus = +e.target.value; render(); });
  });
  root.querySelectorAll('input[type=text], select, input[type=radio]').forEach(function (el) {
    el.addEventListener('input', render); el.addEventListener('change', render);
  });

  function val(id) { var el = $(id); return el ? el.value.trim() : ''; }
  function opts() {
    var lay = root.querySelector('input[name=ccLayout]:checked');
    var ig = val('ccIg').replace(/^@+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
    return {
      layout: lay ? lay.value : 'classic', paper: val('ccPaper') || 'a5',
      name: val('ccName'), city: val('ccCity'), ig: ig ? '@' + ig : '',
      stats: FIELDS.map(function (f) { return [f[1], val('cc_' + f[0])]; }).filter(function (s) { return s[1]; })
    };
  }

  /* ── drawing helpers ──────────────────────────────────────── */
  function cover(ctx, im, x, y, w, h, fy) {
    if (!im) { ctx.fillStyle = '#d9d4cc'; ctx.fillRect(x, y, w, h); return; }
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    var sw = w / s, sh = h / s;
    var sx = (im.naturalWidth - sw) / 2;
    var sy = (im.naturalHeight - sh) * (fy == null ? 0.35 : fy);
    ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
  }
  function font(ctx, px, serif, weight, ls) {
    ctx.font = (weight || 400) + ' ' + Math.round(px) + 'px ' +
      (serif ? '"Playfair Display", Georgia, serif' : 'Inter, "Helvetica Neue", Arial, sans-serif');
    if ('letterSpacing' in ctx) ctx.letterSpacing = (ls || 0) + 'px';
  }
  function fit(ctx, text, maxW, px, serif, weight, ls) {
    var size = px;
    do { font(ctx, size, serif, weight, ls); size -= 2; } while (ctx.measureText(text).width > maxW && size > 10);
  }
  function rects(n, x, y, w, h, g, mode) {
    if (n <= 1) return [[x, y, w, h]];
    if (n === 2) return [[x, y, (w - g) / 2, h], [x + (w + g) / 2, y, (w - g) / 2, h]];
    if (n === 3) {
      if (mode === 'editorial') { var bw = (w - g) * 0.62, sw = w - g - bw, sh = (h - g) / 2;
        return [[x, y, bw, h], [x + bw + g, y, sw, sh], [x + bw + g, y + sh + g, sw, sh]]; }
      var th = (h - g) * 0.55, hw = (w - g) / 2;
      return [[x, y, w, th], [x, y + th + g, hw, h - th - g], [x + hw + g, y + th + g, hw, h - th - g]];
    }
    if (mode === 'editorial') { var bw2 = (w - g) * 0.62, sw2 = w - g - bw2, sh2 = (h - 2 * g) / 3;
      return [[x, y, bw2, h], [x + bw2 + g, y, sw2, sh2], [x + bw2 + g, y + sh2 + g, sw2, sh2], [x + bw2 + g, y + 2 * (sh2 + g), sw2, sh2]]; }
    var cw = (w - g) / 2, ch = (h - g) / 2;
    return [[x, y, cw, ch], [x + cw + g, y, cw, ch], [x, y + ch + g, cw, ch], [x + cw + g, y + ch + g, cw, ch]];
  }
  function fitSize(ctx, texts, maxW, px, serif, weight, ls) {
    var size = px;
    texts.forEach(function (t) {
      while (size > 10) { font(ctx, size, serif, weight, ls); if (ctx.measureText(t).width <= maxW) break; size -= 2; }
    });
    return size;
  }
  function statsRows(n) { return n > 4 ? 2 : 1; }
  /* stats in one row (up to 4) or two rows; one label size and one value size for every cell */
  function statsBand(ctx, o, T, x, y, w, h) {
    var st = o.stats; if (!st.length) return;
    var rows = statsRows(st.length), cols = Math.ceil(st.length / rows), cw = w / cols, rh = h / rows;
    var ls = rh * 0.03;
    var lp = fitSize(ctx, st.map(function (s) { return s[0].toUpperCase(); }), cw * 0.9, rh * 0.2, false, 500, ls);
    var vp = fitSize(ctx, st.map(function (s) { return s[1]; }), cw * 0.92, rh * 0.36, T.serif, 400, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    st.forEach(function (s, i) {
      var r = Math.floor(i / cols), c = i % cols, inRow = r === rows - 1 ? st.length - cols * r : cols;
      var off = (cols - inRow) * cw / 2, cx = x + off + cw * c + cw / 2, ry = y + rh * r;
      ctx.fillStyle = T.soft; font(ctx, lp, false, 500, ls); ctx.fillText(s[0].toUpperCase(), cx, ry + rh * 0.36);
      ctx.fillStyle = T.ink; font(ctx, vp, T.serif, 400, 0); ctx.fillText(s[1], cx, ry + rh * 0.82);
    });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  function footLine(o) { return [o.city, o.ig].filter(Boolean).join('  ·  '); }

  /* ── the two sides ────────────────────────────────────────── */
  function drawFront(ctx, W, H, o) {
    var T = THEMES[o.layout], fy = state.focus / 100, m = W * 0.06;
    var name = o.name || 'Your Name';
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    if (o.layout === 'classic') {
      cover(ctx, state.head, 0, 0, W, H, fy);
      var gr = ctx.createLinearGradient(0, H * 0.6, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = gr; ctx.fillRect(0, H * 0.6, W, H * 0.4);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      fit(ctx, name, W - 2 * m, W * 0.11, true, 400, 0); ctx.fillText(name, m, H - m - W * 0.055);
      font(ctx, W * 0.026, false, 500, W * 0.004); ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillText(footLine(o).toUpperCase(), m, H - m);
    } else if (o.layout === 'editorial') {
      var ph = H * 0.78;
      cover(ctx, state.head, m, m, W - 2 * m, ph - m, fy);
      ctx.fillStyle = T.ink; ctx.textAlign = 'center';
      fit(ctx, name, W - 2 * m, W * 0.1, true, 400, 0); ctx.fillText(name, W / 2, ph + (H - ph) * 0.48);
      ctx.fillStyle = T.soft; font(ctx, W * 0.024, false, 500, W * 0.006);
      ctx.fillText(footLine(o).toUpperCase(), W / 2, ph + (H - ph) * 0.78);
    } else {
      var ph2 = H * 0.84;
      cover(ctx, state.head, 0, 0, W, ph2, fy);
      ctx.fillStyle = T.ink; ctx.textAlign = 'center';
      fit(ctx, name.toUpperCase(), W - 2 * m, W * 0.06, false, 600, W * 0.012);
      ctx.fillText(name.toUpperCase(), W / 2, ph2 + (H - ph2) * 0.5);
      ctx.fillStyle = T.soft; font(ctx, W * 0.022, false, 400, W * 0.004);
      ctx.fillText(footLine(o), W / 2, ph2 + (H - ph2) * 0.8);
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  function drawBack(ctx, W, H, o) {
    var T = THEMES[o.layout], m = W * 0.06, g = W * 0.018;
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var band = statsRows(o.stats.length) === 2 ? H * 0.19 : H * 0.11, nameH = H * 0.06;
    var gy = m + nameH, gh = H - gy - band - m * 0.6;
    ctx.fillStyle = T.ink; ctx.textBaseline = 'alphabetic';
    if (o.layout === 'minimal') { ctx.textAlign = 'left'; fit(ctx, (o.name || 'Your Name').toUpperCase(), W * 0.6, nameH * 0.5, false, 600, W * 0.008); }
    else { ctx.textAlign = 'left'; fit(ctx, o.name || 'Your Name', W * 0.6, nameH * 0.75, true, 400, 0); }
    ctx.fillText(o.layout === 'minimal' ? (o.name || 'Your Name').toUpperCase() : (o.name || 'Your Name'), m, m + nameH * 0.6);
    ctx.textAlign = 'right'; ctx.fillStyle = T.soft; font(ctx, W * 0.02, false, 500, W * 0.003);
    ctx.fillText(footLine(o), W - m, m + nameH * 0.6);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    var ims = state.back.length ? state.back : [null, null, null, null];
    rects(ims.length, m, gy, W - 2 * m, gh, g, o.layout).forEach(function (r, i) {
      cover(ctx, ims[i], r[0], r[1], r[2], r[3], 0.3);
    });
    ctx.fillStyle = T.soft; ctx.fillRect(m, H - band - m * 0.35, W - 2 * m, Math.max(1, W * 0.0012));
    statsBand(ctx, o, T, m, H - band - m * 0.1, W - 2 * m, band * 0.8);
  }

  /* ── preview ──────────────────────────────────────────────── */
  function size(o, scale) {
    var p = PAPER[o.paper] || PAPER.a5;
    return [Math.round(p.w / 25.4 * DPI * scale), Math.round(p.h / 25.4 * DPI * scale)];
  }
  var raf = 0;
  function render() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var o = opts(), s = size(o, 0.36);
      [['ccFront', drawFront], ['ccBackCv', drawBack]].forEach(function (p) {
        var cv = $(p[0]); cv.width = s[0]; cv.height = s[1];
        p[1](cv.getContext('2d'), s[0], s[1], o);
      });
      root.classList.toggle('cc-ready', !!state.head);
    });
  }

  /* ── export ───────────────────────────────────────────────── */
  function full(o, fn) {
    var s = size(o, 1), cv = document.createElement('canvas');
    cv.width = s[0]; cv.height = s[1]; fn(cv.getContext('2d'), s[0], s[1], o); return cv;
  }
  function toBlob(cv, type, q) { return new Promise(function (r) { cv.toBlob(r, type, q); }); }
  function save(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function fname(o, ext) {
    var b = (o.name || 'comp-card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'comp-card';
    return b + '-comp-card-' + (PAPER[o.paper] || PAPER.a5).label + '.' + ext;
  }
  function ready() {
    if (!state.head) { msg('Add a headshot first — it goes on the front.'); $('ccHead').focus(); return false; }
    msg(''); return true;
  }
  function busy(btn, on) { btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.textContent; btn.textContent = on ? 'Preparing…' : btn.dataset.t; }

  $('ccPng').addEventListener('click', function () {
    if (!ready()) return; var btn = this, o = opts(); busy(btn, true);
    setTimeout(function () {
      var f = full(o, drawFront), b = full(o, drawBack), gap = Math.round(f.width * 0.04);
      var cv = document.createElement('canvas'); cv.width = f.width * 2 + gap * 3; cv.height = f.height + gap * 2;
      var c = cv.getContext('2d'); c.fillStyle = '#e9e6e1'; c.fillRect(0, 0, cv.width, cv.height);
      c.drawImage(f, gap, gap); c.drawImage(b, f.width + gap * 2, gap);
      toBlob(cv, 'image/png').then(function (bl) { save(bl, fname(o, 'png')); busy(btn, false); root.dataset.lastPng = bl.size; });
    }, 30);
  });

  $('ccPdf').addEventListener('click', function () {
    if (!ready()) return; var btn = this, o = opts(); busy(btn, true);
    setTimeout(function () {
      var pages = [full(o, drawFront), full(o, drawBack)];
      Promise.all(pages.map(function (cv) {
        return toBlob(cv, 'image/jpeg', 0.92).then(function (b) { return b.arrayBuffer(); })
          .then(function (ab) { return { data: new Uint8Array(ab), w: cv.width, h: cv.height }; });
      })).then(function (imgs) {
        var bl = pdf(imgs, (PAPER[o.paper] || PAPER.a5).pt);
        save(bl, fname(o, 'pdf')); busy(btn, false); root.dataset.lastPdf = bl.size;
      });
    }, 30);
  });

  /* Minimal PDF 1.4 writer: one full-bleed JPEG per page. */
  function pdf(imgs, pt) {
    var enc = new TextEncoder(), parts = [], len = 0, offs = [];
    function put(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(n, body) { offs[n] = len; put(n + ' 0 obj\n'); body(); put('\nendobj\n'); }
    var W = pt[0].toFixed(2), H = pt[1].toFixed(2), n = imgs.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    put('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
    obj(1, function () { put('<< /Type /Catalog /Pages 2 0 R >>'); });
    obj(2, function () { put('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>'); });
    imgs.forEach(function (im, i) {
      var p = 3 + i * 3, c = p + 1, x = p + 2, cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im' + i + ' Do Q';
      obj(p, function () { put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im' + i + ' ' + x + ' 0 R >> >> /Contents ' + c + ' 0 R >>'); });
      obj(c, function () { put('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream'); });
      obj(x, function () {
        put('<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h +
            ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.data.length + ' >>\nstream\n');
        put(im.data); put('\nendstream');
      });
    });
    var total = 3 + n * 3, xref = len, x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) x += ('0000000000' + offs[k]).slice(-10) + ' 00000 n \n';
    put(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }

  var go = function () { render(); };
  if (document.fonts && document.fonts.load) {
    Promise.all(['400 40px "Playfair Display"', '400 40px Inter', '500 40px Inter', '600 40px Inter']
      .map(function (f) { return document.fonts.load(f).catch(function () {}); })).then(go, go);
  }
  render();
})();
