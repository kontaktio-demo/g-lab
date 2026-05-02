// G-Lab - animowane liczniki przy scrollu
(function () {
  'use strict';
  var els = document.querySelectorAll('.counter-num[data-count]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.textContent = e.dataset.count + (e.dataset.suffix || ''); });
    return;
  }

  function animate(el) {
    var target = +el.dataset.count;
    var suffix = el.dataset.suffix || '';
    var dur = 1400;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(target * eased);
      el.textContent = v.toLocaleString('pl-PL') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        animate(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });
  els.forEach(function (e) { io.observe(e); });
})();
