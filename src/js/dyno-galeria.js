// G-Lab - galeria hamowni: filtry, sortowanie, lightbox
(function () {
  'use strict';
  var grid = document.getElementById('dyno-grid');
  var empty = document.getElementById('dyno-empty');
  var form = document.getElementById('dyno-filters');
  if (!grid || !form) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.dyno-card'));

  function gain(card) {
    var nums = card.querySelector('.dyno-card-numbers strong');
    if (!nums) return 0;
    var m = String(nums.textContent).match(/(\d+)\s*[->]+\s*(\d+)/);
    if (!m) return 0;
    return +m[2] - +m[1];
  }

  function apply() {
    var f = new FormData(form);
    var marka = (f.get('marka') || '').toString();
    var stage = (f.get('stage') || '').toString();
    var minKm = +f.get('km1') || 0;
    var sort = (f.get('sort') || 'gain-desc').toString();

    var visible = cards.filter(function (c) {
      if (marka && c.dataset.marka !== marka) return false;
      if (stage && c.dataset.stage !== stage) return false;
      if (minKm && +c.dataset.km1 < minKm) return false;
      return true;
    });

    if (sort === 'gain-desc') visible.sort(function (a, b) { return gain(b) - gain(a); });
    else if (sort === 'km1-desc') visible.sort(function (a, b) { return +b.dataset.km1 - +a.dataset.km1; });
    else if (sort === 'km1-asc') visible.sort(function (a, b) { return +a.dataset.km1 - +b.dataset.km1; });

    cards.forEach(function (c) { c.style.display = 'none'; });
    visible.forEach(function (c) { c.style.display = ''; grid.appendChild(c); });
    if (empty) empty.hidden = visible.length > 0;
  }

  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  form.addEventListener('reset', function () { setTimeout(apply, 0); });
  apply();

  // Lightbox - klikniecie na kartę z modyfikatorem otwiera fullscreen
  var lb = document.getElementById('dyno-lightbox');
  var lbInner = lb && lb.querySelector('.lightbox-inner');
  var lbClose = lb && lb.querySelector('.lightbox-close');
  function openLb(svgHtml) {
    if (!lb || !lbInner) return;
    lbInner.innerHTML = svgHtml;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { if (lb) lb.hidden = true; document.body.style.overflow = ''; }
  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });

  cards.forEach(function (c) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dyno-fullscreen';
    btn.setAttribute('aria-label', 'Powiększ wykres');
    btn.innerHTML = '⛶';
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var fig = c.querySelector('.dyno-card-art');
      if (fig) openLb(fig.innerHTML);
    });
    c.appendChild(btn);
  });
})();
