import { router, asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
import { CatalogQuerySchema, CatalogImportSchema } from '../schemas/index.js';
import { BadRequestError } from '../utils/errors.js';
import { slugify } from '../utils/slugify.js';

const r = router();

/* GET /api/catalog (publiczne, paginacja) */
r.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = CatalogQuerySchema.parse(req.query);

    let query = supabaseAdmin
      .from('catalog_cars')
      .select('*', { count: 'exact' })
      .order('marka', { ascending: true })
      .order('model', { ascending: true })
      .range(q.offset, q.offset + q.limit - 1);

    if (q.marka) query = query.ilike('marka', q.marka);
    if (q.q) {
      const needle = `%${q.q.replace(/%/g, '')}%`;
      query = query.or(
        `marka.ilike.${needle},model.ilike.${needle},silnik.ilike.${needle},sterownik.ilike.${needle}`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw new BadRequestError(error.message);

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json({ items: data ?? [], total: count ?? 0, limit: q.limit, offset: q.offset });
  }),
);

/* POST /api/catalog/import (auth, bulk upsert / replace) */
r.post(
  '/import',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = CatalogImportSchema.parse(req.body);

    // Generujemy slug, jeśli ktoś go nie podał.
    const rows = body.rows.map((row) => ({
      ...row,
      slug:
        row.slug?.trim() ||
        slugify([row.marka, row.model, row.generacja, row.silnik].filter(Boolean).join(' ')),
    }));

    if (body.mode === 'replace') {
      const { error: delErr } = await supabaseAdmin.from('catalog_cars').delete().neq('id', 0);
      if (delErr) throw new BadRequestError(`Błąd czyszczenia: ${delErr.message}`);
    }

    // Wstawianie w paczkach, żeby nie przekroczyć limitów.
    const chunkSize = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin
        .from('catalog_cars')
        .upsert(chunk, { onConflict: 'slug' });
      if (error) throw new BadRequestError(`Błąd zapisu (paczka ${i / chunkSize + 1}): ${error.message}`);
      inserted += chunk.length;
    }

    await supabaseAdmin.from('csv_imports').insert({
      filename: 'api-import',
      rows_count: inserted,
      mode: body.mode,
      created_by: req.user?.id ?? null,
    });

    res.json({ ok: true, inserted, mode: body.mode });
  }),
);

export default r;
