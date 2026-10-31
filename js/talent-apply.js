/* YKS Talents — the application (one screen, mobile-first).

   Order is strict and every step lives in ONE handler chain:
     1. Follow @yks_photoworks (tap) → submit unlocks
     2. Submit → every field validated → board gate (the select's own value)
        → photos + PDF → Apps Script (Drive + owner email) → engine
     3. Only then: "Last step: send me a WhatsApp" — the number is assembled
        here, inside the success handler, never earlier
     4. After the WhatsApp tap (and the return to this tab) the portfolio PDF
        unlocks for the applicant to download.
   The same YKS portfolio PDF is also built inside the submit chain (after the
   gate) and sent with the photos in ONE post to the YKS Apps Script web app,
   which saves everything to Google Drive, emails the owner and answers with
   the Drive link of the PDF — that link goes in the WhatsApp message.
   A failed PDF build never blocks the application.
   An application the board can't take stops at step 2 with one neutral
   line: nothing uploads, nothing is sent, no link, no number. */
(function () {
  'use strict';
  // YKS Talents intake (Google Apps Script web app on the owner's Google account).
  // It re-checks every rule server-side, saves to Drive and emails the owner.
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_36FeQLa2AsN-GzlYZWhT-VgqQ9UabIogrysT_5eHl-tZWbpNAkZhg26S3E2l3QRp/exec';
  var SEND_TIMEOUT = 150000;   // 8 photos + the PDF can take a minute on a slow phone
  var ENGINE_URL = 'https://yks-talents-engine.ysuresh634.workers.dev';
  var MAX_EDGE = 2000, JPEG_Q = 0.85, MAX_RAW = 12 * 1024 * 1024;   // photo prep before sending
  var BLOCKED = 'Sorry, this application can\u2019t be submitted right now.';
  // live follower check (workers/follow-check). Unreachable / slow / unsure → null → the
  // application still goes in, marked [REVIEW] "Follow check unavailable".
  var FOLLOW_CHECK_URL = 'https://yks-follow-check.ysuresh634.workers.dev/check', FOLLOW_TIMEOUT = 5000;
  function followCheck(handle) {
    return new Promise(function (resolve) {
      var settled = false, ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var t = setTimeout(function () { if (ctl) ctl.abort(); finish(null); }, FOLLOW_TIMEOUT);
      function finish(v) { if (settled) return; settled = true; clearTimeout(t); resolve(v); }
      try {
        fetch(FOLLOW_CHECK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle: handle }), signal: ctl ? ctl.signal : undefined, credentials: 'omit' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { finish(j && typeof j.follows === 'boolean' ? j.follows : null); }, function () { finish(null); });
      } catch (e) { finish(null); }
    });
  }

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var form = $('#talForm'); if (!form) return;
  var submitBtn = $('#taSubmit'), statusEl = $('#taStatus');
  var followBtn = $('#taFollow'), followTick = $('#taFollowed'), followHint = $('#taFollowHint');
  var photos = [];          // File[] — the ordered set: close-up 1, close-up 2, full-length, mid-shot, other, extras
  var followed = false, busy = false;
  var T0 = Date.now(), MIN_MS = 8000;   // a real person can't fill this in under ~8 s; scripts and replays can

  function say(t) { statusEl.textContent = t || ''; statusEl.hidden = !t; }
  function sync() { submitBtn.disabled = !followed || busy; }   // photo checks never disable submit; submit explains what's missing

  /* ── 1 · follow ── */
  followBtn.addEventListener('click', function () {
    followed = true; followTick.checked = true;
    followBtn.classList.add('done'); followBtn.querySelector('span').textContent = 'Following @yks_photoworks \u2713';
    if (followHint) followHint.hidden = true;
    sync();
  });
  sync();

  /* ── photos: 5 labelled slots (2 face close-ups first) + up to 3 extras ──
     Each photo is checked as it's added: an image, at least MIN_SIDE px on the short side
     (when the browser can read it — HEIC often can't, so it's let through and flagged), and
     not the same picture as another slot (name+size, SHA-256 of the bytes, and a tiny
     difference-hash so a re-saved or re-sent copy of the same shot is caught too). */
  var SLOTS = [
    { k: 'close1', label: 'Close-up 1', sub: 'face clearly visible', cap: 'Close-up 1' },
    { k: 'close2', label: 'Close-up 2', sub: 'face clearly visible', cap: 'Close-up 2' },
    { k: 'full', label: 'Full-length', sub: 'head to toe', cap: 'Full-length' },
    { k: 'mid', label: 'Mid-shot', sub: 'waist up', cap: 'Mid-shot' },
    { k: 'other', label: 'One more', sub: 'any other angle or look', cap: 'Other' }
  ];
  var MIN_PHOTOS = 5, MAX_EXTRA = 3, MIN_SIDE = 800;
  var slotBox = $('#taSlots'), slotState = {}, extras = [], pending = 0;
  function isImg(f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f.name); }
  function hex(buf) { return [].map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(f) {
    try { if (!(window.crypto && crypto.subtle && f.arrayBuffer)) return Promise.resolve(''); return f.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(hex, function () { return ''; }); }
    catch (e) { return Promise.resolve(''); }
  }
  // pixel size + a 64-bit difference hash, read once; HEIC the browser can't decode → { w:0 }
  function look(f) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(f), im = new Image();
      im.onload = function () {
        var out = { w: im.naturalWidth, h: im.naturalHeight, d: '' };
        try { var c = document.createElement('canvas'); c.width = 9; c.height = 8; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 9, 8);
          var px = x.getImageData(0, 0, 9, 8).data, bits = '';
          for (var r = 0; r < 8; r++) for (var q = 0; q < 8; q++) { var i = (r * 9 + q) * 4, j = i + 4; bits += (px[i] + px[i + 1] + px[i + 2]) > (px[j] + px[j + 1] + px[j + 2]) ? '1' : '0'; }
          out.d = bits; } catch (e) {}
        URL.revokeObjectURL(u); res(out);
      };
      im.onerror = function () { URL.revokeObjectURL(u); res({ w: 0, h: 0, d: '' }); };
      im.src = u;
    });
  }
  function ham(a, b) { if (!a || !b || a.length !== b.length) return 99; var n = 0; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; }
  function entries() { var out = []; SLOTS.forEach(function (s) { if (slotState[s.k]) out.push(slotState[s.k]); }); return out.concat(extras); }
  function ordered() { return entries().map(function (e) { return e.file; }); }
  function dupOf(e, skip) {
    var all = entries();
    for (var i = 0; i < all.length; i++) { var o = all[i]; if (o === skip) continue;
      if ((o.file.name === e.file.name && o.file.size === e.file.size) || (e.sha && o.sha === e.sha) || ham(e.d, o.d) <= 3) return o; }
    return null;
  }
  function check(f) {   // → Promise<{ok, e, msg}>
    if (!isImg(f)) return Promise.resolve({ ok: false, msg: 'That file isn\u2019t a photo. Add a JPG, PNG or HEIC.' });
    pending++; sync();
    return Promise.all([sha(f), look(f)]).then(function (r) {
      pending--; sync();
      var e = { file: f, sha: r[0], w: r[1].w, h: r[1].h, d: r[1].d };
      if (dims && e.w) dims.set(f, [e.w, e.h]);
      if (!e.w && f.size > MAX_RAW) return { ok: false, msg: 'This photo is too large to send (' + Math.round(f.size / 1048576) + ' MB). Pick a JPG version of it, or a smaller copy.' };
      if (e.w && Math.min(e.w, e.h) < MIN_SIDE) return { ok: false, msg: 'This photo is too small (' + e.w + '\u00d7' + e.h + '). Use the original from your camera roll, at least ' + MIN_SIDE + ' px on the short side.' };
      var d = dupOf(e);
      if (d) return { ok: false, msg: 'That\u2019s the same photo as ' + (d.cap ? '\u201c' + d.cap + '\u201d' : 'one you already added') + '. Each slot needs a different photo.' };
      return { ok: true, e: e };
    });
  }
  function thumb(e, onRemove, cap, sub) {
    var d = document.createElement('div'); d.className = 'ta-thumb';
    var im = document.createElement('img'); im.alt = cap; im.src = URL.createObjectURL(e.file);
    im.onerror = function () { d.classList.add('noprev'); d.setAttribute('data-name', e.file.name); };
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + cap); x.textContent = '\u00d7';
    x.onclick = onRemove;
    var t = document.createElement('span'); t.className = 'ta-slot-cap'; t.textContent = cap;
    d.appendChild(im); d.appendChild(x); d.appendChild(t); return d;
  }
  function picker(cap, sub, multiple, onFiles, req) {
    var l = document.createElement('label'); l.className = 'ta-add ta-slot' + (req ? ' req' : ''); l.tabIndex = 0;
    l.innerHTML = '<span><b>+</b><em></em><i></i></span>';
    l.querySelector('em').textContent = cap; l.querySelector('i').textContent = sub;
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.heic,.heif'; inp.hidden = true; if (multiple) inp.multiple = true;
    inp.addEventListener('change', function () { var fs = [].slice.call(inp.files || []); inp.value = ''; onFiles(fs); });
    l.appendChild(inp);
    l.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); inp.click(); } });
    return l;
  }
  function slotErr(msg) { if (msg) setErr(slotBox, msg); else clearErr(slotBox); }
  function renderSlots() {
    slotBox.innerHTML = '';
    SLOTS.forEach(function (s) {
      var w = document.createElement('div'); w.className = 'ta-slotwrap'; w.setAttribute('data-slot', s.k);
      var e = slotState[s.k];
      if (e) w.appendChild(thumb(e, function () { delete slotState[s.k]; renderSlots(); }, s.label, s.sub));
      else w.appendChild(picker(s.label, s.sub, false, function (fs) {
        if (!fs[0]) return;
        check(fs[0]).then(function (r) { if (!r.ok) { slotErr(r.msg); return; } r.e.cap = s.label; slotState[s.k] = r.e; slotErr(''); renderSlots(); });
      }, true));
      slotBox.appendChild(w);
    });
    extras.forEach(function (e, i) {
      var w = document.createElement('div'); w.className = 'ta-slotwrap';
      w.appendChild(thumb(e, function () { extras.splice(i, 1); renderSlots(); }, 'Extra ' + (i + 1), ''));
      slotBox.appendChild(w);
    });
    if (extras.length < MAX_EXTRA) {
      var w2 = document.createElement('div'); w2.className = 'ta-slotwrap';
      w2.appendChild(picker('More', 'optional, up to ' + MAX_EXTRA, true, function (fs) {
        fs.reduce(function (p, f) { return p.then(function () {
          if (extras.length >= MAX_EXTRA) return;
          return check(f).then(function (r) { if (!r.ok) { slotErr(r.msg); return; } r.e.cap = 'Extra ' + (extras.length + 1); extras.push(r.e); slotErr(''); });
        }); }, Promise.resolve()).then(renderSlots);
      }, false));
      slotBox.appendChild(w2);
    }
    var n = SLOTS.filter(function (x) { return slotState[x.k]; }).length;
    $('#taPhotoCount').textContent = n + ' of ' + MIN_PHOTOS + ' required added' + (extras.length ? ' + ' + extras.length + ' extra' : '');
    photos = ordered();
  }
  // PDF order: close-up 1 is the cover, the full-length sits beside the profile (its caption reads
  // FULL LENGTH), then close-up 2, mid-shot, the other photo and any extras
  function pdfOrder() {
    var o = ['close1', 'full', 'close2', 'mid', 'other'].map(function (k) { return slotState[k] && slotState[k].file; }).filter(Boolean);
    return o.concat(extras.map(function (e) { return e.file; }));
  }
  // what's still missing, in words — '' when the set is complete
  function photoProblem() {
    if (pending) return 'Still checking your photos \u2014 give it a second, then tap Submit again.';
    var miss = SLOTS.filter(function (s) { return !slotState[s.k]; }).map(function (s) { return s.label + (s.sub ? ' (' + s.sub + ')' : ''); });
    var all = entries();
    for (var i = 0; i < all.length; i++) if (dupOf(all[i], all[i])) return 'Two of your photos are the same picture. Each slot needs a different photo.';
    if (!miss.length) return '';
    return 'Add minimum ' + MIN_PHOTOS + ' different photos, including 2 clear face close-ups. Still missing: ' + miss.join(', ') + '.';
  }
  renderSlots();

  var dims = typeof WeakMap === 'function' ? new WeakMap() : null;

  /* ── review score: never blocks, only marks the email for a closer look ── */
  var FIRST = ('sajitha anjali priya pooja neha riya divya kavya sneha anu ammu aswathy aiswarya athira lakshmi meera nisha rahul arjun amal akhil vishnu rohit amit ankit rajesh suresh ramesh manu jithin vineeth abhi adarsh anand arun ajay vijay sanjay deepak pradeep punit rohan karan varun nikhil sachin kiran sunil anil ravi raj ali faisal ahmed mohammed muhammad salman shahid irfan imran fatima ayesha sara sana zara aisha aditi isha shreya shruti swathi swati simran preeti pinky kajal komal ritu jyoti monika pallavi rekha sonia tanvi tanya diya gauri radha sita gita').split(' ');
  var MALE = /(^|[^a-z])(mr|mister|sir|bro|bhai|bhaiya|king|boy|boyz|guy|dude|man|hunk|prince|raja|sher|gentleman|bad ?boy|alpha|macho)([^a-z]|$)|^(mr|king|boy)|(boy|boyz|dude|hunk|gentleman|mister)|prince(?!ss)/i;
  function cm(v) {
    v = String(v).toLowerCase(); var m;
    if ((m = /(\d+(?:\.\d+)?)\s*cm/.exec(v))) return +m[1];
    if ((m = /(\d)\s*(?:'|ft|feet|foot|\u2019)\s*(\d{1,2})?/.exec(v))) return Math.round((+m[1] * 12 + (+(m[2] || 0))) * 2.54);
    if ((m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(v.trim()))) {
      var n = +(m[1] + '.' + (m[2] || '0'));
      if (n > 100) return n;
      if (n < 3) return Math.round(n * 100);                                     // 1.68 (m)
      if (n < 8) return Math.round((+m[1] * 12 + (+(m[2] || 0))) * 2.54);       // 5.4 / 5.11 = feet.inches
      return 0;
    }
    return 0;
  }
  function letters(x) { return String(x || '').toLowerCase().replace(/[^a-z]/g, ''); }
  function reviewFlags(D, seconds) {
    var F = [], h = D.handle.toLowerCase(), hl = letters(h);
    if (h.length < 6) F.push('Instagram handle shorter than 6 characters');
    else if (FIRST.indexOf(hl) > -1 && hl === h.replace(/[._]/g, '')) F.push('Instagram handle is a single common first name');
    var c = cm(D.height);
    if (c && c > 180) F.push('Height above 180 cm (' + D.height + ')');
    else if (c && c < 145) F.push('Height below 145 cm (' + D.height + ')');
    else if (!c) F.push('Height not readable (' + D.height + ')');
    var local = D.email.split('@')[0].toLowerCase();
    [['name', D.name], ['email', local], ['Instagram handle', h]].forEach(function (p) { if (MALE.test(String(p[1]).toLowerCase().replace(/[._\d-]+/g, ' '))) F.push('Male marker in ' + p[0]); });
    var ll = letters(local), tokens = D.name.toLowerCase().split(/[^a-z]+/).filter(function (t) { return t.length >= 3; });
    var match = tokens.some(function (t) { return ll.indexOf(t) > -1 || (t.length >= 4 && ll.indexOf(t.slice(0, 4)) > -1); })
      || (hl.length >= 4 && (ll.indexOf(hl) > -1 || hl.indexOf(ll) > -1 || ll.indexOf(hl.slice(0, 4)) > -1 || hl.indexOf(ll.slice(0, 4)) > -1));
    if (ll.length >= 3 && !match) F.push('Email doesn\u2019t match name or handle');
    if (seconds < 20) F.push('Form filled in ' + seconds + ' s');
    if (!photos.length) F.push('No photos');
    else photos.forEach(function (f, i) {
      var d = dims && dims.get(f);
      if (f.size < 25 * 1024 || (d && Math.min(d[0], d[1]) < 400)) F.push('Photo ' + (i + 1) + ' very small (' + Math.round(f.size / 1024) + ' KB' + (d ? ', ' + d[0] + '\u00d7' + d[1] : '') + ')');
    });
    return F;
  }

  /* ── Instagram: one shape ── */
  function igHandle(raw) {
    raw = String(raw || '').trim();
    var m = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(raw) || /^@?([A-Za-z0-9._]{1,30})$/.exec(raw);
    return m ? m[1].replace(/\.+$/, '').toLowerCase() : '';   // handles are case-insensitive: one shape everywhere
  }
  form.instagram.addEventListener('blur', function () { var h = igHandle(form.instagram.value); if (h) form.instagram.value = '@' + h; });

  /* ── friendly inline validation ── */
  function fieldBox(el) { return el.closest('.ta-f') || el.parentNode; }
  function setErr(el, msg) {
    var box = fieldBox(el), e = box.querySelector('.ta-err');
    if (!e) { e = document.createElement('span'); e.className = 'ta-err'; e.setAttribute('role', 'alert'); box.appendChild(e); }
    e.textContent = msg; box.classList.add('bad');
  }
  function clearErr(el) { var box = fieldBox(el), e = box.querySelector('.ta-err'); if (e) e.remove(); box.classList.remove('bad'); }
  function age(v) {
    var d = new Date(v + 'T00:00:00'), n = new Date(); if (isNaN(d)) return -1;
    return n.getFullYear() - d.getFullYear() - ((n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) ? 1 : 0);
  }
  var CHECKS = {
    name: function (v) { return v.replace(/\s+/g, ' ').length >= 2 && /[A-Za-z\u00C0-\u024F\u0900-\u0D7F]/.test(v) ? '' : 'Add your full name.'; },
    phone: function (v) { var d = v.replace(/\D/g, ''); return /^[+\d\s()\-]+$/.test(v) && d.length >= 8 && d.length <= 15 ? '' : 'Add a phone number with country code, e.g. +91 98xxx xxxxx.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Add a valid email, e.g. you@gmail.com.'; },
    city: function (v) { return v.length >= 2 ? '' : 'Add your city.'; },
    instagram: function (v) { var h = igHandle(v); return h && /^(?!.*\.\.)(?!\.)[A-Za-z0-9._]{2,30}$/.test(h) && !/^(na|none|nil|no)$/i.test(h) ? '' : 'Add your Instagram handle, e.g. @yourname.'; },
    category: function (v) { return v ? '' : 'Choose one.'; },
    dob: function (v) { if (!v) return 'Add your date of birth.'; var a = age(v); return a < 0 || a > 90 ? 'Check your date of birth.' : (a < 18 ? 'Applicants must be 18 or older.' : ''); },
    height: function (v) { return /\d/.test(v) && v.length <= 20 ? '' : 'Add your height, e.g. 5\'6" or 168 cm.'; },
    gender: function (v) { return v ? '' : 'Choose one.'; }
  };
  Object.keys(CHECKS).forEach(function (n) {
    var el = form[n]; if (!el) return;
    el.addEventListener('blur', function () { if (el.value.trim()) { var m = CHECKS[n](el.value.trim()); m ? setErr(el, m) : clearErr(el); } });
    el.addEventListener('input', function () { if (fieldBox(el).classList.contains('bad') && !CHECKS[n](el.value.trim())) clearErr(el); });
    el.addEventListener('change', function () { if (!CHECKS[n](el.value.trim())) clearErr(el); });
  });

  /* The board's gate. Passes only when the select holds exactly the one
     value it offers — anything missing, defaulted, injected or edited fails. */
  function boardGate() {
    var g = form.gender, opts = [].slice.call(g.options).filter(function (o) { return o.value; });
    return g.tagName === 'SELECT' && opts.length === 1 && opts[0].value === 'Woman' && g.value === 'Woman' && g.selectedIndex > 0;
  }

  // one photo → {mime, data(base64)}: re-encoded as JPEG, max 2000 px on the long side
  // (keeps the post small and strips location data); a format this browser can't decode
  // (often HEIC) goes as-is if it's under 12 MB
  function b64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader(); r.onload = function () { res(String(r.result).replace(/^data:[^,]*,/, '')); }; r.onerror = rej; r.readAsDataURL(blob);
    });
  }
  function rawMime(f) {
    if (f.type) return f.type.toLowerCase();
    var m = /\.([a-z0-9]+)$/i.exec(f.name || ''), x = m ? m[1].toLowerCase() : '';
    return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', avif: 'image/avif' }[x] || 'image/jpeg';
  }
  function prep(f) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(f), im = new Image();
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, MAX_EDGE / Math.max(w, h));
        try {
          var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(u);
          c.toBlob(function (bl) { res(bl ? { blob: bl, mime: 'image/jpeg', ext: 'jpg' } : null); }, 'image/jpeg', JPEG_Q);
        } catch (e) { URL.revokeObjectURL(u); res(null); }
      };
      im.onerror = function () { URL.revokeObjectURL(u); res(null); };
      im.src = u;
    }).then(function (r) {
      if (r) return r;
      if (f.size > MAX_RAW) throw new Error('raw too large');
      var m = rawMime(f); return { blob: f, mime: m, ext: (f.name.split('.').pop() || 'jpg').toLowerCase() };
    }).then(function (r) { return b64(r.blob).then(function (d) { return { mime: r.mime, ext: r.ext, data: d }; }); });
  }
  // POST as text/plain: Apps Script can't answer a CORS preflight, and a simple request needs none.
  // fetch follows the 302 to script.googleusercontent.com and reads the JSON.
  function postIntake(body) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, SEND_TIMEOUT);
    return fetch(APPS_SCRIPT_URL, { method: 'POST', redirect: 'follow', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('http ' + r.status); return r.json(); }, function (e) { clearTimeout(t); throw e; });
  }
  function portfolioLib() {
    return window.YKSPortfolio ? Promise.resolve() : new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = '/js/talent-portfolio.js?v=4'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  // the applicant's YKS portfolio PDF as base64; null on any failure or after 30 s, never throws
  function builtPortfolio(D) {
    var work = portfolioLib().then(function () {
      return window.YKSPortfolio.blob({ name: D.name, category: D.category, city: D.city, about: D.about, stats: { height: D.height }, photos: pdfOrder() });
    }).then(function (blob) { return b64(blob); })
      .then(function (d) { return { name: (D.name.replace(/[^A-Za-z0-9]+/g, '-') || 'YKS') + '-YKS-portfolio.pdf', mime: 'application/pdf', data: d }; }, function () { return null; });
    return Promise.race([work, new Promise(function (res) { setTimeout(function () { res(null); }, 30000); })]);
  }
  function source() { try { var v = JSON.parse(localStorage.getItem('yks_src_v1') || 'null'); return v && v.src ? v.src + (v.camp ? ' · ' + v.camp : '') : 'Direct'; } catch (e) { return 'Direct'; } }

  /* ── 2 · submit ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    say('');
    if (!followed) { say('Tap \u201cFollow @yks_photoworks\u201d first.'); return; }
    var first = null;
    Object.keys(CHECKS).forEach(function (n) {
      var el = form[n], m = CHECKS[n](String(el.value || '').trim());
      if (m) { setErr(el, m); first = first || el; } else clearErr(el);
    });
    var pp = photoProblem(); photos = ordered();
    if (pp) { setErr(slotBox, pp); first = first || slotBox; }
    if (first) { say(first === slotBox && pp ? pp : 'Please fix the fields marked in red.' + (pp ? ' ' + pp : '')); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus({ preventScroll: true }); return; }
    if (!boardGate()) { say(BLOCKED); return; }   // silent: no upload, no email, no link
    var yrs = age(form.dob.value); if (yrs < 18 || yrs > 35) { say(BLOCKED); return; }   // board window, never named on the page
    // backstops for bots and scripted posts: honeypots must stay empty, and the form can't be instant
    var hpBox = form.querySelector('[name=botcheck]'), hpTxt = form.querySelector('[name=website]');
    if ((hpBox && hpBox.checked) || (hpTxt && hpTxt.value) || Date.now() - T0 < MIN_MS) { say(BLOCKED); return; }

    var D = {
      name: form.name.value.trim().replace(/\s+/g, ' '), phone: form.phone.value.trim(), email: form.email.value.trim(),
      city: form.city.value.trim(), handle: igHandle(form.instagram.value), category: form.category.value,
      dob: form.dob.value, height: form.height.value.trim(), gender: form.gender.value, about: (form.about.value || '').trim().slice(0, 300)
    };
    D.profile = 'https://instagram.com/' + D.handle;
    var secs = Math.round((Date.now() - T0) / 1000), FLAGS = reviewFlags(D, secs);
    busy = true; sync(); submitBtn.textContent = 'Checking\u2026';
    var refollow = $('#taRefollow'); if (refollow) refollow.hidden = true;
    var followVerified = '';
    say('Checking your follow\u2026');
    followCheck(D.handle).then(function (f) {
      if (f === false) {   // stop here: nothing uploaded or sent, everything typed stays put
        busy = false; sync(); submitBtn.textContent = 'Submit application';
        say('Please follow @yks_photoworks first, then tap Submit again.');
        if (refollow) refollow.hidden = false;
        if (statusEl.scrollIntoView) statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (f === true) followVerified = 'yes'; else FLAGS.push('Follow check unavailable');
      submitBtn.textContent = 'Sending\u2026';
      send();
    });
    function send() {
    var list = entries(), KEYS = SLOTS.map(function (x) { return x.k; }), done = 0;
    say('Preparing your photos\u2026 0 / ' + list.length);
    Promise.all(list.map(function (en, i) {
      return prep(en.file).then(function (r) {
        done++; say('Preparing your photos\u2026 ' + done + ' / ' + list.length);
        var key = KEYS.filter(function (k) { return slotState[k] === en; })[0] || 'extra';
        return { slot: key, label: en.cap, name: ('0' + (i + 1)).slice(-2) + '-' + en.cap.replace(/[^A-Za-z0-9]+/g, '-') + '.' + r.ext, mime: r.mime, data: r.data };
      });
    }))
      .then(function (ph) {
        say('Preparing your portfolio\u2026');
        return builtPortfolio(D).then(function (pdf) { return { photos: ph, pdf: pdf }; });
      })
      .then(function (up) {
        say('Sending your application\u2026 this can take up to a minute, keep this page open.');
        var hp = form.querySelector('[name=website]');
        var body = JSON.stringify({
          fields: {
            name: D.name, phone: D.phone, email: D.email, city: D.city, instagram: D.handle, category: D.category,
            dob: D.dob, height: D.height, gender: D.gender, about: D.about,
            follow_verified: followVerified || '', flags: FLAGS.join('; '), source: source(), seconds_on_form: secs,
            website: hp ? hp.value : '', botcheck: ''
          },
          photos: up.photos, pdf: up.pdf
        });
        var tries = 0;
        function attempt() {
          tries++;
          return postIntake(body).then(null, function (er) {   // one quiet retry for a dropped connection; the script de-duplicates
            if (tries < 2) { say('Still sending\u2026'); return attempt(); }
            throw er;
          });
        }
        return attempt();
      })
      .then(function (j) {
        if (!j || !j.ok) {
          if (j && j.error === 'blocked') { busy = false; sync(); submitBtn.textContent = 'Submit application'; say(BLOCKED); return; }
          var e = new Error('rejected'); e.msg = j && j.message; throw e;
        }
        var direct = (j.photos || []).map(function (p) { return { url: p.url, cat: p.slot || 'extra' }; }).filter(function (p) { return p.url; });
        try {
          fetch(ENGINE_URL + '/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            name: D.name, contact: D.phone, email: D.email, category: D.category, city: D.city, socials: '@' + D.handle,
            instagram_profile: D.profile, about: D.about, stat_height: D.height, dob: D.dob, gender: D.gender,
            photos: direct, cover_url: direct[0] ? direct[0].url : ''
          }) }).catch(function () {});
        } catch (er) {}
        if (window.gtag) gtag('event', 'talent_apply');
        success(D, Promise.resolve(j.pdfUrl || ''));
      })
      .catch(function (er) {
        busy = false; sync(); submitBtn.textContent = 'Submit application';
        say(er && er.msg ? 'That didn\u2019t go through: ' + er.msg
          : 'Your application didn\u2019t send \u2014 nothing was lost, everything you added is still here. Check your connection and tap Submit again.');
        if (statusEl.scrollIntoView) statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  });

  /* ── 3 · last step (built only here) ── */
  function waNumber() {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var IN = ['91', '97466', '79720'], AE = ['971', '50195', '5122'];   // same rule as geo-wa.js / chat.js
    return (/Kolkata|Calcutta|Colombo|Kathmandu|Dhaka/i.test(tz) ? IN : AE).join('');
  }
  // pdfReady resolves with the Drive portfolio link ('' if the build/upload failed);
  // the WhatsApp button stays in its waiting state until it settles
  function success(D, pdfReady) {
    form.hidden = true; say('');
    var box = $('#taDone'); box.hidden = false;
    var a = document.createElement('a');
    a.className = 'ta-wa wait'; a.id = 'taWa'; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href');
    a.innerHTML = '<span>Preparing your portfolio link\u2026</span>';
    a.addEventListener('click', function (ev) { if (a.classList.contains('wait')) ev.preventDefault(); });
    $('#taWaSlot').appendChild(a);
    (pdfReady || Promise.resolve('')).then(null, function () { return ''; }).then(function (pdfUrl) {
      var msg = 'Hi Yedukrishna, I\u2019ve applied to YKS Talents and followed @yks_photoworks.\nName: ' + D.name +
        '\nInstagram: https://instagram.com/' + D.handle + '\nCity: ' + D.city +
        '\nPortfolio: ' + (pdfUrl || '(the upload didn\u2019t go through \u2014 I\u2019ll send my PDF here)');
      a.href = 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(msg);
      a.classList.remove('wait'); a.removeAttribute('aria-disabled');
      a.innerHTML = '<span>Send me a WhatsApp</span>';
      if (!pdfUrl) {
        var n = document.createElement('p'); n.className = 'ta-wa-note'; n.id = 'taWaNote';
        n.textContent = 'Your portfolio link couldn\u2019t be prepared just now. Send the message anyway, then download your portfolio below and attach the PDF in the same chat.';
        a.parentNode.insertBefore(n, a.nextSibling);
      }
    });
    var dl = $('#taDl'), hint = $('#taDlHint'), tapped = false, unlocked = false;
    function unlock() {
      if (!tapped || unlocked) return; unlocked = true;
      dl.disabled = false; dl.textContent = 'Download your portfolio';
      hint.textContent = 'Your YKS portfolio PDF is built on this phone from your photos.';
    }
    a.addEventListener('click', function () {
      tapped = true;
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') unlock(); });
      window.addEventListener('focus', unlock);
      setTimeout(unlock, 4000);
    });
    dl.addEventListener('click', function () {
      if (!unlocked) return;
      dl.disabled = true; dl.textContent = 'Building your portfolio\u2026';
      var go = function () {
        return window.YKSPortfolio.download({ name: D.name, category: D.category, city: D.city, about: D.about, stats: { height: D.height }, photos: pdfOrder() });
      };
      (window.YKSPortfolio ? go() : new Promise(function (res, rej) {
        var s = document.createElement('script'); s.src = '/js/talent-portfolio.js?v=4'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
      }).then(go))
        .then(function () { dl.disabled = false; dl.textContent = 'Downloaded \u2713 \u2014 download again'; })
        .catch(function () { dl.disabled = false; dl.textContent = 'Download your portfolio'; hint.textContent = 'Couldn\u2019t build the PDF just now \u2014 tap to try again.'; });
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
})();
