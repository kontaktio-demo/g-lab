// G-Lab - filtry realizacji
(function () {
  'use strict';
  var form = document.getElementById('realizacje-filters');
  var grid = document.getElementById('realizacje-grid');
  if (!form || !grid) return;

  function readCards() {
    return Array.prototype.slice.call(grid.querySelectorAll('.realization-card'));
  }
  var cards = readCards();

  function apply() {
    var f = new FormData(form);
    var marka = (f.get('marka') || '').toString();
    var usluga = (f.get('usluga') || '').toString();
    var rok = (f.get('rok') || '').toString();
    var visible = 0;
    cards.forEach(function (c) {
      var ok = (!marka || c.dataset.marka === marka) &&
               (!usluga || c.dataset.usluga === usluga) &&
               (!rok || c.dataset.rok === rok);
      c.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    var empty = document.getElementById('realizacje-empty');
    if (!empty && !visible) {
      empty = document.createElement('p');
      empty.id = 'realizacje-empty';
      empty.className = 'lead';
      empty.textContent = 'Brak realizacji spełniających filtry.';
      grid.parentNode.appendChild(empty);
    } else if (empty) {
      empty.hidden = !!visible;
    }
  }

  form.addEventListener('change', apply);
  form.addEventListener('reset', function () { setTimeout(apply, 0); });
  apply();

  // Hook dla realizacje-runtime.js — gdy domieszka ma nowe karty z backendu,
  // odświeżamy cache + ponownie aplikujemy filtry.
  window.GLabRefilter = function () {
    cards = readCards();
    apply();
  };

  // Before/after slider activation
  document.querySelectorAll('.ba-slider').forEach(function (slider) {
    var range = slider.querySelector('.ba-range');
    var beforeWrap = slider.querySelector('.ba-before-wrap');
    if (!range || !beforeWrap) return;
    function update() { beforeWrap.style.width = range.value + '%'; }
    range.addEventListener('input', update);
    update();
  });
})();
