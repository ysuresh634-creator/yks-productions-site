/* ═══════════════════════════════════════════════════════════════
   TASTE — the half of the match that measurements can't carry.

   A brief almost never arrives asking for "a model". It asks for
   warm and natural, or sharp and editorial; movement, or stillness;
   and — every time — what she will not do. That last one used to
   live in a free-text box most people left blank, which meant I was
   guessing, and guessing is how someone ends up on a set she didn't
   want to be on.

   So it is chips. Every answer here is a tap, nothing is required,
   and the whole thing degrades to four empty hidden fields if this
   script never runs.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var groups = document.querySelectorAll('.ap-taste-chips[data-taste]');
  if (!groups.length) return;
  var form = document.getElementById('talForm');
  if (!form) return;

  [].forEach.call(groups, function (group) {
    var field = form.elements[group.getAttribute('data-taste')];
    if (!field) return;

    function sync() {
      field.value = [].slice.call(group.querySelectorAll('button.on'))
        .map(function (b) { return b.dataset.v; }).join(', ');
    }

    function off(el) {
      el.classList.remove('on');
      el.setAttribute('aria-pressed', 'false');
    }
    /* Some answers cannot both be true. "Passport in hand" and "No passport
       yet" arriving together is worse than neither arriving at all — it is
       the one thing a producer rings me about. So picking one drops the
       others rather than quietly recording a contradiction. */
    function clash(b) {
      var x = b.getAttribute('data-x');
      if (x) {
        [].forEach.call(group.querySelectorAll('[data-x="' + x + '"]'), function (o) {
          if (o !== b) off(o);
        });
      }
      var clear = b.getAttribute('data-xclear');
      if (clear) {
        [].forEach.call(group.querySelectorAll('[data-xmember="' + clear + '"]'), off);
      }
      var member = b.getAttribute('data-xmember');
      if (member) {
        [].forEach.call(group.querySelectorAll('[data-xclear="' + member + '"]'), off);
      }
    }

    [].forEach.call(group.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var on = b.classList.toggle('on');
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) clash(b);
        sync();
        /* keep.js listens for this so a half-tapped set survives a
           phone call, the same as every typed field on the form */
        field.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    /* keep.js restores by replaying clicks on [aria-pressed]; if instead the
       hidden value is restored directly, re-light the chips to match it. */
    field.addEventListener('change', function () {
      var chosen = (field.value || '').split(',').map(function (x) { return x.trim(); });
      [].forEach.call(group.querySelectorAll('button'), function (b) {
        var on = chosen.indexOf(b.dataset.v) > -1;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });

    sync();
  });
})();
