/* YKS Talents — portfolio PDF (jsPDF), built on the applicant's own device.
   Loaded ONLY by talent-apply.js after a passed application and the WhatsApp
   tap. It never uploads anything: the book is saved straight to the device.
   window.YKSPortfolio.download({ name, category, city, about, stats:{height}, photos:[File] }) */
(function () {
  'use strict';
  var DISC = { 'Model': 'Fashion · Editorial · Runway · Commercial', 'Influencer / Creator': 'Content · Campaign · Reels', 'Actor': 'Film · Ad · Editorial · Screen' };
  function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function stripContact(s) {
    if (!s) return '';
    return String(s)
      .replace(/\S+@\S+\.\S+/g, '')
      .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '')
      .replace(/@[\w.]+/g, '')
      .replace(/\b[a-z0-9-]+\.(?:com|in|net|co|org|me|link|io|to|xyz)\b(?:\/[^\s]*)?/gi, '')
      .replace(/[+(]?\d[\d\s().\-]{6,}\d/g, '')
      .replace(/\s{2,}/g, ' ').replace(/^[\s·|,\-]+|[\s·|,\-]+$/g, '').trim();
  }
  function load(src, test) {
    return new Promise(function (res) {
      if (test()) return res(true);
      var s = document.createElement('script'); s.src = src;
      s.onload = function () { res(test()); }; s.onerror = function () { res(false); };
      document.head.appendChild(s);
    });
  }
  function registerFonts(doc) {
    if (!window.YKS_FONTS) return;
    try {
      doc.addFileToVFS('YKSPlayfair.ttf', window.YKS_FONTS.Playfair); doc.addFont('YKSPlayfair.ttf', 'Playfair', 'normal'); doc.addFont('YKSPlayfair.ttf', 'Playfair', 'bold');
      doc.addFileToVFS('YKSOswald.ttf', window.YKS_FONTS.Oswald); doc.addFont('YKSOswald.ttf', 'Oswald', 'normal'); doc.addFont('YKSOswald.ttf', 'Oswald', 'bold');
    } catch (e) {}
  }
  function isHeic(f) { return /image\/hei[cf]/i.test(f.type) || /\.(heic|heif)$/i.test(f.name || ''); }
  function toRenderable(f) {
    if (!isHeic(f)) return Promise.resolve(f);
    return load('/js/vendor/heic2any.min.js', function () { return !!window.heic2any; }).then(function (ok) {
      if (!ok) return f;
      return window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.9 }).then(function (o) { return Array.isArray(o) ? o[0] : o; }, function () { return f; });
    });
  }
  function prepImg(file, ar, outW) {   // centre-crop to 4:5 + downscale
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var iw = img.width, ih = img.height, sar = iw / ih, cw, ch;
        if (sar > ar) { ch = ih; cw = ih * ar; } else { cw = iw; ch = iw / ar; }
        var oW = outW, oH = Math.round(outW / ar);
        var c = document.createElement('canvas'); c.width = oW; c.height = oH;
        c.getContext('2d').drawImage(img, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, oW, oH);
        res({ data: c.toDataURL('image/jpeg', 0.82), w: oW, h: oH, cat: '', fit: false });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = rej; img.src = URL.createObjectURL(file);
    });
  }
  function deliver(doc, filename, cfg) { if (cfg && typeof cfg.onDoc === 'function') cfg.onDoc(doc, filename); else doc.save(filename); }

  function buildPortfolio(JsPDF, imgs, name, cfg) {
    var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    registerFonts(doc);
    var W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
    var BG = cfg.bg, TX = cfg.text, SUB = cfg.sub, AC = cfg.accent, F = cfg.font;
    if ((F === 'Playfair' || F === 'Oswald') && !doc.getFontList()[F]) F = 'helvetica';   // font failed to load → safe fallback
    var D = cfg.data || {}; var cat = String(D.category || 'Model').trim(), city = String(D.city || '').trim();
    // the bio prints in the book, so it is scrubbed exactly like the tagline — a talent must never be
    // able to slip a number, handle or link into the portfolio and route bookings around YKS.
    var about = stripContact(String(D.about || '').trim());
    var disc = DISC[cat] || 'Fashion · Editorial · Commercial', NM = name.toUpperCase();
    var TAG = '';   // signature line, contact scrubbed
    function st(k) { var v = (D.stats || {})[k]; return v ? String(v).trim() : ''; }
    var STATS = [['Height', st('height')], ['Bust', st('bust')], ['Waist', st('waist')], ['Hips', st('hips')], ['Shoe', st('shoe')], ['Hair', st('hair')], ['Eyes', st('eyes')], ['Skin', st('skin')]].filter(function (r) { return r[1]; });
    // Every template is a house-style book now and shows all photos in the flow (digitals are captioned
    // like any other plate), so nothing is split off — splitting here would silently drop those photos.
    var digitals = [];
    function fill() { doc.setFillColor.apply(doc, BG); doc.rect(0, 0, W, H, 'F'); }
    function ct(c) { doc.setTextColor.apply(doc, c); }
    function place(im, x, y, w) { doc.addImage(im.data, 'JPEG', x, y, w, w / 0.8); }   // imgs are pre-cropped 4:5
    function ruleY(y) { doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.7); doc.line(M, y, W - M, y); }
    // Branding is the boxed YKS logo lockup + running header/footer — NOT a tiled watermark.
    // (A stamped watermark cheapened every page; removed. Kept as a no-op since many templates call it.)
    function watermark() {}
    function foot() {
      ruleY(H - 54);
      doc.setFont(F, 'normal'); doc.setFontSize(7.5); ct(SUB);
      doc.text('REPRESENTED BY YKS PRODUCTIONS', M, H - 40);
      doc.text('BOOKINGS  +91 97466 79720   ·   YKSPRODUCTIONS.COM', W - M, H - 40, { align: 'right' });
    }
    function coverFill(im, x, y, bw, bh) { var s = Math.max(bw / im.w, bh / im.h), w = im.w * s, h = im.h * s; doc.addImage(im.data, 'JPEG', x + (bw - w) / 2, y + (bh - h) / 2, w, h); }
    // full-bleed placement that respects a photo's "fit whole" choice — fit = show the entire photo (never cropped)
    function bleed(im, x, y, bw, bh) {
      if (im.fit) { doc.setFillColor.apply(doc, BG); doc.rect(x, y, bw, bh, 'F'); var s = Math.min(bw / im.w, bh / im.h), w = im.w * s, h = im.h * s; doc.addImage(im.data, 'JPEG', x + (bw - w) / 2, y + (bh - h) / 2, w, h); }
      else { coverFill(im, x, y, bw, bh); }
    }
    function shade(y, hgt, op) { if (doc.setGState) { doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: op })); doc.setFillColor(8, 6, 12); doc.rect(0, y, W, hgt, 'F'); doc.restoreGraphicsState(); } }
    var SAVE = (name.replace(/[^a-z0-9 ]/gi, '').trim() || 'YKS') + ' — YKS Portfolio.pdf';
    // scan-to-book: a QR straight to YKS's WhatsApp, name pre-filled — booking always routes through YKS
    var bookURL = 'https://wa.me/919746679720?text=' + encodeURIComponent('Hi YKS, I’d like to book ' + name + ' — saw their YKS portfolio.');
    function drawQR(url, x, y, size) {
      if (!window.qrcode) return 0;
      var qr; try { qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); } catch (e) { return 0; }
      var n = qr.getModuleCount(), quiet = 4, mod = size / (n + quiet * 2);
      doc.setFillColor(255, 255, 255); doc.roundedRect(x, y, size, size, 5, 5, 'F');
      doc.setFillColor(17, 17, 17);
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) doc.rect(x + (c + quiet) * mod, y + (r + quiet) * mod, mod + 0.35, mod + 0.35, 'F');
      return size;
    }
    // dedicated casting page for unretouched "digitals" (front/profile/full-length, natural light)
    function digitalsPage() {
      if (!digitals.length) return;
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('DIGITALS', M, 58);
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text('UNRETOUCHED   ·   ' + NM, W - M, 58, { align: 'right' }); ruleY(70);
      var shown = digitals.slice(0, 6), per = shown.length <= 2 ? shown.length : 3;
      var gap = 16, cw = (CW - gap * (per - 1)) / per, ch = cw / 0.8, y0 = 92;
      shown.forEach(function (im, k) { doc.addImage(im.data, 'JPEG', M + (k % per) * (cw + gap), y0 + Math.floor(k / per) * (ch + gap), cw, ch); });
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('Natural light · no retouching · shown as-is for casting.', M, H - 70);
      foot();
    }
    // shared closing "BOOK" page — big CTA + scan-to-book QR (editorial & lookbook)
    function bookPage() {
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('BOOKINGS', M, 58);
      doc.setFont(F, 'bold'); doc.setFontSize(30); ct(TX); doc.text('BOOK', M, H / 2 - 16); doc.text(NM, M, H / 2 + 22);
      doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(SUB); doc.text('Represented exclusively by YKS Productions.', M, H / 2 + 60); doc.text('+91 97466 79720     ·     yksproductions.com', M, H / 2 + 80);
      var qs = 128, qx = W - M - qs, qy = H / 2 - 44;
      if (drawQR(bookURL, qx, qy, qs)) { doc.setFont(F, 'normal'); doc.setFontSize(7.5); ct(SUB); doc.text('SCAN TO BOOK THROUGH YKS', qx + qs / 2, qy + qs + 15, { align: 'center' }); }
    }

    /* ══ SHARED HOUSE STYLE — the Shalini-grade component system (cover · profile · plates · spreads · closing) used by the premium templates. Own light+dark palette independent of the kit theme, so pages never render as empty dark voids. ══ */
    var NIGHT = [12, 10, 16], PAPER = [255, 255, 255], INK = [20, 20, 22], INKSUB = [140, 138, 134], LIGHT = [244, 240, 232], MUTE = [196, 190, 180], GOLD = [184, 145, 47], HFA = AC;
    var HF = 'helvetica', LG = 'times', hsPg = 1;
    // one spacing scale for the whole book — every gap is a multiple of SP, so the rhythm
    // stays even down the page instead of a different hand-picked number at each block.
    var SP = 8, SP_LABEL = SP * 3, SP_BLOCK = SP * 6, SP_ROW = SP * 2.75;
    function hbg(c) { doc.setFillColor.apply(doc, c); doc.rect(0, 0, W, H, 'F'); }
    function hWidth(txt, ls) { return doc.getTextWidth(txt) + Math.max(0, txt.length - 1) * ls; }
    function htk(str, x, y, sz, c, o) {
      o = o || {}; doc.setFont(HF, o.bold ? 'bold' : 'normal'); doc.setFontSize(sz); ct(c);
      var txt = o.upper === false ? String(str) : String(str).toUpperCase();
      var ls = o.ls == null ? 1.3 : o.ls, align = o.align || 'left';
      // jsPDF aligns on the UNSPACED width, so letter-spaced right/centre text spills past the margin.
      // Measure it ourselves and draw from the left instead.
      if (align !== 'left') {
        var w = hWidth(txt, ls);
        x = (align === 'right') ? x - w : x - w / 2;
        align = 'left';
      }
      doc.text(txt, x, y, { align: align, charSpace: ls });
    }
    function hhair(x1, y, x2, c, lw) { doc.setDrawColor.apply(doc, c); doc.setLineWidth(lw || 0.8); doc.line(x1, y, x2, y); }
    function hnp(c) { doc.addPage(); hsPg++; hbg(c); }
    function hlum(c) { return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
    function hnbleed(im, x, y, bw, bh) { if (im.fit) { doc.setFillColor.apply(doc, NIGHT); doc.rect(x, y, bw, bh, 'F'); var s = Math.min(bw / im.w, bh / im.h), w = im.w * s, h = im.h * s; doc.addImage(im.data, 'JPEG', x + (bw - w) / 2, y + (bh - h) / 2, w, h); } else coverFill(im, x, y, bw, bh); }
    function hlogoBox(x, y, w, c) { var h = w * 0.60, cx = x + w / 2; doc.setDrawColor.apply(doc, c); doc.setLineWidth(0.9); doc.rect(x, y, w, h); doc.setFont(LG, 'normal'); ct(c); doc.setFontSize(w * 0.285); doc.text('YKS', cx, y + h * 0.50, { align: 'center', charSpace: 1 }); var py = y + h * 0.80, word = 'PRODUCTIONS', ws = 1.3; doc.setFont(HF, 'normal'); doc.setFontSize(w * 0.064); var tw = doc.getTextWidth(word) + (word.length - 1) * ws; doc.text(word, cx - tw / 2, py, { charSpace: ws }); doc.setLineWidth(0.5); var gap = w * 0.08, dash = w * 0.085; doc.line(cx - tw / 2 - gap - dash, py - 2.5, cx - tw / 2 - gap, py - 2.5); doc.line(cx + tw / 2 + gap, py - 2.5, cx + tw / 2 + gap + dash, py - 2.5); }
    // a very long name would run into the left-hand label, so the running head uses a short form
    var NM_SHORT = (function () {
      var parts = NM.split(/\s+/);
      if (NM.length <= 26 || parts.length < 2) return NM.slice(0, 26);
      var last = parts[parts.length - 1], first = parts[0];
      var short = first + ' ' + last;
      return short.length <= 26 ? short : (first.slice(0, 14) + ' ' + last.charAt(0));
    })();
    function hRunHead(left, onDark) {
      var c = onDark ? LIGHT : INK;
      htk(left, M, 60, 8, c, { bold: true, ls: 1.5 });
      htk(NM_SHORT + '  /  ' + ('0' + hsPg).slice(-2), W - M, 60, 8, c, { bold: true, align: 'right', ls: 1.5 });
      hhair(M, 72, W - M, onDark ? GOLD : INK, 1.1);
    }
    function hPaperFoot() { hhair(M, H - 56, W - M, INK, 1.1); htk('+91 97466 79720', M, H - 40, 7.5, INKSUB, { ls: 1.1 }); htk('YKSPRODUCTIONS893@GMAIL.COM', W - M, H - 40, 7.5, INKSUB, { align: 'right', ls: 1.1 }); }
    function hPlateFoot(cap) { hhair(M, H - 44, W - M, GOLD, 0.8); htk(cap, M, H - 28, 8, GOLD, { bold: true, ls: 1.5 }); htk(NM_SHORT + '  /  ' + ('0' + hsPg).slice(-2), W - M, H - 28, 8, GOLD, { align: 'right', ls: 1.5 }); }
    function hFit(str, f, wt, start, min, maxW, ls) { var s = start, t = String(str).toUpperCase(); doc.setFont(f, wt); while (s > min) { doc.setFontSize(s); if (doc.getTextWidth(t) + Math.max(0, t.length - 1) * (ls || 0) <= maxW) break; s -= 1; } return s; }
    // the talent's own voice — this is THEIR portfolio, so it reads first person, never YKS describing them
    function hBio() { if (about) return about; var role = (cat === 'Actor' ? 'actor' : (/Influencer|Creator/i.test(cat) ? 'model and digital creator' : 'model')); var where = city ? ' based in ' + city : ''; return "I'm a " + role + where + ', working across ' + disc.toLowerCase() + ". I'm equally at home on a controlled studio call and on looser, content-led shoots — so I'm as castable for a lookbook as for a campaign built to live on a phone. I take direction quickly, I'm precise on the marks, and I can hold a look for as long as the frame needs."; }
    // soft vertical fade: thin strips of rising opacity, so no hard edge ever shows on the photo
    // soft vertical fade with no seams: n nested layers of the same low opacity, each running to the
    // solid end, so they only ever stack (never butt edge to edge). Layer starts are placed so the
    // stacked coverage follows a smoothstep from op0 to op1 (op0 < op1 fades in going down; swap to fade up).
    function hfade(y0, y1, op0, op1, c) { if (!doc.setGState) return; c = c || [8, 6, 12];
      var down = op1 >= op0, hi = Math.max(op0, op1), n = 160, a = 1 - Math.pow(1 - Math.min(hi, 0.995), 1 / n);
      function inv(v) { var lo = 0, up = 1; for (var it = 0; it < 30; it++) { var m = (lo + up) / 2, sm = m * m * (3 - 2 * m); if (sm * hi < v) lo = m; else up = m; } return (lo + up) / 2; }
      doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: a })); doc.setFillColor.apply(doc, c);
      for (var k = 1; k <= n; k++) { var cov = 1 - Math.pow(1 - a, k), t = inv(cov);
        if (down) { var ys = y0 + (y1 - y0) * t; doc.rect(0, ys, W, y1 - ys, 'F'); }
        else { var ye = y1 - (y1 - y0) * t; doc.rect(0, y0, W, ye - y0, 'F'); } }
      doc.restoreGraphicsState(); doc.setGState(new doc.GState({ opacity: 1 })); }
    function hsCover(hero) { hbg(NIGHT);
      // measure the text block first, then size the dark panel to hold it with real padding
      var edW = 150, gutter = 26, nameMaxW = W - M - edW - gutter - M, PADT = 38, PADB = 46;
      var discLs = 2, discSize = hFit(disc, HF, 'bold', 8.5, 5.5, CW, discLs);
      if (discSize < 7) { discLs = 1; discSize = hFit(disc, HF, 'bold', 8.5, 5.5, CW, discLs); }
      var parts = NM.split(' '), l1 = parts[0], l2 = parts.slice(1).join(' '); if (!l2) l1 = NM;
      var ns = Math.min(hFit(l1, HF, 'bold', 40, 13, nameMaxW), l2 ? hFit(l2, HF, 'bold', 40, 13, nameMaxW) : 40);
      var lh = ns * 1.04, nameH = (l2 ? 2 : 1) * lh;
      var blockH = discSize + 14 + 0.8 + 18 + Math.max(nameH, 54);
      var bandH = Math.max(176, PADT + blockH + PADB), by = H - bandH, FADE = 130;
      // photo runs under the fade and stops inside the solid panel, so the crop line is never visible
      hnbleed(hero, 0, 0, W, by);
      hfade(by - FADE, by, 0, 1, NIGHT); doc.setFillColor.apply(doc, NIGHT); doc.rect(0, by, W, bandH, 'F');
      hfade(0, 190, 0.55, 0, NIGHT);   // top: soft darkening behind the logo, no edge
      hlogoBox(M, 44, 118, LIGHT);
      var y = by + PADT + discSize * 0.75;
      htk(disc, M, y, discSize, GOLD, { bold: true, ls: discLs });
      y += 14; hhair(M, y, W - M, GOLD, 0.6); y += 18;
      doc.setFont(HF, 'bold'); doc.setFontSize(ns); ct(LIGHT);
      var ny = y + ns * 0.76; doc.text(l1, M, ny); if (l2) doc.text(l2, M, ny + lh);
      htk('TALENT PORTFOLIO', W - M, y + 10, 8.5, MUTE, { align: 'right', ls: 2 }); htk('EDITION 2026 / 01', W - M, y + 28, 8.5, MUTE, { align: 'right', ls: 2 }); htk('EXCLUSIVE · YKS', W - M, y + 46, 8.5, GOLD, { align: 'right', ls: 2 }); return l1; }
    function hsProfile(figImg) { hnp(PAPER); hRunHead('YKS PRODUCTIONS — TALENT PORTFOLIO'); var yTop = 116; htk('PROFILE', M, yTop, 9, INKSUB, { bold: true, ls: 2 }); var LCW = 250, NMW = W - M - 200 - 20 - M; var pns = hFit(NM, HF, 'bold', 30, 18, NMW); doc.setFont(HF, 'bold'); doc.setFontSize(pns); ct(INK); var nml = doc.splitTextToSize(NM, NMW).slice(0, 3); doc.text(nml, M, yTop + SP_LABEL + 10, { lineHeightFactor: 1.1 }); var nmExtra = (nml.length - 1) * pns * 1.1; doc.setFont(HF, 'normal'); doc.setFontSize(10.5); ct(INK); var blAll = doc.splitTextToSize(hBio(), LCW), bmax = nml.length > 2 ? 7 : (nml.length > 1 ? 9 : 11), bl = blAll.slice(0, bmax); if (blAll.length > bmax) { var last = bl[bmax - 1].replace(/[\s,;.:–—-]+\S*$/, ''); bl[bmax - 1] = last + '…'; } var bioY = yTop + SP_BLOCK + SP_LABEL + nmExtra; doc.text(bl, M, bioY, { lineHeightFactor: 1.5 }); var ly = bioY + bl.length * 15.6 + SP_BLOCK; htk('CASTABLE FOR', M, ly, 9, INKSUB, { bold: true, ls: 2 }); ly += SP_LABEL; var cx2 = M, cy2 = ly; doc.setFont(HF, 'normal'); doc.setFontSize(9.5); disc.split(' · ').forEach(function (t) { var tw = doc.getTextWidth(t) + 22; if (cx2 + tw > M + LCW) { cx2 = M; cy2 += SP * 4; } doc.setDrawColor.apply(doc, HFA); doc.setLineWidth(0.9); doc.roundedRect(cx2, cy2 - 14, tw, 24, 3, 3, 'S'); ct(INK); doc.text(t, cx2 + 11, cy2 + 2); cx2 += tw + 8; }); var RW = 200, rx = W - M - RW, fy = 130, fig = figImg || imgs[1] || imgs[0]; if (fig) { place(fig, rx, fy, RW); var fby = fy + RW / 0.8; htk('FIG. 01 — ' + ((fig.cat || 'FULL LENGTH')), rx, fby + SP_LABEL, 8, GOLD, { bold: true, ls: 1.5 }); hhair(rx, fby + SP_LABEL + 10, W - M, GOLD, 0.8); } var my = fy + RW / 0.8 + SP_BLOCK + SP * 2; htk('MEASUREMENTS', rx, my, 9, INKSUB, { bold: true, ls: 2 }); my += SP; STATS.slice(0, 9).forEach(function (r) { my += SP_ROW; hhair(rx, my - 15, W - M, INK, 0.5); htk(r[0], rx, my, 8, INKSUB, { ls: 1.2 }); doc.setFont(HF, 'bold'); doc.setFontSize(9.5); ct(INK); doc.text(r[1], W - M, my, { align: 'right' }); }); htk('REPRESENTED BY', M, H - 150, 9, INKSUB, { bold: true, ls: 2 }); hlogoBox(M, H - 150 + SP * 1.5, 96, INK); htk('+91 97466 79720', M + 112, H - 116, 9, INK, { bold: true, ls: 0.5, upper: false }); htk('yksproductions893@gmail.com', M + 112, H - 100, 8.5, INKSUB, { ls: 0.5, upper: false }); hPaperFoot(); }
    function hsPlate(im, cap) { hnp(NIGHT); hnbleed(im, 0, 0, W, H); shade(H - 90, 90, 0.34); hPlateFoot(cap); }
    function hsSpread(a, b, section, capA, capB, statement) { hnp(PAPER); hRunHead(section); var g = 22, cw = (CW - g) / 2, yy = 100, ph = cw / 0.8; [a, b].forEach(function (im, k) { if (im) place(im, M + k * (cw + g), yy, cw); }); [a, b].forEach(function (im, k) { if (im) htk(k ? capB : capA, M + k * (cw + g), yy + ph + 22, 8, INKSUB, { ls: 1.3 }); }); if (statement) {
        hhair(M, H - 150, W - M, INK, 1.1);
        // the statement gets its own column so it can never run into the note on the right
        var noteW = 186, gap2 = 22, stW = CW - noteW - gap2;
        var ds = disc.split(' · ').map(function (x) { return x.toUpperCase(); });
        var l1s = ds.slice(0, Math.ceil(ds.length / 2)).join(' · ') + ' ·', l2s = ds.slice(Math.ceil(ds.length / 2)).join(' · ');
        var ss = hFit(l1s.length > l2s.length ? l1s : l2s, HF, 'bold', 25, 11, stW);
        doc.setFont(HF, 'bold'); doc.setFontSize(ss); ct(INK);
        doc.text(l1s, M, H - 122); doc.text(l2s, M, H - 122 + ss * 1.12);
        doc.setFont(HF, 'normal'); doc.setFontSize(8.5); ct(INKSUB);
        doc.text(doc.splitTextToSize('Straight colour or a black-and-white conversion — no retouching. Full-resolution files, additional looks and video on request.', noteW), W - M, H - 128, { align: 'right', lineHeightFactor: 1.4 });
        htk('SELECTED WORK', W - M, H - 88, 8, INKSUB, { align: 'right', ls: 1.3 });
      } hPaperFoot(); }
    function hsCenter(im, cap) { hnp(PAPER); hRunHead('PLATE — ' + ((im.cat || 'SELECTED'))); var w = 336, x = (W - w) / 2, y = 118; place(im, x, y, w); htk(cap, W / 2, y + w / 0.8 + 26, 8, GOLD, { bold: true, ls: 1.5, align: 'center' }); hhair(W / 2 - 40, y + w / 0.8 + 36, W / 2 + 40, GOLD, 0.8); hPaperFoot(); }
    /* comp-card back — the agency standard: 2×2 of range + a measurements band */
    function hsCompBack() {
      hnp(PAPER); hRunHead('COMP CARD');
      var grid = imgs.slice(1, 5); if (!grid.length) grid = imgs.slice(0, 1);
      // fit the 2×2 to the space ABOVE the measurements band so nothing ever collides
      var gy = 96, gBot = H - 232, g = 16, rows = Math.min(2, Math.ceil(grid.length / 2));
      var ch = (gBot - gy - (rows - 1) * g) / rows, cw = ch * 0.8;
      var cols = Math.min(2, grid.length), gw = cols * cw + (cols - 1) * g, gx = (W - gw) / 2;
      grid.slice(0, 4).forEach(function (im, k) { place(im, gx + (k % 2) * (cw + g), gy + Math.floor(k / 2) * (ch + g), cw); });
      var sy = H - 214;
      htk('MEASUREMENTS', M, sy, 9, INKSUB, { bold: true, ls: 2 });
      hhair(M, sy + 9, W - M, INK, 1.1);
      var half = Math.ceil(STATS.length / 2), colW = CW / 2 - 14;
      STATS.forEach(function (r, k) {
        var col = k < half ? 0 : 1, row = k < half ? k : k - half, x = M + col * (CW / 2 + 14), y = sy + 30 + row * 17;
        htk(r[0], x, y, 8, INKSUB, { ls: 1.2 });
        doc.setFont(HF, 'bold'); doc.setFontSize(9); ct(INK); doc.text(r[1], x + colW, y, { align: 'right' });
      });
      htk('REPRESENTED BY YKS PRODUCTIONS', M, H - 84, 8, INKSUB, { ls: 1.4 });
      hlogoBox(W - M - 72, H - 106, 72, INK);
      hPaperFoot();
    }
    /* contact sheet — shows range at a glance */
    function hsGrid(list, section) {
      hnp(PAPER); hRunHead(section || 'SELECTED WORK');
      var per = list.length <= 4 ? 2 : 3, g = 14, cw = (CW - g * (per - 1)) / per, ch = cw / 0.8, gy = 100;
      list.forEach(function (im, k) {
        var x = M + (k % per) * (cw + g), y = gy + Math.floor(k / per) * (ch + g + 16);
        place(im, x, y, cw);
        htk(('0' + (k + 1)).slice(-2) + ' — ' + ((im.cat || 'LOOK')), x, y + ch + 11, 7, INKSUB, { ls: 1.1 });
      });
      hPaperFoot();
    }
    /* clip drawing to a box — cover-filling a half page would otherwise spill over the rest of the sheet */
    function clipBox(x, y, w, h, fn) {
      if (doc.saveGraphicsState && doc.clip) {
        doc.saveGraphicsState();
        doc.rect(x, y, w, h, null);   // null style = path only; a painted path would clip everything away
        doc.clip(); if (doc.discardPath) doc.discardPath();
        fn();
        doc.restoreGraphicsState();
      } else fn();
    }
    /* full-bleed diptych — two frames sharing one page, no margin */
    function hsDuo(a, b, cap) {
      hnp(NIGHT);
      var half = H / 2;
      if (a) clipBox(0, 0, W, half, function () { hnbleed(a, 0, 0, W, half); });
      if (b) clipBox(0, half, W, H - half, function () { hnbleed(b, 0, half, W, H - half); });
      doc.setDrawColor.apply(doc, GOLD); doc.setLineWidth(1.6); doc.line(0, half, W, half);
      shade(H - 74, 74, 0.42);
      hPlateFoot(cap || 'DIPTYCH');
    }
    function hsClosing(firstName) { hnp(HFA); var onA = hlum(HFA) > 0.62 ? INK : [255, 255, 255], onAsub = hlum(HFA) > 0.62 ? [80, 70, 60] : [255, 255, 255]; htk('BOOKING', M, 60, 8, onA, { bold: true, ls: 1.6 }); htk(NM_SHORT + '  /  ' + ('0' + hsPg).slice(-2), W - M, 60, 8, onA, { bold: true, align: 'right', ls: 1.6 }); hhair(M, 72, W - M, onA, 1.1); var cs2 = hFit(firstName, HF, 'bold', 58, 18, CW); doc.setFont(HF, 'bold'); doc.setFontSize(cs2); ct(onA); doc.text('BOOK', M, 400); doc.text(firstName, M, 400 + cs2 * 1.08); htk('PHONE', M, 512, 8.5, onAsub, { ls: 1.6 }); doc.setFont(HF, 'bold'); doc.setFontSize(13); ct(onA); doc.text('+91 97466 79720', M + 110, 512); htk('EMAIL', M, 540, 8.5, onAsub, { ls: 1.6 }); doc.setFont(HF, 'bold'); doc.setFontSize(13); ct(onA); doc.text('yksproductions893@gmail.com', M + 110, 540, { charSpace: 0 }); hhair(M, H - 96, W - M, onA, 1.1); doc.setFont(HF, 'normal'); doc.setFontSize(8.5); ct(onA); doc.text(doc.splitTextToSize('Represented exclusively by YKS Productions. Rates, availability and full-resolution files on request.', 320), M, H - 76, { lineHeightFactor: 1.4 }); hlogoBox(W - M - 100, H - 108, 100, onA); }

    /* ── TEMPLATE: Lookbook (fashion, photo-forward — full-bleed plates) ── */
    function tplLookbook() { var fn = hsCover(imgs[0]); var n = 1; imgs.slice(1, 8).forEach(function (im) { hsPlate(im, 'LOOK ' + ('0' + (n++)).slice(-2) + ' — ' + ((im.cat || 'EDITORIAL'))); }); hsProfile(); hsClosing(fn); }
    /* ── TEMPLATE: Minimal (airy — one centred plate per page) ── */
    function tplMinimal() { var fn = hsCover(imgs[0]); hsProfile(); imgs.slice(2, 7).forEach(function (im, k) { hsCenter(im, 'PLATE ' + ('0' + (k + 1)).slice(-2) + ' — ' + ((im.cat || 'SELECTED'))); }); hsClosing(fn); }
    /* ── TEMPLATE: Comp Card (agency standard — face front, grid + stats back) ── */
    /* ══ Every template composes the shared house style — same premium branding, distinct book structure. ══ */
    function plateCap(im, n, fallback) { return 'PLATE ' + ('0' + n).slice(-2) + ' — ' + ((im && im.cat) || fallback || 'SELECTED'); }
    /* Comp Card — the 2-page agency standard */
    function tplCompCard() { hsCover(imgs[0]); hsCompBack(); }
    /* Contact sheet — range at a glance */
    function tplGrid() { var fn = hsCover(imgs[0]); hsGrid(imgs.slice(1, 10), 'SELECTED WORK'); hsProfile(); hsClosing(fn); }
    /* Feature — hero-led magazine: big plates carry it */
    function tplFeature() {
      var fn = hsCover(imgs[0]);
      if (imgs[1]) hsPlate(imgs[1], plateCap(imgs[1], 1, 'FEATURE'));
      hsProfile(imgs[2] || imgs[1]);
      if (imgs[3] || imgs[4]) hsSpread(imgs[3], imgs[4], 'FEATURE — RANGE', plateCap(imgs[3], 2, 'LOOK'), plateCap(imgs[4], 3, 'LOOK'), true);
      if (imgs[5]) hsPlate(imgs[5], plateCap(imgs[5], 4, 'PORTRAIT'));
      hsClosing(fn);
    }
    /* Diptych — paired full-bleed frames */
    function tplDuo() {
      var fn = hsCover(imgs[0]), rest = imgs.slice(1), n = 1;
      for (var i = 0; i < rest.length && i < 6; i += 2) hsDuo(rest[i], rest[i + 1], 'DIPTYCH ' + ('0' + (n++)).slice(-2));
      hsProfile(); hsClosing(fn);
    }
    /* Structured — profile first, then the sheet (Swiss/Bento family) */
    function tplStructured() { var fn = hsCover(imgs[0]); hsProfile(); hsGrid(imgs.slice(1, 10), 'PORTFOLIO — SELECTED'); hsClosing(fn); }
    /* Gallery — photo-forward full-bleed plates (Luxe/Wabi family) */
    function tplGallery() {
      var fn = hsCover(imgs[0]), n = 1;
      imgs.slice(1, 5).forEach(function (im) { hsPlate(im, plateCap(im, n++, 'EDITORIAL')); });
      hsProfile();
      if (imgs[5] || imgs[6]) hsSpread(imgs[5], imgs[6], 'SELECTED WORK', plateCap(imgs[5], n++, 'LOOK'), plateCap(imgs[6], n++, 'LOOK'), false);
      hsClosing(fn);
    }
    /* Centred — airy, one plate per page (Classic/Ethereal family) */
    function tplCentred() { var fn = hsCover(imgs[0]); hsProfile(); imgs.slice(1, 7).forEach(function (im, k) { hsCenter(im, plateCap(im, k + 1, 'SELECTED')); }); hsClosing(fn); }
    /* ── TEMPLATE: Editorial (YKS house style — the flagship editorial book) ── */
    function tplEditorial() { var fn = hsCover(imgs[0]); hsProfile(); if (imgs[2]) hsPlate(imgs[2], 'PLATE 01 — ' + ((imgs[2].cat || 'EDITORIAL'))); if (imgs[3] || imgs[4]) hsSpread(imgs[3], imgs[4], 'EDITORIAL — MOVEMENT', 'PLATE 02 — ' + ((imgs[3] && imgs[3].cat) || 'THREE-QUARTER'), 'PLATE 03 — ' + ((imgs[4] && imgs[4].cat) || 'PROFILE'), true); if (imgs[5]) hsPlate(imgs[5], 'PLATE 04 — ' + ((imgs[5].cat || 'PORTRAIT'))); if (imgs[6] || imgs[7]) hsSpread(imgs[6], imgs[7], 'EDITORIAL — SELECTED', 'PLATE 05 — ' + ((imgs[6] && imgs[6].cat) || 'LOOK'), 'PLATE 06 — ' + ((imgs[7] && imgs[7].cat) || 'LOOK'), false); hsClosing(fn); }
    // every layout key → its house-style book (all share the YKS branding; the structure is what differs)
    var HOUSE = {
      lookbook: tplLookbook, minimal: tplMinimal, compcard: tplCompCard, grid: tplGrid,
      feature: tplFeature, duo: tplDuo,
      swiss: tplStructured, bento: tplStructured,
      luxe: tplGallery, wabi: tplGallery,
      classic: tplCentred, ethereal: tplCentred
    };
    if (HOUSE[cfg.template]) { HOUSE[cfg.template](); deliver(doc, SAVE, cfg); return; }

    // ── Editorial (default / flagship) — the YKS house-style book ──
    tplEditorial();
    deliver(doc, SAVE, cfg);
  }

  // build(data, onDoc): onDoc(doc) gets the finished jsPDF doc instead of a save (used to upload the
  // applicant's book with the application); without it the PDF downloads as before.
  function build(data, onDoc) {
      return Promise.all([
        load('/js/vendor/jspdf.umd.min.js', function () { return !!(window.jspdf && window.jspdf.jsPDF); }),
        load('/js/vendor/qrcode.min.js', function () { return !!window.qrcode; }),
        load('/js/vendor/fonts.js', function () { return !!window.YKS_FONTS; })
      ]).then(function (ok) {
        if (!ok[0]) throw new Error('lib');
        return Promise.all((data.photos || []).slice(0, 3).map(function (f) { return toRenderable(f).then(function (r) { return prepImg(r, 0.8, 1000); }); }));
      }).then(function (imgs) {
        if (!imgs.length) throw new Error('photos');
        buildPortfolio(window.jspdf.jsPDF, imgs, data.name || 'YKS', {
          bg: hexRgb('#14111a'), text: hexRgb('#f4ede2'), sub: hexRgb('#b0a892'), accent: hexRgb('#d47a3a'),
          font: window.YKS_FONTS ? 'Playfair' : 'helvetica', template: 'editorial', data: data, onDoc: onDoc
        });
      });
  }
  window.YKSPortfolio = {
    download: function (data) { return build(data); },
    blob: function (data) {
      var out = null;
      return build(data, function (doc) { out = doc.output('blob'); }).then(function () {
        if (!out) throw new Error('pdf'); return out;
      });
    }
  };
})();
