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
    { k: 'work_preferences', label: 'Works in', hint: 'Fashion, Editorial, Commercial' },
    { k: 'stat_height', label: 'Height' },
    { k: 'stat_bust', label: 'Bust' },
    { k: 'stat_waist', label: 'Waist' },
    { k: 'stat_hips', label: 'Hips' },
    { k: 'stat_shoe', label: 'Shoe' },
    { k: 'stat_hair', label: 'Hair' },
    { k: 'stat_eyes', label: 'Eyes' },
    { k: 'stat_skin', label: 'Skin' },
    { k: 'gender', label: 'Gender' },
    { k: 'tagline', label: 'One line', hint: 'the roster card line' },
    { k: 'about', label: 'Bio', big: true }
  ];

  /* Column headings people actually type, in sheets and in WhatsApp. */
  var ALIASES = {
    name: ['name', 'full name', 'talent', 'model', 'talent name'],
    category: ['category', 'cat', 'type', 'kind'],
    based_in: ['region', 'based in', 'country', 'based'],
    city: ['city', 'location', 'base', 'town'],
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
    [['paste', 'Paste rows'], ['photos', 'Photos'], ['pending', 'Applications']].forEach(function (t) {
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

  /* ── 2. photos first: drop the pile, group it, fill in the few fields ── */
  function photos(view) {
    var c = el('div', 'ow-card',
      '<p class="ow-p">Drop everyone\'s photos at once. Files named <em>priya-01.jpg</em>, <em>priya-02.jpg</em> ' +
      'group themselves; anything else you can re-group below. First photo of each group is the cover.</p>');
    var pick = el('input'); pick.type = 'file'; pick.multiple = true; pick.accept = 'image/*';
    pick.className = 'ow-in-f';
    c.appendChild(pick);
    var strip = el('div', 'ow-thumbs');
    c.appendChild(strip);
    var row = el('div', 'ow-row');
    var go = el('button', 'ow-btn go', 'Make talent from these');
    go.disabled = true;
    row.appendChild(go);
    c.appendChild(row);
    view.appendChild(c);

    var files = [];
    pick.onchange = function () {
      files = Array.prototype.slice.call(pick.files);
      strip.innerHTML = '';
      var groups = {};
      files.forEach(function (f) {
        var stem = f.name.replace(/\.[^.]+$/, '').replace(/[-_ ]?\d+$/, '').trim().toLowerCase() || 'group';
        (groups[stem] = groups[stem] || []).push(f);
      });
      var names = Object.keys(groups);
      files.forEach(function (f, i) {
        var stem = f.name.replace(/\.[^.]+$/, '').replace(/[-_ ]?\d+$/, '').trim().toLowerCase() || 'group';
        var th = el('div', 'ow-th');
        var img = el('img');
        img.src = URL.createObjectURL(f);
        th.appendChild(img);
        var sel = el('select');
        names.forEach(function (n) {
          var o = el('option', '', n.slice(0, 12));
          o.value = n;
          if (n === stem) o.selected = true;
          sel.appendChild(o);
        });
        sel.onchange = function () { f._group = sel.value; };
        f._group = stem;
        th.appendChild(sel);
        strip.appendChild(th);
      });
      go.disabled = !files.length;
    };

    go.onclick = function () {
      var byGroup = {};
      files.forEach(function (f) { (byGroup[f._group] = byGroup[f._group] || []).push(f); });
      var made = Object.keys(byGroup).map(function (g) {
        return {
          name: g.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }),
          files: byGroup[g]
        };
      });
      addDrafts(made);
      renderDrafts();
      say(made.length + ' talent staged from ' + files.length + ' photos. Fill in the fields, then push.', 'good');
    };
    renderDrafts();
  }

  /* ── 3. the applications already in the engine ─────────────────────── */
  function applications(view) {
    var c = el('div', 'ow-card', '<p class="ow-p">Loading the pipeline…</p>');
    view.appendChild(c);
    api('/admin/api/talents?status=pending').then(function (j) {
      if (!j || !j.ok) { c.innerHTML = '<p class="ow-err">' + esc((j && j.error) || 'Could not reach the engine.') + '</p>'; return; }
      pending = j.talents || [];
      c.innerHTML = pending.length
        ? '<p class="ow-p">' + pending.length + ' waiting. Tick the ones going on the roster.</p>'
        : '<p class="ow-p">Nothing pending — every application has been dealt with.</p>';
      pending.forEach(function (t) {
        var row = el('div', 'ow-card');
        var wrap = el('div', 'ow-pend');
        var box = el('input'); box.type = 'checkbox'; box.value = t.id;
        wrap.appendChild(box);
        var img = el('img');
        if (t.cover) img.src = t.cover;
        wrap.appendChild(img);
        wrap.appendChild(el('div', '',
          '<b>' + esc(t.name || 'Unnamed') + '</b>' +
          '<div class="ow-meta">' + esc([t.category, t.city].filter(Boolean).join(' · ')) +
          ' · ' + (t.photos || 0) + ' photo' + (t.photos === 1 ? '' : 's') + '</div>'));
        row.appendChild(wrap);
        c.appendChild(row);
      });
      if (!pending.length) return;
      var conf = el('label', '', '<input type="checkbox" id="owC18" /> I confirm every ticked talent is 18 or over');
      conf.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13px;color:#9a9088;margin-top:12px';
      c.appendChild(conf);
      var row = el('div', 'ow-row');
      var go = el('button', 'ow-btn go', 'Publish selected');
      go.onclick = function () {
        // only the rows — the 18+ confirmation is a checkbox too, and its
        // default value ("on") would otherwise be sent as a talent id
        var ids = $$('.ow-pend input[type=checkbox]', c).filter(function (b) { return b.checked && b.value; })
          .map(function (b) { return b.value; });
        if (!ids.length) return say('Nothing ticked.', 'bad');
        if (!$('#owC18').checked) return say('Confirm they are 18+ first — the roster is adults only.', 'bad');
        go.disabled = true; go.textContent = 'Publishing…';
        publish(ids, true).then(function () { go.disabled = false; go.textContent = 'Publish selected'; desk(); });
      };
      row.appendChild(go);
      c.appendChild(row);
    });
  }

  /* ── staged drafts: the shared review list ─────────────────────────── */
  function addDrafts(list) {
    list.forEach(function (d) {
      drafts.push({
        name: d.name || '', category: d.category || 'model', based_in: d.based_in || 'india',
        city: d.city || '', work_preferences: d.work_preferences || '',
        stat_height: d.stat_height || '', stat_bust: d.stat_bust || '', stat_waist: d.stat_waist || '',
        stat_hips: d.stat_hips || '', stat_shoe: d.stat_shoe || '', stat_hair: d.stat_hair || '',
        stat_eyes: d.stat_eyes || '', stat_skin: d.stat_skin || '', gender: d.gender || '',
        tagline: d.tagline || '', about: d.about || '',
        over18: false, files: d.files || [], photos: d.photos || [], cover: 0
      });
    });
  }

  function problems(d) {
    var errs = [];
    if (!String(d.name).trim()) errs.push('needs a name');
    if (!String(d.city).trim()) errs.push('needs a city');
    if (!d.over18) errs.push('not confirmed 18+');
    if (!(d.files.length + d.photos.length)) errs.push('no photos');
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
      var head = el('div', 'ow-row');
      head.style.marginTop = '0';
      head.innerHTML = '<b style="font-size:15px">' + esc(d.name || 'Talent ' + (i + 1)) + '</b>';
      var drop = el('button', 'ow-btn no', 'Remove');
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
        }
        grid.appendChild(box);
      });
      c.appendChild(grid);

      // photos: local files (upload on push) and/or URLs already on the web
      var strip = el('div', 'ow-thumbs');
      d.files.forEach(function (f, n) {
        var th = el('div', 'ow-th' + (d.cover === n ? ' cover' : ''));
        var img = el('img'); img.src = URL.createObjectURL(f);
        img.onclick = function () { d.cover = n; renderDrafts(); };
        th.appendChild(img);
        if (d.cover === n) th.appendChild(el('b', '', 'COVER'));
        strip.appendChild(th);
      });
      d.photos.forEach(function (p) {
        var th = el('div', 'ow-th');
        var img = el('img'); img.src = p.url || p;
        th.appendChild(img);
        strip.appendChild(th);
      });
      c.appendChild(strip);

      var add = el('input'); add.type = 'file'; add.multiple = true; add.accept = 'image/*';
      add.className = 'ow-in-f'; add.style.marginTop = '10px';
      add.onchange = function () {
        d.files = d.files.concat(Array.prototype.slice.call(add.files));
        renderDrafts();
      };
      c.appendChild(add);

      var age = el('label', '', '<input type="checkbox"' + (d.over18 ? ' checked' : '') + ' /> 18 or over');
      age.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13px;color:#9a9088;margin-top:12px';
      age.querySelector('input').onchange = function (e) { d.over18 = e.target.checked; renderDrafts(); };
      c.appendChild(age);

      if (errs.length) c.appendChild(el('p', 'ow-err', esc(errs.join(' · '))));
      wrap.appendChild(c);
    });
    body.appendChild(wrap);

    var ready = drafts.filter(function (d) { return !problems(d).length; }).length;
    var bar = el('div', 'ow-bar'); bar.id = 'owBar';
    bar.appendChild(el('span', '', ready + ' of ' + drafts.length + ' ready'));
    var push = el('button', 'ow-btn go', 'Push ' + ready + ' to the roster');
    push.disabled = !ready;
    push.onclick = function () { pushAll(push); };
    bar.appendChild(push);
    panel.appendChild(bar);
  }

  /* ── push: photos up, entries in, then publish ─────────────────────── */
  function upload(file) {
    return new Promise(function (resolve, reject) {
      var fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', PRESET);
      fd.append('folder', 'YKS Talents/roster');
      fetch('https://api.cloudinary.com/v1_1/' + CLOUD + '/auto/upload', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) { j && j.secure_url ? resolve(j.secure_url) : reject(new Error('upload failed')); })
        .catch(reject);
    });
  }

  function pushAll(btn) {
    var ready = drafts.filter(function (d) { return !problems(d).length; });
    if (!ready.length) return;
    btn.disabled = true;
    var total = ready.reduce(function (n, d) { return n + d.files.length; }, 0);
    var done = 0;
    say('Uploading ' + total + ' photo' + (total === 1 ? '' : 's') + '…');

    var chain = Promise.resolve();
    ready.forEach(function (d) {
      chain = chain.then(function () {
        var urls = d.photos.map(function (p) { return p.url || p; });
        var files = d.files.slice();
        // cover first — the roster's 01.jpg is the card
        if (d.cover > 0 && files[d.cover]) files.unshift(files.splice(d.cover, 1)[0]);
        var seq = Promise.resolve();
        files.forEach(function (f) {
          seq = seq.then(function () {
            return upload(f).then(function (u) {
              urls.push(u);
              done++;
              say('Uploading… ' + done + ' / ' + total);
            });
          });
        });
        return seq.then(function () { d._urls = urls; });
      });
    });

    chain.then(function () {
      say('Sending ' + ready.length + ' to the engine…');
      var payload = ready.map(function (d) {
        return {
          name: d.name, category: d.category, based_in: d.based_in, city: d.city,
          work_preferences: d.work_preferences, about: d.about, tagline: d.tagline,
          gender: d.gender, over18: true, source: 'bulk',
          stat_height: d.stat_height, stat_bust: d.stat_bust, stat_waist: d.stat_waist,
          stat_hips: d.stat_hips, stat_shoe: d.stat_shoe, stat_hair: d.stat_hair,
          stat_eyes: d.stat_eyes, stat_skin: d.stat_skin,
          photos: (d._urls || []).map(function (u) { return { url: u }; }),
          cover_url: (d._urls || [])[0] || ''
        };
      });
      return api('/admin/api/bulk', { method: 'POST', body: { talents: payload } });
    }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'the engine refused the batch');
      // Clear only what the engine actually took. A refused row stays on the
      // desk with its reason on it — losing a paste to a silent wipe is worse
      // than any error message.
      var ids = [];
      (j.added || []).forEach(function (a, i) {
        var d = ready[i];
        if (!d) return;
        if (a.ok) { ids.push(a.id); d._sent = true; }
        else d._err = a.error;
      });
      drafts = drafts.filter(function (d) { return !d._sent; });
      renderDrafts();
      var refused = (j.added || []).filter(function (a) { return !a.ok; });
      if (refused.length) {
        say(refused.map(function (a) { return esc(a.name) + ' — ' + esc(a.error); }).join('<br>'), 'bad');
      }
      if (!ids.length) { btn.disabled = false; return null; }
      return publish(ids, true);
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
