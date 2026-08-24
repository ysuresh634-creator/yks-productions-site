/* Talents at YKS — apply form (runs on both the roster page and the standalone
   /talents/apply page) + roster filters, counts and profile links.
   No talent contact/handle/link is ever rendered: every booking route goes to YKS. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── apply form → Web3Forms — present on the roster page AND the standalone apply page ── */
  var form = $('#talForm');
  if (form) {
    var KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var file = form.querySelector('input[type="file"]');
      if (file && file.files[0] && file.files[0].size > 5 * 1024 * 1024) {
        alert('That file is over 5 MB. Please submit without it and WhatsApp the portfolio to YKS instead.');
        return;
      }
      var sbtn = form.querySelector('button[type="submit"]');
      var orig = sbtn.textContent; sbtn.textContent = 'Sending…'; sbtn.disabled = true;
      var fd = new FormData(form);
      fd.append('access_key', KEY);
      fd.append('subject', form.dataset.subject || 'New talent application — YKS Talents');
      fd.append('from_name', 'YKS Talents application');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.success) {
            form.style.display = 'none';
            var ok = $('#talOk'); if (ok) ok.style.display = 'block';
            if (window.gtag) gtag('event', 'talent_apply');
          } else { sbtn.textContent = orig; sbtn.disabled = false; alert('Something went wrong — please try again or WhatsApp your details.'); }
        })
        .catch(function () { sbtn.textContent = orig; sbtn.disabled = false; alert('Network error — please try again or WhatsApp your details.'); });
    });
  }

  /* ── roster: everything below runs only on the page that has the grid ── */
  var grid = $('#talGrid');
  if (!grid) return;
  var cards = $$('.tal', grid);

  /* YKS booking numbers — India vs UAE talent */
  var WA = { india: '919746679720', uae: '971501955122' };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var byCat = function (k) { return cards.filter(function (c) { return c.dataset.cat === k; }).length; };
  var byRegion = function (k) { return cards.filter(function (c) { return c.dataset.region === k; }).length; };

  /* editorial index — static, zero-padded; a category with no talent is dropped from the line */
  function setCount(el, target) {
    if (!el) return;
    el.textContent = target < 10 ? '0' + target : String(target);
    if (target === 0) {
      var span = el.closest('span');
      if (span) { span.hidden = true;
        var sep = span.nextElementSibling;
        if (sep && sep.tagName === 'I') sep.hidden = true;
      }
    }
  }
  setCount($('[data-count-models]'), byCat('model'));
  setCount($('[data-count-influencers]'), byCat('influencer'));
  setCount($('[data-count-actors]'), byCat('actor'));

  /* sparse roster: hide the filter bar until there's enough to filter, and drop
     any category / region chip that currently has no talent behind it */
  var filterBar = $('.tal-filters');
  if (filterBar) {
    if (cards.length <= 1) { filterBar.style.display = 'none'; }
    else {
      $$('.tal-chip', filterBar).forEach(function (chip) {
        var v = chip.dataset.val; if (v === 'all') return;
        var n = (chip.closest('.tal-fgroup').dataset.filter === 'region') ? byRegion(v) : byCat(v);
        if (n === 0) chip.style.display = 'none';
      });
    }
  }

  /* reveal cards on scroll */
  grid.classList.add('js-reveal');
  if (reduced) { cards.forEach(function (c) { c.classList.add('in'); }); }
  else {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function (c) { revIO.observe(c); });
  }

  /* filters */
  var state = { cat: 'all', region: 'all', q: '', aiCodes: null };
  var ENGINE = 'https://yks-talents-engine.ysuresh634.workers.dev';
  // build one searchable string per card from the data it already carries (never contacts)
  cards.forEach(function (c) {
    var d = c.dataset;
    c._hay = [d.city, d.tags, d.cat, d.region, (c.querySelector('.tal-name') || {}).textContent || '']
      .join(' ').toLowerCase();
  });
  var empty = $('#talEmpty');
  function doFilter() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (state.cat === 'all' || c.dataset.cat === state.cat) &&
               (state.region === 'all' || c.dataset.region === state.region) &&
               (!state.q || (state.aiCodes ? state.aiCodes.indexOf(c.dataset.code) >= 0
                                            : state.q.split(/\s+/).every(function (w) { return c._hay.indexOf(w) >= 0; })));
      c.hidden = !ok;
      if (ok) { c.classList.add('in'); shown++; }
    });
    if (empty) empty.hidden = shown > 0;
    var cnt = $('#talSearchCount');
    if (cnt) {
      if (state.q) { cnt.hidden = false; cnt.textContent = shown ? shown + ' match' + (shown > 1 ? 'es' : '') : 'No match'; }
      else cnt.hidden = true;
    }
  }
  function applyFilter() {
    if (reduced) { doFilter(); return; }
    grid.classList.add('tal-refreshing');
    setTimeout(function () { doFilter(); grid.classList.remove('tal-refreshing'); }, 170);
  }
  (function wireSearch() {
    var box = $('#talSearch'), clr = $('#talSearchX'), cnt = $('#talSearchCount'); if (!box) return;
    var t = null, seq = 0;
    // only the non-identifying card data is ever sent — names stay in the roster
    function payload() {
      return cards.map(function (c) {
        return { code: c.dataset.code, type: c.dataset.cat, region: c.dataset.region, city: c.dataset.city, tags: c.dataset.tags };
      });
    }
    function askAI(q, mine) {
      if (cnt) { cnt.hidden = false; cnt.textContent = '✨ Thinking…'; }
      fetch(ENGINE + '/ai/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: q, cards: payload() }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (mine !== seq) return;                       // a newer keystroke already won
          state.aiCodes = (j && j.codes && j.codes.length) ? j.codes : null;
          doFilter();
          if (cnt && state.aiCodes) cnt.textContent = state.aiCodes.length + ' AI match' + (state.aiCodes.length > 1 ? 'es' : '');
        })
        .catch(function () { if (mine === seq) doFilter(); });
    }
    function run() {
      state.q = (box.value || '').trim().toLowerCase();
      state.aiCodes = null;
      if (clr) clr.hidden = !state.q;
      doFilter();
      if (!state.q) return;
      var shown = cards.filter(function (c) { return !c.hidden; }).length;
      // hand it to the engine when the words don't match literally, or when they've typed a real sentence
      if (shown === 0 || state.q.split(/\s+/).length >= 3) askAI(box.value.trim(), ++seq);
    }
    box.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 260); });
    box.addEventListener('search', run);
    if (clr) clr.addEventListener('click', function () { box.value = ''; run(); box.focus(); });
  })();
  $$('.tal-fgroup').forEach(function (group) {
    var key = group.dataset.filter;
    group.addEventListener('click', function (e) {
      var chip = e.target.closest('.tal-chip'); if (!chip) return;
      $$('.tal-chip', group).forEach(function (b) { b.classList.remove('on'); });
      chip.classList.add('on');
      state[key] = chip.dataset.val;
      applyFilter();
    });
  });

  /* profile modal — retained for any button-cards; link-cards go to the full profile page */
  var modal = $('#talModal');
  if (modal) {
    var mGallery = $('#talModalGallery'), mCat = $('#talModalCat'), mName = $('#talModalName'),
        mCity = $('#talModalCity'), mBio = $('#talModalBio'), mTags = $('#talModalTags'),
        mBook = $('#talModalBook'), mStats = $('#talModalStats');
    var CAT_LABEL = { model: 'Model', influencer: 'Influencer / Creator', actor: 'Actor' };

    /* Names are not in the markup — talent-names.js fetches them from a
       robots-blocked file so no name reaches a search index. Until (or
       unless) that lands, the roster code stands in. */
    var tname = function (d) {
      var m = window.YKS_TNAMES && window.YKS_TNAMES[d.code];
      return (m && m.name) || ((CAT_LABEL[d.cat] || 'Talent') + ' ' + String(d.code || '').toUpperCase());
    };

    var openModal = function (card) {
      var d = card.dataset;
      mCat.textContent = CAT_LABEL[d.cat] || d.cat;
      var who = tname(d);
      mName.textContent = who;
      mCity.textContent = d.city || '';
      if (mStats) {
        mStats.innerHTML = '';
        var pairs = (d.stats || '').split('|').filter(Boolean);
        pairs.forEach(function (p) {
          var i = p.indexOf(':'); if (i < 0) return;
          var cell = document.createElement('span'); cell.className = 'tal-stat';
          var k = document.createElement('small'); k.textContent = p.slice(0, i).trim();
          var v = document.createElement('b'); v.textContent = p.slice(i + 1).trim();
          cell.appendChild(k); cell.appendChild(v); mStats.appendChild(cell);
        });
        mStats.hidden = pairs.length === 0;
      }
      mBio.textContent = d.bio || '';
      mTags.textContent = d.tags || '';
      mGallery.innerHTML = '';
      (d.gallery || '').split('|').filter(Boolean).forEach(function (src) {
        var img = new Image(); img.src = src; img.alt = (CAT_LABEL[d.cat] || 'Talent') + ' · ' + (d.city || '') + ' — YKS Talents roster';
        img.loading = 'lazy'; mGallery.appendChild(img);
      });
      var num = WA[d.region] || WA.india;
      var msg = 'Hi Yedukrishna, I\'d like to book ' + who + ' (' + (CAT_LABEL[d.cat] || d.cat) +
                (d.city ? ', ' + d.city : '') + ') from your talent pool. Are they available?';
      mBook.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
      mBook.textContent = 'Enquire to book ' + who + ' →';
      modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      if (window.gtag) gtag('event', 'talent_open', { talent: d.code, category: d.cat });
    };
    var closeModal = function () {
      modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      mGallery.scrollTop = 0;
    };
    cards.forEach(function (card) {
      var btn = $('.tal-open', card);
      if (btn && btn.tagName !== 'A') btn.addEventListener('click', function () { openModal(card); });
    });
    $('#talModalX').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('on')) closeModal(); });
  }
})();

/* ══ Client shortlist — tick the faces you want, then share or send the set.
      The list lives in the URL (?list=m01,a02) so a client can paste it to their team
      with no account and no login, and it survives a reload via localStorage. ══ */
(function () {
  var grid = document.getElementById('talGrid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.tal'));
  if (!cards.length) return;
  var KEY = 'yks_shortlist', WA = '919746679720';
  var picked = [];
  try { picked = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { picked = []; }

  // a shared link wins over whatever was saved on this device
  var shared = (new URLSearchParams(location.search).get('list') || '').split(',').filter(Boolean);
  var viewingShared = shared.length > 0;
  if (viewingShared) picked = shared.slice(0, 40);

  function save() { try { localStorage.setItem(KEY, JSON.stringify(picked)); } catch (e) {} }
  function has(code) { return picked.indexOf(code) >= 0; }
  function shareURL() { return location.origin + location.pathname + '?list=' + picked.join(','); }

  /* ── the bar that appears once something is picked ── */
  var bar = document.createElement('div');
  bar.className = 'tal-shortlist';
  bar.innerHTML =
    '<span class="tal-sl-count"></span>' +
    '<div class="tal-sl-actions">' +
      '<button type="button" class="tal-sl-btn" data-act="compare">Compare &amp; hold</button>' +
      '<button type="button" class="tal-sl-btn" data-act="pdf">↓ Lookbook</button>' +
      '<button type="button" class="tal-sl-btn" data-act="copy">Copy share link</button>' +
      '<a class="tal-sl-btn tal-sl-go" data-act="send" target="_blank" rel="noopener">Send to YKS →</a>' +
      '<button type="button" class="tal-sl-btn tal-sl-clear" data-act="clear" aria-label="Clear shortlist">Clear</button>' +
    '</div>';
  document.body.appendChild(bar);

  function render() {
    cards.forEach(function (c) {
      var btn = c.querySelector('.tal-pick');
      if (btn) {
        var on = has(c.dataset.code);
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = on ? 'Remove from shortlist' : 'Add to shortlist';
        btn.textContent = on ? '✓' : '+';
      }
    });
    var n = picked.length;
    bar.classList.toggle('on', n > 0);
    bar.querySelector('.tal-sl-count').textContent = n
      ? n + ' shortlisted' + (viewingShared ? ' · shared list' : '')
      : '';
    var msg = 'Hi Yedukrishna, I\'d like to enquire about these talents from your roster: '
      + picked.map(function (c) { return c.toUpperCase(); }).join(', ')
      + '. Here\'s the shortlist: ' + shareURL();
    bar.querySelector('.tal-sl-go').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }

  // a pick button on every card
  cards.forEach(function (c) {
    if (c.querySelector('.tal-pick')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tal-pick'; b.textContent = '+';
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var code = c.dataset.code;
      if (has(code)) picked = picked.filter(function (x) { return x !== code; });
      else picked.push(code);
      viewingShared = false;
      save(); render();
    });
    c.appendChild(b);
  });

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'clear') { picked = []; viewingShared = false; save(); render(); showOnly(null); }
    if (act === 'compare') {
      if (picked.length && typeof window.openCompare === 'function') window.openCompare(picked.slice());
    }
    if (act === 'pdf') {
      if (!picked.length || typeof window.buildShortlistPDF !== 'function') return;
      var lbl = b.textContent; b.disabled = true; b.textContent = 'Building…';
      window.buildShortlistPDF(picked.slice())
        .then(function () { b.textContent = 'Saved ✓'; setTimeout(function () { b.disabled = false; b.textContent = lbl; }, 1800); })
        .catch(function () { b.textContent = 'Try again'; setTimeout(function () { b.disabled = false; b.textContent = lbl; }, 1800); });
    }
    if (act === 'copy') {
      var url = shareURL();
      var done = function () { var t = b.textContent; b.textContent = 'Link copied ✓'; setTimeout(function () { b.textContent = t; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
      else { window.prompt('Copy this shortlist link:', url); }
    }
  });

  // opening a shared link shows just those faces
  function showOnly(codes) {
    cards.forEach(function (c) { c.hidden = codes ? codes.indexOf(c.dataset.code) < 0 : false; });
  }
  if (viewingShared) { showOnly(picked); }

  render();
})();

/* ══ Casting plan — the client describes the shoot and gets a real plan back before giving
      any contact details. Value first: it is the client-side answer to the free portfolio
      we give talent. The engine refuses to quote a price or promise availability. ══ */
(function () {
  var box = document.getElementById('talPlanIn'), go = document.getElementById('talPlanGo'),
      out = document.getElementById('talPlanOut'), grid = document.getElementById('talGrid');
  if (!box || !go || !out) return;
  var ENGINE = 'https://yks-talents-engine.ysuresh634.workers.dev', WA = '919746679720';
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.tal')) : [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function payload() {
    return cards.map(function (c) {
      return { code: c.dataset.code, type: c.dataset.cat, region: c.dataset.region, city: c.dataset.city, tags: c.dataset.tags };
    });
  }
  function ul(items) { return items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join(''); }

  go.addEventListener('click', function () {
    var brief = (box.value || '').trim();
    if (!brief) { box.focus(); return; }
    var orig = go.textContent; go.disabled = true; go.textContent = '✨ Working on it…';
    out.hidden = false;
    out.innerHTML = '<p class="tal-plan-wait">Reading your brief…</p>';
    var done = false, to = setTimeout(function () { if (!done) { done = true; go.disabled = false; go.textContent = orig; out.innerHTML = '<p class="tal-plan-wait">That took too long — try again, or just send the brief and I\'ll reply myself.</p>'; } }, 30000);
    fetch(ENGINE + '/ai/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: brief, cards: payload() }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (done) return; done = true; clearTimeout(to);
        go.disabled = false; go.textContent = orig;
        var p = j && j.plan;
        if (!p) { out.innerHTML = '<p class="tal-plan-wait">Couldn\'t read that one — send it to me directly and I\'ll come back myself.</p>'; return; }
        var waMsg = 'Hi Yedukrishna, here\'s my shoot: ' + brief
          + (p.codes && p.codes.length ? '\n\nFrom your roster I\'m interested in: ' + p.codes.join(', ').toUpperCase() : '');
        var html = '<div class="tal-plan-card">';
        if (p.read) html += '<p class="tal-plan-read">' + esc(p.read) + (p.faces ? ' <span>· usually ' + esc(p.faces) + '</span>' : '') + '</p>';
        html += '<div class="tal-plan-cols">';
        if (p.looks && p.looks.length) html += '<div><h4>Looks it usually covers</h4><ul>' + ul(p.looks) + '</ul></div>';
        if (p.prep && p.prep.length) html += '<div><h4>Worth sorting first</h4><ul>' + ul(p.prep) + '</ul></div>';
        if (p.questions && p.questions.length) html += '<div><h4>What I\'d need to know</h4><ul>' + ul(p.questions) + '</ul></div>';
        html += '</div>';
        html += '<div class="tal-plan-actions">'
             +  '<a class="tal-plan-send" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(waMsg) + '">Send this brief to YKS →</a>'
             +  (p.codes && p.codes.length ? '<button type="button" class="tal-plan-show" data-codes="' + esc(p.codes.join(',')) + '">Show the ' + p.codes.length + ' who fit</button>' : '')
             +  '</div>';
        html += '<p class="tal-plan-note">A plan, not a quote — I\'ll confirm availability and come back with one all-in number.</p>';
        html += '</div>';
        out.innerHTML = html;
        var show = out.querySelector('.tal-plan-show');
        if (show) show.addEventListener('click', function () {
          var codes = show.dataset.codes.split(',');
          cards.forEach(function (c) { c.hidden = codes.indexOf(c.dataset.code) < 0; });
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      })
      .catch(function () {
        if (done) return; done = true; clearTimeout(to);
        go.disabled = false; go.textContent = orig;
        out.innerHTML = '<p class="tal-plan-wait">Couldn\'t reach the planner — send me the brief directly and I\'ll reply myself.</p>';
      });
  });
})();

/* ══ Shortlist lookbook — the client's shortlist as a YKS-branded PDF they can send to their
      team. This is the point of the shortlist: it makes the CLIENT look organised to their
      boss, and every page carries YKS's mark and booking route.
      Talent are identified by roster CODE, never by name — a PDF travels by email, and names
      stay on the roster where a human has to be looking at the site to see them. ══ */
(function () {
  var grid = document.getElementById('talGrid');
  if (!grid) return;

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
  // same-origin images, so the canvas stays clean
  function loadImg(src) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src;
    });
  }
  function toJpeg(im, maxW) {
    var sc = Math.min(1, maxW / im.naturalWidth);
    var c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return { data: c.toDataURL('image/jpeg', 0.86), w: c.width, h: c.height };
  }

  window.buildShortlistPDF = function (codes) {
    var cards = codes.map(function (code) {
      return grid.querySelector('.tal[data-code="' + code + '"]');
    }).filter(Boolean);
    if (!cards.length) return Promise.reject(new Error('empty'));

    return ensureJsPDF().then(function (JsPDF) {
      var jobs = cards.map(function (c) {
        var first = (c.dataset.gallery || '').split('|')[0];
        return loadImg(first).then(function (im) { return { card: c, img: toJpeg(im, 1100) }; })
                             .catch(function () { return { card: c, img: null }; });
      });
      return Promise.all(jobs).then(function (items) {
        var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
        var W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
        var NIGHT = [12, 10, 16], PAPER = [255, 255, 255], INK = [20, 20, 22], INKSUB = [140, 138, 134],
            LIGHT = [244, 240, 232], MUTE = [196, 190, 180], GOLD = [184, 145, 47];
        var HF = 'helvetica', LG = 'times';
        function ct(c) { doc.setTextColor.apply(doc, c); }
        function bg(c) { doc.setFillColor.apply(doc, c); doc.rect(0, 0, W, H, 'F'); }
        function tk(t, x, y, sz, c, o) {
          o = o || {}; doc.setFont(HF, o.bold ? 'bold' : 'normal'); doc.setFontSize(sz); ct(c);
          var s = o.upper === false ? String(t) : String(t).toUpperCase(), ls = o.ls == null ? 1.3 : o.ls;
          if (o.align === 'right') x -= doc.getTextWidth(s) + Math.max(0, s.length - 1) * ls;
          doc.text(s, x, y, { charSpace: ls });
        }
        function hair(x1, y, x2, c, w) { doc.setDrawColor.apply(doc, c); doc.setLineWidth(w || 0.8); doc.line(x1, y, x2, y); }
        function logoBox(x, y, w, c) {
          var h = w * 0.6, cx = x + w / 2;
          doc.setDrawColor.apply(doc, c); doc.setLineWidth(0.9); doc.rect(x, y, w, h);
          doc.setFont(LG, 'normal'); ct(c); doc.setFontSize(w * 0.285);
          doc.text('YKS', cx, y + h * 0.5, { align: 'center', charSpace: 1 });
          var py = y + h * 0.8, word = 'PRODUCTIONS', ws = 1.3;
          doc.setFont(HF, 'normal'); doc.setFontSize(w * 0.064);
          var tw = doc.getTextWidth(word) + (word.length - 1) * ws;
          doc.text(word, cx, py, { align: 'center', charSpace: ws });
          doc.setLineWidth(0.5);
          var g = w * 0.05, dsh = w * 0.085;
          doc.line(cx - tw / 2 - g - dsh, py - 2.5, cx - tw / 2 - g, py - 2.5);
          doc.line(cx + tw / 2 + g, py - 2.5, cx + tw / 2 + g + dsh, py - 2.5);
        }
        function cover(im, x, y, bw, bh) {
          var s = Math.max(bw / im.w, bh / im.h), w = im.w * s, h = im.h * s;
          doc.saveGraphicsState(); doc.rect(x, y, bw, bh, null); doc.clip(); doc.discardPath();
          doc.addImage(im.data, 'JPEG', x + (bw - w) / 2, y + (bh - h) / 2, w, h);
          doc.restoreGraphicsState();
        }
        var today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        /* ── cover ── */
        bg(NIGHT);
        logoBox(M, 60, 118, LIGHT);
        tk('CASTING SHORTLIST', M, 300, 9, GOLD, { bold: true, ls: 3 });
        doc.setFont(HF, 'bold'); doc.setFontSize(44); ct(LIGHT);
        doc.text(String(items.length), M, 372);
        doc.setFontSize(30);
        doc.text(items.length > 1 ? 'faces, shortlisted' : 'face, shortlisted', M, 410);
        hair(M, 440, W - M, GOLD, 0.9);
        tk(today, M, 466, 9, MUTE, { ls: 2 });
        tk('PREPARED BY YKS PRODUCTIONS', M, 486, 9, MUTE, { ls: 2 });
        doc.setFont(HF, 'normal'); doc.setFontSize(10.5); ct(MUTE);
        doc.text(doc.splitTextToSize('Every face here is booked through YKS. Reply with the codes you want and I’ll confirm availability and come back with one all-in number.', CW * 0.72), M, H - 150, { lineHeightFactor: 1.5 });
        tk('+91 97466 79720   ·   YKSPRODUCTIONS893@GMAIL.COM', M, H - 60, 8, GOLD, { ls: 1.4 });

        /* ── one page per face ── */
        items.forEach(function (it, i) {
          var c = it.card, code = (c.dataset.code || '').toUpperCase();
          doc.addPage(); bg(PAPER);
          tk('CASTING SHORTLIST', M, 60, 8, INK, { bold: true, ls: 1.5 });
          tk(String(i + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0'), W - M, 60, 8, INK, { bold: true, ls: 1.5, align: 'right' });
          hair(M, 72, W - M, INK, 1.1);
          var iw = 268, ih = iw / 0.8, ix = W - M - iw, iy = 104;
          if (it.img) cover(it.img, ix, iy, iw, ih);
          doc.setFont(HF, 'bold'); doc.setFontSize(34); ct(INK); doc.text(code, M, 150);
          tk((c.dataset.cat || 'talent') + '  ·  ' + (c.dataset.city || ''), M, 172, 9, INKSUB, { ls: 1.4 });
          var y = 212;
          tk('CASTABLE FOR', M, y, 9, INKSUB, { bold: true, ls: 2 }); y += 22;
          doc.setFont(HF, 'normal'); doc.setFontSize(10); ct(INK);
          doc.splitTextToSize((c.dataset.tags || '').replace(/\s*·\s*/g, ' · '), iw - 40).forEach(function (ln) { doc.text(ln, M, y); y += 15; });
          y += 26;
          var stats = (c.dataset.stats || '').split('|').filter(Boolean);
          if (stats.length) {
            tk('MEASUREMENTS', M, y, 9, INKSUB, { bold: true, ls: 2 }); y += 8;
            stats.slice(0, 9).forEach(function (row) {
              var p = row.split(':');
              y += 22; hair(M, y - 15, M + 210, INK, 0.5);
              tk(p[0] || '', M, y, 8, INKSUB, { ls: 1.2 });
              doc.setFont(HF, 'bold'); doc.setFontSize(9.5); ct(INK);
              doc.text((p[1] || '').trim(), M + 210, y, { align: 'right' });
            });
          }
          tk('BOOK THIS FACE — QUOTE ' + code, M, H - 96, 9, GOLD, { bold: true, ls: 1.6 });
          hair(M, H - 56, W - M, INK, 1.1);
          tk('+91 97466 79720', M, H - 40, 7.5, INKSUB, { ls: 1.1 });
          tk('YKSPRODUCTIONS893@GMAIL.COM', W - M, H - 40, 7.5, INKSUB, { ls: 1.1, align: 'right' });
        });

        doc.save('YKS-casting-shortlist.pdf');
        return true;
      });
    });
  };
})();

/* ══ Compare + hold — the two things a client actually does at the end.
      Compare puts the shortlisted faces side by side on the SAME stat rows, because that is
      the real decision. Hold is a deliberately small, reversible yes: much easier to say than
      "book", and honest — a hold is an enquiry with dates on it, never a confirmed booking. ══ */
(function () {
  var grid = document.getElementById('talGrid');
  if (!grid) return;
  var ENGINE = 'https://yks-talents-engine.ysuresh634.workers.dev', WA = '919746679720';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cardFor(code) { return grid.querySelector('.tal[data-code="' + code + '"]'); }
  function statsOf(c) {
    var o = {};
    (c.dataset.stats || '').split('|').filter(Boolean).forEach(function (r) {
      var i = r.indexOf(':'); if (i > 0) o[r.slice(0, i).trim()] = r.slice(i + 1).trim();
    });
    return o;
  }

  var panel = document.createElement('div');
  panel.className = 'tal-cmp'; panel.hidden = true;
  panel.innerHTML = '<div class="tal-cmp-box">' +
      '<div class="tal-cmp-head"><p>Side by side</p><button type="button" class="tal-cmp-x" aria-label="Close">&times;</button></div>' +
      '<div class="tal-cmp-scroll"><div class="tal-cmp-cols"></div></div>' +
      '<div class="tal-cmp-foot">' +
        '<div class="tal-hold">' +
          '<input type="text" class="tal-hold-dates" placeholder="Which dates? e.g. 12–13 Sep" />' +
          '<input type="text" class="tal-hold-who" placeholder="Your name" />' +
          '<input type="text" class="tal-hold-contact" placeholder="Phone or email" />' +
          '<button type="button" class="tal-hold-go">Hold these dates →</button>' +
        '</div>' +
        '<p class="tal-hold-note">A hold isn’t a booking — it tells me who and when, and I’ll come back to confirm availability and one all-in number. Nothing is charged and you can drop it any time.</p>' +
        '<p class="tal-hold-msg" hidden></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);

  var colsEl = panel.querySelector('.tal-cmp-cols'), msgEl = panel.querySelector('.tal-hold-msg');
  panel.querySelector('.tal-cmp-x').addEventListener('click', close);
  panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
  function close() { panel.hidden = true; document.documentElement.style.overflow = ''; }

  var current = [];
  window.openCompare = function (codes) {
    current = (codes || []).map(cardFor).filter(Boolean);
    if (!current.length) return;
    // every column shares the same rows, so the eye can scan across instead of hunting
    var labels = [];
    current.forEach(function (c) { Object.keys(statsOf(c)).forEach(function (k) { if (labels.indexOf(k) < 0) labels.push(k); }); });
    colsEl.innerHTML = current.map(function (c) {
      var st = statsOf(c), img = (c.dataset.gallery || '').split('|')[0];
      return '<div class="tal-cmp-col">' +
        '<div class="tal-cmp-media"><img src="' + esc(img) + '" alt="" loading="lazy" /></div>' +
        '<b class="tal-cmp-code">' + esc((c.dataset.code || '').toUpperCase()) + '</b>' +
        '<span class="tal-cmp-where">' + esc(c.dataset.cat || '') + ' · ' + esc(c.dataset.city || '') + '</span>' +
        '<span class="tal-cmp-tags">' + esc(c.dataset.tags || '') + '</span>' +
        '<dl class="tal-cmp-stats">' + labels.map(function (k) {
          return '<div><dt>' + esc(k) + '</dt><dd>' + (st[k] ? esc(st[k]) : '—') + '</dd></div>';
        }).join('') + '</dl>' +
      '</div>';
    }).join('');
    msgEl.hidden = true;
    panel.hidden = false;
    document.documentElement.style.overflow = 'hidden';
  };

  panel.querySelector('.tal-hold-go').addEventListener('click', function () {
    var btn = this;
    var dates = panel.querySelector('.tal-hold-dates').value.trim();
    var who = panel.querySelector('.tal-hold-who').value.trim();
    var contact = panel.querySelector('.tal-hold-contact').value.trim();
    var codes = current.map(function (c) { return (c.dataset.code || '').toUpperCase(); });
    if (!dates) { panel.querySelector('.tal-hold-dates').focus(); return; }
    if (!who || !contact) { panel.querySelector(who ? '.tal-hold-contact' : '.tal-hold-who').focus(); return; }
    var brief = 'HOLD REQUEST — ' + codes.join(', ') + '\nDates: ' + dates;
    var orig = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
    msgEl.hidden = false; msgEl.className = 'tal-hold-msg'; msgEl.textContent = 'Sending your hold…';
    fetch(ENGINE + '/bookings/new', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: who, client_contact: contact, brief: brief, shoot_dates: dates, city: (current[0] && current[0].dataset.city) || '' })
    }).then(function (r) { return r.json(); })
      .then(function (j) {
        btn.disabled = false; btn.textContent = orig;
        if (j && j.ok) {
          msgEl.className = 'tal-hold-msg ok';
          msgEl.innerHTML = '✓ Held. I’ve got ' + esc(codes.join(', ')) + ' down for ' + esc(dates) + ' and I’ll come back to confirm. ' +
            '<a target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' +
            encodeURIComponent('Hi Yedukrishna, I just put a hold on ' + codes.join(', ') + ' for ' + dates + '. — ' + who) + '">Tell me on WhatsApp too →</a>';
        } else { throw new Error('bad'); }
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = orig;
        msgEl.className = 'tal-hold-msg warn';
        msgEl.innerHTML = 'Couldn’t send that just now — <a target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' +
          encodeURIComponent('Hi Yedukrishna, I\'d like to hold ' + codes.join(', ') + ' for ' + dates + '. — ' + who) + '">send it on WhatsApp instead →</a>';
      });
  });
})();
