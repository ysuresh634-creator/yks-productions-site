/* YKS landing-page enquiry forms → Web3Forms (email capture) */
(function () {
  var KEY = 'fbf5d037-af64-46a1-8ddc-5777379ec179';
  document.querySelectorAll('form.l-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      if (!get('name') || !get('contact')) return;
      var btn = form.querySelector('button');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: form.dataset.subject || 'New enquiry — YKS Productions',
          from_name: 'YKS Productions website',
          Source: form.dataset.source || 'Landing page',
          Name: get('name'),
          Contact: get('contact'),
          Email: get('email') || '—',
          Message: get('message') || '—'
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.success) {
            form.style.display = 'none';
            var ok = form.parentNode.querySelector('.l-form-ok');
            if (ok) ok.style.display = 'block';
          } else {
            btn.textContent = orig; btn.disabled = false;
          }
        })
        .catch(function () { btn.textContent = orig; btn.disabled = false; });
    });
  });
})();
