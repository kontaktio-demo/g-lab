// G-Lab catalog selector + full-text search.
//
// The brand <select> is rendered server-side by build.js so the page is
// interactive on first paint - no fetch, no "loading" placeholder.
// Selecting a brand pulls only that brand's shard from
// /data/katalog/<marka_slug>.json (typically a few-tens of KB gzipped).
// The full /data/katalog.json (~430 KB gzip) is loaded lazily only when the
// user actually engages with the full-text search box - and proactively
// during the browser's idle time so it's usually warm by then.

(function () {
  'use strict';

  // WMI (World Manufacturer Identifier) -> marka. Coverage of brands we have
  // in the catalog. Each WMI is the first 3 chars of a VIN.
  var WMI = {
    'WVW': 'Volkswagen', 'WV1': 'Volkswagen', 'WV2': 'Volkswagen', '1VW': 'Volkswagen', '3VW': 'Volkswagen', '9BW': 'Volkswagen',
    'WAU': 'Audi', 'TRU': 'Audi', 'WA1': 'Audi', '93U': 'Audi', '99A': 'Audi',
    'TMB': 'Skoda',
    'VSS': 'Seat', 'VS6': 'Seat',
    'WBA': 'BMW', 'WBS': 'BMW', 'WBY': 'BMW', 'WBX': 'BMW', '4US': 'BMW', '5UX': 'BMW', '5YM': 'BMW',
    'WMW': 'Mini',
    'WDB': 'Mercedes-Benz', 'WDC': 'Mercedes-Benz', 'WDD': 'Mercedes-Benz', 'WDF': 'Mercedes-Benz', 'WDR': 'Mercedes-Benz',
    'W1K': 'Mercedes-Benz', 'W1N': 'Mercedes-Benz', 'W1V': 'Mercedes-Benz', '4JG': 'Mercedes-Benz',
    'WP0': 'Porsche', 'WP1': 'Porsche',
    'W0L': 'Opel', 'W0V': 'Opel',
    'WF0': 'Ford', 'WFO': 'Ford', '1FA': 'Ford', '1FT': 'Ford', '1FM': 'Ford', '2FA': 'Ford', '3FA': 'Ford',
    'VF3': 'Peugeot', 'VR3': 'Peugeot',
    'VF7': 'Citroen', 'VR7': 'Citroen',
    'VR1': 'DS',
    'VF1': 'Renault', 'VF2': 'Renault',
    'UU1': 'Dacia',
    'ZFA': 'Fiat', 'ZFC': 'Fiat',
    'ZAR': 'Alfa Romeo',
    'ZLA': 'Lancia',
    'YV1': 'Volvo', 'YV4': 'Volvo',
    'SAJ': 'Jaguar',
    'SAL': 'Land Rover',
    'KMH': 'Hyundai', 'TMA': 'Hyundai', '5NP': 'Hyundai', 'KM8': 'Hyundai',
    'KNA': 'Kia', 'KNB': 'Kia', 'KND': 'Kia', 'KNE': 'Kia',
    'KMT': 'Genesis',
    'JTD': 'Toyota', 'JTE': 'Toyota', 'JTG': 'Toyota', 'JTH': 'Lexus',
    'SB1': 'Toyota', '5TD': 'Toyota', '4T1': 'Toyota', '2T1': 'Toyota',
    'JMZ': 'Mazda', 'JM1': 'Mazda', 'JM3': 'Mazda',
    'JHM': 'Honda', '1HG': 'Honda', '2HG': 'Honda', '5J6': 'Honda', '5FN': 'Honda',
    'JN1': 'Nissan', 'JN8': 'Nissan', 'VSK': 'Nissan', 'SJN': 'Nissan',
    'JNK': 'Infiniti', 'JNX': 'Infiniti',
    'JF1': 'Subaru', 'JF2': 'Subaru', '4S3': 'Subaru', '4S4': 'Subaru',
    'JS2': 'Suzuki', 'JSA': 'Suzuki', 'TSM': 'Suzuki',
    'JMB': 'Mitsubishi', 'JA3': 'Mitsubishi', 'JA4': 'Mitsubishi', 'MMC': 'Mitsubishi',
    'KPT': 'SsangYong',
    'YS3': 'Saab',
    'WME': 'Smart',
    'ZCF': 'Iveco',
    'KL1': 'Chevrolet', '1G1': 'Chevrolet', '2G1': 'Chevrolet', '3GN': 'Chevrolet', '1GC': 'Chevrolet',
    '1G6': 'Cadillac',
    '1C3': 'Chrysler', '2C3': 'Chrysler',
    '1B3': 'Dodge', '2B3': 'Dodge', '1D7': 'Dodge',
    '1J4': 'Jeep', '1C4': 'Jeep',
    'VSZ': 'Cupra',
    'SCB': 'Bentley',
    'ZAM': 'Maserati',
  };

  function $(id) { return document.getElementById(id); }

  function uniqSorted(arr) {
    var seen = Object.create(null), out = [];
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (v == null || v === '') continue;
      if (!seen[v]) { seen[v] = 1; out.push(v); }
    }
    return out.sort(function (a, b) { return String(a).localeCompare(String(b), 'pl'); });
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
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

  function carUrl(c) {
    return '/tuning/' + encodeURIComponent(c.slug);
  }

  // VIN heuristic: 17 chars from {A-HJ-NPR-Z0-9} (no I, O, Q).
  var VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
  function maybeVin(q) {
    var s = String(q || '').replace(/\s+/g, '').toUpperCase();
    return VIN_RE.test(s) ? s : null;
  }
  function wmiBrand(vin) {
    if (!vin) return null;
    var w = vin.slice(0, 3).toUpperCase();
    return WMI[w] || null;
  }

  // ---------- Per-brand shard loader (for the marka -> model cascade) ----------

  // marka_slug accepted by the build is [a-z0-9-]{1,80}; reject anything else
  // to avoid building odd URLs.
  var SLUG_RE = /^[a-z0-9-]{1,80}$/;
  var brandShardCache = Object.create(null);
  var brandShardInflight = Object.create(null);

  function loadBrandShard(slug) {
    if (!slug || !SLUG_RE.test(slug)) {
      return Promise.reject(new Error('bad brand slug'));
    }
    if (brandShardCache[slug]) return Promise.resolve(brandShardCache[slug]);
    if (brandShardInflight[slug]) return brandShardInflight[slug];
    var p = fetch('/data/katalog/' + slug + '.json', { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : [];
        brandShardCache[slug] = arr;
        delete brandShardInflight[slug];
        return arr;
      })
      .catch(function (err) {
        delete brandShardInflight[slug];
        throw err;
      });
    brandShardInflight[slug] = p;
    return p;
  }

  // ---------- Full dataset loader (for full-text search) ----------

  var fullData = null;
  var fullDataPromise = null;

  function loadFullData() {
    if (fullData) return Promise.resolve(fullData);
    if (fullDataPromise) return fullDataPromise;
    fullDataPromise = fetch('/data/katalog.json', { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        fullData = Array.isArray(data) ? data : [];
        return fullData;
      })
      .catch(function (err) {
        fullDataPromise = null;
        throw err;
      });
    return fullDataPromise;
  }

  // ---------- Selector cascade ----------

  function initSelector() {
    var form = $('catalog-selector');
    var selMarka = $('sel-marka');
    var selModel = $('sel-model');
    var selRok = $('sel-rok');
    var selSilnik = $('sel-silnik');
    var btnGo = $('catalog-go');
    var resultBox = $('catalog-result');

    if (!form || !selMarka) return;

    // Brand shard relevant to the current selection.
    var currentBrandData = [];
    var currentBrandToken = 0;

    selMarka.addEventListener('change', function () {
      var token = ++currentBrandToken;
      var v = selMarka.value;
      reset(selModel, 'najpierw wybierz markę');
      reset(selRok, 'wybierz rok');
      reset(selSilnik, 'wybierz silnik');
      btnGo.disabled = true;
      currentBrandData = [];
      if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
      if (!v) return;

      var opt = selMarka.selectedOptions && selMarka.selectedOptions[0];
      var slug = opt && opt.dataset ? opt.dataset.slug : '';
      if (!slug) return;

      reset(selModel, 'wczytuję modele...');
      loadBrandShard(slug).then(function (data) {
        if (token !== currentBrandToken) return; // brand changed meanwhile
        currentBrandData = data;
        var models = uniqSorted(data.map(function (x) { return x.model; }));
        fillSelect(selModel, models, 'wybierz model');
      }).catch(function (err) {
        if (token !== currentBrandToken) return;
        console.error('brand shard load failed', err);
        reset(selModel, 'błąd ładowania - odśwież stronę');
      });
    });

    selModel.addEventListener('change', function () {
      var mo = selModel.value;
      reset(selSilnik, 'wybierz silnik'); btnGo.disabled = true;
      if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
      if (!mo) { reset(selRok, 'wybierz rok'); return; }
      var roks = uniqSorted(
        currentBrandData.filter(function (x) { return x.model === mo; })
          .map(function (x) { return x.generacja + ' (' + x.rok_od + '-' + x.rok_do + ')'; })
      );
      fillSelect(selRok, roks, 'wybierz rok');
    });

    selRok.addEventListener('change', function () {
      var mo = selModel.value, r = selRok.value;
      btnGo.disabled = true;
      if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
      if (!r) { reset(selSilnik, 'wybierz silnik'); return; }
      var silniki = uniqSorted(
        currentBrandData.filter(function (x) {
          return x.model === mo &&
            (x.generacja + ' (' + x.rok_od + '-' + x.rok_do + ')') === r;
        }).map(function (x) { return x.silnik; })
      );
      fillSelect(selSilnik, silniki, 'wybierz silnik');
    });

    selSilnik.addEventListener('change', function () { btnGo.disabled = !selSilnik.value; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mo = selModel.value, r = selRok.value, s = selSilnik.value;
      var match;
      for (var i = 0; i < currentBrandData.length; i++) {
        var x = currentBrandData[i];
        if (x.model === mo &&
            (x.generacja + ' (' + x.rok_od + '-' + x.rok_do + ')') === r &&
            x.silnik === s) { match = x; break; }
      }
      if (!match) {
        if (resultBox) {
          resultBox.hidden = false;
          resultBox.innerHTML = '<strong>Nie znaleziono.</strong> Skontaktuj się z nami, sprawdzimy indywidualnie.';
        }
        return;
      }
      if (typeof match.slug !== 'string' || !/^[a-z0-9-]{1,160}$/.test(match.slug)) {
        if (resultBox) {
          resultBox.hidden = false;
          resultBox.innerHTML = '<strong>Błąd danych.</strong> Skontaktuj się z nami.';
        }
        return;
      }
      window.location.assign(carUrl(match));
    });
  }

  // ---------- Full-text search + filters + VIN ----------

  function initSearch() {
    var searchInput = $('catalog-search');
    var resultsBox = $('search-results');
    var fPoj = $('filter-pojemnosc');
    var fSter = $('filter-sterownik');
    var fSort = $('filter-sort');
    var fPaliwo = $('filter-paliwo');

    if (!searchInput && !fPoj && !fSter && !fSort && !fPaliwo) return;

    var sterPopulated = false;
    function populateSterownik(DATA) {
      if (sterPopulated || !fSter) return;
      sterPopulated = true;
      var sterUniq = uniqSorted(DATA.map(function (x) { return x.sterownik; }));
      var html = '<option value="">dowolny</option>';
      for (var i = 0; i < sterUniq.length; i++) html += '<option>' + escHtml(sterUniq[i]) + '</option>';
      fSter.innerHTML = html;
    }

    function pojRange(v) {
      if (!v) return null;
      v = parseFloat(v);
      if (v <= 1.4) return function (c) { return c.pojemnosc != null && c.pojemnosc <= 1.5; };
      if (v <= 1.6) return function (c) { return c.pojemnosc != null && c.pojemnosc >= 1.6 && c.pojemnosc <= 1.9; };
      if (v <= 2.0) return function (c) { return c.pojemnosc != null && c.pojemnosc >= 1.95 && c.pojemnosc <= 2.05; };
      if (v <= 2.2) return function (c) { return c.pojemnosc != null && c.pojemnosc >= 2.1 && c.pojemnosc <= 2.5; };
      return function (c) { return c.pojemnosc != null && c.pojemnosc >= 2.9; };
    }

    function renderResults(DATA) {
      if (!resultsBox) return;
      var rawQ = (searchInput && searchInput.value || '').trim();
      var q = rawQ.toLowerCase();
      var poj = fPoj && pojRange(fPoj.value);
      var ster = fSter && fSter.value;
      var paliwo = fPaliwo && fPaliwo.value;
      var sort = (fSort && fSort.value) || 'brand';

      var vin = maybeVin(rawQ);
      var vinBrand = vin ? wmiBrand(vin) : null;
      var vinNote = '';
      if (vin) {
        if (vinBrand) {
          vinNote = '<p class="search-meta search-meta-vin">Rozpoznano VIN. WMI <code>' + escHtml(vin.slice(0, 3)) +
            '</code> wskazuje markę <strong>' + escHtml(vinBrand) + '</strong>. Pokazuję modele z tej marki.</p>';
        } else {
          vinNote = '<p class="search-meta search-meta-vin">Rozpoznano VIN, ale WMI <code>' + escHtml(vin.slice(0, 3)) +
            '</code> nie jest u nas zmapowany. Spróbuj wpisać markę słownie.</p>';
        }
      }

      if (!q && !poj && !ster && !paliwo) { resultsBox.innerHTML = ''; return; }

      var filtered = [];
      for (var i = 0; i < DATA.length; i++) {
        var c = DATA[i];
        if (poj && !poj(c)) continue;
        if (ster && c.sterownik !== ster) continue;
        if (paliwo && c.paliwo !== paliwo) continue;
        if (vin) {
          if (vinBrand && c.marka !== vinBrand) continue;
        } else if (q) {
          var hay = (c.marka + ' ' + c.model + ' ' + c.generacja + ' ' + c.silnik + ' ' +
                     c.sterownik + ' ' + c.slug + ' ' + (c.paliwo || '')).toLowerCase();
          if (hay.indexOf(q) === -1) continue;
        }
        filtered.push(c);
      }

      if (sort === 'gain') filtered.sort(function (a, b) { return (b.diff_km || 0) - (a.diff_km || 0); });
      else if (sort === 'km') filtered.sort(function (a, b) { return (b.km1 || 0) - (a.km1 || 0); });
      else filtered.sort(function (a, b) { return (a.marka + a.model).localeCompare(b.marka + b.model, 'pl'); });

      var top = filtered.slice(0, 60);
      if (!top.length) {
        resultsBox.innerHTML = vinNote + '<p class="lead">Brak wyników. Skontaktuj się z nami - sprawdzimy indywidualnie.</p>';
        return;
      }
      var meta = '<p class="search-meta">Znaleziono <strong>' + filtered.length + '</strong> wyników' +
        (filtered.length > top.length ? ' (pokazujemy ' + top.length + ')' : '') + '.</p>';
      var cards = '';
      for (var k = 0; k < top.length; k++) {
        var x = top[k];
        var badge = x.s ? ' <span class="car-badge car-badge-est" title="Wartości szacunkowe - potwierdzane pomiarem na hamowni">szac.</span>' : '';
        cards += '<a class="car-card" href="' + escHtml(carUrl(x)) + '">' +
          '<div class="car-title">' + escHtml(x.marka) + ' ' + escHtml(x.model) + ' ' + escHtml(x.generacja) + badge + '</div>' +
          '<div class="car-meta">' + escHtml(x.silnik) + ' | ' + escHtml(x.sterownik) + '</div>' +
          '<div class="car-power"><span class="from">' + (+x.km0 || '?') + ' KM</span>' +
          '<span class="arrow">&rarr;</span><span class="to">' + (+x.km1 || '?') + ' KM</span>' +
          '<span class="diff">+' + (+x.diff_km || 0) + '</span></div>' +
        '</a>';
      }
      resultsBox.innerHTML = vinNote + meta + '<div class="cars-grid cars-grid-search">' + cards + '</div>';
    }

    function runSearch() {
      // If the user hasn't typed anything and no filter is active, no need
      // to load anything - keep the page light.
      var rawQ = (searchInput && searchInput.value || '').trim();
      var anyFilter = (fPoj && fPoj.value) || (fSter && fSter.value) || (fPaliwo && fPaliwo.value);
      if (!rawQ && !anyFilter) {
        if (resultsBox) resultsBox.innerHTML = '';
        return;
      }
      if (fullData) {
        populateSterownik(fullData);
        renderResults(fullData);
        return;
      }
      if (resultsBox) {
        resultsBox.innerHTML = '<p class="search-meta">Wczytuję bazę wyszukiwarki...</p>';
      }
      loadFullData().then(function (data) {
        populateSterownik(data);
        renderResults(data);
      }).catch(function (err) {
        console.error('full catalog load failed', err);
        if (resultsBox) {
          resultsBox.innerHTML = '<p class="lead">Nie udało się wczytać bazy wyszukiwarki. Odśwież stronę.</p>';
        }
      });
    }

    var sTimer;
    function debSearch() { clearTimeout(sTimer); sTimer = setTimeout(runSearch, 100); }

    if (searchInput) {
      searchInput.addEventListener('input', debSearch);
      // Warm up the dataset as soon as the user shows interest.
      searchInput.addEventListener('focus', function () { loadFullData().catch(function () {}); }, { once: true });
    }
    if (fPoj) fPoj.addEventListener('change', runSearch);
    if (fSter) fSter.addEventListener('change', runSearch);
    if (fSort) fSort.addEventListener('change', runSearch);
    if (fPaliwo) fPaliwo.addEventListener('change', runSearch);
    // Eagerly populate the ECU dropdown / preload the dataset on first open
    // of the "Filtry zaawansowane" <details> so it doesn't feel laggy.
    var advanced = document.querySelector('.filters-advanced');
    if (advanced) {
      advanced.addEventListener('toggle', function () {
        if (advanced.open) loadFullData().then(populateSterownik).catch(function () {});
      });
    }

    var initQ = new URLSearchParams(location.search).get('q');
    if (initQ && searchInput) { searchInput.value = initQ; runSearch(); }

    // Idle preload: fetch the full dataset in the background once the page
    // has settled, so by the time the user types into the search box it's
    // already cached. Falls back to a setTimeout in browsers without
    // requestIdleCallback.
    var schedule = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1500); };
    schedule(function () { loadFullData().catch(function () {}); }, { timeout: 3000 });
  }

  function init() {
    initSelector();
    initSearch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
