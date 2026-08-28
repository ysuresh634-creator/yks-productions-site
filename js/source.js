/* ── Where did this enquiry come from? ─────────────────────────────
   WhatsApp gives no analytics and a Web3Forms email says nothing about
   how the person found us — so every enquiry has been arriving blind.

   This records the FIRST touch (Google, Instagram, an AI assistant,
   a direct type-in) the moment someone lands, keeps it for 90 days,
   and then attaches it where it can actually be read:
     · appended to the WhatsApp message the visitor sends
     · added as a "Found via" line in the enquiry email
     · sent to GA4 as an `enquiry` event

   First touch, not last: someone who arrives from Google, browses for
   a week and then messages from the homepage is still a Google lead.
   ────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var STORE = 'yks_src_v1';
  var TTL = 90 * 24 * 60 * 60 * 1000;   // 90 days, roughly a booking cycle

  /* Referrers worth naming. Order matters — check the specific hosts
     before the generic search engines. */
  var HOSTS = [
    [/(^|\.)google\./,                 'Google'],
    [/(^|\.)bing\./,                   'Bing'],
    [/duckduckgo\./,                   'DuckDuckGo'],
    [/(^|\.)instagram\.com|l\.instagram/, 'Instagram'],
    [/(^|\.)facebook\.com|l\.facebook|fb\.me/, 'Facebook'],
    [/(^|\.)linkedin\.com|lnkd\.in/,   'LinkedIn'],
    [/(^|\.)youtube\.com|youtu\.be/,   'YouTube'],
    [/behance\.net/,                   'Behance'],
    [/vimeo\.com/,                     'Vimeo'],
    [/pinterest\./,                    'Pinterest'],
    [/(^|\.)wa\.me|whatsapp\./,        'WhatsApp'],
    /* the AI answer engines — the channel that is quietly growing */
    [/chatgpt\.com|openai\.com/,       'ChatGPT'],
    [/perplexity\.ai/,                 'Perplexity'],
    [/claude\.ai/,                     'Claude'],
    [/gemini\.google|bard\.google/,    'Gemini'],
    [/copilot\.microsoft/,             'Copilot']
  ];

  function read() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || !v.t || (Date.now() - v.t) > TTL) return null;
      return v;
    } catch (e) { return null; }
  }

  function classify() {
    var p = new URLSearchParams(location.search);
    var utmS = p.get('utm_source');
    var utmM = p.get('utm_medium');

    /* An explicit tag always wins — that is the point of tagging. */
    if (utmS) {
      var name = utmS.charAt(0).toUpperCase() + utmS.slice(1);
      if (/gbp|business|maps|local/i.test(utmS + ' ' + (utmM || ''))) name = 'Google Business Profile';
      return { src: name, camp: p.get('utm_campaign') || '' };
    }

    var ref = document.referrer || '';
    if (!ref) return { src: 'Direct', camp: '' };

    var host;
    try { host = new URL(ref).hostname; } catch (e) { return { src: 'Direct', camp: '' }; }
    if (host === location.hostname) return null;          // internal click, not a new touch

    for (var i = 0; i < HOSTS.length; i++) {
      if (HOSTS[i][0].test(host)) return { src: HOSTS[i][1], camp: '' };
    }
    return { src: host.replace(/^www\./, ''), camp: '' };
  }

  /* Record the first touch once, then leave it alone. */
  var stored = read();
  if (!stored) {
    var c = classify();
    if (c) {
      stored = {
        src: c.src,
        camp: c.camp,
        land: location.pathname.replace(/^\/|\.html$/g, '') || 'home',
        t: Date.now()
      };
      try { localStorage.setItem(STORE, JSON.stringify(stored)); } catch (e) {}
    }
  }

  function label() {
    var here = location.pathname.replace(/^\/|\.html$/g, '') || 'home';
    if (!stored) return 'Direct · ' + here;
    var bits = [stored.src];
    if (stored.camp) bits.push(stored.camp);
    bits.push(stored.land === here ? here : stored.land + ' → ' + here);
    return bits.join(' · ');
  }

  function track(method) {
    if (typeof window.gtag !== 'function') return;
    try {
      window.gtag('event', 'enquiry', {
        method: method,
        found_via: stored ? stored.src : 'Direct',
        landing_page: stored ? stored.land : 'unknown',
        page_path: location.pathname
      });
    } catch (e) {}
  }

  /* ── 1. WhatsApp: carry the source inside the message itself ── */
  function tagWhatsApp(a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me') === -1 && href.indexOf('api.whatsapp') === -1) return;
    if (href.indexOf('%E2%80%94%20via') !== -1) return;    // already tagged

    /* Appended by hand rather than through URLSearchParams: that encodes
       spaces as "+", which some WhatsApp clients show literally. */
    var tail = encodeURIComponent("\n\n\u2014 via " + label());
    if (/[?&]text=/.test(href)) {
      href = href.replace(/([?&]text=)([^&]*)/, function (_, lead, txt) { return lead + txt + tail; });
    } else {
      var base = encodeURIComponent("Hi Yedukrishna, I'd like to enquire about a shoot.");
      href += (href.indexOf('?') > -1 ? '&' : '?') + 'text=' + base + tail;
    }
    a.setAttribute('href', href);
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp"]') : null;
    if (!a) return;
    tagWhatsApp(a);
    track('whatsapp');
  }, true);

  /* ── 2. Forms: a Found via line in the enquiry email ── */
  function stampForms() {
    document.querySelectorAll('form').forEach(function (form) {
      if (form.querySelector('[name="found_via"]')) return;
      var h = document.createElement('input');
      h.type = 'hidden'; h.name = 'found_via'; h.value = label();
      form.appendChild(h);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stampForms);
  } else { stampForms(); }
  document.addEventListener('submit', function () { track('form'); }, true);

  /* Also expose it, so the form senders can put it in the payload. */
  window.YKSSource = { label: label, source: function () { return stored ? stored.src : 'Direct'; } };
})();
