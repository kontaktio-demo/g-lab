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
const SITE_URL = process.env.SITE_URL || 'https://g-lab.pl';

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
};

function wrapLayout({ title, description, canonicalPath, content, extraHead = '', extraScripts = '' }) {
  return render(T.layout, {
    TITLE: esc(title),
    DESCRIPTION: esc(description),
    CANONICAL: SITE_URL + canonicalPath,
    CONTENT: content,
    YEAR: new Date().getFullYear(),
    EXTRA_HEAD: extraHead,
    EXTRA_SCRIPTS: extraScripts,
  });
}

function loadCatalog() {
  const csv = readFile(path.join(ROOT, 'katalog.csv'));
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
  return rows.map((r) => {
    const num = (k) => (r[k] === '' || r[k] == null ? null : Number(r[k]));
    const slug = (r.slug && r.slug.trim()) || slugify(
      [r.marka, r.model, r.generacja, r.silnik].filter(Boolean).join(' ')
    );
    return {
      marka: r.marka, model: r.model, generacja: r.generacja,
      rok_od: r.rok_od, rok_do: r.rok_do, silnik: r.silnik,
      moc_kw_seryjna: num('moc_kw_seryjna'), moc_km_seryjna: num('moc_km_seryjna'),
      moc_kw_tuning: num('moc_kw_tuning'), moc_km_tuning: num('moc_km_tuning'),
      moment_seryjny: num('moment_seryjny'), moment_tuning: num('moment_tuning'),
      sterownik: r.sterownik, slug,
      marka_slug: slugify(r.marka),
      silnik_slug: slugify((r.marka || '') + ' ' + r.silnik),
      sterownik_slug: slugify(r.sterownik),
    };
  });
}

function renderCarPage(car) {
  const title = `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik} - ${car.moc_km_seryjna} -> ${car.moc_km_tuning} KM`;
  const description = `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik} (${car.rok_od}-${car.rok_do}). Moc seryjna ${car.moc_km_seryjna} KM (${car.moc_kw_seryjna} kW), moc po tuningu ${car.moc_km_tuning} KM (${car.moc_kw_tuning} kW). Moment ${car.moment_seryjny} -> ${car.moment_tuning} Nm. Sterownik ${car.sterownik}.`;

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik}`,
    brand: { '@type': 'Brand', name: car.marka },
    description,
    category: 'Chiptuning',
  }).replace(/</g, '\\u003c');

  const inner = render(T.auto, {
    MARKA: esc(car.marka),
    MODEL: esc(car.model),
    GENERACJA: esc(car.generacja),
    ROK_OD: esc(car.rok_od),
    ROK_DO: esc(car.rok_do),
    SILNIK: esc(car.silnik),
    STEROWNIK: esc(car.sterownik),
    MOC_KW_SERYJNA: esc(car.moc_kw_seryjna),
    MOC_KM_SERYJNA: esc(car.moc_km_seryjna),
    MOC_KW_TUNING: esc(car.moc_kw_tuning),
    MOC_KM_TUNING: esc(car.moc_km_tuning),
    MOMENT_SERYJNY: esc(car.moment_seryjny),
    MOMENT_TUNING: esc(car.moment_tuning),
    DIFF_KM: esc((car.moc_km_tuning || 0) - (car.moc_km_seryjna || 0)),
    DIFF_NM: esc((car.moment_tuning || 0) - (car.moment_seryjny || 0)),
    MARKA_SLUG: esc(car.marka_slug),
    SILNIK_SLUG: esc(car.silnik_slug),
    STEROWNIK_SLUG: esc(car.sterownik_slug),
    JSONLD: jsonld,
  });

  return wrapLayout({
    title, description,
    canonicalPath: `/tuning/${car.slug}`,
    content: inner,
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
  });
  writeFile(path.join(OUT, dirSegment, `${slug}.html`), html);
}

function buildCatalog(cars) {

  for (const car of cars) {
    writeFile(path.join(OUT, 'tuning', `${car.slug}.html`), renderCarPage(car));
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
  }))).replace(/</g, '\\u003c');

  const inner = render(T.katalog, { BRAND_LINKS: brandLinks, CATALOG_JSON: catalogJson });
  const html = wrapLayout({
    title: 'Katalog chiptuningu - sprawdź swoje auto',
    description: 'Sprawdź, ile mocy i momentu obrotowego może uzyskać Twoje auto po chiptuningu. Kilka tysięcy modeli w bazie.',
    canonicalPath: '/katalog/',
    content: inner,
  });
  writeFile(path.join(OUT, 'katalog', 'index.html'), html);
  written.push('/katalog/');

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
      return {
        title: data.title || 'Realizacja',
        slug,
        samochod: data.samochod || '',
        data: data.date || data.data || '',
        krotki_opis: data.krotki_opis || data.short || '',
        cover: data.cover || '',
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
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

  const grid = items.length
    ? `<div class="cards-grid">${items.map((r) => `
        <a class="realization-card" href="/realizacje/${esc(r.slug)}">
          ${r.cover ? `<div class="thumb" style="background-image:url('${esc(r.cover)}')"></div>` : `<div class="thumb"></div>`}
          <div class="body">
            <div class="meta">${esc(formatDatePL(r.data))} | ${esc(r.samochod)}</div>
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.krotki_opis)}</p>
          </div>
        </a>`).join('\n')}</div>`
    : `<p class="lead">Wkrótce dodamy nasze realizacje.</p>`;

  const listInner = render(T.realizacjeList, { REALIZATIONS_GRID: grid });
  const listHtml = wrapLayout({
    title: 'Realizacje - G-Lab Chip Tuning',
    description: 'Wybrane realizacje chiptuningu, usuwania DPF/EGR i pomiarów na hamowni wykonane w naszym warsztacie.',
    canonicalPath: '/realizacje/',
    content: listInner,
  });
  writeFile(path.join(OUT, 'realizacje', 'index.html'), listHtml);
  written.push('/realizacje/');

  for (const r of items) {
    const cover = r.cover
      ? `<img class="realization-cover" src="${esc(r.cover)}" alt="${esc(r.title)}">`
      : '';
    const gallery = r.gallery && r.gallery.length
      ? `<div class="gallery">${r.gallery.map((g) => {
          const src = typeof g === 'string' ? g : (g && g.image) || '';
          const alt = typeof g === 'object' && g && g.alt ? g.alt : r.title;
          return src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '';
        }).join('\n')}</div>`
      : '';
    const inner = render(T.realizacja, {
      TYTUL: esc(r.title),
      SAMOCHOD: esc(r.samochod),
      DATA_FORMATTED: esc(formatDatePL(r.data)),
      KROTKI_OPIS: esc(r.krotki_opis),
      DLUGI_OPIS: marked.parse(r.body || ''),
      COVER_IMAGE: cover,
      GALLERY: gallery,
    });
    const html = wrapLayout({
      title: `${r.title} - realizacja G-Lab`,
      description: r.krotki_opis || `Realizacja ${r.samochod} w warsztacie G-Lab.`,
      canonicalPath: `/realizacje/${r.slug}`,
      content: inner,
    });
    writeFile(path.join(OUT, 'realizacje', `${r.slug}.html`), html);
    written.push(`/realizacje/${r.slug}`);
  }

  return written;
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

    kontakt: `<svg class="page-hero-art" viewBox="0 0 460 320" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hatch-k" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
        </pattern>
      </defs>
      <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
        <!-- Architectural plot plan / site map of workshop -->

        <!-- North arrow -->
        <g opacity="0.75">
          <circle cx="420" cy="40" r="14"/>
          <path d="M420 28 l 6 18 l -6 -6 l -6 6 z" fill="currentColor" stroke="none"/>
          <text x="420" y="60" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.85" font-weight="700">N</text>
        </g>

        <!-- Plot boundary -->
        <rect x="40" y="40" width="340" height="220" stroke-width="1.4"/>
        <!-- inner safety dashed line -->
        <rect x="50" y="50" width="320" height="200" stroke-dasharray="4 3" opacity="0.45"/>

        <!-- Street label below boundary -->
        <line x1="40" y1="270" x2="380" y2="270" stroke-width="2"/>
        <line x1="40" y1="280" x2="380" y2="280" stroke-dasharray="8 4" opacity="0.6"/>
        <text x="210" y="294" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="2">UL. ROKICIŃSKA</text>

        <!-- Workshop building -->
        <rect x="80" y="80" width="180" height="120" stroke-width="1.4"/>
        <rect x="80" y="80" width="180" height="120" fill="url(#hatch-k)" stroke="none"/>
        <!-- internal walls / bays -->
        <line x1="140" y1="80" x2="140" y2="200"/>
        <line x1="200" y1="80" x2="200" y2="200"/>
        <line x1="80" y1="140" x2="260" y2="140"/>
        <!-- garage doors (semi-circle swing) -->
        <line x1="98" y1="200" x2="122" y2="200" stroke-width="1.6"/>
        <path d="M98 200 a 24 24 0 0 1 24 -24" opacity="0.6"/>
        <line x1="158" y1="200" x2="182" y2="200" stroke-width="1.6"/>
        <path d="M158 200 a 24 24 0 0 1 24 -24" opacity="0.6"/>
        <line x1="218" y1="200" x2="242" y2="200" stroke-width="1.6"/>
        <path d="M218 200 a 24 24 0 0 1 24 -24" opacity="0.6"/>
        <!-- entry door -->
        <line x1="240" y1="80" x2="252" y2="80" stroke-width="1.6"/>
        <path d="M240 80 a 12 12 0 0 1 12 12" opacity="0.6"/>
        <!-- bay labels -->
        <text x="110" y="116" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">HAMOWNIA</text>
        <text x="170" y="116" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">DIAGNOSTYKA</text>
        <text x="230" y="116" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="1">SERWIS</text>
        <text x="170" y="172" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.6" letter-spacing="2">G-LAB</text>

        <!-- dyno rollers icon inside HAMOWNIA bay -->
        <g stroke-width="0.7" opacity="0.7">
          <circle cx="100" cy="130" r="3"/>
          <circle cx="120" cy="130" r="3"/>
          <line x1="92" y1="134" x2="128" y2="134"/>
        </g>
        <!-- car icon in serwis bay -->
        <g stroke-width="0.7" opacity="0.65">
          <path d="M212 178 q 4 -10 14 -10 h 8 q 8 0 12 6 h 6 v 6 h -42 z"/>
          <circle cx="220" cy="184" r="2"/>
          <circle cx="240" cy="184" r="2"/>
        </g>

        <!-- Parking lot (right of building) -->
        <rect x="280" y="80" width="80" height="120" opacity="0.85"/>
        <text x="320" y="74" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.7" letter-spacing="2">PARKING DLA KLIENTÓW</text>
        <!-- parking slots -->
        <g stroke-width="0.7" opacity="0.7">
          <line x1="280" y1="100" x2="360" y2="100"/>
          <line x1="280" y1="120" x2="360" y2="120"/>
          <line x1="280" y1="140" x2="360" y2="140"/>
          <line x1="280" y1="160" x2="360" y2="160"/>
          <line x1="280" y1="180" x2="360" y2="180"/>
          <line x1="320" y1="80" x2="320" y2="200"/>
        </g>
        <g stroke-width="0.6" opacity="0.55">
          <text x="300" y="94" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P1</text>
          <text x="340" y="94" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P2</text>
          <text x="300" y="114" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P3</text>
          <text x="340" y="114" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P4</text>
          <text x="300" y="134" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P5</text>
          <text x="340" y="134" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P6</text>
          <text x="300" y="154" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P7</text>
          <text x="340" y="154" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" stroke="none" fill="currentColor">P8</text>
        </g>

        <!-- Driveway from street -->
        <path d="M180 270 v -50 h 60 v -10" stroke-dasharray="6 3" opacity="0.6"/>

        <!-- Entry pin/marker -->
        <g stroke-width="1.2">
          <path d="M210 224 a 8 8 0 1 1 16 0 c 0 6 -8 14 -8 14 c 0 0 -8 -8 -8 -14 z"/>
          <circle cx="218" cy="224" r="3" fill="currentColor" stroke="none"/>
        </g>
        <text x="218" y="252" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" stroke="none" fill="currentColor" opacity="0.75">WJAZD</text>

        <!-- Trees / greenery (decorative) -->
        <g stroke-width="0.8" opacity="0.55">
          <circle cx="60" cy="60" r="6"/><line x1="60" y1="66" x2="60" y2="74"/>
          <circle cx="60" cy="220" r="6"/><line x1="60" y1="226" x2="60" y2="234"/>
          <circle cx="60" cy="240" r="6"/><line x1="60" y1="246" x2="60" y2="254"/>
        </g>

        <!-- dimensions -->
        <g stroke-width="0.7" opacity="0.7">
          <line x1="40" y1="22" x2="380" y2="22"/>
          <path d="M40 18 l-4 4 l4 4"/>
          <path d="M380 18 l4 4 l-4 4"/>
          <line x1="40" y1="14" x2="40" y2="28"/>
          <line x1="380" y1="14" x2="380" y2="28"/>
        </g>
        <text x="210" y="18" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="2">42.0 m</text>

        <g stroke-width="0.7" opacity="0.7">
          <line x1="22" y1="40" x2="22" y2="260"/>
          <path d="M18 40 l4 -4 l4 4"/>
          <path d="M18 260 l4 4 l4 -4"/>
          <line x1="14" y1="40" x2="28" y2="40"/>
          <line x1="14" y1="260" x2="28" y2="260"/>
        </g>
        <text x="22" y="156" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" stroke="none" fill="currentColor" opacity="0.75" letter-spacing="2" transform="rotate(-90 22 156)">28.0 m</text>

        <!-- Title block -->
        <g opacity="0.55" stroke-width="0.8">
          <rect x="14" y="298" width="432" height="14"/>
          <line x1="140" y1="298" x2="140" y2="312"/>
          <line x1="260" y1="298" x2="260" y2="312"/>
          <line x1="360" y1="298" x2="360" y2="312"/>
        </g>
      </g>
      <text x="22" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">PLAN ZAGOSPODAROWANIA</text>
      <text x="148" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">G-LAB · ŁÓDŹ</text>
      <text x="268" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">SKALA 1:200</text>
      <text x="368" y="308" font-family="Inter, sans-serif" font-size="7" fill="currentColor" opacity="0.7" letter-spacing="2">DRG-401/A</text>
    </svg>`,
  };
  return arts[slug] || '';
}

function buildStaticPages() {
  const dir = path.join(CONTENT, 'pages');
  const written = [];
  if (!fs.existsSync(dir)) return written;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const raw = readFile(path.join(dir, f));
    const { data, content } = matter(raw);
    const slug = data.slug || path.basename(f, '.md');
    const html = wrapLayout({
      title: `${data.title || slug} - G-Lab Chip Tuning`,
      description: data.description || data.subtitle || `${data.title} - G-Lab Chip Tuning`,
      canonicalPath: `/${slug}`,
      content: render(T.page, {
        TITLE: esc(data.title || slug),
        SUBTITLE: data.subtitle ? `<p class="lead">${esc(data.subtitle)}</p>` : '',
        CONTENT: marked.parse(content || ''),
        PAGE_ART: pageArtForSlug(slug),
      }),
    });
    writeFile(path.join(OUT, `${slug}.html`), html);
    written.push(`/${slug}`);
  }
  return written;
}

function buildHome() {
  const html = wrapLayout({
    title: 'G-Lab Chip Tuning - chiptuning, DPF/EGR, hamownia',
    description: 'Profesjonalny chiptuning, usuwanie DPF i EGR, hamownia podwoziowa. Sprawdź swoje auto w naszym katalogu.',
    canonicalPath: '/',
    content: T.home,
  });
  writeFile(path.join(OUT, 'index.html'), html);
  return ['/'];
}

function buildSitemap(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...new Set(urls)].map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    '\n</urlset>\n';
  writeFile(path.join(OUT, 'sitemap.xml'), xml);
  writeFile(path.join(OUT, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
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
      - { label: "Data", name: "data", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false, format: "YYYY-MM-DD" }
      - { label: "Krótki opis", name: "krotki_opis", widget: "text", hint: "Wyświetlany na liście realizacji" }
      - { label: "Zdjęcie główne", name: "cover", widget: "image", required: false }
      - { label: "Pełny opis", name: "body", widget: "markdown" }
      - label: "Galeria"
        name: "gallery"
        widget: "list"
        required: false
        summary: "{{fields.alt}}"
        fields:
          - { label: "Zdjęcie", name: "image", widget: "image" }
          - { label: "Opis (alt)", name: "alt", widget: "string", required: false }

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

  let urls = [];

  console.log('- Building home');
  urls = urls.concat(buildHome());

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

  console.log('- Writing sitemap.xml & robots.txt');
  buildSitemap(urls);

  console.log('- Writing /admin (Decap CMS)');
  buildAdmin();

  writeFile(path.join(OUT, '_redirects'),
    '/katalog /katalog/ 301\n/realizacje /realizacje/ 301\n');

  console.log(`Build done: ${urls.length} pages -> ${OUT}`);
}

main();
