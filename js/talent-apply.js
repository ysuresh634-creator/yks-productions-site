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
  var DRAFT_KEY = 'yks_talent_draft2';   // bumped — abandons any stale demo draft so the preview starts on "YOUR NAME"

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var form = $('#talForm');
  if (!form) return;

  var photos = [];   // { file, id, url }
  var pdf = null;    // File
  var uid = 0;

  /* ── portfolio customiser: the talent's own theme / font / accent / look ── */
  var CFG = { theme: 'noir', font: 'playfair', accent: '#d47a3a', template: 'editorial', layout: 'editorial', look: 'none' };
  // a premium abstract editorial frame — the demo cover until the talent adds their own photos
  var SAMPLE_COVER = '/assets/studio-cover.svg';
  // each template is a whole design kit — its own font, theme, accent & photo look (all still overridable)
  var TEMPLATES = [
    { k: 'editorial', label: 'Editorial', note: 'Framed hero + profile',     kit: { font: 'playfair', theme: 'noir',      accent: '#d47a3a', look: 'none' } },
    { k: 'lookbook',  label: 'Lookbook',  note: 'Full-bleed, photo-first',   kit: { font: 'oswald',   theme: 'noir',      accent: '#d47a3a', look: 'film' } },
    { k: 'compcard',  label: 'Comp Card', note: 'Agency standard · 2 pages', kit: { font: 'oswald',   theme: 'charcoal',  accent: '#c0392b', look: 'none' } },
    { k: 'minimal',   label: 'Minimal',   note: 'Airy, one shot a page',     kit: { font: 'sans',     theme: 'ivory',     accent: '#b0552b', look: 'none' } },
    { k: 'grid',      label: 'Grid',      note: 'Contact sheet · shows range', kit: { font: 'sans',    theme: 'slate',     accent: '#3b6fd4', look: 'none' } },
    { k: 'feature',   label: 'Feature',   note: 'Magazine spread',           kit: { font: 'playfair', theme: 'noir',      accent: '#d47a3a', look: 'warm' } },
    { k: 'swiss',     label: 'Swiss',     note: 'Grid & bold type',          kit: { font: 'sans',     theme: 'porcelain', accent: '#c0392b', look: 'none' } },
    { k: 'luxe',      label: 'Luxe',      note: 'Type-led, elegant',         kit: { font: 'playfair', theme: 'noir',      accent: '#c9a24b', look: 'warm' } },
    { k: 'classic',   label: 'Classic',   note: 'Neo-classical, refined',    kit: { font: 'serif',    theme: 'ivory',     accent: '#b0552b', look: 'none' } },
    { k: 'ethereal',  label: 'Ethereal',  note: 'Soft, airy, light',         kit: { font: 'serif',    theme: 'blush',     accent: '#d16a8a', look: 'fade' } },
    { k: 'wabi',      label: 'Wabi-Sabi', note: 'Quiet, natural, muted',     kit: { font: 'serif',    theme: 'sand',      accent: '#7a8b3a', look: 'fade' } },
    { k: 'bento',     label: 'Bento',     note: 'Modular grid',              kit: { font: 'sans',     theme: 'charcoal',  accent: '#2a9d8f', look: 'none' } },
    // more styles — each reuses a layout with its own kit, so it's a distinct look
    { k: 'maximal',   label: 'Maximal',   note: 'Bold & dense',       layout: 'grid',     kit: { font: 'oswald',   theme: 'noir',      accent: '#d16a8a', look: 'none' } },
    { k: 'brutalist', label: 'Brutalist', note: 'Raw, stark, mono',   layout: 'swiss',    kit: { font: 'mono',     theme: 'porcelain', accent: '#c0392b', look: 'bw' } },
    { k: 'bohemian',  label: 'Bohemian',  note: 'Warm & earthy',      layout: 'feature',  kit: { font: 'serif',    theme: 'sand',      accent: '#b0552b', look: 'warm' } },
    { k: 'victorian', label: 'Victorian', note: 'Ornate, vintage',    layout: 'classic',  kit: { font: 'serif',    theme: 'ivory',     accent: '#7d4b7d', look: 'none' } },
    { k: 'gothic',    label: 'Gothic',    note: 'Dark & dramatic',    layout: 'luxe',     kit: { font: 'playfair', theme: 'noir',      accent: '#8a7fd6', look: 'cool' } },
    { k: 'noir',      label: 'Noir',      note: 'B&W, cinematic',     layout: 'lookbook', kit: { font: 'oswald',   theme: 'noir',      accent: '#e2ddd3', look: 'bw' } },
    { k: 'mono',      label: 'Mono',      note: 'Monospace, clean',   layout: 'minimal',  kit: { font: 'mono',     theme: 'porcelain', accent: '#3b6fd4', look: 'none' } },
    { k: 'sepia',     label: 'Sepia',     note: 'Warm vintage film',  layout: 'classic',  kit: { font: 'serif',    theme: 'sand',      accent: '#b0552b', look: 'film' } },
    { k: 'duo',       label: 'Duo',       note: 'Diptych · paired shots',                     kit: { font: 'playfair', theme: 'noir',      accent: '#d47a3a', look: 'none' } },
    { k: 'beauty',    label: 'Beauty',    note: 'Soft & close',       layout: 'feature',  kit: { font: 'serif',    theme: 'porcelain', accent: '#d16a8a', look: 'warm' } },
    { k: 'bridal',    label: 'Bridal',    note: 'Cream & gold',       layout: 'classic',  kit: { font: 'serif',    theme: 'ivory',     accent: '#c9a24b', look: 'fade' } },
    { k: 'fitness',   label: 'Fitness',   note: 'Bold & dynamic',     layout: 'lookbook', kit: { font: 'oswald',   theme: 'charcoal',  accent: '#3b6fd4', look: 'none' } },
    { k: 'street',    label: 'Street',    note: 'Candid, documentary', layout: 'grid',    kit: { font: 'mono',     theme: 'slate',     accent: '#b8912e', look: 'film' } },
    { k: 'runway',    label: 'Runway',    note: 'Sequential, editorial', layout: 'feature', kit: { font: 'oswald',  theme: 'noir',      accent: '#d47a3a', look: 'none' } },
    { k: 'commercial',label: 'Commercial',note: 'Clean & bright',     layout: 'compcard', kit: { font: 'sans',     theme: 'porcelain', accent: '#3b6fd4', look: 'none' } }
  ];
  /* photo "look": a single grade applied to EVERY image so the book feels
     shot as one story — the thing that separates a pro portfolio from a phone roll */
  var LOOKS = {
    none:  { label: 'True',  css: 'none' },
    bw:    { label: 'B&W',   css: 'grayscale(1) contrast(1.06)' },
    warm:  { label: 'Warm',  css: 'saturate(1.05) sepia(.22) contrast(1.03) brightness(1.02)' },
    film:  { label: 'Film',  css: 'contrast(1.12) saturate(.9) brightness(1.03) sepia(.08)' },
    cool:  { label: 'Editorial', css: 'saturate(.86) contrast(1.08) brightness(1.02) hue-rotate(-6deg)' },
    fade:  { label: 'Matte', css: 'contrast(.92) saturate(.92) brightness(1.06)' }
  };
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
  // enforce "it's all YKS": scrub any contact a talent might slip into free text (tagline)
  function stripContact(s) {
    if (!s) return '';
    return String(s)
      .replace(/\S+@\S+\.\S+/g, '')                                        // emails
      .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '')                         // urls
      .replace(/@[\w.]+/g, '')                                             // @handles
      .replace(/\b[a-z0-9-]+\.(?:com|in|net|co|org|me|link|io|to|xyz)\b/gi, '') // bare domains
      .replace(/[+(]?\d[\d\s().\-]{6,}\d/g, '')                            // phone numbers
      .replace(/\s{2,}/g, ' ').replace(/^[\s·|,\-]+|[\s·|,\-]+$/g, '').trim();
  }
  var CATS = ['Portrait', 'Full length', 'Fashion', 'Commercial', 'Beauty', 'Digitals', 'Other'];
  var activeCat = 'Portrait';   // new photos land in the selected category

  /* ══ photos: pick / drop / preview / reorder / remove ══ */
  var photoInput = $('#apPhotos'), photoDrop = $('#apDrop'), thumbs = $('#apThumbs');
  function isImageFile(f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|tiff?|avif|heic|heif)$/i.test(f.name); }
  function isHeic(f) { return /image\/hei[cf]/i.test(f.type) || /\.(heic|heif)$/i.test(f.name); }
  function ensureHeic() {
    return new Promise(function (res, rej) {
      if (window.heic2any) return res(window.heic2any);
      var s = document.createElement('script'); s.src = '/js/vendor/heic2any.min.js';
      s.onload = function () { window.heic2any ? res(window.heic2any) : rej(new Error('heic')); };
      s.onerror = function () { rej(new Error('heic')); }; document.head.appendChild(s);
    });
  }
  function normalizeFile(f) {   // iPhone HEIC → JPEG so it renders on canvas / in the PDF
    if (!isHeic(f)) return Promise.resolve(f);
    return ensureHeic().then(function (h) {
      return h({ blob: f, toType: 'image/jpeg', quality: 0.92 }).then(function (out) {
        var blob = Array.isArray(out) ? out[0] : out;
        return new File([blob], f.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
      });
    }).catch(function () { return f; });   // if convert fails, keep original (still uploads fine)
  }
  function addPhotos(list) {
    var arr = Array.prototype.slice.call(list).filter(isImageFile);
    if (!arr.length) return;
    var lbl = $('#apDropLabel');
    if (lbl && arr.some(isHeic)) lbl.textContent = 'Converting photos…';
    Promise.all(arr.map(normalizeFile)).then(function (files) {
      files.forEach(function (f) { photos.push({ file: f, id: ++uid, url: URL.createObjectURL(f), cat: activeCat }); });
      renderThumbs();
    });
  }
  function idxOf(id) { for (var i = 0; i < photos.length; i++) if (photos[i].id === id) return i; return -1; }
  function renderThumbs() {
    thumbs.innerHTML = '';
    photos.forEach(function (item, idx) {
      var fig = document.createElement('div'); fig.className = 'ap-thumb'; fig.dataset.id = item.id; fig.draggable = true;
      var media = document.createElement('div'); media.className = 'ap-thumb-media';
      var img = document.createElement('img'); img.src = item.edited || item.url; img.alt = '';
      img.addEventListener('click', function () { openCrop(item); }); media.appendChild(img);
      var ed = document.createElement('span'); ed.className = 'ap-edit-hint'; ed.textContent = '✎ Adjust';
      ed.addEventListener('click', function () { openCrop(item); }); media.appendChild(ed);
      if (idx === 0) { var bd = document.createElement('span'); bd.className = 'ap-cover-badge'; bd.textContent = 'COVER'; media.appendChild(bd); }
      else {
        var mk = document.createElement('button'); mk.type = 'button'; mk.className = 'ap-mkcover'; mk.textContent = 'Set cover';
        mk.addEventListener('click', function () { var i = idxOf(item.id); if (i > 0) { photos.unshift(photos.splice(i, 1)[0]); renderThumbs(); } });
        media.appendChild(mk);
      }
      var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'ap-rm'; rm.setAttribute('aria-label', 'Remove photo'); rm.textContent = '×';
      rm.addEventListener('click', function () { var i = idxOf(item.id); if (i >= 0) { URL.revokeObjectURL(photos[i].url); photos.splice(i, 1); renderThumbs(); } });
      media.appendChild(rm);
      var bar = document.createElement('span'); bar.className = 'ap-thumb-bar'; media.appendChild(bar);
      fig.appendChild(media);
      var sel = document.createElement('select'); sel.className = 'ap-thumb-cat';
      CATS.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; if (c === (item.cat || CATS[0])) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { item.cat = sel.value; updatePreview(); });
      fig.appendChild(sel);
      fig.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', String(item.id)); fig.classList.add('dragging'); });
      fig.addEventListener('dragend', function () { fig.classList.remove('dragging'); });
      fig.addEventListener('dragover', function (e) { e.preventDefault(); });
      fig.addEventListener('drop', function (e) { e.preventDefault(); var from = idxOf(+e.dataTransfer.getData('text/plain')), to = idxOf(item.id); if (from < 0 || to < 0 || from === to) return; photos.splice(to, 0, photos.splice(from, 1)[0]); renderThumbs(); });
      thumbs.appendChild(fig);
    });
    reflectPhotoCount(); if (typeof renderTemplates === 'function') renderTemplates(); updatePreview();
  }
  function reflectPhotoCount() {
    var b = $('#apDropLabel');
    if (b) b.textContent = photos.length ? photos.length + (photos.length === 1 ? ' photo — first is your cover' : ' photos — first is your cover') : 'Add ' + activeCat + ' photos';
  }
  (function buildCatChips() {
    var wrap = $('#apCats'); if (!wrap) return;
    CATS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-catchip' + (c === activeCat ? ' on' : ''); b.textContent = c;
      b.addEventListener('click', function () {
        activeCat = c; $$('.ap-catchip', wrap).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); reflectPhotoCount();
      });
      wrap.appendChild(b);
    });
  })();

  /* ══ per-photo crop / adjust editor — Fill (crop) or Fit (show the whole photo) ══ */
  var cropModal = $('#apCrop'), cropImg = $('#apCropImg'), cropBlur = $('#apCropBlur'), cropFrame = $('#apCropFrame'), cropZoom = $('#apCropZoom');
  var cropNote = $('#apCropNote'), modeFillBtn = $('#apModeFill'), modeFitBtn = $('#apModeFit');
  var cropS = null;
  function openCrop(item) {
    if (!cropModal) return;
    cropModal.hidden = false; document.documentElement.style.overflow = 'hidden';
    var nat = new Image();
    nat.onload = function () {
      var fw = cropFrame.clientWidth || 300, fh = cropFrame.clientHeight || 375;
      cropS = { item: item, nat: nat, fw: fw, fh: fh, mode: item.fit ? 'fit' : 'fill', zoom: 1 };
      cropImg.src = nat.src; cropBlur.src = nat.src;
      setMode(cropS.mode, true);
    };
    nat.src = item.url;
  }
  function baseFor(mode) { return mode === 'fit' ? Math.min(cropS.fw / cropS.nat.width, cropS.fh / cropS.nat.height) : Math.max(cropS.fw / cropS.nat.width, cropS.fh / cropS.nat.height); }
  function setMode(mode, recenter) {
    if (!cropS) return;
    cropS.mode = mode; cropS.base = baseFor(mode);
    if (recenter) { cropS.zoom = 1; cropZoom.value = 1; cropS.tx = (cropS.fw - cropS.nat.width * cropS.base) / 2; cropS.ty = (cropS.fh - cropS.nat.height * cropS.base) / 2; }
    cropBlur.style.display = mode === 'fit' ? 'block' : 'none';
    if (modeFillBtn) modeFillBtn.classList.toggle('on', mode === 'fill');
    if (modeFitBtn) modeFitBtn.classList.toggle('on', mode === 'fit');
    if (cropNote) cropNote.textContent = mode === 'fit'
      ? 'Your whole photo shows — nothing is cut. The soft edges fill the frame.'
      : 'Drag to reposition — the frame is what shows in your portfolio.';
    applyCrop();
  }
  function applyCrop() {
    if (!cropS) return;
    var s = cropS.base * cropS.zoom, w = cropS.nat.width * s, h = cropS.nat.height * s;
    if (cropS.mode === 'fill') {   // must always cover the frame — clamp so no empty edges
      cropS.tx = Math.min(0, Math.max(cropS.fw - w, cropS.tx));
      cropS.ty = Math.min(0, Math.max(cropS.fh - h, cropS.ty));
    }
    cropImg.style.width = w + 'px'; cropImg.style.height = h + 'px';
    cropImg.style.transform = 'translate(' + cropS.tx + 'px,' + cropS.ty + 'px)';
  }
  function closeCrop() { if (cropModal) cropModal.hidden = true; document.documentElement.style.overflow = ''; cropS = null; }
  function saveCrop() {
    if (!cropS) return;
    var outW = 900, outH = Math.round(outW * cropS.fh / cropS.fw), k = outW / cropS.fw;
    var c = document.createElement('canvas'); c.width = outW; c.height = outH; var ctx = c.getContext('2d');
    if (cropS.mode === 'fit') {
      var nat = cropS.nat, bs = Math.max(outW / nat.width, outH / nat.height);   // blurred backdrop fills — no bars
      if ('filter' in ctx) ctx.filter = 'blur(24px) brightness(.6)';
      ctx.drawImage(nat, (outW - nat.width * bs) / 2, (outH - nat.height * bs) / 2, nat.width * bs, nat.height * bs);
      if ('filter' in ctx) ctx.filter = 'none';
      var s = cropS.base * cropS.zoom;                                            // whole photo, positioned
      ctx.drawImage(nat, cropS.tx * k, cropS.ty * k, nat.width * s * k, nat.height * s * k);
      cropS.item.edited = c.toDataURL('image/jpeg', 0.86); cropS.item.fit = true;
    } else {
      var s2 = cropS.base * cropS.zoom, sx = -cropS.tx / s2, sy = -cropS.ty / s2, sw = cropS.fw / s2, sh = cropS.fh / s2;
      ctx.drawImage(cropS.nat, sx, sy, sw, sh, 0, 0, outW, outH);
      cropS.item.edited = c.toDataURL('image/jpeg', 0.85); cropS.item.fit = false;
    }
    closeCrop(); renderThumbs();
  }
  if (cropModal) {
    if (modeFillBtn) modeFillBtn.addEventListener('click', function () { setMode('fill', true); });
    if (modeFitBtn) modeFitBtn.addEventListener('click', function () { setMode('fit', true); });
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
    $('#apCropSave').addEventListener('click', saveCrop);
    $('#apCropReset').addEventListener('click', function () { if (cropS) { cropS.item.edited = null; cropS.item.fit = false; closeCrop(); renderThumbs(); } });
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
    var th = THEMES[CFG.theme], ff = FONTS[CFG.font].css, ac = CFG.accent, tpl = CFG.layout;
    var nm = esc((form.name.value || 'Your name').trim().toUpperCase());
    var cat = (form.category.value || 'Model').trim();
    var disc = esc((DISC[cat] || 'Fashion · Editorial · Commercial').toUpperCase());
    var cover = photos[0] ? (photos[0].edited || photos[0].url) : SAMPLE_COVER;
    var lkCss = (LOOKS[CFG.look] && LOOKS[CFG.look].css) || 'none';
    var tag = esc(stripContact((form.tagline && form.tagline.value || '').trim()));
    var wm = '<span class="ap-cv-wm">YKS PRODUCTIONS</span>';
    var imgTag = cover ? '<img src="' + cover + '" alt="" style="filter:' + lkCss + '">' + wm : '';
    var empty = '<div class="ap-cv-img ap-cv-empty" style="border-color:' + th.sub + '">Add a photo</div>';
    var html;
    if (tpl === 'lookbook' || tpl === 'luxe' || tpl === 'feature') {
      html = '<div class="ap-cover ap-cv-bleed" style="font-family:' + ff + ';background:' + th.bg + '">' +
        (cover ? '<div class="ap-cv-full">' + imgTag + '</div>' : empty) +
        '<div class="ap-cv-overlay"><div class="ap-cv-disc" style="color:' + ac + '">' + disc + '</div><div class="ap-cv-name" style="color:#fff">' + nm + '</div>' +
        (tag ? '<div class="ap-cv-tag" style="color:#e8e3d9">' + tag + '</div>' : '') + '</div></div>';
    } else if (tpl === 'minimal' || tpl === 'ethereal' || tpl === 'classic') {
      html = '<div class="ap-cover ap-cv-min" style="background:' + th.bg + ';color:' + th.text + ';font-family:' + ff + '">' +
        '<div class="ap-cv-top" style="justify-content:center"><i style="color:' + th.sub + '">YKS · TALENT PORTFOLIO</i></div>' +
        (cover ? '<div class="ap-cv-img ap-cv-minimg">' + imgTag + '</div>' : empty) +
        '<div class="ap-cv-name" style="text-align:center">' + nm + '</div>' +
        '<div class="ap-cv-disc" style="color:' + ac + ';text-align:center">' + disc + '</div>' +
        (tag ? '<div class="ap-cv-tag" style="color:' + th.sub + ';text-align:center">' + tag + '</div>' : '') + '</div>';
    } else {
      html = '<div class="ap-cover" style="background:' + th.bg + ';color:' + th.text + ';font-family:' + ff + '">' +
        '<div class="ap-cv-top"><b>YKS</b><i style="color:' + th.sub + '">TALENT PORTFOLIO</i></div>' +
        (cover ? '<div class="ap-cv-img">' + imgTag + '</div>' : empty) +
        '<div class="ap-cv-disc" style="color:' + ac + '">' + disc + '</div><div class="ap-cv-name">' + nm + '</div>' +
        (tag ? '<div class="ap-cv-tag" style="color:' + ac + '">' + tag + '</div>'
             : '<div class="ap-cv-ed" style="color:' + th.sub + '">EDITION 2026 · EXCLUSIVE · YKS</div>') + '</div>';
    }
    $$('.ap-preview').forEach(function (p) { p.innerHTML = html; });
    var pc = photos.length, tl = '';
    for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].k === CFG.template) { tl = TEMPLATES[i].label; break; }
    var metaTxt = pc ? ((form.name.value || 'Your name').trim() + '  ·  ' + tl + '  ·  ' + pc + (pc === 1 ? ' photo' : ' photos'))
      : (tl + '  ·  sample cover — add your photos');
    $$('.ap-live-meta').forEach(function (m) { m.textContent = metaTxt; });
  }
  function mark(wrap, btn) { $$('button', wrap).forEach(function (x) { x.classList.remove('on'); }); btn.classList.add('on'); }
  // ONE unified mini-cover for every design — identical structure, differs only by palette + font (neat, classy, consistent)
  function tplMini(layout, kit, label, photoUrl) {
    var th = kit ? THEMES[kit.theme] : THEMES.noir, ac = (kit && kit.accent) || '#d47a3a', ff = FONTS[(kit && kit.font) || 'playfair'].css;
    var lk = (kit && LOOKS[kit.look] && LOOKS[kit.look].css) || 'none';
    var ps = photoUrl ? ' style="background:#241f2a url(&quot;' + photoUrl + '&quot;) center 22%/cover;background-blend-mode:normal;filter:' + lk + '"' : '';
    var st = 'background:' + th.bg + ';color:' + th.text + ';font-family:' + ff;
    return '<span class="mc" style="' + st + '">' +
      '<span class="mc-kick">YKS · PORTFOLIO</span>' +
      '<span class="mc-photo"' + ps + '></span>' +
      '<span class="mc-nm">' + esc(label || '') + '</span>' +
      '<span class="mc-rule" style="background:' + ac + '"></span>' +
    '</span>';
  }
  function syncControls() {
    function sync(sel, test) { $$(sel).forEach(function (b) { b.classList.toggle('on', test(b)); }); }
    sync('#apThemes .ap-sw', function (b) { return b.title === THEMES[CFG.theme].label; });
    sync('#apFonts .ap-fontchip', function (b) { return b.title === FONTS[CFG.font].label; });
    sync('#apAccents .ap-dot', function (b) { return b.style.background && hexToRgbStr(b.style.background) === hexToRgbStr(CFG.accent); });
    sync('#apLooks .ap-look', function (b) { return b.textContent === LOOKS[CFG.look].label; });
  }
  function applyKit(kit) {   // a template's whole look — font, theme, accent, photo grade — in one tap
    if (!kit) return;
    if (kit.font) CFG.font = kit.font;
    if (kit.theme) CFG.theme = kit.theme;
    if (kit.accent) CFG.accent = kit.accent;
    if (kit.look) CFG.look = kit.look;
    syncControls();
  }
  function renderTemplates() {
    var pW = $('#apTemplates'); if (!pW) return;
    var cover = photos[0] ? (photos[0].edited || photos[0].url) : SAMPLE_COVER;
    pW.innerHTML = '';
    TEMPLATES.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-tpl' + (t.k === CFG.template ? ' on' : ''); b.title = t.label + ' — ' + (t.note || ''); b.dataset.tpl = t.k;
      b.innerHTML = tplMini(t.layout || t.k, t.kit, t.label, cover) + '<span class="ap-tpl-cap"><b>' + t.label + '</b>' + (t.note ? '<i>' + t.note + '</i>' : '') + '</span>';
      b.addEventListener('click', function () { CFG.template = t.k; CFG.layout = t.layout || t.k; applyKit(t.kit); mark(pW, b); updatePreview(); });
      pW.appendChild(b);
    });
  }
  (function buildControls() {
    renderTemplates();
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
    var lW = $('#apLooks');
    if (lW) Object.keys(LOOKS).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-look' + (k === CFG.look ? ' on' : ''); b.textContent = LOOKS[k].label;
      b.addEventListener('click', function () { CFG.look = k; mark(lW, b); updatePreview(); }); lW.appendChild(b);
    });
    // ✨ Surprise me — one tap picks a whole design (a real template kit) + a fresh accent/look
    var sB = $('#apSurprise');
    if (sB) sB.addEventListener('click', function () {
      function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
      var t = rnd(TEMPLATES);
      CFG.template = t.k; CFG.layout = t.layout || t.k; applyKit(t.kit);
      CFG.accent = rnd(ACCENTS); CFG.look = rnd(Object.keys(LOOKS)); syncControls();
      $$('#apTemplates .ap-tpl').forEach(function (b) { b.classList.toggle('on', b.dataset.tpl === t.k); });
      updatePreview();
    });
  })();
  function hexToRgbStr(h) { if (/^rgb/.test(h)) return h.replace(/\s+/g, ''); var c = hexRgb(h); return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  form.addEventListener('input', updatePreview);
  updatePreview();

  /* ══ paste-and-sort stats — talent paste comp-card / agency text, we distribute it into the 8 fields ══ */
  (function () {
    var openBtn = $('#apStatsAiOpen'), panel = $('#apStatsPaste'), raw = $('#apStatsRaw'), fillBtn = $('#apStatsFill'), msg = $('#apStatsMsg');
    if (!openBtn || !panel || !fillBtn) return;
    openBtn.addEventListener('click', function () { panel.hidden = !panel.hidden; if (!panel.hidden && raw) raw.focus(); });
    function cap(s) { return s.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
    function parseStats(text) {
      var t = ' ' + text.replace(/\s+/g, ' ').trim() + ' ', low = t.toLowerCase(), o = {}, m;
      // Height — 5'6", 5 ft 6, 1.68 m, 168 cm, or "Height: …"
      if (m = t.match(/(\d)\s*['’]\s*(\d{1,2})/)) o.height = m[1] + "'" + m[2] + '"';
      else if (m = low.match(/\b(\d)\s*(?:ft|feet|foot)\s*(\d{1,2})?/)) o.height = m[1] + "'" + (m[2] || '0') + '"';
      else if (m = low.match(/\b(1\.[3-9]\d)\s*m\b/)) o.height = m[1] + ' m';
      else if (m = low.match(/\b(1[3-9]\d|2[0-1]\d)\s*cm\b/)) o.height = m[1] + ' cm';
      else if (m = low.match(/height[:\s]+(\d[\d'"’.\s]*(?:cm|m)?)/)) o.height = m[1].trim();
      // Bust–Waist–Hips triple — 34-26-36, 34/26/36, 34x26x36, or space-separated
      var tr = t.match(/\b([2-4]\d)\s*[-\/x]\s*([1-3]\d)\s*[-\/x]\s*([2-4]\d)\b/i)
            || t.match(/(?:measurements?|stats|vitals|figure|bwh)[:\s]*([2-4]\d)\s+([1-3]\d)\s+([2-4]\d)\b/i)
            || t.match(/\b([2-4]\d)\s+([1-3]\d)\s+([2-4]\d)\b/);
      if (tr) { o.bust = tr[1]; o.waist = tr[2]; o.hips = tr[3]; }
      if (m = low.match(/(?:bust|chest)[:\s]+(\d{2}\s*[a-e]?)/)) o.bust = m[1].toUpperCase().replace(/\s+/g, '');
      if (m = low.match(/waist[:\s]+(\d{2})/)) o.waist = m[1];
      if (m = low.match(/hips?[:\s]+(\d{2})/)) o.hips = m[1];
      // Shoe — "shoe 38 EU", "UK 5", "size 7", "6 uk" (number and unit in either order)
      var sc = low.match(/shoe[^a-z0-9]*(?:size)?[:\s]*([a-z0-9.\s]{1,8})/);
      var sm = (sc ? sc[1] : low).match(/\b(\d{1,2}(?:\.5)?)\s*(eu|uk|us)\b|\b(eu|uk|us)\s*(\d{1,2}(?:\.5)?)\b/);
      if (!sm && sc) sm = sc[1].match(/(\d{1,2}(?:\.5)?)/);   // "shoe 8" with no unit
      if (sm) { var num = sm[1] || sm[4] || sm[0], unit = (sm[2] || sm[3] || '').toUpperCase(); if (num) o.shoe = (num + (unit ? ' ' + unit : '')).trim(); }
      // Hair — "Hair: Brown" or "brown hair"
      var HAIR = ['jet black', 'black', 'dark brown', 'light brown', 'brown', 'blonde', 'blond', 'brunette', 'auburn', 'red', 'ginger', 'grey', 'gray', 'white'];
      if (m = low.match(/hair[:\s]+([a-z ]+?)\s*(?:[,.;\/|]|eyes?|skin|complexion|shoe|height|$)/)) o.hair = cap(m[1].trim());
      else { for (var i = 0; i < HAIR.length; i++) if (new RegExp('\\b' + HAIR[i] + '\\b\\s*hair').test(low)) { o.hair = cap(HAIR[i]); break; } }
      // Eyes — "Eyes: Green" or "green eyes"
      if (m = low.match(/eyes?[:\s]+([a-z ]+?)\s*(?:[,.;\/|]|hair|skin|complexion|shoe|height|$)/)) o.eyes = cap(m[1].trim());
      else { var EYES = ['dark brown', 'light brown', 'brown', 'black', 'blue', 'green', 'hazel', 'grey', 'gray', 'amber']; for (var j = 0; j < EYES.length; j++) if (new RegExp('\\b' + EYES[j] + '\\b\\s*eyes?').test(low)) { o.eyes = cap(EYES[j]); break; } }
      // Skin / complexion — "Skin: Fair", "wheatish complexion", "medium skin", or a bare tone word
      if (m = low.match(/(?:skin tone|complexion|skin)[:\s]+([a-z ]+?)\s*(?:[,.;\/|]|hair|eyes?|shoe|height|$)/)) o.skin = cap(m[1].trim());
      else if (m = low.match(/\b(fair|light|medium|olive|tan|wheatish|dusky|deep|dark|brown|ebony)\s*(?:skin|complexion|tone)/)) o.skin = cap(m[1]);
      else { var SKIN = ['wheatish', 'olive', 'dusky', 'fair', 'medium', 'tan']; for (var k = 0; k < SKIN.length; k++) if (new RegExp('\\b' + SKIN[k] + '\\b').test(low)) { o.skin = cap(SKIN[k]); break; } }
      return o;
    }
    fillBtn.addEventListener('click', function () {
      var text = (raw && raw.value || '').trim();
      if (!text) { if (msg) msg.textContent = 'Paste your stats above first.'; return; }
      var o = parseStats(text), map = { height: 'stat_height', bust: 'stat_bust', waist: 'stat_waist', hips: 'stat_hips', shoe: 'stat_shoe', hair: 'stat_hair', eyes: 'stat_eyes', skin: 'stat_skin' }, n = 0;
      Object.keys(map).forEach(function (k) { if (o[k] && form[map[k]]) { form[map[k]].value = o[k]; n++; } });
      updatePreview();
      if (msg) msg.textContent = n ? 'Sorted ' + n + ' of 8 — check them below and fix anything.' : 'Couldn’t read those — try one per line, e.g. “Waist 26”.';
    });
  })();

  /* ══ interactive "how it works" — the timeline walks itself; hover/tap to steer ══ */
  (function () {
    var flow = $('#apFlow'); if (!flow) return;
    var steps = $$('.ap-flow-step', flow); if (steps.length < 2) return;
    flow.classList.add('is-enhanced');
    var active = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    function set(i) { active = i; steps.forEach(function (s, k) { var on = k === i; s.classList.toggle('is-open', on); s.setAttribute('aria-expanded', on ? 'true' : 'false'); }); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    steps.forEach(function (s, k) {
      s.setAttribute('aria-expanded', 'false');
      s.addEventListener('click', function () { stop(); set(k); });
      if (!touch) s.addEventListener('mouseenter', function () { stop(); set(k); });
    });
    set(0);
    if (!reduce) timer = setInterval(function () { set((active + 1) % steps.length); }, 4200);
  })();

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
  function ensureQR() {
    return new Promise(function (res) {
      if (window.qrcode) return res(window.qrcode);
      var s = document.createElement('script'); s.src = '/js/vendor/qrcode.min.js';
      s.onload = function () { res(window.qrcode || null); };
      s.onerror = function () { res(null); };   // QR optional — book page still renders without it
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
        var ctx = c.getContext('2d');
        var lk = LOOKS[CFG.look]; if (lk && lk.css !== 'none' && 'filter' in ctx) ctx.filter = lk.css;
        ctx.drawImage(img, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, oW, oH);
        res({ data: c.toDataURL('image/jpeg', 0.82), w: oW, h: oH });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = rej; img.src = URL.createObjectURL(file);
    });
  }
  // apply the chosen look to an already-prepared dataURL (used for hand-cropped photos)
  function gradeDataURL(dataUrl) {
    var lk = LOOKS[CFG.look];
    if (!lk || lk.css === 'none') return Promise.resolve(dataUrl);
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        var ctx = c.getContext('2d');
        if ('filter' in ctx) ctx.filter = lk.css;
        ctx.drawImage(img, 0, 0);
        res(c.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = function () { res(dataUrl); };
      img.src = dataUrl;
    });
  }
  var dlBtn = $('#apDownload');
  if (dlBtn) dlBtn.addEventListener('click', function () {
    if (!photos.length) { alert('Add at least one photo first — your portfolio is built from your photos.'); return; }
    var name = (form.name.value || '').trim();
    if (!name) { alert('Add your name first.'); if (form.name) form.name.focus(); return; }
    var orig = dlBtn.textContent; dlBtn.disabled = true; dlBtn.textContent = 'Building your portfolio…';
    Promise.all([ensureJsPDF(), ensureFonts(), ensureQR()])
      .then(function (rr) {
        var JsPDF = rr[0];
        return Promise.all(photos.slice(0, 8).map(function (p) {
          var pr = p.edited ? gradeDataURL(p.edited).then(function (d) { return { data: d, w: 900, h: 1125 }; }) : prepImg(p.file, 0.8, 1000);
          return pr.then(function (im) { im.cat = p.cat || ''; im.fit = !!p.fit; return im; });
        }))
          .then(function (imgs) {
            var th = THEMES[CFG.theme];
            buildPortfolio(JsPDF, imgs, name, { bg: hexRgb(th.bg), text: hexRgb(th.text), sub: hexRgb(th.sub), accent: hexRgb(CFG.accent), font: FONTS[CFG.font].pdf, template: CFG.layout });
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
    var TAG = stripContact((form.tagline && form.tagline.value || '').trim());   // signature line, contact scrubbed
    function st(k) { var el = form['stat_' + k]; return el && el.value.trim() ? el.value.trim() : ''; }
    var STATS = [['Height', st('height')], ['Bust', st('bust')], ['Waist', st('waist')], ['Hips', st('hips')], ['Shoe', st('shoe')], ['Hair', st('hair')], ['Eyes', st('eyes')], ['Skin', st('skin')]].filter(function (r) { return r[1]; });
    // digitals = natural, unretouched shots — pulled out of the main flow onto their own casting page
    // (comp card stays a tight 2-page format, so it keeps them in the grid instead)
    var digitals = [];
    if (cfg.template !== 'compcard') {
      digitals = imgs.filter(function (im) { return im.cat === 'Digitals'; });
      if (digitals.length && digitals.length < imgs.length) imgs = imgs.filter(function (im) { return im.cat !== 'Digitals'; });
      else digitals = [];   // if every shot is a digital, keep them in the book rather than emptying it
    }
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

    /* ── TEMPLATE: Lookbook (full-bleed, photo-forward) ── */
    function tplLookbook() {
      fill(); bleed(imgs[0], 0, 0, W, H); shade(H - 210, 210, 0.55); watermark(true);
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct([255, 255, 255]); doc.text('YKS  ·  TALENT PORTFOLIO', M, 52);
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), M, H - 92);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 26 : 34); ct([255, 255, 255]); doc.text(NM, M, H - 54);
      doc.setFont(F, 'normal'); doc.setFontSize(TAG ? 9.5 : 8); ct(TAG ? [255, 255, 255] : [232, 227, 217]); doc.text(TAG || 'EDITION 2026 · EXCLUSIVE · YKS', M, H - 36);
      imgs.slice(1, 8).forEach(function (im) {
        doc.addPage(); fill(); bleed(im, 0, 0, W, H); shade(H - 64, 64, 0.5); watermark(true);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct([255, 255, 255]);
        doc.text((im.cat || cat).toUpperCase(), M, H - 28); doc.text(NM, W - M, H - 28, { align: 'right' });
      });
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('PROFILE', M, 58);
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' }); ruleY(70);
      doc.setFont(F, 'bold'); doc.setFontSize(28); ct(TX); doc.text(name, M, 112);
      doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(SUB); doc.text([cat, city].filter(Boolean).join('   ·   ').toUpperCase(), M, 132);
      var ay = 172;
      if (about) { doc.setFont(F, 'normal'); doc.setFontSize(11); ct(TX); var ln = doc.splitTextToSize(about, CW).slice(0, 9); doc.text(ln, M, ay); ay += ln.length * 15 + 26; }
      if (STATS.length) { doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('MEASUREMENTS', M, ay); ay += 16; STATS.forEach(function (r) { doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text(r[0].toUpperCase(), M, ay); doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text(r[1], M + 230, ay, { align: 'right' }); doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.4); doc.line(M, ay + 6, M + 230, ay + 6); ay += 20; }); }
      foot();
      digitalsPage();
      bookPage();
    }
    /* ── TEMPLATE: Minimal (airy, centred, one photo per page) ── */
    function tplMinimal() {
      var CX = W / 2;
      fill(); watermark();
      var pw = 300; place(imgs[0], CX - pw / 2, 128, pw);
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('YKS  ·  TALENT PORTFOLIO', CX, 72, { align: 'center' });
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 22 : 28); ct(TX); doc.text(NM, CX, 128 + 375 + 46, { align: 'center' });
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct(AC); doc.text(disc.toUpperCase(), CX, 128 + 375 + 68, { align: 'center' });
      if (TAG) { doc.setFont(F, 'normal'); doc.setFontSize(9); ct(SUB); doc.text(TAG, CX, 128 + 375 + 88, { align: 'center' }); }
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct(AC); doc.text('PROFILE', CX, 122, { align: 'center' });
      doc.setFont(F, 'bold'); doc.setFontSize(24); ct(TX); doc.text(name, CX, 158, { align: 'center' });
      doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(SUB); doc.text([cat, city].filter(Boolean).join('   ·   ').toUpperCase(), CX, 178, { align: 'center' });
      var ay = 220;
      if (about) { doc.setFont(F, 'normal'); doc.setFontSize(11); ct(TX); var ln = doc.splitTextToSize(about, CW * 0.72).slice(0, 8); doc.text(ln, CX, ay, { align: 'center' }); ay += ln.length * 16 + 30; }
      if (STATS.length) { doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('MEASUREMENTS', CX, ay, { align: 'center' }); ay += 22; doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(TX); doc.text(doc.splitTextToSize(STATS.map(function (r) { return r[0] + ' ' + r[1]; }).join('      ·      '), CW * 0.82), CX, ay, { align: 'center' }); }
      imgs.slice(1, 7).forEach(function (im) {
        doc.addPage(); fill(); watermark();
        var w = 360; place(im, CX - w / 2, 92, w);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text((im.cat || cat).toUpperCase(), CX, 92 + w / 0.8 + 22, { align: 'center' });
      });
      digitalsPage();
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(26); ct(TX); doc.text('BOOK ' + NM, CX, H / 2 - 60, { align: 'center' });
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct(SUB); doc.text('Represented exclusively by YKS Productions', CX, H / 2 - 34, { align: 'center' }); doc.text('+91 97466 79720   ·   yksproductions.com', CX, H / 2 - 18, { align: 'center' });
      var mqs = 132;
      if (drawQR(bookURL, CX - mqs / 2, H / 2 + 6, mqs)) { doc.setFont(F, 'normal'); doc.setFontSize(7.5); ct(SUB); doc.text('SCAN TO BOOK THROUGH YKS', CX, H / 2 + 6 + mqs + 16, { align: 'center' }); }
    }
    /* ── TEMPLATE: Comp Card (agency standard — face front, grid + stats back) ── */
    function tplCompCard() {
      // FRONT — one hero headshot, name, agency mark
      fill(); bleed(imgs[0], 0, 0, W, H); shade(0, 108, 0.4); shade(H - 188, 188, 0.62); watermark(true);
      doc.setFont(F, 'bold'); doc.setFontSize(11); ct([255, 255, 255]); doc.text('YKS  ·  TALENT', M, 50);
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct([232, 227, 217]); doc.text('COMP CARD', W - M, 50, { align: 'right' });
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct(AC); doc.text(disc.toUpperCase(), M, H - 92);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 30 : 40); ct([255, 255, 255]); doc.text(NM, M, H - 54);
      doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(TAG ? AC : [232, 227, 217]); doc.text(TAG || [cat, city].filter(Boolean).join('   ·   ').toUpperCase(), M, H - 34);
      var cqs = 78, cqx = W - M - cqs, cqy = H - 40 - cqs;
      if (drawQR(bookURL, cqx, cqy, cqs)) { doc.setFont(F, 'normal'); doc.setFontSize(6.5); ct([232, 227, 217]); doc.text('SCAN TO BOOK', cqx + cqs / 2, cqy - 5, { align: 'center' }); }
      // BACK — 2×2 grid of varied shots + measurements band + booking
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct(AC); doc.text(NM, M, 54);
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(disc.toUpperCase(), W - M, 54, { align: 'right' }); ruleY(66);
      var grid = imgs.slice(1, 5); if (!grid.length) grid = imgs.slice(0, 1);
      var gap = 18, cw = 214, ch = cw / 0.8, gridW = cw * 2 + gap, gx0 = (W - gridW) / 2, gy0 = 84;
      grid.forEach(function (im, k) { doc.addImage(im.data, 'JPEG', gx0 + (k % 2) * (cw + gap), gy0 + Math.floor(k / 2) * (ch + gap), cw, ch); });
      var sy = 662;
      if (STATS.length) {
        doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('MEASUREMENTS', M, sy);
        doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.5); doc.line(M, sy + 8, W - M, sy + 8);
        var half = Math.ceil(STATS.length / 2), colW = CW / 2 - 12;
        STATS.forEach(function (r, k) {
          var col = k < half ? 0 : 1, row = k < half ? k : k - half, x = M + col * (CW / 2 + 12), y = sy + 26 + row * 18;
          doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text(r[0].toUpperCase(), x, y);
          doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text(r[1], x + colW, y, { align: 'right' });
        });
      }
      foot();
    }
    // shared profile page (used by Grid + Feature)
    function profilePage() {
      doc.addPage(); fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('PROFILE', M, 58);
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' }); ruleY(70);
      doc.setFont(F, 'bold'); doc.setFontSize(26); ct(TX); doc.text(name, M, 108);
      doc.setFont(F, 'normal'); doc.setFontSize(9.5); ct(SUB); doc.text([cat, city].filter(Boolean).join('   ·   ').toUpperCase(), M, 126);
      var ay = 162;
      if (about) { doc.setFont(F, 'normal'); doc.setFontSize(11); ct(TX); var ln = doc.splitTextToSize(about, CW).slice(0, 10); doc.text(ln, M, ay); ay += ln.length * 15 + 24; }
      if (STATS.length) { doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('MEASUREMENTS', M, ay); ay += 16; STATS.forEach(function (r) { doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text(r[0].toUpperCase(), M, ay); doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text(r[1], M + 230, ay, { align: 'right' }); doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.4); doc.line(M, ay + 6, M + 230, ay + 6); ay += 20; }); }
      foot();
    }
    /* ── TEMPLATE: Grid (contact sheet — shows range) ── */
    function tplGrid() {
      fill(); place(imgs[0], M, 76, CW); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(12); ct(TX); doc.text('YKS', M, 58);
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('TALENT PORTFOLIO', W - M, 58, { align: 'right' });
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), M, 732);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 22 : 27); ct(TX); doc.text(NM, M, 766);
      if (TAG) { doc.setFont(F, 'normal'); doc.setFontSize(10); ct(AC); doc.text(TAG, M, 786); }
      else { doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('EDITION 2026 · EXCLUSIVE · YKS', M, 786); }
      var rest = imgs.slice(1), cols = 3, gap = 12, cw = (CW - gap * (cols - 1)) / cols, ch = cw / 0.8, per = 9, rgap = 22;
      for (var i = 0; i < rest.length; i += per) {
        doc.addPage(); fill(); watermark();
        doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('SELECTED WORK', M, 58);
        doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' }); ruleY(70);
        rest.slice(i, i + per).forEach(function (im, k) { doc.addImage(im.data, 'JPEG', M + (k % cols) * (cw + gap), 88 + Math.floor(k / cols) * (ch + rgap), cw, ch); });
        foot();
      }
    }
    /* ── TEMPLATE: Feature (magazine spread — big image + typographic sidebar + a companion) ── */
    function tplFeature() {
      fill(); bleed(imgs[0], 0, 0, W, H); shade(H - 200, 200, 0.6); watermark(true);
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct([255, 255, 255]); doc.text('YKS · TALENT PORTFOLIO', M, 52);
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), M, H - 90);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 26 : 34); ct([255, 255, 255]); doc.text(NM, M, H - 52);
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct([232, 227, 217]); doc.text(TAG || 'EDITION 2026 · EXCLUSIVE · YKS', M, H - 34);
      var rest = imgs.slice(1), pn = 1;
      for (var i = 0; i < rest.length; i += 2) {
        doc.addPage(); fill(); watermark();
        var big = rest[i], small = rest[i + 1], bw = CW * 0.60, by = 96, bh = bw / 0.8;
        place(big, M, by, bw);
        var sx = M + bw + 22, sw = CW - bw - 22;
        doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('PLATE ' + ('0' + (pn++)).slice(-2), sx, by + 12);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text((big.cat || cat).toUpperCase(), sx, by + 28);
        doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.6); doc.line(sx, by + 40, sx + sw, by + 40);
        doc.setFont(F, 'bold'); doc.setFontSize(15); ct(TX); doc.text(doc.splitTextToSize(name, sw), sx, by + 66);
        if (small) { var sh = sw / 0.8; place(small, sx, by + bh - sh, sw); }
        foot();
      }
    }
    /* ── TEMPLATE: Swiss (international style — strict grid, flush-left, bold, accent blocks) ── */
    function tplSwiss() {
      fill();
      doc.setDrawColor.apply(doc, TX); doc.setLineWidth(1.5); doc.line(M, 64, W - M, 64);
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text('YKS', M, 56);
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct(SUB); doc.text('TALENT / 2026', W - M, 56, { align: 'right' });
      doc.setFillColor.apply(doc, AC); doc.rect(M, 88, 150, 58, 'F');
      doc.setFont(F, 'bold'); doc.setFontSize(10); ct([255, 255, 255]); doc.text((disc.split(' · ')[0] || cat).toUpperCase(), M + 12, 122);
      var pw = CW * 0.6; place(imgs[0], W - M - pw, 88, pw); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 14 ? 34 : 46); ct(TX); doc.text(NM, M, H - 92);
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct(SUB); doc.text(disc.toUpperCase(), M, H - 68);
      doc.setDrawColor.apply(doc, TX); doc.setLineWidth(1.5); doc.line(M, H - 56, W - M, H - 56);
      doc.setFont(F, 'normal'); doc.setFontSize(7.5); ct(SUB); doc.text('REPRESENTED BY YKS PRODUCTIONS', M, H - 42); doc.text('+91 97466 79720', W - M, H - 42, { align: 'right' });
      var rest = imgs.slice(1);
      for (var i = 0; i < rest.length; i += 2) {
        doc.addPage(); fill(); watermark();
        doc.setDrawColor.apply(doc, TX); doc.setLineWidth(1.5); doc.line(M, 64, W - M, 64);
        doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text('SELECTED WORK', M, 56);
        doc.setFont(F, 'normal'); doc.setFontSize(9); ct(SUB); doc.text(NM, W - M, 56, { align: 'right' });
        var cw = (CW - 18) / 2;
        [rest[i], rest[i + 1]].forEach(function (im, k) { if (im) { place(im, M + k * (cw + 18), 92, cw); doc.setFont(F, 'bold'); doc.setFontSize(8); ct(AC); doc.text(('0' + (i + k + 1)).slice(-2) + ' / ' + ((im.cat || cat)).toUpperCase(), M + k * (cw + 18), 92 + cw / 0.8 + 16); } });
        foot();
      }
    }
    /* ── TEMPLATE: Luxe (luxury typography — type-led, full-bleed, elegant hairlines) ── */
    function tplLuxe() {
      fill(); bleed(imgs[0], 0, 0, W, H); shade(0, H, 0.3); watermark(true);
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct([255, 255, 255]); doc.text('YKS  ·  TALENT', M, 60);
      doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.4); doc.line(M, H / 2 - 72, M + 66, H / 2 - 72);
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct(AC); doc.text(disc.toUpperCase(), M, H / 2 - 54);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 14 ? 38 : 52); ct([255, 255, 255]); doc.text(NM, M, H / 2 + 6);
      if (TAG) { doc.setFont(F, 'normal'); doc.setFontSize(11); ct([232, 227, 217]); doc.text(TAG, M, H / 2 + 38); }
      imgs.slice(1, 7).forEach(function (im) {
        doc.addPage(); fill(); watermark();
        var pw = CW * 0.7, px = (W - pw) / 2; place(im, px, 96, pw);
        doc.setDrawColor.apply(doc, AC); doc.setLineWidth(0.4); doc.line(px, 74, px + 40, 74);
        doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text((im.cat || cat).toUpperCase(), px, 66);
        doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 66, { align: 'right' });
        foot();
      });
    }
    /* ── TEMPLATE: Classic (neo-classical — symmetrical, centred, decorative double rules) ── */
    function tplClassic() {
      var CX = W / 2;
      function drule(y, w) { doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(1.1); doc.line(CX - w / 2, y, CX + w / 2, y); doc.setLineWidth(0.4); doc.line(CX - w / 2, y + 3, CX + w / 2, y + 3); }
      fill(); watermark();
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text('YKS · TALENT PORTFOLIO', CX, 62, { align: 'center' });
      drule(78, 120);
      var pw = 300; place(imgs[0], CX - pw / 2, 106, pw);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 26 : 34); ct(TX); doc.text(NM, CX, 106 + pw / 0.8 + 50, { align: 'center' });
      doc.setFont(F, 'normal'); doc.setFontSize(9); ct(AC); doc.text(disc.toUpperCase(), CX, 106 + pw / 0.8 + 72, { align: 'center' });
      drule(106 + pw / 0.8 + 90, 90);
      imgs.slice(1, 7).forEach(function (im) {
        doc.addPage(); fill(); watermark(); drule(70, 90);
        var w = 360; place(im, CX - w / 2, 92, w);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text((im.cat || cat).toUpperCase(), CX, 92 + w / 0.8 + 22, { align: 'center' });
        foot();
      });
    }
    /* ── TEMPLATE: Ethereal (soft, airy, light — delicate type, generous air, faint wash) ── */
    function tplEthereal() {
      var CX = W / 2;
      fill();
      if (doc.setGState) { doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.06 })); doc.setFillColor.apply(doc, AC); doc.rect(0, 0, W, H * 0.55, 'F'); doc.restoreGraphicsState(); }
      watermark();
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('yks   ·   talent   ·   2026', CX, 74, { align: 'center' });
      var pw = 264; place(imgs[0], CX - pw / 2, 120, pw);
      doc.setFont(F, 'normal'); doc.setFontSize(NM.length > 16 ? 24 : 30); ct(TX); doc.text(NM, CX, 120 + pw / 0.8 + 56, { align: 'center' });
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), CX, 120 + pw / 0.8 + 80, { align: 'center' });
      if (TAG) { doc.setFont(F, 'normal'); doc.setFontSize(10); ct(SUB); doc.text(TAG, CX, 120 + pw / 0.8 + 100, { align: 'center' }); }
      imgs.slice(1, 7).forEach(function (im) {
        doc.addPage(); fill(); watermark();
        var w = 320; place(im, CX - w / 2, 112, w);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text((im.cat || cat).toLowerCase(), CX, 112 + w / 0.8 + 24, { align: 'center' });
        foot();
      });
    }
    /* ── TEMPLATE: Wabi-Sabi (quiet, natural, muted, asymmetric, imperfect) ── */
    function tplWabi() {
      fill(); watermark();
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('YKS · TALENT', M, 64);
      var pw = CW * 0.56; place(imgs[0], M, 96, pw);
      var ny = 96 + pw / 0.8 + 42;
      doc.setFont(F, 'normal'); doc.setFontSize(NM.length > 16 ? 24 : 30); ct(TX); doc.text(NM, W - M, ny, { align: 'right' });
      doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), W - M, ny + 20, { align: 'right' });
      doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(0.5); doc.line(W - M - 120, ny + 34, W - M, ny + 34);
      imgs.slice(1, 7).forEach(function (im, idx) {
        doc.addPage(); fill(); watermark();
        var w = CW * 0.64, x = (idx % 2 === 0) ? M : (W - M - w);
        place(im, x, 104, w);
        doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text((im.cat || cat).toUpperCase(), x, 104 + w / 0.8 + 22);
        foot();
      });
    }
    /* ── TEMPLATE: Bento (modular grid — a designed composition of varied cells) ── */
    function tplBento() {
      fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(9); ct(TX); doc.text('YKS', M, 56);
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('TALENT PORTFOLIO', W - M, 56, { align: 'right' });
      var hw = 300, hh = hw / 0.8; place(imgs[0], M, 76, hw);
      var rx = M + hw + 12, rw = CW - hw - 12;
      doc.setFillColor.apply(doc, AC); doc.rect(rx, 76, rw, 118, 'F');
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 12 ? 15 : 19); ct([255, 255, 255]); doc.text(doc.splitTextToSize(NM, rw - 22), rx + 12, 108);
      doc.setFont(F, 'normal'); doc.setFontSize(7); ct([255, 255, 255]); doc.text((disc.split(' · ')[0] || cat).toUpperCase(), rx + 12, 180);
      if (imgs[1]) place(imgs[1], rx, 206, rw);
      var sy = 76 + hh + 14;
      doc.setDrawColor.apply(doc, SUB); doc.setLineWidth(1); doc.roundedRect(M, sy, CW, 64, 6, 6, 'S');
      if (STATS.length) { var per = Math.min(STATS.length, 5), stw = CW / per; STATS.slice(0, per).forEach(function (r, k) { var x = M + k * stw + 14; doc.setFont(F, 'normal'); doc.setFontSize(7); ct(SUB); doc.text(r[0].toUpperCase(), x, sy + 25); doc.setFont(F, 'bold'); doc.setFontSize(12); ct(TX); doc.text(r[1], x, sy + 45); }); }
      else { doc.setFont(F, 'normal'); doc.setFontSize(9); ct(SUB); doc.text([cat, city].filter(Boolean).join('   ·   ').toUpperCase(), M + 14, sy + 38); }
      var by = sy + 64 + 14, mw = (CW - 24) / 3;
      [imgs[2], imgs[3], imgs[4]].forEach(function (im, k) { if (im) place(im, M + k * (mw + 12), by, mw); });
      foot();
      var rest = imgs.slice(5);
      for (var i = 0; i < rest.length; i += 4) {
        doc.addPage(); fill(); watermark();
        doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('MORE', M, 58);
        doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' }); ruleY(70);
        var cw = (CW - 14) / 2;
        rest.slice(i, i + 4).forEach(function (im, k) { place(im, M + (k % 2) * (cw + 14), 88 + Math.floor(k / 2) * (cw / 0.8 + 16), cw); });
        foot();
      }
    }
    /* ── TEMPLATE: Duo (diptych — two photos paired per page) ── */
    function tplDuo() {
      fill(); watermark();
      doc.setFont(F, 'bold'); doc.setFontSize(12); ct(TX); doc.text('YKS', M, 58);
      doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('TALENT PORTFOLIO', W - M, 58, { align: 'right' });
      var cw = (CW - 14) / 2; place(imgs[0], M, 76, cw); if (imgs[1]) place(imgs[1], M + cw + 14, 76, cw);
      var ny = 76 + cw / 0.8 + 34;
      doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), M, ny);
      doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 22 : 27); ct(TX); doc.text(NM, M, ny + 30);
      if (TAG) { doc.setFont(F, 'normal'); doc.setFontSize(10); ct(AC); doc.text(TAG, M, ny + 50); }
      var rest = imgs.slice(2), pn = 1;
      for (var i = 0; i < rest.length; i += 2) {
        doc.addPage(); fill(); watermark();
        doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text('SELECTED WORK', M, 58);
        doc.setFont(F, 'normal'); doc.setFontSize(8.5); ct(SUB); doc.text(NM, W - M, 58, { align: 'right' }); ruleY(70);
        var w = (CW - 14) / 2, y = 96;
        [rest[i], rest[i + 1]].forEach(function (im, k) { if (im) { place(im, M + k * (w + 14), y, w); doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('PLATE ' + ('0' + (pn++)).slice(-2) + '  ·  ' + ((im.cat || cat)).toUpperCase(), M + k * (w + 14), y + w / 0.8 + 16); } });
        foot();
      }
    }
    if (cfg.template === 'lookbook') { tplLookbook(); doc.save(SAVE); return; }
    if (cfg.template === 'duo') { tplDuo(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'compcard') { tplCompCard(); doc.save(SAVE); return; }
    if (cfg.template === 'minimal') { tplMinimal(); doc.save(SAVE); return; }
    if (cfg.template === 'grid') { tplGrid(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'feature') { tplFeature(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'swiss') { tplSwiss(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'luxe') { tplLuxe(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'classic') { tplClassic(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'ethereal') { tplEthereal(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'wabi') { tplWabi(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }
    if (cfg.template === 'bento') { tplBento(); profilePage(); digitalsPage(); bookPage(); doc.save(SAVE); return; }

    // ── COVER ── (Editorial, default)
    fill(); place(imgs[0], M, 76, CW); watermark();
    doc.setFont(F, 'bold'); doc.setFontSize(12); ct(TX); doc.text('YKS', M, 58);
    doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('TALENT PORTFOLIO', W - M, 58, { align: 'right' });
    doc.setFont(F, 'bold'); doc.setFontSize(8.5); ct(AC); doc.text(disc.toUpperCase(), M, 732);
    doc.setFont(F, 'bold'); doc.setFontSize(NM.length > 16 ? 22 : 27); ct(TX); doc.text(NM, M, 766);
    if (TAG) { doc.setFont(F, 'normal'); doc.setFontSize(10); ct(AC); doc.text(TAG, M, 786); }
    else { doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('EDITION 2026 / 01     ·     EXCLUSIVE     ·     YKS', M, 786); }
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
      [plates[i], plates[i + 1]].forEach(function (im, k) { if (im) { doc.setFont(F, 'normal'); doc.setFontSize(8); ct(SUB); doc.text('PLATE ' + ('0' + (pn++)).slice(-2) + '   ·   ' + ((im.cat || cat)).toUpperCase(), M + k * (cw + 20), y + cw / 0.8 + 16); } });
      foot();
    }
    // ── DIGITALS (if any) + BOOK ──
    digitalsPage();
    bookPage();
    doc.save(SAVE);
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
