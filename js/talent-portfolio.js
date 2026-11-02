/* YKS Talents — portfolio PDF v2 ("The Book"), built with jsPDF on the applicant's own phone.
   Loaded by talent-apply.js: once inside the submit chain (the book is posted to the Apps Script
   with the photos and saved to Drive) and again for the applicant's own download.

   window.YKSPortfolio.blob(data)     → Promise<Blob>   (the PDF)
   window.YKSPortfolio.download(data) → Promise         (saves the PDF on the device)
   data = { name, category, city, about, stats:{ height, bust, waist, hips, shoe, hair, eyes }, photos:[File] }
   photos in book order: close-up 1 (cover), full-length, close-up 2, mid-shot, other, extras…

   Client-facing: the book NEVER prints the talent's phone, email, WhatsApp, Instagram or links;
   every enquiry routes through YKS. The intro is scrubbed of contact details before it prints.

   Built in two passes: pass 1 lays the book out on a throwaway doc and records every photo frame
   it needs (size + crop focus); then each photo is decoded once, cropped cover-style to each of its
   frames on a canvas (no distortion, never stretched) and released; pass 2 draws the real book. */
(function () {
  'use strict';
  var VER = '2.0';
  var W = 595.28, H = 841.89, M = 40, CW = W - 2 * M;
  // palette — YKS black/paper with the house amber, toned for print
  var NIGHT = [14, 12, 16], PAPER = [244, 239, 231], INK = [22, 19, 16], SUB = [128, 118, 106],
    IVORY = [246, 240, 230], MUTE = [196, 186, 172], AMBER = [205, 118, 58], RULE = [205, 196, 182];
  var DISC = { 'Model': ['Fashion', 'Editorial', 'Runway', 'Commercial'], 'Influencer / Creator': ['Content', 'Campaign', 'Reels', 'Commercial'], 'Actor': ['Film', 'Advertising', 'Editorial', 'Screen'] };
  var WORDS = ['Movement', 'Presence', 'Light', 'Character', 'Range', 'Form'];
  var PPT = 2.0;              // output pixels per point for photo crops (~150 dpi): sharp on screen and print, small file
  var MAX_PHOTOS = 12;
  var BOOK_WA = '919746679720';

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

  /* ════════════════════════ the book ════════════════════════
     layout(doc, P, D, frame): P = [{w,h}] photo sizes; frame(i,x,y,w,h,fx,fy) places photo i
     cover-cropped to the box. Pure layout: pass 1 records frames, pass 2 draws. */
  function layout(doc, P, D, frame, opts) {
    var FONT = opts.serif ? 'PF' : 'times';
    var N = P.length, pg = 0;
    var name = titleCase(D.name || 'YKS Talent'), parts = name.split(' ');
    var first = parts[0], last = parts.slice(1).join(' ');
    var NAME_UP = name.toUpperCase();
    var cat = String(D.category || 'Model').trim(), city = titleCase(stripContact(D.city || ''));
    var disc = DISC[cat] || DISC.Model;
    var about = stripContact(String(D.about || '').trim()).slice(0, 300);
    var st = D.stats || {};
    function sv(k) { var v = st[k]; return v ? stripContact(String(v)).trim() : ''; }
    var VITALS = [['Height', sv('height')], ['Bust', sv('bust')], ['Waist', sv('waist')], ['Hips', sv('hips')], ['Shoe', sv('shoe')], ['Hair', sv('hair')], ['Eyes', sv('eyes')]].filter(function (r) { return r[1]; });
    var SHORT = { Height: sv('heightShort') || sv('height') };

    /* ── type helpers ── */
    function col(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function setF(f, s, z) { doc.setFont(f, s || 'normal'); doc.setFontSize(z); }
    function tw(t, ls) { return doc.getTextWidth(t) + Math.max(0, t.length - 1) * (ls || 0); }
    // tracked caps label (Helvetica — a standard font, nothing to embed)
    function cap(t, x, y, z, c, o) {
      o = o || {}; t = String(t).toUpperCase(); setF('helvetica', o.bold ? 'bold' : 'normal', z); col(c);
      var ls = o.ls == null ? z * 0.32 : o.ls, w = tw(t, ls);
      if (o.align === 'right') x -= w; else if (o.align === 'center') x -= w / 2;
      doc.text(t, x, y, { charSpace: ls }); return w;
    }
    function serif(t, x, y, z, c, o) {
      o = o || {}; setF(FONT, o.italic ? 'italic' : 'normal', z); col(c);
      var ls = o.ls || 0, w = tw(t, ls);
      if (o.align === 'right') x -= w; else if (o.align === 'center') x -= w / 2;
      doc.text(t, x, y, ls ? { charSpace: ls } : {}); return w;
    }
    function fit(t, f, s, start, min, maxW, ls) { var z = start; setF(f, s, z); while (z > min && tw(t, (ls || 0)) > maxW) { z -= 0.5; setF(f, s, z); } return z; }
    function rule(x1, y, x2, c, lw) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(lw || 0.5); doc.line(x1, y, x2, y); }
    function vrule(x, y1, y2, c, lw) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(lw || 0.5); doc.line(x, y1, x, y2); }
    function bg(c) { doc.setFillColor(c[0], c[1], c[2]); doc.rect(0, 0, W, H, 'F'); }
    function box(c, x, y, w, h) { doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, y, w, h, 'F'); }
    function page(c) { if (pg) doc.addPage(); pg++; bg(c); }
    // smooth vertical fade: stacked low-opacity layers (no banding, no seams)
    function fade(y0, y1, op0, op1, c) {
      if (!doc.GState) return; c = c || NIGHT;
      var down = op1 >= op0, hi = Math.max(op0, op1), n = 70, a = 1 - Math.pow(1 - Math.min(hi, 0.995), 1 / n);
      function inv(v) { var lo = 0, up = 1; for (var it = 0; it < 26; it++) { var m = (lo + up) / 2, sm = m * m * (3 - 2 * m); if (sm * hi < v) lo = m; else up = m; } return (lo + up) / 2; }
      doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: a })); doc.setFillColor(c[0], c[1], c[2]);
      for (var k = 1; k <= n; k++) { var t = inv(1 - Math.pow(1 - a, k));
        if (down) { var ys = y0 + (y1 - y0) * t; doc.rect(0, ys, W, y1 - ys, 'F'); } else { var ye = y1 - (y1 - y0) * t; doc.rect(0, y0, W, ye - y0, 'F'); } }
      doc.restoreGraphicsState();
    }
    function landscape(i) { return P[i] && P[i].w > P[i].h * 1.05; }
    function num(n) { return ('0' + n).slice(-2); }
    function foot(dark) {
      var c = dark ? MUTE : SUB;
      cap('YKS Talents', M, H - 24, 6, c, { bold: true, ls: 2.4 });
      cap('yksproductions.com', W / 2, H - 24, 6, c, { ls: 1.8, align: 'center' });
      cap(NAME_UP.length > 30 ? (first + ' ' + (last ? last.charAt(0) + '.' : '')).toUpperCase() : NAME_UP, W - M - 26, H - 24, 6, c, { ls: 1.8, align: 'right' });
      serif(num(pg), W - M, H - 24, 8, dark ? IVORY : INK, { italic: true, align: 'right' });
    }
    function word(k) { return WORDS[k % WORDS.length]; }
    var plateNo = 0;
    function lookCap() { plateNo++; return 'Look ' + num(plateNo); }

    /* ── 01 · cover ── */
    function cover() {
      page(NIGHT);
      frame(0, 0, 0, W, H, 0.5, 0.3);
      fade(0, 190, 0.6, 0, NIGHT);
      fade(H * 0.42, H, 0, 0.94, NIGHT);
      // masthead
      serif('YKS', M, 58, 17, IVORY, { ls: 1.5 });
      setF(FONT, 'normal', 17); var yw = tw('YKS', 1.5);
      cap('Talents', M + yw + 8, 57, 6.5, IVORY, { ls: 3.2 });
      cap('The Portfolio', W - M, 51, 6.5, IVORY, { ls: 3.2, align: 'right' });
      serif('MMXXVI', W - M, 63, 8, MUTE, { italic: true, align: 'right', ls: 1.5 });
      // vertical spine
      setF('helvetica', 'normal', 6); col(MUTE);
      var spine = disc.join('  \u00b7  ').toUpperCase();
      doc.text(spine, W - 20, H / 2 + tw(spine, 2.6) / 2 - 60, { angle: 90, charSpace: 2.6 });
      // vitals strip
      var yV = H - 40, have = VITALS.length;
      if (have) {
        var cells = VITALS.slice(0, 7).map(function (r) { return [r[0], r[0] === 'Height' ? SHORT.Height : r[1]]; });
        var z = 12.5, gap = 22, total;
        for (;;) { setF(FONT, 'normal', z); total = cells.reduce(function (s, r) { return s + Math.max(tw(r[1]), tw(r[0].toUpperCase(), 1.6) * 6 / z); }, 0) + gap * (cells.length - 1); if (total <= CW || z <= 8) break; z -= 0.5; gap = Math.max(12, gap - 1); }
        var x = M;
        rule(M, yV - 30, W - M, [90, 82, 74], 0.4);
        cells.forEach(function (r, k) {
          setF(FONT, 'normal', z); var w = Math.max(tw(r[1]), tw(r[0].toUpperCase(), 1.6) * 6 / z);
          cap(r[0], x, yV - 15, 5.6, MUTE, { ls: 1.6 });
          serif(r[1], x, yV, z, IVORY);
          if (k < cells.length - 1) vrule(x + w + gap / 2, yV - 22, yV + 2, [90, 82, 74], 0.4);
          x += w + gap;
        });
      }
      var base = have ? yV - 48 : H - 56;
      // category line
      var line = cat + (city ? '  \u2014  ' + city : '');
      cap(line, M, base, 7.5, AMBER, { bold: true, ls: 2.6 });
      // the name: first in roman, surname in italic, both as large as the page allows
      var maxW = CW - 18;
      var zf = fit(first, FONT, 'normal', 104, 34, maxW, -1);
      var zl = last ? fit(last, FONT, 'italic', Math.min(zf * 0.92, 92), 26, maxW - 36, -0.5) : 0;
      // leave room for descenders (g, j, p, q, y) above the category line
      var desc = /[gjpqy]/.test(last || first), yL = base - 20 - (desc ? (last ? zl : zf) * 0.2 : 0);
      if (last) { serif(last, M + Math.min(36, maxW - tw(last, -0.5)), yL, zl, IVORY, { italic: true, ls: -0.5 }); }
      var yF = last ? yL - zl * 0.86 : yL;
      serif(first, M - zf * 0.04, yF, zf, IVORY, { ls: -1 });
    }

    /* ── 02 · profile (comp card inside) ── */
    function profile() {
      page(PAPER);
      var iw = 318, fi = N > 1 ? 1 : 0;
      frame(fi, 0, 0, iw, H, 0.5, 0.35);
      var x0 = iw + 34, cw = W - M - x0, y = 66;
      cap('The Profile', x0, y, 6.5, AMBER, { bold: true, ls: 2.6 });
      serif('N\u00ba 01', W - M, y, 8, SUB, { italic: true, align: 'right' });
      rule(x0, y + 10, W - M, RULE, 0.5);
      // name
      y += 56;
      var z1 = fit(first, FONT, 'normal', 38, 18, cw);
      serif(first, x0, y, z1, INK);
      if (last) { var z2 = fit(last, FONT, 'italic', Math.min(38, z1), 16, cw); y += z2 * 1.02; serif(last, x0, y, z2, INK, { italic: true }); }
      y += 22;
      var role = cat === 'Influencer / Creator' ? 'Creator' : cat;
      setF(FONT, 'italic', 11);
      var who = doc.splitTextToSize(role + (city ? ', based in ' + city : ''), cw).slice(0, 2);
      who.forEach(function (l) { serif(l, x0, y, 11, SUB, { italic: true }); y += 14; });
      y += 14;
      // vitals table
      if (VITALS.length) {
        cap('Vitals', x0, y, 6.2, SUB, { bold: true, ls: 2.4 }); y += 8;
        rule(x0, y, W - M, INK, 0.8);
        var rowH = VITALS.length > 5 ? 29 : 33;
        VITALS.forEach(function (r) {
          y += rowH;
          cap(r[0], x0, y - 3, 6.2, SUB, { ls: 2 });
          var zv = fit(r[1], FONT, 'normal', 16, 9, cw - 62);
          serif(r[1], W - M, y, zv, INK, { align: 'right' });
          rule(x0, y + 9, W - M, RULE, 0.4);
        });
        y += 9;
      }
      // the talent's own words
      if (about) {
        y += 34;
        serif('\u201c', x0 - 3, y + 14, 44, AMBER);
        y += 6;
        setF(FONT, 'italic', 10.5);
        var lines = doc.splitTextToSize(about, cw - 4), room = Math.max(2, Math.floor((H - 150 - y) / 15));
        if (lines.length > room) { lines = lines.slice(0, room); lines[room - 1] = lines[room - 1].replace(/[\s,;.:\u2013\u2014-]+\S*$/, '') + '\u2026'; }
        lines.forEach(function (l) { y += 15; serif(l, x0 + 4, y, 10.5, INK, { italic: true }); });
      }
      // castable for
      var yb = H - 96;
      cap('Castable for', x0, yb, 6.2, SUB, { bold: true, ls: 2.4 });
      rule(x0, yb + 8, W - M, RULE, 0.4);
      setF(FONT, 'normal', 11);
      var t = disc.join('  \u00b7  ');
      serif(t, x0, yb + 26, fit(t, FONT, 'normal', 11, 7, cw), INK);
      // footer on the paper side only
      cap('YKS Talents', x0, H - 24, 6, SUB, { bold: true, ls: 2.4 });
      serif(num(pg), W - M, H - 24, 8, INK, { italic: true, align: 'right' });
    }

    /* ── 03 · the close-ups: a big crop with a framed inset laid over its corner ── */
    function closeups() {
      if (N < 3) return;
      page(PAPER);
      var bx = 214, bh = H - 190;
      frame(2, bx, 0, W - bx, bh, 0.5, 0.32);
      cap('Close-up', M + 8, 70, 6.2, SUB, { bold: true, ls: 2.4 });
      serif(num(pg), M + 8, 86, 9, AMBER, { italic: true });
      var iw = 190, ih = 240, ix = M + 30, iy = bh - 150;
      // the department word, set vertically above the inset
      var room = (N > 3 ? iy - 40 : bh - 40) - 120, zw = 76;
      setF(FONT, 'italic', zw); while (zw > 30 && tw('Portrait') > room) { zw -= 2; setF(FONT, 'italic', zw); }
      col(INK); doc.text('Portrait', M + 8 + zw * 0.74, (N > 3 ? iy - 40 : bh - 40), { angle: 90 });
      if (N > 3) {
        box(PAPER, ix - 9, iy - 9, iw + 18, ih + 18);
        frame(3, ix, iy, iw, ih, 0.5, 0.3);
        cap('Mid-shot', ix, iy + ih + 24, 6, SUB, { ls: 2 });
      }
      var tx = 290, ty = bh + 46;
      serif('The face,', tx, ty, 22, INK);
      serif('up close.', tx, ty + 24, 22, INK, { italic: true });
      setF('helvetica', 'normal', 7.2); col(SUB);
      doc.text(doc.splitTextToSize('Close-ups and a mid-shot \u2014 exactly how the talent photographs, before the first call.', W - M - tx), tx, ty + 48, { lineHeightFactor: 1.55 });
      foot(false);
    }

    /* ── the rest of the book: asymmetric spreads chosen by how many photos remain ── */
    function plate(i, k) {
      if (landscape(i)) {
        page(PAPER);
        cap('Selected work', M, 66, 6.5, AMBER, { bold: true, ls: 2.6 });
        serif(word(k), M, 150, 64, INK, { italic: true });
        var ih = W / (P[i].w / P[i].h); ih = Math.min(Math.max(ih, 300), 420);
        frame(i, 0, 196, W, ih, 0.5, 0.4);
        var c = lookCap();
        serif(c, W - M, 196 + ih + 30, 11, INK, { italic: true, align: 'right' });
        rule(M, 196 + ih + 36, W - M - tw(c) - 14, RULE, 0.4);
        foot(false);
        return;
      }
      page(NIGHT);
      frame(i, 0, 0, W, H, 0.5, 0.32);
      fade(H - 200, H, 0, 0.78, NIGHT);
      fade(0, 110, 0.35, 0, NIGHT);
      cap('Selected work', M, 58, 6.2, IVORY, { bold: true, ls: 2.6 });
      serif(word(k), M, H - 66, 40, IVORY, { italic: true });
      serif(lookCap(), W - M, H - 66, 11, MUTE, { italic: true, align: 'right' });
      foot(true);
    }
    function head(label, k) {
      cap(label, M, 58, 6.2, AMBER, { bold: true, ls: 2.6 });
      serif(word(k), W - M, 60, 16, INK, { italic: true, align: 'right' });
      rule(M, 70, W - M, RULE, 0.4);
    }
    function trio(ids, k) {
      page(PAPER); head('Selected work', k);
      var y0 = 86, y1 = H - 58, g = 10, hh = y1 - y0;
      var land = ids.filter(landscape);
      if (land.length) {   // a landscape leads as a band, the other two sit beneath it
        var a = land[0], rest = ids.filter(function (x) { return x !== a; });
        var bh = Math.round(hh * 0.44);
        frame(a, M, y0, CW, bh, 0.5, 0.4);
        var cw = (CW - g) / 2;
        rest.forEach(function (id, j) { frame(id, M + j * (cw + g), y0 + bh + g, cw, hh - bh - g, 0.5, 0.3); });
      } else {
        var bw = Math.round(CW * 0.635), sw = CW - bw - g, sh = (hh - g) / 2;
        frame(ids[0], M, y0, bw, hh, 0.5, 0.32);
        frame(ids[1], M + bw + g, y0, sw, sh, 0.5, 0.3);
        frame(ids[2], M + bw + g, y0 + sh + g, sw, sh, 0.5, 0.3);
      }
      plateNo += 3;
      foot(false);
    }
    function duo(ids, k) {
      page(PAPER); head('Selected work', k);
      var a = ids[0], b = ids[1];
      if (landscape(a) || landscape(b)) {
        var L = landscape(a) ? a : b, O = L === a ? b : a;
        frame(L, 0, 86, W, 330, 0.5, 0.4);
        var ow = 236, oh = H - 58 - 446;
        frame(O, W - M - ow, 446, ow, oh, 0.5, 0.3);
        serif(num(plateNo + 1), M, 560, 96, AMBER, { italic: true });
        serif('& ' + num(plateNo + 2), M + 6, 600, 20, INK, { italic: true });
      } else {
        var w1 = 268, h1 = 392, w2 = 216, h2 = 338;
        frame(a, M, 96, w1, h1, 0.5, 0.3);
        frame(b, W - M - w2, H - 58 - h2, w2, h2, 0.5, 0.3);
        serif(num(plateNo + 1), M, 96 + h1 + 120, 112, AMBER, { italic: true });
        cap('Look ' + num(plateNo + 1) + '  /  ' + num(plateNo + 2), M + 4, 96 + h1 + 146, 6, SUB, { ls: 2 });
        setF(FONT, 'italic', 15); col(INK);
        doc.text(doc.splitTextToSize('Two frames, one direction \u2014 the range a client asks for.', w2), W - M - w2, 150, { lineHeightFactor: 1.35 });
      }
      plateNo += 2;
      foot(false);
    }
    function quad(ids, k) {
      page(PAPER); head('Selected work', k);
      var y0 = 86, y1 = H - 58, g = 10, hh = y1 - y0, cw = (CW - g) / 2, tall = Math.round((hh - g) * 0.6), short = hh - g - tall;
      // landscapes prefer the short (wider) cells
      var land = ids.filter(landscape), port = ids.filter(function (x) { return !landscape(x); });
      var shortIds = land.slice(0, 2), tallIds = [];
      port.forEach(function (x) { if (tallIds.length < 2) tallIds.push(x); else shortIds.push(x); });
      land.slice(2).forEach(function (x) { if (tallIds.length < 2) tallIds.push(x); else shortIds.push(x); });
      while (shortIds.length < 2 && tallIds.length > 2) shortIds.push(tallIds.pop());
      while (tallIds.length < 2 && shortIds.length > 2) tallIds.push(shortIds.pop());
      frame(tallIds[0], M, y0, cw, tall, 0.5, 0.3);
      frame(shortIds[0], M, y0 + tall + g, cw, short, 0.5, 0.35);
      frame(shortIds[1], M + cw + g, y0, cw, short, 0.5, 0.35);
      frame(tallIds[1], M + cw + g, y0 + short + g, cw, tall, 0.5, 0.3);
      plateNo += 4;
      foot(false);
    }
    var PLAN = { 1: [1], 2: [2], 3: [3], 4: [1, 3], 5: [3, 2], 6: [1, 3, 2], 7: [3, 1, 3], 8: [1, 3, 4] };
    function rest() {
      var ids = []; for (var i = 4; i < N; i++) ids.push(i);
      if (N === 4) return;   // nothing left
      var groups = PLAN[ids.length] || [], p = 0;
      groups.forEach(function (n, k) {
        var g = ids.slice(p, p + n); p += n;
        if (n === 1) plate(g[0], k); else if (n === 2) duo(g, k); else if (n === 3) trio(g, k); else quad(g, k);
      });
    }

    /* ── last page: the comp card back — every frame at a glance, the vitals, booking via YKS ── */
    function back() {
      page(NIGHT);
      cap('YKS Talents', M, 58, 6.5, IVORY, { bold: true, ls: 3 });
      cap('The Card', W - M, 58, 6.5, MUTE, { ls: 3, align: 'right' });
      rule(M, 70, W - M, [70, 64, 58], 0.4);
      var z1 = fit(first + (last ? ' ' + last : ''), FONT, 'normal', 40, 18, CW);
      setF(FONT, 'normal', z1); var wf = tw(first + ' ');
      setF(FONT, 'italic', z1); var wl = last ? tw(last) : 0;
      var nx = W / 2 - (wf + wl) / 2 + (last ? 0 : tw(' ') / 2);
      serif(first, nx, 140, z1, IVORY);
      if (last) serif(last, nx + wf, 140, z1, IVORY, { italic: true });
      var vl = VITALS.filter(function (r) { return /Height|Bust|Waist|Hips|Shoe/.test(r[0]); }).map(function (r) { return r[0] + ' ' + (r[0] === 'Height' ? SHORT.Height : r[1]); }).join('   \u00b7   ');
      if (vl) { var zv = fit(vl, FONT, 'italic', 11, 6, CW); serif(vl, W / 2, 170, zv, MUTE, { italic: true, align: 'center' }); }
      // contact sheet
      var cols = N <= 3 ? N : (N <= 6 ? 3 : 4), g = 8, rows = Math.ceil(N / cols);
      var top = 200, maxH = H - 226 - top, cw = (CW - g * (cols - 1)) / cols, ch = cw * 1.25;
      if (rows * ch + (rows - 1) * g > maxH) { ch = (maxH - (rows - 1) * g) / rows; cw = ch / 1.25; }
      var y0 = top + (maxH - (rows * ch + (rows - 1) * g)) / 2;
      var gw = cols * cw + (cols - 1) * g, gx = (W - gw) / 2;
      for (var i = 0; i < N; i++) {
        var r = Math.floor(i / cols), c = i % cols;
        var inRow = Math.min(cols, N - r * cols), rx = gx + (cols - inRow) * (cw + g) / 2;
        frame(i, rx + c * (cw + g), y0 + r * (ch + g), cw, ch, 0.5, 0.3);
      }
      // booking block
      var yb = H - 196;
      rule(M, yb, W - M, [70, 64, 58], 0.4);
      cap('Bookings', M, yb + 30, 6.5, AMBER, { bold: true, ls: 2.6 });
      serif('Every booking goes', M, yb + 62, 22, IVORY);
      serif('through YKS Talents.', M, yb + 88, 22, IVORY, { italic: true });
      setF('helvetica', 'normal', 7.6); col(MUTE);
      doc.text(doc.splitTextToSize('Availability, rates, full-resolution files and digitals on request. Please quote the talent\u2019s name when you get in touch.', 270), M, yb + 112, { lineHeightFactor: 1.55 });
      cap('yksproductions.com/talents', M, yb + 152, 6.5, IVORY, { ls: 1.8 });
      var qs = 92, qx = W - M - qs, qy = yb + 26;
      if (opts.qr && opts.qr(doc, 'https://wa.me/' + BOOK_WA + '?text=' + encodeURIComponent('Hi YKS, I\u2019d like to enquire about booking ' + name + ' (YKS Talents portfolio).'), qx, qy, qs)) {
        cap('Scan to enquire', qx + qs / 2, qy + qs + 16, 5.8, MUTE, { ls: 1.8, align: 'center' });
      }
      foot(true);
    }

    cover();
    profile();
    closeups();
    rest();
    back();
    return doc;
  }

  function registerFonts(doc) {
    var F = window.YKS_PF_FONTS;
    if (!F || !F.Regular || !F.Italic) return false;
    try {
      doc.addFileToVFS('YKS-PF-Regular.ttf', F.Regular); doc.addFont('YKS-PF-Regular.ttf', 'PF', 'normal');
      doc.addFileToVFS('YKS-PF-Italic.ttf', F.Italic); doc.addFont('YKS-PF-Italic.ttf', 'PF', 'italic');
      doc.setFont('PF', 'normal'); doc.setFont('PF', 'italic');
      return true;
    } catch (e) { return false; }
  }
  // the name must render in the embedded face; anything outside its Latin set falls back to Times
  function serifOk(D) { var s = String(D.name || '') + String(D.city || '') + String(D.about || ''); return !/[^\u0000-\u017f\u2010-\u2033\u2116\u2122]/.test(s); }
  function qrDraw(doc, url, x, y, size) {
    if (!window.qrcode) return 0;
    var qr; try { qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); } catch (e) { return 0; }
    var n = qr.getModuleCount(), quiet = 3, mod = size / (n + quiet * 2);
    doc.setFillColor(246, 240, 230); doc.rect(x, y, size, size, 'F');
    doc.setFillColor(14, 12, 16);
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) doc.rect(x + (c + quiet) * mod, y + (r + quiet) * mod, mod + 0.3, mod + 0.3, 'F');
    return size;
  }

  function makeDoc(JsPDF, fontsOn) {
    var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    var ok = fontsOn && registerFonts(doc);
    return { doc: doc, serif: !!ok };
  }

  // the whole build → the finished jsPDF doc
  function buildDoc(data) {
    return Promise.all([
      load('/js/vendor/jspdf.umd.min.js', function () { return !!(window.jspdf && window.jspdf.jsPDF); }),
      load('/js/vendor/qrcode.min.js', function () { return !!window.qrcode; }),
      load('/js/vendor/fonts-portfolio.js?v=1', function () { return !!window.YKS_PF_FONTS; })
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
      var JsPDF = window.jspdf.jsPDF, useSerif = serifOk(data);
      // 2 · plan pass: record every frame each photo needs
      var need = P.map(function () { return {}; });
      var plan = makeDoc(JsPDF, useSerif);
      layout(plan.doc, P, data, function (i, x, y, w, h, fx, fy) { if (i == null || !P[i]) return; var k = Math.round(w) + 'x' + Math.round(h) + '@' + fx + ',' + fy; need[i][k] = { w: w, h: h, fx: fx, fy: fy }; }, { serif: plan.serif });
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
              var ow = Math.max(8, Math.round(Math.min(sw, f.w * PPT))), oh = Math.max(8, Math.round(ow / ar));
              var c = document.createElement('canvas'); c.width = ow; c.height = oh;
              var x = c.getContext('2d'); x.fillStyle = '#0e0c10'; x.fillRect(0, 0, ow, oh);
              x.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in x) x.imageSmoothingQuality = 'high';
              x.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
              crops[i][k] = c.toDataURL('image/jpeg', f.w * f.h > 120000 ? 0.8 : 0.84);
              c.width = c.height = 0;
            });
            URL.revokeObjectURL(d.url);
          });
        });
      }, Promise.resolve()).then(function () {
        // 4 · draw pass
        var real = makeDoc(JsPDF, useSerif);
        var doc = real.doc, n = 0;
        layout(doc, P, data, function (i, x, y, w, h, fx, fy) {
          if (i == null || !P[i]) return;
          var k = Math.round(w) + 'x' + Math.round(h) + '@' + fx + ',' + fy, src = crops[i][k]; if (!src) return;
          doc.addImage(src, 'JPEG', x, y, w, h, 'p' + i + '_' + k, 'NONE');
          n++;
        }, { serif: real.serif, qr: qrDraw });
        doc.setProperties({ title: titleCase(data.name || '') + ' \u2014 YKS Talents portfolio', subject: 'YKS Talents portfolio', creator: 'YKS Talents \u00b7 yksproductions.com', author: 'YKS Talents' });
        return doc;
      });
    });
  }
  function fileName(data) { return (String(data.name || '').replace(/[^a-z0-9 ]/gi, '').trim() || 'YKS') + ' \u2014 YKS Portfolio.pdf'; }

  window.YKSPortfolio = {
    version: VER,
    download: function (data) { return buildDoc(data).then(function (doc) { doc.save(fileName(data)); }); },
    blob: function (data) { return buildDoc(data).then(function (doc) { return doc.output('blob'); }); },
    _stripContact: stripContact
  };
})();
