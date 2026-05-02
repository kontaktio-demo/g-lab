import { router, asyncHandler } from '../utils/asyncHandler.js';
import { supabaseAdmin } from '../supabase.js';

const r = router();

/**
 * Liveness — proces żyje.
 */
r.get('/', (_req, res) => {
  res.json({ ok: true, service: 'g-lab-backend', time: new Date().toISOString() });
});

/**
 * Readiness — sprawdzamy też connection do Supabase (ping na public_realizations).
 * Render może to ciagać co 30s; trzymamy więc bardzo lekko.
 */
r.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    const t0 = Date.now();
    const { error } = await supabaseAdmin
      .from('realizations')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    const ms = Date.now() - t0;
    if (error) {
      res.status(503).json({ ok: false, db: false, error: error.message, ms });
      return;
    }
    res.json({ ok: true, db: true, ms });
  }),
);

export default r;
