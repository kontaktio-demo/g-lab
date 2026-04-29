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
})();
