// G-Lab - runtime hydratacja realizacji z backendu (Render).
// Działa na /realizacje/ - dociąga publikowane realizacje z API i mergeuje z istniejącym statycznym gridem.
(function () {
  'use strict';
  if (!window.GLab || !window.GLab.api) return;
  var grid = document.getElementById('realizacje-grid');
  if (!grid) return;

  var existingSlugs = {};
  Array.prototype.forEach.call(grid.querySelectorAll('.realization-card'), function (a) {
    var href = a.getAttribute('href') || '';
    var m = href.match(/\/realizacje\/([^/?#]+)/);
    if (m && m[1]) existingSlugs[m[1]] = true;
  });

  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  fetch(window.GLab.api + '/api/realizations?limit=100')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !Array.isArray(j.items)) return;
      var added = 0;
      // Zachowujemy porządek wg daty.
      j.items.sort(function (a, b) { return (b.data || '') < (a.data || '') ? -1 : 1; });
      j.items.forEach(function (r) {
        if (existingSlugs[r.slug]) return;
        var card = buildCard(r);
        grid.insertAdjacentHTML('beforeend', card);
        added++;
      });
      if (added > 0) {
        // Re-fire filter init (jeśli jest na stronie).
        if (typeof window.GLabRefilter === 'function') window.GLabRefilter();
      }
    })
    .catch(function () { /* ignore - statyczna lista i tak działa */ });

  function buildCard(r) {
    // Realizacje z backendu trafiają na dynamiczną podstronę z fetchem po slug
    // (statyczne realizacje z markdown linkują pod /realizacje/<slug>/, dynamiczne pod /realizacje/podglad/?slug=).
    var href = '/realizacje/podglad/?slug=' + encodeURIComponent(r.slug);
    var marka = window.GLab.escHtml(slugify(r.marka || ''));
    var usluga = window.GLab.escHtml(r.usluga || '');
    var rok = r.data ? String(r.data).slice(0, 4) : '';
    var coverHtml;
    if (r.cover && (r.cover.url || r.cover.variants)) {
      coverHtml = '<div class="thumb">' + window.GLab.renderPicture(r.cover, { sizes: '(max-width:600px) 100vw, 33vw' }) + '</div>';
    } else if (r.cover_url) {
      coverHtml = '<div class="thumb" style="background-image:url(\'' + window.GLab.escHtml(r.cover_url) + '\')"></div>';
    } else {
      coverHtml = '<div class="thumb"></div>';
    }
    return (
      '<a class="realization-card" href="' + href + '"' +
      ' data-marka="' + marka + '"' +
      ' data-usluga="' + usluga + '"' +
      ' data-rok="' + window.GLab.escHtml(rok) + '">' +
      coverHtml +
      '<div class="body">' +
      '<div class="meta">' + window.GLab.escHtml(window.GLab.formatDatePL(r.data)) +
      (r.samochod ? ' | ' + window.GLab.escHtml(r.samochod) : '') + '</div>' +
      '<h3>' + window.GLab.escHtml(r.title) + '</h3>' +
      '<p>' + window.GLab.escHtml(r.krotki_opis || '') + '</p>' +
      '</div></a>'
    );
  }
})();
