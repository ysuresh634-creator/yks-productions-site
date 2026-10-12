/* Geo-aware WhatsApp/phone for pages that serve BOTH markets (service hubs,
   journal). City pages pin their line with <body data-wa> and never load this.
   Same rule as chat.js localNum(): the visitor's timezone decides, so someone
   in India is never handed the UAE number and vice versa. */
(function () {
  if (document.body && document.body.getAttribute('data-wa')) return;
  var WA_AE = '971501955122', WA_IN = '919746679720', tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var num = /Kolkata|Calcutta|Colombo|Kathmandu|Dhaka/i.test(tz) ? WA_IN : null;
  if (!num) return; // UAE / elsewhere: keep the page default (UAE line)
  document.body.setAttribute('data-wa', num); // so chat.js + landing.js FAB agree
  var links = document.querySelectorAll('a[href*="wa.me/' + WA_AE + '"]');
  for (var i = 0; i < links.length; i++) links[i].href = links[i].href.replace(WA_AE, WA_IN);
  var shown = document.querySelectorAll('[data-geo-phone]');
  for (var j = 0; j < shown.length; j++) shown[j].textContent = '+91 97466 79720';
})();
