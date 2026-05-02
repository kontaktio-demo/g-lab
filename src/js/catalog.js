(function () {
  var dataEl = document.getElementById('catalog-data');
  if (!dataEl) return;
  var DATA;
  try { DATA = JSON.parse(dataEl.textContent || '[]'); } catch (e) { DATA = []; }

  var selMarka = document.getElementById('sel-marka');
  var selModel = document.getElementById('sel-model');
  var selRok = document.getElementById('sel-rok');
  var selSilnik = document.getElementById('sel-silnik');
  var btnGo = document.getElementById('catalog-go');
  var resultBox = document.getElementById('catalog-result');
  var form = document.getElementById('catalog-selector');

  function uniqSorted(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (v == null || v === '') continue;
      if (!seen[v]) { seen[v] = 1; out.push(v); }
    }
    return out.sort(function (a, b) { return String(a).localeCompare(String(b), 'pl'); });
  }

  function fillSelect(sel, options, placeholder) {
    sel.innerHTML = '';
    var opt = document.createElement('option');
    opt.value = ''; opt.textContent = placeholder;
    sel.appendChild(opt);
    for (var i = 0; i < options.length; i++) {
      var o = document.createElement('option');
      o.value = options[i]; o.textContent = options[i];
      sel.appendChild(o);
    }
    sel.disabled = options.length === 0;
  }

  function reset(sel, placeholder) {
    sel.innerHTML = '<option value="">' + placeholder + '</option>';
    sel.disabled = true;
  }

  function init() {
    fillSelect(selMarka, uniqSorted(DATA.map(function (x) { return x.marka; })), 'wybierz markę');
    reset(selModel, 'najpierw wybierz markę');
    reset(selRok, 'wybierz rok');
    reset(selSilnik, 'wybierz silnik');
    btnGo.disabled = true;
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
  }

  selMarka.addEventListener('change', function () {
    var v = selMarka.value;
    reset(selRok, 'wybierz rok'); reset(selSilnik, 'wybierz silnik'); btnGo.disabled = true;
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
    if (!v) { reset(selModel, 'najpierw wybierz markę'); return; }
    var models = uniqSorted(DATA.filter(function (x) { return x.marka === v; }).map(function (x) { return x.model; }));
    fillSelect(selModel, models, 'wybierz model');
  });

  selModel.addEventListener('change', function () {
    var m = selMarka.value, mo = selModel.value;
    reset(selSilnik, 'wybierz silnik'); btnGo.disabled = true;
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
    if (!mo) { reset(selRok, 'wybierz rok'); return; }
    var roks = uniqSorted(
      DATA.filter(function (x) { return x.marka === m && x.model === mo; })
          .map(function (x) { return x.generacja + ' (' + x.rok_od + '-' + x.rok_do + ')'; })
    );
    fillSelect(selRok, roks, 'wybierz rok');
  });

  selRok.addEventListener('change', function () {
    var m = selMarka.value, mo = selModel.value, r = selRok.value;
    btnGo.disabled = true;
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
    if (!r) { reset(selSilnik, 'wybierz silnik'); return; }
    var silniki = uniqSorted(
      DATA.filter(function (x) {
        return x.marka === m && x.model === mo &&
               (x.generacja + ' (' + x.rok_od + '-' + x.rok_do + ')') === r;
      }).map(function (x) { return x.silnik; })
    );
    fillSelect(selSilnik, silniki, 'wybierz silnik');
  });

  selSilnik.addEventListener('change', function () {
    btnGo.disabled = !selSilnik.value;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = selMarka.value, mo = selModel.value, r = selRok.value, s = selSilnik.value;
    var match = DATA.filter(function (x) {
      return x.marka === m && x.model === mo &&
             (x.generacja + ' (' + x.rok_od + '-' + x.rok_do + ')') === r &&
             x.silnik === s;
    })[0];
    if (!match) {
      if (resultBox) {
        resultBox.hidden = false;
        resultBox.innerHTML = '<strong>Nie znaleziono.</strong> Skontaktuj się z nami, sprawdzimy indywidualnie.';
      }
      return;
    }
    if (typeof match.slug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(match.slug)) {
      if (resultBox) {
        resultBox.hidden = false;
        resultBox.innerHTML = '<strong>Błąd danych.</strong> Skontaktuj się z nami.';
      }
      return;
    }
    window.location.assign('/tuning/' + encodeURIComponent(match.slug));
  });

  init();

  // ------- Full-text search + advanced filters -------

  var searchInput = document.getElementById('catalog-search');
  var resultsBox = document.getElementById('search-results');
  var fPoj = document.getElementById('filter-pojemnosc');
  var fSter = document.getElementById('filter-sterownik');
  var fSort = document.getElementById('filter-sort');

  if (fSter) {
    var sterUniq = uniqSorted(DATA.map(function (x) { return x.sterownik; }));
    var html = '<option value="">dowolny</option>';
    for (var i = 0; i < sterUniq.length; i++) html += '<option>' + sterUniq[i] + '</option>';
    fSter.innerHTML = html;
  }

  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function pojRange(v) {
    if (!v) return null;
    v = parseFloat(v);
    if (v <= 1.4) return function (c) { return c.pojemnosc != null && c.pojemnosc <= 1.5; };
    if (v <= 1.6) return function (c) { return c.pojemnosc != null && c.pojemnosc >= 1.6 && c.pojemnosc <= 1.9; };
    if (v <= 2.0) return function (c) { return c.pojemnosc != null && c.pojemnosc >= 1.95 && c.pojemnosc <= 2.05; };
    if (v <= 2.2) return function (c) { return c.pojemnosc != null && c.pojemnosc >= 2.1 && c.pojemnosc <= 2.5; };
    return function (c) { return c.pojemnosc != null && c.pojemnosc >= 2.9; };
  }

  function runSearch() {
    if (!resultsBox) return;
    var q = (searchInput && searchInput.value || '').trim().toLowerCase();
    var poj = fPoj && pojRange(fPoj.value);
    var ster = fSter && fSter.value;
    var sort = (fSort && fSort.value) || 'brand';
    if (!q && !poj && !ster) { resultsBox.innerHTML = ''; return; }

    var filtered = DATA.filter(function (c) {
      if (poj && !poj(c)) return false;
      if (ster && c.sterownik !== ster) return false;
      if (q) {
        var hay = (c.marka + ' ' + c.model + ' ' + c.generacja + ' ' + c.silnik + ' ' + c.sterownik + ' ' + c.slug).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (sort === 'gain') filtered.sort(function (a, b) { return (b.diff_km||0) - (a.diff_km||0); });
    else if (sort === 'km') filtered.sort(function (a, b) { return (b.km1||0) - (a.km1||0); });
    else filtered.sort(function (a, b) { return (a.marka + a.model).localeCompare(b.marka + b.model, 'pl'); });

    var top = filtered.slice(0, 60);
    if (!top.length) {
      resultsBox.innerHTML = '<p class="lead">Brak wyników. Skontaktuj się z nami - sprawdzimy indywidualnie.</p>';
      return;
    }
    var grid = '<p class="search-meta">Znaleziono <strong>' + filtered.length + '</strong> wyników' + (filtered.length > top.length ? ' (pokazujemy ' + top.length + ')' : '') + '.</p>' +
      '<div class="cars-grid cars-grid-search">' + top.map(function (c) {
      return '<a class="car-card" href="/tuning/' + escHtml(c.slug) + '">' +
        '<div class="car-title">' + escHtml(c.marka) + ' ' + escHtml(c.model) + ' ' + escHtml(c.generacja) + '</div>' +
        '<div class="car-meta">' + escHtml(c.silnik) + ' | ' + escHtml(c.sterownik) + '</div>' +
        '<div class="car-power"><span class="from">' + (c.km0||'?') + ' KM</span><span class="arrow">→</span><span class="to">' + (c.km1||'?') + ' KM</span><span class="diff">+' + (c.diff_km||0) + '</span></div>' +
      '</a>';
    }).join('') + '</div>';
    resultsBox.innerHTML = grid;
  }

  var sTimer;
  function debSearch() { clearTimeout(sTimer); sTimer = setTimeout(runSearch, 100); }

  if (searchInput) searchInput.addEventListener('input', debSearch);
  if (fPoj) fPoj.addEventListener('change', runSearch);
  if (fSter) fSter.addEventListener('change', runSearch);
  if (fSort) fSort.addEventListener('change', runSearch);

  // Initial search if ?q= present
  var initQ = new URLSearchParams(location.search).get('q');
  if (initQ && searchInput) { searchInput.value = initQ; runSearch(); }
})();
