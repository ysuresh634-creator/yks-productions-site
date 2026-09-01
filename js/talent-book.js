/* ═══════════════════════════════════════════════════════════════
   PROFILE — the booking desk

   Booking a face was one WhatsApp button. That is a dead end: the
   client leaves the page with nothing decided, writes a cold message
   from scratch, and waits. Nothing about it feels like booking
   something real.

   This turns it into three questions with the answer assembling in
   front of them. Dates, what the pictures are for, who is asking —
   and a brief card that fills in live as they choose, so by the time
   they send it they have already watched the booking take shape.

   Two rules this cannot break, both of them the roster's whole point:
     · it never shows a price. It shows what *drives* the number —
       term, territory, channels — because that is the honest thing
       to say before I have seen the brief.
     · it never routes around YKS. Everything lands on my desk.

   Uses the engine that is already there: /availability for the
   current state of a face, /ai/plan to turn "what are you shooting"
   into a usage suggestion, /bookings/new to deliver. WhatsApp stays
   as the fallback if the network is unhappy.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var host = document.querySelector('.pf-hero');
  var cta  = document.querySelector('.pf-cta [data-tbook]');
  if (!host || !cta) return;

  var ENGINE = 'https://yks-talents-engine.ysuresh634.workers.dev';
  var CODE = (cta.getAttribute('data-tbook') || '').toUpperCase();
  var WA = (cta.getAttribute('href') || '').replace(/^https:\/\/wa\.me\//, '').split('?')[0] || '919746679720';

  /* The three things that actually move a usage quote. Deliberately no
     numbers anywhere — what they pick changes the shape of the answer,
     and I give the figure once I have seen the brief. */
  var USAGE = [
    { k: 'channels', label: 'Where will it run?', multi: true, opts:
      ['Organic social', 'Paid social', 'Website & e-com', 'Print', 'Out-of-home', 'Packaging'] },
    { k: 'term', label: 'For how long?', multi: false, opts:
      ['3 months', '6 months', '12 months', '2 years', 'Not sure yet'] },
    { k: 'territory', label: 'Where in the world?', multi: false, opts:
      ['India only', 'India + Gulf', 'Worldwide', 'Not sure yet'] }
  ];

  var state = { from: '', to: '', channels: [], term: '', territory: '', brief: '', name: '', contact: '' };

  /* ── markup ─────────────────────────────────────────────────── */
  var sec = document.createElement('section');
  sec.className = 'l-section bk';
  sec.id = 'book';
  sec.innerHTML =
    '<div class="wrap">' +
      '<div class="l-head bk-head">' +
        '<p class="tal-kicker">Book this face</p>' +
        '<h2>Three questions. <em>One number back.</em></h2>' +
        '<p>Tell me when, what the pictures are for, and who you are. I&rsquo;ll check she&rsquo;s free and come back with one all-in number covering the talent and the shoot. Nothing&rsquo;s charged here, and you&rsquo;re not committed to anything until you say so.</p>' +
      '</div>' +
      '<div class="bk-grid">' +
        '<div class="bk-form">' +

          '<div class="bk-step" data-step="1">' +
            '<p class="bk-step-h"><span>01</span>When do you need them?</p>' +
            '<div class="bk-dates">' +
              '<label>From<input type="date" class="bk-from" /></label>' +
              '<label>To <span class="bk-opt">optional</span><input type="date" class="bk-to" /></label>' +
            '</div>' +
            '<p class="bk-avail" id="bkAvail">Checking this face&rsquo;s diary&hellip;</p>' +
          '</div>' +

          '<div class="bk-step" data-step="2">' +
            '<p class="bk-step-h"><span>02</span>What are the pictures for?</p>' +
            '<div class="bk-ai">' +
              '<input type="text" class="bk-ai-in" placeholder="e.g. a bridal jewellery launch for Instagram and a few billboards" />' +
              '<button type="button" class="bk-ai-go">Work it out for me</button>' +
            '</div>' +
            '<p class="bk-ai-out" hidden></p>' +
            '<div class="bk-usage"></div>' +
          '</div>' +

          '<div class="bk-step" data-step="3">' +
            '<p class="bk-step-h"><span>03</span>Who am I coming back to?</p>' +
            '<div class="bk-who">' +
              '<label>Your name<input type="text" class="bk-name" autocomplete="name" /></label>' +
              '<label>Phone or email<input type="text" class="bk-contact" autocomplete="email" /></label>' +
            '</div>' +
          '</div>' +

        '</div>' +

        '<aside class="bk-side">' +
          '<div class="bk-card">' +
            '<div class="bk-card-top"><b>Your brief</b><span>' + CODE + '</span></div>' +
            '<dl class="bk-card-rows">' +
              '<div><dt>Face</dt><dd>' + CODE + '</dd></div>' +
              '<div><dt>Dates</dt><dd class="bk-r-dates is-empty">not set</dd></div>' +
              '<div><dt>Channels</dt><dd class="bk-r-channels is-empty">not set</dd></div>' +
              '<div><dt>Term</dt><dd class="bk-r-term is-empty">not set</dd></div>' +
              '<div><dt>Territory</dt><dd class="bk-r-territory is-empty">not set</dd></div>' +
            '</dl>' +
            '<div class="bk-meter"><span class="bk-meter-fill"></span></div>' +
            '<p class="bk-meter-say">Answer the three and I can quote it properly.</p>' +
            '<button type="button" class="bk-send" disabled>Send this brief &rarr;</button>' +
            '<a class="bk-wa" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">or send it on WhatsApp</a>' +
            '<p class="bk-fine">Every booking runs through me. Clients don&rsquo;t contact talent directly, and I don&rsquo;t share anyone&rsquo;s details.</p>' +
            '<p class="bk-ok" hidden></p>' +
          '</div>' +
        '</aside>' +
      '</div>' +
    '</div>';

  // sits directly under the hero, where the old single button was
  host.parentNode.insertBefore(sec, host.nextSibling);

  var $ = function (s) { return sec.querySelector(s); };

  /* ── usage chips ────────────────────────────────────────────── */
  var usageWrap = $('.bk-usage');
  USAGE.forEach(function (g) {
    var row = document.createElement('div');
    row.className = 'bk-ugroup';
    row.innerHTML = '<p class="bk-ulabel">' + g.label + '</p>';
    var chips = document.createElement('div');
    chips.className = 'bk-chips';
    g.opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bk-chip';
      b.textContent = o;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        if (g.multi) {
          var i = state[g.k].indexOf(o);
          if (i > -1) state[g.k].splice(i, 1); else state[g.k].push(o);
          b.classList.toggle('is-on');
          b.setAttribute('aria-pressed', b.classList.contains('is-on') ? 'true' : 'false');
        } else {
          state[g.k] = state[g.k] === o ? '' : o;
          [].forEach.call(chips.children, function (c) {
            var on = c.textContent === state[g.k];
            c.classList.toggle('is-on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        }
        paint();
      });
      chips.appendChild(b);
    });
    row.appendChild(chips);
    usageWrap.appendChild(row);
  });

  /* ── the brief card, assembling live ────────────────────────── */
  function set(sel, val) {
    var el = $(sel);
    el.textContent = val || 'not set';
    el.classList.toggle('is-empty', !val);
  }
  function dateLabel() {
    if (!state.from) return '';
    var f = new Date(state.from), t = state.to ? new Date(state.to) : null;
    var fmt = function (d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
    return t && +t !== +f ? fmt(f) + ' – ' + fmt(t) : fmt(f);
  }
  function paint() {
    set('.bk-r-dates', dateLabel());
    set('.bk-r-channels', state.channels.join(', '));
    set('.bk-r-term', state.term);
    set('.bk-r-territory', state.territory);

    var done = [!!state.from, !!state.channels.length, !!(state.term && state.territory),
                !!(state.name && state.contact)].filter(Boolean).length;
    $('.bk-meter-fill').style.width = Math.max(6, (done / 4) * 100) + '%';
    $('.bk-meter-fill').className = 'bk-meter-fill' + (done >= 3 ? ' is-good' : done >= 2 ? ' is-mid' : '');

    var say = ['Answer these three and I can quote it properly.',
               'Good start. What are the pictures for?',
               'Nearly there. Term and territory move the number more than anything else does.',
               'That\u2019s enough to quote on. Add your name and it lands on my desk.',
               'Ready. Send it and you\u2019ll hear from me today.'][done];
    $('.bk-meter-say').textContent = say;

    var ready = state.from && state.name && state.contact;
    $('.bk-send').disabled = !ready;
    $('.bk-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(summary());
  }
  function summary() {
    var L = ['Hi Yedukrishna, I\'d like to book ' + CODE + '.'];
    if (dateLabel()) L.push('Dates: ' + dateLabel() + '.');
    if (state.channels.length) L.push('Running on: ' + state.channels.join(', ') + '.');
    if (state.term) L.push('For: ' + state.term + '.');
    if (state.territory) L.push('Territory: ' + state.territory + '.');
    if (state.brief) L.push('The shoot: ' + state.brief);
    return L.join(' ');
  }

  ['from', 'to'].forEach(function (k) {
    $('.bk-' + k).addEventListener('change', function (e) { state[k] = e.target.value; paint(); });
  });
  ['name', 'contact'].forEach(function (k) {
    $('.bk-' + k).addEventListener('input', function (e) { state[k] = e.target.value.trim(); paint(); });
  });

  /* ── availability: the face's current state, said honestly ──── */
  fetch(ENGINE + '/availability')
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var a = ((j && j.codes) || {})[CODE.toLowerCase()];
      var el = $('#bkAvail');
      if (!a) {
        el.innerHTML = '<i class="bk-dot is-free"></i>Nothing&rsquo;s held on her right now. Give me your dates and I&rsquo;ll confirm today.';
      } else if (a.state === 'booked') {
        el.innerHTML = '<i class="bk-dot is-booked"></i>She&rsquo;s booked on some dates. Send me yours and I&rsquo;ll tell you straight away if they clash.';
      } else {
        el.innerHTML = '<i class="bk-dot is-held"></i>She&rsquo;s on hold for another shoot. Holds lapse all the time &mdash; send your dates and I&rsquo;ll tell you where it stands.';
      }
    })
    .catch(function () {
      $('#bkAvail').innerHTML = '<i class="bk-dot"></i>Send me your dates and I&rsquo;ll confirm today.';
    });

  /* ── AI: turn "what are you shooting" into a usage suggestion ── */
  var aiGo = $('.bk-ai-go'), aiIn = $('.bk-ai-in'), aiOut = $('.bk-ai-out');
  aiGo.addEventListener('click', function () {
    var q = aiIn.value.trim();
    if (!q) { aiIn.focus(); return; }
    state.brief = q;
    var orig = aiGo.textContent;
    aiGo.disabled = true; aiGo.textContent = 'Thinking…';
    var done = false;
    var stop = setTimeout(function () { if (!done) finish(null); }, 18000);
    function finish(txt) {
      done = true; clearTimeout(stop);
      aiGo.disabled = false; aiGo.textContent = orig;
      aiOut.hidden = false;
      aiOut.textContent = txt || 'Couldn’t reach the planner just then. Pick what fits below, or just say it in the brief and I’ll sort the usage out with you.';
    }
    fetch(ENGINE + '/ai/plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: q, kind: 'usage' })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (done) return;
        finish((j && (j.text || j.plan || j.summary)) || null);
        preselect(q);
      })
      .catch(function () { if (!done) { finish(null); preselect(q); } });
  });

  /* A local read of the brief so the chips move even if the engine is down —
     it is a suggestion the client can override, never a decision. */
  function preselect(q) {
    var t = q.toLowerCase(), hits = [];
    if (/instagram|reel|social|ugc|content/.test(t)) hits.push('Organic social');
    if (/\bads?\b|paid|performance|campaign|meta|google/.test(t)) hits.push('Paid social');
    if (/website|e-?com|shopify|catalog|listing|amazon/.test(t)) hits.push('Website & e-com');
    if (/billboard|hoarding|ooh|out-?of-?home|metro/.test(t)) hits.push('Out-of-home');
    if (/print|magazine|brochure|press/.test(t)) hits.push('Print');
    if (/pack|label|box|carton/.test(t)) hits.push('Packaging');
    [].forEach.call(usageWrap.querySelectorAll('.bk-chip'), function (c) {
      if (hits.indexOf(c.textContent) > -1 && !c.classList.contains('is-on')) c.click();
    });
  }

  /* ── send ───────────────────────────────────────────────────── */
  $('.bk-send').addEventListener('click', function () {
    var btn = $('.bk-send'), orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch(ENGINE + '/bookings/new', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: state.name, client_contact: state.contact,
        brief: summary(), city: '', shoot_dates: dateLabel(), budget: '',
        talent_code: CODE
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error('x');
        btn.textContent = 'Sent ✓';
        $('.bk-ok').hidden = false;
        $('.bk-ok').textContent = 'Got it. I’ll check ' + CODE + ' is free and come back to you today with one all-in number.';
        if (window.gtag) gtag('event', 'talent_booking_brief', { code: CODE });
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = orig;
        $('.bk-ok').hidden = false;
        $('.bk-ok').textContent = 'That didn’t send — the WhatsApp link below already has everything you filled in.';
      });
  });

  paint();
})();
