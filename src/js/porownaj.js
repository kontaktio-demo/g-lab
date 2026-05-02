// G-Lab - porownywarka modeli
(function () {
  'use strict';
  var dataEl = document.getElementById('compare-data');
  if (!dataEl) return;
  var CARS = [];
  try { CARS = JSON.parse(dataEl.textContent || '[]'); } catch (e) { CARS = []; }

  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  var dl = document.getElementById('cars-datalist');
  if (dl) {
    var html = '';
    for (var i = 0; i < CARS.length; i++) html += '<option value="' + escHtml(CARS[i].label) + '"></option>';
    dl.innerHTML = html;
  }

  function findCar(q) {
    if (!q) return null;
    q = q.toLowerCase().trim();
    var byEq = null, byInc = null;
    for (var i = 0; i < CARS.length; i++) {
      var lab = CARS[i].label.toLowerCase();
      if (lab === q) { byEq = CARS[i]; break; }
      if (!byInc && lab.indexOf(q) !== -1) byInc = CARS[i];
    }
    return byEq || byInc;
  }

  function urlSlugs() {
    var p = new URLSearchParams(location.search);
    var raw = p.get('cars') || '';
    return raw ? raw.split(',') : [];
  }
  function setUrlSlugs(slugs) {
    var p = new URLSearchParams(location.search);
    if (slugs.length) p.set('cars', slugs.join(','));
    else p.delete('cars');
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  var inputs = document.querySelectorAll('.compare-picker input[data-slot]');
  var slots = [null, null, null];

  // hydrate from URL
  var initial = urlSlugs();
  for (var k = 0; k < initial.length && k < 3; k++) {
    var match = CARS.find(function (c) { return c.slug === initial[k]; });
    if (match) {
      slots[k] = match;
      inputs[k].value = match.label;
    }
  }

  inputs.forEach(function (inp) {
    inp.addEventListener('input', schedule);
    inp.addEventListener('change', schedule);
  });

  var t;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(render, 80);
  }

  function render() {
    inputs.forEach(function (inp, idx) {
      var c = inp.value ? findCar(inp.value) : null;
      slots[idx] = c;
    });
    setUrlSlugs(slots.filter(Boolean).map(function (c) { return c.slug; }));

    var picked = slots.filter(Boolean);
    var box = document.getElementById('compare-result');
    if (!picked.length) {
      box.innerHTML = '<p class="lead">Wybierz przynajmniej jedno auto, aby zobaczyć porównanie.</p>';
      return;
    }

    var maxKm0 = Math.max.apply(null, picked.map(function (c) { return c.km0 || 0; }));
    var maxKm1 = Math.max.apply(null, picked.map(function (c) { return c.km1 || 0; }));
    var maxNm0 = Math.max.apply(null, picked.map(function (c) { return c.nm0 || 0; }));
    var maxNm1 = Math.max.apply(null, picked.map(function (c) { return c.nm1 || 0; }));
    var maxGain = Math.max.apply(null, picked.map(function (c) { return c.diff_km || 0; }));

    function bar(v, max, cls) {
      var n = +v || 0;
      var p = max > 0 ? Math.round((n / max) * 100) : 0;
      return '<div class="bar"><div class="bar-fill ' + escHtml(cls||'') + '" style="width:' + p + '%"></div><span class="bar-val">' + n + '</span></div>';
    }

    var rows = [
      { label: 'Sterownik (ECU)', value: function(c){ return escHtml(c.sterownik || '-'); } },
      { label: 'Pojemność', value: function(c){ return c.pojemnosc ? (+c.pojemnosc).toFixed(1) + ' l' : '-'; } },
      { label: 'Lata produkcji', value: function(c){ return escHtml((c.generacja||'') + ' (' + c.rok_od + '-' + c.rok_do + ')'); } },
      { label: 'Moc seryjna [KM]', value: function(c){ return bar(c.km0, maxKm0); } },
      { label: 'Moc po tuningu [KM]', value: function(c){ return bar(c.km1, maxKm1, 'bar-fill-primary'); } },
      { label: 'Przyrost mocy [KM]', value: function(c){ return bar(c.diff_km, maxGain, 'bar-fill-accent'); } },
      { label: 'Moment seryjny [Nm]', value: function(c){ return bar(c.nm0, maxNm0); } },
      { label: 'Moment po tuningu [Nm]', value: function(c){ return bar(c.nm1, maxNm1, 'bar-fill-primary'); } },
      { label: 'Zmiana procentowa', value: function(c){ return (+c.diff_pct || 0) + '%'; } },
    ];

    var headRow = '<tr><th></th>' + picked.map(function (c) {
      return '<th><a href="/tuning/' + encodeURIComponent(c.slug) + '">' +
        escHtml(c.marka) + ' ' + escHtml(c.model) + '<br><small>' + escHtml(c.silnik) + '</small></a></th>';
    }).join('') + '</tr>';

    var bodyRows = rows.map(function (r) {
      return '<tr><th>' + escHtml(r.label) + '</th>' + picked.map(function (c) {
        return '<td>' + r.value(c) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    box.innerHTML =
      '<div class="compare-table-wrap"><table class="compare-table"><thead>' + headRow + '</thead><tbody>' + bodyRows + '</tbody></table></div>' +
      '<div class="compare-cta"><a class="btn btn-primary" href="/wycena/?slug=' + encodeURIComponent(picked[0].slug) + '">Wyceń tuning ' + escHtml(picked[0].marka) + ' ' + escHtml(picked[0].model) + '</a></div>';
  }

  render();
})();
