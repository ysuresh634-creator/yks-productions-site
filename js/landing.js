/* YKS landing-page enquiry forms → Web3Forms (email capture) */
(function () {
  var KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
  document.querySelectorAll('form.l-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      if (!get('name') || !get('contact')) return;
      var btn = form.querySelector('button');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: form.dataset.subject || 'New enquiry — YKS Productions',
          from_name: 'YKS Productions website',
          Source: form.dataset.source || 'Landing page',
          Name: get('name'),
          Contact: get('contact'),
          Email: get('email') || '—',
          Message: get('message') || '—'
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.success) {
            form.style.display = 'none';
            var ok = form.parentNode.querySelector('.l-form-ok');
            if (ok) ok.style.display = 'block';
          } else {
            btn.textContent = orig; btn.disabled = false;
          }
        })
        .catch(function () { btn.textContent = orig; btn.disabled = false; });
    });
  });
})();

/* Floating WhatsApp + call — one-tap contact from anywhere on the page */
(function () {
  if (document.querySelector('.l-fab')) return;
  var waLink = document.querySelector('a[href*="wa.me/"]');
  var num = (document.body && document.body.getAttribute('data-wa')) || (waLink && (waLink.href.match(/wa\.me\/(\d+)/) || [])[1]) || '971501955122';
  var msg = encodeURIComponent("Hi Yedukrishna, I'd like to enquire about a shoot.");
  var css = '.l-fab{position:fixed;right:18px;bottom:18px;z-index:300;display:flex;flex-direction:column;gap:12px}'
    + '.l-fab a{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.42);transition:transform .25s cubic-bezier(.22,.61,.36,1)}'
    + '.l-fab a:hover{transform:scale(1.09)}'
    + '.l-fab .wa{background:#25D366}.l-fab .tel{background:#ff8c3b}'
    + '.l-fab svg{width:28px;height:28px;display:block}'
    + '@media(max-width:600px){.l-fab{right:14px;bottom:14px}.l-fab a{width:52px;height:52px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var WA = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
  var TEL = '<svg viewBox="0 0 24 24" fill="#07060a"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
  var fab = document.createElement('div'); fab.className = 'l-fab';
  fab.innerHTML = '<a class="wa" href="https://wa.me/' + num + '?text=' + msg + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + WA + '</a>'
    + '<a class="tel" href="tel:+' + num + '" aria-label="Call">' + TEL + '</a>';
  document.body.appendChild(fab);
})();

/* Video facade — poster + play button; the iframe is only created on click,
   so a category page with several films still loads like a static page. */
(function () {
  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('.vfacade');
    if (!f || f.classList.contains('playing')) return;
    var src = f.getAttribute('data-embed');
    if (!src) return;
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.title = f.getAttribute('data-title') || 'Video';
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.setAttribute('allowfullscreen', '');
    f.classList.add('playing');
    f.innerHTML = '';
    f.appendChild(frame);
  });
})();

/* Depth tilt — makes the long-dead data-tilt attribute real.
   Frame, gloss and content read as planes; the card leans toward the
   cursor. Pointer-fine devices only: on touch, cards stay still — the
   gyro version lives in /labs.html where iOS permission is explained.
   One delegated listener, no per-card handlers. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var SEL = '[data-tilt], .pf, .l-places a';
  var current = null;

  var st = document.createElement('style');
  st.textContent =
    '[data-tilt],.pf,.l-places a{will-change:transform}' +
    '.tilting{transition:transform .14s ease-out!important}' +
    '.tilt-reset{transition:transform .45s cubic-bezier(.22,.61,.36,1)!important}';
  document.head.appendChild(st);

  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest(SEL);
    if (el !== current) {
      if (current) release(current);
      current = el;
      if (el) el.classList.add('tilting');
    }
    if (!el) return;
    var r = el.getBoundingClientRect();
    var nx = ((e.clientX - r.left) / r.width - .5) * 2;
    var ny = ((e.clientY - r.top) / r.height - .5) * 2;
    el.style.transform = 'perspective(760px) rotateY(' + (nx * 6).toFixed(2) + 'deg)'
                       + ' rotateX(' + (-ny * 6).toFixed(2) + 'deg) translateY(-3px)';
  }, { passive: true });

  document.addEventListener('pointerout', function (e) {
    if (current && !current.contains(e.relatedTarget)) { release(current); current = null; }
  }, { passive: true });

  function release(el) {
    el.classList.remove('tilting');
    el.classList.add('tilt-reset');
    el.style.transform = '';
    setTimeout(function () { el.classList.remove('tilt-reset'); }, 480);
  }
})();
