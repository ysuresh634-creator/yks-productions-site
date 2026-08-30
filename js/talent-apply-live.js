/* ═══════════════════════════════════════════════════════════════
   APPLY — the live studio

   The page already builds a proper comp card, but it did it at the
   very bottom, after twenty fields, long after most people have
   decided whether this is worth their evening. The proof arrived
   after the ask.

   This moves the proof to the first thing she does. The moment her
   first photo lands, a card assembles with her own face in it and a
   handle she can drag between the phone shot she picked and the
   graded frame it becomes. It argues the whole pitch — "I can make
   your pictures look like a book" — in about two seconds, using her
   photograph rather than a stranger's.

   On top of that card: six grades applied live to her photo, a turn
   to the measurements side the way a real comp card works, a read on
   how the book is shaping up, and a story export — the card as a
   1080×1920 image she can post.

   The reverse carries her roster code rather than her name, which is
   the privacy promise made visible: it is literally what a client
   would be sent.

   It reads what talent-apply.js has already rendered (the thumbnail
   strip) rather than intercepting the file input, so upload, HEIC
   handling, ordering and cover logic all stay its business. Nothing
   here writes to the form. Without JS none of it appears and the
   page is exactly as it was.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* the same grades the PDF uses — kept in step with talent-apply.js so the
     preview is never a promise the finished book breaks */
  var LOOKS = [
    { k: 'none', label: 'True',      css: 'none' },
    { k: 'bw',   label: 'B&W',       css: 'grayscale(1) contrast(1.06)' },
    { k: 'warm', label: 'Warm',      css: 'saturate(1.05) sepia(.22) contrast(1.03) brightness(1.02)' },
    { k: 'film', label: 'Film',      css: 'contrast(1.12) saturate(.9) brightness(1.03) sepia(.08)' },
    { k: 'cool', label: 'Editorial', css: 'saturate(.86) contrast(1.08) brightness(1.02) hue-rotate(-6deg)' },
    { k: 'fade', label: 'Matte',     css: 'contrast(.92) saturate(.92) brightness(1.06)' }
  ];
  var DEFAULT_LOOK = 4;                       // Editorial — the house grade

  /* The three a casting director asks for before anything else. Keys match
     SECTIONS in talent-apply.js, which is what the thumbnail selects carry. */
  var ESSENTIAL = [
    { k: 'headshots',  say: 'a headshot' },
    { k: 'fulllength', say: 'a full-length' },
    { k: 'digitals',   say: 'digitals' }
  ];
  var TARGET = 8;                             // "6–10 sharp shots", per the page

  var CAT_LETTER = { model: 'M', influencer: 'I', actor: 'A' };
  var STATS = [
    ['stat_height', 'Height'], ['stat_bust', 'Bust'], ['stat_waist', 'Waist'],
    ['stat_hips', 'Hips'], ['stat_shoe', 'Shoe'], ['stat_hair', 'Hair'],
    ['stat_eyes', 'Eyes'], ['stat_skin', 'Skin']
  ];

  var thumbs = document.getElementById('apThumbs');
  var form   = document.getElementById('talForm');
  if (!thumbs || !form) return;

  var host = thumbs.closest('.ap-block') || thumbs.parentElement;
  if (!host) return;

  /* ── the panel ─────────────────────────────────────────────── */
  var panel = document.createElement('section');
  panel.className = 'apl';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Live preview of your comp card');
  panel.innerHTML =
    '<div class="apl-head">' +
      '<p class="apl-kick">Live · your card</p>' +
      '<p class="apl-say">Drag the handle. Left is the photo you just picked; right is what goes in your book.</p>' +
    '</div>' +
    '<div class="apl-body">' +
      '<div class="apl-stage">' +
        '<div class="apl-flip" id="aplFlip">' +
          '<div class="apl-card apl-face apl-front">' +
            '<div class="apl-card-top"><b>YKS</b><span>Talent Portfolio</span></div>' +
            '<div class="apl-wipe" id="aplWipe">' +
              '<img class="apl-img apl-img-after" alt="" />' +
              '<div class="apl-clip"><img class="apl-img apl-img-before" alt="" /></div>' +
              '<span class="apl-tag apl-tag-l">Phone</span>' +
              '<span class="apl-tag apl-tag-r">Your book</span>' +
              '<span class="apl-handle" id="aplHandle" role="slider" tabindex="0" aria-label="Compare original and graded" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><i></i></span>' +
            '</div>' +
            '<div class="apl-card-disc" id="aplDisc">FASHION · EDITORIAL</div>' +
            '<div class="apl-card-name" id="aplName">Your Name</div>' +
            '<div class="apl-card-ed">EDITION 2026 · YKS</div>' +
          '</div>' +
          '<div class="apl-card apl-face apl-back">' +
            '<div class="apl-card-top"><b>YKS</b><span class="apl-code" id="aplCode">M—</span></div>' +
            '<p class="apl-back-lbl">Measurements</p>' +
            '<dl class="apl-stats" id="aplStats"></dl>' +
            '<p class="apl-back-note">This is the side a client sees. Your roster code, your measurements and your work — never your name, never your number. Every booking comes through me.</p>' +
            '<div class="apl-card-ed">EDITION 2026 · YKS</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="apl-flipbtn" id="aplFlipBtn" aria-pressed="false">Turn the card over →</button>' +
      '</div>' +
      '<div class="apl-side">' +
        '<p class="apl-lbl">The grade</p>' +
        '<div class="apl-looks" id="aplLooks"></div>' +
        '<p class="apl-note">One grade runs across every photo in your book. It is the difference between a portfolio and a camera roll — and it is the thing casting notices first.</p>' +
        '<div class="apl-strength">' +
          '<p class="apl-lbl">Your book so far</p>' +
          '<div class="apl-meter"><span id="aplMeterFill"></span></div>' +
          '<p class="apl-verdict" id="aplVerdict" role="status" aria-live="polite"></p>' +
        '</div>' +
        '<div class="apl-share">' +
          '<button type="button" class="apl-story" id="aplStory">↓ Save as an Instagram story</button>' +
          '<p class="apl-fine" id="aplStoryNote">Yours to post, free. It carries YKS branding and nothing that identifies you beyond the name you typed.</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  host.appendChild(panel);

  var wipe    = panel.querySelector('#aplWipe'),
      handle  = panel.querySelector('#aplHandle'),
      clip    = panel.querySelector('.apl-clip'),
      imgA    = panel.querySelector('.apl-img-after'),
      imgB    = panel.querySelector('.apl-img-before'),
      looksEl = panel.querySelector('#aplLooks'),
      nameEl  = panel.querySelector('#aplName'),
      discEl  = panel.querySelector('#aplDisc'),
      codeEl  = panel.querySelector('#aplCode'),
      statsEl = panel.querySelector('#aplStats'),
      flipEl  = panel.querySelector('#aplFlip'),
      flipBtn = panel.querySelector('#aplFlipBtn'),
      meterEl = panel.querySelector('#aplMeterFill'),
      verdict = panel.querySelector('#aplVerdict'),
      storyBtn= panel.querySelector('#aplStory'),
      storyNote = panel.querySelector('#aplStoryNote');

  /* ── grade swatches ────────────────────────────────────────── */
  var look = DEFAULT_LOOK;
  LOOKS.forEach(function (L, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'apl-look' + (i === look ? ' is-on' : '');
    b.textContent = L.label;
    b.addEventListener('click', function () {
      look = i;
      imgA.style.filter = L.css === 'none' ? '' : L.css;
      [].forEach.call(looksEl.children, function (c, k) { c.classList.toggle('is-on', k === i); });
    });
    looksEl.appendChild(b);
  });

  /* ── the wipe ──────────────────────────────────────────────── */
  var pos = 50, dragging = false;
  function setPos(p) {
    pos = Math.max(0, Math.min(100, p));
    clip.style.width = pos + '%';
    handle.style.left = pos + '%';
    handle.setAttribute('aria-valuenow', Math.round(pos));
  }
  function fromEvent(e) {
    var r = wipe.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setPos((x / r.width) * 100);
  }
  function down(e) { dragging = true; fromEvent(e); e.preventDefault(); }
  function move(e) { if (dragging) fromEvent(e); }
  function up() { dragging = false; }
  wipe.addEventListener('mousedown', down);
  wipe.addEventListener('touchstart', down, { passive: false });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('mouseup', up);
  window.addEventListener('touchend', up);
  handle.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { setPos(pos - 4); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPos(pos + 4); e.preventDefault(); }
  });

  /* ── the turn ──────────────────────────────────────────────── */
  var flipped = false;
  flipBtn.addEventListener('click', function () {
    flipped = !flipped;
    flipEl.classList.toggle('is-back', flipped);
    flipBtn.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    flipBtn.textContent = flipped ? '← Back to the cover' : 'Turn the card over →';
  });

  /* ── mirror the form into the card ─────────────────────────── */
  function paintName() {
    var v = (form.name && form.name.value || '').trim();
    nameEl.textContent = v || 'Your Name';
    nameEl.classList.toggle('is-placeholder', !v);
  }
  function paintDisc() {
    var cat = form.category && form.category.value, city = (form.city && form.city.value || '').trim();
    var parts = [];
    if (cat) parts.push(String(cat).toUpperCase());
    if (city) parts.push(city.toUpperCase());
    discEl.textContent = parts.length ? parts.join(' · ') : 'FASHION · EDITORIAL';
    /* The roster code is shown as a format, not a number. Inventing one would
       be a lie, and a real one would advertise how small the roster is. The
       letter is the honest part, and the promise is the point. */
    codeEl.textContent = (CAT_LETTER[String(form.category && form.category.value || '').toLowerCase()] || 'M') + '—';
  }
  function paintStats() {
    statsEl.innerHTML = '';
    STATS.forEach(function (st) {
      var el = form[st[0]], v = el ? (el.value || '').trim() : '';
      var dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = st[1];
      dd.textContent = v || '—';
      if (v) dd.className = 'is-set';
      statsEl.appendChild(dt); statsEl.appendChild(dd);
    });
  }
  ['name', 'city'].forEach(function (n) {
    if (form[n]) form[n].addEventListener('input', n === 'name' ? paintName : paintDisc);
  });
  if (form.category) form.category.addEventListener('change', paintDisc);
  STATS.forEach(function (st) { if (form[st[0]]) form[st[0]].addEventListener('input', paintStats); });

  /* ── how the book is shaping up ─────────────────────────────
     Not a score out of ten — a casting desk reading her book back to
     her. "You have no full-length yet" is worth more than a number,
     and it gets the missing shot uploaded rather than guessed at. */
  function paintStrength() {
    var figs = thumbs.querySelectorAll('.ap-thumb'), n = figs.length;
    var have = {};
    [].forEach.call(figs, function (f) {
      var sel = f.querySelector('.ap-thumb-cat');
      var v = sel && sel.value ? String(sel.value) : '';
      if (v) have[v.toLowerCase().replace(/[^a-z]/g, '')] = 1;
    });
    var missing = ESSENTIAL.filter(function (e) { return !have[e.k]; });

    var pct = Math.max(5, Math.min(100, Math.round((n / TARGET) * 100)));
    meterEl.style.width = pct + '%';
    meterEl.className = (n >= 6 && !missing.length) ? 'is-good' : n >= 3 ? 'is-mid' : '';

    var msg;
    if (!n) msg = '';
    else if (n < 3) msg = n + (n === 1 ? ' photo' : ' photos') + ' so far. Six to ten is where a book starts to hold up.';
    else if (missing.length) msg = n + ' photos — but no ' + missing.map(function (m) {
      return m.say.replace(/^an? /, '');
    }).join(' and no ') + ' yet. Casting asks for those first.';
    else if (n < 6) msg = n + ' photos and the range is right. A couple more and this is a proper book.';
    else msg = n + ' photos, with a headshot, a full-length and digitals. That is a book a casting director can work from.';
    verdict.textContent = msg;
  }

  /* ── story export ──────────────────────────────────────────── */
  var W = 1080, H = 1920;
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  storyBtn.addEventListener('click', function () {
    if (!imgA.src) return;
    var orig = storyBtn.textContent;
    storyBtn.disabled = true; storyBtn.textContent = 'Building…';
    var img = new Image();
    img.onload = function () {
      try { draw(img); } catch (e) { fail(); }
    };
    img.onerror = fail;
    img.src = imgA.src;

    function fail() {
      storyBtn.disabled = false; storyBtn.textContent = orig;
      storyNote.textContent = 'Couldn’t build it just now — your full PDF further down still works.';
    }

    function draw(im) {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');

      // ground
      var g = x.createLinearGradient(0, 0, W * .4, H);
      g.addColorStop(0, '#16121d'); g.addColorStop(1, '#07060a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var warm = x.createRadialGradient(W * .8, H * .12, 0, W * .8, H * .12, W * 1.05);
      warm.addColorStop(0, 'rgba(255,140,59,.20)'); warm.addColorStop(1, 'rgba(255,140,59,0)');
      x.fillStyle = warm; x.fillRect(0, 0, W, H);

      // the plate — centre-cropped to 4:5, carrying the chosen grade
      var pad = 96, pw = W - pad * 2, ph = Math.round(pw * 1.25), py = 372;
      var ar = im.width / im.height, want = pw / ph, sx = 0, sy = 0, sw = im.width, sh = im.height;
      if (ar > want) { sw = im.height * want; sx = (im.width - sw) / 2; }
      else { sh = im.width / want; sy = (im.height - sh) / 2; }
      x.save();
      roundRect(x, pad, py, pw, ph, 6); x.clip();
      if (LOOKS[look].css !== 'none') x.filter = LOOKS[look].css;
      x.drawImage(im, sx, sy, sw, sh, pad, py, pw, ph);
      x.restore();
      x.filter = 'none';
      x.strokeStyle = 'rgba(244,237,226,.16)'; x.lineWidth = 2;
      roundRect(x, pad, py, pw, ph, 6); x.stroke();

      // masthead
      x.fillStyle = '#f4ede2';
      x.font = '600 74px "Bodoni Moda", Georgia, serif';
      x.textBaseline = 'alphabetic';
      x.fillText('YKS', pad, 216);
      x.fillStyle = 'rgba(244,237,226,.5)';
      x.font = '500 24px "Space Grotesk", Inter, sans-serif';
      x.fillText('T A L E N T   P O R T F O L I O', pad + 6, 262);

      // discipline + name
      var dy = py + ph + 96;
      x.fillStyle = '#ff8c3b';
      x.font = '600 26px "Space Grotesk", Inter, sans-serif';
      x.fillText((discEl.textContent || '').slice(0, 42), pad, dy);
      x.fillStyle = '#f4ede2';
      var nm = (nameEl.classList.contains('is-placeholder') ? '' : nameEl.textContent) || 'Your Name';
      var size = nm.length > 16 ? 84 : 108;
      x.font = '600 ' + size + 'px "Bodoni Moda", Georgia, serif';
      x.fillText(nm.slice(0, 26), pad, dy + size + 14);

      // rule + footer
      var fy = dy + size + 92;
      x.strokeStyle = 'rgba(244,237,226,.18)'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(pad, fy); x.lineTo(W - pad, fy); x.stroke();
      x.fillStyle = 'rgba(244,237,226,.55)';
      x.font = '500 24px "Space Grotesk", Inter, sans-serif';
      x.fillText('EDITION 2026 · YKS PRODUCTIONS', pad, fy + 48);
      x.fillStyle = 'rgba(244,237,226,.38)';
      x.font = '400 22px Inter, sans-serif';
      x.fillText('yksproductions.com', pad, fy + 88);

      c.toBlob(function (blob) {
        if (!blob) return fail();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (nm.replace(/[^A-Za-z0-9]+/g, '-') || 'YKS') + '-story.jpg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        storyBtn.disabled = false; storyBtn.textContent = '↓ Saved — build another';
        storyNote.textContent = 'Saved to your device. Post it and tag @yks_photoworks if you like it.';
        setTimeout(function () { storyBtn.textContent = orig; }, 6000);
      }, 'image/jpeg', 0.92);
    }
  });

  /* ── watch for what talent-apply.js renders ────────────────── */
  var shown = false, current = '';
  function firstSrc() {
    var i = thumbs.querySelector('.ap-thumb img');
    return i && i.getAttribute('src') ? i.src : '';
  }
  function sync() {
    var src = firstSrc();
    paintStrength();
    if (!src) {
      if (shown) { panel.hidden = true; panel.classList.remove('is-in'); shown = false; current = ''; }
      return;
    }
    if (src === current) return;
    current = src;
    imgA.src = src;
    imgB.src = src;
    imgA.style.filter = LOOKS[look].css === 'none' ? '' : LOOKS[look].css;
    if (!shown) {
      shown = true;
      panel.hidden = false;
      paintName(); paintDisc(); paintStats(); setPos(50);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { panel.classList.add('is-in'); });
      });
    }
  }

  thumbs.addEventListener('change', paintStrength);   // re-tagging a shot changes the read
  new MutationObserver(sync).observe(thumbs, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'value'] });
  sync();
})();
