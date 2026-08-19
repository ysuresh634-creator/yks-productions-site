/* YKS Talents — registration flow.
   Human-first: many photos of any size, an AI-assisted "About" writer,
   autosave, and a WhatsApp fallback. Files upload straight to Cloudinary
   (no email size cap); the notification e-mail carries the links.

   ── ONE-TIME SETUP (YKS) ───────────────────────────────────────────
   Create a free Cloudinary account (no card), add an *unsigned* upload
   preset, then drop the two values in here: */
   var CLOUDINARY_CLOUD  = 'sn15r86h';     // your Cloudinary "cloud name"
   var CLOUDINARY_PRESET = 'yks_talents';  // the unsigned upload preset name
/* Until they're filled, details still submit and files fall back to
   WhatsApp — so the form is never broken. ─────────────────────────── */

(function () {
  'use strict';
  var WEB3FORMS_KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
  var WA_NUMBER = '919746679720';
  var DRAFT_KEY = 'yks_talent_draft';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var form = $('#talForm');
  if (!form) return;

  var photos = [];   // { file, id, url }
  var pdf = null;    // File
  var uid = 0;

  /* ── portfolio customiser: the talent's own theme / font / accent ── */
  var CFG = { theme: 'noir', font: 'playfair', accent: '#d47a3a' };
  var THEMES = {
    noir:      { bg: '#14111a', text: '#f4ede2', sub: '#b0a892', label: 'Noir' },
    charcoal:  { bg: '#26242b', text: '#f0ece5', sub: '#a8a29a', label: 'Charcoal' },
    slate:     { bg: '#1b2230', text: '#eef1f6', sub: '#94a0b4', label: 'Slate' },
    forest:    { bg: '#162019', text: '#eef0e8', sub: '#93a693', label: 'Forest' },
    ivory:     { bg: '#f1e9da', text: '#1a1510', sub: '#7a7264', label: 'Ivory' },
    sand:      { bg: '#e8dcc6', text: '#241d12', sub: '#8a7a5c', label: 'Sand' },
    blush:     { bg: '#f3e6df', text: '#2a1c1c', sub: '#8a6f6f', label: 'Blush' },
    porcelain: { bg: '#ffffff', text: '#14110d', sub: '#8a8078', label: 'Porcelain' }
  };
  var FONTS = {
    playfair: { css: "'Playfair Display',Georgia,serif", pdf: 'Playfair', embed: true, label: 'Didone' },
    serif:    { css: "Georgia,'Times New Roman',serif", pdf: 'times', label: 'Serif' },
    oswald:   { css: "'Oswald',sans-serif", pdf: 'Oswald', embed: true, label: 'Display' },
    sans:     { css: "'Inter',system-ui,sans-serif", pdf: 'helvetica', label: 'Sans' },
    mono:     { css: "'Space Grotesk',ui-monospace,monospace", pdf: 'courier', label: 'Mono' }
  };
  var ACCENTS = ['#d47a3a', '#c0392b', '#b8912e', '#2a9d8f', '#8a7fd6', '#d16a8a', '#3b6fd4', '#7a8b3a', '#b0552b', '#7d4b7d', '#c9a24b', '#e2ddd3'];
  var DISC = { 'Model': 'Fashion · Editorial · Runway · Commercial', 'Influencer / Creator': 'Content · Campaign · Reels', 'Actor': 'Film · Ad · Editorial · Screen' };
  function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ══ photos: pick / drop / preview / reorder / remove ══ */
  var photoInput = $('#apPhotos'), photoDrop = $('#apDrop'), thumbs = $('#apThumbs');
  function addPhotos(list) {
    Array.prototype.forEach.call(list, function (f) {
      if (!/^image\//.test(f.type)) return;
      photos.push({ file: f, id: ++uid, url: URL.createObjectURL(f) });
    });
    renderThumbs();
  }
  function idxOf(id) { for (var i = 0; i < photos.length; i++) if (photos[i].id === id) return i; return -1; }
  function renderThumbs() {
    thumbs.innerHTML = '';
    photos.forEach(function (item, idx) {
      var fig = document.createElement('div'); fig.className = 'ap-thumb'; fig.dataset.id = item.id; fig.draggable = true;
      var img = document.createElement('img'); img.src = item.edited || item.url; img.alt = '';
      img.addEventListener('click', function () { openCrop(item); }); fig.appendChild(img);
      var ed = document.createElement('span'); ed.className = 'ap-edit-hint'; ed.textContent = '✎ Adjust';
      ed.addEventListener('click', function () { openCrop(item); }); fig.appendChild(ed);
      if (idx === 0) { var bd = document.createElement('span'); bd.className = 'ap-cover-badge'; bd.textContent = 'COVER'; fig.appendChild(bd); }
      else {
        var mk = document.createElement('button'); mk.type = 'button'; mk.className = 'ap-mkcover'; mk.textContent = 'Set cover';
        mk.addEventListener('click', function () { var i = idxOf(item.id); if (i > 0) { photos.unshift(photos.splice(i, 1)[0]); renderThumbs(); } });
        fig.appendChild(mk);
      }
      var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'ap-rm'; rm.setAttribute('aria-label', 'Remove photo'); rm.textContent = '×';
      rm.addEventListener('click', function () { var i = idxOf(item.id); if (i >= 0) { URL.revokeObjectURL(photos[i].url); photos.splice(i, 1); renderThumbs(); } });
      fig.appendChild(rm);
      var bar = document.createElement('span'); bar.className = 'ap-thumb-bar'; fig.appendChild(bar);
      fig.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', String(item.id)); fig.classList.add('dragging'); });
      fig.addEventListener('dragend', function () { fig.classList.remove('dragging'); });
      fig.addEventListener('dragover', function (e) { e.preventDefault(); });
      fig.addEventListener('drop', function (e) { e.preventDefault(); var from = idxOf(+e.dataTransfer.getData('text/plain')), to = idxOf(item.id); if (from < 0 || to < 0 || from === to) return; photos.splice(to, 0, photos.splice(from, 1)[0]); renderThumbs(); });
      thumbs.appendChild(fig);
    });
    reflectPhotoCount(); updatePreview();
  }
  function reflectPhotoCount() {
    var b = $('#apDropLabel');
    if (b) b.textContent = photos.length ? photos.length + (photos.length === 1 ? ' photo — first is your cover' : ' photos — first is your cover') : 'Add photos';
  }

  /* ══ per-photo crop / adjust editor (pan + zoom) ══ */
  var cropModal = $('#apCrop'), cropImg = $('#apCropImg'), cropFrame = $('#apCropFrame'), cropZoom = $('#apCropZoom');
  var cropS = null;
  function openCrop(item) {
    if (!cropModal) return;
    cropModal.hidden = false; document.documentElement.style.overflow = 'hidden';
    var nat = new Image();
    nat.onload = function () {
      var fw = cropFrame.clientWidth || 300, fh = cropFrame.clientHeight || 375;
      var base = Math.max(fw / nat.width, fh / nat.height);
      cropS = { item: item, nat: nat, fw: fw, fh: fh, base: base, zoom: 1 };
      cropS.tx = (fw - nat.width * base) / 2; cropS.ty = (fh - nat.height * base) / 2;
      cropImg.src = nat.src; cropZoom.value = 1; applyCrop();
    };
    nat.src = item.url;
  }
  function applyCrop() {
    if (!cropS) return;
    var s = cropS.base * cropS.zoom, w = cropS.nat.width * s, h = cropS.nat.height * s;
    cropS.tx = Math.min(0, Math.max(cropS.fw - w, cropS.tx));
    cropS.ty = Math.min(0, Math.max(cropS.fh - h, cropS.ty));
    cropImg.style.width = w + 'px'; cropImg.style.height = h + 'px';
    cropImg.style.transform = 'translate(' + cropS.tx + 'px,' + cropS.ty + 'px)';
  }
  function closeCrop() { if (cropModal) cropModal.hidden = true; document.documentElement.style.overflow = ''; cropS = null; }
  if (cropModal) {
    cropZoom.addEventListener('input', function () { if (cropS) { cropS.zoom = parseFloat(cropZoom.value) || 1; applyCrop(); } });
    var drag = false, dx, dy, otx, oty;
    var cdown = function (x, y) { if (!cropS) return; drag = true; dx = x; dy = y; otx = cropS.tx; oty = cropS.ty; };
    var cmove = function (x, y) { if (!drag) return; cropS.tx = otx + (x - dx); cropS.ty = oty + (y - dy); applyCrop(); };
    cropFrame.addEventListener('mousedown', function (e) { e.preventDefault(); cdown(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { cmove(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function () { drag = false; });
    cropFrame.addEventListener('touchstart', function (e) { cdown(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    cropFrame.addEventListener('touchmove', function (e) { cmove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    cropFrame.addEventListener('touchend', function () { drag = false; });
    $('#apCropSave').addEventListener('click', function () {
      if (!cropS) return;
      var s = cropS.base * cropS.zoom;
      var sx = -cropS.tx / s, sy = -cropS.ty / s, sw = cropS.fw / s, sh = cropS.fh / s;
      var outW = 900, outH = Math.round(outW * cropS.fh / cropS.fw);
      var c = document.createElement('canvas'); c.width = outW; c.height = outH;
      c.getContext('2d').drawImage(cropS.nat, sx, sy, sw, sh, 0, 0, outW, outH);
      cropS.item.edited = c.toDataURL('image/jpeg', 0.85);
      closeCrop(); renderThumbs();
    });
    $('#apCropReset').addEventListener('click', function () { if (cropS) { cropS.item.edited = null; closeCrop(); renderThumbs(); } });
    $('#apCropCancel').addEventListener('click', closeCrop);
    cropModal.addEventListener('click', function (e) { if (e.target === cropModal) closeCrop(); });
  }
  if (photoInput) {
    photoDrop.addEventListener('click', function () { photoInput.click(); });
    photoDrop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); photoInput.click(); } });
    photoInput.addEventListener('change', function () { addPhotos(photoInput.files); photoInput.value = ''; });
    dropZone(photoDrop, function (files) { addPhotos(files); });
  }

  /* ══ portfolio pdf ══ */
  var pdfInput = $('#apPdf'), pdfDrop = $('#apPdfDrop'), pdfName = $('#apPdfName');
  function setPdf(f) {
    if (!f) return;
    pdf = f;
    pdfName.hidden = false;
    pdfName.innerHTML = '';
    var t = document.createElement('span'); t.textContent = '📄 ' + f.name;
    var rm = document.createElement('button'); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove file'); rm.textContent = '×';
    rm.addEventListener('click', function () { pdf = null; pdfName.hidden = true; pdfName.innerHTML = ''; });
    pdfName.appendChild(t); pdfName.appendChild(rm);
  }
  if (pdfInput) {
    pdfDrop.addEventListener('click', function () { pdfInput.click(); });
    pdfDrop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pdfInput.click(); } });
    pdfInput.addEventListener('change', function () { setPdf(pdfInput.files[0]); pdfInput.value = ''; });
    dropZone(pdfDrop, function (files) { for (var i = 0; i < files.length; i++) { if (/pdf/.test(files[i].type)) { setPdf(files[i]); break; } } });
  }

  function dropZone(el, onFiles) {
    ['dragenter', 'dragover'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.preventDefault(); el.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.preventDefault(); el.classList.remove('drag'); }); });
    el.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) onFiles(e.dataTransfer.files); });
  }

  /* ══ AI-assisted "About" writer ══ */
  var aiPanel = $('#apAi'), aboutBox = $('#apAbout');
  var pick = { role: '', exp: '', tone: 'warm', length: 'medium', loves: [], seed: 0 };
  var openBtn = $('#apAiOpen');
  if (openBtn) openBtn.addEventListener('click', function () {
    aiPanel.hidden = !aiPanel.hidden;
    openBtn.textContent = aiPanel.hidden ? '✨ Write it for me' : '✕ Close the writer';
  });
  $$('.ap-chips').forEach(function (group) {
    var key = group.dataset.k, multi = group.classList.contains('ap-multi');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (multi) {
        b.classList.toggle('on');
        pick.loves = $$('button.on', group).map(function (x) { return x.dataset.v; });
      } else {
        $$('button', group).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); pick[key] = b.dataset.v;
      }
    });
  });

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function list(arr) {
    arr = arr.slice(0);
    if (arr.length <= 1) return arr.join('');
    var last = arr.pop(); return arr.join(', ') + ' and ' + last;
  }
  function pickV(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
  function compose() {
    var seed = pick.seed || 0;
    var role = (pick.role || (form.category && form.category.value) || 'model').toLowerCase().replace('influencer / creator', 'content creator');
    var city = (form.city && form.city.value || '').trim();
    var loves = pick.loves.slice(0, 3);
    var tone = pick.tone || 'warm', length = pick.length || 'medium';
    var proud = ($('#apProud') && $('#apProud').value || '').trim();
    var desc = loves.length ? list(loves).toLowerCase() + ' ' : '';
    var s1 = cap(desc + role) + (city ? ' based in ' + city : '') + '.';
    var expMap = {
      start: ["I'm just starting out and bring real energy to every set", "new to the industry and hungry for great work"],
      early: ["I've spent a couple of years in front of the camera", "with a couple of years of shoots behind me"],
      several: ["I've got several years of shoots behind me", "with several years on set"],
      pro: ["I'm very comfortable on any kind of set", "seasoned on set, across studio and location"]
    };
    var styleMap = {
      warm: [". I take direction easily and love the collaborative side of a shoot.", ". I'm easy to work with and love a set that feels like a team."],
      confident: [". I take direction well, work fast, and hold a look for as long as the frame needs.", ". Precise, quick and reliable, frame to frame."],
      editorial: [". I read light and lines instinctively and give an editor plenty to cut from.", ". Strong on pose and story — made for the page."],
      bold: [". I bring presence and never shy from a strong concept.", ". Big energy, sharp looks, unafraid of a bold brief."],
      elegant: [". Poised and precise, with a clean, timeless quality on camera.", ". Refined and composed, at home in a quiet, elevated frame."],
      playful: [". I bring good energy, take direction, and I'm always up for something new.", ". Fun on set, expressive, and game for anything."],
      minimal: [" — reliable, quick to take direction, easy to work with.", " — clean, professional, low-fuss on set."]
    };
    var closerMap = {
      warm: " I'd love to be part of your next shoot.", confident: " Ready for your next campaign.",
      editorial: " Open to editorial, campaign and lookbook work.", bold: " Bring me your boldest brief.",
      elegant: " Available for considered, elevated work.", playful: " Let's make something good together.",
      minimal: " Available for bookings."
    };
    var s2 = cap(pickV(expMap[pick.exp] || expMap.several, seed)) + pickV(styleMap[tone] || styleMap.warm, seed);
    var s3 = '';
    if (proud) {
      var lead = { warm: 'A recent highlight — ', confident: 'Recent work includes ', editorial: 'Selected work — ', bold: 'Proudest moment — ', elegant: 'Recently — ', playful: 'Proudest bit so far — ', minimal: 'Selected: ' };
      s3 = ' ' + (lead[tone] || lead.warm) + proud + (/[.!?]$/.test(proud) ? '' : '.');
    }
    var closer = closerMap[tone] || closerMap.warm;
    var out = (length === 'short') ? (s1 + s3 + closer) : (s1 + ' ' + s2 + s3 + closer);
    return out.replace(/\s+/g, ' ').trim();
  }
  var goBtn = $('#apAiGo'), regenBtn = $('#apAiRegen');
  if (goBtn) goBtn.addEventListener('click', function () {
    pick.seed = 0;
    aboutBox.value = compose();
    aboutBox.dispatchEvent(new Event('input'));
    aboutBox.focus();
    goBtn.textContent = 'Rewrite →';
    if (regenBtn) regenBtn.hidden = false;
  });
  if (regenBtn) regenBtn.addEventListener('click', function () {
    pick.seed = (pick.seed || 0) + 1;
    aboutBox.value = compose();
    aboutBox.dispatchEvent(new Event('input'));
    aboutBox.focus();
  });

  /* ══ autosave draft (text only) ══ */
  var textNames = ['name', 'contact', 'category', 'region', 'city', 'socials', 'about'];
  try {
    var saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    textNames.forEach(function (n) { if (form[n] != null && saved[n] != null) form[n].value = saved[n]; });
  } catch (e) {}
  form.addEventListener('input', function () {
    try {
      var d = {}; textNames.forEach(function (n) { if (form[n] != null) d[n] = form[n].value; });
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  });

  /* ── live cover preview + theme / font / accent controls ── */
  var preview = $('#apPreview');
  function updatePreview() {
    if (!preview) return;
    var th = THEMES[CFG.theme], ff = FONTS[CFG.font].css, ac = CFG.accent;
    var nm = esc((form.name.value || 'Your name').trim().toUpperCase());
    var cat = (form.category.value || 'Model').trim();
    var disc = esc((DISC[cat] || 'Fashion · Editorial · Commercial').toUpperCase());
    var cover = photos[0] ? (photos[0].edited || photos[0].url) : '';
    preview.innerHTML =
      '<div class="ap-cover" style="background:' + th.bg + ';color:' + th.text + ';font-family:' + ff + '">' +
        '<div class="ap-cv-top"><b>YKS</b><i style="color:' + th.sub + '">TALENT PORTFOLIO</i></div>' +
        (cover ? '<div class="ap-cv-img"><img src="' + cover + '" alt=""><span class="ap-cv-wm">YKS PRODUCTIONS</span></div>'
               : '<div class="ap-cv-img ap-cv-empty" style="border-color:' + th.sub + '">Add a photo</div>') +
        '<div class="ap-cv-disc" style="color:' + ac + '">' + disc + '</div>' +
        '<div class="ap-cv-name">' + nm + '</div>' +
        '<div class="ap-cv-ed" style="color:' + th.sub + '">EDITION 2026 · EXCLUSIVE · YKS</div>' +
      '</div>';
  }
  function mark(wrap, btn) { $$('button', wrap).forEach(function (x) { x.classList.remove('on'); }); btn.classList.add('on'); }
  (function buildControls() {
    var tW = $('#apThemes');
    if (tW) Object.keys(THEMES).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-sw' + (k === CFG.theme ? ' on' : ''); b.title = THEMES[k].label; b.style.background = THEMES[k].bg;
      b.innerHTML = '<i style="background:' + THEMES[k].text + '"></i>';
      b.addEventListener('click', function () { CFG.theme = k; mark(tW, b); updatePreview(); }); tW.appendChild(b);
    });
    var fW = $('#apFonts');
    if (fW) Object.keys(FONTS).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-fontchip' + (k === CFG.font ? ' on' : ''); b.style.fontFamily = FONTS[k].css; b.textContent = 'Aa'; b.title = FONTS[k].label;
      b.addEventListener('click', function () { CFG.font = k; mark(fW, b); updatePreview(); }); fW.appendChild(b);
    });
    var aW = $('#apAccents');
    if (aW) ACCENTS.forEach(function (hex) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-dot' + (hex === CFG.accent ? ' on' : ''); b.style.background = hex;
      b.addEventListener('click', function () { CFG.accent = hex; mark(aW, b); updatePreview(); }); aW.appendChild(b);
    });
  })();
  form.addEventListener('input', updatePreview);
  updatePreview();

  /* ══ downloadable portfolio — a full, watermarked YKS PDF built from their photos + details ══ */
  function ensureJsPDF() {
    return new Promise(function (res, rej) {
      if (window.jspdf && window.jspdf.jsPDF) return res(window.jspdf.jsPDF);
      var s = document.createElement('script');
      s.src = '/js/vendor/jspdf.umd.min.js';
      s.onload = function () { (window.jspdf && window.jspdf.jsPDF) ? res(window.jspdf.jsPDF) : rej(new Error('lib')); };
      s.onerror = function () { rej(new Error('lib')); };
      document.head.appendChild(s);
    });
  }
  function ensureFonts() {
    return new Promise(function (res) {
      if (window.YKS_FONTS) return res(window.YKS_FONTS);
      var s = document.createElement('script'); s.src = '/js/vendor/fonts.js';
      s.onload = function () { res(window.YKS_FONTS || null); };
      s.onerror = function () { res(null); };   // fonts optional — falls back to built-ins
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
  function prepImg(file, ar, outW) {   // centre-crop to aspect `ar` (w/h) + downscale — so plates fill edge-to-edge
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var iw = img.width, ih = img.height, sar = iw / ih, cw, ch;
        if (sar > ar) { ch = ih; cw = ih * ar; } else { cw = iw; ch = iw / ar; }
        var oW = outW, oH = Math.round(outW / ar);
        var c = document.createElement('canvas'); c.width = oW; c.height = oH;
        c.getContext('2d').drawImage(img, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, oW, oH);
        res({ data: c.toDataURL('image/jpeg', 0.82), w: oW, h: oH });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = rej; img.src = URL.createObjectURL(file);
    });
  }
  var dlBtn = $('#apDownload');
  if (dlBtn) dlBtn.addEventListener('click', function () {
    if (!photos.length) { alert('Add at least one photo first — your portfolio is built from your photos.'); return; }
    var name = (form.name.value || '').trim();
    if (!name) { alert('Add your name first.'); if (form.name) form.name.focus(); return; }
    var orig = dlBtn.textContent; dlBtn.disabled = true; dlBtn.textContent = 'Building your portfolio…';
    Promise.all([ensureJsPDF(), ensureFonts()])
      .then(function (rr) {
        var JsPDF = rr[0];
        return Promise.all(photos.slice(0, 8).map(function (p) { return p.edited ? Promise.resolve({ data: p.edited, w: 900, h: 1125 }) : prepImg(p.file, 0.8, 1000); }))
          .then(function (imgs) {
            var th = THEMES[CFG.theme];
            buildPortfolio(JsPDF, imgs, name, { bg: hexRgb(th.bg), text: hexRgb(th.text), sub: hexRgb(th.sub), accent: hexRgb(CFG.accent), font: FONTS[CFG.font].pdf });
          });
      })
      .then(function () { dlBtn.textContent = 'Downloaded ✓'; setTimeout(function () { dlBtn.textContent = orig; dlBtn.disabled = false; }, 2500); })
      .catch(function () { dlBtn.textContent = orig; dlBtn.disabled = false; alert('Couldn’t build the PDF just now — please try again.'); });
  });
  function buildPortfolio(JsPDF, imgs, name, cfg) {
    var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    registerFonts(doc);
    var W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
    var BG = cfg.bg, TX = cfg.text, SUB = cfg.sub, AC = cfg.accent, F = cfg.font;
    if ((F === 'Playfair' || F === 'Oswald') && !doc.getFontList()[F]) F = 'helvetica';   // font failed to load → safe fallback
    var cat = (form.category.value || 'Model').trim(), city = (form.city.value || '').trim(), about = (form.about.value || '').trim();
    var disc = DISC[cat] || 'Fashion · Editorial · Commercial', NM = name.toUpperCase();
    function st(k) { var el = form['stat_' + k]; return el && el.value.trim() ? el.value.trim() : ''; }
    var STATS = [['Height', st('height')], ['Bust', st('bust')], ['Waist', st('waist')], ['Hips', st('hips')], ['Shoe', st('shoe')], ['Hair', st('hair')], ['Eyes', st('eyes')], ['Skin', st('skin')]].filter(function (r) { return r[1]; });
    function fill() { doc.setFillColor.apply(doc, BG); doc.rect(0, 0, W, H, 'F'); }
    function ct(c) { doc.setTextColor.apply(doc, c); }
    function place(im, x, y, w) { doc.addImage(im.data, 'JPEG', x, y, w, w / 0.8); }   // imgs are pre-cropped 4:5
    function ruleY(y) { doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.7); doc.line(M, y, W - M, y); }
    // ── mandatory YKS watermark — stamped on every page, cannot be removed ──
    function watermark() {
      if (doc.setGState) { doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.08 })); }
      doc.setFont(F, 'bold'); doc.setFontSize(13); ct(TX);
      for (var yy = 96; yy < H - 24; yy += 86) for (var xx = -24; xx < W; xx += 188) doc.text('YKS PRODUCTIONS', xx, yy, { angle: 20 });
      if (doc.restoreGraphicsState) doc.restoreGraphicsState();
    }
    function foot() {
      ruleY(H - 54);
      doc.setFont(F, 'normal'); doc.setFontSize(7.5); ct(SUB);
      doc.text('REPRESENTED BY YKS PRODUCTIONS', M, H - 40);
      doc.text('BOOKINGS  +91 97466 79720   ·   YKSPRODUCTIONS.COM', W - M, H - 40, { align: 'right' });
    }
    // ── COVER ──
    fill(); place(imgs[0], M, 76, CW); watermark();
    doc.setFont(F, 'bold'); doc.setFontSize(12); ct(TX); doc.text('YKS', M, 58);
    doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('TALENT PORTFOLIO', W - M, 58, { align: 'right' });
    doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), M, 732);
    doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 22 : 27); ct(TX); doc.text(NM, M, 766);
    doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('EDITION 2026 / 01     ·     EXCLUSIVE     ·     YKS', M, 786);
    // ── PROFILE ──
    doc.addPage(); fill(); watermark();
    doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('PROFILE', M, 58);
    doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' });
    ruleY(70);
    doc.setFont(F, 'bold'); doc.setFontSize(26); ct(TX); doc.text(name, M, 108);
    doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(SUB); doc.text([cat, city].filter(Boolean).join('      ·      ').toUpperCase(), M, 126);
    var colW = CW * 0.60, ay = 160;
    if (about) { doc.setFont(F, 'normal'); doc.setFontSize(11); ct(TX); var lines = doc.splitTextToSize(about, colW).slice(0, 12); doc.text(lines, M, ay); ay += lines.length * 15 + 26; }
    doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('CASTABLE FOR', M, ay);
    doc.setFont(F, 'normal'); doc.setFontSize(10); ct(TX);
    var tx = M, ty = ay + 24;
    disc.split(' · ').forEach(function (t) { var tw = doc.getTextWidth(t) + 22; if (tx + tw > M + colW) { tx = M; ty += 30; } doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.8); doc.roundedRect(tx, ty - 14, tw, 24, 3, 3, 'S'); doc.text(t, tx + 11, ty + 2); tx += tw + 8; });
    var rx = W - M - 170, ry = 148;
    if (imgs[1]) { place(imgs[1], rx, ry, 170); ry += 170 / 0.8 + 22; }
    if (STATS.length) {
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('MEASUREMENTS', rx, ry);
      STATS.forEach(function (r) {
        ry += 17; doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.5); doc.line(rx, ry - 11, rx + 170, ry - 11);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text(r[0].toUpperCase(), rx, ry);
        doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text(r[1], rx + 170, ry, { align: 'right' });
      });
    }
    foot();
    // ── PLATES ──
    var plates = imgs.slice(imgs[1] ? 2 : 1, 8), pn = 1;
    for (var i = 0; i < plates.length; i += 2) {
      doc.addPage(); fill();
      var cw = (CW - 20) / 2, y = 92;
      [plates[i], plates[i + 1]].forEach(function (im, k) { if (im) place(im, M + k * (cw + 20), y, cw); });
      watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('SELECTED WORK', M, 58);
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' }); ruleY(70);
      [plates[i], plates[i + 1]].forEach(function (im, k) { if (im) { doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('PLATE ' + ('0' + (pn++)).slice(-2) + '   ·   ' + cat.toUpperCase(), M + k * (cw + 20), y + cw / 0.8 + 16); } });
      foot();
    }
    // ── BOOK ──
    doc.addPage(); fill(); watermark();
    doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('BOOKINGS', M, 58);
    doc.setFont(F, 'bold'); doc.setFontSize(30); ct(TX); doc.text('BOOK', M, H / 2 - 16); doc.text(NM, M, H / 2 + 22);
    doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(SUB); doc.text('Represented exclusively by YKS Productions.', M, H / 2 + 60); doc.text('+91 97466 79720     ·     yksproductions.com', M, H / 2 + 80);
    doc.save((name.replace(/[^a-z0-9 ]/gi, '').trim() || 'YKS') + ' — YKS Portfolio.pdf');
  }

  /* ══ upload one file to Cloudinary (unsigned) with progress ══ */
  function upload(file, onProgress, folder) {
    return new Promise(function (resolve, reject) {
      var url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/auto/upload';
      var fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.upload.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText).secure_url || ''); } catch (er) { resolve(''); } }
        else reject(new Error('upload ' + xhr.status));
      };
      xhr.onerror = function () { reject(new Error('network')); };
      xhr.send(fd);
    });
  }

  /* ══ submit ══ */
  var progress = $('#apProgress'), submitBtn = form.querySelector('button[type="submit"]');
  function say(msg) { if (progress) { progress.hidden = !msg; progress.textContent = msg || ''; } }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var orig = submitBtn.textContent; submitBtn.disabled = true;
    var configured = !!(CLOUDINARY_CLOUD && CLOUDINARY_PRESET);
    var folderName = (form.name.value || 'Applicant').trim() + ' — ' + new Date().toLocaleDateString('en-GB');

    var chain = Promise.resolve({ photos: [], pdf: '' });
    if (configured && (photos.length || pdf)) {
      submitBtn.textContent = 'Uploading…';
      var total = photos.length + (pdf ? 1 : 0), done = 0;
      var step = function () { done++; say('Uploading your files… ' + done + ' / ' + total); };
      say('Uploading your files… 0 / ' + total);
      chain = Promise.all(
        photos.map(function (p) {
          var fig = thumbs.querySelector('.ap-thumb[data-id="' + p.id + '"] .ap-thumb-bar');
          return upload(p.file, function (r) { if (fig) fig.style.transform = 'scaleX(' + r + ')'; }, folderName).then(function (u) { step(); return u; });
        })
      ).then(function (urls) {
        if (!pdf) return { photos: urls, pdf: '' };
        return upload(pdf, null, folderName).then(function (pu) { step(); return { photos: urls, pdf: pu }; });
      });
    }

    chain.then(function (up) {
      say('Sending your application…');
      var payload = {
        access_key: WEB3FORMS_KEY,
        subject: 'New talent application — ' + (form.name.value || 'YKS Talents'),
        from_name: 'YKS Talents application',
        name: form.name.value, phone_whatsapp: form.contact.value,
        category: form.category.value, based_in: form.region.value,
        city: form.city.value, instagram_social: form.socials.value,
        about: form.about.value,
        files_folder: (configured && (photos.length || pdf)) ? folderName : '(none)',
        photos: configured
          ? (up.photos.filter(Boolean).join('\n') || (photos.length ? photos.length + ' photo(s) uploaded' : '(none)'))
          : (photos.length ? '(' + photos.length + ' photos — applicant will send on WhatsApp)' : '(none)'),
        portfolio_pdf: configured
          ? (up.pdf || (pdf ? 'PDF uploaded' : '(none)'))
          : (pdf ? '(PDF — applicant will send on WhatsApp)' : '(none)')
      };
      return fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.success) throw new Error('web3forms');
        try { localStorage.removeItem(DRAFT_KEY); } catch (er) {}
        say('');
        form.style.display = 'none';
        var ok = $('#talOk'); if (ok) ok.style.display = 'block';
        if (window.gtag) gtag('event', 'talent_apply');
        // photos couldn't upload (not configured yet) → hand them to WhatsApp so nothing is lost
        if (!configured && (photos.length || pdf)) {
          var waWrap = $('#apOkWa'); if (waWrap) waWrap.hidden = false;
        }
      });
    }).catch(function () {
      submitBtn.disabled = false; submitBtn.textContent = orig;
      say('Something went wrong — please try again, or use “Apply on WhatsApp” below.');
    });
  });
})();
