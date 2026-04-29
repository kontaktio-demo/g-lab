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
  const title = `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik} - ${car.moc_km_seryjna} → ${car.moc_km_tuning} KM`;
  const description = `Chiptuning ${car.marka} ${car.model} ${car.generacja} ${car.silnik} (${car.rok_od}-${car.rok_do}). Moc seryjna ${car.moc_km_seryjna} KM (${car.moc_kw_seryjna} kW), moc po tuningu ${car.moc_km_tuning} KM (${car.moc_kw_tuning} kW). Moment ${car.moment_seryjny} → ${car.moment_tuning} Nm. Sterownik ${car.sterownik}.`;

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
      <span class="arrow">→</span>
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
  console.log('• Cleaning public/');
  rmrf(OUT);
  ensureDir(OUT);

  console.log('• Copying assets');
  copyDir(path.join(SRC, 'css'), path.join(OUT, 'css'));
  copyDir(path.join(SRC, 'js'), path.join(OUT, 'js'));
  copyDir(path.join(SRC, 'img'), path.join(OUT, 'img'));

  let urls = [];

  console.log('• Building home');
  urls = urls.concat(buildHome());

  console.log('• Building catalog (CSV → pages)');
  const cars = loadCatalog();
  console.log(`  loaded ${cars.length} cars`);
  urls = urls.concat(buildCatalog(cars));

  console.log('• Building static pages');
  urls = urls.concat(buildStaticPages());

  console.log('• Building realizations');
  const realizations = loadRealizations();
  console.log(`  loaded ${realizations.length} realizations`);
  urls = urls.concat(buildRealizations(realizations));

  console.log('• Writing sitemap.xml & robots.txt');
  buildSitemap(urls);

  console.log('• Writing /admin (Decap CMS)');
  buildAdmin();

  writeFile(path.join(OUT, '_redirects'),
    '/katalog /katalog/ 301\n/realizacje /realizacje/ 301\n');

  console.log(`✓ Build done: ${urls.length} pages → ${OUT}`);
}

main();
