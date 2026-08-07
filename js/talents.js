/* Talents at YKS — filters, live counts, profile modal, apply form.
   No talent contact/handle/link is ever rendered: every booking route
   goes to YKS, who is the only point of contact. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var grid = $('#talGrid');
  if (!grid) return;
  var cards = $$('.tal', grid);

  /* YKS booking numbers — India vs UAE talent */
  var WA = { india: '919746679720', uae: '971501955122' };

  /* ── live stat counts in the hero (animated count-up) ── */
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el, target) {
    if (!el) return;
    if (reduced || target === 0) { el.textContent = target; return; }
    var t0 = null;
    function step(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 900);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var byCat = function (k) { return cards.filter(function (c) { return c.dataset.cat === k; }).length; };
  countUp($('[data-count-models]'), byCat('model'));
  countUp($('[data-count-influencers]'), byCat('influencer'));
  countUp($('[data-count-actors]'), byCat('actor'));

  /* ── reveal cards on scroll (progressive: only hide once JS is running) ── */
  grid.classList.add('js-reveal');
  if (reduced) { cards.forEach(function (c) { c.classList.add('in'); }); }
  else {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function (c) { revIO.observe(c); });
  }

  /* ── filters ── */
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
    grid.classList.add('tal-refreshing');      // fade the grid down…
    setTimeout(function () { doFilter(); grid.classList.remove('tal-refreshing'); }, 170); // …swap, fade back up
  }
  $$('.tal-fgroup').forEach(function (group) {
    var key = group.dataset.filter;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.tal-chip'); if (!btn) return;
      $$('.tal-chip', group).forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      state[key] = btn.dataset.val;
      applyFilter();
    });
  });

  /* ── profile modal ── */
  var modal = $('#talModal');
  var mGallery = $('#talModalGallery'), mCat = $('#talModalCat'), mName = $('#talModalName'),
      mCity = $('#talModalCity'), mBio = $('#talModalBio'), mTags = $('#talModalTags'), mBook = $('#talModalBook');
  var CAT_LABEL = { model: 'Model', influencer: 'Influencer / Creator', actor: 'Actor' };

  function openModal(card) {
    var d = card.dataset;
    mCat.textContent = CAT_LABEL[d.cat] || d.cat;
    mName.textContent = d.name;
    mCity.textContent = d.city || '';
    mBio.textContent = d.bio || '';
    mTags.textContent = d.tags || '';
    mGallery.innerHTML = '';
    (d.gallery || '').split('|').filter(Boolean).forEach(function (src) {
      var img = new Image(); img.src = src; img.alt = d.name + ' — ' + (CAT_LABEL[d.cat] || '');
      img.loading = 'lazy'; mGallery.appendChild(img);
    });
    var num = WA[d.region] || WA.india;
    var msg = 'Hi Yedukrishna, I\'d like to book ' + d.name + ' (' + (CAT_LABEL[d.cat] || d.cat) +
              (d.city ? ', ' + d.city : '') + ') from your talent pool. Are they available?';
    mBook.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
    mBook.textContent = 'Enquire to book ' + d.name + ' →';
    modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    if (window.gtag) gtag('event', 'talent_open', { talent: d.name, category: d.cat });
  }
  function closeModal() {
    modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    mGallery.scrollTop = 0;
  }
  cards.forEach(function (card) {
    var btn = $('.tal-open', card);
    if (btn) btn.addEventListener('click', function () { openModal(card); });
  });
  $('#talModalX').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('on')) closeModal(); });

  /* ── apply form → Web3Forms (multipart, so the portfolio PDF uploads) ── */
  var form = $('#talForm');
  if (form) {
    var KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var file = form.querySelector('input[type="file"]');
      if (file && file.files[0] && file.files[0].size > 5 * 1024 * 1024) {
        alert('That file is over 5 MB. Please submit without it and WhatsApp the portfolio to YKS instead.');
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      var orig = btn.textContent; btn.textContent = 'Sending…'; btn.disabled = true;

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
          } else { btn.textContent = orig; btn.disabled = false; alert('Something went wrong — please try again or WhatsApp your details.'); }
        })
        .catch(function () { btn.textContent = orig; btn.disabled = false; alert('Network error — please try again or WhatsApp your details.'); });
    });
  }
})();
