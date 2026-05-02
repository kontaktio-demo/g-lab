// G-Lab - kalkulatory
(function () {
  'use strict';
  var dataEl = document.getElementById('kalk-data');
  if (!dataEl) return;
  var CARS = [];
  try { CARS = JSON.parse(dataEl.textContent || '[]'); } catch (e) { CARS = []; }

  // Tabs
  var tabs = document.querySelectorAll('.kalk-tab');
  var panels = document.querySelectorAll('.kalk-panel');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected','false'); });
      panels.forEach(function (p) { p.classList.remove('is-active'); p.hidden = true; });
      t.classList.add('is-active'); t.setAttribute('aria-selected','true');
      var name = t.getAttribute('data-tab');
      var panel = document.querySelector('.kalk-panel[data-panel="' + name + '"]');
      if (panel) { panel.classList.add('is-active'); panel.hidden = false; }
    });
  });

  function fmtZl(v) {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(v);
  }
  function fmtNum(v, dec) {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: dec || 0 }).format(v);
  }

  // ---- 1. Paliwo ----
  function calcPaliwo() {
    var f = document.getElementById('form-paliwo');
    var km = +f.km.value, sp = +f.spalanie.value, drop = +f.spadek.value, pr = +f.cena.value;
    if (!km || !sp || drop < 0 || !pr) return;
    var saved_l_year = (km / 100) * drop;
    var saved_zl_year = saved_l_year * pr;
    var saved_zl_5y = saved_zl_year * 5;
    var pct = (drop / sp) * 100;
    document.getElementById('result-paliwo').innerHTML =
      '<div class="kalk-tiles">' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtNum(saved_l_year, 0) + ' l</span><span class="kalk-tile-label">rocznej oszczędności paliwa</span></div>' +
        '<div class="kalk-tile kalk-tile-primary"><span class="kalk-tile-num">' + fmtZl(saved_zl_year) + '</span><span class="kalk-tile-label">rocznej oszczędności w zł</span></div>' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtZl(saved_zl_5y) + '</span><span class="kalk-tile-label">w 5 lat</span></div>' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtNum(pct, 1) + '%</span><span class="kalk-tile-label">spadek spalania</span></div>' +
      '</div>';
  }
  ['input','change'].forEach(function (e) {
    var f = document.getElementById('form-paliwo');
    if (f) f.addEventListener(e, calcPaliwo);
  });
  calcPaliwo();

  // ---- 2. Stages ----
  var dl = document.getElementById('cars-datalist');
  if (dl) {
    var html = '';
    for (var i = 0; i < CARS.length; i++) html += '<option value="' + CARS[i].label + '"></option>';
    dl.innerHTML = html;
  }
  function findCar(q) {
    if (!q) return null;
    q = q.toLowerCase();
    for (var i = 0; i < CARS.length; i++) {
      if (CARS[i].label.toLowerCase() === q) return CARS[i];
    }
    // fallback - includes
    for (var j = 0; j < CARS.length; j++) {
      if (CARS[j].label.toLowerCase().indexOf(q) !== -1) return CARS[j];
    }
    return null;
  }
  function renderStages(c) {
    if (!c) {
      document.getElementById('result-stages').innerHTML = '<p class="kalk-hint">Wpisz auto żeby zobaczyć Stage 1/2/3.</p>';
      return;
    }
    var s1km = c.km1 || 0, s1nm = c.nm1 || 0;
    var s2km = Math.round(s1km * 1.10), s2nm = Math.round(s1nm * 1.07);
    var s3km = Math.round(s1km * 1.30), s3nm = Math.round(s1nm * 1.20);
    var rows = [
      { name: 'Stage 1', km: s1km, nm: s1nm, cost: '1500 - 2200 zł', risk: 'minimalne',
        desc: 'Tylko software, fabryczny osprzęt.' },
      { name: 'Stage 2', km: s2km, nm: s2nm, cost: '4000 - 7000 zł', risk: 'umiarkowane',
        desc: 'Software + downpipe / intercooler / wkład filtra.' },
      { name: 'Stage 3', km: s3km, nm: s3nm, cost: '12 000 - 25 000 zł', risk: 'wysokie',
        desc: 'Hybrydowa turbo, wtryskiwacze, mocowane sprzęgło.' },
    ];
    var html =
      '<p class="kalk-hint">Bazowe wartości seryjne: <strong>' + c.km0 + ' KM / ' + c.nm0 + ' Nm</strong></p>' +
      '<div class="stages-grid">' +
        rows.map(function (r, i) {
          return '<article class="stage-card stage-' + (i+1) + '">' +
            '<header><h3>' + r.name + '</h3><span class="stage-badge">' + r.risk + '</span></header>' +
            '<div class="stage-power"><strong>' + r.km + '</strong> KM <span>+' + (r.km - c.km0) + '</span></div>' +
            '<div class="stage-torque"><strong>' + r.nm + '</strong> Nm <span>+' + (r.nm - c.nm0) + '</span></div>' +
            '<p class="stage-desc">' + r.desc + '</p>' +
            '<div class="stage-cost">' + r.cost + '</div>' +
          '</article>';
        }).join('') +
      '</div>' +
      '<p class="stages-note">Wartości Stage 2 i 3 są szacunkowe i zależą od konkretnej konfiguracji. <a href="/wycena/">Wyceń dokładnie</a>.</p>';
    document.getElementById('result-stages').innerHTML = html;
  }
  var sSearch = document.getElementById('stages-search');
  if (sSearch) {
    sSearch.addEventListener('input', function () { renderStages(findCar(sSearch.value)); });
    sSearch.addEventListener('change', function () { renderStages(findCar(sSearch.value)); });
  }
  renderStages(null);

  // ---- 3. ROI ----
  function calcRoi() {
    var f = document.getElementById('form-roi');
    var koszt = +f.koszt.value, drop = +f.spadek.value, pr = +f.cena.value, km = +f.km.value;
    if (!koszt || !drop || !pr || !km) return;
    var saved_per_km = (drop / 100) * pr;
    var km_to_break = saved_per_km > 0 ? Math.round(koszt / saved_per_km) : Infinity;
    var months = (km > 0 && saved_per_km > 0) ? Math.round((km_to_break / km) * 12) : Infinity;
    var saved_5y = ((km * 5 / 100) * drop * pr) - koszt;
    document.getElementById('result-roi').innerHTML =
      '<div class="kalk-tiles">' +
        '<div class="kalk-tile kalk-tile-primary"><span class="kalk-tile-num">' + (isFinite(km_to_break) ? fmtNum(km_to_break, 0) : '∞') + ' km</span><span class="kalk-tile-label">do zwrotu</span></div>' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + (isFinite(months) ? months : '∞') + ' mies.</span><span class="kalk-tile-label">przy podanym przebiegu</span></div>' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtZl(saved_5y) + '</span><span class="kalk-tile-label">netto po 5 latach</span></div>' +
      '</div>';
  }
  ['input','change'].forEach(function (e) {
    var f = document.getElementById('form-roi');
    if (f) f.addEventListener(e, calcRoi);
  });
  calcRoi();

  // ---- 4. DPF / AdBlue ----
  function calcDpf() {
    var f = document.getElementById('form-dpf');
    var km = +f.km.value, ca = +f.cena_adblue.value, za = +f.zuzycie_adblue.value;
    var dc = +f.dpf_cost.value, dl_km = (+f.dpf_lifespan.value) * 1000;
    if (!km) return;
    // AdBlue savings per year (assume off so no consumption)
    var adblue_year = (km / 1000) * za * ca;
    // DPF amortyzacja: prawdopodobieństwo wymiany w ciągu roku
    var dpf_year = dl_km > 0 ? (km / dl_km) * dc : 0;
    var total_year = adblue_year + dpf_year;
    var total_5y = total_year * 5;
    document.getElementById('result-dpf').innerHTML =
      '<div class="kalk-tiles">' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtZl(adblue_year) + '</span><span class="kalk-tile-label">oszczędności AdBlue / rok</span></div>' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtZl(dpf_year) + '</span><span class="kalk-tile-label">amortyzacja DPF / rok</span></div>' +
        '<div class="kalk-tile kalk-tile-primary"><span class="kalk-tile-num">' + fmtZl(total_year) + '</span><span class="kalk-tile-label">razem rocznie</span></div>' +
        '<div class="kalk-tile"><span class="kalk-tile-num">' + fmtZl(total_5y) + '</span><span class="kalk-tile-label">razem w 5 lat</span></div>' +
      '</div>' +
      '<p class="kalk-warning">Modyfikacje układu wydechowego dopuszczone tylko poza ruchem publicznym. Decyzję podejmuje świadomie właściciel.</p>';
  }
  ['input','change'].forEach(function (e) {
    var f = document.getElementById('form-dpf');
    if (f) f.addEventListener(e, calcDpf);
  });
  calcDpf();
})();
