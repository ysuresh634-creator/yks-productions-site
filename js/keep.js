/* ═══════════════════════════════════════════════════════════════
   KEEP — nothing you typed gets thrown away

   The application is forty fields over six steps and the booking desk
   is three. Both lived entirely in memory: a phone call, a back
   button, a tab the OS decided to drop, and every answer was gone.
   On a phone, on Indian mobile data, that is not an edge case — it
   is most of a long form's abandonment.

   So everything typed is written to this browser as it is typed, and
   offered back on the next visit. Quietly: a single line at the top
   of the form with "pick up where I left off" and "start fresh", not
   a modal that has to be dismissed before the page can be used.

   What it will not do:
     · never touches file inputs. Photos cannot be restored from
       storage and pretending otherwise would be worse than useless.
     · never touches passwords, and there are none here anyway.
     · nothing leaves the device. This is localStorage, not the
       network — it is the same browser, the same person, and it is
       cleared the moment the form is sent.
     · expires after a week, which is also roughly when iOS Safari
       clears storage for a site nobody has visited.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (document.getElementById('yks-keep-css')) return;
  var st = document.createElement('style');
  st.id = 'yks-keep-css';
  st.textContent = [
    '.yks-keep{display:flex;align-items:center;justify-content:space-between;gap:14px 20px;',
      'flex-wrap:wrap;margin:0 0 26px;padding:15px 18px;border-radius:3px;',
      'border:1px solid rgba(255,148,72,.34);background:rgba(255,148,72,.07);',
      'animation:yksKeepIn .4s ease both}',
    '.yks-keep.is-done{border-color:rgba(99,199,147,.34);background:rgba(99,199,147,.08)}',
    '.yks-keep-say{font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.55;',
      'color:#f6f1e9;flex:1;min-width:200px}',
    '.yks-keep-acts{display:flex;gap:9px;flex-wrap:wrap}',
    '.yks-keep-yes,.yks-keep-no{cursor:pointer;min-height:40px;padding:0 16px;border-radius:2px;',
      'font-family:"Space Grotesk",ui-monospace,monospace;font-size:10.5px;letter-spacing:.12em;',
      'text-transform:uppercase;transition:background .2s,color .2s,border-color .2s}',
    '.yks-keep-yes{background:#ff9448;border:1px solid #ff9448;color:#0a0810;font-weight:700}',
    '.yks-keep-yes:hover{background:#ffc9a3;border-color:#ffc9a3}',
    '.yks-keep-no{background:transparent;border:1px solid rgba(246,241,233,.22);color:rgba(246,241,233,.62)}',
    '.yks-keep-no:hover{color:#f6f1e9;border-color:rgba(246,241,233,.4)}',
    '.yks-keep-yes:focus-visible,.yks-keep-no:focus-visible{outline:2px solid #ff9448;outline-offset:2px}',
    '@keyframes yksKeepIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
    '@media(prefers-reduced-motion:reduce){.yks-keep{animation:none}}'
  ].join('');
  document.head.appendChild(st);
})();

(function () {
  'use strict';

  var DAY = 864e5, TTL = 7 * DAY;

  function store() {                       // private browsing throws on write
    try {
      var k = '__yks_probe';
      localStorage.setItem(k, '1'); localStorage.removeItem(k);
      return localStorage;
    } catch (e) { return null; }
  }
  var LS = store();
  if (!LS) return;

  /* Each form we look after: where it is, what to call its saved copy, and
     the line we greet someone with when there is something to come back to. */
  var FORMS = [
    { sel: '#talForm', key: 'yks.apply',
      say: 'You started this application earlier — want to pick up where you left off?' },
    { sel: '.bk',      key: 'yks.book',
      say: 'You were part-way through a booking brief — carry on from there?' }
  ];

  FORMS.forEach(function (cfg) {
    var root = document.querySelector(cfg.sel);
    if (root) keep(root, cfg);
  });

  function keep(root, cfg) {
    var KEY = cfg.key;

    function fields() {
      return [].slice.call(root.querySelectorAll('input,select,textarea'))
        .filter(function (el) {
          return el.type !== 'file' && el.type !== 'password' && el.type !== 'submit'
              && el.type !== 'button' && !el.disabled;
        });
    }
    /* Chips are buttons, not fields, so their state has to be captured
       separately — and replayed as clicks, because the handlers that own that
       state live in the other scripts. */
    function chips() {
      return [].slice.call(root.querySelectorAll('button[aria-pressed]'));
    }
    function label(el) {
      return el.name || el.id || el.className || '';
    }

    function snapshot() {
      var v = {};
      fields().forEach(function (el, i) {
        var k = label(el) + '#' + i;
        if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) v[k] = 1; }
        else if (el.value) v[k] = el.value;
      });
      var on = [];
      chips().forEach(function (b, i) { if (b.getAttribute('aria-pressed') === 'true') on.push(i); });
      return { at: Date.now(), v: v, on: on };
    }

    var saveTimer = null;
    function save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var s = snapshot();
        // nothing typed yet is not worth remembering
        if (!Object.keys(s.v).length && !s.on.length) { try { LS.removeItem(KEY); } catch (e) {} return; }
        try { LS.setItem(KEY, JSON.stringify(s)); } catch (e) {}
      }, 400);
    }

    function read() {
      try {
        var raw = LS.getItem(KEY);
        if (!raw) return null;
        var s = JSON.parse(raw);
        if (!s || !s.at || Date.now() - s.at > TTL) { LS.removeItem(KEY); return null; }
        return s;
      } catch (e) { return null; }
    }

    function restore(s) {
      var fs = fields();
      fs.forEach(function (el, i) {
        var k = label(el) + '#' + i;
        if (!(k in s.v)) return;
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = true;
        else el.value = s.v[k];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      var cs = chips();
      (s.on || []).forEach(function (i) {
        var b = cs[i];
        if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
      });
    }

    function wipe() { try { LS.removeItem(KEY); } catch (e) {} }

    root.addEventListener('input', save);
    root.addEventListener('change', save);
    root.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('button[aria-pressed]')) save();
    });
    // a form that submits has served its purpose — do not keep the data around
    root.addEventListener('submit', wipe);
    var send = root.querySelector('.bk-send');
    if (send) send.addEventListener('click', function () { setTimeout(wipe, 1500); });

    var saved = read();
    if (!saved) return;

    var days = Math.floor((Date.now() - saved.at) / DAY);
    var when = days < 1 ? 'earlier today' : days === 1 ? 'yesterday' : days + ' days ago';

    var bar = document.createElement('div');
    bar.className = 'yks-keep';
    bar.innerHTML =
      '<span class="yks-keep-say">' + cfg.say.replace('earlier', when) + '</span>' +
      '<span class="yks-keep-acts">' +
        '<button type="button" class="yks-keep-yes">Pick up where I left off</button>' +
        '<button type="button" class="yks-keep-no">Start fresh</button>' +
      '</span>';
    root.insertBefore(bar, root.firstChild);

    bar.querySelector('.yks-keep-yes').addEventListener('click', function () {
      restore(saved);
      bar.className = 'yks-keep is-done';
      bar.innerHTML = '<span class="yks-keep-say">Restored. Everything except your photos — those cannot be kept in a browser, so add them again.</span>';
      setTimeout(function () { bar.remove(); }, 6000);
    });
    bar.querySelector('.yks-keep-no').addEventListener('click', function () {
      wipe();
      bar.remove();
    });
  }
})();
