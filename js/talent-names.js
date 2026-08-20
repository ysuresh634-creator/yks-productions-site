/* ── talent-names.js ──────────────────────────────────────────────────
   Talent names are deliberately absent from the HTML we publish. They
   live in /talents/names.json, which robots.txt disallows, so a crawler
   never fetches it and no name can enter a search index. A real visitor's
   browser ignores robots.txt, fetches it, and sees the roster in full.

   Everything degrades to the roster code (MODEL M01) if this never loads,
   which is a dull page but never a broken one.
   ------------------------------------------------------------------ */
(function () {
  var slots = document.querySelectorAll('[data-tname],[data-tfirst],[data-tbook]');
  if (!slots.length) return;

  fetch('/talents/names.json', { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (map) {
      if (!map) return;
      window.YKS_TNAMES = map;
      paint(map);
      document.dispatchEvent(new CustomEvent('yks:names', { detail: map }));
    })
    .catch(function () { /* roster codes stand in — nothing to do */ });

  function paint(map) {
    document.querySelectorAll('[data-tname]').forEach(function (el) {
      var t = map[el.getAttribute('data-tname')];
      if (t && t.name) el.textContent = t.name;
    });
    document.querySelectorAll('[data-tfirst]').forEach(function (el) {
      var t = map[el.getAttribute('data-tfirst')];
      if (t && t.first) el.textContent = t.first;
    });
    /* the WhatsApp enquiry opens on the code; give a human the name instead */
    document.querySelectorAll('[data-tbook]').forEach(function (a) {
      var t = map[a.getAttribute('data-tbook')];
      if (!t || !a.href) return;
      a.href = a.href.replace(
        encodeURIComponent(a.getAttribute('data-tbook').toUpperCase()),
        encodeURIComponent(t.name));
    });
  }
})();
