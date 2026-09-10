/* ═══════════════════════════════════════════════════════════════
   APPLY — the gender gate  (women-only open board)

   Standing rule (Sep 2026): this volume of the roster casts women only.
   Men are not an open-call category — they are cast by referral, through
   agencies and people already worked with, for specific briefs. So a man
   must not be able to sign up, build a comp card, or reach the apply
   channels from this page.

   This is the FIRST gate, ahead of the follow gate. Until a woman is
   confirmed:
     · #apFormSec carries data-gender-locked (CSS greys it out and makes
       the form AND the comp-card studio inside it inert). It is set in
       the markup too, so the form is locked before this script even runs.
     · the follow-gate confirm cannot be ticked;
     · the talent apply routes (Apply-on-WhatsApp, and the "book my shoot"
       CTA that follows building a portfolio) are held back.

   A man's answer is remembered and never offers a way forward here — only
   a pointer to the casting page, which is for BRANDS booking talent and is
   deliberately left open (a client is not a signup).

   A gate like this cannot truly verify sex from a web page; this is the
   honest limit — an explicit, remembered choice that locks the whole
   talent funnel behind it. Progressive enhancement: with no JS the form
   stays locked (the markup attribute) and the notice above still shows.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'yks_gender_ok';   // 'woman' | 'other' | (null = not chosen)

  var gate    = document.getElementById('apGenderGate');
  var yesBtn  = document.getElementById('apGgateYes');
  var noBtn   = document.getElementById('apGgateNo');
  var msg     = document.getElementById('apGgateMsg');
  var formSec = document.getElementById('apFormSec');

  // Never break the page if the markup isn't present.
  if (!gate || !yesBtn || !noBtn || !formSec) return;

  var confirm = document.getElementById('apGateConfirm');   // follow-gate confirm

  function ls(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      window.localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  var state = ls(KEY);   // may be null

  function lock() {
    formSec.setAttribute('data-gender-locked', '');
    if (confirm) confirm.disabled = true;
  }
  function unlock() {
    formSec.removeAttribute('data-gender-locked');
    // hand the confirm back to the follow gate unless it is holding its own lock
    if (confirm && !formSec.hasAttribute('data-follow-locked')) confirm.disabled = false;
  }

  function bump() {
    gate.classList.add('ap-ggate-bump');
    setTimeout(function () { gate.classList.remove('ap-ggate-bump'); }, 700);
  }

  /* Capture-phase guard: any attempt to use a gated control before a woman
     is confirmed is cancelled and sends the visitor back to the choice. */
  document.addEventListener('click', function (e) {
    if (state === 'woman') return;
    var t = e.target.closest && e.target.closest('.ap-wa a[href*="wa.me"], #apShootCta, #apGateConfirm');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bump();
  }, true);

  if (confirm) {
    confirm.addEventListener('change', function () {
      if (state !== 'woman') { confirm.checked = false; }
    }, true);
  }

  function paintWoman() {
    state = 'woman'; ls(KEY, 'woman');
    gate.setAttribute('data-state', 'woman');
    yesBtn.classList.add('is-on'); noBtn.classList.remove('is-on');
    msg.hidden = false; msg.className = 'ap-ggate-msg is-ok';
    msg.textContent = '✓ Open below — follow the profile, then the form and the comp-card builder unlock.';
    unlock();
  }

  function paintOther() {
    state = 'other'; ls(KEY, 'other');
    gate.setAttribute('data-state', 'other');
    noBtn.classList.add('is-on'); yesBtn.classList.remove('is-on');
    msg.hidden = false; msg.className = 'ap-ggate-msg is-shut';
    msg.innerHTML = 'Thanks for being straight with me. This volume of the roster isn’t casting men through the open form — I add men by referral for specific briefs. If you’re a brand looking to <b>book</b> talent, the <a href="/casting-india.html">casting page</a> is the place. All the best.';
    lock();
  }

  yesBtn.addEventListener('click', paintWoman);
  noBtn.addEventListener('click', paintOther);

  // Initial paint. Default (no choice yet) stays LOCKED.
  if (state === 'woman') paintWoman();
  else if (state === 'other') paintOther();
  else lock();
})();
