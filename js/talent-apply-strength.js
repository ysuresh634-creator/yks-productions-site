/* ═══════════════════════════════════════════════════════════════
   PROFILE STRENGTH — the price, said out loud.

   There is no fee on this board and there never will be. What it
   costs instead is a real profile, and the honest way to charge that
   is to say so rather than to bury forty optional boxes and hope.

   A stated price collects more than a quiet one. People fill a bar
   they can see, they do not fill a form that merely goes on and on.
   So this names what is still missing, in her words, and says what
   each one is actually worth — because it is true: a brief that
   wants a Kannada speaker who rides a two-wheeler and holds a
   passport either matches what I already know, or it goes to
   somebody else.

   Nothing here is required, nothing blocks the submit, and with the
   script absent the form behaves exactly as before.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('talForm');
  var kit  = document.querySelector('.ap-kit');
  if (!form || !kit) return;

  /* name(s) → what it is called in plain words. Grouped where a single
     idea is spread over several boxes, so "your sizes" counts once. */
  var SIGNALS = [
    { f: ['taste_drawn'],       say: 'the looks you love' },
    { f: ['taste_worlds'],      say: 'the worlds you want to work in' },
    { f: ['taste_onset'],       say: 'how you like a set to run' },
    { f: ['taste_rather_not'],  say: 'what you would rather not do' },
    { f: ['kit_dress', 'kit_top', 'kit_jeans'], say: 'your sizes' },
    { f: ['kit_years'],         say: 'how long you have been doing this' },
    { f: ['kit_reach'],         say: 'your following' },
    { f: ['kit_notice'],        say: 'the notice you need' },
    { f: ['kit_skills'],        say: 'what you can actually do' },
    { f: ['kit_perform'],       say: 'languages you can perform in' },
    { f: ['kit_look'],          say: 'how much your look can change' },
    { f: ['kit_travel'],        say: 'passport and visas' },
    { f: ['kit_logistics'],     say: 'how you work' },
    { f: ['kit_credits'],       say: 'who you have worked with' }
  ];

  var TIERS = [
    { at: 90, say: 'Complete. This is the profile I can answer a brief with straight away.' },
    { at: 70, say: 'Strong. Most briefs that land, I can check you against without ringing you.' },
    { at: 40, say: 'Half a picture. Findable, but I would still have to guess at the rest.' },
    { at: 0,  say: 'Thin. Right now this is a name and a face, and briefs do not ask for those.' }
  ];

  var box = document.createElement('div');
  box.className = 'ap-str';
  box.innerHTML =
    '<div class="ap-str-top">' +
      '<span class="ap-str-lbl">Profile strength</span>' +
      '<span class="ap-str-pct" id="apStrPct">0%</span>' +
    '</div>' +
    '<div class="ap-str-track"><i class="ap-str-fill" id="apStrFill"></i></div>' +
    '<p class="ap-str-say" id="apStrSay"></p>' +
    '<p class="ap-str-next" id="apStrNext"></p>' +
    '<p class="ap-str-deal">There is no fee on this board and there never will be. What it costs ' +
      'instead is this — the fuller it is, the more I can honestly put you up for. A brief lands ' +
      'at nine at night wanting someone who speaks Kannada, rides a two-wheeler and holds a ' +
      'passport: either I already know that about you, or it goes to somebody else. That is the ' +
      'whole trade, and it is the only one here.</p>';
  kit.insertBefore(box, kit.firstChild.nextSibling);

  var pctEl  = box.querySelector('#apStrPct'),
      fillEl = box.querySelector('#apStrFill'),
      sayEl  = box.querySelector('#apStrSay'),
      nextEl = box.querySelector('#apStrNext');

  function answered(sig) {
    return sig.f.some(function (n) {
      var el = form.elements[n];
      return el && String(el.value || '').trim() !== '';
    });
  }

  function paint() {
    var done = SIGNALS.filter(answered);
    var pct  = Math.round(done.length / SIGNALS.length * 100);

    pctEl.textContent = pct + '%';
    fillEl.style.width = pct + '%';
    box.classList.toggle('is-strong', pct >= 70);
    box.classList.toggle('is-full', pct >= 90);

    for (var i = 0; i < TIERS.length; i++) {
      if (pct >= TIERS[i].at) { sayEl.textContent = TIERS[i].say; break; }
    }

    var left = SIGNALS.filter(function (x) { return !answered(x); }).map(function (x) { return x.say; });
    if (!left.length) { nextEl.textContent = 'Nothing left — thank you, genuinely.'; return; }
    var show = left.slice(0, 3);
    nextEl.textContent = 'Still missing: ' + show.join(', ')
      + (left.length > show.length ? ' — and ' + (left.length - show.length) + ' more.' : '.');
  }

  form.addEventListener('input',  paint);
  form.addEventListener('change', paint);
  form.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.ap-chips button')) setTimeout(paint, 0);
  });
  paint();
})();
