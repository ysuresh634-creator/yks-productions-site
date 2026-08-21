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
  var ENGINE_URL = 'https://yks-talents-engine.ysuresh634.workers.dev';   // YKS Talents Engine — feeds the roster/management pipeline
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
  // casting-relevant sections, each with a "what casting wants" tip
  var SECTIONS = [
    { k: 'Headshots',   tip: 'Face &amp; expression. Natural light, minimal retouch, eyes to camera.' },
    { k: 'Full length', tip: 'Head-to-toe — it shows your frame and proportions.' },
    { k: 'Fashion',     tip: 'Editorial / campaign energy — proof you can perform to camera.' },
    { k: 'Commercial',  tip: 'Approachable, a real smile — the bookable, relatable you.' },
    { k: 'Beauty',      tip: 'Close and clean — skin, features, detail.' },
    { k: 'Digitals',    tip: 'Front, profile &amp; full-length in plain light, minimal makeup — casting specifically asks for these.' }
  ];
  var CATS = SECTIONS.map(function (s) { return s.k; });   // thumbnails still tag by section
  var activeCat = 'Headshots';   // new photos land in the selected section

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
  /* ── AI shot-type auto-sort (client-side, no Claude at runtime): pico.js face detection → the face's size in frame
        tells us the framing → Headshots / Full length / Fashion / Beauty. Instant, private (never leaves the browser),
        works on mobile. Style calls (Commercial/Digitals) stay a one-tap override. ── */
  var _picoP = null, _picoClassify = null;
  function ensurePico() {
    if (_picoP) return _picoP;
    _picoP = new Promise(function (res, rej) {
      function boot() { fetch('/js/vendor/facefinder').then(function (r) { return r.arrayBuffer(); }).then(function (buf) { _picoClassify = window.pico.unpack_cascade(new Int8Array(buf)); res(_picoClassify); }).catch(rej); }
      if (window.pico && window.pico.unpack_cascade) return boot();
      var s = document.createElement('script'); s.src = '/js/vendor/pico.js?v=1';
      s.onload = boot; s.onerror = rej; document.head.appendChild(s);
    });
    return _picoP;
  }
  function classifyFraming(im) {
    var TH = 480, sc = TH / im.naturalHeight, W = Math.max(1, Math.round(im.naturalWidth * sc)), H = TH;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0, W, H);
    var d = ctx.getImageData(0, 0, W, H).data, gray = new Uint8Array(W * H);
    for (var i = 0; i < W * H; i++) gray[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) | 0;
    var dets = window.pico.run_cascade({ pixels: gray, nrows: H, ncols: W, ldim: W }, _picoClassify, { shiftfactor: 0.1, minsize: Math.round(H * 0.05), maxsize: H, scalefactor: 1.1 });
    dets = window.pico.cluster_detections(dets, 0.2);
    var best = null; for (var j = 0; j < dets.length; j++) if (!best || dets[j][3] > best[3]) best = dets[j];
    var q = best ? best[3] : 0, frac = best ? best[2] / H : 0;   // frac = face diameter ÷ image height
    // no confident frontal face → could be a body shot OR a turned-away/profile portrait: that's the one case worth a second opinion
    if (q < 6) return { cat: 'Full length', sure: false };
    if (frac >= 0.32) return { cat: 'Beauty', sure: true };      // face fills the frame (close beauty)
    if (frac >= 0.20) return { cat: 'Headshots', sure: true };   // head & shoulders
    if (frac >= 0.13) return { cat: 'Fashion', sure: true };     // waist / chest-up editorial
    return { cat: 'Full length', sure: true };                   // small face → whole body in frame
  }
  /* Second opinion from the YKS engine's vision model — used ONLY when the on-device pass is unsure
     (no confident face). Measured: on-device beats the vision model on clear frames, so it stays authoritative. */
  function engineOpinion(item) {
    return new Promise(function (res) {
      try {
        var im = new Image();
        im.onload = function () {
          try {
            var S = 448, sc = Math.min(S / im.naturalWidth, S / im.naturalHeight, 1);
            var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * sc)); c.height = Math.max(1, Math.round(im.naturalHeight * sc));
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            var to = setTimeout(function () { res(''); }, 12000);   // never make the talent wait
            fetch(ENGINE_URL + '/ai/classify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: c.toDataURL('image/jpeg', 0.8) }) })
              .then(function (r) { return r.json(); })
              .then(function (j) { clearTimeout(to); res((j && j.category) || ''); })
              .catch(function () { clearTimeout(to); res(''); });
          } catch (e) { res(''); }
        };
        im.onerror = function () { res(''); };
        im.src = item.edited || item.url;
      } catch (e) { res(''); }
    });
  }
  function clearDetecting(id) { var fig = thumbs.querySelector('.ap-thumb[data-id="' + id + '"]'); if (fig) { fig.classList.remove('ap-detecting'); var db = fig.querySelector('.ap-detbadge'); if (db) db.remove(); } return fig; }
  function autoSort(item) {
    if (item.manual) { item.detecting = false; clearDetecting(item.id); return; }
    ensurePico().then(function () {
      var im = new Image();
      im.onload = function () {
        item.detecting = false;
        var r = null; try { r = classifyFraming(im); } catch (e) { r = null; }
        if (!item.manual && r && CATS.indexOf(r.cat) >= 0) { item.cat = r.cat; item.auto = true; }
        var fig = clearDetecting(item.id);
        if (fig) { var s = fig.querySelector('.ap-thumb-cat'); if (s) s.value = item.cat; }
        updatePreview(); if (typeof refreshPosters === 'function') refreshPosters();
        // unsure (no confident face) → quietly ask the engine for a second opinion; it only ever upgrades an uncertain guess
        if (r && !r.sure && !item.manual) {
          engineOpinion(item).then(function (cat) {
            if (!cat || item.manual || CATS.indexOf(cat) < 0 || cat === item.cat) return;
            item.cat = cat; item.auto = true;
            var f2 = thumbs.querySelector('.ap-thumb[data-id="' + item.id + '"]');
            if (f2) { var s2 = f2.querySelector('.ap-thumb-cat'); if (s2) s2.value = cat; }
            updatePreview();
          });
        }
      };
      im.onerror = function () { item.detecting = false; clearDetecting(item.id); };
      im.src = item.edited || item.url;
    }).catch(function () { item.detecting = false; clearDetecting(item.id); });
  }
  function addPhotos(list) {
    var arr = Array.prototype.slice.call(list).filter(isImageFile);
    if (!arr.length) return;
    var lbl = $('#apDropLabel');
    if (lbl && arr.some(isHeic)) lbl.textContent = 'Converting photos…';
    Promise.all(arr.map(normalizeFile)).then(function (files) {
      var added = [];
      files.forEach(function (f) { var it = { file: f, id: ++uid, url: URL.createObjectURL(f), cat: activeCat, detecting: activeCat !== 'Digitals' }; photos.push(it); added.push(it); });
      renderThumbs();
      added.forEach(function (it) { if (it.detecting) autoSort(it); });   // Digitals is an explicit choice — respect it, don't auto-override
    });
  }
  function idxOf(id) { for (var i = 0; i < photos.length; i++) if (photos[i].id === id) return i; return -1; }
  function renderThumbs() {
    thumbs.innerHTML = '';
    photos.forEach(function (item, idx) {
      var fig = document.createElement('div'); fig.className = 'ap-thumb' + (item.detecting ? ' ap-detecting' : ''); fig.dataset.id = item.id; fig.draggable = true;
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
      if (item.detecting) { var _db = document.createElement('span'); _db.className = 'ap-detbadge'; _db.textContent = '✨ sorting…'; media.appendChild(_db); }
      var sel = document.createElement('select'); sel.className = 'ap-thumb-cat';
      CATS.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; if (c === (item.cat || CATS[0])) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { item.cat = sel.value; item.manual = true; item.auto = false; updatePreview(); });
      fig.appendChild(sel);
      fig.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', String(item.id)); fig.classList.add('dragging'); });
      fig.addEventListener('dragend', function () { fig.classList.remove('dragging'); });
      fig.addEventListener('dragover', function (e) { e.preventDefault(); });
      fig.addEventListener('drop', function (e) { e.preventDefault(); var from = idxOf(+e.dataTransfer.getData('text/plain')), to = idxOf(item.id); if (from < 0 || to < 0 || from === to) return; photos.splice(to, 0, photos.splice(from, 1)[0]); renderThumbs(); });
      thumbs.appendChild(fig);
    });
    reflectPhotoCount(); renderCover(); renderStrength(); if (typeof renderTemplates === 'function') renderTemplates(); updatePreview();
    if (typeof refreshPosters === 'function') refreshPosters();
  }
  function reflectPhotoCount() {
    var b = $('#apDropLabel');
    if (b) b.textContent = photos.length ? ('Add more — ' + activeCat) : ('Add your ' + activeCat);
  }
  function showSecTip(cat) {
    var el = $('#apSecTip'); if (!el) return;
    var s = SECTIONS.filter(function (x) { return x.k === cat; })[0];
    el.innerHTML = s ? ('<b>' + esc(cat) + '</b> — ' + s.tip) : '';
  }
  (function buildCatChips() {
    var wrap = $('#apCats'); if (!wrap) return;
    CATS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-catchip' + (c === activeCat ? ' on' : ''); b.textContent = c;
      b.addEventListener('click', function () {
        activeCat = c; $$('.ap-catchip', wrap).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); reflectPhotoCount(); showSecTip(c);
      });
      wrap.appendChild(b);
    });
    showSecTip(activeCat);
  })();
  // the hero cover (first photo) shown prominently — the frame a client sees first
  function renderCover() {
    var pic = $('#apCoverPic'); if (!pic) return;
    if (photos[0]) { pic.innerHTML = '<img src="' + (photos[0].edited || photos[0].url) + '" alt="cover">'; pic.classList.add('has'); }
    else { pic.innerHTML = '<span class="ap-cover-star">★</span>'; pic.classList.remove('has'); }
  }
  // casting-ready strength meter — which sections are covered, nudging a well-rounded book
  function renderStrength() {
    var el = $('#apStrength'); if (!el) return;
    if (!photos.length) { el.hidden = true; return; }
    el.hidden = false;
    var have = {}; photos.forEach(function (p) { if (p.cat) have[p.cat] = true; });
    var done = SECTIONS.filter(function (s) { return have[s.k]; }).length, pct = Math.round(done / SECTIONS.length * 100);
    var missing = SECTIONS.filter(function (s) { return !have[s.k]; }).map(function (s) { return s.k; });
    var chips = SECTIONS.map(function (s) { return '<span class="ap-str-chip' + (have[s.k] ? ' on' : '') + '">' + (have[s.k] ? '✓ ' : '') + esc(s.k) + '</span>'; }).join('');
    el.innerHTML = '<div class="ap-str-head"><b>Portfolio strength</b><span>' + done + ' / ' + SECTIONS.length + ' sections' +
      (done < SECTIONS.length ? '  ·  add ' + missing.slice(0, 2).join(', ') : '  ·  well-rounded ✓') + '</span></div>' +
      '<div class="ap-str-bar"><i style="width:' + pct + '%"></i></div><div class="ap-str-chips">' + chips + '</div>';
  }
  renderCover();

  /* ══ POSTER ENGINE — Canva-style: pick a template, we render a YKS-branded social poster from their own photo.
     Pure client-side canvas → downloadable/shareable PNG. No Claude. Every template carries YKS branding. ══ */
  var POSTER_FORMATS = { feed: [1080, 1350], story: [1080, 1920], square: [1080, 1080] };
  var POSTER_MSGS = {
    welcome: { head: 'Welcome to the roster', sub: 'Now represented by YKS' },
    booking: { head: 'Available for bookings', sub: 'Casting through YKS' },
    newwork: { head: 'New on the YKS Edit', sub: 'Fresh work, out now' },
    featured: { head: 'Featured talent', sub: 'Represented by YKS' }
  };
  // social-media template sub-sections (Canva-style grouping)
  var POSTER_CATS = [
    { k: 'editorial', label: 'Editorial', note: 'Magazine-grade, portfolio-first' },
    { k: 'statement', label: 'Statement', note: 'Big type — announce yourself' },
    { k: 'social', label: 'Story & Social', note: 'Playful, made to share' }
  ];
  var POSTER = { tpl: 'edit', photo: 0, msg: 'welcome', fmt: 'feed' };
  var posterImgCache = {};
  function pLoad(src) {
    return posterImgCache[src] || (posterImgCache[src] = new Promise(function (res, rej) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src;
    }));
  }
  function pCover(ctx, img, x, y, w, h) {
    var ir = img.width / img.height, r = w / h, sw, sh, sx, sy;
    if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function pGrad(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g;
  }
  var DISPLAY = '"Bodoni Moda", Georgia, serif', MONO = '"Space Grotesk", system-ui, sans-serif';
  function pText(ctx, text, x, y, o) {
    ctx.font = (o.w || '500') + ' ' + o.size + 'px ' + (o.fam || MONO);
    ctx.fillStyle = o.color; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = (o.ls || 0) + 'px'; } catch (e) {}
    ctx.fillText(o.upper ? String(text).toUpperCase() : text, x, y);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
  }
  function pFit(ctx, text, fam, w, start, min, maxW) {
    var s = start; ctx.textAlign = 'left';
    while (s > min) { ctx.font = w + ' ' + s + 'px ' + fam; if (ctx.measureText(text).width <= maxW) break; s -= 2; }
    return s;
  }
  // rounded-rect path (older Android webviews lack ctx.roundRect)
  function pRR(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // wrap text to a width at a given font, return the lines
  function pWrap(ctx, text, fam, w, size, maxW) {
    ctx.font = w + ' ' + size + 'px ' + fam;
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  // YKS mark used on every template (the branding rule)
  function pBrand(ctx, W, x, y, light) {
    var col = light ? '#f4ede2' : '#0a0810';
    pText(ctx, 'YKS · TALENT EDIT', x, y, { size: 26, ls: 5, color: col, w: '600' });
  }
  var POSTER_TEMPLATES = [
    { k: 'edit', label: 'Editorial', cat: 'editorial', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, H);
      pGrad(ctx, 0, 0, 0, H * 0.30, [[0, 'rgba(7,6,10,.62)'], [1, 'rgba(7,6,10,0)']]); ctx.fillRect(0, 0, W, H * 0.30);
      pGrad(ctx, 0, H * 0.40, 0, H, [[0, 'rgba(7,6,10,0)'], [0.55, 'rgba(7,6,10,.86)'], [1, 'rgba(7,6,10,.98)']]); ctx.fillRect(0, H * 0.40, W, H * 0.60);
      pBrand(ctx, W, 64, 84, true);
      pText(ctx, 'yksproductions.com', W - 64, 84, { size: 22, color: 'rgba(244,237,226,.7)', align: 'right' });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 104, 52, W - 128);
      var nameY = H - 176;
      pText(ctx, d.head, 64, nameY - ns * 0.86 - 30, { size: 30, ls: 3, color: '#ff8c3b', w: '600', upper: true });
      pText(ctx, d.name, 64, nameY, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY });
      pText(ctx, d.disc, 64, H - 128, { size: 24, ls: 2, color: '#d8cfc4', upper: true });
      ctx.fillStyle = '#ff8c3b'; ctx.fillRect(64, H - 104, 88, 4);
      pText(ctx, d.foot, 64, H - 58, { size: 22, color: 'rgba(244,237,226,.62)' });
    } },
    { k: 'masthead', label: 'Cover', cat: 'editorial', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, H);
      pGrad(ctx, 0, 0, 0, H * 0.34, [[0, 'rgba(7,6,10,.7)'], [1, 'rgba(7,6,10,0)']]); ctx.fillRect(0, 0, W, H * 0.34);
      pGrad(ctx, 0, H * 0.55, 0, H, [[0, 'rgba(7,6,10,0)'], [1, 'rgba(7,6,10,.9)']]); ctx.fillRect(0, H * 0.55, W, H * 0.45);
      pText(ctx, 'YKS', W / 2, 168, { size: 150, color: '#f4ede2', w: '700', fam: DISPLAY, align: 'center' });
      pText(ctx, 'THE TALENT EDIT', W / 2, 212, { size: 26, ls: 12, color: '#ff8c3b', align: 'center', upper: true });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 96, 50, W - 140);
      pText(ctx, d.name, W / 2, H - 150, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY, align: 'center' });
      pText(ctx, d.head, W / 2, H - 100, { size: 25, ls: 3, color: '#ff8c3b', align: 'center', w: '600', upper: true });
      pText(ctx, d.foot, W / 2, H - 56, { size: 21, color: 'rgba(244,237,226,.65)', align: 'center' });
    } },
    { k: 'band', label: 'Band', cat: 'statement', draw: function (ctx, W, H, img, d) {
      var ph = Math.round(H * 0.68);
      ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, ph);
      ctx.fillStyle = '#0a0810'; ctx.fillRect(0, ph, W, H - ph);
      ctx.fillStyle = '#ff8c3b'; ctx.fillRect(0, ph, W, 6);
      pBrand(ctx, W, 64, ph + 74, true);
      pText(ctx, d.head, W - 64, ph + 74, { size: 22, ls: 2, color: '#ff8c3b', align: 'right', upper: true });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 92, 48, W - 128);
      pText(ctx, d.name, 64, ph + 74 + 92, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY });
      pText(ctx, d.disc, 64, ph + 74 + 138, { size: 23, ls: 2, color: '#b9b0a6', upper: true });
      pText(ctx, d.foot, 64, H - 52, { size: 21, color: 'rgba(244,237,226,.6)' });
    } },
    { k: 'frame', label: 'Frame', cat: 'editorial', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, 0, W, H);
      var m = 70, iw = W - m * 2, ih = Math.round(iw * 1.15), iy = 150;
      ctx.save(); ctx.beginPath(); ctx.rect(m, iy, iw, ih); ctx.clip(); pCover(ctx, img, m, iy, iw, ih); ctx.restore();
      ctx.strokeStyle = 'rgba(255,140,59,.85)'; ctx.lineWidth = 3; ctx.strokeRect(m, iy, iw, ih);
      pText(ctx, 'YKS · TALENT EDIT', W / 2, 96, { size: 26, ls: 6, color: '#f4ede2', w: '600', align: 'center' });
      var by = iy + ih + 92;
      pText(ctx, d.head, W / 2, by, { size: 24, ls: 3, color: '#ff8c3b', align: 'center', w: '600', upper: true });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 90, 46, W - 160);
      pText(ctx, d.name, W / 2, by + 78, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY, align: 'center' });
      pText(ctx, d.disc, W / 2, by + 120, { size: 22, ls: 2, color: '#b9b0a6', align: 'center', upper: true });
      pText(ctx, d.foot, W / 2, H - 54, { size: 21, color: 'rgba(244,237,226,.55)', align: 'center' });
    } },
    { k: 'bold', label: 'Bold', cat: 'statement', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, H);
      ctx.fillStyle = 'rgba(7,6,10,.42)'; ctx.fillRect(0, 0, W, H);
      pGrad(ctx, 0, H * 0.5, 0, H, [[0, 'rgba(7,6,10,0)'], [1, 'rgba(7,6,10,.9)']]); ctx.fillRect(0, H * 0.5, W, H * 0.5);
      pBrand(ctx, W, 64, 84, true);
      pText(ctx, d.head, 64, 84, { size: 22, ls: 2, color: '#ff8c3b', align: 'left', upper: true });
      // big name, up to 2 lines
      var parts = d.name.split(' '), l1 = d.name, l2 = '';
      if (parts.length > 1 && ctx.measureText(d.name).width) { l1 = parts.shift(); l2 = parts.join(' '); }
      var ns = pFit(ctx, (l2 || l1), DISPLAY, '700', 150, 70, W - 120);
      var midY = H * 0.62;
      pText(ctx, l1.toUpperCase(), 60, midY, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY });
      if (l2) pText(ctx, l2.toUpperCase(), 60, midY + ns * 0.92, { size: ns, color: '#ff8c3b', w: '700', fam: DISPLAY });
      pText(ctx, d.disc, 64, H - 118, { size: 24, ls: 2, color: '#d8cfc4', upper: true });
      pText(ctx, d.foot, 64, H - 60, { size: 22, color: 'rgba(244,237,226,.62)' });
    } },
    /* ── Editorial ── */
    { k: 'split', label: 'Split', cat: 'editorial', draw: function (ctx, W, H, img, d) {
      var pw = Math.round(W * 0.60);
      ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, pw, H);
      pGrad(ctx, pw - 60, 0, pw, 0, [[0, 'rgba(10,8,16,0)'], [1, 'rgba(10,8,16,1)']]); ctx.fillRect(pw - 60, 0, 60, H);
      ctx.fillStyle = '#ff8c3b'; ctx.fillRect(pw, 0, 5, H);
      var px = pw + 44, pInW = W - px - 44;
      ctx.save(); ctx.translate(W - 40, H - 60); ctx.rotate(-Math.PI / 2);
      pText(ctx, 'YKS · TALENT EDIT', 0, 0, { size: 22, ls: 5, color: 'rgba(244,237,226,.6)', w: '600' }); ctx.restore();
      pText(ctx, d.head, px, 150, { size: 21, ls: 2, color: '#ff8c3b', w: '600', upper: true });
      var size = 78, lines;
      do { lines = pWrap(ctx, d.name, DISPLAY, '700', size, pInW); size -= 3; } while (lines.length > 3 && size > 40);
      var ly = 226;
      lines.forEach(function (ln) { pText(ctx, ln, px, ly, { size: size, color: '#f4ede2', w: '700', fam: DISPLAY }); ly += size * 0.98; });
      ctx.fillStyle = '#ff8c3b'; ctx.fillRect(px, ly + 8, 70, 4);
      var dl = pWrap(ctx, d.disc, MONO, '500', 21, pInW), dy = ly + 62;
      dl.forEach(function (ln) { pText(ctx, ln, px, dy, { size: 21, ls: 1, color: '#b9b0a6', upper: true }); dy += 30; });
      pText(ctx, 'yksproductions.com', px, H - 54, { size: 19, color: 'rgba(244,237,226,.55)' });
    } },
    { k: 'marquee', label: 'Marquee', cat: 'editorial', draw: function (ctx, W, H, img, d) {
      var ph = Math.round(H * 0.58);
      ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, ph);
      pGrad(ctx, 0, 0, 0, H * 0.20, [[0, 'rgba(10,8,16,.55)'], [1, 'rgba(10,8,16,0)']]); ctx.fillRect(0, 0, W, H * 0.20);
      pBrand(ctx, W, 64, 84, true);
      var band = Math.round(H * 0.13), by = ph, fs = Math.round(band * 0.6);
      ctx.fillStyle = '#ff8c3b'; ctx.fillRect(0, by, W, band);
      ctx.save(); ctx.beginPath(); ctx.rect(0, by, W, band); ctx.clip();
      var nm = d.name.toUpperCase() + '   ·   ';
      ctx.font = '700 ' + fs + 'px ' + DISPLAY;
      var unit = ctx.measureText(nm).width, tick = '';
      while (ctx.measureText(tick).width < W + unit) tick += nm;
      pText(ctx, tick, -Math.round(unit * 0.4), by + band * 0.7, { size: fs, color: '#0a0810', w: '700', fam: DISPLAY });
      ctx.restore();
      var fy = by + band;
      pText(ctx, d.head, W / 2, fy + (H - fy) * 0.42, { size: 24, ls: 3, color: '#ff8c3b', align: 'center', w: '600', upper: true });
      pText(ctx, d.disc, W / 2, fy + (H - fy) * 0.62, { size: 21, ls: 2, color: '#d8cfc4', align: 'center', upper: true });
      pText(ctx, d.foot, W / 2, H - 52, { size: 20, color: 'rgba(244,237,226,.6)', align: 'center' });
    } },
    /* ── Statement ── */
    { k: 'spotlight', label: 'Spotlight', cat: 'statement', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, H);
      var g = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.12, W / 2, H * 0.5, H * 0.72);
      g.addColorStop(0, 'rgba(7,6,10,0)'); g.addColorStop(0.6, 'rgba(7,6,10,.34)'); g.addColorStop(1, 'rgba(7,6,10,.94)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      pGrad(ctx, 0, H * 0.6, 0, H, [[0, 'rgba(7,6,10,0)'], [1, 'rgba(7,6,10,.92)']]); ctx.fillRect(0, H * 0.6, W, H * 0.4);
      pText(ctx, 'YKS · TALENT EDIT', W / 2, 88, { size: 24, ls: 6, color: 'rgba(244,237,226,.82)', w: '600', align: 'center' });
      pText(ctx, d.head, W / 2, H - 206, { size: 25, ls: 4, color: '#ff8c3b', align: 'center', w: '600', upper: true });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 100, 52, W - 130);
      pText(ctx, d.name, W / 2, H - 128, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY, align: 'center' });
      pText(ctx, d.disc, W / 2, H - 80, { size: 22, ls: 2, color: '#d8cfc4', align: 'center', upper: true });
      pText(ctx, d.foot, W / 2, H - 46, { size: 20, color: 'rgba(244,237,226,.6)', align: 'center' });
    } },
    { k: 'tag', label: 'Tag', cat: 'statement', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
      pCover(ctx, img, 0, 0, W, H);
      pGrad(ctx, 0, H * 0.55, 0, H, [[0, 'rgba(7,6,10,0)'], [1, 'rgba(7,6,10,.7)']]); ctx.fillRect(0, H * 0.55, W, H * 0.45);
      pText(ctx, 'YKS · TALENT EDIT', 60, 84, { size: 24, ls: 5, color: '#f4ede2', w: '600' });
      var bx = 56, pad = 30, tw = Math.min(W - 112, 600);
      var ns = pFit(ctx, d.name, DISPLAY, '700', 62, 34, tw - pad * 2);
      var bh = 46 + ns + 44, byy = H - 56 - bh;
      ctx.fillStyle = '#ff8c3b'; pRR(ctx, bx, byy, tw, bh, 14); ctx.fill();
      pText(ctx, d.head, bx + pad, byy + 40, { size: 18, ls: 2, color: 'rgba(10,8,16,.75)', w: '600', upper: true });
      pText(ctx, d.name, bx + pad, byy + 40 + ns * 0.82, { size: ns, color: '#0a0810', w: '700', fam: DISPLAY });
      pText(ctx, d.disc, bx + pad, byy + bh - 18, { size: 17, ls: 1, color: 'rgba(10,8,16,.72)', upper: true });
    } },
    /* ── Story & Social ── */
    { k: 'polaroid', label: 'Polaroid', cat: 'social', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, 0, W, H);
      var gl = ctx.createRadialGradient(W / 2, H * 0.44, 40, W / 2, H * 0.44, W * 0.7);
      gl.addColorStop(0, 'rgba(255,140,59,.14)'); gl.addColorStop(1, 'rgba(12,10,18,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      pText(ctx, 'YKS · TALENT EDIT', W / 2, 92, { size: 24, ls: 5, color: 'rgba(244,237,226,.7)', w: '600', align: 'center' });
      var cw = Math.min(W * 0.74, 780), border = cw * 0.06, capH = cw * 0.2;
      var inW = cw - border * 2, inH = inW * 1.16, ch = border + inH + capH;
      ctx.save();
      ctx.translate(W / 2, H * 0.52); ctx.rotate(-3.2 * Math.PI / 180);
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#f4ede2'; pRR(ctx, -cw / 2, -ch / 2, cw, ch, 8); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.save(); pRR(ctx, -cw / 2 + border, -ch / 2 + border, inW, inH, 3); ctx.clip();
      pCover(ctx, img, -cw / 2 + border, -ch / 2 + border, inW, inH); ctx.restore();
      var capY = -ch / 2 + border + inH;
      var cs = pFit(ctx, d.name, DISPLAY, '700', Math.min(cw * 0.12, 76), 30, inW);
      pText(ctx, d.name, 0, capY + capH * 0.62, { size: cs, color: '#1a1420', w: '700', fam: DISPLAY, align: 'center' });
      ctx.restore();
      pText(ctx, d.head + ' · yksproductions.com', W / 2, H - 70, { size: 20, ls: 1, color: 'rgba(244,237,226,.66)', align: 'center', upper: true });
    } },
    { k: 'filmstrip', label: 'Filmstrip', cat: 'social', draw: function (ctx, W, H, img, d) {
      ctx.fillStyle = '#050409'; ctx.fillRect(0, 0, W, H);
      var strip = Math.round(H * 0.10);
      pCover(ctx, img, 0, strip, W, H - strip * 2);
      ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, strip); ctx.fillRect(0, H - strip, W, strip);
      ctx.fillStyle = 'rgba(244,237,226,.9)';
      var hw = W * 0.045, hh = strip * 0.34, gap = W * 0.028, stepw = hw + gap, n = Math.ceil(W / stepw) + 1;
      for (var i = 0; i < n; i++) {
        var hx = i * stepw + gap * 0.5;
        pRR(ctx, hx, (strip - hh) / 2, hw, hh, 5); ctx.fill();
        pRR(ctx, hx, H - strip + (strip - hh) / 2, hw, hh, 5); ctx.fill();
      }
      pGrad(ctx, 0, strip, 0, strip + H * 0.14, [[0, 'rgba(5,4,9,.72)'], [1, 'rgba(5,4,9,0)']]); ctx.fillRect(0, strip, W, H * 0.14);
      pText(ctx, 'YKS · TALENT EDIT', 56, strip + 52, { size: 22, ls: 5, color: 'rgba(255,140,59,.95)', w: '600' });
      var scrimT = H - strip - H * 0.26;
      pGrad(ctx, 0, scrimT, 0, H - strip, [[0, 'rgba(5,4,9,0)'], [1, 'rgba(5,4,9,.9)']]); ctx.fillRect(0, scrimT, W, H - strip - scrimT);
      pText(ctx, d.head, 60, H - strip - 94, { size: 23, ls: 3, color: '#ff8c3b', w: '600', upper: true });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 88, 46, W - 120);
      pText(ctx, d.name, 60, H - strip - 40, { size: ns, color: '#f4ede2', w: '700', fam: DISPLAY });
    } },
    { k: 'duotone', label: 'Duotone', cat: 'social', draw: function (ctx, W, H, img, d) {
      pGrad(ctx, 0, 0, 0, H, [[0, '#ff8c3b'], [0.55, '#8a3d5a'], [1, '#1a1030']]); ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'luminosity';
      pCover(ctx, img, 0, 0, W, H); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      pGrad(ctx, 0, 0, 0, H, [[0, 'rgba(40,20,60,.35)'], [1, 'rgba(20,12,32,.6)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
      pGrad(ctx, 0, H * 0.55, 0, H, [[0, 'rgba(12,8,20,0)'], [1, 'rgba(12,8,20,.9)']]); ctx.fillRect(0, H * 0.55, W, H * 0.45);
      pBrand(ctx, W, 64, 84, true);
      pText(ctx, d.head, 64, H - 178, { size: 24, ls: 3, color: '#ffd9b0', w: '600', upper: true });
      var ns = pFit(ctx, d.name, DISPLAY, '700', 108, 56, W - 120);
      pText(ctx, d.name, 60, H - 106, { size: ns, color: '#fff4e8', w: '700', fam: DISPLAY });
      pText(ctx, d.disc, 64, H - 58, { size: 22, ls: 2, color: 'rgba(255,240,225,.82)', upper: true });
    } }
  ];
  function posterData() {
    var nm = (form.name.value || 'Your Name').trim();
    var cat = (form.category.value || 'Model').trim();
    var disc = (DISC[cat] || 'Fashion · Editorial · Commercial');
    var m = POSTER_MSGS[POSTER.msg] || POSTER_MSGS.welcome;
    return { name: nm, disc: disc, head: m.head, sub: m.sub, foot: 'yksproductions.com · @yks_photoworks' };
  }
  function renderPosterTo(canvas, tplK, cb, thumbW) {
    var tpl = POSTER_TEMPLATES.filter(function (t) { return t.k === tplK; })[0] || POSTER_TEMPLATES[0];
    var fmt = POSTER_FORMATS[POSTER.fmt] || POSTER_FORMATS.feed;
    var FW = fmt[0], FH = fmt[1], sc = thumbW ? thumbW / FW : 1;   // thumbnails render into a tiny backing store (memory!) via a scale transform
    canvas.width = Math.round(FW * sc); canvas.height = Math.round(FH * sc);
    var ctx = canvas.getContext('2d');
    var pl = photos.length ? photos[POSTER.photo % photos.length] : null;
    var src = pl ? (pl.edited || pl.url) : SAMPLE_COVER;
    var draw = function () { pLoad(src).then(function (img) { if (sc !== 1) { ctx.save(); ctx.scale(sc, sc); } tpl.draw(ctx, FW, FH, img, posterData()); if (sc !== 1) ctx.restore(); if (cb) cb(); }).catch(function () { if (cb) cb(); }); };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('700 90px "Bodoni Moda"'), document.fonts.load('600 26px "Space Grotesk"')]).then(draw, draw);
    } else draw();
  }
  var posterPreview = $('#apPosterCanvas');
  function refreshPosters() {
    var sec = $('#apPosters'); if (!sec) return;
    sec.hidden = !photos.length;
    if (!photos.length || !posterPreview) return;
    // active states
    $$('#apPosterTpls .ap-pt').forEach(function (b) { b.classList.toggle('on', b.dataset.k === POSTER.tpl); });
    $$('#apPosterMsg .ap-seg').forEach(function (b) { b.classList.toggle('on', b.dataset.v === POSTER.msg); });
    $$('#apPosterFmt .ap-seg').forEach(function (b) { b.classList.toggle('on', b.dataset.v === POSTER.fmt); });
    renderPosterPhotoPicker();
    renderPosterTo(posterPreview, POSTER.tpl);
    // render template thumbnails at a tiny backing size (they display ~84px — full-res here was ~70MB across 12 canvases, which crashed mobile)
    $$('#apPosterTpls .ap-pt').forEach(function (b) {
      var mini = b.querySelector('canvas'); if (!mini) return;
      var savedFmt = POSTER.fmt; POSTER.fmt = 'feed';
      renderPosterTo(mini, b.dataset.k, null, 220); POSTER.fmt = savedFmt;
    });
  }
  function renderPosterPhotoPicker() {
    var wrap = $('#apPosterPhotos'); if (!wrap) return;
    wrap.innerHTML = '';
    photos.forEach(function (p, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-pph' + (i === POSTER.photo ? ' on' : '');
      var im = document.createElement('img'); im.src = p.edited || p.url; b.appendChild(im);
      b.addEventListener('click', function () { POSTER.photo = i; refreshPosters(); });
      wrap.appendChild(b);
    });
  }
  (function initPosters() {
    var tpls = $('#apPosterTpls');
    if (tpls) {
      tpls.innerHTML = '';
      POSTER_CATS.forEach(function (cat) {
        var group = document.createElement('div'); group.className = 'ap-pt-group';
        var h = document.createElement('p'); h.className = 'ap-pt-cat';
        h.innerHTML = cat.label + ' <span>' + cat.note + '</span>';
        var grid = document.createElement('div'); grid.className = 'ap-pt-grid';
        POSTER_TEMPLATES.filter(function (t) { return t.cat === cat.k; }).forEach(function (t) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'ap-pt'; b.dataset.k = t.k;
          var cv = document.createElement('canvas'); cv.className = 'ap-pt-cv';
          var lb = document.createElement('span'); lb.textContent = t.label;
          b.appendChild(cv); b.appendChild(lb);
          b.addEventListener('click', function () { POSTER.tpl = t.k; refreshPosters(); });
          grid.appendChild(b);
        });
        group.appendChild(h); group.appendChild(grid); tpls.appendChild(group);
      });
    }
    $$('#apPosterMsg .ap-seg').forEach(function (b) { b.addEventListener('click', function () { POSTER.msg = b.dataset.v; refreshPosters(); }); });
    $$('#apPosterFmt .ap-seg').forEach(function (b) { b.addEventListener('click', function () { POSTER.fmt = b.dataset.v; refreshPosters(); }); });
    var dl = $('#apPosterDl');
    if (dl) dl.addEventListener('click', function () {
      var c = document.createElement('canvas'); renderPosterTo(c, POSTER.tpl, function () {
        c.toBlob(function (blob) {
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = (form.name.value || 'YKS').trim().replace(/\s+/g, '-') + '-YKS-poster.jpg'; a.click();
        }, 'image/jpeg', 0.94);
      });
    });
    var sh = $('#apPosterShare');
    if (sh) sh.addEventListener('click', function () {
      var c = document.createElement('canvas'); renderPosterTo(c, POSTER.tpl, function () {
        c.toBlob(function (blob) {
          var file = new File([blob], 'YKS-poster.jpg', { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], text: (posterData().head) + ' — via YKS Productions · yksproductions.com' }).catch(function () {});
          } else { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'YKS-poster.jpg'; a.click(); }
        }, 'image/jpeg', 0.94);
      });
    });
    var nEl = document.querySelector('#talForm [name="name"]'); if (nEl) nEl.addEventListener('input', function () { if (!$('#apPosters').hidden) refreshPosters(); });
    var cEl = form.category; if (cEl) cEl.addEventListener('change', function () { if (!$('#apPosters').hidden) refreshPosters(); });
  })();

  // Book-a-shoot CTA — quietly personalise the WhatsApp opener with their name (feels 1:1, not a form)
  (function wireShootCta() {
    var cta = $('#apShootCta'); if (!cta) return;
    var nameEl = document.querySelector('#talForm [name="name"]');
    function build() {
      var nm = ((nameEl && nameEl.value) || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      var msg = nm
        ? "Hi Yedukrishna, I'm " + nm + " — I built my portfolio on your site and I want to book a real shoot with you. When can we do it?"
        : "Hi Yedukrishna, I just built my portfolio on your site and I want to book a real shoot with you. When can we do it?";
      cta.href = 'https://wa.me/919746679720?text=' + encodeURIComponent(msg);
    }
    if (nameEl) nameEl.addEventListener('input', build);
    build();
  })();

  /* ══ videos: self-tapes / reels / runway — submitted to YKS for casting, NOT printed in the PDF ══ */
  var videos = [];   // { id, kind:'file'|'link', file?, url?, name, big? }
  var vids = $('#apVids'), vidInput = $('#apVideos'), vidDrop = $('#apVidDrop'), vidUrl = $('#apVidUrl'), vidAdd = $('#apVidAdd');
  var VID_MAX = 95 * 1024 * 1024;   // ~95MB — above this we hand the clip to WhatsApp instead of choking a free upload
  function isVideoFile(f) { return /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|hevc)$/i.test(f.name); }
  function humanSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(b >= 10485760 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function linkName(u) { return u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').slice(0, 46); }
  function addVideoFiles(list) {
    Array.prototype.slice.call(list).filter(isVideoFile).forEach(function (f) {
      videos.push({ id: ++uid, kind: 'file', file: f, name: f.name, big: f.size > VID_MAX });
    });
    renderVids();
  }
  function addVideoLink() {
    var u = (vidUrl && vidUrl.value || '').trim();
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    if (!u || !/^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(u)) {
      if (vidUrl) { vidUrl.classList.add('ap-vu-bad'); vidUrl.focus(); setTimeout(function () { vidUrl.classList.remove('ap-vu-bad'); }, 1000); }
      return;
    }
    var dup = videos.some(function (v) { return v.kind === 'link' && v.url === u; });
    if (dup) { if (vidUrl) vidUrl.value = ''; return; }
    videos.push({ id: ++uid, kind: 'link', url: u, name: linkName(u) });
    if (vidUrl) vidUrl.value = '';
    renderVids(); persistDraft();
  }
  function removeVideo(id) {
    for (var i = 0; i < videos.length; i++) if (videos[i].id === id) { videos.splice(i, 1); break; }
    renderVids(); persistDraft();
  }
  function renderVids() {
    if (!vids) return;
    vids.innerHTML = '';
    videos.forEach(function (v) {
      var chip = document.createElement('div'); chip.className = 'ap-vid' + (v.kind === 'link' ? ' is-link' : '');
      var ic = document.createElement('span'); ic.className = 'ap-vid-ic'; ic.textContent = v.kind === 'link' ? '🔗' : '▶';
      var nm = document.createElement('span'); nm.className = 'ap-vid-nm'; nm.textContent = v.name;
      chip.appendChild(ic); chip.appendChild(nm);
      if (v.kind === 'file') {
        var sz = document.createElement('small'); sz.className = 'ap-vid-sz' + (v.big ? ' big' : '');
        sz.textContent = humanSize(v.file.size) + (v.big ? ' · I’ll grab this on WhatsApp' : '');
        chip.appendChild(sz);
      }
      var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'ap-vid-rm'; rm.setAttribute('aria-label', 'Remove'); rm.textContent = '×';
      rm.addEventListener('click', function () { removeVideo(v.id); });
      chip.appendChild(rm);
      vids.appendChild(chip);
    });
  }
  if (vidInput) vidInput.addEventListener('change', function () { addVideoFiles(vidInput.files); vidInput.value = ''; });
  if (vidDrop) {
    vidDrop.addEventListener('click', function () { vidInput && vidInput.click(); });
    vidDrop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vidInput && vidInput.click(); } });
    dropZone(vidDrop, function (files) { addVideoFiles(files); });
  }
  if (vidAdd) vidAdd.addEventListener('click', addVideoLink);
  if (vidUrl) vidUrl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addVideoLink(); } });

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
    if (group.id === 'apPrefs') return;   // work-preference chips have their own handler (below)
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

  // work-preference chips (multi-select) → hidden input, private to YKS
  (function wirePrefs() {
    var group = $('#apPrefs'); if (!group) return;
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      b.classList.toggle('on');
      if (form.preferences) form.preferences.value = $$('button.on', group).map(function (x) { return x.dataset.v; }).join(', ');
      persistDraft();
    });
  })();

  // age gate + guardian consent — under-18s must add a consenting parent/guardian before they can submit
  var ageHidden = form.age_group, guardianBox = $('#apGuardian'), consentCb = $('#apGuardConsent'), dobEl = form.dob;
  function applyAge(group, clearOnAdult) {
    var minor = group === 'minor';
    if (ageHidden) ageHidden.value = minor ? 'Under 18' : '18 or older';
    $$('#apAgeBtns button').forEach(function (b) { b.classList.toggle('on', b.dataset.age === group); });
    if (guardianBox) guardianBox.hidden = !minor;
    if (form.guardian_name) form.guardian_name.required = minor;
    if (form.guardian_contact) form.guardian_contact.required = minor;
    if (consentCb) consentCb.required = minor;
    if (!minor && clearOnAdult) {
      if (form.guardian_name) form.guardian_name.value = '';
      if (form.guardian_contact) form.guardian_contact.value = '';
      if (consentCb) consentCb.checked = false;
    }
  }
  var ageBtns = $('#apAgeBtns');
  if (ageBtns) ageBtns.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    applyAge(b.dataset.age, true); persistDraft();
  });
  if (dobEl) dobEl.addEventListener('change', function () {   // filling a DOB auto-flips the age gate
    if (!dobEl.value) return;
    var d = new Date(dobEl.value); if (isNaN(d.getTime())) return;
    var now = new Date(), age = now.getFullYear() - d.getFullYear(), m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    if (age >= 0 && age < 120) { applyAge(age < 18 ? 'minor' : 'adult', true); persistDraft(); }
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
  /* ── AI writer: the YKS engine writes portfolio-grade copy from what they've told us.
        Falls back to the built-in composer if the engine is unreachable, so the button always works. ── */
  function writeFacts(kind) {
    return {
      kind: kind,
      name: (form.name.value || '').trim(),
      role: pick.role || (form.category.value || 'model'),
      category: form.category.value || '',
      city: (form.city.value || '').trim(),
      loves: pick.loves || [],
      proud: (($('#apProud') && $('#apProud').value) || '').trim(),
      tone: pick.tone || 'warm',
      exp: pick.exp || '',
      length: pick.length || 'medium',
      seed: pick.seed || 0
    };
  }
  function aiWrite(kind) {
    var facts = writeFacts(kind);
    if (!facts.name) return Promise.resolve('');
    return new Promise(function (res) {
      var done = false, to = setTimeout(function () { if (!done) { done = true; res(''); } }, 20000);
      fetch(ENGINE_URL + '/ai/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(facts) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (done) return; done = true; clearTimeout(to); res((j && j.text) || ''); })
        .catch(function () { if (done) return; done = true; clearTimeout(to); res(''); });
    });
  }
  var goBtn = $('#apAiGo'), regenBtn = $('#apAiRegen');
  function runWriter(btn, label) {
    if (!aboutBox) return;
    var old = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '✨ Writing…'; }
    aiWrite('about').then(function (text) {
      aboutBox.value = text || compose();          // engine copy, or the built-in composer offline
      aboutBox.dispatchEvent(new Event('input'));
      aboutBox.focus();
      if (btn) { btn.disabled = false; btn.textContent = label || old; }
      if (regenBtn) regenBtn.hidden = false;
      if (goBtn) goBtn.textContent = 'Rewrite →';
    });
  }
  if (goBtn) goBtn.addEventListener('click', function () { pick.seed = 0; runWriter(goBtn, 'Rewrite →'); });
  if (regenBtn) regenBtn.addEventListener('click', function () { pick.seed = (pick.seed || 0) + 1; runWriter(regenBtn, '↻ Another version'); });

  /* ── signature line writer (portfolio cover) ── */
  (function wireTaglineAI() {
    var tagEl = form.tagline, btn = $('#apTagAi'); if (!tagEl || !btn) return;
    btn.addEventListener('click', function () {
      if (!(form.name.value || '').trim()) { tagEl.focus(); return; }
      var old = btn.textContent; btn.disabled = true; btn.textContent = '✨ Writing…';
      pick.seed = (pick.seed || 0) + 1;
      aiWrite('tagline').then(function (text) {
        if (text) { tagEl.value = text.slice(0, 46); tagEl.dispatchEvent(new Event('input')); }
        else { var c = (form.category.value || 'Model'), ct2 = (form.city.value || '').trim(); tagEl.value = (DISC[c] || 'Fashion · Editorial').split(' · ').slice(0, 2).join(' & ') + (ct2 ? ' · ' + ct2 : ''); tagEl.dispatchEvent(new Event('input')); }
        btn.disabled = false; btn.textContent = old;
      });
    });
  })();

  /* ══ autosave draft (text + video links; uploaded files can't persist across reloads) ══ */
  var textNames = ['name', 'contact', 'category', 'region', 'city', 'socials', 'about', 'tagline',
    'dob', 'gender', 'marital', 'education', 'languages', 'occupation', 'availability', 'travel', 'comfort', 'extra', 'preferences',
    'age_group', 'guardian_name', 'guardian_contact'];
  function persistDraft() {
    try {
      var d = {}; textNames.forEach(function (n) { if (form[n] != null) d[n] = form[n].value; });
      d.vlinks = videos.filter(function (v) { return v.kind === 'link'; }).map(function (v) { return v.url; });
      d.guardian_consent = consentCb ? consentCb.checked : false;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  }
  try {
    var saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    textNames.forEach(function (n) { if (form[n] != null && saved[n] != null) form[n].value = saved[n]; });
    applyAge((form.age_group && form.age_group.value === 'Under 18') ? 'minor' : 'adult', false);   // restore the age gate + guardian visibility
    if (consentCb && saved.guardian_consent) consentCb.checked = true;
    if (saved.preferences) {   // re-light the work-preference chips to match the restored hidden value
      var chosen = saved.preferences.split(',').map(function (s) { return s.trim(); });
      $$('#apPrefs button').forEach(function (b) { if (chosen.indexOf(b.dataset.v) > -1) b.classList.add('on'); });
    }
    if (Array.isArray(saved.vlinks) && saved.vlinks.length) {
      saved.vlinks.forEach(function (u) { videos.push({ id: ++uid, kind: 'link', url: u, name: linkName(u) }); });
      renderVids();
    }
  } catch (e) {}
  form.addEventListener('input', persistDraft);

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
    var wm = '';   // no tiled watermark — branding is the logo lockup + running header/footer
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
      var o = {};
      function num(s) { var m = String(s).match(/(\d{1,3}(?:\.\d)?)/); return m ? m[1] : ''; }
      function cleanWord(v) { return String(v).replace(/[^a-z\/ -]/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 2).join(' '); }
      function heightFrom(s) {
        var m;
        if (m = s.match(/\b(1\.[3-9]\d)\s*m\b/i)) return m[1] + ' m';                       // 1.68 m
        if (m = s.match(/\b(1[3-9]\d|2[0-1]\d)\s*cm\b/i)) return m[1] + ' cm';               // 168 cm
        if (m = s.match(/(\d)\s*(?:['’]|ft|feet|foot)\s*(\d{1,2})?/i)) return m[1] + "'" + (m[2] || '0') + '"';   // 5'7, 5 ft 7
        if (m = s.match(/\b(1[3-9]\d|2[0-1]\d)\b/)) return m[1] + ' cm';                     // bare 168
        return s.replace(/[^0-9'"’.a-z ]/gi, '').trim();
      }
      function shoeFrom(s) {
        var unit = (s.match(/\b(eu|uk|us)\b/i) || [])[1];
        var d = s.match(/(\d{1,2}(?:\.5)?)/);
        if (!d) return '';
        var n = d[1].replace(/^0+(\d)/, '$1');   // "06" → "6", keep "38"
        return unit ? (n + ' ' + unit.toUpperCase()) : n;
      }
      // Line-based: read the value that sits AFTER each field keyword — tolerant of "(inches)", "Size", "Color", -/:/– and units.
      function txtVal(v) { return cleanWord(String(v).replace(/^[\s:–-]*(colou?r|tone|shade)?[\s:–-]*/i, '')); }
      String(text).split(/[\n\r]+/).forEach(function (line) {
        if (!line.trim()) return;
        var low = line.toLowerCase(), hasSep = /[:\-–]/.test(line), v, b, w, h, s;
        function after(kwRe) { var mm = low.match(kwRe); return mm ? line.slice(mm.index + mm[0].length) : null; }
        if (!o.height && (v = after(/\bheight\b/)) != null) o.height = heightFrom(v);
        if (!o.bust && (v = after(/\b(chest|bust|breast)\b/)) != null) { b = v.match(/(\d{2})\s*([a-e])?/i); if (b) o.bust = b[1] + (b[2] ? b[2].toUpperCase() : ''); }
        if (!o.waist && (v = after(/\bwaist\b/)) != null) { w = num(v); if (w) o.waist = w; }
        if (!o.hips && (v = after(/\bhips?\b/)) != null) { h = num(v); if (h) o.hips = h; }
        if (!o.shoe && (v = after(/\bshoe\b/)) != null) { s = shoeFrom(v); if (s) o.shoe = s; }
        if (!o.hair && hasSep && !/length/.test(low) && (v = after(/\bhair\b/)) != null) o.hair = cap(txtVal(v));   // "Hair Color", not "Hair Length"
        if (!o.eyes && hasSep && (v = after(/\beyes?\b/)) != null) o.eyes = cap(txtVal(v));
        if (!o.skin && hasSep && (v = after(/\b(skin|complexion)\b/)) != null) o.skin = cap(txtVal(v));
      });
      // Whole-text fallbacks — only fill what the line pass missed (handles no-separator pastes like "34-26-36" or "brown eyes")
      var t = ' ' + String(text).replace(/\s+/g, ' ').trim() + ' ', low = t.toLowerCase(), m;
      if (!o.height) { if (m = t.match(/(\d)\s*['’]\s*(\d{1,2})/)) o.height = m[1] + "'" + m[2] + '"'; else if (m = low.match(/\b(1[3-9]\d|2[0-1]\d)\s*cm\b/)) o.height = m[1] + ' cm'; }
      var tr = t.match(/\b([2-4]\d)\s*[-\/x]\s*([1-3]\d)\s*[-\/x]\s*([2-4]\d)\b/i);
      if (tr) { o.bust = o.bust || tr[1]; o.waist = o.waist || tr[2]; o.hips = o.hips || tr[3]; }
      if (!o.hair) { var HAIR = ['jet black', 'black', 'dark brown', 'light brown', 'brown', 'blonde', 'blond', 'auburn', 'red', 'ginger', 'grey', 'gray']; for (var i = 0; i < HAIR.length; i++) if (new RegExp('\\b' + HAIR[i] + '\\b\\s*hair').test(low)) { o.hair = cap(HAIR[i]); break; } }
      if (!o.eyes) { var EYES = ['dark brown', 'light brown', 'brown', 'black', 'blue', 'green', 'hazel', 'grey', 'gray', 'amber']; for (var j = 0; j < EYES.length; j++) if (new RegExp('\\b' + EYES[j] + '\\b\\s*eyes?').test(low)) { o.eyes = cap(EYES[j]); break; } }
      if (!o.skin) { if (m = low.match(/\b(fair|light|medium|olive|tan|wheatish|dusky|deep|dark|brown|ebony)\s*(?:skin|complexion|tone)/)) o.skin = cap(m[1]); }
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

  // ── the free portfolio is GATED: the device download unlocks only once they've sent it to YKS ──
  function unlockDownload() {
    if (dlBtn) { dlBtn.disabled = false; dlBtn.textContent = '↓ Download my portfolio (PDF)'; }
    var hint = $('#apDlHint'); if (hint) { hint.textContent = '✓ Unlocked — your copy is ready to keep.'; hint.classList.add('on'); }
  }

  // "Drop it in my WhatsApp" — build the PDF, upload it, open a WhatsApp chat straight to YKS with the link.
  // This IS a submission: the talent lands in YKS's inbox with their book, opening a direct conversation.
  var waBtn = $('#apDlWa');
  if (waBtn) waBtn.addEventListener('click', function () {
    if (!photos.length) { alert('Add at least one photo first — your portfolio is built from your photos.'); return; }
    var name = (form.name.value || '').trim();
    if (!name) { alert('Add your name first (in “The basics” above) — it goes on your cover.'); if (form.name) form.name.focus(); return; }
    var orig = waBtn.textContent; waBtn.disabled = true; waBtn.textContent = 'Preparing your PDF…';
    Promise.all([ensureJsPDF(), ensureFonts(), ensureQR()])
      .then(function (rr) {
        var JsPDF = rr[0];
        return Promise.all(photos.slice(0, 8).map(function (p) {
          var pr = p.edited ? gradeDataURL(p.edited).then(function (d) { return { data: d, w: 900, h: 1125 }; }) : prepImg(p.file, 0.8, 1000);
          return pr.then(function (im) { im.cat = p.cat || ''; im.fit = !!p.fit; return im; });
        })).then(function (imgs) {
          var th = THEMES[CFG.theme];
          return new Promise(function (resolve, reject) {
            try {
              buildPortfolio(JsPDF, imgs, name, { bg: hexRgb(th.bg), text: hexRgb(th.text), sub: hexRgb(th.sub), accent: hexRgb(CFG.accent), font: FONTS[CFG.font].pdf, template: CFG.layout,
                onDoc: function (doc) { resolve(doc.output('blob')); } });
            } catch (er) { reject(er); }
          });
        });
      })
      .then(function (blob) {
        waBtn.textContent = 'Sending to YKS…';
        var file = new File([blob], name.replace(/\s+/g, '-') + '-YKS-portfolio.pdf', { type: 'application/pdf' });
        return upload(file, null, name + ' — WhatsApp');
      })
      .then(function (url) {
        unlockDownload();
        waBtn.textContent = 'Opening WhatsApp ✓';
        var msg = 'Hi Yedukrishna — here’s my YKS portfolio (' + name + '): ' + url;
        window.open('https://wa.me/919746679720?text=' + encodeURIComponent(msg), '_blank');
        setTimeout(function () { waBtn.textContent = orig; waBtn.disabled = false; }, 3000);
      })
      .catch(function () { waBtn.textContent = orig; waBtn.disabled = false; alert('Couldn’t prepare it just now — please try again, or submit the form above.'); });
  });

  // deliver the finished PDF: to the device (default) or hand the doc back via cfg.onDoc (WhatsApp/upload path)
  function deliver(doc, filename, cfg) {
    if (cfg && typeof cfg.onDoc === 'function') cfg.onDoc(doc, filename);
    else doc.save(filename);
  }
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
    if (cfg.template !== 'compcard' && cfg.template !== 'editorial' && cfg.template !== 'lookbook' && cfg.template !== 'minimal') {
      digitals = imgs.filter(function (im) { return im.cat === 'Digitals'; });
      if (digitals.length && digitals.length < imgs.length) imgs = imgs.filter(function (im) { return im.cat !== 'Digitals'; });
      else digitals = [];   // if every shot is a digital, keep them in the book rather than emptying it
    }
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
    function hbg(c) { doc.setFillColor.apply(doc, c); doc.rect(0, 0, W, H, 'F'); }
    function htk(str, x, y, sz, c, o) { o = o || {}; doc.setFont(HF, o.bold ? 'bold' : 'normal'); doc.setFontSize(sz); ct(c); doc.text(o.upper === false ? String(str) : String(str).toUpperCase(), x, y, { align: o.align || 'left', charSpace: o.ls == null ? 1.3 : o.ls }); }
    function hhair(x1, y, x2, c, lw) { doc.setDrawColor.apply(doc, c); doc.setLineWidth(lw || 0.8); doc.line(x1, y, x2, y); }
    function hnp(c) { doc.addPage(); hsPg++; hbg(c); }
    function hlum(c) { return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
    function hnbleed(im, x, y, bw, bh) { if (im.fit) { doc.setFillColor.apply(doc, NIGHT); doc.rect(x, y, bw, bh, 'F'); var s = Math.min(bw / im.w, bh / im.h), w = im.w * s, h = im.h * s; doc.addImage(im.data, 'JPEG', x + (bw - w) / 2, y + (bh - h) / 2, w, h); } else coverFill(im, x, y, bw, bh); }
    function hlogoBox(x, y, w, c) { var h = w * 0.60, cx = x + w / 2; doc.setDrawColor.apply(doc, c); doc.setLineWidth(0.9); doc.rect(x, y, w, h); doc.setFont(LG, 'normal'); ct(c); doc.setFontSize(w * 0.285); doc.text('YKS', cx, y + h * 0.50, { align: 'center', charSpace: 1 }); var py = y + h * 0.80, word = 'PRODUCTIONS', ws = 1.3; doc.setFont(HF, 'normal'); doc.setFontSize(w * 0.064); var tw = doc.getTextWidth(word) + (word.length - 1) * ws; doc.text(word, cx, py, { align: 'center', charSpace: ws }); doc.setLineWidth(0.5); var gap = w * 0.05, dash = w * 0.085; doc.line(cx - tw / 2 - gap - dash, py - 2.5, cx - tw / 2 - gap, py - 2.5); doc.line(cx + tw / 2 + gap, py - 2.5, cx + tw / 2 + gap + dash, py - 2.5); }
    function hRunHead(left, onDark) { var c = onDark ? LIGHT : INK; htk(left, M, 60, 8, c, { bold: true, ls: 1.5 }); htk(NM + '  /  ' + ('0' + hsPg).slice(-2), W - M, 60, 8, c, { bold: true, align: 'right', ls: 1.5 }); hhair(M, 72, W - M, onDark ? GOLD : INK, 1.1); }
    function hPaperFoot() { hhair(M, H - 56, W - M, INK, 1.1); htk('+91 97466 79720', M, H - 40, 7.5, INKSUB, { ls: 1.1 }); htk('YKSPRODUCTIONS893@GMAIL.COM', W - M, H - 40, 7.5, INKSUB, { align: 'right', ls: 1.1 }); }
    function hPlateFoot(cap) { hhair(M, H - 44, W - M, GOLD, 0.8); htk(cap, M, H - 28, 8, GOLD, { bold: true, ls: 1.5 }); htk(NM + '  /  ' + ('0' + hsPg).slice(-2), W - M, H - 28, 8, GOLD, { align: 'right', ls: 1.5 }); }
    function hFit(str, f, wt, start, min, maxW) { var s = start; doc.setFont(f, wt); while (s > min) { doc.setFontSize(s); if (doc.getTextWidth(String(str).toUpperCase()) <= maxW) break; s -= 1; } return s; }
    function hBio() { if (about) return about; var role = (cat === 'Actor' ? 'actor' : (/Influencer|Creator/i.test(cat) ? 'model and digital creator' : 'professional model')); var where = city ? ' based in ' + city : ''; return name + ' is a ' + role + where + ', working across ' + disc.toLowerCase() + '. Equally at home on a controlled studio call and looser, content-led shoots — a range that suits a lookbook, a runway line-up or a campaign built to live on a phone. Quick to take direction, precise on the marks, and comfortable holding a look for as long as the frame needs.'; }
    function hsCover(hero) { hbg(NIGHT); var bandH = 166; hnbleed(hero, 0, 0, W, H - bandH); shade(0, 150, 0.2); hhair(M, H - bandH, W - M, GOLD, 0.9); hlogoBox(M, 44, 118, LIGHT); var by = H - bandH; htk(disc, M, by + 40, 8.5, GOLD, { bold: true, ls: 2 }); var parts = NM.split(' '), l1 = parts[0], l2 = parts.slice(1).join(' '); if (!l2) l1 = NM; var ns = hFit(l2 || l1, HF, 'bold', 40, 22, W * 0.55); doc.setFont(HF, 'bold'); doc.setFontSize(ns); ct(LIGHT); if (l2) { doc.text(l1, M, by + 82); doc.text(l2, M, by + 82 + ns * 0.9); } else doc.text(l1, M, by + 104); htk('TALENT PORTFOLIO', W - M, by + 62, 8.5, MUTE, { align: 'right', ls: 2 }); htk('EDITION 2026 / 01', W - M, by + 80, 8.5, MUTE, { align: 'right', ls: 2 }); htk('EXCLUSIVE · YKS', W - M, by + 98, 8.5, GOLD, { align: 'right', ls: 2 }); return l1; }
    function hsProfile(figImg) { hnp(PAPER); hRunHead('YKS PRODUCTIONS — TALENT PORTFOLIO'); htk('PROFILE', M, 116, 9, INKSUB, { bold: true, ls: 2 }); doc.setFont(HF, 'bold'); doc.setFontSize(30); ct(INK); doc.text(NM, M, 150); var LCW = 250; doc.setFont(HF, 'normal'); doc.setFontSize(10.5); ct(INK); var bl = doc.splitTextToSize(hBio(), LCW).slice(0, 11); doc.text(bl, M, 190, { lineHeightFactor: 1.5 }); var ly = 190 + bl.length * 15.6 + 30; htk('CASTABLE FOR', M, ly, 9, INKSUB, { bold: true, ls: 2 }); ly += 24; var cx2 = M, cy2 = ly; doc.setFont(HF, 'normal'); doc.setFontSize(9.5); disc.split(' · ').forEach(function (t) { var tw = doc.getTextWidth(t) + 22; if (cx2 + tw > M + LCW) { cx2 = M; cy2 += 32; } doc.setDrawColor.apply(doc, HFA); doc.setLineWidth(0.9); doc.roundedRect(cx2, cy2 - 14, tw, 24, 3, 3, 'S'); ct(INK); doc.text(t, cx2 + 11, cy2 + 2); cx2 += tw + 8; }); var RW = 200, rx = W - M - RW, fy = 130, fig = figImg || imgs[1] || imgs[0]; if (fig) { place(fig, rx, fy, RW); var fby = fy + RW / 0.8; htk('FIG. 01 — ' + ((fig.cat || 'FULL LENGTH')), rx, fby + 22, 8, GOLD, { bold: true, ls: 1.5 }); hhair(rx, fby + 32, W - M, GOLD, 0.8); } var my = fy + RW / 0.8 + 70; htk('MEASUREMENTS', rx, my, 9, INKSUB, { bold: true, ls: 2 }); my += 6; STATS.slice(0, 9).forEach(function (r) { my += 22; hhair(rx, my - 15, W - M, INK, 0.5); htk(r[0], rx, my, 8, INKSUB, { ls: 1.2 }); doc.setFont(HF, 'bold'); doc.setFontSize(9.5); ct(INK); doc.text(r[1], W - M, my, { align: 'right' }); }); htk('REPRESENTED BY', M, H - 150, 9, INKSUB, { bold: true, ls: 2 }); hlogoBox(M, H - 138, 96, INK); htk('+91 97466 79720', M + 112, H - 116, 9, INK, { bold: true, ls: 0.5, upper: false }); htk('yksproductions893@gmail.com', M + 112, H - 100, 8.5, INKSUB, { ls: 0.5, upper: false }); hPaperFoot(); }
    function hsPlate(im, cap) { hnp(NIGHT); hnbleed(im, 0, 0, W, H); shade(H - 90, 90, 0.34); hPlateFoot(cap); }
    function hsSpread(a, b, section, capA, capB, statement) { hnp(PAPER); hRunHead(section); var g = 22, cw = (CW - g) / 2, yy = 100, ph = cw / 0.8; [a, b].forEach(function (im, k) { if (im) place(im, M + k * (cw + g), yy, cw); }); [a, b].forEach(function (im, k) { if (im) htk(k ? capB : capA, M + k * (cw + g), yy + ph + 22, 8, INKSUB, { ls: 1.3 }); }); if (statement) { hhair(M, H - 150, W - M, INK, 1.1); doc.setFont(HF, 'bold'); doc.setFontSize(25); ct(INK); var ds = disc.split(' · '), half = Math.ceil(ds.length / 2); doc.text(ds.slice(0, half).join(' · ').toUpperCase() + ' ·', M, H - 118); doc.text(ds.slice(half).join(' · ').toUpperCase(), M, H - 92); doc.setFont(HF, 'normal'); doc.setFontSize(8.5); ct(INKSUB); doc.text(doc.splitTextToSize('Straight colour or a black-and-white conversion — no retouching. Full-resolution files, additional looks and video on request.', 190), W - M, H - 128, { align: 'right', lineHeightFactor: 1.4 }); htk('SELECTED WORK', W - M, H - 92, 8, INKSUB, { align: 'right', ls: 1.3 }); } hPaperFoot(); }
    function hsCenter(im, cap) { hnp(PAPER); hRunHead('PLATE — ' + ((im.cat || 'SELECTED'))); var w = 336, x = (W - w) / 2, y = 118; place(im, x, y, w); htk(cap, W / 2, y + w / 0.8 + 26, 8, GOLD, { bold: true, ls: 1.5, align: 'center' }); hhair(W / 2 - 40, y + w / 0.8 + 36, W / 2 + 40, GOLD, 0.8); hPaperFoot(); }
    function hsClosing(firstName) { hnp(HFA); var onA = hlum(HFA) > 0.62 ? INK : [255, 255, 255], onAsub = hlum(HFA) > 0.62 ? [80, 70, 60] : [255, 255, 255]; htk('BOOKING', M, 60, 8, onA, { bold: true, ls: 1.6 }); htk(NM + '  /  ' + ('0' + hsPg).slice(-2), W - M, 60, 8, onA, { bold: true, align: 'right', ls: 1.6 }); hhair(M, 72, W - M, onA, 1.1); doc.setFont(HF, 'bold'); doc.setFontSize(58); ct(onA); doc.text('BOOK', M, 400); doc.text(firstName, M, 460); htk('PHONE', M, 512, 8.5, onAsub, { ls: 1.6 }); doc.setFont(HF, 'bold'); doc.setFontSize(13); ct(onA); doc.text('+91 97466 79720', M + 110, 512); htk('EMAIL', M, 540, 8.5, onAsub, { ls: 1.6 }); doc.setFont(HF, 'bold'); doc.setFontSize(13); ct(onA); doc.text('yksproductions893@gmail.com', M + 110, 540, { charSpace: 0 }); hhair(M, H - 96, W - M, onA, 1.1); doc.setFont(HF, 'normal'); doc.setFontSize(8.5); ct(onA); doc.text(doc.splitTextToSize('Represented exclusively by YKS Productions. Rates, availability and full-resolution files on request.', 320), M, H - 76, { lineHeightFactor: 1.4 }); hlogoBox(W - M - 100, H - 108, 100, onA); }

    /* ── TEMPLATE: Lookbook (fashion, photo-forward — full-bleed plates) ── */
    function tplLookbook() { var fn = hsCover(imgs[0]); var n = 1; imgs.slice(1, 8).forEach(function (im) { hsPlate(im, 'LOOK ' + ('0' + (n++)).slice(-2) + ' — ' + ((im.cat || 'EDITORIAL'))); }); hsProfile(); hsClosing(fn); }
    /* ── TEMPLATE: Minimal (airy — one centred plate per page) ── */
    function tplMinimal() { var fn = hsCover(imgs[0]); hsProfile(); imgs.slice(2, 7).forEach(function (im, k) { hsCenter(im, 'PLATE ' + ('0' + (k + 1)).slice(-2) + ' — ' + ((im.cat || 'SELECTED'))); }); hsClosing(fn); }
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
    /* ── TEMPLATE: Editorial (YKS house style — the flagship editorial book) ── */
    function tplEditorial() { var fn = hsCover(imgs[0]); hsProfile(); if (imgs[2]) hsPlate(imgs[2], 'PLATE 01 — ' + ((imgs[2].cat || 'EDITORIAL'))); if (imgs[3] || imgs[4]) hsSpread(imgs[3], imgs[4], 'EDITORIAL — MOVEMENT', 'PLATE 02 — ' + ((imgs[3] && imgs[3].cat) || 'THREE-QUARTER'), 'PLATE 03 — ' + ((imgs[4] && imgs[4].cat) || 'PROFILE'), true); if (imgs[5]) hsPlate(imgs[5], 'PLATE 04 — ' + ((imgs[5].cat || 'PORTRAIT'))); if (imgs[6] || imgs[7]) hsSpread(imgs[6], imgs[7], 'EDITORIAL — SELECTED', 'PLATE 05 — ' + ((imgs[6] && imgs[6].cat) || 'LOOK'), 'PLATE 06 — ' + ((imgs[7] && imgs[7].cat) || 'LOOK'), false); hsClosing(fn); }
    if (cfg.template === 'lookbook') { tplLookbook(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'duo') { tplDuo(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'compcard') { tplCompCard(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'minimal') { tplMinimal(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'grid') { tplGrid(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'feature') { tplFeature(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'swiss') { tplSwiss(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'luxe') { tplLuxe(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'classic') { tplClassic(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'ethereal') { tplEthereal(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'wabi') { tplWabi(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }
    if (cfg.template === 'bento') { tplBento(); profilePage(); digitalsPage(); bookPage(); deliver(doc, SAVE, cfg); return; }

    // ── Editorial (default / flagship) — the YKS house-style book ──
    tplEditorial();
    deliver(doc, SAVE, cfg);
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
  // submit button lives OUTSIDE the form (associated via form="talForm"), so search the whole document, not just the form
  var progress = $('#apProgress');
  var submitBtn = form.querySelector('button[type="submit"]') ||
    document.querySelector('button[type="submit"][form="' + form.id + '"]') || $('.ap-submit');
  function say(msg) { if (progress) { progress.hidden = !msg; progress.textContent = msg || ''; } }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var orig = submitBtn.textContent; submitBtn.disabled = true;
    var configured = !!(CLOUDINARY_CLOUD && CLOUDINARY_PRESET);
    var folderName = (form.name.value || 'Applicant').trim() + ' — ' + new Date().toLocaleDateString('en-GB');

    var vidFiles = videos.filter(function (v) { return v.kind === 'file' && !v.big; });   // try to upload these
    var waVideos = videos.filter(function (v) { return v.kind === 'file' && v.big; });     // too big → WhatsApp
    var vidLinks = videos.filter(function (v) { return v.kind === 'link'; }).map(function (v) { return v.url; });
    var out = { photos: [], pdf: '', videos: [] };

    var chain = Promise.resolve(out);
    if (configured && (photos.length || pdf || vidFiles.length)) {
      submitBtn.textContent = 'Uploading…';
      var total = photos.length + (pdf ? 1 : 0) + vidFiles.length, done = 0;
      var step = function () { done++; say('Uploading your files… ' + done + ' / ' + total); };
      say('Uploading your files… 0 / ' + total);
      chain = Promise.all(
        photos.map(function (p) {
          var fig = thumbs.querySelector('.ap-thumb[data-id="' + p.id + '"] .ap-thumb-bar');
          return upload(p.file, function (r) { if (fig) fig.style.transform = 'scaleX(' + r + ')'; }, folderName).then(function (u) { step(); return u; });
        })
      ).then(function (urls) {
        out.photos = urls;
        if (!pdf) return;
        return upload(pdf, null, folderName).then(function (pu) { step(); out.pdf = pu; });
      }).then(function () {
        // videos: a failed/rejected clip just routes to WhatsApp — it must never abort the whole application
        return Promise.all(vidFiles.map(function (v) {
          return upload(v.file, null, folderName)
            .then(function (u) { step(); if (u) out.videos.push(u); else waVideos.push(v); })
            .catch(function () { step(); waVideos.push(v); });
        }));
      }).then(function () { return out; });
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
        signature_line: (form.tagline && form.tagline.value) || '(none)',
        about: form.about.value,
        // ── private personal data (only YKS ever sees this — never rendered publicly) ──
        date_of_birth: (form.dob && form.dob.value) || '(none)',
        gender: (form.gender && form.gender.value) || '(none)',
        marital_status: (form.marital && form.marital.value) || '(none)',
        education: (form.education && form.education.value) || '(none)',
        languages: (form.languages && form.languages.value) || '(none)',
        current_work: (form.occupation && form.occupation.value) || '(none)',
        availability: (form.availability && form.availability.value) || '(none)',
        open_to_travel: (form.travel && form.travel.value) || '(none)',
        work_preferences: (form.preferences && form.preferences.value) || '(none)',
        comfort_boundaries: (form.comfort && form.comfort.value) || '(none)',
        anything_else: (form.extra && form.extra.value) || '(none)',
        age_group: (form.age_group && form.age_group.value) || '(none)',
        guardian_name: (form.guardian_name && form.guardian_name.value) || '(n/a)',
        guardian_contact: (form.guardian_contact && form.guardian_contact.value) || '(n/a)',
        guardian_consent: (consentCb && consentCb.checked) ? 'YES — guardian consents'
          : ((form.age_group && form.age_group.value === 'Under 18') ? 'NO — MISSING' : '(n/a — adult)'),
        files_folder: (configured && (photos.length || pdf || vidFiles.length)) ? folderName : '(none)',
        photos: configured
          ? (up.photos.filter(Boolean).join('\n') || (photos.length ? photos.length + ' photo(s) uploaded' : '(none)'))
          : (photos.length ? '(' + photos.length + ' photos — applicant will send on WhatsApp)' : '(none)'),
        portfolio_pdf: configured
          ? (up.pdf || (pdf ? 'PDF uploaded' : '(none)'))
          : (pdf ? '(PDF — applicant will send on WhatsApp)' : '(none)'),
        videos: (up.videos && up.videos.filter(Boolean).join('\n')) ||
          (waVideos.length ? '(' + waVideos.length + ' clip(s) — applicant will send on WhatsApp)' : '(none)'),
        video_links: vidLinks.length ? vidLinks.join('\n') : '(none)'
      };
      // also feed the structured submission to the YKS Talents Engine (roster pipeline) — non-blocking; never breaks the apply flow
      if (ENGINE_URL && up.photos && up.photos.filter(Boolean).length) {
        try {
          var g = function (n) { return (form[n] && form[n].value) || ''; };
          var ephotos = photos.map(function (p, i) { return { url: (up.photos && up.photos[i]) || '', cat: p.cat || '' }; }).filter(function (x) { return x.url; });
          var submission = {
            name: g('name'), contact: g('contact'), category: g('category'), based_in: g('region'), city: g('city'),
            socials: g('socials'), about: g('about'), tagline: g('tagline'), work_preferences: g('preferences'),
            stat_height: g('stat_height'), stat_bust: g('stat_bust'), stat_waist: g('stat_waist'), stat_hips: g('stat_hips'),
            stat_shoe: g('stat_shoe'), stat_hair: g('stat_hair'), stat_eyes: g('stat_eyes'), stat_skin: g('stat_skin'),
            dob: g('dob'), gender: g('gender'), marital: g('marital'), education: g('education'), languages: g('languages'),
            occupation: g('occupation'), availability: g('availability'), travel: g('travel'), comfort: g('comfort'), extra: g('extra'),
            age_group: g('age_group'), guardian_name: g('guardian_name'), guardian_contact: g('guardian_contact'),
            photos: ephotos, cover_url: (ephotos[0] && ephotos[0].url) || '', videos: (up.videos || []), video_links: vidLinks
          };
          fetch(ENGINE_URL.replace(/\/+$/, '') + '/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission) }).catch(function () {});
        } catch (e) {}
      }
      return fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.success) throw new Error('web3forms');
        try { localStorage.removeItem(DRAFT_KEY); } catch (er) {}
        say('');
        form.style.display = 'none';
        var ok = $('#talOk'); if (ok) ok.style.display = 'block';
        unlockDownload();   // they submitted → their free portfolio download is now unlocked
        if (window.gtag) gtag('event', 'talent_apply');
        // anything that couldn't upload (not configured yet, or a clip too big/rejected) → hand to WhatsApp so nothing is lost
        if ((!configured && (photos.length || pdf)) || waVideos.length) {
          var waWrap = $('#apOkWa'); if (waWrap) waWrap.hidden = false;
        }
      });
    }).catch(function () {
      submitBtn.disabled = false; submitBtn.textContent = orig;
      say('Something went wrong — please try again, or use “Apply on WhatsApp” below.');
    });
  });
})();
