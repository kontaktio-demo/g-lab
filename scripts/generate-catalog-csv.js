#!/usr/bin/env node
// One-shot script that expands katalog.csv with ~20 000 synthetic catalog
// entries (petrol + diesel) generated from lib/synthetic-catalog.js.
//
// Why a script, not in-build generation?
// - Each catalog row needs a full static /tuning/{slug}.html page so that
//   Google can index queries like "BMW 320d tuning".
// - The site already generates static pages for every CSV row. Putting the
//   synthetic data in the CSV makes them flow through the same pipeline -
//   one pipeline, one source of truth, naturally indexable.
//
// Usage:
//   node scripts/generate-catalog-csv.js          # write to katalog.csv
//   node scripts/generate-catalog-csv.js --dry    # preview counts only
//
// Verified entries (those originally in katalog.csv before this script ran)
// are preserved verbatim at the top of the file. Synthetic entries are
// appended; any synthetic that collides with an existing slug is skipped.

'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { buildSyntheticCatalog } = require('../lib/synthetic-catalog');

const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'katalog.csv');

const COLUMNS = [
  'marka', 'model', 'generacja', 'rok_od', 'rok_do', 'silnik',
  'moc_kw_seryjna', 'moc_km_seryjna', 'moc_kw_tuning', 'moc_km_tuning',
  'moment_seryjny', 'moment_tuning', 'sterownik', 'slug',
  'paliwo', 'synthetic',
];

function detectFuel(silnik) {
  const s = String(silnik || '');
  if (/\b(?:tdi|hdi|cdi|cdti|crdi|dci|jtd|jtdm|multijet|d-?4d|d-cat|tddi|tdci|bluehdi|bluetec|sdi|i-dtec|i-ctdi|skyactiv-?d|hpi|xdi|e-xdi|d4d|sdv\d|sdv6|sdv8|d\d+|tdv\d|p-?d|pd\b)\b/i.test(s)) return 'diesel';
  if (/\b\d+(?:\.\d+)?\s*d\b/i.test(s) && !/\b\d+(?:\.\d+)?\s*dit\b/i.test(s)) return 'diesel';
  return 'benzyna';
}

// Quote a single CSV field per RFC 4180 - quote only when needed (contains
// comma, double quote, CR or LF), and double-up internal quotes.
function csvField(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvLine(obj, columns) {
  return columns.map((k) => csvField(obj[k])).join(',');
}

function row(c) {
  return {
    marka: c.marka,
    model: c.model,
    generacja: c.generacja,
    rok_od: c.rok_od,
    rok_do: c.rok_do,
    silnik: c.silnik,
    moc_kw_seryjna: c.moc_kw_seryjna,
    moc_km_seryjna: c.moc_km_seryjna,
    moc_kw_tuning: c.moc_kw_tuning,
    moc_km_tuning: c.moc_km_tuning,
    moment_seryjny: c.moment_seryjny,
    moment_tuning: c.moment_tuning,
    sterownik: c.sterownik,
    slug: c.slug,
    paliwo: c.paliwo || detectFuel(c.silnik),
    synthetic: c.synthetic ? '1' : '',
  };
}

function main() {
  const dry = process.argv.includes('--dry');

  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const existing = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  console.log(`Read ${existing.length} existing rows from katalog.csv`);

  const verifiedRows = existing
    // Skip any rows that were synthetic from a previous run, so re-running the
    // script does not accumulate duplicates with stale data.
    .filter((r) => r.synthetic !== '1')
    .map((r) => ({
      marka: r.marka, model: r.model, generacja: r.generacja,
      rok_od: r.rok_od, rok_do: r.rok_do, silnik: r.silnik,
      moc_kw_seryjna: r.moc_kw_seryjna, moc_km_seryjna: r.moc_km_seryjna,
      moc_kw_tuning: r.moc_kw_tuning, moc_km_tuning: r.moc_km_tuning,
      moment_seryjny: r.moment_seryjny, moment_tuning: r.moment_tuning,
      sterownik: r.sterownik, slug: r.slug,
      paliwo: r.paliwo || detectFuel(r.silnik),
      synthetic: '',
    }));
  const verifiedSlugs = new Set(verifiedRows.map((r) => r.slug).filter(Boolean));

  const synthetic = buildSyntheticCatalog();
  console.log(`Generated ${synthetic.length} synthetic candidates`);

  const seen = new Set(verifiedSlugs);
  const syntheticRows = [];
  let collisions = 0;
  for (const c of synthetic) {
    if (!c.slug) continue;
    if (seen.has(c.slug)) { collisions++; continue; }
    seen.add(c.slug);
    syntheticRows.push(row(c));
  }
  console.log(`  ${syntheticRows.length} kept, ${collisions} collided with verified slugs`);

  const all = verifiedRows.concat(syntheticRows);
  console.log(`Total catalog rows: ${all.length} (${verifiedRows.length} verified + ${syntheticRows.length} synthetic)`);

  if (dry) {
    console.log('--dry: not writing katalog.csv');
    return;
  }

  const lines = [COLUMNS.join(',')].concat(all.map((r) => csvLine(r, COLUMNS)));
  const out = lines.join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, out, 'utf8');
  console.log(`Wrote ${CSV_PATH} (${(out.length / 1024).toFixed(1)} KB)`);
}

main();
