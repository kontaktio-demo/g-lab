import { router, asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';

const r = router();

/**
 * Statystyki dla pulpitu admina:
 *  - liczba realizacji (opublikowane / szkice)
 *  - liczba aut w katalogu
 *  - leady: total, new, this_week
 *  - ostatnia zmiana realizacji
 */
r.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [pub, drafts, catalog, leadsAll, leadsNew, leadsWeek, latestReal] = await Promise.all([
      supabaseAdmin
        .from('realizations')
        .select('id', { head: true, count: 'exact' })
        .eq('published', true),
      supabaseAdmin
        .from('realizations')
        .select('id', { head: true, count: 'exact' })
        .eq('published', false),
      supabaseAdmin.from('catalog_cars').select('id', { head: true, count: 'exact' }),
      supabaseAdmin.from('leads').select('id', { head: true, count: 'exact' }),
      supabaseAdmin
        .from('leads')
        .select('id', { head: true, count: 'exact' })
        .eq('status', 'new'),
      supabaseAdmin
        .from('leads')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', weekAgo),
      supabaseAdmin
        .from('realizations')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    res.json({
      realizations: {
        published: pub.count ?? 0,
        drafts: drafts.count ?? 0,
        last_updated: latestReal.data?.updated_at ?? null,
      },
      catalog: { total: catalog.count ?? 0 },
      leads: {
        total: leadsAll.count ?? 0,
        new: leadsNew.count ?? 0,
        this_week: leadsWeek.count ?? 0,
      },
    });
  }),
);

export default r;
