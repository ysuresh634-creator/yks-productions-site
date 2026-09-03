/* ═══════════════════════════════════════════════════════════════
   WORLD — the board was two countries wide.

   The region field offered India and the UAE and nothing else, so
   anyone outside those two either lied about where they live or shut
   the tab. The work is still mostly in India and the UAE, and this
   does not pretend otherwise — it says so, out loud, the moment
   someone picks somewhere further away, because finding that out
   after applying is worse than reading it now.

   Without JavaScript the country box is simply visible and optional,
   which is the right fallback rather than a broken one.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var region = document.getElementById('apRegion');
  var wrap   = document.getElementById('apElsewhere');
  if (!region || !wrap) return;

  var other = wrap.querySelector('input');
  var HOME  = { 'India': 1, 'UAE': 1 };

  var note = document.createElement('p');
  note.className = 'ap-world-note';
  note.hidden = true;
  wrap.parentNode.insertBefore(note, wrap.nextSibling);

  function paint() {
    var v = region.value;
    var elsewhere = v === 'Somewhere else';

    wrap.hidden = !elsewhere;
    other.required = elsewhere;
    if (!elsewhere) other.value = '';

    if (!v || HOME[v]) { note.hidden = true; return; }
    note.hidden = false;
    note.textContent = elsewhere
      ? 'Good — tell me where and I will read it the same as any other. Most of my work shoots in India and the UAE, so be straight with me about visas and travel in the last box, and I will be straight with you about what I can actually put you up for.'
      : 'Noted — you are welcome here. Most of what I cast shoots in India and the UAE, so tell me in the last box whether you travel, and whether you already have the right to work in either. That one line decides what I can put you forward for.';
  }

  region.addEventListener('change', paint);
  paint();
})();
