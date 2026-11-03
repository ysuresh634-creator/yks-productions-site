/* YKS enquiry forms → the YKS Apps Script web app (sheet + email to Yedukrishna).
   Shared by every landing-page form here, the homepage booking form and waitlist (main.js)
   and the quote assistant (quote.html) via window.YKSEnquiry.
   A form only says "sent" when the server answers {ok:true}; anything else — an error,
   a timeout, an old deployment — shows the failure and a WhatsApp button with the brief
   already written, so nothing a client types is ever silently lost. */
(function () {
  var URL_ = 'https://script.google.com/macros/s/AKfycbz_36FeQLa2AsN-GzlYZWhT-VgqQ9UabIogrysT_5eHl-tZWbpNAkZhg26S3E2l3QRp/exec';
  var WA_AE = '971501955122', WA_IN = '919746679720';
  var t0 = Date.now() - ((window.performance && performance.now && performance.now()) || 0);

  /* Pages marked <body data-wa-geo> pick the WhatsApp line by where the visitor is,
     the same rule chat.js uses: India / South Asia → the India number, Gulf → Dubai.
     The static HTML keeps the Dubai number, so without JS nothing changes. */
  function geoNum() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (/Kolkata|Calcutta|Colombo|Kathmandu|Dhaka/i.test(tz)) return WA_IN;
    if (/Dubai|Muscat|Qatar|Riyadh|Bahrain|Kuwait/i.test(tz)) return WA_AE;
    return '';
  }
  // A single link can opt in too (<a data-wa-geo>), e.g. the homepage hero button.
  var b = document.body, g = geoNum();
  if (g && b) {
    var whole = b.hasAttribute('data-wa-geo');
    if (whole) b.setAttribute('data-wa', g);
    document.querySelectorAll(whole ? 'a[href*="wa.me/' + WA_AE + '"], a[href*="wa.me/' + WA_IN + '"]' : 'a[data-wa-geo]').forEach(function (a) {
      a.href = a.href.replace(/wa\.me\/(971501955122|919746679720)/, 'wa.me/' + g);
    });
  }
  function pageNum() {
    var a = document.querySelector('a[href*="wa.me/"]');
    return (b && b.getAttribute('data-wa')) || (a && (a.href.match(/wa\.me\/(\d+)/) || [])[1]) || WA_AE;
  }
  function waUrl(num, text) { return 'https://wa.me/' + (num || pageNum()) + '?text=' + encodeURIComponent(String(text || '').slice(0, 1800)); }

  // an invisible field people never fill — bots do
  function honeypot(form) {
    if (!form || form.querySelector('input[name="website"]')) return;
    var w = document.createElement('div');
    w.setAttribute('aria-hidden', 'true');
    w.style.cssText = 'position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden';
    w.innerHTML = '<label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
    form.appendChild(w);
  }

  /* send(fields, meta) → Promise that resolves with the server's JSON only on {ok:true};
     rejects with an Error whose .userMessage is safe to show (or empty). */
  function send(fields, meta) {
    meta = meta || {};
    var hp = meta.form_el && meta.form_el.querySelector('input[name="website"]');
    var body = {
      kind: 'enquiry',
      fields: fields,
      meta: {
        form: meta.form || 'landing',
        source: meta.source || '',
        subject: meta.subject || '',
        page: location.href.slice(0, 500),
        found_via: (window.YKSSource && window.YKSSource.label && window.YKSSource.label()) || '',
        talent: !!meta.talent,
        category: meta.category || '',
        ai: meta.ai || null,
        confirmed: meta.confirmed || '',
        seconds_on_page: Math.round((Date.now() - t0) / 1000),
        website: hp ? hp.value : ''
      }
    };
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
    // text/plain keeps this a "simple" request (no CORS preflight, which Apps Script can't answer)
    return fetch(URL_, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        clearTimeout(timer);
        if (j && j.ok === true) return j;
        var err = new Error((j && j.error) || 'failed');
        // only trust the wording when the enquiry branch wrote it (an old deployment speaks about applications)
        err.userMessage = (j && j.kind === 'enquiry' && j.message) || '';
        throw err;
      }, function (e) { clearTimeout(timer); throw e; });
  }

  /* The failure panel: says plainly it did NOT arrive, and hands over WhatsApp with the brief typed. */
  var cssDone = false;
  function failBox(anchor, text, num, why) {
    if (!cssDone) {
      cssDone = true;
      var st = document.createElement('style');
      st.textContent = '.yks-fail{margin:16px 0 0;padding:14px 16px;border:1px solid rgba(255,140,59,.55);border-radius:12px;background:rgba(255,140,59,.08);color:var(--paper,#f4ede2);font-size:.95rem;line-height:1.5;text-align:left}'
        + '.yks-fail b{color:#ff8c3b}.yks-fail a.yks-fail-wa{display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:11px 18px;border-radius:999px;background:#25D366;color:#07060a;font-weight:600;text-decoration:none}'
        + '.yks-fail a.yks-fail-wa:hover{filter:brightness(1.06)}';
      document.head.appendChild(st);
    }
    var box = anchor.parentNode.querySelector('.yks-fail[data-for="' + (anchor.id || anchor.className) + '"]');
    if (!box) {
      box = document.createElement('div');
      box.className = 'yks-fail'; box.setAttribute('role', 'alert'); box.setAttribute('data-for', anchor.id || anchor.className);
      anchor.insertAdjacentElement('afterend', box);
    }
    box.innerHTML = '<b>Your message didn’t reach me.</b> ' + (why ? esc(why) + ' ' : '')
      + 'Nothing went through, so please send it on WhatsApp instead — it’s already written for you.<br>'
      + '<a class="yks-fail-wa" target="_blank" rel="noopener" href="' + waUrl(num, text) + '">Send on WhatsApp →</a>';
    box.style.display = 'block';
    return box;
  }
  function clearFail(anchor) { var x = anchor.parentNode.querySelector('.yks-fail'); if (x) x.style.display = 'none'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ── Client or talent? ──────────────────────────────────────────────────────
     Before sending, the message goes to the yks-chat worker (/classify): an AI read plus
     keyword rules. Only a confident "talent" verdict changes anything for the visitor — they
     see the free YKS Talents application, with a one-tap "No, I'm a client". The enquiry is
     ALWAYS saved either way, and the Apps Script re-checks the verdict itself. Any doubt,
     error or timeout → it's sent as a client enquiry, exactly as before. */
  var CLS_URL = ((window.YKS_CHAT_ENDPOINT || 'https://yks-chat.ysuresh634.workers.dev').replace(/\/+$/, '')) + '/classify';
  // same rules as the worker and the Apps Script (keep the three in step)
  var R_TALENT = /\b(i\s*(am|'m)\s*(a\s*)?model|aspiring\s+(model|actor|actress)|wann?a\s+(be\s+a\s+)?model|want\s+to\s+(be\s+a\s+|become\s+a\s+)?(model|act)|tryna\s+get\s+into\s+model|get\s+into\s+(modell?ing|acting)|modell?ing\s+(career|opportunit|work\s+for\s+me)|acting\s+(opportunit|chance|career|role)|become\s+a\s+(model|actor|actress)|join\s+(the\s+|your\s+)?(talent|roster|board)|talent\s+board|apply\s+(as|to\s+be)\s+(a\s+)?model|casting\s+for\s+me|my\s+(own\s+)?(model(l?ing)?\s+)?portfolio|portfolio\s+(photo|shoot)s?\s+(for\s+)?(me|myself)|intern(ship)?|assist\s+you|work\s+(with|for|under)\s+you|model\s+(aakanam|aakan|aagan|aaganum|banna|banana|banni)|modell?ing\s+(karni|karna|cheyyan|pannanum)|kaam\s+chahiye|chance\s+(venam|venum|chahiye|do|kodukkumo)|nadikk?an|nadikka\s+(chance|vaaipu))\b/i;
  var R_SEEKER = /\b(runway|ramp\s*walk|fresher|freshers|men'?s\s+fashion\s+model|male\s+model\s+here|as\s+a\s+model|be\s+a\s+model|a\s+model\s+(here|for\s+you|with\s+you)|(i\s*am|i'?m|myself|me\s+as)\b[^.!?]{0,30}\b(model|actor|actress))\b/i;
  var R_BRAND = /\b(brand|company|client|campaign|product|catalog(ue)?|e-?com(merce)?|agency|production|label|store|shop|cafe|restaurant|startup|business|our|we|us|team|launch|drop|ad\s*film|tvc|hotel|event|wedding|property|villa|apne|ente|enga|namma)\b/i;
  var R_INJECT = /\b(ignore|disregard|forget)\b[^.]{0,40}\b(instruction|prompt|rule|above|previous)|\b(classify|label|mark|categori[sz]e)\b[^.]{0,30}\bas\b|\bsystem\s*prompt\b|\byou\s+are\s+now\b|"type"\s*:/i;
  function rules(text) {
    if (!text) return 'none';
    if (R_TALENT.test(text) || R_SEEKER.test(text)) return 'talent';
    if (/\bportfolio\b/i.test(text) && !R_BRAND.test(text)) return 'talent';
    return R_BRAND.test(text) ? 'client' : 'none';
  }
  function ruleText(f) { return [f.message, f.company, f.service, f.needs].filter(Boolean).join(' '); }

  /* classify(fields, meta) → Promise that never rejects:
     { route: 'talent'|'client', category: 'talent'|'client'|'other', rules, ai: {status, type, confidence, reason, model, unsure} } */
  function classify(fields, meta) {
    var text = ruleText(fields), r = rules(text), brand = R_BRAND.test(text), injected = R_INJECT.test(fields.message || '');
    var fallback = function (status) { return { route: 'client', category: 'client', rules: r, ai: { status: status, unsure: true } }; };
    if (!window.fetch || !String(fields.message || '').trim()) return Promise.resolve(fallback('skipped'));
    var ctl = window.AbortController ? new AbortController() : null, done = false;
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { if (done) return; done = true; if (ctl) ctl.abort(); resolve(fallback('timeout')); }, 6000);
      fetch(CLS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined,
        body: JSON.stringify({ message: String(fields.message || '').slice(0, 1500), page: location.pathname, form: (meta && meta.form) || '',
          fields: { name: fields.name || '', service: fields.service || fields.project_type || '', company: fields.company || '', needs: fields.needs || '' } }) })
        .then(function (res) { return res.json().then(function (j) { j._http = res.status; return j; }); })
        .then(function (j) {
          if (done) return; done = true; clearTimeout(timer);
          var ok = j && j.ok === true && /^(client|talent|other)$/.test(j.type) && typeof j.confidence === 'number' && j.confidence >= 0 && j.confidence <= 1;
          if (!ok) return resolve(fallback(j && j._http === 429 ? 'rate_limited' : (j && j.error === 'timeout' ? 'timeout' : 'failed')));
          var c = j.confidence, cat = 'client', unsure = true;
          // the same gate as the worker and the Apps Script — the browser re-checks rather than trusting a "route" field
          if (j.type === 'talent') {
            if (!injected && !(brand && r !== 'talent') && c >= (r === 'talent' ? 0.7 : 0.85)) { cat = 'talent'; unsure = false; }
          } else if (j.type === 'other') { if (c >= 0.8) { cat = 'other'; unsure = false; } }
          else unsure = c < 0.6 || r === 'talent';
          if (j.route === 'client' && cat === 'talent') { cat = 'client'; unsure = true; }  // the worker was stricter — go with it
          resolve({ route: cat === 'talent' ? 'talent' : 'client', category: cat, rules: r,
            ai: { status: 'ok', type: j.type, confidence: c, reason: String(j.reason || '').slice(0, 120), model: String(j.model || '').slice(0, 40), unsure: unsure } });
        })
        .catch(function () { if (done) return; done = true; clearTimeout(timer); resolve(fallback('failed')); });
    });
  }

  var panelCss = false;
  function talentPanel(anchor) {
    if (!panelCss) {
      panelCss = true;
      var st = document.createElement('style');
      st.textContent = '.yks-tp{margin:16px 0 0;padding:18px 18px 16px;border:1px solid rgba(201,168,106,.55);border-radius:14px;background:rgba(201,168,106,.08);color:var(--paper,#f4ede2);text-align:left;line-height:1.5}'
        + '.yks-tp h3{margin:0 0 6px;font-size:1.1rem;line-height:1.35;color:inherit}.yks-tp p{margin:0 0 12px;font-size:.93rem;opacity:.88}'
        + '.yks-tp .yks-tp-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}'
        + '.yks-tp a.yks-tp-apply{display:inline-flex;align-items:center;padding:12px 20px;border-radius:999px;background:#c9a86a;color:#07060a;font-weight:600;text-decoration:none}'
        + '.yks-tp button.yks-tp-client{padding:11px 16px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:.92rem;cursor:pointer;opacity:.9}'
        + '.yks-tp button.yks-tp-client[disabled]{opacity:.5;cursor:default}.yks-tp small{display:block;margin-top:10px;opacity:.7;font-size:.82rem}';
      document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.className = 'yks-tp'; box.setAttribute('role', 'status');
    box.innerHTML = '<h3>Looks like you’d like to join YKS Talents as talent — apply here (free, no fees)</h3>'
      + '<p>YKS Talents is a 100% free portfolio platform for models, influencers, content creators and actors aged 18–34. Brands and clients browse it to find and book talent, with bookings arranged through me. There are no fees, ever, and no jobs are offered or promised.</p>'
      + '<div class="yks-tp-row"><a class="yks-tp-apply" href="/talents/apply.html?from=enquiry">Apply to YKS Talents →</a>'
      + '<button type="button" class="yks-tp-client">No, I’m a client — send my enquiry</button></div>'
      + '<small>Your message has been saved either way.</small>';
    anchor.insertAdjacentElement('afterend', box);
    return box;
  }

  /* submit(fields, meta, ui) — classify, then send. ui: {
       anchor   element the talent panel goes after,
       hide     [elements] to hide while the panel shows (restored if they say they're a client),
       brief, num  for the WhatsApp failure box,
       onSent(json, {possibleTalent}), onFail(err), onPanel() } */
  function submit(fields, meta, ui) {
    meta = meta || {}; ui = ui || {};
    var noop = function () {};
    var onSent = ui.onSent || noop, onFail = ui.onFail || noop;
    var skip = /\/talents\/apply/.test(location.pathname) || meta.form === 'waitlist';
    (skip ? Promise.resolve({ route: 'client', category: 'client', rules: 'none', ai: { status: 'skipped' } }) : classify(fields, meta)).then(function (v) {
      // tell js/smart.js what the classifier decided — category + service label only, never the message
      if (!skip) try { window.dispatchEvent(new CustomEvent('yks:classified', { detail: { category: v.category, route: v.route, service: String((fields && (fields.service || fields.type)) || '').slice(0, 60) } })); } catch (e) {}
      var withMeta = function (extra) { var m = {}, k; for (k in meta) m[k] = meta[k]; for (k in extra) m[k] = extra[k]; return m; };
      var keywordTalent = v.rules === 'talent' && v.route !== 'talent';
      if (v.route !== 'talent' || !ui.anchor) {
        return send(fields, withMeta({ category: v.category, ai: v.ai, talent: keywordTalent || (v.route === 'talent') }))
          .then(function (j) { onSent(j, { possibleTalent: keywordTalent || v.route === 'talent' }); }, onFail);
      }
      // talent: save it now (as Talent) and offer the application, with the client override
      var bg = send(fields, withMeta({ category: 'talent', ai: v.ai, talent: true }));
      var hidden = (ui.hide || []).filter(Boolean);
      hidden.forEach(function (el) { el.setAttribute('data-yks-tp-hidden', el.style.display || ''); el.style.display = 'none'; });
      var panel = talentPanel(ui.anchor);
      (ui.onPanel || noop)();
      if (window.gtag) gtag('event', 'enquiry_routed_talent', { form: meta.form || '' });
      bg.catch(function (err) { failBox(panel, ui.brief || '', ui.num, err && err.userMessage); });
      var btn = panel.querySelector('.yks-tp-client');
      btn.addEventListener('click', function () {
        btn.disabled = true; btn.textContent = 'Sending…';
        var again = function () { return send(fields, withMeta({ category: 'client', confirmed: 'client', ai: v.ai, talent: true })); };
        bg.then(again, again).then(function (j) {
          panel.remove();
          hidden.forEach(function (el) { el.style.display = el.getAttribute('data-yks-tp-hidden'); el.removeAttribute('data-yks-tp-hidden'); });
          onSent(j, { possibleTalent: false, confirmed: true });
        }, function (err) {
          panel.remove();
          hidden.forEach(function (el) { el.style.display = el.getAttribute('data-yks-tp-hidden'); el.removeAttribute('data-yks-tp-hidden'); });
          onFail(err);
        });
      });
    });
  }

  window.YKSEnquiry = { url: URL_, send: send, submit: submit, classify: classify, rules: rules, failBox: failBox, clearFail: clearFail, honeypot: honeypot, waUrl: waUrl, pageNum: pageNum, geoNum: geoNum };
})();

/* Landing-page forms (form.l-form) */
(function () {
  var APPLY = '/talents/apply.html';
  /* Every message is sent. Client or talent is decided by YKSEnquiry.submit (AI + rules, above);
     a confident "talent" sees the free application with a "No, I'm a client" button. */
  var onApply = /\/talents\//.test(location.pathname);
  var E = window.YKSEnquiry;
  document.querySelectorAll('form.l-form').forEach(function (form) {
    if (!onApply && !form.parentNode.querySelector('.l-form-talent')) {
      var p = document.createElement('p');
      p.className = 'l-form-talent';
      p.style.cssText = 'margin:.9em 0 0;font-size:.9em;opacity:.85';
      p.innerHTML = 'Looking to model? <a href="' + APPLY + '">Create your free portfolio →</a>';
      form.insertAdjacentElement('afterend', p);
    }
    E.honeypot(form);
    try {
      var tq = new URLSearchParams(location.search).get('talent'), mt = form.querySelector('[name="message"]');
      if (tq && mt && !mt.value && form.querySelector('[name="company"]')) mt.value = 'Talent from your roster: ' + tq.replace(/[^A-Za-z0-9,\s-]/g, '').slice(0, 80) + '. ';
    } catch (er) {}
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      if (!get('name') || !get('contact')) return;
      var coEl = form.querySelector('[name="company"]'), ptEl = form.querySelector('[name="project_type"]');
      if (coEl && get('company').replace(/[^A-Za-z0-9]/g, '').length < 2) { coEl.setCustomValidity('Add your company or brand name.'); coEl.reportValidity(); coEl.addEventListener('input', function () { coEl.setCustomValidity(''); }, { once: true }); return; }
      var blEl = form.querySelector('[name="brand_link"]'), bl = get('brand_link');
      if (blEl && (bl.replace(/[^A-Za-z0-9]/g, '').length < 3 || !(/\./.test(bl) || /^@/.test(bl) || /instagram/i.test(bl)))) { blEl.setCustomValidity('Add your brand website (yourbrand.com) or Instagram (@yourbrand).'); blEl.reportValidity(); blEl.addEventListener('input', function () { blEl.setCustomValidity(''); }, { once: true }); return; }
      if (ptEl && !get('project_type')) { ptEl.setCustomValidity('Choose the project type.'); ptEl.reportValidity(); ptEl.addEventListener('change', function () { ptEl.setCustomValidity(''); }, { once: true }); return; }
      var minMsg = +(form.dataset.minmsg || 0), mEl = form.querySelector('[name="message"]');
      if (minMsg && get('message').length < minMsg) { if (mEl) { mEl.setCustomValidity('Tell me a little more — at least ' + minMsg + ' characters.'); mEl.reportValidity(); mEl.addEventListener('input', function () { mEl.setCustomValidity(''); }, { once: true }); } return; }
      if (get('message').length > 5000 && mEl) { mEl.setCustomValidity('Please keep it under 5000 characters.'); mEl.reportValidity(); mEl.addEventListener('input', function () { mEl.setCustomValidity(''); }, { once: true }); return; }

      var fields = { name: get('name'), contact: get('contact'), email: get('email'), message: get('message') };
      if (coEl) fields.company = get('company');
      if (blEl) fields.brand_link = bl;
      if (ptEl) fields.project_type = get('project_type');
      var brief = 'Hi Yedukrishna, I tried the form on your site (' + (form.dataset.source || document.title) + ').\n'
        + 'Name: ' + fields.name + '\nContact: ' + fields.contact + (fields.email ? '\nEmail: ' + fields.email : '')
        + (fields.company ? '\nCompany: ' + fields.company : '') + (fields.brand_link ? '\nBrand: ' + fields.brand_link : '')
        + (fields.project_type ? '\nProject: ' + fields.project_type : '') + (fields.message ? '\n\n' + fields.message : '');

      var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      E.clearFail(form);
      var reset = function () { btn.textContent = orig; btn.disabled = false; };
      var hint = form.parentNode.querySelector('.l-form-talent');
      E.submit(fields, { form: 'landing', source: form.dataset.source || 'Landing page', subject: form.dataset.subject || '', form_el: form }, {
        anchor: form, hide: [form, hint], brief: brief, num: E.pageNum(),
        onPanel: reset,
        onSent: function (j, info) {
          reset();
          form.style.display = 'none';
          var ok = form.parentNode.querySelector('.l-form-ok');
          if (ok) ok.style.display = 'block';
          if (info.possibleTalent && !onApply) {
            var n = document.createElement('p');
            n.className = 'l-form-talent-after';
            n.style.cssText = 'margin:.8em 0 0;font-size:.92em;opacity:.9';
            n.innerHTML = 'If you’re looking for modelling work rather than booking a shoot, the application is here: <a href="' + APPLY + '?from=enquiry">Apply to YKS Talents →</a>';
            (ok || form).insertAdjacentElement('afterend', n);
          }
        },
        onFail: function (err) {
          reset();
          E.failBox(form, brief, E.pageNum(), err && err.userMessage);
        }
      });
    });
  });
})();

/* Floating WhatsApp + call — one-tap contact from anywhere on the page */
(function () {
  if (document.querySelector('.l-fab')) return;
  /* Not on the application page. That page's whole job is the form, and a
     floating "message me" bubble sitting beside it is simply a way around
     it — every stray application so far arrived through this button rather
     than the form, carrying none of the checks the form makes, and one
     person said so outright: he could not tell who the call was for, so he
     used the pop-up instead. The page keeps its own labelled WhatsApp links
     under the submit button and for sending files after applying. */
  // The whole talent + casting funnel routes through the on-page forms, not a
  // one-tap line to Yedukrishna's phone — this FAB (WhatsApp + Call) is what
  // turned applicants' questions into casting DMs and cold calls. Iris
  // (chat.js) still helps on these pages; only the direct line is withheld.
  if (/\/talents|\/models-in-|\/casting-india|\/find-models/.test(location.pathname)) return;
  var waLink = document.querySelector('a[href*="wa.me/"]');
  var num = (document.body && document.body.getAttribute('data-wa')) || (waLink && (waLink.href.match(/wa\.me\/(\d+)/) || [])[1]) || '971501955122';
  /* The opening line depends on which page you are standing on. This button
     said "I'd like to enquire about a shoot" on every page of the site —
     including the casting board, where it handed people applying for
     work a client's script. They then sent it, because it is what the button
     gave them, and arrived looking like an enquiry that was not one.
     The apply page speaks as an applicant, the roster speaks as a client. */
  var path = location.pathname;
  var line = /\/talents\/apply/.test(path)
    ? "Hi Yedukrishna \u2014 I'd like to apply to the board. I'm 18 or over, and I know the application itself is the form on your site."
    : /\/talents/.test(path)
      ? "Hi Yedukrishna, I'm looking to cast talent from your roster."
      : "Hi Yedukrishna, I'd like to enquire about a shoot.";
  var msg = encodeURIComponent(line);
  var css = '.l-fab{position:fixed;right:18px;bottom:18px;z-index:300;display:flex;flex-direction:column;gap:12px}'
    + '.l-fab a{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.42);transition:transform .25s cubic-bezier(.22,.61,.36,1)}'
    + '.l-fab a:hover{transform:scale(1.09)}'
    + '.l-fab .wa{background:#25D366}.l-fab .tel{background:#ff8c3b}'
    + '.l-fab svg{width:28px;height:28px;display:block}'
    + '@media(max-width:600px){.l-fab{right:14px;bottom:14px}.l-fab a{width:52px;height:52px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var WA = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
  var TEL = '<svg viewBox="0 0 24 24" fill="#07060a"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
  var fab = document.createElement('div'); fab.className = 'l-fab';
  fab.innerHTML = '<a class="wa" href="https://wa.me/' + num + '?text=' + msg + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + WA + '</a>'
    + '<a class="tel" href="tel:+' + num + '" aria-label="Call">' + TEL + '</a>';
  document.body.appendChild(fab);
})();

/* Video facade — poster + play button; the iframe is only created on click,
   so a category page with several films still loads like a static page. */
(function () {
  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('.vfacade');
    if (!f || f.classList.contains('playing')) return;
    var src = f.getAttribute('data-embed');
    if (!src) return;
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.title = f.getAttribute('data-title') || 'Video';
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.setAttribute('allowfullscreen', '');
    f.classList.add('playing');
    f.innerHTML = '';
    f.appendChild(frame);
  });
})();

/* Depth tilt — makes the long-dead data-tilt attribute real.
   Frame, gloss and content read as planes; the card leans toward the
   cursor. Pointer-fine devices only: on touch, cards stay still — the
   gyro version lives in /labs.html where iOS permission is explained.
   One delegated listener, no per-card handlers. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var SEL = '[data-tilt], .pf, .l-places a';
  var current = null;

  var st = document.createElement('style');
  st.textContent =
    '[data-tilt],.pf,.l-places a{will-change:transform}' +
    '.tilting{transition:transform .14s ease-out!important}' +
    '.tilt-reset{transition:transform .45s cubic-bezier(.22,.61,.36,1)!important}';
  document.head.appendChild(st);

  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest(SEL);
    if (el !== current) {
      if (current) release(current);
      current = el;
      if (el) el.classList.add('tilting');
    }
    if (!el) return;
    var r = el.getBoundingClientRect();
    var nx = ((e.clientX - r.left) / r.width - .5) * 2;
    var ny = ((e.clientY - r.top) / r.height - .5) * 2;
    el.style.transform = 'perspective(760px) rotateY(' + (nx * 6).toFixed(2) + 'deg)'
                       + ' rotateX(' + (-ny * 6).toFixed(2) + 'deg) translateY(-3px)';
  }, { passive: true });

  document.addEventListener('pointerout', function (e) {
    if (current && !current.contains(e.relatedTarget)) { release(current); current = null; }
  }, { passive: true });

  function release(el) {
    el.classList.remove('tilting');
    el.classList.add('tilt-reset');
    el.style.transform = '';
    setTimeout(function () { el.classList.remove('tilt-reset'); }, 480);
  }
})();

/* Lightbox — tap any gallery photo to open a full preview.
   Every image inside a .l-gallery, .nights-wide or .l-feature becomes
   tappable; the lightbox steps through that gallery's images with
   arrows, keys and swipe. No dependencies. */
(function () {
  var SEL = '.l-gallery img, .nights-wide img, .l-feature > img, .l-hero-gallery img';
  var imgs = [].slice.call(document.querySelectorAll(SEL));
  if (!imgs.length) return;

  var st = document.createElement('style');
  st.textContent =
    SEL.split(',').map(function (s) { return s + '{cursor:zoom-in}'; }).join('') +
    '.lbx{position:fixed;inset:0;z-index:400;display:none;align-items:center;justify-content:center;' +
    'background:rgba(5,4,8,.95);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
    'opacity:0;transition:opacity .28s ease;touch-action:none}' +
    '.lbx.on{display:flex;opacity:1}' +
    '.lbx-img{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:8px;' +
    'box-shadow:0 30px 90px rgba(0,0,0,.7);transition:transform .3s cubic-bezier(.22,.61,.36,1),opacity .2s;user-select:none;-webkit-user-drag:none}' +
    '.lbx-btn{position:absolute;background:rgba(20,16,24,.66);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
    'border:1px solid rgba(244,237,226,.2);color:#f4ede2;width:52px;height:52px;border-radius:50%;cursor:pointer;' +
    'display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:.2s;z-index:2}' +
    '.lbx-btn:hover{background:#ff8c3b;color:#07060a;border-color:#ff8c3b}' +
    '.lbx-close{top:20px;right:20px;font-size:26px}' +
    '.lbx-prev{left:18px;top:50%;transform:translateY(-50%)}' +
    '.lbx-next{right:18px;top:50%;transform:translateY(-50%)}' +
    '.lbx-count{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font-family:var(--mono,monospace);' +
    'font-size:11px;letter-spacing:.2em;color:rgba(244,237,226,.7)}' +
    '@media(max-width:640px){.lbx-btn{width:44px;height:44px}.lbx-prev{left:8px}.lbx-next{right:8px}.lbx-img{max-width:96vw}}' +
    '@media(prefers-reduced-motion:reduce){.lbx,.lbx-img{transition:none}}';
  document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'lbx'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Photo preview');
  box.innerHTML =
    '<button class="lbx-btn lbx-close" aria-label="Close">&times;</button>' +
    '<button class="lbx-btn lbx-prev" aria-label="Previous">&#8249;</button>' +
    '<img class="lbx-img" alt="" />' +
    '<button class="lbx-btn lbx-next" aria-label="Next">&#8250;</button>' +
    '<span class="lbx-count"></span>';
  document.body.appendChild(box);

  var big = box.querySelector('.lbx-img'), count = box.querySelector('.lbx-count');
  var group = [], idx = 0;

  function show(i) {
    idx = (i + group.length) % group.length;
    var src = group[idx].dataset.full || group[idx].currentSrc || group[idx].src;
    big.style.opacity = 0;
    var pre = new Image();
    pre.onload = function () { big.src = src; big.alt = group[idx].alt || ''; big.style.opacity = 1; };
    pre.src = src;
    count.textContent = (idx + 1) + ' / ' + group.length;
    box.querySelector('.lbx-prev').style.display = group.length > 1 ? '' : 'none';
    box.querySelector('.lbx-next').style.display = group.length > 1 ? '' : 'none';
    count.style.display = group.length > 1 ? '' : 'none';
  }
  function open(img) {
    // the gallery this image belongs to defines the prev/next set
    var container = img.closest('.l-gallery, .nights-wide, .l-feature, .l-hero-gallery') || document;
    group = [].slice.call(container.querySelectorAll('img')).filter(function (m) { return imgs.indexOf(m) > -1; });
    if (!group.length) group = [img];
    show(group.indexOf(img));
    box.classList.add('on');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() { box.classList.remove('on'); document.documentElement.style.overflow = ''; }

  imgs.forEach(function (img) {
    // if the photo is wrapped in a real link (e.g. a feed post → Instagram),
    // respect the link — don't hijack it with the lightbox
    var link = img.closest('a[href]');
    if (link && !/^#/.test(link.getAttribute('href') || '')) { img.style.cursor = 'pointer'; return; }
    img.addEventListener('click', function (e) { e.preventDefault(); open(img); });
  });
  box.querySelector('.lbx-close').onclick = close;
  box.querySelector('.lbx-prev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
  box.querySelector('.lbx-next').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  // swipe on touch
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 == null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
})();

/* Warm the homepage on hover/tap intent — it's the heaviest page and the
   most-tapped nav item, so start fetching it the instant a Home link is
   touched or hovered, making the actual click feel near-instant. */
(function () {
  var done = false;
  function warm() {
    if (done) return; done = true;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = '/index.html';
    document.head.appendChild(l);
  }
  var homeLinks = document.querySelectorAll('a[href="/index.html"], a[href="/"]');
  homeLinks.forEach(function (a) {
    a.addEventListener('pointerenter', warm, { once: true, passive: true });
    a.addEventListener('touchstart', warm, { once: true, passive: true });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   TRUST LAYER — the three promises + the human behind the lens.
   The homepage already carries "Booking me is the safe call" and the
   origin story; the 57 service pages carried neither. Injected here
   once so every page gets the same reassurance right where people decide.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var cta = document.querySelector('.l-cta .wrap');
  if (!cta || document.querySelector('.l-promise')) return;

  /* ── the three promises — sit directly above the form, at the decision point ── */
  var wrap = cta.querySelector('.l-form-wrap');
  var promise = document.createElement('ul');
  promise.className = 'l-promise';
  /* Casting pages face two audiences — someone deciding whether to trust us
     with their name, and a brand deciding whether to brief us. "Preview in
     48h" answers neither, so those pages get their own three. */
  // each promise is wrapped in a <span>: the <li> is a flex row, so an unwrapped text node would
  // become its own flex item and sit BESIDE the bold lead-in instead of under it.
  promise.innerHTML = document.body.dataset.page === 'casting'
    ? '<li><span><b>Free to join.</b> No registration fee, no portfolio package, ever.</span></li>'
      + '<li><span><b>Your details stay private.</b> Contact is never published or passed on.</span></li>'
      + '<li><span><b>Same day.</b> You get a reply today — not "we\'ll revert".</span></li>'
    : '<li><span><b>Same day.</b> You get a reply today — not "we\'ll revert".</span></li>'
      + '<li><span><b>One all-in number.</b> Nothing added later, no surprise line items.</span></li>'
      + '<li><span><b>Preview in 48h.</b> First edited frames within two days of the shoot.</span></li>';
  if (wrap) cta.insertBefore(promise, wrap); else cta.appendChild(promise);

  /* ── micro-copy under the send button: removes the last hesitation ── */
  var form = document.querySelector('.l-cta .l-form');
  if (form) {
    var micro = document.createElement('p');
    micro.className = 'l-micro';
    micro.textContent = 'No obligation and no sales call — just a straight answer and one number.';
    form.appendChild(micro);
  }
})();

/* Who's actually behind the camera — a face and a story before the ask.
   People book people, and on a service page there was nothing human at all. */
(function () {
  var ctaSection = document.querySelector('section.l-cta');
  if (!ctaSection || !document.querySelector('.l-cats') || document.querySelector('.l-who')) return;

  var sec = document.createElement('section');
  sec.className = 'l-section l-who-sec';
  sec.innerHTML =
      '<div class="wrap"><div class="l-who">'
    + '<figure class="l-who-photo"><img width="1067" height="1600" src="/assets/yedu-portrait-2.jpg" alt="Yedukrishna Suresh, founder of YKS Productions" loading="lazy" decoding="async" /></figure>'
    + '<div class="l-who-copy">'
    + '<p class="l-eyebrow">The eye behind the lens</p>'
    + '<h2>Why a frame is worth <em>slowing down for</em></h2>'
    + '<p>I grew up somewhere the light moves slow across the water and an ordinary afternoon already looks like a film. Cinema found me early.</p>'
    + '<p>That pull carried me onto film sets. I shoot stills and cinematography for Malayalam features, and on a set the still is the film\'s first trailer — your job is catching the one frame that makes someone feel the whole story. That\'s the eye I bring to your shoot.</p>'
    + '<p class="l-who-honest"><strong>And the honest part:</strong> I\'m not the cheapest camera in the city. If the lowest quote is the only thing that matters, I\'m genuinely not your guy — and I\'d rather say that now than after. I\'m for people who care how they\'re remembered.</p>'
    + '<p class="l-who-sign">— Yedukrishna Suresh<span>Founder, YKS Productions · FEFKA member</span></p>'
    + '</div></div></div>';
  ctaSection.parentNode.insertBefore(sec, ctaSection);
})();
