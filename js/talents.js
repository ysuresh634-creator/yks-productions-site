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
  var state = { cat: 'all', region: 'all' };
  var empty = $('#talEmpty');
  function doFilter() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (state.cat === 'all' || c.dataset.cat === state.cat) &&
               (state.region === 'all' || c.dataset.region === state.region);
      c.hidden = !ok;
      if (ok) { c.classList.add('in'); shown++; }
    });
    if (empty) empty.hidden = shown > 0;
  }
  function applyFilter() {
    if (reduced) { doFilter(); return; }
    grid.classList.add('tal-refreshing');
    setTimeout(function () { doFilter(); grid.classList.remove('tal-refreshing'); }, 170);
  }
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
