/* ── talents-owner.js ────────────────────────────────────────────────────
   The owner's bulk desk, living inside the public /talents page.

   Adding talent one at a time is fine for one talent. Seeding a roster is
   not: it is twenty faces, four hundred fields and a folder of photographs,
   and doing that through the apply form is an afternoon. This opens a
   private console on the same page — paste a sheet, drop a pile of photos,
   or pull the applications already waiting in the engine — and pushes the
   whole batch to the roster in one go.

   Nothing here is in the HTML. The panel is built in JS, only after the
   passcode checks out against the Talents Engine, so the published page
   carries no owner markup, no endpoint and nothing to index. A visitor who
   finds the URL gets a passcode box and no further.

   Way in:  /talents#owner   ·   /talents?owner=1   ·   five taps on the
   roster kicker ("The Edit · Volume 01").

   What a push actually does: photos → Cloudinary, entry → the engine, and
   on publish the engine commits the plates plus _data/roster.json to the
   site repo. The build (tools/build-talents.py, run by the Talents
   workflow) writes the code-named cards, the unguessable profile URLs and
   names.json. This file never invents a page — one source of truth stays
   one source of truth.
   --------------------------------------------------------------------- */
(function () {
  'use strict';

  var ENGINE = 'https://yks-talents-engine.ysuresh634.workers.dev';
  var CLOUD = 'sn15r86h';            // same unsigned Cloudinary preset the apply form uses
  var PRESET = 'yks_talents';
  var KEYSTORE = 'yks_owner_key';    // passcode, kept on this device only

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* ── the fields a roster entry is made of ─────────────────────────── */
  var FIELDS = [
    { k: 'name', label: 'Name', req: true },
    { k: 'category', label: 'Category', chips: ['model', 'influencer', 'actor'] },
    { k: 'based_in', label: 'Based in', chips: ['india', 'uae'] },
    { k: 'city', label: 'City', req: true },
    { k: 'socials', label: 'Instagram', hint: 'private — how you check them; never published', priv: true },
    { k: 'work_preferences', label: 'Works in', hint: 'Fashion, Editorial, Commercial' },
    { k: 'stat_height', label: 'Height' },
    { k: 'stat_bust', label: 'Bust' },
    { k: 'stat_waist', label: 'Waist' },
    { k: 'stat_high_hip', label: 'High hip' },
    { k: 'stat_hips', label: 'Hips' },
    { k: 'stat_shoe', label: 'Shoe' },
    { k: 'stat_hair', label: 'Hair' },
    { k: 'stat_eyes', label: 'Eyes' },
    { k: 'stat_skin', label: 'Skin' },
    { k: 'gender', label: 'Gender' },
    { k: 'nationality', label: 'Nationality' },
    { k: 'tagline', label: 'One line', hint: 'the roster card line' },
    { k: 'about', label: 'Bio', big: true }
  ];

  /* Column headings people actually type, in sheets and in WhatsApp. */
  var ALIASES = {
    name: ['name', 'full name', 'talent', 'model', 'talent name'],
    category: ['category', 'cat', 'type', 'kind'],
    based_in: ['region', 'based in', 'country', 'based'],
    city: ['city', 'location', 'base', 'town'],
    socials: ['instagram', 'ig', 'insta', 'handle', 'socials', 'social', 'profile', 'profile link'],
    work_preferences: ['tags', 'works in', 'work', 'disciplines', 'categories', 'genres', 'skills'],
    about: ['bio', 'about', 'notes', 'description', 'profile'],
    tagline: ['tagline', 'one line', 'short', 'shortbio', 'short bio', 'line'],
    stat_height: ['height', 'ht'],
    stat_bust: ['bust', 'chest'],
    stat_waist: ['waist'],
    stat_hips: ['hips', 'hip'],
    stat_high_hip: ['high hip', 'highhip'],
    stat_shoe: ['shoe', 'shoe size', 'footwear'],
    stat_hair: ['hair', 'hair colour', 'hair color'],
    stat_eyes: ['eyes', 'eye', 'eye colour', 'eye color'],
    stat_skin: ['skin', 'skin tone', 'complexion'],
    gender: ['gender', 'sex'],
    nationality: ['nationality'],
    photos: ['photos', 'photo', 'images', 'image', 'links', 'urls', 'pictures']
  };
  var FIELD_KEYS = ['—'].concat(Object.keys(ALIASES));

  /* The site build refuses these outright; catching them here means he sees
     the problem on the row, not in a build log an hour later. */
  var GUARDS = [
    [/[\w.+-]+@[\w-]+\.[\w.]+/, 'an email address'],
    [/(?:\+?\d[\d\s-]{8,})/, 'a phone number'],
    [/instagram\.com\/(?!yks_photoworks)/i, 'an Instagram link'],
    [/(₹|INR|AED|USD|\$)\s?\d/, 'a price']
  ];

  var drafts = [];      // everything staged, from any of the three sources
  var pending = [];     // applications already sitting in the engine
  var key = '';
  var panel, body, tabsEl, msgEl;

  /* ── styles: injected, so nothing about this ships in the page CSS ── */
  function styles() {
    if ($('#owStyle')) return;
    var s = el('style'); s.id = 'owStyle';
    s.textContent = [
      '.ow-wrap{position:fixed;inset:0;z-index:9999;background:#07060a;color:#f4ede2;overflow-y:auto;',
      '  font:15px/1.55 -apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif;-webkit-overflow-scrolling:touch}',
      '.ow-in{max-width:820px;margin:0 auto;padding:18px 16px 80px}',
      '.ow-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0 16px}',
      '.ow-brand{font:600 12px/1 sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#C9A96E}',
      '.ow-x{background:none;border:1px solid #2a2430;color:#9a9088;border-radius:9px;padding:8px 12px;font-size:13px}',
      '.ow-tabs{display:flex;gap:8px;margin-bottom:16px}',
      '.ow-tab{flex:1;text-align:center;font:600 12px/1 sans-serif;letter-spacing:.06em;text-transform:uppercase;',
      '  color:#9a9088;background:none;border:1px solid #2a2430;border-radius:10px;padding:11px 6px}',
      '.ow-tab.on{background:#C9A96E;border-color:#C9A96E;color:#0a0810}',
      '.ow-card{background:#0e0c12;border:1px solid #241f2b;border-radius:13px;padding:14px;margin:0 0 12px}',
      '.ow-card.bad{border-color:rgba(229,83,61,.55)}',
      '.ow-h{font:600 11px/1 sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9a9088;margin:20px 0 10px}',
      '.ow-p{color:#9a9088;font-size:13px;margin:0 0 12px}',
      '.ow-lab{display:block;font:600 10px/1 sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7d746d;margin:12px 0 5px}',
      '.ow-in-f,.ow-ta{width:100%;background:#141018;border:1px solid #2a2430;border-radius:9px;color:#f4ede2;',
      '  padding:10px 11px;font:15px/1.4 inherit;-webkit-appearance:none}',
      '.ow-ta{min-height:78px;resize:vertical}',
      '.ow-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}',
      '.ow-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.ow-chip{background:none;border:1px solid #2a2430;color:#9a9088;border-radius:20px;padding:7px 13px;font-size:13px}',
      '.ow-chip.on{background:rgba(201,169,110,.16);border-color:#C9A96E;color:#f4ede2}',
      '.ow-btn{display:inline-block;border:1px solid #2a2430;background:none;color:#f4ede2;border-radius:10px;',
      '  padding:12px 16px;font:600 14px sans-serif;cursor:pointer}',
      '.ow-btn.go{background:#C9A96E;border-color:#C9A96E;color:#0a0810}',
      '.ow-btn.no{color:#e5533d;border-color:rgba(229,83,61,.4)}',
      '.ow-btn[disabled]{opacity:.5}',
      '.ow-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}',
      '.ow-thumbs{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}',
      '.ow-th{position:relative;width:64px}',
      '.ow-th img{width:64px;height:80px;object-fit:cover;border-radius:7px;display:block;border:1px solid #241f2b}',
      '.ow-th.cover img{border-color:#C9A96E;border-width:2px}',
      '.ow-th b{position:absolute;left:3px;top:3px;background:#C9A96E;color:#0a0810;font:600 9px sans-serif;',
      '  padding:2px 5px;border-radius:4px;letter-spacing:.06em}',
      '.ow-th select{width:64px;margin-top:4px;font-size:11px;background:#141018;color:#f4ede2;',
      '  border:1px solid #2a2430;border-radius:6px;padding:3px}',
      '.ow-err{color:#e5533d;font-size:12.5px;margin-top:8px}',
      '.ow-ok{color:#16a765;font-size:12.5px;margin-top:8px}',
      '.ow-msg{position:sticky;top:0;z-index:2;background:#141018;border:1px solid #2a2430;border-radius:10px;',
      '  padding:11px 13px;font-size:13.5px;margin-bottom:12px}',
      '.ow-msg.bad{border-color:rgba(229,83,61,.5);color:#ffb4a6}',
      '.ow-msg.good{border-color:rgba(22,167,101,.5);color:#8ee0b4}',
      '.ow-map{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px}',
      '.ow-map select{background:#141018;color:#f4ede2;border:1px solid #2a2430;border-radius:7px;padding:6px;font-size:12px}',
      '.ow-mapcol{min-width:130px}',
      '.ow-mapcol small{display:block;color:#7d746d;font-size:11px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ow-pend{display:flex;gap:11px;align-items:flex-start}',
      '.ow-pend img{width:54px;height:68px;object-fit:cover;border-radius:7px;flex:none;background:#1a1620}',
      '.ow-pend input{width:20px;height:20px;flex:none;accent-color:#C9A96E}',
      '.ow-meta{color:#7d746d;font-size:12.5px}',
      '.ow-bar{position:fixed;left:0;right:0;bottom:0;background:rgba(7,6,10,.96);border-top:1px solid #241f2b;',
      '  padding:11px 16px;display:flex;gap:10px;align-items:center;justify-content:space-between}',
      '.ow-bar span{font-size:13px;color:#9a9088}',
      '.ow-drop{border:1.5px dashed #3a3242;text-align:center}',
      '.ow-drop.hot{border-color:#C9A96E;background:rgba(201,169,110,.07)}',
      '.ow-card.hot{border-color:#C9A96E;box-shadow:0 0 0 1px rgba(201,169,110,.4)}',
      '.ow-th img{cursor:grab}',
      '.ow-th i{position:absolute;right:2px;top:2px;width:18px;height:18px;border-radius:50%;background:rgba(7,6,10,.82);',
      '  color:#f4ede2;font:600 11px/18px sans-serif;font-style:normal;text-align:center;cursor:pointer}',
      '.ow-veil{position:fixed;inset:0;z-index:10;background:rgba(7,6,10,.82);border:2px dashed #C9A96E;',
      '  display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;',
      '  font:600 17px/1.5 sans-serif;color:#C9A96E;pointer-events:none}',
      '@media(max-width:520px){.ow-grid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── engine calls ──────────────────────────────────────────────────── */
  function api(path, opts) {
    opts = opts || {};
    var headers = { 'X-Admin-Key': key };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(ENGINE + path, {
      method: opts.method || 'GET', headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'engine returned ' + r.status }; });
    }).catch(function () {
      // the engine being asleep, offline or blocked must not leave a blank
      // panel — every caller reads .ok, so hand them a failure they can show
      return { ok: false, error: 'could not reach the Talents Engine', offline: true };
    });
  }

  var lastMsg = null;
  function say(text, kind, quiet) {
    lastMsg = text ? { text: text, kind: kind } : null;
    if (!msgEl) return;
    msgEl.className = 'ow-msg' + (kind ? ' ' + kind : '');
    msgEl.innerHTML = text;
    msgEl.hidden = !text;
    if (text && !quiet) msgEl.scrollIntoView({ block: 'nearest' });
  }

  /* ── unlock ────────────────────────────────────────────────────────── */
  function open() {
    styles();
    if (panel) { panel.hidden = false; return; }
    panel = el('div', 'ow-wrap');
    var inner = el('div', 'ow-in');
    var top = el('div', 'ow-top',
      '<span class="ow-brand">YKS Talents · bulk desk</span>');
    var x = el('button', 'ow-x', 'Close');
    x.onclick = close;
    top.appendChild(x);
    inner.appendChild(top);
    body = el('div');
    inner.appendChild(body);
    panel.appendChild(inner);
    document.body.appendChild(panel);
    document.documentElement.style.overflow = 'hidden';
    wireDrops();
    key = '';
    try { key = sessionStorage.getItem(KEYSTORE) || localStorage.getItem(KEYSTORE) || ''; } catch (e) {}
    if (key) {
      api('/admin/api/ping').then(function (j) {
        if (j && j.ok) return desk();
        gate();
        if (j && j.offline) say('The engine did not answer. Check the connection and try again.', 'bad');
      });
    } else gate();
  }
  function close() {
    if (panel) panel.hidden = true;
    document.documentElement.style.overflow = '';
    if (location.hash === '#owner') history.replaceState(null, '', location.pathname);
  }

  function gate() {
    body.innerHTML = '';
    msgEl = el('div', 'ow-msg'); msgEl.hidden = true;
    body.appendChild(msgEl);
    var c = el('div', 'ow-card',
      '<p class="ow-p">Private. Enter the engine passcode.</p>' +
      '<input class="ow-in-f" type="password" id="owKey" autocomplete="off" placeholder="Passcode" />');
    var row = el('div', 'ow-row');
    var go = el('button', 'ow-btn go', 'Unlock');
    var remember = el('label', '', '<input type="checkbox" id="owRem" checked /> keep me signed in on this device');
    remember.style.cssText = 'font-size:12.5px;color:#9a9088;display:flex;gap:7px;align-items:center';
    row.appendChild(go);
    c.appendChild(row);
    c.appendChild(remember);
    var err = el('p', 'ow-err'); err.hidden = true;
    c.appendChild(err);
    body.appendChild(c);
    var input = $('#owKey', c);
    input.focus();
    function attempt() {
      key = input.value.trim();
      if (!key) return;
      go.disabled = true; go.textContent = 'Checking…';
      api('/admin/api/ping').then(function (j) {
        go.disabled = false; go.textContent = 'Unlock';
        if (j && j.ok) {
          try {
            ($('#owRem', c).checked ? localStorage : sessionStorage).setItem(KEYSTORE, key);
          } catch (e) {}
          desk();
        } else {
          err.hidden = false;
          err.textContent = (j && j.error) || 'That passcode did not work.';
        }
      });
    }
    go.onclick = attempt;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
  }

  /* ── the desk ──────────────────────────────────────────────────────── */
  var tab = 'paste';
  var repoChecked = false;
  function desk() {
    body.innerHTML = '';
    msgEl = el('div', 'ow-msg'); msgEl.hidden = true;
    body.appendChild(msgEl);
    if (lastMsg) say(lastMsg.text, lastMsg.kind, true);
    tabsEl = el('div', 'ow-tabs');
    [['paste', 'Paste rows'], ['photos', 'Drop photos'], ['pending', 'Applications']].forEach(function (t) {
      var b = el('button', 'ow-tab' + (tab === t[0] ? ' on' : ''), t[1]);
      b.onclick = function () { tab = t[0]; lastMsg = null; desk(); };
      tabsEl.appendChild(b);
    });
    body.appendChild(tabsEl);
    var view = el('div');
    body.appendChild(view);
    if (tab === 'paste') paste(view);
    if (tab === 'photos') photos(view);
    if (tab === 'pending') applications(view);

    // A dead GitHub token only shows up at publish — after the photos are
    // uploaded and the batch is staged. Ask once, on open, so it is the first
    // thing on screen instead of the last.
    if (!repoChecked) {
      repoChecked = true;
      api('/admin/api/repo').then(function (j) {
        if (!j || j.ok) return;
        say('<b>The site repo is not reachable</b> — ' + esc(j.error || 'unknown') +
            '.<br>Staging works, publishing will not until that is fixed.', 'bad');
      });
    }
  }

  /* ── 1. paste rows out of a sheet, or a block of "Key: value" lines ── */
  function paste(view) {
    var c = el('div', 'ow-card',
      '<p class="ow-p">Copy the rows straight out of Sheets, Excel or Numbers — headings included if you have them. ' +
      'Or paste blocks of <em>Name: …</em> lines separated by a blank line, the way they arrive on WhatsApp.</p>' +
      '<textarea class="ow-ta" id="owPaste" style="min-height:150px" ' +
      'placeholder="Name\tCategory\tCity\tHeight\tWorks in&#10;Priya Menon\tmodel\tMumbai\t5&#39;7&quot;\tFashion, Editorial"></textarea>');
    var row = el('div', 'ow-row');
    var go = el('button', 'ow-btn go', 'Read it');
    row.appendChild(go);
    c.appendChild(row);
    view.appendChild(c);
    var out = el('div');
    view.appendChild(out);
    go.onclick = function () {
      var text = $('#owPaste').value;
      if (!text.trim()) return;
      var parsed = text.indexOf('\t') < 0 && /^[^\n:]{2,24}:/m.test(text) ? parseBlocks(text) : parseTable(text, out);
      if (parsed) { addDrafts(parsed); renderDrafts(); }
    };
    renderDrafts();
  }

  function splitRow(line) {
    if (line.indexOf('\t') >= 0) return line.split('\t');
    // CSV, quotes respected — a bio with a comma in it is the normal case
    var cells = [], cur = '', q = false, i;
    for (i = 0; i < line.length; i++) {
      var ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    return cells;
  }

  function guessField(heading) {
    var h = String(heading || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    var hit = '';
    Object.keys(ALIASES).forEach(function (k) {
      if (hit) return;
      if (ALIASES[k].indexOf(h) >= 0) hit = k;
    });
    return hit;
  }

  /* A table paste: work out which column is which, show the mapping so a
     wrong guess is one dropdown away from right, then build the rows. */
  function parseTable(text, out) {
    var lines = text.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    if (!lines.length) return null;
    var rows = lines.map(splitRow);
    var first = rows[0].map(guessField);
    var hasHeader = first.filter(Boolean).length >= 2;
    var map = hasHeader ? first
      : ['name', 'category', 'city', 'stat_height', 'work_preferences', 'about']
        .slice(0, rows[0].length)
        .concat(new Array(Math.max(0, rows[0].length - 6)).fill(''));
    var data = hasHeader ? rows.slice(1) : rows;

    out.innerHTML = '';
    var c = el('div', 'ow-card', '<p class="ow-p">Columns — fix any I read wrong, then confirm.</p>');
    var mapRow = el('div', 'ow-map');
    map.forEach(function (k, i) {
      var col = el('div', 'ow-mapcol', '<small>' + esc((hasHeader ? rows[0][i] : (data[0] && data[0][i])) || ('col ' + (i + 1))) + '</small>');
      var sel = el('select');
      FIELD_KEYS.forEach(function (fk) {
        var o = el('option', '', fk === '—' ? '— ignore —' : fk.replace('stat_', '').replace('_', ' '));
        o.value = fk === '—' ? '' : fk;
        if (o.value === k) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = function () { map[i] = sel.value; };
      col.appendChild(sel);
      mapRow.appendChild(col);
    });
    c.appendChild(mapRow);
    var go = el('button', 'ow-btn go', 'Add ' + data.length + (data.length === 1 ? ' row' : ' rows'));
    go.onclick = function () {
      var made = data.map(function (r) {
        var d = {};
        map.forEach(function (k, i) { if (k && r[i] != null && String(r[i]).trim()) d[k] = String(r[i]).trim(); });
        if (d.photos) {
          d.photos = d.photos.split(/[\s,|]+/).filter(function (u) { return /^https?:\/\//.test(u); })
            .map(function (u) { return { url: u }; });
        }
        return d;
      }).filter(function (d) { return d.name; });
      out.innerHTML = '';
      addDrafts(made);
      renderDrafts();
      say(made.length + ' row' + (made.length === 1 ? '' : 's') + ' staged. Check them, add photos, then push.', 'good');
    };
    c.appendChild(el('div', 'ow-row')).appendChild(go);
    out.appendChild(c);
    return null;   // rows are added on confirm, not here
  }

  /* "Name: Priya Menon / City: Mumbai" blocks, blank line between people. */
  function parseBlocks(text) {
    return text.replace(/\r/g, '').split(/\n\s*\n/).map(function (block) {
      var d = {};
      block.split('\n').forEach(function (line) {
        var m = /^\s*([^:]{2,24}):\s*(.+)$/.exec(line);
        if (!m) return;
        var k = guessField(m[1]);
        if (k === 'photos') {
          d.photos = m[2].split(/[\s,|]+/).filter(function (u) { return /^https?:\/\//.test(u); })
            .map(function (u) { return { url: u }; });
        } else if (k) d[k] = m[2].trim();
      });
      return d;
    }).filter(function (d) { return d.name; });
  }

  /* ── 2. photos, dragged in from wherever they live ─────────────────
     Finder, Photos, a Files app, another browser tab, a WhatsApp Web thread.
     A drag carries either the real file or — when the picture lives on
     someone else's page — only its URL, so both are accepted; a URL is pulled
     into our own Cloudinary at push time, because a roster plate must not be
     a hotlink to something that can disappear. ⌘V pastes a copied image or a
     screenshot. Dragging a thumbnail from one card to another moves it, which
     is how you fix a group the filenames got wrong. ── */

  var SHOT_TYPE = 'application/x-yks-shot';

  function isImageFile(f) {
    return !!f && (/^image\//.test(f.type || '') || /\.(jpe?g|png|webp|heic|heif|avif|gif)$/i.test(f.name || ''));
  }
  function carriesShots(e) {
    var t = e.dataTransfer && e.dataTransfer.types;
    if (!t) return false;
    t = Array.prototype.slice.call(t);
    return t.indexOf('Files') >= 0 || t.indexOf('text/uri-list') >= 0 || t.indexOf('text/html') >= 0 || t.indexOf(SHOT_TYPE) >= 0;
  }

  function shotsFrom(dt) {
    var out = [], seen = {}, files = [];
    if (dt.files && dt.files.length) files = Array.prototype.slice.call(dt.files);
    else if (dt.items && dt.items.length) {
      Array.prototype.forEach.call(dt.items, function (it) {
        if (it.kind === 'file') { var f = it.getAsFile(); if (f) files.push(f); }
      });
    }
    files.filter(isImageFile).forEach(function (f) { out.push({ file: f, name: f.name || '' }); });
    if (out.length) return out;

    var grab = function (type) { try { return dt.getData(type) || ''; } catch (e) { return ''; } };
    var urls = [], htm = grab('text/html'), m, re = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((m = re.exec(htm))) urls.push(m[1]);
    (grab('text/uri-list') + ' ' + grab('text/plain')).split(/\s+/).forEach(function (u) {
      if (/^https?:\/\//i.test(u)) urls.push(u);
    });
    urls.forEach(function (u) {
      u = u.replace(/&amp;/g, '&');
      if (seen[u]) return;
      seen[u] = 1;
      out.push({ url: u, name: (u.split('/').pop() || '').split('?')[0] });
    });
    return out;
  }

  // A camera or a screenshot names a file after itself, not after the person
  // in it — those stems are worse than nothing in the name field.
  var JUNK_STEM = /^(img|image|photo|picture|pic|screenshot|screen shot|dsc|dscn|p|whatsapp image|whatsapp|untitled|final|edit|copy|download|unnamed|fullsizerender|render)\b/;
  /* They type @name, instagram.com/name, a full URL, or just the name. All of
     those are the same profile; this is the one place that decides. */
  function igHandle(v) {
    var t = String(v || '').trim();
    // a full URL first — otherwise "https" reads as the handle; a typed name
    // with a space in it matches nothing and is shown raw instead
    var m = /instagram\.com\/([A-Za-z0-9._]{2,30})/i.exec(t)
      || /@([A-Za-z0-9._]{2,30})/.exec(t)
      || /^([A-Za-z0-9._]{2,30})$/.exec(t);
    return m ? m[1].replace(/\.+$/, '') : '';
  }
  function igUrl(v) {
    var h = igHandle(v);
    return h ? 'https://www.instagram.com/' + h + '/' : '';
  }

  var stemOf = function (name) {
    var stem = String(name || '').replace(/\.[^.]+$/, '').replace(/[-_ ]?\d+$/, '')
      .replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    return JUNK_STEM.test(stem) || /^\d+$/.test(stem) ? '' : stem;
  };
  var titleCase = function (s2) { return s2.replace(/\b\w/g, function (m2) { return m2.toUpperCase(); }); };

  /* One drop, several people: filenames group it where they can (priya-01,
     priya-02), and anything nameless — dragged straight off a web page — is
     one person, because one drag is one person's pictures. */
  function groupShots(shots) {
    var groups = {}, order = [];
    shots.forEach(function (sh) {
      var k = sh.file ? (stemOf(sh.name) || '_drop') : '_drop';
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(sh);
    });
    return order.map(function (k) {
      return { name: k === '_drop' ? '' : titleCase(k), shots: groups[k] };
    });
  }

  /* Where a drop lands: on a talent card it joins that person, anywhere else
     it becomes new ones. */
  function takeShots(shots, idx) {
    if (!shots.length) { say('Nothing in that drop I could read as a photo.', 'bad'); return; }
    if (idx >= 0 && drafts[idx]) {
      drafts[idx].shots = drafts[idx].shots.concat(shots);
      renderDrafts();
      say(shots.length + ' photo' + (shots.length === 1 ? '' : 's') + ' added to ' +
        esc(drafts[idx].name || 'that card') + '.', 'good');
      return;
    }
    var made = groupShots(shots);
    addDrafts(made);
    renderDrafts();
    say(made.length + (made.length === 1 ? ' talent' : ' talent') + ' staged from ' + shots.length +
      ' photo' + (shots.length === 1 ? '' : 's') + '. Names and cities next, then push.', 'good');
  }

  function moveShot(from, shotIndex, to) {
    var src = drafts[from], dst = drafts[to];
    if (!src || !dst || from === to) return;
    var sh = src.shots.splice(shotIndex, 1)[0];
    if (!sh) return;
    if (src.cover >= src.shots.length) src.cover = 0;
    dst.shots.push(sh);
    renderDrafts();
  }

  var hot = null;
  function setHot(node) {
    if (hot === node) return;
    if (hot) hot.classList.remove('hot');
    hot = node;
    if (hot) hot.classList.add('hot');
  }
  function veil(on) {
    var v = $('#owVeil');
    if (on && !v) {
      v = el('div', 'ow-veil', 'Drop the photos — on a card to add them to that talent, anywhere else to start new ones');
      v.id = 'owVeil';
      panel.appendChild(v);
    } else if (!on && v) { v.parentNode.removeChild(v); }
  }

  function wireDrops() {
    var depth = 0;
    panel.addEventListener('dragenter', function (e) {
      if (!carriesShots(e)) return;
      e.preventDefault();
      depth++;
      if (!e.dataTransfer.types || Array.prototype.indexOf.call(e.dataTransfer.types, SHOT_TYPE) < 0) veil(true);
    });
    panel.addEventListener('dragover', function (e) {
      if (!carriesShots(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setHot(e.target && e.target.closest ? e.target.closest('.ow-card[data-draft], .ow-drop') : null);
    });
    panel.addEventListener('dragleave', function (e) {
      if (!carriesShots(e)) return;
      depth--;
      if (depth <= 0) { depth = 0; veil(false); setHot(null); }
    });
    panel.addEventListener('drop', function (e) {
      if (!carriesShots(e)) return;
      e.preventDefault();
      depth = 0; veil(false);
      var card = e.target && e.target.closest ? e.target.closest('.ow-card[data-draft]') : null;
      setHot(null);
      var moving = '';
      try { moving = e.dataTransfer.getData(SHOT_TYPE); } catch (er) { moving = ''; }
      if (moving && card) {
        var parts = moving.split(':');
        moveShot(+parts[0], +parts[1], +card.getAttribute('data-draft'));
        return;
      }
      if (moving) return;                       // dropped a thumbnail on nothing
      takeShots(shotsFrom(e.dataTransfer), card ? +card.getAttribute('data-draft') : -1);
    });

    document.addEventListener('paste', function (e) {
      if (!panel || panel.hidden || !e.clipboardData) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;     // pasting text into a field is not a photo
      var shots = shotsFrom(e.clipboardData);
      if (!shots.length) return;
      e.preventDefault();
      takeShots(shots, -1);
    });
  }

  /* The tab is really just an explanation plus a picker — the drop works on
     every tab, and on a phone (no dragging) the picker opens the camera roll. */
  function photos(view) {
    var c = el('div', 'ow-card ow-drop',
      '<p class="ow-p" style="margin-bottom:14px"><b>Drop photos anywhere on this panel.</b><br>' +
      'From Finder, Photos, a Files app, another browser tab, a WhatsApp Web thread — files or ' +
      'pictures dragged straight off a page both work. Files named <em>priya-01.jpg</em>, ' +
      '<em>priya-02.jpg</em> group themselves into one person; a set dragged off one page becomes one. ' +
      '⌘V pastes a copied image. Drop onto a card to add to that talent, and drag a thumbnail from one ' +
      'card to another to move it.</p>');
    var pick = el('input'); pick.type = 'file'; pick.multiple = true; pick.accept = 'image/*';
    pick.className = 'ow-in-f';
    pick.onchange = function () {
      takeShots(Array.prototype.slice.call(pick.files).filter(isImageFile).map(function (f) {
        return { file: f, name: f.name || '' };
      }), -1);
      pick.value = '';
    };
    c.appendChild(pick);
    view.appendChild(c);
    renderDrafts();
  }

  /* ── 3. the pipeline: applications, and everyone already on the roster ──
     Ticking a box and publishing is the easy half. The rest of the job is
     opening someone up and correcting what they typed, dropping a picture they
     should not have sent, turning someone down, and — when they ask — erasing
     them and their photographs from the site altogether. All of that lives
     here, because a roster you cannot take someone off is not a roster, it is
     a publication. ── */

  var pendFilter = 'pending';

  function thumb(url, w, h) {
    var img = el('img');
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    // a submission whose upload never completed has a dead URL; show a quiet
    // placeholder rather than a browser's broken-image glyph
    img.onerror = function () { img.style.visibility = 'hidden'; };
    if (url) img.src = url; else img.style.visibility = 'hidden';
    return img;
  }

  function applications(view) {
    var head = el('div', 'ow-card');
    var chips = el('div', 'ow-chips');
    [['pending', 'Waiting'], ['live', 'On the roster'], ['all', 'Everyone']].forEach(function (f) {
      var b = el('button', 'ow-chip' + (pendFilter === f[0] ? ' on' : ''), f[1]);
      b.onclick = function () { pendFilter = f[0]; desk(); };
      chips.appendChild(b);
    });
    head.appendChild(chips);
    var note = el('p', 'ow-p');
    note.style.margin = '12px 0 0';
    note.textContent = 'Loading…';
    head.appendChild(note);
    view.appendChild(head);

    var list = el('div');
    view.appendChild(list);

    api('/admin/api/talents?status=' + pendFilter).then(function (j) {
      if (!j || !j.ok) { note.innerHTML = '<span class="ow-err">' + esc((j && j.error) || 'Could not reach the engine.') + '</span>'; return; }
      pending = j.talents || [];
      if (!pending.length) {
        note.textContent = pendFilter === 'live'
          ? 'Nobody on the roster yet.'
          : pendFilter === 'pending' ? 'Nothing waiting — every application has been dealt with.' : 'Nobody here yet.';
        return;
      }
      note.innerHTML = pending.length + (pendFilter === 'live' ? ' on the roster.' : ' waiting.') +
        ' Tap <b>Open</b> to edit someone, or tick them for the buttons at the bottom.';

      pending.forEach(function (t) {
        var row = el('div', 'ow-card');
        var wrap = el('div', 'ow-pend');
        var box = el('input'); box.type = 'checkbox'; box.value = t.id;
        wrap.appendChild(box);
        wrap.appendChild(thumb(t.cover, 54, 68));
        var meta = el('div');
        meta.style.flex = '1';
        meta.innerHTML = '<b>' + esc(t.name || 'Unnamed') + '</b>' +
          '<div class="ow-meta">' + esc([t.category, t.city].filter(Boolean).join(' · ')) +
          ' · ' + (t.photos || 0) + ' photo' + (t.photos === 1 ? '' : 's') +
          (t.status === 'live' ? ' · <span style="color:#C9A96E">' + esc(String(t.slug || '').toUpperCase()) + ' live</span>' : '') +
          '</div>' +
          (igUrl(t.socials)
            ? '<div class="ow-meta"><a href="' + esc(igUrl(t.socials)) + '" target="_blank" rel="noopener noreferrer" ' +
              'style="color:#C9A96E">@' + esc(igHandle(t.socials)) + ' ↗</a></div>'
            : t.socials
              // something was typed that is not a handle — show it as it came,
              // rather than claiming they never gave one
              ? '<div class="ow-meta">IG: ' + esc(String(t.socials).slice(0, 40)) + '</div>'
              : '<div class="ow-meta" style="color:#e5533d">no Instagram on the application</div>');
        var acts = el('div', 'ow-row');
        acts.style.marginTop = '9px';
        var open = el('button', 'ow-btn', 'Open');
        open.onclick = function () { openTalent(t, open); };
        acts.appendChild(open);
        if (t.status === 'live') {
          var pull = el('button', 'ow-btn no', 'Take off the roster');
          pull.onclick = function () {
            if (!confirm('Take ' + (t.name || 'this talent') + ' off the roster? The card, the profile and their photographs all come down.')) return;
            pull.disabled = true;
            api('/admin/api/remove', { method: 'POST', body: { id: t.id } }).then(function (r) {
              if (r && r.ok) { say(esc(t.name || 'They') + ' is off the roster — the build takes a minute.', 'good'); desk(); }
              else { pull.disabled = false; say('Could not remove: ' + esc((r && r.error) || 'unknown'), 'bad'); }
            });
          };
          acts.appendChild(pull);
        }
        meta.appendChild(acts);
        wrap.appendChild(meta);
        row.appendChild(wrap);
        list.appendChild(row);
      });

      var conf = el('label', '', '<input type="checkbox" id="owC18" /> I confirm every ticked talent is 18 or over');
      conf.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13px;color:#9a9088;margin-top:6px';
      var foot = el('div', 'ow-card');
      foot.appendChild(conf);
      var row2 = el('div', 'ow-row');

      var ticked = function () {
        return $$('.ow-pend input[type=checkbox]', list).filter(function (b) { return b.checked; })
          .map(function (b) { return b.value; });
      };

      var pub = el('button', 'ow-btn go', 'Publish selected');
      pub.onclick = function () {
        var ids = ticked();
        if (!ids.length) return say('Nothing ticked.', 'bad');
        if (!$('#owC18').checked) return say('Confirm they are 18+ first — the roster is adults only.', 'bad');
        pub.disabled = true;
        publish(ids, true).then(function () { pub.disabled = false; desk(); });
      };
      row2.appendChild(pub);

      var rej = el('button', 'ow-btn', 'Turn down');
      rej.onclick = function () {
        var ids = ticked();
        if (!ids.length) return say('Nothing ticked.', 'bad');
        if (!confirm('Turn down ' + ids.length + '? They come out of the pipeline but stay in the database.')) return;
        rej.disabled = true;
        api('/admin/api/reject', { method: 'POST', body: { ids: ids } }).then(function (r) {
          rej.disabled = false;
          say(r && r.ok ? ids.length + ' turned down.' : 'Failed: ' + esc((r && r.error) || ''), r && r.ok ? 'good' : 'bad');
          desk();
        });
      };
      row2.appendChild(rej);

      var del = el('button', 'ow-btn no', 'Delete forever');
      del.onclick = function () {
        var ids = ticked();
        if (!ids.length) return say('Nothing ticked.', 'bad');
        if (!confirm('Erase ' + ids.length + ' completely?\n\nAnyone live comes off the roster, their photographs are deleted from the site, and the record here is destroyed. This cannot be undone.')) return;
        del.disabled = true;
        api('/admin/api/delete', { method: 'POST', body: { ids: ids } }).then(function (r) {
          del.disabled = false;
          if (!r || !r.ok) return say('Failed: ' + esc((r && r.error) || 'unknown'), 'bad');
          var okn = (r.results || []).filter(function (x) { return x.ok; }).length;
          say(okn + ' erased — record, roster entry and photographs.', 'good');
          desk();
        });
      };
      row2.appendChild(del);

      foot.appendChild(row2);
      view.appendChild(foot);
    });
  }

  /* Open one of them on the desk: their whole submission becomes an editable
     card, exactly the same one a dropped photo makes, so there is one way to
     edit a talent rather than two. */
  function openTalent(t, btn) {
    var already = drafts.filter(function (d) { return d.engineId === t.id; })[0];
    if (already) { say('Already open below.', 'good'); renderDrafts(); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Opening…'; }
    api('/admin/api/t/' + encodeURIComponent(t.id)).then(function (j) {
      if (btn) { btn.disabled = false; btn.textContent = 'Open'; }
      if (!j || !j.ok) return say('Could not open: ' + esc((j && j.error) || 'unknown'), 'bad');
      var d = j.talent.data || {};
      var photos = (d.photos || []).map(function (p) { return (typeof p === 'string' ? p : p && p.url); }).filter(Boolean);
      var cover = d.cover_url || photos[0] || '';
      var ordered = cover ? [cover].concat(photos.filter(function (u) { return u !== cover; })) : photos;
      addDrafts([{
        engineId: j.talent.id, status: j.talent.status, code: j.talent.code || '',
        notes: j.talent.notes || '',
        name: d.name || j.talent.name || '', category: (d.category || '').toLowerCase().indexOf('influen') >= 0 ? 'influencer'
          : (d.category || '').toLowerCase().indexOf('act') >= 0 ? 'actor' : 'model',
        based_in: (d.based_in || '').toLowerCase() === 'uae' ? 'uae' : 'india',
        city: d.city || '', work_preferences: d.work_preferences || '',
        stat_height: d.stat_height || '', stat_bust: d.stat_bust || '', stat_waist: d.stat_waist || '',
        stat_high_hip: d.stat_high_hip || '', stat_hips: d.stat_hips || '', stat_shoe: d.stat_shoe || '',
        stat_hair: d.stat_hair || '', stat_eyes: d.stat_eyes || '', stat_skin: d.stat_skin || '',
        gender: d.gender || '', nationality: d.nationality || '',
        socials: d.socials || d.instagram || '',
        tagline: d.tagline || '', about: d.about || '',
        over18: j.talent.status === 'live', photos: ordered
      }]);
      renderDrafts();
      say('<b>' + esc(t.name || 'Opened') + '</b> is open below' +
        (j.talent.status === 'live' ? ' — saving updates the live profile in place.' : ' — edit, then push.'), 'good');
    });
  }

  /* ── staged drafts: the shared review list ─────────────────────────── */
  function addDrafts(list) {
    list.forEach(function (d) {
      // photos reach a draft three ways — dropped/pasted (shots), picked as
      // files, or as URLs in a pasted column — and are all one list from here
      var shots = (d.shots || []).slice();
      (d.files || []).forEach(function (f) { shots.push({ file: f, name: f.name || '' }); });
      (d.photos || []).forEach(function (ph) {
        var u = ph && (ph.url || ph);
        if (u) shots.push({ url: u, name: '' });
      });
      drafts.push({
        name: d.name || '', category: d.category || 'model', based_in: d.based_in || 'india',
        city: d.city || '', work_preferences: d.work_preferences || '',
        stat_height: d.stat_height || '', stat_bust: d.stat_bust || '', stat_waist: d.stat_waist || '',
        stat_hips: d.stat_hips || '', stat_shoe: d.stat_shoe || '', stat_hair: d.stat_hair || '',
        stat_eyes: d.stat_eyes || '', stat_skin: d.stat_skin || '', gender: d.gender || '',
        tagline: d.tagline || '', about: d.about || '',
        nationality: d.nationality || '', notes: d.notes || '', socials: d.socials || '',
        over18: d.over18 === true, shots: shots, cover: 0,
        engineId: d.engineId || '', status: d.status || '', code: d.code || ''
      });
    });
  }

  function problems(d) {
    var errs = [];
    if (!String(d.name).trim()) errs.push('needs a name');
    if (!String(d.city).trim()) errs.push('needs a city');
    if (!d.over18) errs.push('not confirmed 18+');
    if (!d.shots.length) errs.push('no photos');
    var blob = [d.name, d.city, d.about, d.tagline, d.work_preferences].join(' ');
    GUARDS.forEach(function (g) { if (g[0].test(blob)) errs.push('contains ' + g[1]); });
    if (d._err) errs.push('engine refused it: ' + d._err);
    return errs;
  }

  function renderDrafts() {
    var old = $('#owDrafts');
    if (old) old.parentNode.removeChild(old);
    var oldBar = $('#owBar');
    if (oldBar) oldBar.parentNode.removeChild(oldBar);
    if (!drafts.length) return;

    var wrap = el('div'); wrap.id = 'owDrafts';
    wrap.appendChild(el('p', 'ow-h', 'Staged · ' + drafts.length));
    drafts.forEach(function (d, i) {
      var errs = problems(d);
      var c = el('div', 'ow-card' + (errs.length ? ' bad' : ''));
      c.setAttribute('data-draft', i);
      var head = el('div', 'ow-row');
      head.style.marginTop = '0';
      head.innerHTML = '<b style="font-size:15px">' + esc(d.name || 'Talent ' + (i + 1)) + '</b>' +
        (d.status === 'live' ? '<span class="ow-meta" style="color:#C9A96E">' + esc((d.code || '').toUpperCase()) + ' · live</span>'
          : d.engineId ? '<span class="ow-meta">from the pipeline</span>' : '');
      var drop = el('button', 'ow-btn no', d.engineId ? 'Close' : 'Remove');
      drop.title = d.engineId ? 'Close without saving' : 'Take this one off the desk';
      drop.style.marginLeft = 'auto';
      drop.onclick = function () { drafts.splice(i, 1); renderDrafts(); };
      head.appendChild(drop);
      c.appendChild(head);

      var grid = el('div', 'ow-grid');
      FIELDS.forEach(function (f) {
        var box = el('div');
        if (f.big) box.style.gridColumn = '1 / -1';
        box.appendChild(el('label', 'ow-lab', f.label + (f.hint ? ' <span style="text-transform:none;letter-spacing:0">· ' + f.hint + '</span>' : '')));
        if (f.chips) {
          var chips = el('div', 'ow-chips');
          f.chips.forEach(function (v) {
            var b = el('button', 'ow-chip' + (d[f.k] === v ? ' on' : ''), v);
            b.onclick = function () { d[f.k] = v; renderDrafts(); };
            chips.appendChild(b);
          });
          box.appendChild(chips);
        } else {
          var input = el(f.big ? 'textarea' : 'input', f.big ? 'ow-ta' : 'ow-in-f');
          input.value = d[f.k] || '';
          input.oninput = function () { d[f.k] = input.value; d._err = ''; };
          input.onblur = function () { renderDrafts(); };
          box.appendChild(input);
          if (f.k === 'socials' && igUrl(d.socials)) {
            var go = el('a', '', 'Open their Instagram ↗');
            go.href = igUrl(d.socials);
            go.target = '_blank';
            go.rel = 'noopener noreferrer';
            go.style.cssText = 'display:inline-block;margin-top:7px;font-size:12.5px;color:#C9A96E';
            box.appendChild(go);
          }
        }
        grid.appendChild(box);
      });
      c.appendChild(grid);

      // the plates: dropped, pasted, picked or linked — all the same here.
      // Tap one to make it the cover, drag it onto another card to move it.
      var strip = el('div', 'ow-thumbs');
      d.shots.forEach(function (sh, n) {
        var th = el('div', 'ow-th' + (d.cover === n ? ' cover' : ''));
        var img = el('img');
        img.src = sh.file ? URL.createObjectURL(sh.file) : sh.url;
        img.draggable = true;
        img.title = 'Tap to make this the cover · drag to another card to move it';
        img.onclick = function () { d.cover = n; renderDrafts(); };
        img.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData(SHOT_TYPE, i + ':' + n);
          e.dataTransfer.effectAllowed = 'move';
        });
        th.appendChild(img);
        if (d.cover === n) th.appendChild(el('b', '', 'COVER'));
        var x = el('i', '', '×');
        x.title = 'Remove this photo';
        x.onclick = function () {
          d.shots.splice(n, 1);
          if (d.cover >= d.shots.length) d.cover = 0;
          renderDrafts();
        };
        th.appendChild(x);
        strip.appendChild(th);
      });
      c.appendChild(strip);
      c.appendChild(el('p', 'ow-meta', d.shots.length
        ? 'Drop more onto this card to add them.'
        : 'No photos yet — drop some onto this card.'));

      var age = el('label', '', '<input type="checkbox"' + (d.over18 ? ' checked' : '') + ' /> 18 or over');
      age.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13px;color:#9a9088;margin-top:12px';
      age.querySelector('input').onchange = function (e) { d.over18 = e.target.checked; renderDrafts(); };
      c.appendChild(age);

      var nb = el('div');
      nb.appendChild(el('label', 'ow-lab', 'Private note <span style="text-transform:none;letter-spacing:0">· yours only, never published</span>'));
      var nta = el('textarea', 'ow-ta');
      nta.style.minHeight = '54px';
      nta.value = d.notes || '';
      nta.oninput = function () { d.notes = nta.value; };
      nb.appendChild(nta);
      c.appendChild(nb);

      if (errs.length) c.appendChild(el('p', 'ow-err', esc(errs.join(' · '))));
      wrap.appendChild(c);
    });
    body.appendChild(wrap);

    var readyList = drafts.filter(function (d) { return !problems(d).length; });
    var ready = readyList.length;
    var live = readyList.filter(function (d) { return d.status === 'live'; }).length;
    var bar = el('div', 'ow-bar'); bar.id = 'owBar';
    bar.appendChild(el('span', '', ready + ' of ' + drafts.length + ' ready'));
    var push = el('button', 'ow-btn go',
      live === ready && ready ? 'Save ' + ready + ' live profile' + (ready === 1 ? '' : 's')
        : live ? 'Save & publish ' + ready
        : 'Push ' + ready + ' to the roster');
    push.disabled = !ready;
    push.onclick = function () { pushAll(push); };
    bar.appendChild(push);
    panel.appendChild(bar);
  }

  /* ── push: photos up, entries in, then publish ─────────────────────── */
  function upload(fileOrUrl) {
    return new Promise(function (resolve, reject) {
      var fd = new FormData();
      fd.append('file', fileOrUrl);          // Cloudinary takes bytes or a URL to fetch
      fd.append('upload_preset', PRESET);
      fd.append('folder', 'YKS Talents/roster');
      fetch('https://api.cloudinary.com/v1_1/' + CLOUD + '/auto/upload', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) { j && j.secure_url ? resolve(j.secure_url) : reject(new Error((j && j.error && j.error.message) || 'upload failed')); })
        .catch(reject);
    });
  }

  /* A dragged-in URL becomes ours rather than a hotlink: Cloudinary fetches it
     server-side (no CORS in the way), and if that host refuses Cloudinary we
     try to pull the bytes here instead. Only if both fail does the raw URL go
     through — the engine gets one more attempt at it when it commits. */
  function uploadShot(sh) {
    if (sh.file) return upload(sh.file);
    return upload(sh.url).catch(function () {
      return fetch(sh.url, { mode: 'cors' })
        .then(function (r) { if (!r.ok) throw new Error('fetch ' + r.status); return r.blob(); })
        .then(function (b) { return upload(new File([b], 'plate.jpg', { type: b.type || 'image/jpeg' })); })
        .catch(function () { return sh.url; });
    });
  }

  function pushAll(btn) {
    var ready = drafts.filter(function (d) { return !problems(d).length; });
    if (!ready.length) return;
    btn.disabled = true;
    var total = ready.reduce(function (n, d) { return n + d.shots.length; }, 0);
    var done = 0;
    say('Uploading ' + total + ' photo' + (total === 1 ? '' : 's') + '…');

    var chain = Promise.resolve();
    ready.forEach(function (d) {
      chain = chain.then(function () {
        var urls = [];
        var shots = d.shots.slice();
        // cover first — the roster's 01.jpg is the card
        if (d.cover > 0 && shots[d.cover]) shots.unshift(shots.splice(d.cover, 1)[0]);
        var seq = Promise.resolve();
        shots.forEach(function (sh) {
          seq = seq.then(function () {
            return uploadShot(sh).then(function (u) {
              if (u) urls.push(u);
              done++;
              say('Uploading… ' + done + ' / ' + total);
            });
          });
        });
        return seq.then(function () { d._urls = urls; });
      });
    });

    /* One shape for a talent, whichever way they arrived. */
    function payloadOf(d) {
      return {
        name: d.name, category: d.category, based_in: d.based_in, city: d.city,
        work_preferences: d.work_preferences, about: d.about, tagline: d.tagline,
        gender: d.gender, nationality: d.nationality, over18: true, source: d.engineId ? undefined : 'bulk',
        // Private, and the roster build refuses any entry containing it — it
        // exists so he can check who he is putting forward, nothing else. An
        // empty one is left out rather than sent: a save must never be the
        // thing that quietly erases the handle they applied with.
        socials: d.socials || undefined,
        stat_height: d.stat_height, stat_bust: d.stat_bust, stat_waist: d.stat_waist,
        stat_high_hip: d.stat_high_hip, stat_hips: d.stat_hips, stat_shoe: d.stat_shoe,
        stat_hair: d.stat_hair, stat_eyes: d.stat_eyes, stat_skin: d.stat_skin,
        photos: (d._urls || []).map(function (u) { return { url: u }; }),
        cover_url: (d._urls || [])[0] || ''
      };
    }

    var toPublish = [], updated = 0;

    chain.then(function () {
      // 1) anyone who already exists in the engine — an application he opened,
      //    or someone live he is correcting — is an edit, not a new record.
      //    A live one updates in place: same code, same pid, same profile URL,
      //    because that link may already be sitting in a client's inbox.
      var known = ready.filter(function (d) { return d.engineId; });
      var seq = Promise.resolve();
      known.forEach(function (d) {
        seq = seq.then(function () {
          say('Saving ' + esc(d.name || 'talent') + '…');
          return api('/admin/api/t/' + encodeURIComponent(d.engineId), {
            method: 'POST', body: { data: payloadOf(d), notes: d.notes || '' }
          }).then(function (j) {
            if (!j || !j.ok) { d._err = (j && j.error) || 'save failed'; return; }
            d._sent = true;
            if (d.status === 'live') updated++; else toPublish.push(d.engineId);
          });
        });
      });
      return seq;
    }).then(function () {
      // 2) everyone new goes in as one batch
      var fresh = ready.filter(function (d) { return !d.engineId; });
      if (!fresh.length) return null;
      say('Sending ' + fresh.length + ' to the engine…');
      return api('/admin/api/bulk', { method: 'POST', body: { talents: fresh.map(payloadOf) } })
        .then(function (j) {
          if (!j || !j.ok) throw new Error((j && j.error) || 'the engine refused the batch');
          // Clear only what the engine actually took. A refused row stays on the
          // desk with its reason on it — losing a paste to a silent wipe is worse
          // than any error message.
          (j.added || []).forEach(function (a, i) {
            var d = fresh[i];
            if (!d) return;
            if (a.ok) { toPublish.push(a.id); d._sent = true; }
            else d._err = a.error;
          });
          var refused = (j.added || []).filter(function (a) { return !a.ok; });
          if (refused.length) {
            say(refused.map(function (a) { return esc(a.name) + ' — ' + esc(a.error); }).join('<br>'), 'bad');
          }
          return null;
        });
    }).then(function () {
      drafts = drafts.filter(function (d) { return !d._sent; });
      renderDrafts();
      if (toPublish.length) return publish(toPublish, true);
      if (updated) say(updated + ' live profile' + (updated === 1 ? '' : 's') +
        ' updated — the build republishes them in a minute.', 'good');
      return null;
    }).then(function () {
      btn.disabled = false;
    }).catch(function (e) {
      say('Stopped: ' + esc(e.message || e), 'bad');
      btn.disabled = false;
    });
  }

  function publish(ids, confirm18) {
    say('Publishing ' + ids.length + ' to the roster — committing plates and roster.json…');
    return api('/admin/api/publish', { method: 'POST', body: { ids: ids, confirm18: !!confirm18 } })
      .then(function (j) {
        if (!j || !j.ok) { say('Publish failed: ' + esc((j && j.error) || 'unknown'), 'bad'); return null; }
        var ok = (j.results || []).filter(function (r) { return r.ok; });
        var bad = (j.results || []).filter(function (r) { return !r.ok; });
        var lines = [];
        if (ok.length) {
          lines.push('<b>' + ok.length + ' on the roster</b> as ' +
            ok.map(function (r) { return r.code.toUpperCase(); }).join(', ') +
            '. The build runs on the commit; the cards are live in a couple of minutes.');
        }
        bad.forEach(function (r) { lines.push('✗ ' + esc(r.error)); });
        say(lines.join('<br>'), bad.length ? 'bad' : 'good');
        return ok;
      });
  }

  /* ── ways in ───────────────────────────────────────────────────────── */
  function maybeOpen() {
    if (location.hash === '#owner' || /[?&]owner=1/.test(location.search)) open();
  }
  maybeOpen();
  window.addEventListener('hashchange', maybeOpen);

  // five taps on the roster kicker — no visible affordance, nothing to find
  var kicker = $('.tal-kicker');
  if (kicker) {
    var taps = 0, timer = null;
    kicker.addEventListener('click', function () {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 1200);
      if (taps >= 5) { taps = 0; open(); }
    });
  }
  window.YKS_OWNER = { open: open };
})();
