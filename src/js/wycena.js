// G-Lab - quiz wyceny
(function () {
  'use strict';
  var dataEl = document.getElementById('quiz-data');
  if (!dataEl) return;
  var CARS = [];
  try { CARS = JSON.parse(dataEl.textContent || '[]'); } catch (e) { CARS = []; }

  // Prefill from query (?slug=)
  var pre = new URLSearchParams(location.search).get('slug');
  var preCar = pre ? CARS.find(function (c) { return c.slug === pre; }) : null;

  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  var dl = document.getElementById('quiz-cars');
  if (dl) {
    var html = '';
    for (var i = 0; i < CARS.length; i++) {
      var lab = CARS[i].marka + ' ' + CARS[i].model + ' ' + CARS[i].generacja + ' ' + CARS[i].silnik;
      html += '<option value="' + escHtml(lab) + '"></option>';
    }
    dl.innerHTML = html;
  }
  if (preCar) {
    var ai = document.getElementById('quiz-auto');
    if (ai) ai.value = preCar.marka + ' ' + preCar.model + ' ' + preCar.generacja + ' ' + preCar.silnik;
  }

  var form = document.getElementById('quiz-form');
  var prev = document.getElementById('quiz-prev');
  var next = document.getElementById('quiz-next');
  var submit = document.getElementById('quiz-submit');
  var bar = document.getElementById('quiz-bar');
  var stepNums = document.querySelectorAll('.quiz-progress-steps span');
  var success = document.getElementById('quiz-success');
  var current = 1;
  var total = 5;

  function show(step) {
    document.querySelectorAll('.quiz-step').forEach(function (s) {
      var n = +s.getAttribute('data-step');
      var active = n === step;
      s.classList.toggle('is-active', active);
      s.hidden = !active;
    });
    bar.style.width = ((step / total) * 100) + '%';
    stepNums.forEach(function (sp, i) {
      sp.classList.toggle('is-active', i + 1 <= step);
    });
    prev.hidden = step === 1;
    next.hidden = step === total;
    submit.hidden = step !== total;
  }

  function validateStep(step) {
    var fs = document.querySelector('.quiz-step[data-step="' + step + '"]');
    if (!fs) return false;
    var fields = fs.querySelectorAll('input[required], input[type=radio]');
    // For radio groups: at least one must be checked
    var radios = fs.querySelectorAll('input[type=radio][required]');
    if (radios.length) {
      var name = radios[0].name;
      var any = fs.querySelector('input[name="' + name + '"]:checked');
      if (!any) { radios[0].focus(); return false; }
    }
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (f.type === 'radio') continue;
      if (!f.checkValidity()) { f.reportValidity(); return false; }
    }
    return true;
  }

  next.addEventListener('click', function () {
    if (!validateStep(current)) return;
    if (current < total) { current++; show(current); window.scrollTo({ top: form.offsetTop - 80, behavior: 'smooth' }); }
  });
  prev.addEventListener('click', function () {
    if (current > 1) { current--; show(current); window.scrollTo({ top: form.offsetTop - 80, behavior: 'smooth' }); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(total)) return;
    var data = new FormData(form);
    var auto = data.get('auto') || '';
    var rok = data.get('rok') || '';
    var przebieg = data.get('przebieg') || '';
    var stage = data.get('stage') || '';
    var extras = data.getAll('extras').join(', ') || 'brak';
    var termin = data.get('termin') || '';
    var imie = data.get('imie') || '';
    var telefon = data.get('telefon') || '';
    var email = data.get('email') || '';

    var subject = 'Wycena tuningu - ' + auto;
    var body =
      'Cześć G-Lab,\n\n' +
      'Chciałbym wycenić tuning swojego auta. Oto szczegóły:\n\n' +
      '- Auto: ' + auto + '\n' +
      '- Rok: ' + rok + '\n' +
      '- Przebieg: ' + przebieg + ' tys. km\n' +
      '- Stage: ' + stage + '\n' +
      '- Dodatkowo: ' + extras + '\n' +
      '- Termin: ' + termin + '\n\n' +
      'Dane kontaktowe:\n' +
      '- Imię: ' + imie + '\n' +
      '- Telefon: ' + telefon + '\n' +
      (email ? '- E-mail: ' + email + '\n' : '') +
      '\nPozdrawiam,\n' + imie;

    var to = window.GLAB_EMAIL || 'kontakt@g-lab.pl';
    var mailto = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    // analytics event (if GA4/GTM loaded)
    if (window.dataLayer) window.dataLayer.push({
      event: 'lead_form_submit', form: 'quiz_wyceny', auto: auto, stage: stage,
    });
    if (window.gtag) window.gtag('event', 'generate_lead', { method: 'quiz_wyceny' });

    // Wyślij do backendu (jeśli skonfigurowany). Niezależnie od wyniku otwieramy mailto jako backup.
    if (window.GLab && typeof window.GLab.postLead === 'function') {
      window.GLab.postLead({
        source: 'wycena',
        name: imie,
        email: email || undefined,
        phone: telefon,
        message: body,
        payload: {
          auto: auto, rok: rok, przebieg: przebieg, stage: stage,
          extras: extras, termin: termin,
        },
      });
    }

    form.hidden = true;
    success.hidden = false;
    window.scrollTo({ top: success.offsetTop - 80, behavior: 'smooth' });
    // open mail client (fallback / dodatkowa kopia)
    setTimeout(function () { window.location.href = mailto; }, 200);
  });

  // wstępne wypełnienie -> przejdź do kroku 2
  if (preCar) { current = 2; show(2); } else { show(1); }

  // Card-radio visual selection
  document.querySelectorAll('.quiz-card input').forEach(function (i) {
    i.addEventListener('change', function () {
      var name = i.name;
      document.querySelectorAll('.quiz-card input[name="' + name + '"]').forEach(function (x) {
        x.closest('.quiz-card').classList.toggle('is-checked', x.checked);
      });
    });
  });
})();
