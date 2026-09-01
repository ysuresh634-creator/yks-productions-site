/* ═══════════════════════════════════════════════════════════════
   UTILITY RAIL — search + back to top

   Search used to be injected into the nav. On a phone its label and
   its "/" badge are both hidden under 900px, so all that survived was
   a bare 34x30 magnifier sitting alone at the right end of an empty
   bar — no affordance, and under the 44px minimum for a tap target.
   Back-to-top, meanwhile, only appeared on pages carrying the
   category strip, so profiles and several service pages had none.

   Both now live in one rail on the bottom left, on every page and at
   every width. Bottom right is already spoken for by the chat widget
   and the WhatsApp and call buttons. Search is always there; Top
   fades in once there is something to go back up to.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (document.getElementById('yks-rail-css')) return;
  var st = document.createElement('style');
  st.id = 'yks-rail-css';
  st.textContent = [
    '.yks-rail{position:fixed;left:20px;bottom:22px;z-index:310;display:flex;flex-direction:column;',
      'align-items:flex-start;gap:9px;pointer-events:none}',
    '.yks-rail-btn{pointer-events:auto;display:inline-flex;align-items:center;gap:9px;cursor:pointer;',
      'font-family:"Space Grotesk",ui-monospace,monospace;font-size:10.5px;letter-spacing:.16em;',
      'text-transform:uppercase;color:#f4ede2;min-height:44px;padding:0 18px;',
      'border:1px solid rgba(244,237,226,.16);border-radius:999px;background:rgba(12,10,16,.94);',
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
      'box-shadow:0 10px 28px -14px rgba(0,0,0,.9);',
      'transition:opacity .35s,transform .35s,border-color .3s,color .3s}',
    '.yks-rail-btn svg{width:14px;height:14px;flex:none}',
    '.yks-rail-btn:hover{border-color:rgba(255,140,59,.6);color:#ff8c3b}',
    '.yks-rail-btn:focus-visible{outline:2px solid #ff8c3b;outline-offset:3px}',
    '.yks-rail-btn.is-top{opacity:0;transform:translateY(10px);pointer-events:none}',
    '.yks-rail-btn.is-top.on{opacity:1;transform:none;pointer-events:auto}',
    '@media(max-width:640px){.yks-rail{left:14px;bottom:84px;gap:8px}',
      '.yks-rail-btn{padding:0 15px;font-size:10px}}',
    '@media(prefers-reduced-motion:reduce){.yks-rail-btn{transition:none}}'
  ].join('');
  document.head.appendChild(st);
})();

(function () {
  if (document.querySelector('.yks-rail')) return;

  var rail = document.createElement('div');
  rail.className = 'yks-rail';

  function pill(cls, label, svg) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'yks-rail-btn ' + cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = svg + '<span>' + label + '</span>';
    return b;
  }

  var search = pill('is-search', 'Search',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>');
  search.addEventListener('click', function () {
    if (window.yksSearch) window.yksSearch.open();
  });

  var top = pill('is-top', 'Top',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>');
  top.addEventListener('click', function () {
    // honour a reduced-motion preference rather than always animating
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* The homepage drives scrolling through Lenis, which owns the scroll
       position — a native smooth scrollTo fights it and stalls after a few
       pixels. Hand off to Lenis where it exists; everywhere else the native
       call is the right one. */
    var lenis = window.lenis;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: reduce });
      return;
    }
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  rail.appendChild(search);
  rail.appendChild(top);
  document.body.appendChild(rail);

  var shown = false;
  function sync() {
    var show = window.scrollY > window.innerHeight * 0.6;
    if (show !== shown) { shown = show; top.classList.toggle('on', show); }
  }
  window.addEventListener('scroll', sync, { passive: true });
  sync();
})();
