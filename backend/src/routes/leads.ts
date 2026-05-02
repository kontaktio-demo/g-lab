/**
 * Skrzynka zapytań z formularzy publicznych (wycena, kontakt) +
 * panel zarządzania zapytaniami dla warsztatu.
 *
 * Public:
 *   POST /api/leads         — formularz wysyła zapytanie (rate-limit + honeypot)
 *
 * Admin (auth):
 *   GET    /api/leads           — lista (filtr: status, source, q)
 *   GET    /api/leads/export    — CSV download (księgowość / archiwizacja)
 *   PATCH  /api/leads/:id       — zmiana statusu (new/in_progress/done/spam)
 *   DELETE /api/leads/:id       — usuwanie
 *   POST   /api/leads/bulk      — bulk-akcje (mark-spam / delete / status=...)
 */
import { router, asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { leadsLimiter } from '../middleware/rateLimit.js';
import { supabaseAdmin } from '../supabase.js';
import {
  LeadCreateSchema,
  LeadUpdateSchema,
  LeadListQuerySchema,
  LeadStatusEnum,
} from '../schemas/index.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { sendLeadNotification } from '../services/mailer.js';
import { logger } from '../logger.js';
import { z } from 'zod';

const r = router();

/* ───── POST /api/leads (publiczne) ───── */
r.post(
  '/',
  leadsLimiter,
  asyncHandler(async (req, res) => {
    const input = LeadCreateSchema.parse(req.body);

    // Honeypot: pole "website" w formularzu jest ukryte; jeśli wypełnione → bot.
    const isSpam = Boolean((req.body as { website?: string })?.website);

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;

    const row = {
      source: input.source,
      name: input.name || null,
      email: input.email || null,
      phone: input.phone || null,
      message: input.message || null,
      payload: input.payload ?? {},
      user_agent: req.header('user-agent') ?? null,
      ip,
      status: isSpam ? 'spam' : 'new',
    };

    const { data, error } = await supabaseAdmin.from('leads').insert(row).select('*').single();
    if (error) throw new BadRequestError(error.message);

    if (!isSpam) {
      // Fire-and-forget — nie blokujemy odpowiedzi do klienta.
      sendLeadNotification({
        source: data.source,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        payload: data.payload,
      }).catch((e) => logger.warn({ err: e?.message }, 'leads: mailer failed'));
    }

    res.status(201).json({ ok: true, id: data.id });
  }),
);

/* ───── GET /api/leads (auth) ───── */
r.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = LeadListQuerySchema.parse(req.query);

    let query = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(q.offset, q.offset + q.limit - 1);

    if (q.status) query = query.eq('status', q.status);
    if (q.source) query = query.eq('source', q.source);
    if (q.q) {
      const needle = `%${q.q.replace(/%/g, '')}%`;
      query = query.or(
        `name.ilike.${needle},email.ilike.${needle},phone.ilike.${needle},message.ilike.${needle}`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw new BadRequestError(error.message);
    res.json({ items: data ?? [], total: count ?? 0, limit: q.limit, offset: q.offset });
  }),
);

/* ───── GET /api/leads/export.csv (auth) ───── */
r.get(
  '/export.csv',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id,source,status,name,email,phone,message,created_at')
      .order('created_at', { ascending: false })
      .limit(10_000);
    if (error) throw new BadRequestError(error.message);

    const esc = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return /[",;]/.test(s) ? `"${s}"` : s;
    };
    const header = ['id', 'source', 'status', 'name', 'email', 'phone', 'message', 'created_at'];
    const lines = [header.join(',')];
    for (const row of data ?? []) {
      lines.push(header.map((h) => esc((row as Record<string, unknown>)[h])).join(','));
    }
    const csv = '\uFEFF' + lines.join('\n'); // BOM dla Excela
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="g-lab-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }),
);

/* ───── PATCH /api/leads/:id (auth) ───── */
r.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? '');
    const input = LeadUpdateSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status: input.status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError('Zapytanie nie istnieje.');
      throw new BadRequestError(error.message);
    }
    res.json(data);
  }),
);

/* ───── DELETE /api/leads/:id (auth) ───── */
r.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? '');
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
    if (error) throw new BadRequestError(error.message);
    res.json({ ok: true });
  }),
);

/* ───── POST /api/leads/bulk (auth) — bulk akcje ───── */
const BulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['delete', 'set-status']),
  status: LeadStatusEnum.optional(),
});

r.post(
  '/bulk',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = BulkSchema.parse(req.body);

    if (body.action === 'delete') {
      const { error } = await supabaseAdmin.from('leads').delete().in('id', body.ids);
      if (error) throw new BadRequestError(error.message);
      res.json({ ok: true, affected: body.ids.length });
      return;
    }

    if (body.action === 'set-status') {
      if (!body.status) throw new BadRequestError('Brak statusu dla set-status.');
      const { error } = await supabaseAdmin
        .from('leads')
        .update({ status: body.status })
        .in('id', body.ids);
      if (error) throw new BadRequestError(error.message);
      res.json({ ok: true, affected: body.ids.length });
      return;
    }

    throw new BadRequestError('Nieznana akcja.');
  }),
);

export default r;
