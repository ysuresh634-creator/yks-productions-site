/* YKS Talents — registration flow.
   Human-first: many photos of any size, an AI-assisted "About" writer,
   autosave, and a WhatsApp fallback. Files upload straight to storage
   (no email size cap); the notification e-mail carries the links.

   ── ONE-TIME SETUP (YKS) ───────────────────────────────────────────
   To lift the size cap, create a free Cloudinary account, make an
   *unsigned* upload preset, and drop the two values in here:            */
   var CLOUDINARY_CLOUD  = '';   // e.g. 'yksproductions'  (Cloudinary "cloud name")
   var CLOUDINARY_PRESET = '';   // e.g. 'yks_talents'     (unsigned upload preset)
/* Until those are filled, details still submit and photos fall back to
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

  /* ══ photos: pick / drop / preview / remove ══ */
  var photoInput = $('#apPhotos'), photoDrop = $('#apDrop'), thumbs = $('#apThumbs');
  function addPhotos(list) {
    Array.prototype.forEach.call(list, function (f) {
      if (!/^image\//.test(f.type)) return;
      var item = { file: f, id: ++uid, url: URL.createObjectURL(f) };
      photos.push(item);
      var fig = document.createElement('div'); fig.className = 'ap-thumb'; fig.dataset.id = item.id;
      var img = document.createElement('img'); img.src = item.url; img.alt = '';
      var rm = document.createElement('button'); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove photo'); rm.textContent = '×';
      rm.addEventListener('click', function () {
        photos = photos.filter(function (p) { return p.id !== item.id; });
        URL.revokeObjectURL(item.url); fig.remove(); reflectPhotoCount();
      });
      var bar = document.createElement('span'); bar.className = 'ap-thumb-bar';
      fig.appendChild(img); fig.appendChild(rm); fig.appendChild(bar); thumbs.appendChild(fig);
    });
    reflectPhotoCount();
  }
  function reflectPhotoCount() {
    var b = $('#apDropLabel');
    if (b) b.textContent = photos.length ? photos.length + (photos.length === 1 ? ' photo added — add more' : ' photos added — add more') : 'Add photos';
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
  var pick = { role: '', exp: '', tone: 'warm', loves: [] };
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
  function compose() {
    var role = (pick.role || (form.category && form.category.value) || 'model');
    role = role.toLowerCase().replace('influencer / creator', 'content creator');
    var city = (form.city && form.city.value || '').trim();
    var loves = pick.loves.slice(0, 3);
    var tone = pick.tone || 'warm';
    var proud = ($('#apProud') && $('#apProud').value || '').trim();

    var desc = loves.length ? list(loves).toLowerCase() + ' ' : '';
    var s1 = cap(desc + role) + (city ? ' based in ' + city : '') + '.';

    var expMap = {
      start: "I'm just starting out and bring real energy to every set",
      early: "I've spent a couple of years in front of the camera",
      several: "I've got several years of shoots behind me",
      pro: "I'm very comfortable on any kind of set"
    };
    var style = {
      warm: ". I take direction easily and love the collaborative side of a shoot.",
      confident: ". I take direction well, work fast, and can hold a look for as long as the frame needs.",
      playful: ". I take direction, bring good energy, and I'm always up for trying something new.",
      minimal: " — reliable, quick to take direction, easy to work with."
    };
    var s2 = (expMap[pick.exp] || expMap.several) + (style[tone] || style.warm);

    var s3 = '';
    if (proud) {
      var lead = { warm: 'A recent highlight — ', confident: 'Recent work includes ', playful: 'Proudest bit so far — ', minimal: 'Selected: ' };
      s3 = ' ' + (lead[tone] || lead.warm) + proud + (/[.!?]$/.test(proud) ? '' : '.');
    }
    var closer = {
      warm: " I'd love to be part of your next shoot.",
      confident: " Ready for your next campaign.",
      playful: " Let's make something good together.",
      minimal: " Available for bookings."
    };
    return (s1 + ' ' + s2 + s3 + (closer[tone] || closer.warm)).replace(/\s+/g, ' ').trim();
  }
  var goBtn = $('#apAiGo');
  if (goBtn) goBtn.addEventListener('click', function () {
    aboutBox.value = compose();
    aboutBox.dispatchEvent(new Event('input'));
    aboutBox.focus();
    goBtn.textContent = 'Rewrite ↻';
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

  /* ══ upload one file to Cloudinary (unsigned) with progress ══ */
  function upload(file, onProgress) {
    return new Promise(function (resolve, reject) {
      var url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/auto/upload';
      var fd = new FormData(); fd.append('file', file); fd.append('upload_preset', CLOUDINARY_PRESET);
      var xhr = new XMLHttpRequest(); xhr.open('POST', url);
      xhr.upload.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText).secure_url); } catch (er) { reject(er); } }
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
    var configured = CLOUDINARY_CLOUD && CLOUDINARY_PRESET;

    var chain = Promise.resolve({ photos: [], pdf: '' });
    if (configured && (photos.length || pdf)) {
      submitBtn.textContent = 'Uploading…';
      var total = photos.length + (pdf ? 1 : 0), done = 0;
      var step = function () { done++; say('Uploading your files… ' + done + ' / ' + total); };
      say('Uploading your files… 0 / ' + total);
      chain = Promise.all(
        photos.map(function (p, i) {
          var fig = thumbs.querySelector('.ap-thumb[data-id="' + p.id + '"] .ap-thumb-bar');
          return upload(p.file, function (r) { if (fig) fig.style.transform = 'scaleX(' + r + ')'; }).then(function (u) { step(); return u; });
        })
      ).then(function (urls) {
        if (!pdf) return { photos: urls, pdf: '' };
        return upload(pdf).then(function (pu) { step(); return { photos: urls, pdf: pu }; });
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
        photos: up.photos.length ? up.photos.join('\n') : (photos.length ? '(' + photos.length + ' photos — to be sent via WhatsApp)' : '(none)'),
        portfolio_pdf: up.pdf || (pdf ? '(PDF — to be sent via WhatsApp)' : '(none)')
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
