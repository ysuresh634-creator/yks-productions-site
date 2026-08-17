/* ═══════════════════════════════════════════════════════════════
   YKS · lead.js — turning visitors into enquiries
   A · Instant quote estimator  (mounts into [data-quote])
   B · Conversational booking   (progressively upgrades form.l-form)
   Ranges below mirror the published guides in /blog/ — they are honest
   market ESTIMATES, never a binding quote; every path ends with
   "I'll confirm an exact all-in price".
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WA_AE = '971501955122';
  var WA_IN = '919746679720';

  /* ── shared styles ── */
  var css = ''
    + '.q-wrap{max-width:760px;margin:0 auto}'
    + '.q-row{margin-bottom:26px}'
    + '.q-lab{font-family:var(--font-m,var(--mono,monospace));font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;'
    + 'color:rgba(244,237,226,.55);display:block;margin-bottom:12px}'
    + '.q-opts{display:flex;flex-wrap:wrap;gap:9px}'
    + '.q-opt{font-family:var(--font-m,var(--mono,monospace));font-size:12px;letter-spacing:.06em;padding:11px 18px;border-radius:999px;'
    + 'border:1px solid rgba(244,237,226,.2);background:transparent;color:#f4ede2;cursor:pointer;'
    + 'transition:border-color .25s,background .25s,color .25s;-webkit-tap-highlight-color:transparent}'
    + '.q-opt:hover{border-color:rgba(255,140,59,.7)}'
    + '.q-opt.on{background:#ff8c3b;border-color:#ff8c3b;color:#07060a;font-weight:600}'
    + '.q-out{margin-top:34px;padding:30px 28px;border-radius:16px;border:1px solid rgba(255,140,59,.28);'
    + 'background:radial-gradient(120% 140% at 50% 0,rgba(255,140,59,.09),transparent 65%);text-align:center}'
    + '.q-num{font-family:var(--font-d,var(--serif,Georgia,serif));font-size:clamp(30px,5vw,50px);line-height:1.05;color:#f4ede2}'
    + '.q-note{font-family:var(--font-m,var(--mono,monospace));font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;'
    + 'color:rgba(244,237,226,.5);margin-top:12px}'
    + '.q-sub{color:rgba(244,237,226,.72);font-size:.95rem;line-height:1.7;margin-top:14px;max-width:52ch;margin-left:auto;margin-right:auto}'
    + '.q-cta{margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}'
    /* conversational form */
    + '.cf-step{display:none}.cf-step.on{display:block;animation:cfIn .45s cubic-bezier(.22,.61,.36,1)}'
    + '@keyframes cfIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
    + '.cf-q{font-family:var(--font-d,var(--serif,Georgia,serif));font-size:clamp(20px,2.6vw,27px);line-height:1.25;color:#f4ede2;margin-bottom:16px}'
    + '.cf-bar{display:flex;gap:6px;justify-content:center;margin-bottom:24px}'
    + '.cf-dot{width:26px;height:3px;border-radius:2px;background:rgba(244,237,226,.16);transition:background .3s}'
    + '.cf-dot.on{background:#ff8c3b}'
    + '.cf-nav{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:20px;flex-wrap:wrap}'
    + '.cf-back{background:none;border:0;color:rgba(244,237,226,.5);font-family:var(--font-m,var(--mono,monospace));font-size:11px;'
    + 'letter-spacing:.18em;text-transform:uppercase;cursor:pointer;padding:8px}'
    + '.cf-back:hover{color:#ff8c3b}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ═══════════════════════════════════════════════════════
     A · INSTANT QUOTE ESTIMATOR
     ═══════════════════════════════════════════════════════ */
  (function estimator() {
    var mount = document.querySelector('[data-quote]');
    if (!mount) return;

    /* AED ranges — same figures published in the /blog/ cost guides */
    var SERVICES = {
      wedding:   { label: 'Wedding',            scales: { 'Half day / one event': [2500, 5000], 'Full day': [5000, 12000], 'Multi-day': [12000, 30000] } },
      realestate:{ label: 'Real estate',        scales: { 'Social reel': [1500, 3500], 'Cinematic film': [3500, 8000], 'Launch / villa': [8000, 25000] } },
      corporate: { label: 'Corporate / brand',  scales: { 'Testimonial': [3000, 6000], 'Brand film': [8000, 20000], 'Campaign': [20000, 50000] } },
      social:    { label: 'Social content',     scales: { 'Reels only': [2000, 5000], 'Content-led': [5000, 12000], 'Full management': [12000, 25000] } },
      event:     { label: 'Event',              scales: { 'A few hours': [1500, 3000], 'Full day': [3000, 7000], 'Multi-day': [7000, 18000] } },
      portrait:  { label: 'Portraits / headshots', scales: { 'One person': [800, 2000], 'Small team': [2000, 5000], 'Large team': [5000, 12000] } }
    };
    var EXTRAS = {
      'Add film + photo': 0.45,
      'Same-day edit': 0.18,
      'Twilight / golden hour': 0.10,
      'Rush delivery': 0.15
    };

    var state = { svc: 'realestate', scale: null, extras: {}, city: 'Dubai' };

    mount.innerHTML =
      '<div class="q-wrap">' +
        '<div class="q-row"><span class="q-lab">01 — What are we shooting?</span><div class="q-opts" data-g="svc"></div></div>' +
        '<div class="q-row"><span class="q-lab">02 — How big is it?</span><div class="q-opts" data-g="scale"></div></div>' +
        '<div class="q-row"><span class="q-lab">03 — Anything extra?</span><div class="q-opts" data-g="extras"></div></div>' +
        '<div class="q-row"><span class="q-lab">04 — Where?</span><div class="q-opts" data-g="city"></div></div>' +
        '<div class="q-out">' +
          '<div class="q-num" id="qNum">—</div>' +
          '<div class="q-note" id="qNote">typical range · all-in</div>' +
          '<p class="q-sub" id="qSub"></p>' +
          '<div class="q-cta"><a class="btn btn-fill" id="qGo" href="#" target="_blank" rel="noopener">Get my exact quote →</a></div>' +
        '</div>' +
      '</div>';

    var g = function (n) { return mount.querySelector('[data-g="' + n + '"]'); };

    function chip(text, on) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'q-opt' + (on ? ' on' : ''); b.textContent = text;
      return b;
    }

    function paintSvc() {
      var box = g('svc'); box.innerHTML = '';
      Object.keys(SERVICES).forEach(function (k) {
        var b = chip(SERVICES[k].label, k === state.svc);
        b.onclick = function () { state.svc = k; state.scale = null; paintSvc(); paintScale(); calc(); };
        box.appendChild(b);
      });
    }
    function paintScale() {
      var box = g('scale'); box.innerHTML = '';
      var scales = Object.keys(SERVICES[state.svc].scales);
      if (!state.scale) state.scale = scales[1] || scales[0];
      scales.forEach(function (s) {
        var b = chip(s, s === state.scale);
        b.onclick = function () { state.scale = s; paintScale(); calc(); };
        box.appendChild(b);
      });
    }
    function paintExtras() {
      var box = g('extras'); box.innerHTML = '';
      Object.keys(EXTRAS).forEach(function (x) {
        var b = chip(x, !!state.extras[x]);
        b.onclick = function () { state.extras[x] = !state.extras[x]; paintExtras(); calc(); };
        box.appendChild(b);
      });
    }
    function paintCity() {
      var box = g('city'); box.innerHTML = '';
      ['Dubai', 'Abu Dhabi', 'Bangalore / India'].forEach(function (c) {
        var b = chip(c, c === state.city);
        b.onclick = function () { state.city = c; paintCity(); calc(); };
        box.appendChild(b);
      });
    }

    function calc() {
      var num = document.getElementById('qNum');
      var note = document.getElementById('qNote');
      var sub = document.getElementById('qSub');
      var go = document.getElementById('qGo');
      var svcLabel = SERVICES[state.svc].label;
      var india = state.city.indexOf('Bangalore') === 0;

      var picked = Object.keys(state.extras).filter(function (k) { return state.extras[k]; });
      var msg = 'Hi Yedukrishna, I used the estimator on your site — ' + svcLabel.toLowerCase() +
                ' (' + state.scale + ')' + (picked.length ? ', plus ' + picked.join(' + ').toLowerCase() : '') +
                ', in ' + state.city + '. Could you send me an exact quote?';

      if (india) {
        /* No published ₹ ranges — never invent numbers. Route to a real conversation. */
        num.textContent = '₹ on request';
        note.textContent = 'India · quoted per shoot';
        sub.textContent = 'My India pricing is quoted per shoot rather than from a table — tell me the dates and what you need and I\'ll send an all-in number, usually the same day.';
        go.href = 'https://wa.me/' + WA_IN + '?text=' + encodeURIComponent(msg);
        return;
      }

      var r = SERVICES[state.svc].scales[state.scale];
      var mult = 1;
      picked.forEach(function (k) { mult += EXTRAS[k]; });
      var lo = Math.round(r[0] * mult / 100) * 100;
      var hi = Math.round(r[1] * mult / 100) * 100;

      num.textContent = 'AED ' + lo.toLocaleString() + ' – ' + hi.toLocaleString();
      note.textContent = 'typical range · all-in, no hidden extras';
      sub.textContent = 'That\'s the honest market range for ' + svcLabel.toLowerCase() + ' at this scale in ' + state.city +
        '. Your exact number depends on the day itself — send me the details and I\'ll confirm a fixed all-in price.';
      go.href = 'https://wa.me/' + WA_AE + '?text=' + encodeURIComponent(msg);
    }

    paintSvc(); paintScale(); paintExtras(); paintCity(); calc();
  })();

  /* ═══════════════════════════════════════════════════════
     B · CONVERSATIONAL BOOKING — upgrades existing forms.
     Non-destructive: if anything is missing we leave the
     original form exactly as it is.
     ═══════════════════════════════════════════════════════ */
  (function conversational() {
    var forms = Array.prototype.slice.call(document.querySelectorAll('form.l-form'));
    forms.forEach(function (form) {
      if (form.dataset.cf === 'off') return;
      var name = form.querySelector('[name="name"]');
      var contact = form.querySelector('[name="contact"]');
      var email = form.querySelector('[name="email"]');
      var message = form.querySelector('[name="message"]');
      var submit = form.querySelector('button[type="submit"], button');
      if (!name || !contact || !message || !submit) return;

      /* build steps around the existing inputs — the inputs themselves
         are MOVED, never recreated, so landing.js keeps working */
      var steps = [
        { q: 'What are we shooting?', els: [message] },
        { q: 'Lovely — what should I call you?', els: [name] },
        { q: 'And the best way to reach you?', els: [contact, email] }
      ];

      var bar = document.createElement('div'); bar.className = 'cf-bar';
      steps.forEach(function () { var d = document.createElement('i'); d.className = 'cf-dot'; bar.appendChild(d); });

      var holder = document.createDocumentFragment();
      var stepEls = steps.map(function (s) {
        var wrap = document.createElement('div');
        wrap.className = 'cf-step';
        var q = document.createElement('p'); q.className = 'cf-q'; q.textContent = s.q;
        wrap.appendChild(q);
        s.els.forEach(function (el) { if (el) wrap.appendChild(el); });
        holder.appendChild(wrap);
        return wrap;
      });

      /* strip the now-empty original rows */
      Array.prototype.slice.call(form.querySelectorAll('.row2')).forEach(function (r) {
        if (!r.children.length) r.remove();
      });

      var nav = document.createElement('div'); nav.className = 'cf-nav';
      var back = document.createElement('button');
      back.type = 'button'; back.className = 'cf-back'; back.textContent = '← Back';
      var next = document.createElement('button');
      next.type = 'button'; next.className = 'btn btn-fill'; next.textContent = 'Next →';

      form.insertBefore(bar, form.firstChild);
      form.insertBefore(holder, submit);
      nav.appendChild(back); nav.appendChild(next); nav.appendChild(submit);
      form.appendChild(nav);

      var at = 0;
      function paint() {
        stepEls.forEach(function (s, i) { s.classList.toggle('on', i === at); });
        Array.prototype.slice.call(bar.children).forEach(function (d, i) { d.classList.toggle('on', i <= at); });
        var last = at === steps.length - 1;
        next.style.display = last ? 'none' : '';
        submit.style.display = last ? '' : 'none';
        back.style.visibility = at === 0 ? 'hidden' : 'visible';
        var f = stepEls[at].querySelector('input,textarea');
        if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
      }
      function valid() {
        var req = stepEls[at].querySelectorAll('[required]');
        for (var i = 0; i < req.length; i++) {
          if (!req[i].value.trim()) { req[i].focus(); req[i].style.borderColor = '#ff8c3b'; return false; }
        }
        return true;
      }
      next.addEventListener('click', function () { if (valid()) { at = Math.min(at + 1, steps.length - 1); paint(); } });
      back.addEventListener('click', function () { at = Math.max(at - 1, 0); paint(); });
      form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && at < steps.length - 1) {
          e.preventDefault(); if (valid()) { at++; paint(); }
        }
      });
      paint();
    });
  })();

})();
