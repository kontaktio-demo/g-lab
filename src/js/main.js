(function () {
  'use strict';

  function initNav() {
    var btn = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function initReveal() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var autoSelectors = [
      'main .hero > .container > *',
      'main .section > .container > *',
      'main .section .cards-grid > *',
      'main .section .cars-grid > *',
      'main .section .brand-cloud > *',
      'main .markdown-body > *',
      'main .power-grid > *',
      'main .gallery > *',
      'main .cta-band > *',
      'main .cta-box',
      'main .aside-box'
    ];
    autoSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.classList.contains('reveal') || el.closest('.no-reveal')) return;
        el.classList.add('reveal');
        var parent = el.parentElement;
        if (parent && (parent.classList.contains('cards-grid') ||
                       parent.classList.contains('cars-grid') ||
                       parent.classList.contains('brand-cloud') ||
                       parent.classList.contains('power-grid') ||
                       parent.classList.contains('gallery'))) {
          var delay = Math.min(i * 80, 480);
          el.style.setProperty('--reveal-delay', delay + 'ms');
        } else if (el.parentElement && el.parentElement.matches('.hero > .container, .section > .container')) {
          var d = Math.min(i * 90, 360);
          el.style.setProperty('--reveal-delay', d + 'ms');
        }
      });
    });

    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    elements.forEach(function (el) { observer.observe(el); });
  }

  function initPageLoad() {
    document.body.classList.add('page-loaded');
  }

  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    function update() {
      if (window.scrollY > 12) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function initParallax() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    var heroes = document.querySelectorAll('.hero');
    if (!heroes.length) return;
    var ticking = false;
    function update() {
      heroes.forEach(function (hero) {
        var rect = hero.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight) return;
        var offset = Math.max(-120, Math.min(120, window.scrollY * 0.25));
        hero.style.setProperty('--parallax-y', offset + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function initCookieConsent() {
    var consent = document.getElementById('cookieConsent');
    if (!consent) return;
    var STORAGE_KEY = 'glab_cookie_consent';

    function setCookie(name, value, days) {
      var d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      var secure = location.protocol === 'https:' ? ';Secure' : '';
      document.cookie = name + '=' + encodeURIComponent(value) +
        ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax' + secure;
    }
    function deleteCookie(name) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax';
    }
    function readSaved() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      var m = document.cookie.match('(^|;)\\s*' + STORAGE_KEY + '\\s*=\\s*([^;]+)');
      if (m) {
        try { return JSON.parse(decodeURIComponent(m.pop())); } catch (e) {}
      }
      return null;
    }
    function applyConsent(prefs) {
      var payload = JSON.stringify(prefs);
      try { localStorage.setItem(STORAGE_KEY, payload); } catch (e) {}
      setCookie(STORAGE_KEY, payload, 365);
      if (prefs.analytics) setCookie('glab_analytics', '1', 365); else deleteCookie('glab_analytics');
      if (prefs.marketing) setCookie('glab_marketing', '1', 365); else deleteCookie('glab_marketing');
      try {
        document.dispatchEvent(new CustomEvent('cookieconsent', { detail: prefs }));
      } catch (e) {}
    }
    function show() {
      consent.hidden = false;
      void consent.offsetWidth;
      consent.classList.add('show');
      consent.setAttribute('aria-modal', 'false');
    }
    function hide() {
      consent.classList.remove('show');
      var panel = document.getElementById('cookieCustomPanel');
      if (panel) panel.hidden = true;
      setTimeout(function () { consent.hidden = true; }, 400);
    }

    var saved = readSaved();
    if (!saved) {
      setTimeout(show, 600);
    }

    var acceptBtn = document.getElementById('cookieAccept');
    var rejectBtn = document.getElementById('cookieReject');
    var customizeBtn = document.getElementById('cookieCustomize');
    var saveBtn = document.getElementById('cookieSave');
    var analyticsCb = document.getElementById('cookieAnalytics');
    var marketingCb = document.getElementById('cookieMarketing');
    var panel = document.getElementById('cookieCustomPanel');

    if (acceptBtn) acceptBtn.addEventListener('click', function () {
      applyConsent({ necessary: true, analytics: true, marketing: true });
      hide();
    });
    if (rejectBtn) rejectBtn.addEventListener('click', function () {
      applyConsent({ necessary: true, analytics: false, marketing: false });
      hide();
    });
    if (customizeBtn) customizeBtn.addEventListener('click', function () {
      if (!panel) return;
      panel.hidden = !panel.hidden;
      if (!panel.hidden && saved) {
        if (analyticsCb) analyticsCb.checked = !!saved.analytics;
        if (marketingCb) marketingCb.checked = !!saved.marketing;
      }
    });
    if (saveBtn) saveBtn.addEventListener('click', function () {
      applyConsent({
        necessary: true,
        analytics: !!(analyticsCb && analyticsCb.checked),
        marketing: !!(marketingCb && marketingCb.checked)
      });
      hide();
    });

    var openLink = document.getElementById('cookieSettingsLink');
    if (openLink) {
      openLink.addEventListener('click', function (e) {
        e.preventDefault();
        var current = readSaved() || { necessary: true, analytics: false, marketing: false };
        if (analyticsCb) analyticsCb.checked = !!current.analytics;
        if (marketingCb) marketingCb.checked = !!current.marketing;
        if (panel) panel.hidden = false;
        show();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initNav();
      initReveal();
      initPageLoad();
      initHeaderScroll();
      initParallax();
      initCookieConsent();
    });
  } else {
    initNav();
    initReveal();
    initPageLoad();
    initHeaderScroll();
    initParallax();
    initCookieConsent();
  }
})();
