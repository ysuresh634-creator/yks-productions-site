/* ── Google "preferred sources" badge ──────────────────────────────
   A chip in the footer that sends people to Google's source picker
   with yksproductions.com pre-filled. Anyone who adds it sees my work
   first in Search / Top Stories / AI Mode instead of scrolling for it.

   Injected rather than pasted into 76 files, so the copy and the look
   change in one place. Google's own interactive button (publisher.js)
   is the alternative — it renders nothing on domains their picker
   doesn't carry, so we use the deeplink they document as the fallback.
   ─────────────────────────────────────────────────────────────────── */
(function () {
  var DEEPLINK = 'https://www.google.com/preferences/source?q=yksproductions.com';

  function mount() {
    if (document.querySelector('.pfs')) return;
    var foot = document.querySelector('footer.foot, footer.l-foot, footer');
    if (!foot) return;
    var host = foot.querySelector('.wrap') || foot;

    var css = document.createElement('style');
    css.textContent = [
      '.pfs{width:100%;margin:30px auto 0;padding-top:26px;border-top:1px solid var(--line,rgba(244,237,226,.14));',
        'display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}',
      '.pfs-chip{display:inline-flex;align-items:center;gap:10px;padding:11px 18px;border-radius:999px;',
        'border:1px solid var(--line,rgba(244,237,226,.14));background:rgba(244,237,226,.04);',
        'font-family:var(--font-m,var(--mono,"Space Grotesk",monospace));font-size:12.5px;letter-spacing:.01em;',
        'color:var(--paper,#f4ede2);line-height:1;',
        'transition:border-color .3s var(--ease,ease),color .3s var(--ease,ease),transform .3s var(--ease,ease),background .3s var(--ease,ease)}',
      '.pfs-chip:hover{border-color:var(--amber,#ff8c3b);color:var(--amber,#ff8c3b);background:rgba(255,140,59,.07);transform:translateY(-1px)}',
      '.pfs-chip svg{flex:none}',
      '.pfs-note{font-family:var(--font-m,var(--mono,"Space Grotesk",monospace));font-size:10px;letter-spacing:.2em;',
        'text-transform:uppercase;color:var(--paper-dim,rgba(244,237,226,.6));opacity:.75;max-width:100%;line-height:1.7}',
      '@media(max-width:560px){.pfs-chip{font-size:11.5px;padding:10px 14px}',
        '.pfs-note{font-size:9px;letter-spacing:.14em;max-width:30ch}}'
    ].join('');
    document.head.appendChild(css);

    var g = '<svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true" focusable="false">'
      + '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
      + '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
      + '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
      + '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
      + '</svg>';

    var box = document.createElement('div');
    box.className = 'pfs';
    box.innerHTML =
      '<a class="pfs-chip" href="' + DEEPLINK + '" target="_blank" rel="noopener"'
      + ' aria-label="Add YKS Productions as a preferred source on Google">'
      + g + '<span>Make YKS a preferred source</span></a>'
      + '<span class="pfs-note">One tap on Google &middot; my work shows up first when you search</span>';
    host.appendChild(box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
