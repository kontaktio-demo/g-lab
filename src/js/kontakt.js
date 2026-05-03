// G-Lab — formularz kontaktowy.
// Jeśli backend (window.GLAB_CFG.api) jest skonfigurowany, wysyła zapytanie do /api/leads.
// W przeciwnym wypadku otwiera mailto jako fallback.
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var success = document.getElementById('contact-success');
  var submit = document.getElementById('contact-submit');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var data = new FormData(form);
    var imie = String(data.get('imie') || '').trim();
    var telefon = String(data.get('telefon') || '').trim();
    var email = String(data.get('email') || '').trim();
    var auto = String(data.get('auto') || '').trim();
    var wiadomosc = String(data.get('wiadomosc') || '').trim();

    var subject = 'Zapytanie ze strony G-Lab' + (auto ? ' — ' + auto : '');
    var body =
      'Cześć G-Lab,\n\n' +
      (wiadomosc || '(brak treści)') + '\n\n' +
      'Dane:\n' +
      '- Imię: ' + imie + '\n' +
      '- Telefon: ' + telefon + '\n' +
      (email ? '- E-mail: ' + email + '\n' : '') +
      (auto ? '- Auto: ' + auto + '\n' : '');

    if (window.dataLayer) window.dataLayer.push({ event: 'lead_form_submit', form: 'kontakt' });
    if (window.gtag) window.gtag('event', 'generate_lead', { method: 'kontakt' });

    if (submit) { submit.disabled = true; submit.textContent = 'Wysyłanie...'; }

    var hasBackend = !!(window.GLab && typeof window.GLab.postLead === 'function' &&
                       window.GLAB_CFG && window.GLAB_CFG.api);
    if (hasBackend) {
      window.GLab.postLead({
        source: 'kontakt',
        name: imie,
        email: email || undefined,
        phone: telefon,
        message: body,
        payload: { auto: auto },
      });
    }

    form.hidden = true;
    if (success) {
      success.hidden = false;
      window.scrollTo({ top: success.offsetTop - 80, behavior: 'smooth' });
    }

    if (!hasBackend) {
      var to = (window.GLAB_CFG && window.GLAB_CFG.email) || 'kontakt@g-lab.pl';
      var mailto = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) +
                   '&body=' + encodeURIComponent(body);
      setTimeout(function () { window.location.href = mailto; }, 200);
    }
  });
})();
