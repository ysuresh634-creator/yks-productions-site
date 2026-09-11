/* ═══════════════════════════════════════════════════════════════
   APPLY — the follow gate

   Standing rule: nobody registers or builds a portfolio without
   following @yks_photoworks first. Briefs and casting calls go out
   there before they reach this page, so a follower is the whole
   point of the roster.

   A follow itself CANNOT be verified from a web page — Instagram
   exposes no way for a site to read a visitor's follow status. So
   this is the furthest an automated gate can honestly go:

     1. They must actually OPEN the profile (tap Follow). We can
        detect the tap, so this step is enforced, not trusted.
     2. Then they confirm they followed. That final tick is on
        trust — but it is now attached to a real action, not a
        throwaway checkbox at the bottom of a long form.

   Until both are done the application form is inert, the submit
   checkbox can't be ticked, and the "Apply on WhatsApp" bypass is
   held back. State persists so a reload doesn't re-lock a returning
   applicant. Progressive-enhancement: with no JS the form is open
   and the honour checkbox still gates submit, so the page never
   breaks.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY_OPENED = 'yks_ig_opened';    // they tapped Follow (profile opened)
  var KEY_DONE   = 'yks_ig_followed';  // they confirmed the follow

  var followBtn  = document.getElementById('apFollowBtn');
  var gate       = document.getElementById('apGate');
  var confirm    = document.getElementById('apGateConfirm');
  var s1         = document.getElementById('apGateS1');
  var s2         = document.getElementById('apGateS2');
  var locked     = document.getElementById('apGateLocked');
  var formSec    = document.getElementById('apFormSec');
  var formCheck  = document.getElementById('apFollowCheck');

  // If the gate markup isn't present, do nothing (never break the page).
  if (!followBtn || !gate || !confirm || !formSec) return;

  function ls(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      window.localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  var opened = ls(KEY_OPENED) === '1';
  var done   = ls(KEY_DONE) === '1';

  /* ── STEP 1: opening the profile enables the confirm ── */
  function markOpened() {
    if (opened) return;
    opened = true; ls(KEY_OPENED, '1');
    render();
  }
  // Any route to the profile counts as opening it.
  followBtn.addEventListener('click', function () {
    // slight delay so the new tab is actually launched first on mobile
    setTimeout(markOpened, 30);
  });
  followBtn.addEventListener('auxclick', markOpened);   // open-in-new-tab
  followBtn.addEventListener('contextmenu', markOpened);

  /* ── STEP 2: confirming the follow unlocks everything ── */
  confirm.addEventListener('change', function () {
    if (!opened) { confirm.checked = false; nudgeOpen(); return; }
    done = confirm.checked;
    ls(KEY_DONE, done ? '1' : '0');
    render();
    if (done && formSec.scrollIntoView) {
      formSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  function nudgeOpen() {
    if (!locked) return;
    locked.textContent = '↑ Tap “Follow on Instagram” first — then this unlocks.';
    followBtn.classList.add('ap-follow-nudge');
    setTimeout(function () { followBtn.classList.remove('ap-follow-nudge'); }, 1400);
  }

  /* ── the submit checkbox can't be ticked until the gate clears ── */
  if (formCheck) {
    formCheck.addEventListener('click', function (e) {
      if (!done) {
        e.preventDefault();
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nudgeOpen();
      }
    });
  }

  /* ── hold back the "Apply on WhatsApp" register bypass ── */
  // Only the apply-to-the-board WhatsApp link (in .ap-wa) — NOT the
  // book-a-shoot CTA, which is a paid job, not registration.
  var waApply = document.querySelector('.ap-wa a[href*="wa.me"]');
  if (waApply) {
    waApply.addEventListener('click', function (e) {
      if (done) return;
      e.preventDefault();
      gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nudgeOpen();
    });
  }

  /* ── paint current state ── */
  function render() {
    // Step markers
    if (s1) { s1.classList.toggle('is-done', opened); s1.classList.toggle('is-active', !opened); }
    if (s2) { s2.classList.toggle('is-active', opened && !done); s2.classList.toggle('is-done', done); }

    // Confirm control
    if (opened) gate.classList.add('is-open'); else gate.classList.remove('is-open');
    confirm.disabled = !opened;
    confirm.checked = done;

    // Form lock
    if (done) {
      formSec.removeAttribute('data-follow-locked');
      gate.classList.add('is-cleared');
      if (locked) locked.textContent = '✓ Followed — your application is open below.';
      if (formCheck) formCheck.checked = true;
    } else {
      formSec.setAttribute('data-follow-locked', '');
      gate.classList.remove('is-cleared');
      if (locked && opened) locked.textContent = '✓ Profile opened. Follow me, then tick the box above.';
      else if (locked) locked.textContent = '🔒 The application below is locked until you follow. Open Instagram first.';
    }
  }

  render();
})();
