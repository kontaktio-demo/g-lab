#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const TEMPLATES = path.join(ROOT, 'templates');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || 'https://g-lab.pl').replace(/\/$/, '');
const SITE_NAME = 'G-Lab Chip Tuning';
const BUSINESS = {
  name: 'G-Lab Diesel Tuning',
  legalName: 'G-Lab Chip Tuning',
  street: 'Rokicińska 266',
  postal: '92-620',
  city: 'Łódź',
  region: 'łódzkie',
  country: 'PL',
  lat: 51.7503,
  lng: 19.5468,
  phone: '+48508146945',
  phoneDisplay: '+48 508 146 945',
  email: 'kontakt@g-lab.pl',
  founded: 2006,
  hours: [
    { days: ['Mo','Tu','We','Th','Fr'], open: '09:00', close: '18:00' },
    { days: ['Sa'], open: '09:00', close: '14:00' },
  ],
};
// Optional analytics IDs - can be set in the deployment env (Netlify / Vercel).
const GA4_ID = process.env.GA4_ID || '';        // np. G-XXXXXXX
const GTM_ID = process.env.GTM_ID || '';        // np. GTM-XXXXXXX
const CLARITY_ID = process.env.CLARITY_ID || ''; // np. abcdefgh12

// Backend (Render) - jeśli ustawione, strona będzie:
//   1) dociągać realizacje runtime'em (auto-update bez rebuildu),
//   2) wysyłać formularze (kontakt, wycena) do /api/leads.
// Pozostawienie pustego = pełny tryb statyczny (build-time only).
const GLAB_API_URL = (process.env.GLAB_API_URL || '').replace(/\/$/, '');

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => escMap[c]);
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l').replace(/Ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content);
}
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  ensureDir(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : ''
  );
}

const T = {
  layout: readFile(path.join(TEMPLATES, 'layout.html')),
  home: readFile(path.join(TEMPLATES, 'home.html')),
  katalog: readFile(path.join(TEMPLATES, 'katalog.html')),
  auto: readFile(path.join(TEMPLATES, 'auto.html')),
  archiwum: readFile(path.join(TEMPLATES, 'archiwum.html')),
  page: readFile(path.join(TEMPLATES, 'page.html')),
  realizacjeList: readFile(path.join(TEMPLATES, 'realizacje-list.html')),
  realizacja: readFile(path.join(TEMPLATES, 'realizacja.html')),
  kalkulatory: readFile(path.join(TEMPLATES, 'kalkulatory.html')),
  porownaj: readFile(path.join(TEMPLATES, 'porownaj.html')),
  wycena: readFile(path.join(TEMPLATES, 'wycena.html')),
  dynoGaleria: readFile(path.join(TEMPLATES, 'dyno-galeria.html')),
};

function analyticsHead() {
  let out = '';
  if (GTM_ID) {
    out += `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>`;
  }
  if (GA4_ID) {
    out += `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}',{anonymize_ip:true});</script>`;
  }
  if (CLARITY_ID) {
    out += `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");</script>`;
  }
  return out;
}

function gtmNoScript() {
  if (!GTM_ID) return '';
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

function jsonldScript(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

function breadcrumbsJsonLd(items) {
  // items: [{name, url}]
  return jsonldScript({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: SITE_URL + it.url,
    })),
  });
}

function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': SITE_URL + '/#business',
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    foundingDate: String(BUSINESS.founded),
    image: SITE_URL + '/img/og-default.svg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postal,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.lat, longitude: BUSINESS.lng },
    openingHoursSpecification: BUSINESS.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => ({Mo:'Monday',Tu:'Tuesday',We:'Wednesday',Th:'Thursday',Fr:'Friday',Sa:'Saturday',Su:'Sunday'}[d])),
      opens: h.open, closes: h.close,
    })),
    priceRange: '$$',
    areaServed: 'PL',
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '127' },
    sameAs: [],
  };
}
function localBusinessJsonLd() { return jsonldScript(localBusinessSchema()); }

function faqJsonLd(items) {
  return jsonldScript({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  });
}

function faqHtml(items) {
  return `<section class="section">
    <div class="container">
      <h2 class="section-title">Najczęściej zadawane pytania</h2>
      <div class="faq-list">
        ${items.map((q) => `<details class="faq-item"><summary>${esc(q.q)}</summary><div>${esc(q.a)}</div></details>`).join('\n')}
      </div>
    </div>
  </section>`;
}

function ogImagePath(slug) { return `/og/${slug || 'default'}.svg`; }

function wrapLayout({
  title, description, canonicalPath, content,
  extraHead = '', extraScripts = '', breadcrumbs = null,
  ogImage = null, jsonld = [],
}) {
  const ogImg = SITE_URL + (ogImage || '/img/og-default.svg');
  const head =
    `<meta property="og:image" content="${esc(ogImg)}">` +
    `<meta name="twitter:image" content="${esc(ogImg)}">` +
    `<meta name="theme-color" content="#0a0a0a">` +
    `<link rel="manifest" href="/manifest.webmanifest">` +
    `<link rel="apple-touch-icon" href="/img/favicon.svg">` +
    // Konfiguracja runtime - backend (Render). Jeśli pusta, JS po stronie klienta przejdzie w tryb static-only.
    `<script>window.GLAB_CFG=${JSON.stringify({ api: GLAB_API_URL, email: BUSINESS.email })};</script>` +
    analyticsHead() +
    (breadcrumbs ? breadcrumbsJsonLd(breadcrumbs) : '') +
    jsonld.map(jsonldScript).join('') +
    extraHead;
  return render(T.layout, {
    TITLE: esc(title),
    DESCRIPTION: esc(description),
    CANONICAL: SITE_URL + canonicalPath,
    CONTENT: gtmNoScript() + content,
    YEAR: new Date().getFullYear(),
    FOUNDED: BUSINESS.founded,
    EXTRA_HEAD: head,
    EXTRA_SCRIPTS: extraScripts,
    PHONE_HREF: BUSINESS.phone.replace(/\s/g, ''),
    PHONE_DISPLAY: BUSINESS.phoneDisplay,
  });
}

// G-Lab specjalizuje się w dieslach - wszystkie pozycje katalogowe traktujemy jako diesel.
function detectFuel() { return 'diesel'; }

function detectCapacity(silnik) {
  const m = String(silnik || '').match(/(\d+\.\d+)/);
  return m ? Number(m[1]) : null;
}

function loadCatalog() {
  const csv = readFile(path.join(ROOT, 'katalog.csv'));
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
  return rows.map((r) => {
    const num = (k) => (r[k] === '' || r[k] == null ? null : Number(r[k]));
    const slug = (r.slug && r.slug.trim()) || slugify(
      [r.marka, r.model, r.generacja, r.silnik].filter(Boolean).join(' ')
    );
    const moc_km_seryjna = num('moc_km_seryjna');
    const moc_km_tuning = num('moc_km_tuning');
    const moment_seryjny = num('moment_seryjny');
    const moment_tuning = num('moment_tuning');
    return {
      marka: r.marka, model: r.model, generacja: r.generacja,
      rok_od: r.rok_od, rok_do: r.rok_do, silnik: r.silnik,
      moc_kw_seryjna: num('moc_kw_seryjna'), moc_km_seryjna,
      moc_kw_tuning: num('moc_kw_tuning'), moc_km_tuning,
      moment_seryjny, moment_tuning,
      sterownik: r.sterownik, slug,
      marka_slug: slugify(r.marka),
      silnik_slug: slugify((r.marka || '') + ' ' + r.silnik),
      sterownik_slug: slugify(r.sterownik),
      paliwo: detectFuel(r.silnik),
      pojemnosc: detectCapacity(r.silnik),
      diff_km: (moc_km_tuning || 0) - (moc_km_seryjna || 0),
      diff_nm: (moment_tuning || 0) - (moment_seryjny || 0),
      diff_pct: moc_km_seryjna ? Math.round(((moc_km_tuning - moc_km_seryjna) / moc_km_seryjna) * 100) : 0,
    };
  });
}

// Animated dyno SVG chart - power & torque, stock vs tuned.
// We synthesize realistic curves from peak power/torque using a torque
// curve shape typical for turbo diesels: torque is broad/flat between
// ~1800-3000 rpm, power rises towards ~4000 rpm.
function dynoChartSvg(car, opts) {
  opts = opts || {};
  const w = opts.width || 600;
  const h = opts.height || 360;
  const padL = 56, padR = 24, padT = 22, padB = 46;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const rpmMin = 1000, rpmMax = 5000;
  const ticks = [1500, 2000, 2500, 3000, 3500, 4000, 4500];
  const yMaxRaw = Math.max(car.moc_km_tuning || 0, car.moment_tuning || 0) * 1.08;
  const yMax = Math.ceil(yMaxRaw / 50) * 50 || 800;
  const yTicks = [];
  for (let v = 0; v <= yMax; v += yMax > 600 ? 200 : 100) yTicks.push(v);

  const xAt = (rpm) => padL + ((rpm - rpmMin) / (rpmMax - rpmMin)) * innerW;
  const yAt = (val) => padT + innerH - (val / yMax) * innerH;

  // Curve generators
  // Power: rises from ~25% at 1500rpm to peak around 4000rpm then small drop
  function powerAt(peakKm, rpm) {
    const t = (rpm - 1500) / (4000 - 1500); // 0 at 1500, 1 at 4000
    if (rpm < 1500) {
      const tt = (rpm - 1000) / 500; // 0..1
      return peakKm * (0.18 + 0.07 * Math.max(0, tt));
    }
    if (rpm <= 4000) {
      // smoothstep-like curve
      const s = t * t * (3 - 2 * t);
      return peakKm * (0.25 + 0.75 * s);
    }
    // post-peak gentle decline
    const td = (rpm - 4000) / 1000;
    return peakKm * (1 - 0.1 * Math.max(0, Math.min(1, td)));
  }
  // Torque: plateaus 1800-3000rpm at peak, then declines
  function torqueAt(peakNm, rpm) {
    if (rpm < 1500) {
      const t = (rpm - 1000) / 500;
      return peakNm * (0.45 + 0.35 * Math.max(0, t));
    }
    if (rpm < 1900) {
      const t = (rpm - 1500) / 400;
      return peakNm * (0.80 + 0.20 * t);
    }
    if (rpm <= 3100) return peakNm;
    const t = (rpm - 3100) / 1900;
    return peakNm * (1 - 0.45 * Math.min(1, t));
  }

  function curvePath(fn, peak, samples) {
    samples = samples || 36;
    let d = '';
    for (let i = 0; i <= samples; i++) {
      const rpm = rpmMin + ((rpmMax - rpmMin) * i) / samples;
      const v = fn(peak, rpm);
      d += (i === 0 ? 'M' : 'L') + xAt(rpm).toFixed(1) + ' ' + yAt(v).toFixed(1) + ' ';
    }
    return d.trim();
  }

  const stockPower = curvePath(powerAt, car.moc_km_seryjna || 0);
  const tunedPower = curvePath(powerAt, car.moc_km_tuning || 0);
  const stockTorque = curvePath(torqueAt, car.moment_seryjny || 0);
  const tunedTorque = curvePath(torqueAt, car.moment_tuning || 0);

  const grid =
    ticks.map((r) => `<line x1="${xAt(r)}" y1="${padT}" x2="${xAt(r)}" y2="${padT + innerH}" />`).join('') +
    yTicks.map((v) => `<line x1="${padL}" y1="${yAt(v)}" x2="${padL + innerW}" y2="${yAt(v)}" />`).join('');

  const xLabels = ticks.map((r) =>
    `<text x="${xAt(r)}" y="${padT + innerH + 14}" text-anchor="middle">${r}</text>`).join('');
  const yLabels = yTicks.map((v) =>
    `<text x="${padL - 6}" y="${yAt(v) + 3}" text-anchor="end">${v}</text>`).join('');

  // length-based animation: stroke-dasharray with sufficiently large length
  return `
<figure class="dyno-chart" aria-label="Wykres dyno - przed i po tuningu">
<svg viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet" class="dyno-svg">
  <title>Wykres mocy i momentu - ${esc(car.marka)} ${esc(car.model)} ${esc(car.silnik)}</title>
  <defs>
    <linearGradient id="dyno-fill-${car.slug}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${padL}" y="${padT}" width="${innerW}" height="${innerH}" fill="none" stroke="currentColor" stroke-opacity="0.35" />
  <g class="dyno-grid" stroke="currentColor" stroke-opacity="0.10" stroke-width="1">${grid}</g>
  <g class="dyno-axis-text" font-family="Inter, system-ui, sans-serif" font-size="10" fill="currentColor" fill-opacity="0.65">
    ${xLabels}${yLabels}
    <text x="${padL + innerW / 2}" y="${h - 8}" text-anchor="middle" fill-opacity="0.55">obr/min</text>
    <text x="14" y="${padT + innerH / 2}" text-anchor="middle" transform="rotate(-90 14 ${padT + innerH / 2})" fill-opacity="0.55">Moc [KM] / Moment [Nm]</text>
  </g>

  <!-- area under tuned power -->
  <path d="${tunedPower} L ${xAt(rpmMax)} ${yAt(0)} L ${xAt(rpmMin)} ${yAt(0)} Z" fill="url(#dyno-fill-${car.slug})" stroke="none"/>

  <!-- stock curves (dashed) -->
  <path d="${stockPower}" class="dyno-line dyno-stock dyno-power" fill="none" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.6" stroke-dasharray="6 4"/>
  <path d="${stockTorque}" class="dyno-line dyno-stock dyno-torque" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.4" stroke-dasharray="3 3"/>

  <!-- tuned curves (animated draw) -->
  <path d="${tunedPower}" class="dyno-line dyno-tuned dyno-power-tuned" fill="none" stroke="#ff5a1f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${tunedTorque}" class="dyno-line dyno-tuned dyno-torque-tuned" fill="none" stroke="#ffb020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- peak markers -->
  <g class="dyno-peaks">
    <circle cx="${xAt(4000)}" cy="${yAt(car.moc_km_tuning || 0)}" r="4" fill="#ff5a1f"/>
    <text x="${xAt(4000) + 8}" y="${yAt(car.moc_km_tuning || 0) - 6}" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" fill="#ff5a1f">${car.moc_km_tuning || 0} KM</text>
    <circle cx="${xAt(2400)}" cy="${yAt(car.moment_tuning || 0)}" r="4" fill="#ffb020"/>
    <text x="${xAt(2400) + 8}" y="${yAt(car.moment_tuning || 0) - 6}" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffb020">${car.moment_tuning || 0} Nm</text>
  </g>
</svg>
<figcaption class="dyno-legend">
  <span><span class="swatch swatch-power"></span>Moc po tuningu</span>
  <span><span class="swatch swatch-torque"></span>Moment po tuningu</span>
  <span><span class="swatch swatch-stock"></span>Wartości seryjne</span>
</figcaption>
</figure>`;
}

function relatedCarsHtml(car, allCars) {
  // Same brand, similar power band, exclude self
  const sameBrand = allCars.filter((c) => c.slug !== car.slug && c.marka === car.marka);
  const target = car.moc_km_seryjna || 0;
  const ranked = sameBrand
    .map((c) => ({ c, d: Math.abs((c.moc_km_seryjna || 0) - target) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.c);
  if (!ranked.length) return '';
  return `<section class="section section-tight">
    <div class="container">
      <h2 class="section-title section-title-sm">Inni wybierali także</h2>
      <div class="cars-grid cars-grid-related">${ranked.map(carCard).join('\n')}</div>
    </div>
  </section>`;
}

function stagesForCar(car) {
  // Stage 1 = seryjnie -> tuning z CSV. Stage 2/3 wymaga sprzętu, więc wartości szacunkowe.
  const km1 = car.moc_km_tuning || 0;
  const nm1 = car.moment_tuning || 0;
  const km0 = car.moc_km_seryjna || 0;
  const nm0 = car.moment_seryjny || 0;
  return [
    { name: 'Stage 1', km: km1, nm: nm1, dKm: km1 - km0, dNm: nm1 - nm0,
      cost: '1500 - 2200 zł', risk: 'minimalne', desc: 'Tylko software, fabryczny osprzęt. Najbezpieczniejszy wariant.' },
    { name: 'Stage 2', km: Math.round(km1 * 1.10), nm: Math.round(nm1 * 1.07),
      dKm: Math.round(km1 * 1.10) - km0, dNm: Math.round(nm1 * 1.07) - nm0,
      cost: '4000 - 7000 zł', risk: 'umiarkowane', desc: 'Software + downpipe / intercooler / wkład filtra. Zalecany serwis sprzęgła.' },
    { name: 'Stage 3', km: Math.round(km1 * 1.30), nm: Math.round(nm1 * 1.20),
      dKm: Math.round(km1 * 1.30) - km0, dNm: Math.round(nm1 * 1.20) - nm0,
      cost: '12 000 - 25 000 zł', risk: 'wysokie', desc: 'Hybrydowa turbo, wtryskiwacze, mocowane sprzęgło. Tylko z pomiarem na hamowni.' },
  ];
}

function stageBlockHtml(car) {
  const stages = stagesForCar(car);
  return `<section class="section section-tight">
    <div class="container">
      <h2 class="section-title section-title-sm">Stage 1 / 2 / 3 dla tego silnika</h2>
      <div class="stages-grid">
        ${stages.map((s, i) => `<article class="stage-card stage-${i+1}">
          <header><h3>${s.name}</h3><span class="stage-badge">${s.risk}</span></header>
          <div class="stage-power"><strong>${s.km}</strong> KM <span>+${s.dKm}</span></div>
          <div class="stage-torque"><strong>${s.nm}</strong> Nm <span>+${s.dNm}</span></div>
          <p class="stage-desc">${esc(s.desc)}</p>
          <div class="stage-cost">${esc(s.cost)}</div>
        </article>`).join('')}
      </div>
      <p class="stages-note">Wartości Stage 2 i Stage 3 są <strong>szacunkowe</strong> i zależą od indywidualnej konfiguracji auta. Każda realizacja kończy się pomiarem na hamowni.</p>
    </div>
  </section>`;
}

function renderCarPage(car, allCars) {
  const title = `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik} - ${car.moc_km_seryjna} -> ${car.moc_km_tuning} KM`;
  const description = `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik} (${car.rok_od}-${car.rok_do}). Moc seryjna ${car.moc_km_seryjna} KM (${car.moc_kw_seryjna} kW), moc po tuningu ${car.moc_km_tuning} KM (${car.moc_kw_tuning} kW). Moment ${car.moment_seryjny} -> ${car.moment_tuning} Nm. Sterownik ${car.sterownik}.`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik}`,
    brand: { '@type': 'Brand', name: car.marka },
    description,
    category: 'Chiptuning',
    image: SITE_URL + '/img/og-default.svg',
    sku: car.slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: '1800',
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      availability: 'https://schema.org/InStock',
      url: SITE_URL + '/tuning/' + car.slug,
      seller: { '@type': 'Organization', name: BUSINESS.legalName },
    },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '127' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Moc seryjna', value: `${car.moc_km_seryjna} KM` },
      { '@type': 'PropertyValue', name: 'Moc po tuningu', value: `${car.moc_km_tuning} KM` },
      { '@type': 'PropertyValue', name: 'Moment seryjny', value: `${car.moment_seryjny} Nm` },
      { '@type': 'PropertyValue', name: 'Moment po tuningu', value: `${car.moment_tuning} Nm` },
      { '@type': 'PropertyValue', name: 'Sterownik', value: car.sterownik },
      { '@type': 'PropertyValue', name: 'Pojemność', value: car.pojemnosc ? `${car.pojemnosc} l` : '-' },
      { '@type': 'PropertyValue', name: 'Paliwo', value: 'Diesel' },
    ],
  };

  const inner = render(T.auto, {
    MARKA: esc(car.marka),
    MODEL: esc(car.model),
    GENERACJA: esc(car.generacja),
    ROK_OD: esc(car.rok_od),
    ROK_DO: esc(car.rok_do),
    SILNIK: esc(car.silnik),
    STEROWNIK: esc(car.sterownik),
    PALIWO: 'Diesel',
    POJEMNOSC: esc(car.pojemnosc ? car.pojemnosc.toFixed(1) + ' l' : '-'),
    MOC_KW_SERYJNA: esc(car.moc_kw_seryjna),
    MOC_KM_SERYJNA: esc(car.moc_km_seryjna),
    MOC_KW_TUNING: esc(car.moc_kw_tuning),
    MOC_KM_TUNING: esc(car.moc_km_tuning),
    MOMENT_SERYJNY: esc(car.moment_seryjny),
    MOMENT_TUNING: esc(car.moment_tuning),
    DIFF_KM: esc(car.diff_km),
    DIFF_NM: esc(car.diff_nm),
    DIFF_PCT: esc(car.diff_pct),
    MARKA_SLUG: esc(car.marka_slug),
    SILNIK_SLUG: esc(car.silnik_slug),
    STEROWNIK_SLUG: esc(car.sterownik_slug),
    SLUG: esc(car.slug),
    DYNO_CHART: dynoChartSvg(car),
    STAGES_BLOCK: stageBlockHtml(car),
    RELATED_CARS: relatedCarsHtml(car, allCars || []),
  });

  return wrapLayout({
    title, description,
    canonicalPath: `/tuning/${car.slug}`,
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Katalog', url: '/katalog/' },
      { name: car.marka, url: `/marka/${car.marka_slug}` },
      { name: `${car.model} ${car.generacja} ${car.silnik}`, url: `/tuning/${car.slug}` },
    ],
    jsonld: [productSchema],
  });
}

function carCard(car) {
  return `<a class="car-card" href="/tuning/${esc(car.slug)}">
    <div class="car-title">${esc(car.marka)} ${esc(car.model)} ${esc(car.generacja)}</div>
    <div class="car-meta">${esc(car.silnik)} | ${esc(car.rok_od)}-${esc(car.rok_do)}</div>
    <div class="car-power">
      <span class="from">${esc(car.moc_km_seryjna)} KM</span>
      <span class="arrow">-></span>
      <span class="to">${esc(car.moc_km_tuning)} KM</span>
    </div>
  </a>`;
}

function renderArchive({ label, name, intro, slug, dirSegment, cars }) {
  const inner = render(T.archiwum, {
    ARCHIVE_LABEL: esc(label),
    ARCHIVE_NAME: esc(name),
    ARCHIVE_INTRO: esc(intro),
    CAR_CARDS: cars.map(carCard).join('\n'),
  });
  const html = wrapLayout({
    title: `${label}: ${name} - chiptuning`,
    description: `${intro} ${cars.length} ${cars.length === 1 ? 'pozycja' : 'pozycji'} w katalogu.`,
    canonicalPath: `/${dirSegment}/${slug}`,
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Katalog', url: '/katalog/' },
      { name: `${label}: ${name}`, url: `/${dirSegment}/${slug}` },
    ],
  });
  writeFile(path.join(OUT, dirSegment, `${slug}.html`), html);
}

function buildCatalog(cars) {

  for (const car of cars) {
    writeFile(path.join(OUT, 'tuning', `${car.slug}.html`), renderCarPage(car, cars));
  }

  const groups = {
    marka: { label: 'Marka', dir: 'marka', keyer: (c) => c.marka, slug: (c) => c.marka_slug,
             intro: (n) => `Wszystkie modele ${n} w naszym katalogu chiptuningu.` },
    sterownik: { label: 'Sterownik', dir: 'sterownik', keyer: (c) => c.sterownik, slug: (c) => c.sterownik_slug,
             intro: (n) => `Lista aut ze sterownikiem ${n}, dla których oferujemy chiptuning.` },
    silnik: { label: 'Jednostka silnikowa', dir: 'silnik', keyer: (c) => c.marka + ' ' + c.silnik, slug: (c) => c.silnik_slug,
             intro: (n) => `Auta z jednostką ${n} - sprawdź możliwe efekty chiptuningu.` },
  };

  const written = [];
  for (const car of cars) written.push(`/tuning/${car.slug}`);

  for (const g of Object.values(groups)) {
    const map = new Map();
    for (const c of cars) {
      const key = g.keyer(c); if (!key) continue;
      const slug = g.slug(c);
      if (!map.has(slug)) map.set(slug, { name: key, cars: [] });
      map.get(slug).cars.push(c);
    }
    for (const [slug, { name, cars: list }] of map) {
      renderArchive({ label: g.label, name, intro: g.intro(name), slug, dirSegment: g.dir, cars: list });
      written.push(`/${g.dir}/${slug}`);
    }
  }

  const brandLinks = [...new Set(cars.map((c) => c.marka))].sort()
    .map((m) => `<a href="/marka/${slugify(m)}">${esc(m)}</a>`)
    .join('\n');

  const catalogJson = JSON.stringify(cars.map((c) => ({
    marka: c.marka, model: c.model, generacja: c.generacja,
    rok_od: c.rok_od, rok_do: c.rok_do, silnik: c.silnik, slug: c.slug,
    sterownik: c.sterownik, pojemnosc: c.pojemnosc,
    km0: c.moc_km_seryjna, km1: c.moc_km_tuning,
    nm0: c.moment_seryjny, nm1: c.moment_tuning,
    diff_km: c.diff_km, diff_nm: c.diff_nm,
  }))).replace(/</g, '\\u003c');

  const inner = render(T.katalog, { BRAND_LINKS: brandLinks, CATALOG_JSON: catalogJson });
  const html = wrapLayout({
    title: 'Katalog chiptuningu - sprawdź swoje auto',
    description: 'Sprawdź, ile mocy i momentu obrotowego może uzyskać Twoje auto po chiptuningu. Kilkaset modeli diesli w bazie. Wyszukiwarka i filtry zaawansowane.',
    canonicalPath: '/katalog/',
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Katalog tuningu', url: '/katalog/' },
    ],
  });
  writeFile(path.join(OUT, 'katalog', 'index.html'), html);
  written.push('/katalog/');

  // Expose JSON for other pages (comparator, calculators, search)
  writeFile(path.join(OUT, 'data', 'katalog.json'), JSON.stringify(cars.map((c) => ({
    marka: c.marka, model: c.model, generacja: c.generacja,
    rok_od: c.rok_od, rok_do: c.rok_do, silnik: c.silnik, slug: c.slug,
    sterownik: c.sterownik, pojemnosc: c.pojemnosc,
    km0: c.moc_km_seryjna, km1: c.moc_km_tuning,
    nm0: c.moment_seryjny, nm1: c.moment_tuning,
    diff_km: c.diff_km, diff_nm: c.diff_nm,
  }))));

  return written;
}

function loadRealizations() {
  const dir = path.join(CONTENT, 'realizacje');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFile(path.join(dir, f));
      const { data, content } = matter(raw);
      const slug = data.slug || slugify(path.basename(f, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
      const num = (v) => (v === '' || v == null ? null : Number(v));
      return {
        title: data.title || 'Realizacja',
        slug,
        samochod: data.samochod || '',
        marka: data.marka || (String(data.samochod || '').split(' ')[0] || ''),
        usluga: data.usluga || data.service || 'chiptuning', // chiptuning | dpf-egr | hamownia | inne
        stage: data.stage || '',
        silnik: data.silnik || '',
        sterownik: data.sterownik || '',
        data: data.date || data.data || '',
        rok: String(data.date || data.data || '').slice(0, 4),
        krotki_opis: data.krotki_opis || data.short || '',
        cover: data.cover || '',
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        narzedzia: Array.isArray(data.narzedzia) ? data.narzedzia : [],
        km0: num(data.km0 ?? data.moc_seryjna),
        km1: num(data.km1 ?? data.moc_tuning),
        nm0: num(data.nm0 ?? data.moment_seryjny),
        nm1: num(data.nm1 ?? data.moment_tuning),
        body: content,
      };
    })
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

function formatDatePL(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function buildRealizations(items) {
  const written = [];

  const cardHtml = (r) => `
    <a class="realization-card" href="/realizacje/${esc(r.slug)}"
       data-marka="${esc(slugify(r.marka))}"
       data-usluga="${esc(r.usluga)}"
       data-rok="${esc(r.rok)}">
      ${r.cover ? `<div class="thumb" style="background-image:url('${esc(r.cover)}')"></div>` : `<div class="thumb"></div>`}
      <div class="body">
        <div class="meta">${esc(formatDatePL(r.data))} | ${esc(r.samochod)}</div>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.krotki_opis)}</p>
      </div>
    </a>`;

  const grid = items.length
    ? `<div class="cards-grid" id="realizacje-grid">${items.map(cardHtml).join('\n')}</div>`
    : `<p class="lead">Wkrótce dodamy nasze realizacje.</p>`;

  // Filters: derived from data
  const markaOpts = [...new Set(items.map((r) => r.marka).filter(Boolean))].sort();
  const uslugaOpts = [...new Set(items.map((r) => r.usluga).filter(Boolean))].sort();
  const rokOpts = [...new Set(items.map((r) => r.rok).filter(Boolean))].sort().reverse();

  const filtersHtml = items.length ? `
    <form class="realizacje-filters" id="realizacje-filters" autocomplete="off">
      <label>Marka
        <select name="marka"><option value="">wszystkie</option>${markaOpts.map((m) => `<option value="${esc(slugify(m))}">${esc(m)}</option>`).join('')}</select>
      </label>
      <label>Usługa
        <select name="usluga"><option value="">wszystkie</option>${uslugaOpts.map((u) => `<option value="${esc(u)}">${esc({chiptuning:'Chiptuning','dpf-egr':'DPF/EGR',hamownia:'Hamownia',inne:'Inne'}[u] || u)}</option>`).join('')}</select>
      </label>
      <label>Rok
        <select name="rok"><option value="">wszystkie</option>${rokOpts.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join('')}</select>
      </label>
      <button type="reset" class="btn-link">Wyczyść</button>
    </form>` : '';

  const listInner = render(T.realizacjeList, { REALIZATIONS_GRID: filtersHtml + grid });
  const listHtml = wrapLayout({
    title: 'Realizacje - G-Lab Chip Tuning',
    description: 'Wybrane realizacje chiptuningu, usuwania DPF/EGR i pomiarów na hamowni wykonane w naszym warsztacie. Filtruj po marce, usłudze i roku.',
    canonicalPath: '/realizacje/',
    content: listInner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Realizacje', url: '/realizacje/' },
    ],
    extraScripts: '<script src="/js/realizacje-filter.js" defer></script>\n    <script src="/js/realizacje-runtime.js" defer></script>',
  });
  writeFile(path.join(OUT, 'realizacje', 'index.html'), listHtml);
  written.push('/realizacje/');

  // Dynamiczna podstrona podglądu realizacji z backendu (slug w query string).
  // Realizacje statyczne (z Markdown) zachowują pretty URL /realizacje/<slug>/.
  // Realizacje dodane w panelu (Supabase) linkują pod /realizacje/podglad/?slug=<slug>.
  const previewHtml = wrapLayout({
    title: 'Realizacja — G-Lab Chip Tuning',
    description: 'Szczegóły wybranej realizacji. Zobacz pomiar, użyte narzędzia i galerię.',
    canonicalPath: '/realizacje/podglad/',
    content: '<div id="realizacja-dyn"></div>',
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Realizacje', url: '/realizacje/' },
    ],
    extraScripts: '<script src="/js/realizacja-runtime.js" defer></script>',
    extraHead: '<meta name="robots" content="noindex,follow">',
  });
  writeFile(path.join(OUT, 'realizacje', 'podglad', 'index.html'), previewHtml);
  written.push('/realizacje/podglad/');

  for (const r of items) {
    const cover = r.cover
      ? `<img class="realization-cover" src="${esc(r.cover)}" alt="${esc(r.title)}" loading="lazy" decoding="async">`
      : '';
    const gallery = r.gallery && r.gallery.length
      ? renderRealizationGallery(r)
      : '';
    const tools = r.narzedzia && r.narzedzia.length
      ? `<div class="tools-list"><h3>Użyte narzędzia</h3><ul>${r.narzedzia.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`
      : '';
    const dynoMini = (r.km0 && r.km1)
      ? dynoChartSvg({
          slug: 'r-' + r.slug,
          marka: r.marka, model: '', silnik: r.silnik || '',
          moc_km_seryjna: r.km0, moc_km_tuning: r.km1,
          moment_seryjny: r.nm0 || Math.round(r.km0 * 2),
          moment_tuning: r.nm1 || Math.round(r.km1 * 2),
        })
      : '';
    const inner = render(T.realizacja, {
      TYTUL: esc(r.title),
      SAMOCHOD: esc(r.samochod),
      DATA_FORMATTED: esc(formatDatePL(r.data)),
      KROTKI_OPIS: esc(r.krotki_opis),
      DLUGI_OPIS: marked.parse(r.body || ''),
      COVER_IMAGE: cover,
      GALLERY: gallery,
      DYNO_BLOCK: dynoMini ? `<section class="section-tight"><div class="container"><h2 class="section-title-sm">Pomiar na hamowni</h2>${dynoMini}</div></section>` : '',
      TOOLS_BLOCK: tools,
    });
    const html = wrapLayout({
      title: `${r.title} - realizacja G-Lab`,
      description: r.krotki_opis || `Realizacja ${r.samochod} w warsztacie G-Lab.`,
      canonicalPath: `/realizacje/${r.slug}`,
      content: inner,
      breadcrumbs: [
        { name: 'Strona główna', url: '/' },
        { name: 'Realizacje', url: '/realizacje/' },
        { name: r.title, url: `/realizacje/${r.slug}` },
      ],
    });
    writeFile(path.join(OUT, 'realizacje', `${r.slug}.html`), html);
    written.push(`/realizacje/${r.slug}`);
  }

  return written;
}

function renderRealizationGallery(r) {
  // before/after slider when first two items are tagged before/after
  const items = r.gallery.map((g) => typeof g === 'string' ? { image: g } : g);
  const before = items.find((g) => /before|przed/i.test(g.alt || ''));
  const after = items.find((g) => /after|po/i.test(g.alt || ''));
  let slider = '';
  if (before && after) {
    slider = `<div class="ba-slider" data-before="${esc(before.image)}" data-after="${esc(after.image)}"
      role="img" aria-label="Porównanie przed/po">
      <img class="ba-after" src="${esc(after.image)}" alt="${esc(after.alt || 'Po')}" loading="lazy" decoding="async">
      <div class="ba-before-wrap"><img class="ba-before" src="${esc(before.image)}" alt="${esc(before.alt || 'Przed')}" loading="lazy" decoding="async"></div>
      <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Pozycja suwaka przed/po">
      <span class="ba-label ba-label-before">Przed</span>
      <span class="ba-label ba-label-after">Po</span>
    </div>`;
  }
  const grid = `<div class="gallery">${items.map((g) =>
    `<a class="gallery-item" href="${esc(g.image)}" data-lightbox="1"><img src="${esc(g.image)}" alt="${esc(g.alt || r.title)}" loading="lazy" decoding="async"></a>`
  ).join('')}</div>`;
  return slider + grid;
}

function pageArtForSlug(slug) {
  const arts = {
    chiptuning: `<svg class="page-hero-art" viewBox="0 0 460 320" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hatch-c" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
        </pattern>
      </defs>
      <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
        <!-- ECU PCB outer -->
        <rect x="80" y="70" width="300" height="170" rx="6"/>
        <rect x="86" y="76" width="288" height="158" rx="4" opacity="0.4"/>
        <!-- mounting holes -->
        <circle cx="98" cy="86" r="3"/><circle cx="98" cy="86" r="1" fill="currentColor" stroke="none"/>
        <circle cx="362" cy="86" r="3"/><circle cx="362" cy="86" r="1" fill="currentColor" stroke="none"/>
        <circle cx="98" cy="224" r="3"/><circle cx="98" cy="224" r="1" fill="currentColor" stroke="none"/>
        <circle cx="362" cy="224" r="3"/><circle cx="362" cy="224" r="1" fill="currentColor" stroke="none"/>
        <!-- main microcontroller -->
        <rect x="170" y="110" width="120" height="90" rx="3"/>
        <rect x="170" y="110" width="120" height="90" rx="3" fill="url(#hatch-c)" stroke="none" opacity="0.3"/>
        <text x="230" y="148" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" font-weight="700" stroke="none" fill="currentColor">MCU</text>
        <text x="230" y="162" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">TRICORE TC1797</text>
        <text x="230" y="176" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.55" letter-spacing="1">180 MHz · 4 MB FLASH</text>
        <!-- pin notch + dot -->
        <circle cx="178" cy="118" r="1.5" fill="currentColor" stroke="none"/>
        <!-- IC pins (top/bottom/left/right) -->
        <g stroke-width="0.9">
          <g>
            <line x1="178" y1="110" x2="178" y2="104"/><line x1="186" y1="110" x2="186" y2="104"/>
            <line x1="194" y1="110" x2="194" y2="104"/><line x1="202" y1="110" x2="202" y2="104"/>
            <line x1="210" y1="110" x2="210" y2="104"/><line x1="218" y1="110" x2="218" y2="104"/>
            <line x1="226" y1="110" x2="226" y2="104"/><line x1="234" y1="110" x2="234" y2="104"/>
            <line x1="242" y1="110" x2="242" y2="104"/><line x1="250" y1="110" x2="250" y2="104"/>
            <line x1="258" y1="110" x2="258" y2="104"/><line x1="266" y1="110" x2="266" y2="104"/>
            <line x1="274" y1="110" x2="274" y2="104"/><line x1="282" y1="110" x2="282" y2="104"/>
          </g>
          <g>
            <line x1="178" y1="200" x2="178" y2="206"/><line x1="186" y1="200" x2="186" y2="206"/>
            <line x1="194" y1="200" x2="194" y2="206"/><line x1="202" y1="200" x2="202" y2="206"/>
            <line x1="210" y1="200" x2="210" y2="206"/><line x1="218" y1="200" x2="218" y2="206"/>
            <line x1="226" y1="200" x2="226" y2="206"/><line x1="234" y1="200" x2="234" y2="206"/>
            <line x1="242" y1="200" x2="242" y2="206"/><line x1="250" y1="200" x2="250" y2="206"/>
            <line x1="258" y1="200" x2="258" y2="206"/><line x1="266" y1="200" x2="266" y2="206"/>
            <line x1="274" y1="200" x2="274" y2="206"/><line x1="282" y1="200" x2="282" y2="206"/>
          </g>
          <g>
            <line x1="170" y1="120" x2="164" y2="120"/><line x1="170" y1="128" x2="164" y2="128"/>
            <line x1="170" y1="136" x2="164" y2="136"/><line x1="170" y1="144" x2="164" y2="144"/>
            <line x1="170" y1="152" x2="164" y2="152"/><line x1="170" y1="160" x2="164" y2="160"/>
            <line x1="170" y1="168" x2="164" y2="168"/><line x1="170" y1="176" x2="164" y2="176"/>
            <line x1="170" y1="184" x2="164" y2="184"/><line x1="170" y1="192" x2="164" y2="192"/>
          </g>
          <g>
            <line x1="290" y1="120" x2="296" y2="120"/><line x1="290" y1="128" x2="296" y2="128"/>
            <line x1="290" y1="136" x2="296" y2="136"/><line x1="290" y1="144" x2="296" y2="144"/>
            <line x1="290" y1="152" x2="296" y2="152"/><line x1="290" y1="160" x2="296" y2="160"/>
            <line x1="290" y1="168" x2="296" y2="168"/><line x1="290" y1="176" x2="296" y2="176"/>
            <line x1="290" y1="184" x2="296" y2="184"/><line x1="290" y1="192" x2="296" y2="192"/>
          </g>
        </g>
        <!-- Flash chip -->
        <rect x="100" y="110" width="50" height="34" rx="2"/>
        <text x="125" y="130" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">FLASH</text>
        <circle cx="105" cy="115" r="1" fill="currentColor" stroke="none"/>
        <g stroke-width="0.7" opacity="0.7">
          <line x1="104" y1="144" x2="104" y2="148"/><line x1="110" y1="144" x2="110" y2="148"/>
          <line x1="116" y1="144" x2="116" y2="148"/><line x1="122" y1="144" x2="122" y2="148"/>
          <line x1="128" y1="144" x2="128" y2="148"/><line x1="134" y1="144" x2="134" y2="148"/>
          <line x1="140" y1="144" x2="140" y2="148"/><line x1="146" y1="144" x2="146" y2="148"/>
        </g>
        <!-- EEPROM -->
        <rect x="100" y="160" width="50" height="22" rx="2"/>
        <text x="125" y="174" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">EEPROM</text>
        <!-- Power regulator -->
        <rect x="310" y="110" width="50" height="32" rx="2"/>
        <text x="335" y="130" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.7">REG 5V</text>
        <!-- Crystal oscillator -->
        <rect x="310" y="156" width="40" height="14" rx="7"/>
        <text x="330" y="166" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.7">XTAL</text>
        <!-- caps -->
        <g stroke-width="0.9" opacity="0.7">
          <circle cx="158" cy="218" r="3"/><circle cx="170" cy="218" r="3"/><circle cx="182" cy="218" r="3"/>
          <circle cx="278" cy="218" r="3"/><circle cx="290" cy="218" r="3"/><circle cx="302" cy="218" r="3"/>
        </g>
        <!-- Connector pins (left side) -->
        <rect x="40" y="100" width="40" height="120" rx="2"/>
        <g stroke-width="0.8">
          <line x1="40" y1="108" x2="36" y2="108"/><line x1="40" y1="118" x2="36" y2="118"/>
          <line x1="40" y1="128" x2="36" y2="128"/><line x1="40" y1="138" x2="36" y2="138"/>
          <line x1="40" y1="148" x2="36" y2="148"/><line x1="40" y1="158" x2="36" y2="158"/>
          <line x1="40" y1="168" x2="36" y2="168"/><line x1="40" y1="178" x2="36" y2="178"/>
          <line x1="40" y1="188" x2="36" y2="188"/><line x1="40" y1="198" x2="36" y2="198"/>
          <line x1="40" y1="208" x2="36" y2="208"/>
        </g>
        <text x="60" y="94" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.65" letter-spacing="1">CN1</text>
        <!-- Connector pins (right side) -->
        <rect x="380" y="100" width="40" height="120" rx="2"/>
        <g stroke-width="0.8">
          <line x1="420" y1="108" x2="424" y2="108"/><line x1="420" y1="118" x2="424" y2="118"/>
          <line x1="420" y1="128" x2="424" y2="128"/><line x1="420" y1="138" x2="424" y2="138"/>
          <line x1="420" y1="148" x2="424" y2="148"/><line x1="420" y1="158" x2="424" y2="158"/>
          <line x1="420" y1="168" x2="424" y2="168"/><line x1="420" y1="178" x2="424" y2="178"/>
          <line x1="420" y1="188" x2="424" y2="188"/><line x1="420" y1="198" x2="424" y2="198"/>
          <line x1="420" y1="208" x2="424" y2="208"/>
        </g>
        <text x="400" y="94" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.65" letter-spacing="1">CN2</text>
        <!-- traces -->
        <g opacity="0.4" stroke-width="0.7">
          <path d="M80 130 h20 v 20 h70"/>
          <path d="M80 170 h12 v 30 h60"/>
          <path d="M380 130 h-20 v 30 h-70"/>
          <path d="M380 180 h-15 v -10 h-65"/>
        </g>
        <!-- Dimension lines -->
        <g stroke-width="0.7" opacity="0.7">
          <line x1="40" y1="270" x2="420" y2="270"/>
          <path d="M40 266 l-4 4 l4 4"/>
          <path d="M420 266 l4 4 l-4 4"/>
          <line x1="40" y1="248" x2="40" y2="276"/>
          <line x1="420" y1="248" x2="420" y2="276"/>
        </g>
        <text x="230" y="265" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="2">160 mm</text>
        <!-- Callouts -->
        <g opacity="0.65" stroke-width="0.7">
          <line x1="125" y1="127" x2="60" y2="60"/>
          <circle cx="125" cy="127" r="1.5" fill="currentColor" stroke="none"/>
          <line x1="230" y1="155" x2="230" y2="50"/>
          <circle cx="230" cy="155" r="1.5" fill="currentColor" stroke="none"/>
          <line x1="335" y1="126" x2="410" y2="60"/>
          <circle cx="335" cy="126" r="1.5" fill="currentColor" stroke="none"/>
        </g>
        <text x="20" y="56" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">[1] PAMIĘĆ FLASH</text>
        <text x="180" y="46" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">[2] PROCESOR ECU</text>
        <text x="370" y="56" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">[3] STAB. NAPIĘCIA</text>
        <!-- Title block -->
        <g opacity="0.55" stroke-width="0.8">
          <rect x="14" y="290" width="432" height="22"/>
          <line x1="140" y1="290" x2="140" y2="312"/>
          <line x1="260" y1="290" x2="260" y2="312"/>
          <line x1="360" y1="290" x2="360" y2="312"/>
        </g>
      </g>
      <text x="22" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">STEROWNIK SILNIKA / ECU</text>
      <text x="148" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">REMAP STAGE 1</text>
      <text x="268" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">SKALA 1:1</text>
      <text x="368" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">DRG-101/A</text>
    </svg>`,

    'dpf-egr': `<svg class="page-hero-art" viewBox="0 0 460 320" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hatch-d" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" stroke-width="0.5" opacity="0.35"/>
        </pattern>
      </defs>
      <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
        <!-- Exhaust system schematic, left to right: manifold -> turbine -> DPF -> SCR -> muffler -->

        <!-- Engine block (left) -->
        <rect x="20" y="80" width="60" height="100" rx="3"/>
        <rect x="20" y="80" width="60" height="100" rx="3" fill="url(#hatch-d)" stroke="none"/>
        <line x1="30" y1="90" x2="30" y2="170"/>
        <line x1="40" y1="90" x2="40" y2="170"/>
        <line x1="50" y1="90" x2="50" y2="170"/>
        <line x1="60" y1="90" x2="60" y2="170"/>
        <line x1="70" y1="90" x2="70" y2="170"/>
        <text x="50" y="200" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">SILNIK</text>

        <!-- exhaust manifold (4 into 1) -->
        <path d="M80 100 q 20 30 40 30 h 30"/>
        <path d="M80 120 q 18 12 40 10 h 30"/>
        <path d="M80 140 q 18 -8 40 -10 h 30"/>
        <path d="M80 160 q 20 -28 40 -30 h 30"/>

        <!-- Turbine inlet flange + turbine housing -->
        <rect x="148" y="120" width="6" height="22" rx="1"/>
        <circle cx="180" cy="131" r="22"/>
        <circle cx="180" cy="131" r="14" opacity="0.45"/>
        <circle cx="180" cy="131" r="5"/>
        <g stroke-width="0.9" opacity="0.85">
          <path d="M180 131 q -10 -6 -16 -14"/>
          <path d="M180 131 q -14 0 -16 8"/>
          <path d="M180 131 q -10 12 0 18"/>
          <path d="M180 131 q 10 12 18 6"/>
          <path d="M180 131 q 14 0 14 -10"/>
          <path d="M180 131 q 6 -14 -4 -16"/>
        </g>
        <text x="180" y="170" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.65" letter-spacing="1">TURBINA</text>

        <!-- pipe to DPF (with bracket) -->
        <line x1="200" y1="125" x2="240" y2="125"/>
        <line x1="200" y1="138" x2="240" y2="138"/>
        <line x1="220" y1="125" x2="220" y2="138" stroke-dasharray="2 2" opacity="0.4"/>
        <rect x="216" y="118" width="8" height="6" rx="1"/>

        <!-- DPF body (cylindrical) -->
        <rect x="240" y="100" width="80" height="64" rx="6"/>
        <line x1="245" y1="100" x2="245" y2="164"/>
        <line x1="315" y1="100" x2="315" y2="164"/>
        <!-- honeycomb cells inside -->
        <g stroke-width="0.8" opacity="0.85">
          <line x1="252" y1="108" x2="252" y2="156"/>
          <line x1="262" y1="108" x2="262" y2="156"/>
          <line x1="272" y1="108" x2="272" y2="156"/>
          <line x1="282" y1="108" x2="282" y2="156"/>
          <line x1="292" y1="108" x2="292" y2="156"/>
          <line x1="302" y1="108" x2="302" y2="156"/>
          <line x1="312" y1="108" x2="312" y2="156"/>
          <line x1="248" y1="118" x2="316" y2="118"/>
          <line x1="248" y1="132" x2="316" y2="132"/>
          <line x1="248" y1="146" x2="316" y2="146"/>
        </g>
        <!-- DPF differential pressure sensor -->
        <line x1="258" y1="100" x2="258" y2="78"/>
        <line x1="298" y1="100" x2="298" y2="78"/>
        <rect x="252" y="60" width="52" height="18" rx="2"/>
        <text x="278" y="72" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">ΔP SENSOR</text>
        <text x="278" y="180" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">DPF / FAP</text>
        <!-- big "removed" mark over DPF -->
        <circle cx="278" cy="132" r="34" stroke-width="1.4" opacity="0.85"/>
        <line x1="252" y1="156" x2="304" y2="108" stroke-width="1.6" opacity="0.85"/>

        <!-- AdBlue / SCR injector -->
        <line x1="320" y1="125" x2="350" y2="125"/>
        <line x1="320" y1="138" x2="350" y2="138"/>
        <circle cx="335" cy="115" r="6"/>
        <line x1="335" y1="109" x2="335" y2="100"/>
        <rect x="328" y="86" width="14" height="14" rx="1"/>
        <text x="335" y="96" text-anchor="middle" font-family="Inter, sans-serif" font-size="5.5" stroke="none" fill="currentColor" opacity="0.7">SCR</text>

        <!-- SCR catalyst body -->
        <rect x="350" y="106" width="60" height="52" rx="5"/>
        <g stroke-width="0.8" opacity="0.55">
          <line x1="358" y1="112" x2="358" y2="152"/>
          <line x1="368" y1="112" x2="368" y2="152"/>
          <line x1="378" y1="112" x2="378" y2="152"/>
          <line x1="388" y1="112" x2="388" y2="152"/>
          <line x1="398" y1="112" x2="398" y2="152"/>
        </g>
        <!-- removed mark on SCR -->
        <circle cx="380" cy="132" r="22" stroke-width="1.2" opacity="0.7"/>
        <line x1="364" y1="148" x2="396" y2="116" stroke-width="1.2" opacity="0.7"/>
        <text x="380" y="172" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">SCR</text>

        <!-- tail pipe -->
        <line x1="410" y1="125" x2="446" y2="125"/>
        <line x1="410" y1="138" x2="446" y2="138"/>

        <!-- EGR loop (above engine, going from exhaust manifold back to intake) -->
        <path d="M148 130 q 0 -50 -40 -50 q -40 0 -40 -10"/>
        <line x1="68" y1="80" x2="68" y2="74"/>
        <!-- EGR cooler -->
        <rect x="100" y="36" width="60" height="22" rx="3"/>
        <g stroke-width="0.6" opacity="0.55">
          <line x1="106" y1="40" x2="106" y2="54"/><line x1="114" y1="40" x2="114" y2="54"/>
          <line x1="122" y1="40" x2="122" y2="54"/><line x1="130" y1="40" x2="130" y2="54"/>
          <line x1="138" y1="40" x2="138" y2="54"/><line x1="146" y1="40" x2="146" y2="54"/>
          <line x1="154" y1="40" x2="154" y2="54"/>
        </g>
        <text x="130" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.7">EGR COOL.</text>
        <!-- EGR valve (butterfly) -->
        <circle cx="80" cy="48" r="9"/>
        <line x1="74" y1="42" x2="86" y2="54" stroke-width="1.2"/>
        <text x="80" y="28" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.7">EGR</text>
        <!-- removed mark on EGR -->
        <circle cx="80" cy="48" r="14" stroke-width="1.2" opacity="0.85"/>
        <line x1="70" y1="58" x2="90" y2="38" stroke-width="1.4" opacity="0.85"/>

        <!-- Centerline through exhaust -->
        <line x1="84" y1="131" x2="450" y2="131" stroke-dasharray="6 2 1 2" opacity="0.35" stroke-width="0.6"/>

        <!-- gas-flow arrows -->
        <g opacity="0.55" stroke-width="0.9">
          <path d="M120 200 h 16 m -4 -3 l 4 3 l -4 3"/>
          <path d="M218 200 h 16 m -4 -3 l 4 3 l -4 3"/>
          <path d="M324 200 h 16 m -4 -3 l 4 3 l -4 3"/>
          <path d="M412 200 h 16 m -4 -3 l 4 3 l -4 3"/>
        </g>
        <text x="40" y="222" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.6" letter-spacing="1">SPALINY →</text>

        <!-- Dimension line below -->
        <g stroke-width="0.7" opacity="0.7">
          <line x1="20" y1="252" x2="446" y2="252"/>
          <path d="M20 248 l-4 4 l4 4"/>
          <path d="M446 248 l4 4 l-4 4"/>
          <line x1="20" y1="232" x2="20" y2="258"/>
          <line x1="446" y1="232" x2="446" y2="258"/>
        </g>
        <text x="233" y="247" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="2">2 400 mm</text>

        <!-- Callouts -->
        <text x="50" y="276" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">[A] EGR — DEZAKTYWACJA</text>
        <text x="220" y="276" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">[B] DPF — USUNIĘCIE WKŁADU + MAPA</text>
        <text x="430" y="276" text-anchor="end" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">[C] SCR/AdBlue — OFF</text>

        <!-- Title block -->
        <g opacity="0.55" stroke-width="0.8">
          <rect x="14" y="290" width="432" height="22"/>
          <line x1="140" y1="290" x2="140" y2="312"/>
          <line x1="260" y1="290" x2="260" y2="312"/>
          <line x1="360" y1="290" x2="360" y2="312"/>
        </g>
      </g>
      <text x="22" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">UKŁAD WYDECHOWY</text>
      <text x="148" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">DPF · EGR · SCR</text>
      <text x="268" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">SCHEMAT</text>
      <text x="368" y="304" font-family="Inter, sans-serif" font-size="7.5" fill="currentColor" opacity="0.7" letter-spacing="2">DRG-201/A</text>
    </svg>`,

    hamownia: `<svg class="page-hero-art" viewBox="0 0 460 320" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hatch-h" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" stroke-width="0.5" opacity="0.35"/>
        </pattern>
      </defs>
      <g fill="none" stroke="currentColor" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round">
        <!-- Side view of car on dyno rollers -->

        <!-- ground / pit floor -->
        <line x1="20" y1="240" x2="440" y2="240" stroke-width="1.1"/>
        <g stroke-width="0.5" opacity="0.55">
          <line x1="20" y1="248" x2="36" y2="240"/>
          <line x1="40" y1="248" x2="56" y2="240"/>
          <line x1="60" y1="248" x2="76" y2="240"/>
          <line x1="80" y1="248" x2="96" y2="240"/>
          <line x1="380" y1="248" x2="396" y2="240"/>
          <line x1="400" y1="248" x2="416" y2="240"/>
          <line x1="420" y1="248" x2="436" y2="240"/>
        </g>
        <!-- pit cutout for rollers -->
        <line x1="240" y1="240" x2="240" y2="260"/>
        <line x1="380" y1="240" x2="380" y2="260"/>
        <line x1="240" y1="260" x2="380" y2="260"/>
        <rect x="240" y="240" width="140" height="20" fill="url(#hatch-h)" stroke="none" opacity="0.6"/>

        <!-- Car body silhouette (side view, sedan-ish) -->
        <path d="M70 220
                 q 10 -28 56 -28
                 l 30 -36 q 8 -10 22 -10
                 h 90 q 18 0 30 12
                 l 28 32
                 q 50 4 60 30
                 v 0
                 h -316 z" stroke-width="1.4"/>
        <!-- windows -->
        <path d="M170 184 l 24 -28 q 6 -8 18 -8 h 60 q 12 0 22 10 l 22 26 z" opacity="0.55"/>
        <line x1="222" y1="148" x2="222" y2="184" stroke-dasharray="2 3" opacity="0.5"/>
        <!-- door lines -->
        <line x1="160" y1="195" x2="160" y2="220" opacity="0.6"/>
        <line x1="222" y1="195" x2="222" y2="220" opacity="0.6"/>
        <line x1="284" y1="195" x2="284" y2="220" opacity="0.6"/>
        <!-- door handles -->
        <line x1="195" y1="200" x2="210" y2="200" stroke-width="1.4"/>
        <line x1="244" y1="200" x2="259" y2="200" stroke-width="1.4"/>
        <!-- headlights -->
        <path d="M340 208 q 8 -2 14 4" stroke-width="1.4"/>
        <!-- mirror -->
        <path d="M158 188 l-6 -4 l-2 6" stroke-width="1.2"/>
        <!-- front wheel (front axle, off rollers - chocked) -->
        <circle cx="120" cy="232" r="22" stroke-width="1.4"/>
        <circle cx="120" cy="232" r="10"/>
        <circle cx="120" cy="232" r="3" fill="currentColor" stroke="none"/>
        <g stroke-width="0.9" opacity="0.7">
          <line x1="120" y1="222" x2="120" y2="242"/>
          <line x1="110" y1="232" x2="130" y2="232"/>
          <line x1="113" y1="225" x2="127" y2="239"/>
          <line x1="113" y1="239" x2="127" y2="225"/>
        </g>
        <!-- chock blocks -->
        <path d="M92 254 l 6 -10 h 12 z"/>
        <path d="M148 254 l -6 -10 h -12 z"/>

        <!-- driven wheel on rollers -->
        <circle cx="310" cy="232" r="24" stroke-width="1.4"/>
        <circle cx="310" cy="232" r="10"/>
        <circle cx="310" cy="232" r="3" fill="currentColor" stroke="none"/>
        <g stroke-width="0.9" opacity="0.7">
          <line x1="310" y1="222" x2="310" y2="242"/>
          <line x1="300" y1="232" x2="320" y2="232"/>
          <line x1="303" y1="225" x2="317" y2="239"/>
          <line x1="303" y1="239" x2="317" y2="225"/>
        </g>
        <!-- two rollers under wheel -->
        <circle cx="290" cy="252" r="14"/>
        <circle cx="290" cy="252" r="3" fill="currentColor" stroke="none"/>
        <g stroke-width="0.6" opacity="0.55">
          <line x1="290" y1="240" x2="290" y2="264"/>
          <line x1="278" y1="252" x2="302" y2="252"/>
        </g>
        <circle cx="330" cy="252" r="14"/>
        <circle cx="330" cy="252" r="3" fill="currentColor" stroke="none"/>
        <g stroke-width="0.6" opacity="0.55">
          <line x1="330" y1="240" x2="330" y2="264"/>
          <line x1="318" y1="252" x2="342" y2="252"/>
        </g>
        <!-- belt connecting rollers to brake unit -->
        <path d="M344 252 q 14 0 14 -16 v -10"/>
        <rect x="350" y="208" width="20" height="18" rx="2"/>
        <text x="360" y="220" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.7">EDDY</text>

        <!-- exhaust extraction hose -->
        <path d="M70 220 q -20 -4 -28 -22 v -40"/>
        <circle cx="42" cy="156" r="4"/>
        <text x="38" y="146" text-anchor="end" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.65">ODCIĄG</text>

        <!-- dimensions: wheelbase -->
        <g stroke-width="0.7" opacity="0.7">
          <line x1="120" y1="284" x2="310" y2="284"/>
          <path d="M120 280 l-4 4 l4 4"/>
          <path d="M310 280 l4 4 l-4 4"/>
          <line x1="120" y1="260" x2="120" y2="288"/>
          <line x1="310" y1="260" x2="310" y2="288"/>
        </g>
        <text x="215" y="280" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="2">ROZSTAW OSI 2700 mm</text>

        <!-- dimensions: roller centers -->
        <g stroke-width="0.7" opacity="0.7">
          <line x1="290" y1="296" x2="330" y2="296"/>
          <path d="M290 292 l-4 4 l4 4"/>
          <path d="M330 292 l4 4 l-4 4"/>
        </g>
        <text x="310" y="292" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">Ø 318</text>

        <!-- callouts -->
        <g opacity="0.65" stroke-width="0.7">
          <line x1="290" y1="252" x2="200" y2="100"/>
          <circle cx="290" cy="252" r="1.5" fill="currentColor" stroke="none"/>
          <line x1="360" y1="217" x2="430" y2="80"/>
          <circle cx="360" cy="217" r="1.5" fill="currentColor" stroke="none"/>
        </g>
        <text x="80" y="96" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">[1] ROLKA POMIAROWA Ø318</text>
        <text x="430" y="76" text-anchor="end" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">[2] HAMULEC WIROPRĄDOWY</text>

        <!-- mini dyno chart inset top-right -->
        <g opacity="0.55" stroke-width="0.6">
          <rect x="60" y="40" width="100" height="50"/>
          <line x1="60" y1="78" x2="160" y2="78" stroke-dasharray="2 2"/>
          <line x1="60" y1="64" x2="160" y2="64" stroke-dasharray="2 2"/>
        </g>
        <path d="M62 80 q 20 -8 40 -22 q 30 -16 56 -28" stroke-width="1.2" opacity="0.85"/>
        <path d="M62 84 q 20 -4 40 -10 q 30 -8 56 -18" stroke-dasharray="3 2" opacity="0.6"/>
        <text x="62" y="36" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="1">WYKRES MOC/MOMENT</text>

        <!-- title block -->
        <g opacity="0.55" stroke-width="0.8">
          <rect x="14" y="304" width="432" height="0"/>
        </g>
      </g>
      <g opacity="0.55">
        <rect x="14" y="304" width="432" height="0" fill="none" stroke="currentColor" stroke-width="0.8"/>
      </g>
      <g fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.55">
        <rect x="14" y="298" width="432" height="14"/>
        <line x1="140" y1="298" x2="140" y2="312"/>
        <line x1="260" y1="298" x2="260" y2="312"/>
        <line x1="360" y1="298" x2="360" y2="312"/>
      </g>
      <text x="22" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">HAMOWNIA PODWOZIOWA</text>
      <text x="148" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">VT2/B1 · 4WD</text>
      <text x="268" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">RZUT BOCZNY</text>
      <text x="368" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">DRG-301/A</text>
    </svg>`,

  };
  return arts[slug] || '';
}

// FAQ definitions per page slug
const FAQ_BY_SLUG = {
  chiptuning: [
    { q: 'Czy chiptuning skraca żywotność silnika?',
      a: 'Wykonany prawidłowo, na seryjnym osprzęcie i w bezpiecznych granicach (Stage 1), chiptuning nie skraca żywotności silnika. W G-Lab każdą mapę dobieramy indywidualnie, kontrolując ciśnienie doładowania, temperaturę spalin i lambdę.' },
    { q: 'Czy stracę gwarancję producenta?',
      a: 'Modyfikacja oprogramowania może zostać wykryta przez ASO. Dla aut objętych gwarancją oferujemy zachowanie pliku oryginalnego, dzięki czemu w razie potrzeby przywracamy ustawienia fabryczne.' },
    { q: 'Ile trwa chiptuning?',
      a: 'Standardowy Stage 1 to 3-5 godzin (odczyt, modyfikacja, zapis, pomiar na hamowni). Klient odbiera auto tego samego dnia.' },
    { q: 'Czy zwiększy się spalanie?',
      a: 'Wręcz przeciwnie - przy normalnej, spokojnej jeździe spalanie diesla po chiptuningu zwykle spada o 0,5-1,2 l/100 km dzięki lepszej efektywności pracy silnika.' },
    { q: 'Czy oferujecie zwrot pliku oryginalnego?',
      a: 'Tak. Każdy odczyt OEM archiwizujemy. W dowolnym momencie możemy bezpłatnie wrócić do mapy fabrycznej.' },
  ],
  'dpf-egr': [
    { q: 'Czy usunięcie DPF jest legalne?',
      a: 'Modyfikacje wpływające na układ wydechowy mogą skutkować negatywnym wynikiem badania technicznego i nie są dopuszczone do ruchu na drogach publicznych w UE. Usługę realizujemy wyłącznie do aut wykorzystywanych poza ruchem publicznym (off-road, sport, eksport).' },
    { q: 'Co dokładnie obejmuje usunięcie DPF?',
      a: 'Mechaniczne wyjęcie wkładu filtra cząstek stałych oraz całkowite wyłączenie procedur regeneracji w sterowniku silnika (mapy paliwa, czujniki różnicy ciśnień, czujniki temperatury, OBD).' },
    { q: 'Co z AdBlue/SCR?',
      a: 'Wyłączamy układ SCR programowo, eliminując komunikaty o niskim poziomie AdBlue, blokady startu silnika i kosztowne naprawy pompy AdBlue.' },
    { q: 'Czy po usunięciu DPF auto przejdzie OBD?',
      a: 'Tak - poprawnie wykonana modyfikacja nie generuje błędów na OBD, kontrolki silnika nie zapalają się.' },
  ],
  hamownia: [
    { q: 'Jakiej hamowni używacie?',
      a: 'Pracujemy na nowoczesnej hamowni podwoziowej z hamulcem wiroprądowym. Pomiar mocy i momentu na kołach + przeliczenie na moc silnika.' },
    { q: 'Ile kosztuje pomiar?',
      a: 'Pojedynczy przejazd z wydrukiem wykresu - od 350 zł. W ramach chiptuningu pomiar przed/po jest w cenie usługi.' },
    { q: 'Czy mogę zobaczyć wykres podczas pomiaru?',
      a: 'Tak, pomiar oglądasz na żywo na monitorze przy stanowisku. Po zakończeniu otrzymujesz wydruk i wersję cyfrową.' },
  ],
};

const HOME_FAQ = [
  { q: 'Czy chiptuning niszczy silnik diesla?',
    a: 'Nie - przy poprawnie wykonanej kalibracji (Stage 1, indywidualny plik, monitoring kluczowych parametrów) silnik pracuje w bezpiecznym oknie. G-Lab od 2006 r. - tysiące zadowolonych kierowców.' },
  { q: 'Ile zyskam mocy i momentu?',
    a: 'Typowy diesel po Stage 1 zyskuje 25-35% mocy i momentu obrotowego. Przykład: 320d 184 KM -> 231 KM, 380 -> 460 Nm. Konkretne wartości dla Twojego auta sprawdzisz w katalogu.' },
  { q: 'Czy spalanie wzrośnie?',
    a: 'Przy zachowaniu spokojnego stylu jazdy spalanie spada średnio o ~0,8 l/100 km dzięki większej efektywności i wyższemu momentowi w niższych obrotach.' },
  { q: 'Czy mają Państwo własną hamownię?',
    a: 'Tak - hamownia podwoziowa z hamulcem wiroprądowym jest na miejscu. Każdą realizację kończymy pomiarem przed/po.' },
  { q: 'Jak długo trwa wizyta?',
    a: 'Standardowy Stage 1 z pomiarem to 3-5 godzin. Auto odbierasz tego samego dnia.' },
];

function buildStaticPages() {
  const dir = path.join(CONTENT, 'pages');
  const written = [];
  if (!fs.existsSync(dir)) return written;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const raw = readFile(path.join(dir, f));
    const { data, content } = matter(raw);
    const slug = data.slug || path.basename(f, '.md');
    const faq = FAQ_BY_SLUG[slug];
    const jsonld = [];
    const extraSections = [];
    if (faq) {
      jsonld.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q,
          acceptedAnswer: { '@type': 'Answer', text: q.a } })),
      });
      extraSections.push(faqHtml(faq));
    }
    // Service schema for service pages
    if (slug === 'chiptuning' || slug === 'dpf-egr' || slug === 'hamownia') {
      jsonld.push({
        '@context': 'https://schema.org', '@type': 'Service',
        serviceType: data.title || slug,
        provider: { '@id': SITE_URL + '/#business', '@type': 'AutoRepair', name: BUSINESS.legalName },
        areaServed: { '@type': 'Country', name: 'Polska' },
        url: SITE_URL + '/' + slug,
      });
    }
    if (slug === 'kontakt') jsonld.push(localBusinessSchema());
    const extraScripts = (slug === 'kontakt')
      ? '<script src="/js/kontakt.js" defer></script>'
      : '';
    const html = wrapLayout({
      title: `${data.title || slug} - G-Lab Chip Tuning`,
      description: data.description || data.subtitle || `${data.title} - G-Lab Chip Tuning`,
      canonicalPath: `/${slug}/`,
      content: render(T.page, {
        TITLE: esc(data.title || slug),
        SUBTITLE: data.subtitle ? `<p class="lead">${esc(data.subtitle)}</p>` : '',
        CONTENT: marked.parse(content || ''),
        PAGE_ART: pageArtForSlug(slug),
      }) + extraSections.join(''),
      breadcrumbs: [
        { name: 'Strona główna', url: '/' },
        { name: data.title || slug, url: `/${slug}/` },
      ],
      jsonld,
      extraScripts,
    });
    writeFile(path.join(OUT, slug, 'index.html'), html);
    written.push(`/${slug}/`);
  }
  return written;
}

function buildHome(stats) {
  // counters band
  const countersHtml = `<section class="section section-counters">
    <div class="container">
      <div class="counters-grid">
        <div class="counter"><span class="counter-num" data-count="${stats.years}">0</span><span class="counter-label">lat doświadczenia</span></div>
        <div class="counter"><span class="counter-num" data-count="${stats.cars}">0</span><span class="counter-label">modeli w katalogu</span></div>
        <div class="counter"><span class="counter-num" data-count="${stats.dynoCount}">0</span><span class="counter-label">pomiarów na hamowni</span></div>
        <div class="counter"><span class="counter-num" data-count="${stats.avgGain}" data-suffix=" KM">0</span><span class="counter-label">średni przyrost mocy</span></div>
      </div>
    </div>
  </section>`;

  // Toolbar dla najpopularniejszych funkcji
  const toolsBand = `<section class="section section-alt">
    <div class="container tools-band">
      <a class="tool-card" href="/kalkulatory/">
        <h3>Kalkulatory</h3>
        <p>Sprawdź ROI tuningu, oszczędności na paliwie i koszty Stage 1/2/3.</p>
      </a>
      <a class="tool-card" href="/porownaj/">
        <h3>Porównaj modele</h3>
        <p>Zestaw 2-3 silniki obok siebie - moc, moment, przyrost po tuningu.</p>
      </a>
      <a class="tool-card" href="/wycena/">
        <h3>Wyceń tuning</h3>
        <p>Quiz w 5 krokach - spersonalizowana wycena Twojego auta w 2 minuty.</p>
      </a>
      <a class="tool-card" href="/galeria-hamowni/">
        <h3>Galeria hamowni</h3>
        <p>Filtrowalna baza wykresów dyno - sprawdź realne efekty.</p>
      </a>
    </div>
  </section>`;

  const reviewsHtml = `<section class="section">
    <div class="container">
      <h2 class="section-title">Co mówią nasi klienci</h2>
      <div class="reviews-grid">
        <article class="review-card">
          <div class="stars" aria-label="Ocena 5 z 5">★★★★★</div>
          <p>"BMW 320d - 184 -> 231 KM. Auto zupełnie inne, bardziej dynamiczne. Spalanie nawet spadło. Polecam każdemu."</p>
          <footer>Marcin K., Łódź</footer>
        </article>
        <article class="review-card">
          <div class="stars" aria-label="Ocena 5 z 5">★★★★★</div>
          <p>"Audi A4 2.0 TDI - usunięcie DPF + Stage 1. Zero problemów po roku jazdy. Robotę wykonali profesjonalnie i z dokumentacją."</p>
          <footer>Tomasz W., Pabianice</footer>
        </article>
        <article class="review-card">
          <div class="stars" aria-label="Ocena 5 z 5">★★★★★</div>
          <p>"Mercedes Sprinter w firmie - po chiptuningu mniejsze spalanie i większy moment przy załadowanym aucie. Ekipa konkretna."</p>
          <footer>Paweł, transport</footer>
        </article>
      </div>
      <p class="reviews-cta"><strong>4.9 / 5</strong> średnia ocen na podstawie 127 opinii klientów</p>
    </div>
  </section>`;

  const html = wrapLayout({
    title: 'Chiptuning Łódź — diesel, DPF/EGR i hamownia podwoziowa | G-Lab',
    description: 'Profesjonalny chiptuning diesli, usuwanie DPF/EGR, hamownia podwoziowa w Łodzi. Działamy od 2006 roku. Kilkaset modeli w bazie, ROI tuningu poniżej 12 miesięcy.',
    canonicalPath: '/',
    content: T.home + countersHtml + toolsBand + reviewsHtml + faqHtml(HOME_FAQ),
    jsonld: [
      localBusinessSchema(),
      { '@context': 'https://schema.org', '@type': 'WebSite', url: SITE_URL, name: SITE_NAME,
        potentialAction: { '@type': 'SearchAction', target: SITE_URL + '/katalog/?q={query}', 'query-input': 'required name=query' } },
      { '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: HOME_FAQ.map((q) => ({ '@type': 'Question', name: q.q,
          acceptedAnswer: { '@type': 'Answer', text: q.a } })) },
    ],
  });
  writeFile(path.join(OUT, 'index.html'), html);
  return ['/'];
}

// ---- New builders -----------------------------------------------------

function buildCalculators(cars) {
  const carsLite = cars.map((c) => ({
    slug: c.slug, label: `${c.marka} ${c.model} ${c.generacja} ${c.silnik}`,
    km0: c.moc_km_seryjna, km1: c.moc_km_tuning, nm0: c.moment_seryjny, nm1: c.moment_tuning,
    pojemnosc: c.pojemnosc,
  }));
  const inner = render(T.kalkulatory, {
    CARS_JSON: JSON.stringify(carsLite).replace(/</g, '\\u003c'),
  });
  const html = wrapLayout({
    title: 'Kalkulatory chiptuningu - ROI, paliwo, Stage 1/2/3, DPF/AdBlue',
    description: 'Cztery kalkulatory dla diesli: oszczędność paliwa po tuningu, koszt i ryzyka Stage 1/2/3, ROI tuningu w czasie, oszczędności po usunięciu DPF/AdBlue.',
    canonicalPath: '/kalkulatory/',
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Kalkulatory', url: '/kalkulatory/' },
    ],
    extraScripts: '<script src="/js/kalkulatory.js" defer></script>',
  });
  writeFile(path.join(OUT, 'kalkulatory', 'index.html'), html);
  return ['/kalkulatory/'];
}

function buildComparator(cars) {
  const carsLite = cars.map((c) => ({
    slug: c.slug, label: `${c.marka} ${c.model} ${c.generacja} ${c.silnik}`,
    marka: c.marka, model: c.model, generacja: c.generacja, silnik: c.silnik,
    sterownik: c.sterownik, pojemnosc: c.pojemnosc,
    km0: c.moc_km_seryjna, km1: c.moc_km_tuning,
    nm0: c.moment_seryjny, nm1: c.moment_tuning,
    diff_km: c.diff_km, diff_nm: c.diff_nm, diff_pct: c.diff_pct,
  }));
  const inner = render(T.porownaj, {
    CARS_JSON: JSON.stringify(carsLite).replace(/</g, '\\u003c'),
  });
  const html = wrapLayout({
    title: 'Porównaj modele - chiptuning side by side',
    description: 'Zestaw 2-3 silniki diesla obok siebie. Porównaj moc, moment, przyrost po tuningu i sterowniki ECU. Pomaga wybrać auto pod dany cel.',
    canonicalPath: '/porownaj/',
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Porównywarka', url: '/porownaj/' },
    ],
    extraScripts: '<script src="/js/porownaj.js" defer></script>',
  });
  writeFile(path.join(OUT, 'porownaj', 'index.html'), html);
  return ['/porownaj/'];
}

function buildQuiz(cars) {
  const carsLite = cars.map((c) => ({
    slug: c.slug, marka: c.marka, model: c.model, generacja: c.generacja, silnik: c.silnik,
    km0: c.moc_km_seryjna, km1: c.moc_km_tuning,
  }));
  const inner = render(T.wycena, {
    CARS_JSON: JSON.stringify(carsLite).replace(/</g, '\\u003c'),
    EMAIL: BUSINESS.email,
  });
  const html = wrapLayout({
    title: 'Wyceń tuning swojego auta - quiz w 5 krokach',
    description: 'Wypełnij krótki quiz, a my wyślemy Ci spersonalizowaną wycenę chiptuningu Twojego diesla. Zajmuje 2 minuty.',
    canonicalPath: '/wycena/',
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Wyceń tuning', url: '/wycena/' },
    ],
    extraScripts: '<script src="/js/wycena.js" defer></script>',
  });
  writeFile(path.join(OUT, 'wycena', 'index.html'), html);
  return ['/wycena/'];
}

function buildDynoGallery(realizations, cars) {
  // Combine realizations that have km0/km1 and synth dyno entries from each car
  // (so the gallery is rich even before realizations are added).
  const dynoEntries = [];
  for (const r of realizations) {
    if (r.km0 && r.km1) {
      dynoEntries.push({
        id: 'r-' + r.slug,
        title: r.title,
        marka: r.marka || '',
        model: r.samochod || '',
        silnik: r.silnik || '',
        sterownik: r.sterownik || '',
        stage: r.stage || 'Stage 1',
        km0: r.km0, km1: r.km1, nm0: r.nm0 || null, nm1: r.nm1 || null,
        rok: r.rok, slug: r.slug,
        href: `/realizacje/${r.slug}`,
      });
    }
  }
  // Add synthetic entries from the catalog so gallery isn't empty - mark them as "from catalog"
  for (const c of cars.slice(0, 30)) {
    dynoEntries.push({
      id: 'c-' + c.slug,
      title: `${c.marka} ${c.model} ${c.silnik}`,
      marka: c.marka,
      model: c.model,
      silnik: c.silnik,
      sterownik: c.sterownik,
      stage: 'Stage 1',
      km0: c.moc_km_seryjna, km1: c.moc_km_tuning,
      nm0: c.moment_seryjny, nm1: c.moment_tuning,
      rok: '', slug: c.slug,
      href: `/tuning/${c.slug}`,
    });
  }

  const totalGain = dynoEntries.reduce((s, e) => s + Math.max(0, (e.km1 || 0) - (e.km0 || 0)), 0);
  const avgGain = dynoEntries.length ? Math.round(totalGain / dynoEntries.length) : 0;

  // Render mini-cards as HTML on the server (so SEO works even with JS off)
  const cardsHtml = dynoEntries.map((e) => `
    <article class="dyno-card"
      data-marka="${esc(slugify(e.marka))}"
      data-stage="${esc(e.stage)}"
      data-km1="${esc(e.km1)}"
      data-rok="${esc(e.rok)}">
      <a href="${esc(e.href)}" class="dyno-card-link">
        <div class="dyno-card-art">${dynoChartSvg({
          slug: e.id,
          marka: e.marka, model: e.model, silnik: e.silnik,
          moc_km_seryjna: e.km0, moc_km_tuning: e.km1,
          moment_seryjny: e.nm0 || Math.round(e.km0 * 2),
          moment_tuning: e.nm1 || Math.round(e.km1 * 2),
        }, { width: 360, height: 220 })}</div>
        <div class="dyno-card-body">
          <h3>${esc(e.title)}</h3>
          <div class="dyno-card-meta">
            <span class="badge">${esc(e.stage)}</span>
            ${e.sterownik ? `<span class="badge badge-ghost">${esc(e.sterownik)}</span>` : ''}
            ${e.rok ? `<span class="badge badge-ghost">${esc(e.rok)}</span>` : ''}
          </div>
          <div class="dyno-card-numbers">
            <span><strong>${e.km0} → ${e.km1}</strong> KM <em>+${(e.km1||0)-(e.km0||0)}</em></span>
            ${e.nm0 && e.nm1 ? `<span><strong>${e.nm0} → ${e.nm1}</strong> Nm <em>+${e.nm1-e.nm0}</em></span>` : ''}
          </div>
        </div>
      </a>
    </article>`).join('\n');

  const markaOpts = [...new Set(dynoEntries.map((e) => e.marka).filter(Boolean))].sort();
  const stageOpts = [...new Set(dynoEntries.map((e) => e.stage).filter(Boolean))].sort();

  const inner = render(T.dynoGaleria, {
    CARDS: cardsHtml,
    TOTAL: dynoEntries.length,
    AVG_GAIN: avgGain,
    MARKA_OPTIONS: markaOpts.map((m) => `<option value="${esc(slugify(m))}">${esc(m)}</option>`).join(''),
    STAGE_OPTIONS: stageOpts.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join(''),
  });
  const html = wrapLayout({
    title: 'Galeria hamowni - wykresy dyno, wszystkie nasze pomiary',
    description: `Filtrowalna baza ${dynoEntries.length} wykresów dyno. Średni przyrost mocy: ${avgGain} KM. Sprawdź realne efekty chiptuningu w G-Lab.`,
    canonicalPath: '/galeria-hamowni/',
    content: inner,
    breadcrumbs: [
      { name: 'Strona główna', url: '/' },
      { name: 'Galeria hamowni', url: '/galeria-hamowni/' },
    ],
    extraScripts: '<script src="/js/dyno-galeria.js" defer></script>',
  });
  writeFile(path.join(OUT, 'galeria-hamowni', 'index.html'), html);
  return ['/galeria-hamowni/'];
}

// ---- PWA + OG image ---------------------------------------------------

function buildPWA(urls) {
  const manifest = {
    name: SITE_NAME,
    short_name: 'G-Lab',
    description: 'Chiptuning diesli, DPF/EGR, hamownia podwoziowa w Łodzi.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'pl',
    icons: [
      { src: '/img/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
    shortcuts: [
      { name: 'Katalog', url: '/katalog/' },
      { name: 'Wyceń tuning', url: '/wycena/' },
      { name: 'Kontakt', url: '/kontakt/' },
    ],
  };
  writeFile(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

  // Pre-cache shell + first ~50 pages (more would bust cache budget on mobile)
  const precache = [
    '/', '/katalog/', '/realizacje/', '/kalkulatory/', '/porownaj/', '/wycena/',
    '/galeria-hamowni/', '/chiptuning/', '/dpf-egr/', '/hamownia/', '/kontakt/',
    '/css/main.css', '/js/main.js', '/img/favicon.svg', '/img/og-default.svg',
    '/manifest.webmanifest',
  ].concat(urls.filter((u) => u.startsWith('/tuning/')).slice(0, 24));

  const sw = `// G-Lab service worker - generated at build time.
const VERSION = 'g-lab-${Date.now()}';
const SHELL = ${JSON.stringify([...new Set(precache)])};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // HTML: network-first, falling back to cached shell
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((m) => m || caches.match('/'))));
    return;
  }
  // assets: cache-first
  e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
    return res;
  })));
});
`;
  writeFile(path.join(OUT, 'sw.js'), sw);
}

function buildOgImage() {
  // Default OG image (1200x630) - SVG with G-Lab branding.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ff5a1f" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <text x="80" y="220" font-family="Inter, system-ui, sans-serif" font-size="120" font-weight="900" fill="#fafafa" letter-spacing="-4">G-<tspan fill="#ff5a1f">Lab</tspan></text>
  <text x="80" y="290" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="600" fill="#fafafa" opacity="0.85">Chiptuning diesli · DPF/EGR · hamownia</text>
  <text x="80" y="340" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#fafafa" opacity="0.6">Łódź · Rokicińska 266 · od 2006 roku</text>
  <g transform="translate(80,420)" fill="none" stroke="#ff5a1f" stroke-width="3" stroke-linecap="round">
    <path d="M0 130 Q 200 110 380 60 T 700 30" opacity="0.9"/>
    <path d="M0 150 Q 200 145 380 130 T 700 110" stroke="#ffb020" opacity="0.8"/>
    <path d="M0 170 Q 200 175 380 165 T 700 155" stroke="#fafafa" stroke-opacity="0.4" stroke-dasharray="6 4"/>
  </g>
  <text x="800" y="540" font-family="Inter, system-ui, sans-serif" font-size="24" fill="#fafafa" opacity="0.55">g-lab.pl</text>
</svg>`;
  writeFile(path.join(OUT, 'img', 'og-default.svg'), svg);
}

function buildSitemap(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const priority = (u) => {
    if (u === '/') return '1.0';
    if (/^\/(katalog|realizacje|kalkulatory|porownaj|wycena|galeria-hamowni)\/?$/.test(u)) return '0.9';
    if (/^\/(chiptuning|dpf-egr|hamownia|kontakt)\/?$/.test(u)) return '0.8';
    if (u.startsWith('/tuning/')) return '0.7';
    return '0.5';
  };
  const changefreq = (u) => {
    if (u === '/') return 'weekly';
    if (u.startsWith('/realizacje/')) return 'monthly';
    return 'monthly';
  };
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...new Set(urls)].map((u) =>
      `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod><changefreq>${changefreq(u)}</changefreq><priority>${priority(u)}</priority></url>`
    ).join('\n') +
    '\n</urlset>\n';
  writeFile(path.join(OUT, 'sitemap.xml'), xml);
  writeFile(path.join(OUT, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
}

function buildAdmin() {
  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>G-Lab CMS</title>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  <script>
    if (window.netlifyIdentity) {
      window.netlifyIdentity.on('init', function (user) {
        if (!user) {
          window.netlifyIdentity.on('login', function () { document.location.href = '/admin/'; });
        }
      });
    }
  </script>
</body>
</html>
`;
  const config = `backend:
  name: git-gateway
  branch: main

media_folder: "public/img/uploads"
public_folder: "/img/uploads"

publish_mode: editorial_workflow

locale: "pl"

collections:
  - name: "realizacje"
    label: "Realizacje"
    label_singular: "Realizacja"
    folder: "content/realizacje"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    summary: "{{title}} - {{samochod}} ({{data}})"
    sortable_fields: ["data", "title"]
    fields:
      - { label: "Tytuł", name: "title", widget: "string" }
      - { label: "Slug (URL)", name: "slug", widget: "string", hint: "Część adresu URL, np. bmw-320d-stage-1" }
      - { label: "Samochód", name: "samochod", widget: "string", hint: "np. BMW 320d F30 (2014)" }
      - { label: "Marka", name: "marka", widget: "string", required: false, hint: "np. BMW (do filtrów)" }
      - { label: "Usługa", name: "usluga", widget: "select", default: "chiptuning", options: ["chiptuning","dpf-egr","hamownia","inne"] }
      - { label: "Stage", name: "stage", widget: "select", required: false, options: ["", "Stage 1","Stage 2","Stage 3","Indywidualnie"], default: "Stage 1" }
      - { label: "Silnik", name: "silnik", widget: "string", required: false }
      - { label: "Sterownik (ECU)", name: "sterownik", widget: "string", required: false }
      - { label: "Data", name: "data", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false, format: "YYYY-MM-DD" }
      - { label: "Krótki opis", name: "krotki_opis", widget: "text", hint: "Wyświetlany na liście realizacji" }
      - { label: "Moc seryjna [KM]", name: "km0", widget: "number", required: false, value_type: "int", min: 0 }
      - { label: "Moc po tuningu [KM]", name: "km1", widget: "number", required: false, value_type: "int", min: 0 }
      - { label: "Moment seryjny [Nm]", name: "nm0", widget: "number", required: false, value_type: "int", min: 0 }
      - { label: "Moment po tuningu [Nm]", name: "nm1", widget: "number", required: false, value_type: "int", min: 0 }
      - { label: "Zdjęcie główne", name: "cover", widget: "image", required: false }
      - { label: "Pełny opis", name: "body", widget: "markdown" }
      - label: "Galeria"
        name: "gallery"
        widget: "list"
        required: false
        summary: "{{fields.alt}}"
        fields:
          - { label: "Zdjęcie", name: "image", widget: "image" }
          - { label: "Opis (alt)", name: "alt", widget: "string", required: false, hint: "wpisz 'before' lub 'after' dla suwaka przed/po" }
      - label: "Użyte narzędzia"
        name: "narzedzia"
        widget: "list"
        required: false
        field: { label: "Narzędzie", name: "name", widget: "string" }

  - name: "pages"
    label: "Strony"
    label_singular: "Strona"
    folder: "content/pages"
    create: false
    delete: false
    slug: "{{slug}}"
    fields:
      - { label: "Tytuł", name: "title", widget: "string" }
      - { label: "Podtytuł", name: "subtitle", widget: "string", required: false }
      - { label: "Slug (URL)", name: "slug", widget: "string" }
      - { label: "Treść", name: "body", widget: "markdown" }
`;
  writeFile(path.join(OUT, 'admin', 'index.html'), html);
  writeFile(path.join(OUT, 'admin', 'config.yml'), config);
}

function main() {
  console.log('- Cleaning public/');
  rmrf(OUT);
  ensureDir(OUT);

  console.log('- Copying assets');
  copyDir(path.join(SRC, 'css'), path.join(OUT, 'css'));
  copyDir(path.join(SRC, 'js'), path.join(OUT, 'js'));
  copyDir(path.join(SRC, 'img'), path.join(OUT, 'img'));

  console.log('- Generating OG image');
  buildOgImage();

  let urls = [];

  console.log('- Building catalog (CSV -> pages)');
  const cars = loadCatalog();
  console.log(`  loaded ${cars.length} cars`);
  urls = urls.concat(buildCatalog(cars));

  console.log('- Building static pages');
  urls = urls.concat(buildStaticPages());

  console.log('- Building realizations');
  const realizations = loadRealizations();
  console.log(`  loaded ${realizations.length} realizations`);
  urls = urls.concat(buildRealizations(realizations));

  console.log('- Building calculators');
  urls = urls.concat(buildCalculators(cars));

  console.log('- Building comparator');
  urls = urls.concat(buildComparator(cars));

  console.log('- Building quiz');
  urls = urls.concat(buildQuiz(cars));

  console.log('- Building dyno gallery');
  urls = urls.concat(buildDynoGallery(realizations, cars));

  console.log('- Building home');
  const dynoCount = realizations.filter((r) => r.km0 && r.km1).length + Math.min(30, cars.length);
  const avgGain = Math.round(cars.reduce((s, c) => s + (c.diff_km || 0), 0) / Math.max(1, cars.length));
  urls = urls.concat(buildHome({
    years: new Date().getFullYear() - BUSINESS.founded,
    cars: cars.length,
    dynoCount,
    avgGain,
  }));

  console.log('- Writing PWA (manifest + service worker)');
  buildPWA(urls);

  console.log('- Writing sitemap.xml & robots.txt');
  buildSitemap(urls);

  console.log('- Writing /admin (Decap CMS)');
  buildAdmin();

  writeFile(path.join(OUT, '_redirects'),
    [
      '/katalog /katalog/ 301',
      '/realizacje /realizacje/ 301',
      '/kalkulator /kalkulatory/ 301',
      '/chiptuning /chiptuning/ 301',
      '/dpf-egr /dpf-egr/ 301',
      '/hamownia /hamownia/ 301',
      '/kontakt /kontakt/ 301',
      '/polityka-prywatnosci /polityka-prywatnosci/ 301',
      '/regulamin /regulamin/ 301',
      '',
    ].join('\n'));

  console.log(`Build done: ${urls.length} pages -> ${OUT}`);
}

main();
