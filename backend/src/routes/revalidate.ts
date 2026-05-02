/**
 * POST /api/revalidate
 *
 * Cienki webhook do triggera rebuildu strony statycznej (Netlify/Vercel build hook).
 * Wywoływany przez panel admina po CRUD na realizacjach (Server Action).
 * Endpointy `/api/realizations*` triggerują revalidate same z siebie - ten endpoint
 * istnieje, żeby panel mógł też ręcznie wymusić rebuild (np. po imporcie CSV katalogu,
 * gdzie panel pisze do Supabase z pominięciem backendu).
 *
 * Auth: nagłówek `x-revalidate-secret` musi być równy `REVALIDATE_SECRET` (env).
 *       Bez ustawionego sekretu endpoint zwraca 503, żeby uniknąć przypadkowego
 *       wystawiania publicznego triggera.
 */
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
import { ForbiddenError, ServiceUnavailableError, BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { triggerRevalidate } from '../services/revalidate.js';

const router = Router();

const Body = z.object({
  type: z.enum(['realization', 'catalog', 'manual']).default('manual'),
  slug: z.string().max(200).optional(),
  reason: z.string().max(200).optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!env.REVALIDATE_SECRET) {
      throw new ServiceUnavailableError('Revalidate webhook nie jest skonfigurowany (REVALIDATE_SECRET).');
    }
    const got = req.header('x-revalidate-secret');
    if (got !== env.REVALIDATE_SECRET) {
      throw new ForbiddenError('Nieprawidłowy sekret revalidate.');
    }
    const parsed = Body.safeParse(req.body ?? {});
    if (!parsed.success) throw new BadRequestError('Nieprawidłowe ciało żądania.', parsed.error.flatten());

    const reason = parsed.data.reason ?? `${parsed.data.type}:${parsed.data.slug ?? '*'}`;
    const out = await triggerRevalidate(reason);
    res.json(out);
  }),
);

export default router;
