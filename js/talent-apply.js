/* YKS Talents — the application (one screen, mobile-first).

   Order is strict and every step lives in ONE handler chain:
     1. Follow @yks_photoworks (tap) → submit unlocks
     2. Submit → every field validated → board gate (the select's own value)
        → photos upload → email + engine
     3. Only then: "Last step: send me a WhatsApp" — the number is assembled
        here, inside the success handler, never earlier
     4. After the WhatsApp tap (and the return to this tab) the portfolio PDF
        unlocks; it is built on the device and never uploaded.
   An application the board can't take stops at step 2 with one neutral
   line: nothing uploads, nothing is sent, no link, no number. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
  var ENGINE_URL = 'https://yks-talents-engine.ysuresh634.workers.dev';
  // Cloudinary UNSIGNED preset: anyone holding these two values can upload to
  // this cloud. Used only for the applicant's 1–3 photos, after a passed submit.
  var CLOUD = 'sn15r86h', PRESET = 'yks_talents';
  var BLOCKED = 'Sorry, this application can\u2019t be submitted right now.';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var form = $('#talForm'); if (!form) return;
  var submitBtn = $('#taSubmit'), statusEl = $('#taStatus');
  var followBtn = $('#taFollow'), followTick = $('#taFollowed'), followHint = $('#taFollowHint');
  var photoInput = $('#taPhotos'), thumbs = $('#taThumbs');
  var photos = [];          // File[] — 1 to 3
  var followed = false, busy = false;
  var T0 = Date.now(), MIN_MS = 8000;   // a real person can't fill this in under ~8 s; scripts and replays can

  function say(t) { statusEl.textContent = t || ''; statusEl.hidden = !t; }
  function sync() { submitBtn.disabled = !followed || busy; }

  /* ── 1 · follow ── */
  followBtn.addEventListener('click', function () {
    followed = true; followTick.checked = true;
    followBtn.classList.add('done'); followBtn.querySelector('span').textContent = 'Following @yks_photoworks \u2713';
    if (followHint) followHint.hidden = true;
    sync();
  });
  sync();

  /* ── photos ── */
  function renderThumbs() {
    thumbs.innerHTML = '';
    photos.forEach(function (f, i) {
      var d = document.createElement('div'); d.className = 'ta-thumb';
      var im = document.createElement('img'); im.alt = 'Photo ' + (i + 1); im.src = URL.createObjectURL(f);
      im.onerror = function () { d.classList.add('noprev'); d.setAttribute('data-name', f.name); };
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove photo'); x.textContent = '\u00d7';
      x.onclick = function () { photos.splice(i, 1); renderThumbs(); };
      d.appendChild(im); d.appendChild(x); thumbs.appendChild(d);
    });
    $('#taAddPhoto').hidden = photos.length >= 3;
    $('#taPhotoCount').textContent = photos.length ? photos.length + ' of 3 added' : '';
    clearErr(photoInput);
  }
  photoInput.addEventListener('change', function () {
    [].slice.call(photoInput.files || []).forEach(function (f) {
      if (photos.length < 3 && (/^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f.name))) photos.push(f);
    });
    photoInput.value = ''; renderThumbs();
  });

  /* ── Instagram: one shape ── */
  function igHandle(raw) {
    raw = String(raw || '').trim();
    var m = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(raw) || /^@?([A-Za-z0-9._]{1,30})$/.exec(raw);
    return m ? m[1].replace(/\.+$/, '') : '';
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

  function upload(file) {
    var fd = new FormData(); fd.append('file', file); fd.append('upload_preset', PRESET);
    return fetch('https://api.cloudinary.com/v1_1/' + CLOUD + '/image/upload', { method: 'POST', body: fd })
      .then(function (r) { if (!r.ok) throw new Error('upload'); return r.json(); })
      .then(function (j) { return j.secure_url || ''; });
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
    if (!photos.length) { setErr(photoInput, 'Add 1 to 3 photos \u2014 a clear face shot and a full-length are ideal.'); first = first || $('#taAddPhoto'); }
    if (first) { say('Please fix the fields marked in red.'); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus({ preventScroll: true }); return; }
    if (!boardGate()) { say(BLOCKED); return; }   // silent: no upload, no email, no link
    // backstops for bots and scripted posts: honeypots must stay empty, and the form can't be instant
    var hpBox = form.querySelector('[name=botcheck]'), hpTxt = form.querySelector('[name=website]');
    if ((hpBox && hpBox.checked) || (hpTxt && hpTxt.value) || Date.now() - T0 < MIN_MS) { say(BLOCKED); return; }

    var D = {
      name: form.name.value.trim().replace(/\s+/g, ' '), phone: form.phone.value.trim(), email: form.email.value.trim(),
      city: form.city.value.trim(), handle: igHandle(form.instagram.value), category: form.category.value,
      dob: form.dob.value, height: form.height.value.trim(), gender: form.gender.value, about: (form.about.value || '').trim().slice(0, 300)
    };
    D.profile = 'https://instagram.com/' + D.handle;
    busy = true; sync(); submitBtn.textContent = 'Sending\u2026';
    var done = 0; say('Uploading your photos\u2026 0 / ' + photos.length);
    Promise.all(photos.map(function (f) { return upload(f).then(function (u) { done++; say('Uploading your photos\u2026 ' + done + ' / ' + photos.length); return u; }); }))
      .then(function (urls) {
        say('Sending your application\u2026');
        var payload = {
          access_key: WEB3FORMS_KEY,
          subject: 'New talent application \u2014 ' + D.name + ' (@' + D.handle + ')',
          from_name: 'YKS Talents application',
          name: D.name, phone: D.phone, email: D.email, replyto: D.email,
          instagram_profile: D.profile, instagram_handle: '@' + D.handle,
          followed_yks_photoworks: 'Tapped Follow @yks_photoworks before submitting (check ' + D.profile + ' in your followers)',
          city: D.city, category: D.category, date_of_birth: D.dob, height: D.height, gender: D.gender,
          intro: D.about || '(none)', photos: urls.filter(Boolean).join('\n'), found_via: source(),
          seconds_on_form: Math.round((Date.now() - T0) / 1000),
          botcheck: false   // Web3Forms' own honeypot: a checked/true value is rejected server-side
        };
        try {
          fetch(ENGINE_URL + '/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            name: D.name, contact: D.phone, email: D.email, category: D.category, city: D.city, socials: '@' + D.handle,
            instagram_profile: D.profile, about: D.about, stat_height: D.height, dob: D.dob, gender: D.gender,
            photos: urls.filter(Boolean).map(function (u) { return { url: u, cat: '' }; }), cover_url: urls[0] || ''
          }) }).catch(function () {});
        } catch (er) {}
        return fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (!j || !j.success) throw new Error('send'); });
      })
      .then(function () { if (window.gtag) gtag('event', 'talent_apply'); success(D); })
      .catch(function () {
        busy = false; sync(); submitBtn.textContent = 'Submit application';
        say('Something went wrong sending that \u2014 please check your connection and try again.');
      });
  });

  /* ── 3 · last step (built only here) ── */
  function waNumber() {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var IN = ['91', '97466', '79720'], AE = ['971', '50195', '5122'];   // same rule as geo-wa.js / chat.js
    return (/Kolkata|Calcutta|Colombo|Kathmandu|Dhaka/i.test(tz) ? IN : AE).join('');
  }
  function success(D) {
    form.hidden = true; say('');
    var box = $('#taDone'); box.hidden = false;
    var msg = 'Hi Yedukrishna, I\u2019ve applied to the YKS Talent Board and followed @yks_photoworks.\nName: ' + D.name +
      '\nInstagram: https://instagram.com/' + D.handle + '\nCity: ' + D.city;
    var a = document.createElement('a');
    a.className = 'ta-wa'; a.id = 'taWa'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(msg);
    a.innerHTML = '<span>Send me a WhatsApp</span>';
    $('#taWaSlot').appendChild(a);
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
        return window.YKSPortfolio.download({ name: D.name, category: D.category, city: D.city, about: D.about, stats: { height: D.height }, photos: photos });
      };
      (window.YKSPortfolio ? go() : new Promise(function (res, rej) {
        var s = document.createElement('script'); s.src = '/js/talent-portfolio.js?v=1'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
      }).then(go))
        .then(function () { dl.disabled = false; dl.textContent = 'Downloaded \u2713 \u2014 download again'; })
        .catch(function () { dl.disabled = false; dl.textContent = 'Download your portfolio'; hint.textContent = 'Couldn\u2019t build the PDF just now \u2014 tap to try again.'; });
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
})();
