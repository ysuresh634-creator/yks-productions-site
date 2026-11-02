/* YKS Talents — portfolio PDF v3 ("The Book"), built with jsPDF on the applicant's own phone.
   Loaded by talent-apply.js: once inside the submit chain (the book is posted to the Apps Script
   with the photos and saved to Drive) and again for the applicant's own download.

   window.YKSPortfolio.blob(data)     → Promise<Blob>   (the PDF)
   window.YKSPortfolio.download(data) → Promise         (saves the PDF on the device)
   window.YKSPortfolio.design(data)   → the art direction this talent gets (theme, cover, …)
   data = { name, category, city, about, seed, stats:{ height, heightShort, bust, waist, hips, shoe, hair, eyes }, photos:[File] }
   photos in book order: close-up 1 (cover), full-length, close-up 2, mid-shot, other, extras… (up to 12)

   Every talent gets their own book: one of eight art directions (palette, typeface, cover
   composition, grid, motif), then per-talent variation inside it (accent, name setting, profile
   and back-page layout, page plan, photo sequence). All of it comes from a seeded generator
   (name + data.seed, the application id), so a rebuilt PDF for the same application is identical.

   Photos are the hero: full-bleed single pages, never more than two photos on a page (bar the
   one contact strip on the back), minimal type.

   Client-facing: the book NEVER prints the talent's phone, email, WhatsApp, Instagram or links;
   every enquiry routes through YKS. The intro is scrubbed of contact details before it prints.

   Built in two passes: pass 1 lays the book out on a throwaway doc and records every photo frame
   it needs (size + crop focus); then each photo is decoded once, cropped cover-style to each of its
   frames on a canvas (no distortion, never stretched) and released; pass 2 draws the real book. */
(function () {
  'use strict';
  var VER = '3.0';
  var W = 595.28, H = 841.89, M = 40, CW = W - 2 * M;
  var DISC = { 'Model': ['Fashion', 'Editorial', 'Runway', 'Commercial'], 'Influencer / Creator': ['Content', 'Campaign', 'Reels', 'Commercial'], 'Actor': ['Film', 'Advertising', 'Editorial', 'Screen'] };
  var PPT = 2.2;              // output pixels per point for photo crops (~158 dpi): full pages stay sharp on phones and in print
  var MAX_PHOTOS = 12;
  var BOOK_WA = '919746679720';

  /* ── the art directions ──
     mode: overall page tone · bg/ink/sub/rule: paper and type · night: the dark used for fades and
     dark pages · accents: per-talent accent options · font: PF Playfair, BD Bodoni Moda, JS Jost ·
     covers/names/profiles/backs/singles/pairs: the compositions this direction allows · motif:
     the recurring detail · cap: how plates are numbered · words: section words */
  var THEMES = [
    { id: 'noir', name: 'Noir', mode: 'dark', font: 'PF', bg: [14, 12, 16], ink: [246, 240, 230], sub: [176, 166, 152], rule: [74, 66, 60], night: [14, 12, 16],
      accents: [[205, 118, 58], [214, 186, 132], [176, 58, 52]], covers: ['bleed', 'offset', 'masthead'], names: ['stack', 'italic'],
      profiles: ['overlay', 'side'], backs: ['strip', 'photo'], singles: ['bleed', 'bleed', 'feature'], pairs: ['stagger', 'diptych'], motif: 'rule', cap: 'look',
      words: ['Movement', 'Presence', 'Light', 'Character', 'Range', 'Form'] },
    { id: 'atelier', name: 'Atelier', mode: 'light', font: 'BD', bg: [244, 239, 231], ink: [28, 22, 18], sub: [128, 116, 102], rule: [208, 198, 184], night: [24, 18, 14],
      accents: [[170, 80, 42], [104, 108, 60], [150, 58, 48]], covers: ['framed', 'split', 'bleed'], names: ['stack', 'caps'],
      profiles: ['side', 'band'], backs: ['strip', 'photo'], singles: ['bleed', 'margin', 'feature'], pairs: ['stagger', 'diptych'], motif: 'numeral', cap: 'plate',
      words: ['Silhouette', 'Gesture', 'Poise', 'Texture', 'Mood', 'Line'] },
    { id: 'gallery', name: 'Gallery', mode: 'light', font: 'JS', bg: [250, 250, 247], ink: [14, 14, 14], sub: [120, 120, 116], rule: [214, 214, 208], night: [10, 10, 10],
      accents: [[14, 14, 14], [34, 62, 168], [190, 34, 40]], covers: ['centered', 'framed', 'masthead'], names: ['caps'],
      profiles: ['band', 'side'], backs: ['strip', 'photo'], singles: ['margin', 'bleed', 'margin'], pairs: ['diptych', 'stagger'], motif: 'frame', cap: 'no',
      words: ['Study', 'Form', 'Contour', 'Stillness', 'Edge', 'Glow'] },
    { id: 'riviera', name: 'Riviera', mode: 'dark', font: 'BD', bg: [16, 22, 38], ink: [244, 238, 228], sub: [160, 170, 188], rule: [58, 68, 92], night: [12, 16, 30],
      accents: [[232, 120, 92], [176, 200, 226], [222, 190, 120]], covers: ['masthead', 'bleed', 'centered'], names: ['caps', 'italic'],
      profiles: ['overlay', 'band'], backs: ['photo', 'strip'], singles: ['bleed', 'feature', 'bleed'], pairs: ['stagger', 'diptych'], motif: 'frame', cap: 'roman',
      words: ['Allure', 'Sunlight', 'Poise', 'Motion', 'Glamour', 'Ease'] },
    { id: 'sable', name: 'Sable', mode: 'dark', font: 'PF', bg: [18, 25, 22], ink: [236, 228, 212], sub: [170, 164, 146], rule: [58, 70, 62], night: [12, 18, 15],
      accents: [[214, 186, 132], [150, 170, 140], [196, 128, 92]], covers: ['split', 'centered', 'bleed'], names: ['italic', 'stack'],
      profiles: ['side', 'overlay'], backs: ['strip', 'photo'], singles: ['bleed', 'feature', 'margin'], pairs: ['diptych', 'stagger'], motif: 'numeral', cap: 'roman',
      words: ['Grace', 'Shadow', 'Velvet', 'Calm', 'Depth', 'Aura'] },
    { id: 'rose', name: 'Ros\u00e9', mode: 'light', font: 'PF', bg: [241, 228, 223], ink: [86, 22, 36], sub: [150, 104, 104], rule: [222, 196, 190], night: [48, 14, 22],
      accents: [[168, 52, 72], [196, 120, 96], [96, 30, 44]], covers: ['framed', 'offset', 'centered'], names: ['italic', 'stack'],
      profiles: ['band', 'side'], backs: ['photo', 'strip'], singles: ['margin', 'bleed', 'feature'], pairs: ['stagger', 'diptych'], motif: 'rule', cap: 'look',
      words: ['Softness', 'Bloom', 'Charm', 'Warmth', 'Glow', 'Romance'] },
    { id: 'concrete', name: 'Concrete', mode: 'light', font: 'JS', bg: [226, 226, 222], ink: [28, 28, 30], sub: [110, 110, 108], rule: [196, 196, 190], night: [20, 20, 22],
      accents: [[232, 96, 40], [40, 72, 190], [28, 28, 30]], covers: ['split', 'offset', 'masthead'], names: ['caps'],
      profiles: ['band', 'side'], backs: ['strip', 'photo'], singles: ['bleed', 'margin', 'bleed'], pairs: ['diptych', 'stagger'], motif: 'bar', cap: 'no',
      words: ['Structure', 'Attitude', 'Edge', 'Form', 'Contrast', 'Line'] },
    { id: 'linen', name: 'Linen', mode: 'light', font: 'BD', bg: [236, 228, 214], ink: [52, 38, 30], sub: [134, 114, 94], rule: [212, 200, 180], night: [34, 24, 18],
      accents: [[182, 132, 52], [120, 86, 60], [96, 112, 92]], covers: ['centered', 'framed', 'split'], names: ['italic', 'caps'],
      profiles: ['side', 'band'], backs: ['photo', 'strip'], singles: ['margin', 'feature', 'bleed'], pairs: ['stagger', 'diptych'], motif: 'rule', cap: 'plate',
      words: ['Stillness', 'Nature', 'Grace', 'Ease', 'Light', 'Season'] }
  ];
  var IVORY = [246, 240, 230];

  /* ── seeded choices ── */
  function hash(s) { var h = 2166136261 >>> 0; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function rngOf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function design(data) {
    var key = String(data.name || '').toLowerCase().replace(/\s+/g, ' ').trim() + '|' + String(data.seed || data.name || 'yks');
    var r = rngOf(hash(key)), pick = function (a) { return a[Math.floor(r() * a.length) % a.length]; };
    var T = THEMES[hash('t' + key) % THEMES.length];
    return {
      theme: T, accent: pick(T.accents), cover: pick(T.covers), names: pick(T.names), profile: pick(T.profiles),
      back: pick(T.backs), profileSide: r() < 0.5 ? 'left' : 'right', profileEarly: r() < 0.6,
      wordOff: Math.floor(r() * 6), pairP: 0.35 + r() * 0.3, rand: r, key: key
    };
  }

  var CONTACTY = /\S+@\S+\.\S+|\b(?:https?:\/\/|www\.)|@[\w.]{2,}|\b[a-z0-9-]+\.(?:com|in|net|co|org|me|link|io|to|xyz|ae)\b|[+(]?\d[\d\s().\-]{6,}\d|\b(?:insta(?:gram)?|whats ?app|dm me|call me|text me|reach me|contact me|message me|ping me)\b/i;
  function stripContact(s) {
    if (!s) return '';
    // a sentence that carries contact details goes entirely (no orphaned "me on or" left behind)
    s = String(s).split(/(?<=[.!?])\s+|\n+/).filter(function (x) { return !CONTACTY.test(x); }).join(' ');
    return String(s)
      .replace(/\S+@\S+\.\S+/g, '')
      .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '')
      .replace(/@[\w.]+/g, '')
      .replace(/\b(?:insta(?:gram)?|ig|whats ?app|wa|call|dm|text|contact)\b\s*[:\-]?\s*/gi, ' ')
      .replace(/\b[a-z0-9-]+\.(?:com|in|net|co|org|me|link|io|to|xyz|ae)\b(?:\/[^\s]*)?/gi, '')
      .replace(/[+(]?\d[\d\s().\-]{6,}\d/g, '')
      .replace(/\s{2,}/g, ' ').replace(/^[\s·|,\-]+|[\s·|,\-]+$/g, '').trim();
  }
  function titleCase(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().split(' ').map(function (w) {
      if (w === w.toLowerCase() || w === w.toUpperCase()) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      return w;
    }).join(' ');
  }
  function load(src, test) {
    return new Promise(function (res) {
      if (test()) return res(true);
      var s = document.createElement('script'); s.src = src;
      s.onload = function () { res(test()); }; s.onerror = function () { res(false); };
      document.head.appendChild(s);
    });
  }
  function isHeic(f) { return /image\/hei[cf]/i.test(f.type || '') || /\.(heic|heif)$/i.test(f.name || ''); }
  function toRenderable(f) {
    if (!isHeic(f)) return Promise.resolve(f);
    return load('/js/vendor/heic2any.min.js', function () { return !!window.heic2any; }).then(function (ok) {
      if (!ok) return f;
      return window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.9 }).then(function (o) { return Array.isArray(o) ? o[0] : o; }, function () { return f; });
    });
  }
  function decode(blob) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ img: im, url: u }); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('decode')); };
      im.src = u;
    });
  }
  function roman(n) { var v = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], o = ''; v.forEach(function (p) { while (n >= p[0]) { o += p[1]; n -= p[0]; } }); return o; }

  /* ════════════════════════ the book ════════════════════════
     layout(doc, P, D, frame, opts): P = [{w,h}] photo sizes; frame(i,x,y,w,h,fx,fy) places photo i
     cover-cropped to the box. Pure layout (same seed → same book): pass 1 records frames, pass 2 draws. */
  function layout(doc, P, D, frame, opts) {
    var S = design(D), T = S.theme, R = S.rand, A = S.accent;
    var FAM = opts.fonts[T.font] ? T.font : (T.font === 'JS' ? 'helvetica' : 'times');
    var HAS_IT = FAM !== 'JS' && FAM !== 'helvetica';
    var LAB = FAM === 'JS' ? 'JS' : 'helvetica';         // tracked caps labels
    var PRIMES = FAM === 'PF';                           // only Playfair carries ′ ″
    var DARK = T.mode === 'dark', BG = T.bg, INK = T.ink, SUB = T.sub, RULE = T.rule, NIGHT = T.night;
    var N = P.length, pg = 0;
    var name = titleCase(D.name || 'YKS Talent'), parts = name.split(' ');
    var first = parts[0], last = parts.slice(1).join(' ');
    var NAME_UP = name.toUpperCase();
    var cat = String(D.category || 'Model').trim(), city = titleCase(stripContact(D.city || ''));
    var role = cat === 'Influencer / Creator' ? 'Creator' : cat;
    var disc = DISC[cat] || DISC.Model;
    var about = stripContact(String(D.about || '').trim()).slice(0, 300);
    var st = D.stats || {};
    function vt(v) { v = String(v || ''); return PRIMES ? v : v.replace(/\u2032/g, '\u2019').replace(/\u2033/g, '\u201d'); }
    function sv(k) { var v = st[k]; return v ? vt(stripContact(String(v)).trim()) : ''; }
    var VITALS = [['Height', sv('height')], ['Bust', sv('bust')], ['Waist', sv('waist')], ['Hips', sv('hips')], ['Shoe', sv('shoe')], ['Hair', sv('hair')], ['Eyes', sv('eyes')]].filter(function (r) { return r[1]; });
    var HSHORT = sv('heightShort') || sv('height');
    var CORE = VITALS.filter(function (r) { return /Height|Bust|Waist|Hips|Shoe/.test(r[0]); }).map(function (r) { return [r[0], r[0] === 'Height' ? HSHORT : r[1]]; });

    /* ── type helpers ── */
    function col(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function setF(f, s, z) {
      if (f === 'D') { f = FAM; if (s === 'italic' && !HAS_IT) s = 'normal'; if (FAM === 'JS' && s === 'bold') s = 'bold'; }
      doc.setFont(f, s || 'normal'); doc.setFontSize(z);
    }
    // scripts the embedded faces can't draw (Devanagari, Tamil, Malayalam, Arabic…) are typeset by the
    // phone's own fonts on a canvas and placed as a crisp transparent image, so a name never turns to gibberish
    var RX_EMB = /[^\u0000-\u017f\u2010-\u2033\u2116\u2122\u20b9]/, RX_STD = /[^\u0000-\u00ff\u2013\u2014\u2018-\u201e\u2020-\u2022\u2026\u2030\u20ac\u2122]/;
    var CAN_R = typeof document !== 'undefined' && !!document.createElement, MC = null, RS = 6;
    function needR(t) { if (!CAN_R) return false; var f = doc.getFont().fontName; return (/^(PF|BD|JS)$/.test(f) ? RX_EMB : RX_STD).test(t); }
    function cssF(px) {
      var fi = doc.getFont(), serif = !/^(JS|helvetica)$/i.test(fi.fontName), st = String(fi.fontStyle || '');
      return (/bold/.test(st) ? '600 ' : '400 ') + px + 'px ' +
        (serif ? '"Noto Serif", "Noto Serif Devanagari", "Noto Serif Tamil", "Noto Serif Malayalam", Georgia, serif' : '"Noto Sans", system-ui, -apple-system, sans-serif');
    }
    function mctx() { if (!MC) MC = document.createElement('canvas').getContext('2d'); return MC; }
    function rW(t) { var m = mctx(), z = doc.getFontSize(); m.font = cssF(z * RS); return m.measureText(t).width / RS; }
    function rDraw(t, x, y, angle) {
      var z = doc.getFontSize(), asc = z * 1.02, des = z * 0.42, w = rW(t) + z * 0.1, tc = doc.getTextColor();
      var cv = document.createElement('canvas'), cx, vert = angle === 90;
      cv.width = Math.ceil((vert ? asc + des : w) * RS); cv.height = Math.ceil((vert ? w : asc + des) * RS);
      cx = cv.getContext('2d'); cx.font = cssF(z * RS); cx.fillStyle = tc; cx.textBaseline = 'alphabetic';
      if (vert) { cx.translate(asc * RS, w * RS); cx.rotate(-Math.PI / 2); }
      cx.fillText(t, 0, vert ? 0 : asc * RS);
      var url = cv.toDataURL('image/png'); cv.width = cv.height = 0;
      if (vert) doc.addImage(url, 'PNG', x - asc, y - w, asc + des, w); else doc.addImage(url, 'PNG', x, y - asc, w, asc + des);
    }
    function tx(t, x, y, op) { if (needR(t)) rDraw(t, x, y, op && op.angle); else doc.text(t, x, y, op); }
    function tw(t, ls) { return needR(t) ? rW(t) : doc.getTextWidth(t) + Math.max(0, t.length - 1) * (ls || 0); }
    function split(t, w) {
      if (!needR(t)) return doc.splitTextToSize(t, w);
      var out = [], cur = '';
      String(t).split(/\s+/).forEach(function (wd) { var nx = cur ? cur + ' ' + wd : wd; if (cur && rW(nx) > w) { out.push(cur); cur = wd; } else cur = nx; });
      if (cur) out.push(cur); return out;
    }
    function cap(t, x, y, z, c, o) {
      o = o || {}; t = String(t).toUpperCase(); setF(LAB, o.bold ? 'bold' : 'normal', z); col(c);
      var ls = o.ls == null ? z * 0.32 : o.ls, w = tw(t, ls);
      if (o.align === 'right') x -= w; else if (o.align === 'center') x -= w / 2;
      tx(t, x, y, o.angle ? { charSpace: ls, angle: o.angle } : { charSpace: ls }); return w;
    }
    function disp(t, x, y, z, c, o) {
      o = o || {}; setF('D', o.italic ? 'italic' : 'normal', z); col(c);
      var ls = o.ls || 0, w = tw(t, ls), op = {};
      if (o.align === 'right') x -= w; else if (o.align === 'center') x -= w / 2;
      if (ls) op.charSpace = ls; if (o.angle) op.angle = o.angle;
      tx(t, x, y, op); return w;
    }
    function fit(t, s, start, min, maxW, lsK) { var z = start; setF('D', s, z); while (z > min && tw(t, z * (lsK || 0)) > maxW) { z -= 0.5; setF('D', s, z); } return z; }
    function rule(x1, y, x2, c, lw) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(lw || 0.5); doc.line(x1, y, x2, y); }
    function vrule(x, y1, y2, c, lw) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(lw || 0.5); doc.line(x, y1, x, y2); }
    function box(c, x, y, w, h) { doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, y, w, h, 'F'); }
    function page(c) { if (pg) doc.addPage(); pg++; box(c, 0, 0, W, H); }
    function alpha(op, fn) { if (!doc.GState) return; doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: op })); fn(); doc.restoreGraphicsState(); }
    // smooth vertical fade: stacked low-opacity layers (no banding, no seams)
    function fade(y0, y1, op0, op1, c) {
      if (!doc.GState) return; c = c || NIGHT;
      var down = op1 >= op0, hi = Math.max(op0, op1), n = 60, a = 1 - Math.pow(1 - Math.min(hi, 0.995), 1 / n);
      function inv(v) { var lo = 0, up = 1; for (var it = 0; it < 26; it++) { var m = (lo + up) / 2, sm = m * m * (3 - 2 * m); if (sm * hi < v) lo = m; else up = m; } return (lo + up) / 2; }
      doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: a })); doc.setFillColor(c[0], c[1], c[2]);
      for (var k = 1; k <= n; k++) { var t = inv(1 - Math.pow(1 - a, k));
        if (down) { var ys = y0 + (y1 - y0) * t; doc.rect(0, ys, W, y1 - ys, 'F'); } else { var ye = y1 - (y1 - y0) * t; doc.rect(0, y0, W, ye - y0, 'F'); } }
      doc.restoreGraphicsState();
    }
    function landscape(i) { return P[i] && P[i].w > P[i].h * 1.05; }
    function num(n) { return ('0' + n).slice(-2); }
    var plateNo = 0;
    function plateCap() {
      plateNo++;
      return T.cap === 'roman' ? 'Plate ' + roman(plateNo) : T.cap === 'plate' ? 'Plate ' + num(plateNo) : T.cap === 'no' ? 'No. ' + num(plateNo) : 'Look ' + num(plateNo);
    }
    var wk = S.wordOff;
    function word() { return T.words[(wk++) % T.words.length]; }
    // footers: tiny, never competing with the photo
    function foot(onPhoto, full) {
      if (onPhoto) fade(H - 70, H, 0, 0.45, NIGHT);
      var c = onPhoto ? IVORY : SUB, n = onPhoto ? IVORY : INK;
      cap('YKS Talents', M, H - 22, 5.6, c, { bold: true, ls: 2.2 });
      if (full) cap('yksproductions.com', W / 2, H - 22, 5.6, c, { ls: 1.6, align: 'center' });
      disp(num(pg), W - M, H - 22, 8, n, { italic: true, align: 'right' });
    }
    // vertical text with a soft shadow so it reads over light and dark photos alike
    function vtext(t, x, y, z, c) {
      setF(LAB, 'bold', z); var ls = z * 0.42;
      alpha(0.55, function () { col(NIGHT); doc.text(t, x + 0.7, y + 0.7, { angle: 90, charSpace: ls }); });
      col(c); doc.text(t, x, y, { angle: 90, charSpace: ls });
      return tw(t, ls);
    }
    function motif(x, y, w, h, onPhoto) {
      if (T.motif === 'frame') { var c = onPhoto ? IVORY : INK; alpha(onPhoto ? 0.6 : 0.5, function () { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(0.5); doc.rect(x + 14, y + 14, w - 28, h - 28); }); }
      else if (T.motif === 'bar') box(A, x, y, 6, Math.min(140, h * 0.25));
    }

    /* ── name settings ── (drawn upward from a baseline; returns the top) */
    function nameBlock(style, x, base, maxW, c, align, zMax) {
      align = align || 'left'; zMax = zMax || 104;
      var ax = align === 'center' ? x : align === 'right' ? x : x;
      if (style === 'caps' || !HAS_IT && style !== 'caps') {
        var one = NAME_UP, z1 = fit(one, 'normal', Math.min(zMax * 0.62, 66), 10, maxW, 0.14);
        if (z1 >= 30 || !last) { disp(one, ax, base, z1, c, { ls: z1 * 0.14, align: align }); return base - z1 * 0.8; }
        var fu = first.toUpperCase(), lu = last.toUpperCase();
        var z = Math.min(fit(fu, 'normal', zMax * 0.62, 18, maxW, 0.14), fit(lu, 'normal', zMax * 0.62, 18, maxW, 0.14));
        disp(lu, ax, base, z, c, { ls: z * 0.14, align: align });
        disp(fu, ax, base - z * 1.05, z, c, { ls: z * 0.14, align: align });
        return base - z * 1.85;
      }
      if (style === 'italic') {
        var zi = fit(name, 'italic', zMax * 0.7, 20, maxW, -0.01);
        if (zi >= 50 || !last) { var d1 = /[gjpqy]/.test(name) ? zi * 0.2 : 0; disp(name, ax, base - d1, zi, c, { italic: true, align: align, ls: -zi * 0.01 }); return base - d1 - zi * 0.75; }
        var za = Math.min(fit(first, 'italic', zMax * 0.8, 22, maxW), fit(last, 'italic', zMax * 0.8, 22, maxW));
        var d2 = /[gjpqy]/.test(last) ? za * 0.2 : 0;
        disp(last, ax, base - d2, za, c, { italic: true, align: align });
        disp(first, ax, base - d2 - za * 0.9, za, c, { italic: true, align: align });
        return base - d2 - za * 1.65;
      }
      // stack: first roman, surname italic, offset
      var zf = fit(first, 'normal', zMax, 30, maxW - 10, -0.01);
      var zl = last ? fit(last, 'italic', Math.min(zf * 0.92, zMax * 0.88), 24, maxW - 36, -0.005) : 0;
      var desc = /[gjpqy]/.test(last || first), yL = base - (desc ? (last ? zl : zf) * 0.2 : 0);
      var off = align === 'left' ? Math.min(36, maxW - (last ? tw(last) : 0)) : 0;
      if (last) disp(last, ax + off, yL, zl, c, { italic: true, align: align, ls: -zl * 0.005 });
      var yF = last ? yL - zl * 0.86 : yL;
      disp(first, ax - (align === 'left' ? zf * 0.04 : 0), yF, zf, c, { align: align, ls: -zf * 0.01 });
      return yF - zf * 0.74;
    }
    // vitals strip: tracked labels over display-face values
    function strip(cells, x, y, maxW, labC, valC, ruleC, align) {
      if (!cells.length) return;
      var z = 12.5, gap = 22, total, ws;
      for (;;) {
        setF('D', 'normal', z);
        ws = cells.map(function (r) { setF('D', 'normal', z); var a = tw(r[1]); setF(LAB, 'normal', 5.6); return Math.max(a, tw(r[0].toUpperCase(), 1.6)); });
        total = ws.reduce(function (s, v) { return s + v; }, 0) + gap * (cells.length - 1);
        if (total <= maxW || z <= 8) break; z -= 0.5; gap = Math.max(12, gap - 1);
      }
      var cx = align === 'center' ? x - total / 2 : x;
      cells.forEach(function (r, k) {
        cap(r[0], cx, y - 15, 5.6, labC, { ls: 1.6 });
        disp(r[1], cx, y, z, valC);
        if (k < cells.length - 1 && ruleC) vrule(cx + ws[k] + gap / 2, y - 22, y + 2, ruleC, 0.4);
        cx += ws[k] + gap;
      });
    }
    function masthead(x, y, c, align) {
      var t = 'YKS', z = 15;
      setF('D', 'normal', z); var w1 = tw(t, 1.5); setF(LAB, 'normal', 6); var w2 = tw('TALENTS', 3);
      var tot = w1 + 8 + w2, sx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
      disp(t, sx, y, z, c, { ls: 1.5 }); cap('Talents', sx + w1 + 8, y - 1, 6, c, { ls: 3 });
    }
    var LINE = (cat + (city ? '  \u2014  ' + city : ''));

    /* ── 01 · covers ── */
    function cover() {
      var v = S.cover, cells = CORE;
      if (v === 'framed') {
        page(BG);
        var ph = Math.round(H * 0.68), py = 54;
        frame(0, M, py, CW, ph, 0.5, 0.3);
        masthead(M, 36, INK, 'left'); cap('The Portfolio', W - M, 35, 6, SUB, { ls: 3, align: 'right' });
        motif(M, py, CW, ph, true);
        var yv = H - 44;
        strip(cells, M, yv, CW, SUB, INK, RULE, 'left');
        cap(LINE, M, yv - 40, 7, A, { bold: true, ls: 2.4 });
        nameBlock(S.names, M, yv - 62, CW, INK, 'left', 64);
        return;
      }
      if (v === 'split') {
        page(DARK ? BG : NIGHT);
        var pw = 214, panel = DARK ? BG : NIGHT, tc = DARK ? INK : IVORY;
        frame(0, pw, 0, W - pw, H, 0.5, 0.3);
        box(panel, 0, 0, pw, H);
        masthead(28, 50, tc, 'left');
        // the name runs up the panel
        var nm = S.names === 'caps' || !HAS_IT ? NAME_UP : name, it = S.names !== 'caps' && HAS_IT;
        var room = H - 330, zn = fit(nm, it ? 'italic' : 'normal', 96, 24, room, it ? 0 : 0.12);
        disp(nm, 28 + zn * 0.78, H - 250, zn, tc, { italic: it, angle: 90, ls: it ? 0 : zn * 0.12 });
        box(A, 28, H - 226, 26, 2);
        cap(role, 28, H - 204, 6.4, A, { bold: true, ls: 2.4 });
        if (city) { setF(LAB, 'normal', 6.4); cap(city, 28, H - 192, fit2(city.toUpperCase(), 6.4, pw - 50), tc, { ls: 2 }); }
        var y = H - 160;
        cells.slice(0, 5).forEach(function (r) { cap(r[0], 28, y, 5.4, DARK ? SUB : [170, 164, 156], { ls: 1.6 }); disp(r[1], pw - 26, y, 11, tc, { align: 'right' }); y += 22; });
        return;
      }
      page(NIGHT);
      frame(0, 0, 0, W, H, 0.5, v === 'masthead' ? 0.42 : 0.3);
      if (v === 'masthead') {
        fade(0, 300, 0.7, 0, NIGHT);
        fade(H - 190, H, 0, 0.85, NIGHT);
        masthead(W / 2, 40, IVORY, 'center');
        var nmU = S.names === 'italic' && HAS_IT ? name : NAME_UP, itU = S.names === 'italic' && HAS_IT;
        var zt = fit(nmU, itU ? 'italic' : 'normal', 110, 22, W - 50, itU ? 0 : 0.06);
        disp(nmU, W / 2, 62 + zt * 0.78, zt, IVORY, { italic: itU, align: 'center', ls: itU ? 0 : zt * 0.06 });
        cap(LINE, W / 2, 62 + zt * 0.78 + 26, 6.6, A, { bold: true, ls: 2.6, align: 'center' });
        strip(cells, W / 2, H - 42, CW, [210, 200, 188], IVORY, null, 'center');
        motif(0, 0, W, H, true);
        return;
      }
      if (v === 'centered') {
        fade(0, 120, 0.45, 0, NIGHT);
        fade(H * 0.55, H, 0, 0.9, NIGHT);
        masthead(W / 2, 46, IVORY, 'center');
        var yv2 = H - 46;
        strip(cells, W / 2, yv2, CW, [210, 200, 188], IVORY, [110, 102, 94], 'center');
        rule(W / 2 - 18, yv2 - 40, W / 2 + 18, A, 1);
        cap(LINE, W / 2, yv2 - 54, 6.6, IVORY, { ls: 2.6, align: 'center' });
        nameBlock(S.names, W / 2, yv2 - 76, CW, IVORY, 'center', 76);
        motif(0, 0, W, H, true);
        return;
      }
      if (v === 'offset') {
        fade(0, 150, 0.55, 0, NIGHT);
        masthead(M, 52, IVORY, 'left');
        cap('The Portfolio', W - M, 51, 6, IVORY, { ls: 3, align: 'right' });
        var bw = Math.round(W * 0.72), bh = 236, by = H - bh;
        box(BG, 0, by, bw, bh);
        box(A, 0, by, bw, 3);
        var yb = H - 36;
        strip(cells, M, yb, bw - M - 26, SUB, INK, RULE, 'left');
        cap(LINE, M, yb - 38, 6.6, A, { bold: true, ls: 2.4 });
        nameBlock(S.names, M, yb - 58, bw - M - 30, INK, 'left', 62);
        return;
      }
      // bleed: the name large at the bottom left over a deep fade
      fade(0, 190, 0.6, 0, NIGHT);
      fade(H * 0.42, H, 0, 0.92, NIGHT);
      masthead(M, 58, IVORY, 'left');
      cap('The Portfolio', W - M, 51, 6.5, IVORY, { ls: 3.2, align: 'right' });
      disp('MMXXVI', W - M, 63, 8, [216, 206, 192], { italic: true, align: 'right', ls: 1.5 });
      var spine = disc.join('  \u00b7  ').toUpperCase(); setF(LAB, 'bold', 6); var sl = tw(spine, 6 * 0.42);
      vtext(spine, W - 18, H / 2 + sl / 2 - 60, 6, IVORY);
      var yV = H - 40;
      if (cells.length) { rule(M, yV - 30, W - M, [110, 100, 92], 0.4); strip(cells, M, yV, CW, [210, 200, 188], IVORY, [110, 100, 92], 'left'); }
      var base = cells.length ? yV - 48 : H - 56;
      cap(LINE, M, base, 7.5, A, { bold: true, ls: 2.6 });
      nameBlock(S.names, M, base - 20, CW - 18, IVORY, 'left', 104);
    }
    function fit2(t, z, maxW) { setF(LAB, 'normal', z); while (z > 4.5 && tw(t, 2) > maxW) { z -= 0.2; setF(LAB, 'normal', z); } return z; }

    /* ── 02 · profile (the comp card inside) ── */
    function vitalsTable(x0, y, cw, rowH, labC, valC, ruleC, strong) {
      cap('Vitals', x0, y, 6, labC, { bold: true, ls: 2.4 }); y += 8;
      rule(x0, y, x0 + cw, strong, 0.8);
      VITALS.forEach(function (r) {
        y += rowH;
        cap(r[0], x0, y - 3, 6, labC, { ls: 2 });
        var zv = fit(r[1], 'normal', 15, 8, cw - 60);
        disp(r[1], x0 + cw, y, zv, valC, { align: 'right' });
        rule(x0, y + 8, x0 + cw, ruleC, 0.4);
      });
      return y + 8;
    }
    function profile() {
      var fi = N > 1 ? 1 : 0, v = S.profile;
      if (v === 'band') {
        page(BG);
        var bh = 232, ph = H - bh;
        frame(fi, 0, 0, W, ph, 0.5, 0.3);
        motif(0, 0, W, ph, true);
        cap('The Profile', M, ph + 40, 6, A, { bold: true, ls: 2.6 });
        nameBlock(S.names === 'caps' ? 'caps' : 'stack', M, ph + 108, 250, INK, 'left', 34);
        setF('D', 'italic', 10.5);
        var who = split(role + (city ? ', based in ' + city : ''), 230).slice(0, 2), yy = ph + 134;
        who.forEach(function (l) { disp(l, M, yy, 10.5, SUB, { italic: true }); yy += 14; });
        // vitals in two columns
        var x0 = 318, cw2 = W - M - x0, half = Math.ceil(VITALS.length / 2), y0 = ph + 40;
        cap('Vitals', x0, y0, 6, SUB, { bold: true, ls: 2.4 });
        rule(x0, y0 + 8, W - M, INK, 0.8);
        VITALS.forEach(function (r, k) {
          var cxx = k < half ? x0 : x0 + cw2 / 2 + 10, wcol = cw2 / 2 - 10, ry = y0 + 8 + (k % half + 1) * 30;
          cap(r[0], cxx, ry - 3, 5.6, SUB, { ls: 1.8 });
          disp(r[1], cxx + wcol, ry, fit(r[1], 'normal', 13, 7, wcol - 44), INK, { align: 'right' });
          rule(cxx, ry + 8, cxx + wcol, RULE, 0.4);
        });
        foot(false, false);
        return;
      }
      if (v === 'overlay') {
        page(NIGHT);
        frame(fi, 0, 0, W, H, 0.5, 0.25);
        fade(H * 0.4, H, 0, 0.9, NIGHT);
        fade(0, 110, 0.4, 0, NIGHT);
        cap('The Profile', M, 56, 6, IVORY, { bold: true, ls: 2.6 });
        var cwO = 196, xO = W - M - cwO, yO = H - 72 - 8 - VITALS.length * 26;
        vitalsTableC(xO, yO, cwO);
        nameBlock(S.names, M, H - 92, xO - M - 30, IVORY, 'left', 46);
        setF('D', 'italic', 10.5);
        disp(role + (city ? ', ' + city : ''), M, H - 66, fit(role + (city ? ', ' + city : ''), 'italic', 10.5, 7, xO - M - 30), [220, 210, 196], { italic: true });
        foot(false, false);
        return;
      }
      // side: a full-length bleeding down one edge, the card in the other column
      page(BG);
      var iw = 318, left = S.profileSide === 'left';
      frame(fi, left ? 0 : W - iw, 0, iw, H, 0.5, 0.35);
      var x0s = left ? iw + 32 : M, cw = W - iw - 32 - M, y = 66;
      cap('The Profile', x0s, y, 6, A, { bold: true, ls: 2.6 });
      rule(x0s, y + 10, x0s + cw, RULE, 0.5);
      y += 56;
      var z1 = fit(first, 'normal', 36, 16, cw);
      if (S.names === 'caps' || !HAS_IT) {
        var fu = first.toUpperCase(), lu = last.toUpperCase();
        var zc = Math.min(fit(fu, 'normal', 30, 12, cw, 0.12), last ? fit(lu, 'normal', 30, 12, cw, 0.12) : 30);
        disp(fu, x0s, y, zc, INK, { ls: zc * 0.12 }); if (last) { y += zc * 1.1; disp(lu, x0s, y, zc, INK, { ls: zc * 0.12 }); }
      } else {
        disp(first, x0s, y, z1, INK);
        if (last) { var z2 = fit(last, 'italic', Math.min(36, z1), 14, cw); y += z2 * 1.02; disp(last, x0s, y, z2, INK, { italic: true }); }
      }
      y += 22;
      setF('D', 'italic', 10.5);
      split(role + (city ? ', based in ' + city : ''), cw).slice(0, 2).forEach(function (l) { disp(l, x0s, y, 10.5, SUB, { italic: true }); y += 14; });
      y += 14;
      if (VITALS.length) y = vitalsTable(x0s, y, cw, VITALS.length > 5 ? 28 : 32, SUB, INK, RULE, INK);
      if (about) {
        y += 30;
        disp('\u201c', x0s - 2, y + 14, 40, A);
        y += 6;
        setF('D', 'italic', 10);
        var lines = split(about, cw - 4), roomL = Math.max(2, Math.min(6, Math.floor((H - 130 - y) / 14.5)));
        if (lines.length > roomL) { lines = lines.slice(0, roomL); lines[roomL - 1] = lines[roomL - 1].replace(/[\s,;.:\u2013\u2014-]+\S*$/, '') + '\u2026'; }
        lines.forEach(function (l) { y += 14.5; disp(l, x0s + 4, y, 10, INK, { italic: true }); });
      }
      var yb = H - 84;
      cap('Castable for', x0s, yb, 6, SUB, { bold: true, ls: 2.4 });
      rule(x0s, yb + 8, x0s + cw, RULE, 0.4);
      var t = disc.join('  \u00b7  ');
      disp(t, x0s, yb + 25, fit(t, 'normal', 10.5, 6.5, cw), INK);
      cap('YKS Talents', x0s, H - 22, 5.6, SUB, { bold: true, ls: 2.2 });
      disp(num(pg), x0s + cw, H - 22, 8, INK, { italic: true, align: 'right' });
    }
    function vitalsTableC(x0, y, cw) {
      VITALS.forEach(function (r) {
        y += 26;
        cap(r[0], x0, y - 3, 5.6, [200, 190, 176], { ls: 1.8 });
        disp(r[1], x0 + cw, y, fit(r[1], 'normal', 13, 7, cw - 56), IVORY, { align: 'right' });
        rule(x0, y + 7, x0 + cw, [96, 88, 80], 0.4);
      });
    }

    /* ── photo pages: big, one or two to a page ── */
    function single(i, style) {
      if (style === 'margin') {
        page(BG);
        var g = 30, top = 30, hh = H - top - 74;
        frame(i, g, top, W - 2 * g, hh, 0.5, 0.3);
        motif(g, top, W - 2 * g, hh, true);
        var c = plateCap();
        disp(word(), g, H - 38, 15, INK, { italic: true });
        cap(c, W - g, H - 40, 6, SUB, { ls: 2, align: 'right' });
        if (T.motif === 'numeral') disp(num(plateNo), W - g - 4, top + 52, 46, IVORY, { italic: true, align: 'right' });
        cap('YKS Talents', g, H - 18, 5, SUB, { bold: true, ls: 2 });
        disp(num(pg), W - g, H - 18, 7, INK, { italic: true, align: 'right' });
        return;
      }
      if (style === 'feature') {
        page(BG);
        var bx = 150;
        frame(i, bx, 0, W - bx, H, 0.5, 0.3);
        var w = word(), zw = 72; setF('D', 'italic', zw); while (zw > 30 && tw(w) > H - 260) { zw -= 2; setF('D', 'italic', zw); }
        disp(w, 46 + zw * 0.74, H - 120, zw, INK, { italic: true, angle: 90 });
        disp(num(plateNo + 1), 44, 84, 22, A, { italic: true });
        cap(plateCap(), 44, H - 92, 5.8, SUB, { ls: 2 });
        if (T.motif === 'bar') box(A, bx - 6, 0, 6, 160);
        foot(false, false);
        return;
      }
      // bleed: the whole page
      page(NIGHT);
      frame(i, 0, 0, W, H, 0.5, 0.3);
      motif(0, 0, W, H, true);
      fade(H - 170, H, 0, 0.6, NIGHT);
      var lc = plateCap(), wd = word();
      if (T.motif === 'numeral') { disp(num(plateNo), M, H - 52, 40, IVORY, { italic: true }); cap(wd, M + 54, H - 56, 6, IVORY, { ls: 2.4 }); }
      else { disp(wd, M, H - 52, 24, IVORY, { italic: true }); if (T.motif === 'rule') rule(M, H - 44, M + 40, A, 1); }
      cap(lc, W - M, H - 54, 6, IVORY, { ls: 2.2, align: 'right' });
      cap('YKS Talents', M, H - 22, 5.6, [220, 212, 200], { bold: true, ls: 2.2 });
      disp(num(pg), W - M, H - 22, 8, IVORY, { italic: true, align: 'right' });
    }
    function land(i) {
      page(BG);
      var ar = P[i].w / P[i].h, hh = Math.min(Math.max(W / ar, 330), 520), y0 = Math.round((H - hh) / 2) - 10;
      frame(i, 0, y0, W, hh, 0.5, 0.4);
      motif(0, y0, W, hh, true);
      disp(word(), M, y0 - 30, 46, INK, { italic: true });
      var c = plateCap();
      cap(c, W - M, y0 + hh + 28, 6, SUB, { ls: 2, align: 'right' });
      if (T.motif === 'rule') rule(M, y0 + hh + 26, W - M - 80, RULE, 0.4);
      foot(false, true);
    }
    function stack(a, b) {
      page(BG);
      var g = 6, hh = (H - g) / 2;
      frame(a, 0, 0, W, hh, 0.5, 0.4);
      frame(b, 0, hh + g, W, hh, 0.5, 0.4);
      var c1 = plateCap(), c2 = plateCap();
      cap(c1, W - M, hh - 18, 5.8, IVORY, { ls: 2, align: 'right' });
      cap(c2, W - M, H - 40, 5.8, IVORY, { ls: 2, align: 'right' });
      foot(true, false);
    }
    function diptych(a, b) {
      page(BG);
      var g = 6, top = T.id === 'gallery' || T.id === 'linen' ? 54 : 0, bot = top ? 70 : 0, w = (W - g - (top ? 2 * 30 : 0)) / 2, x0 = top ? 30 : 0, hh = H - top - bot;
      frame(a, x0, top, w, hh, 0.5, 0.3);
      frame(b, x0 + w + g, top, w, hh, 0.5, 0.3);
      var c1 = plateCap(), c2 = plateCap();
      if (top) {
        disp(word(), x0, H - 38, 15, INK, { italic: true });
        cap(c1 + '  /  ' + c2.replace(/^\D+/, ''), W - x0, H - 40, 6, SUB, { ls: 2, align: 'right' });
        cap('YKS Talents', x0, top - 22, 5.4, SUB, { bold: true, ls: 2 });
        disp(num(pg), W - x0, top - 22, 7.5, INK, { italic: true, align: 'right' });
      } else {
        if (T.motif === 'bar') box(A, W / 2 - 3, 0, 6, 120);
        foot(true, false);
      }
    }
    function stagger(a, b) {
      page(BG);
      var w1 = 344, h1 = Math.round(w1 * 1.5), w2 = 300, h2 = Math.round(w2 * 1.5), bx = W - w2, by = H - h2;
      frame(a, 0, 0, w1, h1, 0.5, 0.3);
      box(BG, bx - 8, by - 8, w2 + 8, h2 + 8);
      frame(b, bx, by, w2, h2, 0.5, 0.3);
      var n1 = plateNo + 1;
      if (T.motif === 'numeral' || T.motif === 'rule') disp(num(n1), w1 + 22, 120, 76, A, { italic: true });
      else box(A, w1 + 22, 62, 30, 3);
      disp(word(), w1 + 24, 160, 18, INK, { italic: true });
      var c1 = plateCap(), c2 = plateCap();
      cap(c1, w1 + 24, 178, 5.8, SUB, { ls: 2 });
      cap(c2, M, h1 + 30, 5.8, SUB, { ls: 2 });
      cap('YKS Talents', M, H - 22, 5.6, SUB, { bold: true, ls: 2.2 });
    }
    function photos(ids) {
      var i = 0, singles = T.singles, pairs = T.pairs, si = Math.floor(R() * 3), pi = Math.floor(R() * 2);
      var pairP = S.pairP + (ids.length > 6 ? 0.2 : 0);
      while (i < ids.length) {
        var a = ids[i], b = ids[i + 1];
        if (landscape(a)) {
          if (b != null && landscape(b) && R() < 0.75) { stack(a, b); i += 2; }
          else { land(a); i++; }
          continue;
        }
        if (b != null && !landscape(b) && R() < pairP) { (pairs[(pi++) % pairs.length] === 'diptych' ? diptych : stagger)(a, b); i += 2; continue; }
        single(a, singles[(si++) % singles.length]); i++;
      }
    }

    /* ── last page: the card back — booking only through YKS ── */
    function back() {
      var dk = DARK || S.back === 'photo' ? true : false, bg = DARK ? BG : (S.back === 'photo' ? NIGHT : BG);
      if (!DARK && S.back !== 'photo') dk = false;
      var tc = dk ? IVORY : INK, sc = dk ? [196, 186, 172] : SUB, rc = dk ? [84, 76, 70] : RULE;
      page(bg);
      var yName;
      if (S.back === 'photo') {
        var ph = Math.round(H * 0.5), bi = N > 3 ? 3 : N - 1;
        frame(bi, 0, 0, W, ph, 0.5, 0.3);
        fade(ph - 120, ph, 0, 0.9, bg);
        cap('YKS Talents', M, 50, 6, IVORY, { bold: true, ls: 3 });
        yName = ph + 40;
      } else {
        cap('YKS Talents', M, 58, 6.5, tc, { bold: true, ls: 3 });
        cap('The Card', W - M, 58, 6.5, sc, { ls: 3, align: 'right' });
        rule(M, 70, W - M, rc, 0.4);
        yName = 136;
      }
      var full = first + (last ? ' ' + last : '');
      if (S.names === 'caps' || !HAS_IT) { var zc = fit(NAME_UP, 'normal', 34, 14, CW, 0.12); disp(NAME_UP, W / 2, yName, zc, tc, { align: 'center', ls: zc * 0.12 }); }
      else {
        var z1 = fit(full, 'normal', 40, 18, CW);
        setF('D', 'normal', z1); var wf = tw(first + ' '); setF('D', 'italic', z1); var wl = last ? tw(last) : 0;
        var nx = W / 2 - (wf + wl) / 2;
        disp(first, nx, yName, z1, tc); if (last) disp(last, nx + wf, yName, z1, tc, { italic: true });
      }
      var vl = CORE.map(function (r) { return r[0] + ' ' + r[1]; }).join('   \u00b7   ');
      if (vl) disp(vl, W / 2, yName + 30, fit(vl, 'italic', 11, 6, CW), sc, { italic: true, align: 'center' });
      if (S.back !== 'photo') {
        // one contact sheet: six frames in two rows (three in one row for short books), sized to fill the page
        var n = N >= 6 ? 6 : Math.min(3, N), pick = [];
        for (var k = 0; k < n; k++) pick.push(Math.round(k * (N - 1) / Math.max(1, n - 1)));
        pick = pick.filter(function (v, j) { return pick.indexOf(v) === j; });
        var cols = Math.min(3, pick.length), rows = Math.ceil(pick.length / cols), g = 8;
        var top = yName + 58, avail = H - 226 - top;
        var ch = Math.min((avail - g * (rows - 1)) / rows, 300), cw = Math.min((CW - g * (cols - 1)) / cols, ch / 1.42);
        ch = Math.min(ch, cw * 1.5);
        var gw = cols * cw + (cols - 1) * g, gx = (W - gw) / 2, gh = rows * ch + (rows - 1) * g, y0 = top + Math.max(0, (avail - gh) / 2);
        pick.forEach(function (pi, j) { frame(pi, gx + (j % cols) * (cw + g), y0 + Math.floor(j / cols) * (ch + g), cw, ch, 0.5, 0.3); });
      }
      var yb = H - 196;
      rule(M, yb, W - M, rc, 0.4);
      cap('Bookings', M, yb + 30, 6.5, A, { bold: true, ls: 2.6 });
      disp('Every booking goes', M, yb + 62, 22, tc);
      disp('through YKS Talents.', M, yb + 88, 22, tc, { italic: true });
      setF(LAB, 'normal', 7.4); col(sc);
      doc.text(doc.splitTextToSize('Availability, rates, full-resolution files and digitals on request. Please quote the talent\u2019s name when you get in touch.', 270), M, yb + 112, { lineHeightFactor: 1.55 });
      cap('yksproductions.com/talents', M, yb + 152, 6.5, tc, { ls: 1.8 });
      var qs = 92, qx = W - M - qs, qy = yb + 26;
      if (opts.qr && opts.qr(doc, 'https://wa.me/' + BOOK_WA + '?text=' + encodeURIComponent('Hi YKS, I\u2019d like to enquire about booking ' + name + ' (YKS Talents portfolio).'), qx, qy, qs)) {
        cap('Scan to enquire', qx + qs / 2, qy + qs + 16, 5.6, sc, { ls: 1.8, align: 'center' });
      }
      cap('YKS Talents', M, H - 22, 5.6, sc, { bold: true, ls: 2.2 });
      cap('yksproductions.com', W / 2, H - 22, 5.6, sc, { ls: 1.6, align: 'center' });
      disp(num(pg), W - M, H - 22, 8, tc, { italic: true, align: 'right' });
    }

    // photo sequence: close-up 2 stays near the front, the rest are shuffled per talent
    var restIds = []; for (var q = 2; q < N; q++) restIds.push(q);
    var lead = restIds.shift(), tail = restIds;
    for (var s = tail.length - 1; s > 0; s--) { var j = Math.floor(R() * (s + 1)), tmp = tail[s]; tail[s] = tail[j]; tail[j] = tmp; }
    var seq = lead == null ? [] : [lead].concat(tail);

    cover();
    if (S.profileEarly || seq.length < 2) { profile(); photos(seq); }
    else { photos(seq.slice(0, 1)); profile(); photos(seq.slice(1)); }
    back();
    return doc;
  }

  var FONT_FILES = { PF: ['/js/vendor/fonts-portfolio.js?v=1', 'YKS_PF_FONTS', [['Regular', 'normal'], ['Italic', 'italic']]],
    BD: ['/js/vendor/fonts-bodoni.js?v=1', 'YKS_BD_FONTS', [['Regular', 'normal'], ['Italic', 'italic']]],
    JS: ['/js/vendor/fonts-jost.js?v=1', 'YKS_JS_FONTS', [['Light', 'normal'], ['Medium', 'bold']]] };
  function registerFonts(doc, key) {
    var spec = FONT_FILES[key], F = spec && window[spec[1]];
    if (!F) return false;
    try {
      spec[2].forEach(function (p) { doc.addFileToVFS('YKS-' + key + '-' + p[0] + '.ttf', F[p[0]]); doc.addFont('YKS-' + key + '-' + p[0] + '.ttf', key, p[1]); doc.setFont(key, p[1]); });
      return true;
    } catch (e) { return false; }
  }
  function qrDraw(doc, url, x, y, size) {
    if (!window.qrcode) return 0;
    var qr; try { qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); } catch (e) { return 0; }
    var n = qr.getModuleCount(), quiet = 3, mod = size / (n + quiet * 2);
    doc.setFillColor(246, 240, 230); doc.rect(x, y, size, size, 'F');
    doc.setFillColor(14, 12, 16);
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) doc.rect(x + (c + quiet) * mod, y + (r + quiet) * mod, mod + 0.3, mod + 0.3, 'F');
    return size;
  }
  function makeDoc(JsPDF, key, on) {
    var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    var f = {}; if (on && registerFonts(doc, key)) f[key] = true;
    return { doc: doc, fonts: f };
  }

  // the whole build → the finished jsPDF doc
  function buildDoc(data) {
    var S = design(data), key = S.theme.font, spec = FONT_FILES[key];
    return Promise.all([
      load('/js/vendor/jspdf.umd.min.js', function () { return !!(window.jspdf && window.jspdf.jsPDF); }),
      load('/js/vendor/qrcode.min.js', function () { return !!window.qrcode; }),
      load(spec[0], function () { return !!window[spec[1]]; })
    ]).then(function (ok) {
      if (!ok[0]) throw new Error('lib');
      var files = (data.photos || []).slice(0, MAX_PHOTOS);
      if (!files.length) throw new Error('photos');
      // 1 · make each photo renderable and read its size (one at a time — phones run out of memory otherwise)
      var P = [];
      return files.reduce(function (p, f) {
        return p.then(function () {
          return toRenderable(f).then(function (b) {
            return decode(b).then(function (d) { P.push({ blob: b, w: d.img.naturalWidth, h: d.img.naturalHeight }); URL.revokeObjectURL(d.url); }, function () { /* undecodable → skipped */ });
          });
        });
      }, Promise.resolve()).then(function () { return P; });
    }).then(function (P) {
      if (!P.length) throw new Error('photos');
      var JsPDF = window.jspdf.jsPDF, on = true;
      var Q = data._q || 1;   // quality scale (talent-apply may ask for a lighter book)
      // 2 · plan pass: record every frame each photo needs
      var need = P.map(function () { return {}; });
      var plan = makeDoc(JsPDF, key, on);
      layout(plan.doc, P, data, function (i, x, y, w, h, fx, fy) { if (i == null || !P[i]) return; var k = Math.round(w) + 'x' + Math.round(h) + '@' + fx + ',' + fy; need[i][k] = { w: w, h: h, fx: fx, fy: fy }; }, { fonts: plan.fonts });
      // 3 · crop pass: decode each photo once, cut every frame it needs, let it go
      var crops = P.map(function () { return {}; });
      return P.reduce(function (p, ph, i) {
        return p.then(function () {
          return decode(ph.blob).then(function (d) {
            var im = d.img, iw = im.naturalWidth, ih = im.naturalHeight;
            Object.keys(need[i]).forEach(function (k) {
              var f = need[i][k], ar = f.w / f.h, sw, sh;
              if (iw / ih > ar) { sh = ih; sw = ih * ar; } else { sw = iw; sh = iw / ar; }
              var sx = (iw - sw) * f.fx, sy = (ih - sh) * f.fy;
              var ow = Math.max(8, Math.round(Math.min(sw, f.w * PPT * Q))), oh = Math.max(8, Math.round(ow / ar));
              var c = document.createElement('canvas'); c.width = ow; c.height = oh;
              var x = c.getContext('2d'); x.fillStyle = '#0e0c10'; x.fillRect(0, 0, ow, oh);
              x.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in x) x.imageSmoothingQuality = 'high';
              x.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
              crops[i][k] = c.toDataURL('image/jpeg', (f.w * f.h > 120000 ? 0.8 : 0.84) * (Q < 1 ? 0.94 : 1));
              c.width = c.height = 0;
            });
            URL.revokeObjectURL(d.url);
          });
        });
      }, Promise.resolve()).then(function () {
        // 4 · draw pass
        var real = makeDoc(JsPDF, key, on);
        var doc = real.doc;
        layout(doc, P, data, function (i, x, y, w, h, fx, fy) {
          if (i == null || !P[i]) return;
          var k = Math.round(w) + 'x' + Math.round(h) + '@' + fx + ',' + fy, src = crops[i][k]; if (!src) return;
          doc.addImage(src, 'JPEG', x, y, w, h, 'p' + i + '_' + k, 'NONE');
        }, { fonts: real.fonts, qr: qrDraw });
        doc.setProperties({ title: titleCase(data.name || '') + ' \u2014 YKS Talents portfolio', subject: 'YKS Talents portfolio', keywords: 'design:' + S.theme.id + '/' + S.cover + '/' + S.profile + '/' + S.back, creator: 'YKS Talents \u00b7 yksproductions.com', author: 'YKS Talents' });
        return doc;
      });
    });
  }
  function fileName(data) { return (String(data.name || '').replace(/[^a-z0-9 ]/gi, '').trim() || 'YKS') + ' \u2014 YKS Portfolio.pdf'; }

  window.YKSPortfolio = {
    version: VER,
    download: function (data) { return buildDoc(data).then(function (doc) { doc.save(fileName(data)); }); },
    blob: function (data) { return buildDoc(data).then(function (doc) { return doc.output('blob'); }); },
    design: function (data) { var S = design(data); return { theme: S.theme.id, themeName: S.theme.name, cover: S.cover, names: S.names, profile: S.profile, back: S.back, accent: S.accent }; },
    themes: THEMES.map(function (t) { return t.id; }),
    _stripContact: stripContact
  };
})();
