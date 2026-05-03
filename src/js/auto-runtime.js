// G-Lab dynamic car detail page runtime.
// Each car in katalog.csv is rendered to a static /tuning/{slug}/index.html
// page at build time (see build.js renderCarPage). This runtime is used
// only by the catalog landing /tuning/index.html as a fallback for the
// legacy /tuning/?slug=... URL pattern: it fetches /data/katalog.json,
// finds the car by ?slug=..., and renders title, power table, dyno chart,
// spec table, related links and Stage 1/2/3 inline.

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function slug(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function showNotFound(msg) {
    var b = $('auto-body'); if (b) b.hidden = true;
    var nf = $('auto-not-found'); if (nf) nf.hidden = false;
    $('auto-title').textContent = 'Nie znaleziono auta';
    $('auto-lead').textContent = msg || 'Sprawdź adres URL lub wróć do katalogu.';
    document.title = 'Nie znaleziono - G-Lab Chip Tuning';
  }

  function dynoSvg(km0, km1, nm0, nm1) {
    // Compact, clean SVG dyno-style chart: power and torque curves before/after.
    // Mirrors the look of the static page's chart but built client-side.
    var W = 640, H = 280, padL = 50, padR = 24, padT = 24, padB = 38;
    var maxKm = Math.max(km0, km1) * 1.15;
    var maxNm = Math.max(nm0, nm1) * 1.15;
    var rpmMin = 1500, rpmMax = 4500;
    function x(rpm) { return padL + (rpm - rpmMin) / (rpmMax - rpmMin) * (W - padL - padR); }
    function yKm(v) { return H - padB - v / maxKm * (H - padT - padB); }
    function yNm(v) { return H - padB - v / maxNm * (H - padT - padB); }
    // Curves shaped like real dyno traces (rises to peak then plateaus / falls slightly).
    function curve(peakRpm, peakV, yScale) {
      var pts = [];
      for (var rpm = rpmMin; rpm <= rpmMax; rpm += 250) {
        var t = (rpm - rpmMin) / (peakRpm - rpmMin);
        var v;
        if (rpm <= peakRpm) v = peakV * Math.pow(t, 0.85);
        else {
          var t2 = (rpm - peakRpm) / (rpmMax - peakRpm);
          v = peakV * (1 - 0.18 * t2 * t2);
        }
        pts.push(x(rpm).toFixed(1) + ',' + yScale(v).toFixed(1));
      }
      return pts.join(' ');
    }
    var kmPeak = 3800, nmPeak = 2300;
    function gridV() {
      var out = '';
      for (var rpm = rpmMin; rpm <= rpmMax; rpm += 500) {
        out += '<line x1="' + x(rpm) + '" y1="' + padT + '" x2="' + x(rpm) + '" y2="' + (H - padB) + '" stroke="currentColor" stroke-width="0.4" opacity="0.18"/>';
        out += '<text x="' + x(rpm) + '" y="' + (H - padB + 14) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">' + rpm + '</text>';
      }
      return out;
    }
    function gridH() {
      var out = '';
      for (var i = 0; i <= 5; i++) {
        var y = padT + (H - padT - padB) * i / 5;
        out += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="currentColor" stroke-width="0.4" opacity="0.12"/>';
      }
      return out;
    }
    return '<figure class="dyno-chart">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Wykres mocy i momentu">' +
        gridH() + gridV() +
        '<polyline points="' + curve(kmPeak, km0, yKm) + '" fill="none" stroke="#888" stroke-width="2" stroke-dasharray="5 4"/>' +
        '<polyline points="' + curve(kmPeak + 100, km1, yKm) + '" fill="none" stroke="#e63946" stroke-width="2.5"/>' +
        '<polyline points="' + curve(nmPeak, nm0, yNm) + '" fill="none" stroke="#888" stroke-width="2" stroke-dasharray="5 4" opacity="0.85"/>' +
        '<polyline points="' + curve(nmPeak + 200, nm1, yNm) + '" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>' +
        '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">RPM</text>' +
      '</svg>' +
      '<figcaption>Symulacja przebiegu mocy (czerwony) i momentu (niebieski). Linie przerywane = stan seryjny.</figcaption>' +
    '</figure>';
  }

  function renderStages(car) {
    var km1 = car.km1 || 0, nm1 = car.nm1 || 0;
    var km0 = car.km0 || 0, nm0 = car.nm0 || 0;
    // Conservative Stage multipliers, matched to engine character so we don't
    // promise unrealistic Stage 2/3 figures for NA petrol units.
    var ch = car.ch || (car.paliwo === 'diesel' ? 'diesel' : 'petrol_turbo');
    var mult = ch === 'diesel'
      ? { s2km: 1.10, s2nm: 1.07, s3km: 1.30, s3nm: 1.20 }
      : ch === 'petrol_turbo'
        ? { s2km: 1.08, s2nm: 1.06, s3km: 1.20, s3nm: 1.15 }
        : { s2km: 1.04, s2nm: 1.03, s3km: 1.08, s3nm: 1.06 };
    var stages = [
      { name: 'Stage 1', km: km1, nm: nm1, risk: 'minimalne', cost: '1500 - 2200 zł',
        desc: 'Tylko software, fabryczny osprzęt. Najbezpieczniejszy wariant.' },
      { name: 'Stage 2', km: Math.round(km1 * mult.s2km), nm: Math.round(nm1 * mult.s2nm),
        risk: 'umiarkowane', cost: '4000 - 7000 zł',
        desc: 'Software + downpipe / intercooler / wkład filtra. Zalecany serwis sprzęgła.' },
      { name: 'Stage 3', km: Math.round(km1 * mult.s3km), nm: Math.round(nm1 * mult.s3nm),
        risk: 'wysokie', cost: '12 000 - 25 000 zł',
        desc: ch === 'diesel'
          ? 'Hybrydowa turbo, wtryskiwacze, mocowane sprzęgło. Tylko z pomiarem na hamowni.'
          : 'Większa turbosprężarka, intercooler, wzmocnione tłoki. Tylko z pomiarem na hamowni.' },
    ];
    var html = '';
    for (var i = 0; i < stages.length; i++) {
      var s = stages[i];
      html += '<article class="stage-card stage-' + (i + 1) + '">' +
        '<header><h3>' + esc(s.name) + '</h3><span class="stage-badge">' + esc(s.risk) + '</span></header>' +
        '<div class="stage-power"><strong>' + s.km + '</strong> KM <span>+' + (s.km - km0) + '</span></div>' +
        '<div class="stage-torque"><strong>' + s.nm + '</strong> Nm <span>+' + (s.nm - nm0) + '</span></div>' +
        '<p class="stage-desc">' + esc(s.desc) + '</p>' +
        '<div class="stage-cost">' + esc(s.cost) + '</div>' +
      '</article>';
    }
    $('auto-stages').innerHTML = html;
    $('auto-stages-wrap').hidden = false;
  }

  function carUrl(c) {
    return '/tuning/' + encodeURIComponent(c.slug) + '/';
  }

  function renderRelated(car, all) {
    var related = [];
    for (var i = 0; i < all.length && related.length < 6; i++) {
      var c = all[i];
      if (c.slug === car.slug) continue;
      if (c.marka === car.marka && c.model === car.model && c.generacja === car.generacja) {
        related.push(c);
      }
    }
    if (!related.length) return;
    var html = '';
    for (var j = 0; j < related.length; j++) {
      var c = related[j];
      html += '<a class="car-card" href="' + esc(carUrl(c)) + '">' +
        '<div class="car-title">' + esc(c.marka) + ' ' + esc(c.model) + ' ' + esc(c.generacja) + '</div>' +
        '<div class="car-meta">' + esc(c.silnik) + ' | ' + esc(c.sterownik) + '</div>' +
        '<div class="car-power"><span class="from">' + (+c.km0 || '?') + ' KM</span>' +
        '<span class="arrow">&rarr;</span>' +
        '<span class="to">' + (+c.km1 || '?') + ' KM</span></div>' +
      '</a>';
    }
    $('auto-related').innerHTML = html;
    $('auto-related-wrap').hidden = false;
  }

  function render(car, all) {
    var fullName = car.marka + ' ' + car.model + ' ' + car.generacja + ' - ' + car.silnik;
    document.title = fullName + ' - chiptuning - G-Lab';

    $('auto-bc-marka').innerHTML =
      '<a href="/marka/' + esc(car.marka_slug || slug(car.marka)) + '/">' + esc(car.marka) + '</a> / ' +
      '<span>' + esc(car.model) + ' ' + esc(car.generacja) + ' ' + esc(car.silnik) + '</span>';

    $('auto-title').textContent = fullName;
    $('auto-lead').textContent = 'Chiptuning ' + car.marka + ' ' + car.model + ' ' + car.generacja
      + ' ' + car.silnik + ' (' + car.rok_od + '-' + car.rok_do + '). '
      + 'Sprawdź jakie efekty możesz uzyskać po modyfikacji oprogramowania sterownika silnika.';

    // Liczby
    var km0 = +car.km0 || 0, km1 = +car.km1 || 0;
    var nm0 = +car.nm0 || 0, nm1 = +car.nm1 || 0;
    var kw0 = +car.kw0 || Math.round(km0 * 0.7355);
    var kw1 = +car.kw1 || Math.round(km1 * 0.7355);
    var dpct = km0 ? Math.round(((km1 - km0) / km0) * 100) : 0;
    $('km0').textContent = km0;  $('km1').textContent = km1;
    $('kw0').textContent = kw0;  $('kw1').textContent = kw1;
    $('nm0').textContent = nm0;  $('nm1').textContent = nm1;
    $('dkm').textContent = (km1 - km0); $('dpct').textContent = dpct;
    $('dnm').textContent = (nm1 - nm0);

    // Tabela
    var lnkMarka = $('lnk-marka');
    lnkMarka.href = '/marka/' + (car.marka_slug || slug(car.marka)) + '/';
    lnkMarka.textContent = car.marka;
    $('td-model').textContent = car.model;
    $('td-gen').textContent = car.generacja;
    $('td-lata').textContent = car.rok_od + ' - ' + car.rok_do;
    $('td-paliwo').textContent = car.paliwo === 'diesel' ? 'Diesel' : 'Benzyna';
    $('td-poj').textContent = car.pojemnosc != null ? (car.pojemnosc + ' l') : '-';
    var lnkSilnik = $('lnk-silnik');
    lnkSilnik.href = '/silnik/' + (car.silnik_slug || slug(car.marka + ' ' + car.silnik)) + '/';
    lnkSilnik.textContent = car.silnik;
    var lnkSter = $('lnk-ster');
    lnkSter.href = '/sterownik/' + (car.sterownik_slug || slug(car.sterownik)) + '/';
    lnkSter.textContent = car.sterownik;
    $('lnk-wycena').href = '/wycena/?slug=' + encodeURIComponent(car.slug);

    // Wykres dyno
    if (km0 && km1) $('auto-dyno').innerHTML = dynoSvg(km0, km1, nm0, nm1);

    // Aside links
    var asideHtml = '<li><a href="/marka/' + esc(car.marka_slug || slug(car.marka)) + '/">Wszystkie ' + esc(car.marka) + '</a></li>';
    if (car.silnik_slug) asideHtml += '<li><a href="/silnik/' + esc(car.silnik_slug) + '/">Inne auta z silnikiem ' + esc(car.silnik) + '</a></li>';
    if (car.sterownik_slug) asideHtml += '<li><a href="/sterownik/' + esc(car.sterownik_slug) + '/">Inne auta ze sterownikiem ' + esc(car.sterownik) + '</a></li>';
    asideHtml += '<li><a href="/porownaj/?cars=' + esc(car.slug) + '">Porównaj z innym modelem</a></li>';
    $('aside-links').innerHTML = asideHtml;

    // Sekcje
    renderStages(car);
    renderRelated(car, all);

    $('auto-body').hidden = false;
  }

  // Mała pamięć podręczna - jedno pobranie na całą sesję.
  var DATA_PROMISE = null;
  function getData() {
    if (DATA_PROMISE) return DATA_PROMISE;
    DATA_PROMISE = fetch('/data/katalog.json', { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .catch(function (e) { console.error('catalog fetch failed', e); return []; });
    return DATA_PROMISE;
  }

  function init() {
    // Slug może przyjść przez legacy ?slug=... (z dawnych linków). Każdy
    // wpis w katalogu ma swoją statyczną stronę /tuning/{slug}/, więc
    // jeżeli widzimy ?slug=, robimy upgrade do kanonicznego URL-a (Vercel
    // też to robi 301-em po stronie serwera; tu trzymamy fallback dla
    // Netlify / lokalnego dev-serwera).
    var params = new URLSearchParams(location.search);
    var requested = params.get('slug');
    if (requested && /^[a-z0-9-]{1,160}$/.test(requested) && location.pathname.replace(/\/+$/, '/') === '/tuning/') {
      location.replace('/tuning/' + encodeURIComponent(requested) + '/');
      return;
    }
    if (!requested) {
      var m = location.pathname.match(/^\/tuning\/([^/?#]+)\/?$/);
      if (m) requested = decodeURIComponent(m[1]);
    }
    if (!requested) {
      showNotFound('Brak parametru ?slug=... Wróć do katalogu i wybierz auto z listy.');
      return;
    }
    if (!/^[a-z0-9-]{1,160}$/.test(requested)) {
      showNotFound('Niepoprawny identyfikator slug.');
      return;
    }
    getData().then(function (all) {
      var car = null;
      for (var i = 0; i < all.length; i++) { if (all[i].slug === requested) { car = all[i]; break; } }
      if (!car) { showNotFound('Auto o identyfikatorze "' + requested + '" nie figuruje w katalogu.'); return; }
      render(car, all);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
