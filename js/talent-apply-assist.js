/* ═══════════════════════════════════════════════════════════════
   APPLY — nobody should have to write a paragraph

   Most of this form already helps: the bio has a writer, the stats
   and the profile have paste-anything boxes. Two fields were left
   with a blank box and a placeholder — "what are you happy to shoot,
   and what's off-limits", and the catch-all at the end.

   They are the two hardest questions on the page. Boundaries are
   awkward to word, the honest answer feels like it might cost you
   the job, and a blank box asks a stranger to be articulate about
   it in a second language. That is where people stop.

   So neither is a writing task any more. She taps what applies and
   the sentence assembles itself; she can talk instead of typing
   where the browser supports it; and anything she types by hand is
   preserved underneath. Tapping is also better data than prose —
   it comes back consistent instead of as free text nobody can sort.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('talForm');
  if (!form) return;

  /* Each group composes one clause. `dash` is what the clause reads as when
     nothing in it is picked — omitted entirely rather than left dangling. */
  var FIELDS = {
    comfort: {
      lead: 'Tap what applies. Nothing here is a wrong answer — it only helps me put you up for the right jobs.',
      groups: [
        { key: 'Happy to shoot', tone: 'yes', opts: [
          'Fashion / editorial', 'Commercial & print', 'Runway', 'Bridal',
          'Beauty & close-up', 'Fitness / activewear', 'Content & UGC',
          'Film & TV', 'Ethnic / traditional', 'Swim / resort'
        ] },
        { key: 'Not for me', tone: 'no', opts: [
          'Swim / resort', 'Lingerie', 'Anything sleeveless', 'Smoking or drinking on camera',
          'Overnight shoots', 'Outstation travel', 'Cutting or colouring my hair'
        ] }
      ]
    },
    extra: {
      lead: 'Anything a shoot should know in advance. Tap what applies — the details help, they never count against you.',
      groups: [
        { key: 'Worth knowing', tone: 'plain', opts: [
          'Visible tattoos', 'Tattoos I can cover', 'Piercings', 'Braces', 'I wear glasses',
          'I wear contacts', 'Recent injury', 'Dietary needs', 'I bring a chaperone',
          'Weekends only', 'Evenings only', 'I have my own transport'
        ] }
      ]
    }
  };

  var MARK = '​';                        // marks where composed text ends

  function fieldByName(n) {
    var el = form.elements[n];
    return el && el.tagName === 'TEXTAREA' ? el : null;
  }

  Object.keys(FIELDS).forEach(function (name) {
    var box = fieldByName(name);
    if (!box) return;
    build(box, FIELDS[name]);
  });

  function build(box, cfg) {
    var picked = {};                          // group key -> Set-ish object

    var wrap = document.createElement('div');
    wrap.className = 'apa';
    var lead = document.createElement('p');
    lead.className = 'apa-lead';
    lead.textContent = cfg.lead;
    wrap.appendChild(lead);

    cfg.groups.forEach(function (g) {
      picked[g.key] = {};
      var row = document.createElement('div');
      row.className = 'apa-group apa-' + g.tone;
      if (cfg.groups.length > 1) {
        var lbl = document.createElement('p');
        lbl.className = 'apa-lbl';
        lbl.textContent = g.key;
        row.appendChild(lbl);
      }
      var chips = document.createElement('div');
      chips.className = 'apa-chips';
      g.opts.forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'apa-chip';
        b.textContent = o;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          if (picked[g.key][o]) { delete picked[g.key][o]; b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); }
          else { picked[g.key][o] = 1; b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); }
          compose();
        });
        chips.appendChild(b);
      });
      row.appendChild(chips);
      wrap.appendChild(row);
    });

    /* talking is faster than typing, and for a lot of people here English is
       easier said than spelled */
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var tools = document.createElement('div');
    tools.className = 'apa-tools';
    if (SR) {
      var mic = document.createElement('button');
      mic.type = 'button';
      mic.className = 'apa-mic';
      mic.innerHTML = '<span class="apa-mic-dot"></span>Say it instead';
      var rec = null;
      mic.addEventListener('click', function () {
        if (rec) { rec.stop(); return; }
        rec = new SR();
        rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = true;
        var base = box.value ? box.value.replace(/\s+$/, '') + ' ' : '';
        mic.classList.add('is-live');
        rec.onresult = function (e) {
          var s = '';
          for (var i = e.resultIndex; i < e.results.length; i++) s += e.results[i][0].transcript;
          box.value = base + s;
        };
        rec.onerror = rec.onend = function () { mic.classList.remove('is-live'); rec = null; };
        try { rec.start(); } catch (err) { mic.classList.remove('is-live'); rec = null; }
      });
      tools.appendChild(mic);
    }
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'apa-clear';
    clear.textContent = 'Clear';
    clear.addEventListener('click', function () {
      Object.keys(picked).forEach(function (k) { picked[k] = {}; });
      [].forEach.call(wrap.querySelectorAll('.apa-chip'), function (c) {
        c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false');
      });
      box.value = '';
      compose();
    });
    tools.appendChild(clear);
    wrap.appendChild(tools);

    box.parentNode.insertBefore(wrap, box);
    box.classList.add('apa-box');
    if (!box.placeholder || /^\s*$/.test(box.placeholder)) box.placeholder = 'Anything else, in your own words — optional';
    else box.placeholder = 'Anything the taps missed, in your own words — optional';

    function compose() {
      var parts = [];
      Object.keys(picked).forEach(function (k) {
        var v = Object.keys(picked[k]);
        if (v.length) parts.push(k + ': ' + v.join(', ') + '.');
      });
      var head = parts.join(' ');
      var cur = box.value;
      // keep whatever she typed herself, wherever the composed block ends
      var tail = '';
      var at = cur.indexOf(MARK);
      if (at > -1) tail = cur.slice(at + 1);
      else if (!box.dataset.apaTouched) tail = '';
      else tail = cur;
      box.value = head ? head + MARK + (tail && !/^\s/.test(tail) ? ' ' : '') + tail : tail.replace(/^\s+/, '');
      box.dispatchEvent(new Event('input', { bubbles: true }));
    }

    box.addEventListener('input', function () { box.dataset.apaTouched = '1'; });
  }

  /* the marker is a zero-width space — strip it on the way out so it never
     reaches the application email */
  form.addEventListener('submit', function () {
    Object.keys(FIELDS).forEach(function (n) {
      var b = fieldByName(n);
      if (b && b.value.indexOf(MARK) > -1) b.value = b.value.split(MARK).join(' ').replace(/\s{2,}/g, ' ').trim();
    });
  }, true);
})();
