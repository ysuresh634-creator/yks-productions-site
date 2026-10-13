/* Follow code — a short code the applicant DMs to @yks_photoworks from the account they follow with.
   A follow can't be checked from a web page; the DM can be matched by hand against the code in the
   application email. The confirm tick stays locked until the code has been copied or the DM opened. */
(function () {
  'use strict';
  var K = 'yks_follow_code', KS = 'yks_follow_code_sent';
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var code = ls(K);
  if (!/^YKS-[A-Z0-9]{4}$/.test(code || '')) {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '', buf = new Uint32Array(4);
    try { crypto.getRandomValues(buf); } catch (e) { for (var j = 0; j < 4; j++) buf[j] = Math.random() * 1e9; }
    for (var i = 0; i < 4; i++) r += A[buf[i] % A.length];
    code = 'YKS-' + r; ls(K, code);
  }
  window.YKS_FOLLOW_CODE = code;
  window.YKS_FOLLOW_CODE_SENT = function () { return ls(KS) === '1'; };
  var val = document.getElementById('apFcodeVal'), cp = document.getElementById('apFcodeCopy'),
      dm = document.getElementById('apFcodeDm'), msg = document.getElementById('apFcodeMsg'),
      confirm = document.getElementById('apGateConfirm');
  if (val) val.textContent = code;
  function copy(done) {
    var ok = function () { if (cp) { cp.textContent = 'Copied ✓'; setTimeout(function () { cp.textContent = 'Copy code'; }, 1800); } if (done) done(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, ok); else ok();
  }
  if (cp) cp.addEventListener('click', function () { copy(); });
  if (dm) dm.addEventListener('click', function () { copy(); ls(KS, '1'); if (msg) msg.textContent = 'Code copied — paste it into the DM to @yks_photoworks and send. Applications are reviewed only after this code arrives from an account that follows @yks_photoworks.'; });
  // the confirm tick needs the DM step too
  if (confirm) confirm.addEventListener('change', function (e) {
    if (confirm.checked && ls(KS) !== '1') {
      confirm.checked = false; e.stopImmediatePropagation();
      if (msg) msg.textContent = '↑ Tap “DM this code to @yks_photoworks” and send the code first.';
      if (dm && dm.scrollIntoView) dm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, true);
})();
