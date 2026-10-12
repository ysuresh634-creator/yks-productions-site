/* ═══════════════════════════════════════════════════════════════
   APPLY — the entry gate (applicants 18+)
   Until the visitor confirms, #apFormSec carries data-gender-locked (CSS greys
   it out and makes the form and comp-card builder inert; also set in markup so
   it is locked before this script runs), the follow-gate confirm cannot be
   ticked, and the talent apply routes are held back. The choice is remembered.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'yks_gender_ok';   // 'woman' (= confirmed) | 'other' | null

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

  /* Capture-phase guard: any attempt to use a gated control before the
     visitor confirms is cancelled and sends them back to the choice. */
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
    msg.innerHTML = 'Thanks. The roster is for applicants 18 and over, so the application isn’t open to you right now. If you’re a brand looking to <b>book</b> talent, the <a href="/casting-india.html">casting page</a> is the place.';
    lock();
  }

  yesBtn.addEventListener('click', paintWoman);
  noBtn.addEventListener('click', paintOther);

  // Initial paint. Default (no choice yet) stays LOCKED.
  if (state === 'woman') paintWoman();
  else if (state === 'other') paintOther();
  else lock();
})();
