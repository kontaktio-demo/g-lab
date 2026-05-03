// G-Lab - wspólny moduł klienta (window.GLab).
// Zapewnia:
//  - API endpoint (z window.GLAB_CFG.api lub data-api na <html>)
//  - renderPicture()  - generuje <picture> z wariantami AVIF/WebP/JPG + LQIP/blur
//  - postLead()       - wysyłka formularzy (kontakt / wycena) na backend
//  - escHtml(), formatDatePL()
(function () {
  'use strict';
  var CFG = (window.GLAB_CFG = window.GLAB_CFG || {});
  var API = (CFG.api || '').replace(/\/$/, '');
  var EMAIL = CFG.email || 'kontakt@g-lab.pl';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function formatDatePL(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Renderuje <picture> dla obiektu obrazu zwróconego przez backend
  // ({ url, width, height, alt, lqip, blurhash, variants:[{format,width,height,url}] }).
  // Bezpieczny dla starych wpisów - jeśli brak `variants`, fallback na zwykły <img>.
  function renderPicture(img, opts) {
    opts = opts || {};
    if (!img) return '';
    if (typeof img === 'string') {
      // legacy: zwykły URL
      return (
        '<img src="' + escHtml(img) + '" alt="' + escHtml(opts.alt || '') +
        '" loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async"' +
        (opts.className ? ' class="' + escHtml(opts.className) + '"' : '') +
        '>'
      );
    }
    var alt = escHtml(opts.alt || img.alt || '');
    var sizes = escHtml(opts.sizes || '(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px');
    var loading = opts.eager ? 'eager' : 'lazy';
    var w = img.width || '';
    var h = img.height || '';
    var className = opts.className ? ' class="' + escHtml(opts.className) + '"' : '';

    var variants = Array.isArray(img.variants) ? img.variants : [];
    if (!variants.length) {
      // Jeśli backend nie wygenerował wariantów (lub stary wpis), idziemy z prostym img.
      return (
        '<img src="' + escHtml(img.url) + '" alt="' + alt +
        '" loading="' + loading + '" decoding="async"' +
        (w ? ' width="' + w + '"' : '') +
        (h ? ' height="' + h + '"' : '') +
        className + '>'
      );
    }

    function bucket(fmt) {
      return variants
        .filter(function (v) { return v.format === fmt; })
        .sort(function (a, b) { return a.width - b.width; });
    }
    function srcset(arr) {
      return arr.map(function (v) { return escHtml(v.url) + ' ' + v.width + 'w'; }).join(', ');
    }
    var avif = bucket('avif');
    var webp = bucket('webp');
    var jpg = bucket('jpeg');
    var canonical = (jpg[Math.floor(jpg.length / 2)] || jpg[0] || variants[0]).url;

    // LQIP jako placeholder (rozmazane tło) - ułatwia perceptual perf.
    var bgStyle = img.lqip
      ? ' style="background-image:url(' + escHtml(img.lqip) + ');background-size:cover;background-position:center"'
      : '';

    var html = '<picture' + className + '>';
    if (avif.length) {
      html += '<source type="image/avif" srcset="' + srcset(avif) + '" sizes="' + sizes + '">';
    }
    if (webp.length) {
      html += '<source type="image/webp" srcset="' + srcset(webp) + '" sizes="' + sizes + '">';
    }
    html +=
      '<img src="' + escHtml(canonical) + '"' +
      (jpg.length ? ' srcset="' + srcset(jpg) + '" sizes="' + sizes + '"' : '') +
      ' alt="' + alt + '"' +
      ' loading="' + loading + '" decoding="async"' +
      (w ? ' width="' + w + '"' : '') +
      (h ? ' height="' + h + '"' : '') +
      bgStyle +
      '>';
    html += '</picture>';
    return html;
  }

  // POST /api/leads (jeśli API jest skonfigurowane). Zawsze zwraca Promise<{ok, error?}>.
  // Honeypot: pole `website` przekazujemy puste.
  function postLead(payload) {
    if (!API) {
      return Promise.resolve({ ok: false, error: 'no-api' });
    }
    var body = Object.assign(
      { source: 'kontakt', payload: {}, website: '' },
      payload || {}
    );
    return fetch(API + '/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r
          .json()
          .catch(function () { return {}; })
          .then(function (j) {
            return r.ok ? { ok: true, id: j.id } : { ok: false, error: (j && j.error && j.error.message) || ('HTTP ' + r.status) };
          });
      })
      .catch(function (err) { return { ok: false, error: String(err && err.message || err) }; });
  }

  window.GLab = {
    api: API,
    email: EMAIL,
    escHtml: escHtml,
    formatDatePL: formatDatePL,
    renderPicture: renderPicture,
    postLead: postLead,
  };
})();
