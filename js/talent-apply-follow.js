/* ═══════════════════════════════════════════════════════════════
   APPLY — the follow gate  (hardened: a real round-trip, not a tick)

   Standing rule: nobody registers or builds a comp card without
   following @yks_photoworks first. Briefs and casting calls go out
   there before they reach this page, so a follower is the whole point.

   HONEST LIMIT: a follow itself cannot be read from a web page —
   Instagram exposes no API for a site to check a visitor's follow
   status. Anyone selling a real automatic check is faking it. So this
   is the furthest an honest automated gate can go, and it is now built
   as a physical round-trip rather than a checkbox anyone can tick:

     1. TAP FOLLOW  — opens Instagram in a new tab (detected).
     2. LEAVE       — the page must actually lose focus (they went to
                      Instagram) and stay away long enough to follow.
     3. COME BACK   — only once they return, after a real dwell, does
                      the confirm enable. A tick without the round-trip
                      is refused.

   The final tick is still on trust (nothing else is possible), but it
   is now attached to a genuine visit — not a throwaway checkbox. The
   REAL double-check is manual and belongs to Yedukrishna: their handle
   is a required field and lands in the owner desk flagged for him to
   confirm against his own follower list. This gate's job is only to
   make sure they actually went.

   Until the gate clears, #apFormSec (the form AND the comp-card studio
   inside it) stays inert, and the submit checkbox can't be ticked.
   State persists so a reload mid-flow doesn't send them back to start.
   Progressive enhancement: with no JS the form stays locked by markup
   and the honour checkbox still gates submit, so the page never breaks.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY_OPENED   = 'yks_ig_opened';    // tapped Follow (IG opened)
  var KEY_RETURNED = 'yks_ig_returned';  // left to IG and came back after a real dwell
  var KEY_DONE     = 'yks_ig_followed';  // confirmed the follow

  var MIN_AWAY_MS = 3500;  // must be away at least this long — enough to actually follow

  var followBtn = document.getElementById('apFollowBtn');
  var gate      = document.getElementById('apGate');
  var confirm   = document.getElementById('apGateConfirm');
  var s1        = document.getElementById('apGateS1');
  var s2        = document.getElementById('apGateS2');
  var s3        = document.getElementById('apGateS3');
  var locked    = document.getElementById('apGateLocked');
  var formSec   = document.getElementById('apFormSec');
  var formCheck = document.getElementById('apFollowCheck');

  // If the gate markup isn't present, do nothing (never break the page).
  if (!followBtn || !gate || !confirm || !formSec) return;

  function ls(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      window.localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  var opened   = ls(KEY_OPENED) === '1';
  var returned = ls(KEY_RETURNED) === '1';
  var done     = ls(KEY_DONE) === '1';
  var leftAt   = 0;   // timestamp the page went hidden after they tapped Follow

  /* ── STEP 1: tapping Follow opens Instagram ── */
  function markOpened() {
    if (!opened) { opened = true; ls(KEY_OPENED, '1'); }
    render();
  }
  followBtn.addEventListener('click', function () {
    // slight delay so the new tab is actually launched first on mobile
    setTimeout(markOpened, 30);
  });
  followBtn.addEventListener('auxclick', markOpened);   // open-in-new-tab
  followBtn.addEventListener('contextmenu', markOpened);

  /* ── STEP 2 → 3: the physical round-trip ──
     After they tap Follow, the page must genuinely lose focus (they
     switched to Instagram) and stay away MIN_AWAY_MS, then come back.
     Only that enables the confirm. Tapping and staying put does not. */
  function onHide() {
    if (opened && !returned) leftAt = Date.now();
  }
  function onShow() {
    if (returned || !opened || !leftAt) return;
    var away = Date.now() - leftAt;
    if (away >= MIN_AWAY_MS) {
      returned = true; ls(KEY_RETURNED, '1');
      render();
    } else {
      // came back too fast to have followed — keep waiting, tell them why
      if (locked) locked.textContent = '⏳ That was quick — open Instagram, tap Follow on @yks_photoworks, then come back.';
    }
    leftAt = 0;
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') onHide(); else onShow();
  });
  window.addEventListener('blur', onHide);
  window.addEventListener('focus', onShow);

  /* ── the confirm tick unlocks everything — but only after the round-trip ── */
  confirm.addEventListener('change', function () {
    if (!returned) {          // can't confirm a follow you never went to make
      confirm.checked = false;
      nudge(opened
        ? '↑ Go to Instagram, follow @yks_photoworks, then come back — then this works.'
        : '↑ Start with step 1 — tap “Follow on Instagram”.');
      return;
    }
    done = confirm.checked;
    ls(KEY_DONE, done ? '1' : '0');
    render();
    if (done && formSec.scrollIntoView) {
      formSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  function nudge(msg) {
    if (locked) locked.textContent = msg;
    followBtn.classList.add('ap-follow-nudge');
    setTimeout(function () { followBtn.classList.remove('ap-follow-nudge'); }, 1400);
  }

  /* ── the submit checkbox can't be ticked until the gate clears ── */
  if (formCheck) {
    formCheck.addEventListener('click', function (e) {
      if (!done) {
        e.preventDefault();
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nudge('↑ Follow @yks_photoworks first — this unlocks once you have.');
      }
    });
  }

  /* ── hold back the apply-on-WhatsApp bypass, if any survives ── */
  var waApply = document.querySelector('.ap-wa a[href*="wa.me"]');
  if (waApply) {
    waApply.addEventListener('click', function (e) {
      if (done) return;
      e.preventDefault();
      gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nudge('↑ Follow @yks_photoworks first.');
    });
  }

  /* ── paint current state ── */
  function render() {
    // Step markers: 1 tap · 2 follow (while away) · 3 come back & confirm
    if (s1) { s1.classList.toggle('is-done', opened); s1.classList.toggle('is-active', !opened); }
    if (s2) { s2.classList.toggle('is-done', returned); s2.classList.toggle('is-active', opened && !returned); }
    if (s3) { s3.classList.toggle('is-done', done); s3.classList.toggle('is-active', returned && !done); }

    // Confirm control — only live once they've actually been to IG and back
    gate.classList.toggle('is-open', returned);
    confirm.disabled = !returned;
    confirm.checked = done;

    // Form + comp-card studio lock
    if (done) {
      formSec.removeAttribute('data-follow-locked');
      gate.classList.add('is-cleared');
      if (locked) locked.textContent = '✓ Thank you for following — the form and comp-card builder are open below.';
      if (formCheck) formCheck.checked = true;
    } else {
      formSec.setAttribute('data-follow-locked', '');
      gate.classList.remove('is-cleared');
      if (locked) {
        if (returned)     locked.textContent = '✓ Welcome back — tick the box above to open your application.';
        else if (opened)  locked.textContent = '⏳ Waiting for you on Instagram — follow @yks_photoworks, then come back to this tab.';
        else              locked.textContent = '🔒 Locked until you follow. Start with step 1 above.';
      }
    }
  }

  render();
})();
