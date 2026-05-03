(function () {
  'use strict';

  function initNav() {
    var btn = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    function setOpen(open) {
      nav.classList.toggle('open', open);
      backdrop.classList.toggle('show', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    }

    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    backdrop.addEventListener('click', function () { setOpen(false); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (nav.classList.contains('open')) setOpen(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && nav.classList.contains('open')) setOpen(false);
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
      'main .aside-box',
      'main .process-steps > li',
      'main .tools-band > *',
      'main .reviews-grid > *',
      'main .counters-grid > *',
      'main .about-stats > li'
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
                       parent.classList.contains('gallery') ||
                       parent.classList.contains('process-steps') ||
                       parent.classList.contains('tools-band') ||
                       parent.classList.contains('reviews-grid') ||
                       parent.classList.contains('counters-grid') ||
                       parent.classList.contains('about-stats'))) {
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

  function initParallax() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Auto-tag elements that benefit from subtle scroll parallax.
    var candidates = document.querySelectorAll(
      '.hero-blueprint, .page-hero-art'
    );
    if (!candidates.length) return;

    var items = [];
    candidates.forEach(function (el) {
      if (el.classList.contains('no-parallax')) return;
      el.classList.add('parallax');
      // Strength: hero blueprints drift a bit more than page art
      var strength = el.classList.contains('hero-blueprint') ? 0.18 : 0.10;
      items.push({ el: el, strength: strength });
    });
    if (!items.length) return;

    var ticking = false;
    function update() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      items.forEach(function (it) {
        var rect = it.el.getBoundingClientRect();
        // distance from viewport center, normalized
        var center = rect.top + rect.height / 2;
        var delta = (center - vh / 2);
        // cap so we don't move dramatically on tall heroes
        var capped = Math.max(-200, Math.min(200, delta));
        var y = (-capped * it.strength).toFixed(1);
        it.el.style.setProperty('--parallax-y', y + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initPageLoad() {
    // Sync paint with rAF so reveal/hero appear together with body fade-in
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          document.body.classList.add('page-loaded');
        });
      });
    } else {
      document.body.classList.add('page-loaded');
    }
  }

  function initFooterAccordion() {
    var items = document.querySelectorAll('.footer-collapsible');
    if (!items.length) return;
    var MOBILE = 640;
    function apply() {
      var isMobile = window.innerWidth <= MOBILE;
      items.forEach(function (d) {
        var summary = d.querySelector('summary');
        if (isMobile) {
          // Collapse on phones for a compact footer
          if (d.hasAttribute('open')) d.removeAttribute('open');
          if (summary) summary.setAttribute('aria-expanded', 'false');
        } else {
          // Always expanded on tablets/desktop - looks like normal sections
          if (!d.hasAttribute('open')) d.setAttribute('open', '');
          if (summary) summary.setAttribute('aria-expanded', 'true');
        }
      });
    }
    apply();
    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(apply, 120);
    });
    // Sync aria-expanded on user toggle
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        var s = d.querySelector('summary');
        if (s) s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
      });
    });
  }

  function initImageFade() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    var imgs = document.querySelectorAll('main img');
    imgs.forEach(function (img) {
      if (img.classList.contains('no-fade')) return;
      img.classList.add('img-fade');
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () { img.classList.add('loaded'); }, { once: true });
        img.addEventListener('error', function () { img.classList.add('loaded'); }, { once: true });
      }
    });
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
      initCookieConsent();
      initFooterAccordion();
      initImageFade();
      initParallax();
    });
  } else {
    initNav();
    initReveal();
    initPageLoad();
    initHeaderScroll();
    initCookieConsent();
    initFooterAccordion();
    initImageFade();
    initParallax();
  }
})();
