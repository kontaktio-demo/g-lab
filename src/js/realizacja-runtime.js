// G-Lab - dynamiczna podstrona /realizacje/podglad/?slug=...
// Pobiera realizację z backendu i renderuje pod stałym statycznym layoutem.
(function () {
  'use strict';
  var root = document.getElementById('realizacja-dyn');
  if (!root || !window.GLab) return;
  var params = new URLSearchParams(location.search);
  var slug = (params.get('slug') || '').trim();

  if (!slug) {
    root.innerHTML =
      '<div class="container"><p class="lead">Nie wskazano realizacji. <a href="/realizacje/">Wróć do listy</a>.</p></div>';
    return;
  }

  if (!window.GLab.api) {
    root.innerHTML =
      '<div class="container"><p class="lead">Backend API nie jest skonfigurowany. <a href="/realizacje/">Wróć do listy</a>.</p></div>';
    return;
  }

  // Loading skeleton
  root.innerHTML =
    '<section class="hero hero-page"><div class="container"><h1>Wczytywanie...</h1></div></section>';

  fetch(window.GLab.api + '/api/realizations/' + encodeURIComponent(slug))
    .then(function (r) {
      if (r.status === 404) throw new Error('Nie znaleziono realizacji.');
      if (!r.ok) throw new Error('Błąd pobierania (HTTP ' + r.status + ').');
      return r.json();
    })
    .then(render)
    .catch(function (err) {
      root.innerHTML =
        '<section class="section"><div class="container"><h1>Ups...</h1>' +
        '<p class="lead">' + window.GLab.escHtml(err.message || String(err)) + '</p>' +
        '<p><a class="btn btn-primary" href="/realizacje/">Wróć do realizacji</a></p>' +
        '</div></section>';
    });

  function render(r) {
    document.title = (r.title || 'Realizacja') + ' - G-Lab Chip Tuning';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && r.krotki_opis) metaDesc.setAttribute('content', r.krotki_opis);

    var coverHtml = r.cover && (r.cover.url || r.cover.variants)
      ? window.GLab.renderPicture(r.cover, { className: 'realization-cover', eager: true, sizes: '(max-width:900px) 100vw, 900px' })
      : (r.cover_url
        ? '<img class="realization-cover" src="' + window.GLab.escHtml(r.cover_url) + '" alt="' + window.GLab.escHtml(r.title) + '" loading="eager" decoding="async">'
        : '');

    var galleryHtml = '';
    if (Array.isArray(r.gallery) && r.gallery.length) {
      galleryHtml =
        '<div class="realization-gallery">' +
        r.gallery.map(function (img) {
          return '<figure>' +
            window.GLab.renderPicture(img, { sizes: '(max-width:600px) 100vw, 33vw' }) +
            (img.alt ? '<figcaption>' + window.GLab.escHtml(img.alt) + '</figcaption>' : '') +
            '</figure>';
        }).join('') +
        '</div>';
    }

    var meta = [];
    if (r.marka) meta.push('Marka: ' + r.marka);
    if (r.silnik) meta.push('Silnik: ' + r.silnik);
    if (r.stage) meta.push(r.stage);
    if (r.usluga) {
      var labels = { chiptuning: 'Chiptuning', 'dpf-egr': 'DPF/EGR', hamownia: 'Hamownia', inne: 'Inne' };
      meta.push(labels[r.usluga] || r.usluga);
    }

    var dynoMini = '';
    if (r.km0 && r.km1) {
      var kmGain = (r.km1 - r.km0);
      var nmGain = r.nm0 && r.nm1 ? (r.nm1 - r.nm0) : null;
      dynoMini =
        '<div class="dyno-mini">' +
        '<div class="dyno-row"><span>Moc</span><strong>' + r.km0 + ' -> ' + r.km1 + ' KM</strong>' +
        '<em class="gain">+' + kmGain + ' KM</em></div>' +
        (nmGain != null ? '<div class="dyno-row"><span>Moment</span><strong>' + r.nm0 + ' -> ' + r.nm1 + ' Nm</strong>' +
          '<em class="gain">+' + nmGain + ' Nm</em></div>' : '') +
        '</div>';
    }

    var tools = '';
    if (Array.isArray(r.narzedzia) && r.narzedzia.length) {
      tools = '<div class="tools-list"><h3>Użyte narzędzia</h3><ul>' +
        r.narzedzia.map(function (t) { return '<li>' + window.GLab.escHtml(t) + '</li>'; }).join('') +
        '</ul></div>';
    }

    var bodyHtml = (r.body || '').trim()
      ? '<div class="prose">' + window.GLab.escHtml(r.body).replace(/\n\n+/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>') + '</div>'
      : '';

    root.innerHTML =
      '<section class="hero hero-page"><div class="container">' +
      '<nav class="breadcrumbs" aria-label="breadcrumbs"><a href="/">Strona główna</a> / <a href="/realizacje/">Realizacje</a> / <span>' + window.GLab.escHtml(r.title) + '</span></nav>' +
      '<h1>' + window.GLab.escHtml(r.title) + '</h1>' +
      (r.samochod ? '<p class="lead">' + window.GLab.escHtml(r.samochod) + ' - ' + window.GLab.escHtml(window.GLab.formatDatePL(r.data)) + '</p>' : '') +
      '</div></section>' +

      '<section class="section"><div class="container">' +
      coverHtml +
      (meta.length ? '<p class="meta-row">' + meta.map(window.GLab.escHtml).join(' - ') + '</p>' : '') +
      dynoMini +
      bodyHtml +
      tools +
      galleryHtml +
      '<p style="margin-top:2rem"><a class="btn btn-primary" href="/wycena/?slug=' + encodeURIComponent(r.slug) + '">Wyceń tuning swojego auta</a> ' +
      '<a class="btn btn-ghost" href="/realizacje/"><- Wszystkie realizacje</a></p>' +
      '</div></section>';
  }
})();
