import { router, asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
import {
  RealizationCreateSchema,
  RealizationUpdateSchema,
  RealizationListQuerySchema,
} from '../schemas/index.js';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors.js';
import { slugify } from '../utils/slugify.js';
import { triggerRevalidate } from '../services/revalidate.js';
import { deleteImagePaths, type ProcessedImage } from '../services/imagePipeline.js';

const r = router();

/* ───────── helpers ───────── */

function rowsToPublicShape<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((row) => {
    const r2 = { ...row } as Record<string, unknown>;
    if (r2.data && typeof r2.data === 'string') {
      r2.rok = Number(r2.data.slice(0, 4));
    }
    return r2 as T;
  });
}

function collectImagePaths(...imgs: Array<ProcessedImage | null | undefined>): string[] {
  const paths: string[] = [];
  for (const img of imgs) {
    if (!img) continue;
    if (img.path) paths.push(img.path);
    if (Array.isArray(img.variants)) {
      for (const v of img.variants) if (v?.path) paths.push(v.path);
    }
  }
  return paths;
}

/* ───────── GET /api/realizations  (publiczne) ───────── */

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = RealizationListQuerySchema.parse(req.query);

    let query = supabaseAdmin
      .from('realizations')
      .select(
        'id,slug,title,samochod,data,krotki_opis,marka,usluga,stage,silnik,sterownik,km0,km1,nm0,nm1,narzedzia,cover,cover_url,gallery,published,created_at,updated_at',
        { count: 'exact' },
      )
      .order('data', { ascending: false })
      .range(q.offset, q.offset + q.limit - 1);

    // Drafty tylko dla zalogowanych.
    if (!q.include_drafts) {
      query = query.eq('published', true);
    } else {
      // tu wymagamy auth — sprawdzamy ręcznie, bo route jest publiczny
      // (klient z JWT może doczytać też szkice).
      const auth = req.header('authorization');
      if (!auth) throw new BadRequestError('include_drafts wymaga uwierzytelnienia.');
    }

    if (q.marka) query = query.ilike('marka', q.marka);
    if (q.usluga) query = query.eq('usluga', q.usluga);
    if (q.rok) {
      query = query.gte('data', `${q.rok}-01-01`).lte('data', `${q.rok}-12-31`);
    }
    if (q.q) {
      const needle = `%${q.q.replace(/%/g, '')}%`;
      query = query.or(
        `title.ilike.${needle},samochod.ilike.${needle},silnik.ilike.${needle},marka.ilike.${needle}`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw new BadRequestError(error.message);

    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
    res.json({
      items: rowsToPublicShape(data ?? []),
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
    });
  }),
);

/* ───────── GET /api/realizations/:slug  (publiczne) ───────── */

r.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug ?? '');
    if (!slug) throw new BadRequestError('Brak slug.');

    const { data, error } = await supabaseAdmin
      .from('realizations')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) throw new BadRequestError(error.message);
    if (!data) throw new NotFoundError(`Realizacja "${slug}" nie istnieje.`);

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.json(rowsToPublicShape([data])[0]);
  }),
);

/* ───────── POST /api/realizations  (auth) ───────── */

r.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = RealizationCreateSchema.parse(req.body);

    const slug = input.slug || slugify(input.title);
    if (!slug) throw new BadRequestError('Nie można wygenerować sluga.');

    const payload = { ...input, slug };

    const { data, error } = await supabaseAdmin
      .from('realizations')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError(`Realizacja o slug "${slug}" już istnieje.`);
      throw new BadRequestError(error.message);
    }

    // Best-effort rebuild strony statycznej.
    triggerRevalidate(`realization-create:${slug}`).catch(() => undefined);

    res.status(201).json(data);
  }),
);

/* ───────── PUT /api/realizations/:id  (auth) ───────── */

r.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? '');
    const input = RealizationUpdateSchema.parse(req.body);
    if (Object.keys(input).length === 0) throw new BadRequestError('Brak pól do aktualizacji.');

    if (input.title && !input.slug) input.slug = slugify(input.title);
    if (input.slug) input.slug = slugify(input.slug);

    const { data, error } = await supabaseAdmin
      .from('realizations')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError(`Konflikt slug.`);
      if (error.code === 'PGRST116') throw new NotFoundError('Realizacja nie istnieje.');
      throw new BadRequestError(error.message);
    }

    triggerRevalidate(`realization-update:${data.slug}`).catch(() => undefined);
    res.json(data);
  }),
);

/* ───────── DELETE /api/realizations/:id  (auth) ───────── */

r.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? '');

    // Pobierz, żeby usunąć powiązane pliki w Storage.
    const { data: row } = await supabaseAdmin
      .from('realizations')
      .select('cover, gallery, cover_url, slug')
      .eq('id', id)
      .maybeSingle();

    if (!row) throw new NotFoundError('Realizacja nie istnieje.');

    const galleryArr = Array.isArray(row.gallery) ? (row.gallery as ProcessedImage[]) : [];
    const paths = collectImagePaths(row.cover as ProcessedImage | null, ...galleryArr);
    // Stary, "płaski" cover_url też usuń, jeśli to nasz bucket.
    if (row.cover_url) paths.push(row.cover_url);

    const { error } = await supabaseAdmin.from('realizations').delete().eq('id', id);
    if (error) throw new BadRequestError(error.message);

    // Best-effort, niezależnie od wyniku DELETE w bazie.
    if (paths.length) await deleteImagePaths(paths);

    triggerRevalidate(`realization-delete:${row.slug}`).catch(() => undefined);
    res.json({ ok: true });
  }),
);

export default r;
