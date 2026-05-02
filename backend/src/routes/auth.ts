/**
 * Endpointy uwierzytelniania dla panelu admina.
 *
 * Panel może albo logować się bezpośrednio do Supabase Auth (tak ma teraz),
 * albo przez te endpointy backendu — tak czy siak rezultat to ten sam JWT,
 * który następnie wysyła w Authorization: Bearer dla operacji chronionych.
 *
 * Wersja przez backend bywa wygodniejsza, gdy chcemy:
 *  - audytować logowania w jednym miejscu
 *  - wymusić rate-limit
 *  - dodać 2FA/captche w przyszłości
 */
import { router, asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
import { LoginSchema } from '../schemas/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import rateLimit from 'express-rate-limit';
import { env } from '../env.js';
import { logger } from '../logger.js';

const r = router();

const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Za dużo prób logowania. Spróbuj za chwilę.' },
  },
});

r.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = LoginSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error || !data?.session) {
      logger.info({ email }, 'auth: login failed');
      throw new UnauthorizedError('Nieprawidłowy e-mail lub hasło.');
    }

    logger.info({ userId: data.user?.id, email }, 'auth: login ok');
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user: { id: data.user?.id, email: data.user?.email },
    });
  }),
);

r.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refresh_token = String((req.body as { refresh_token?: string })?.refresh_token ?? '');
    if (!refresh_token) throw new UnauthorizedError('Brak refresh_token.');
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error || !data?.session) throw new UnauthorizedError('Refresh token nieważny.');
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  }),
);

r.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.accessToken) {
      // Best-effort: globalny logout sesji.
      await supabaseAdmin.auth.admin.signOut(req.accessToken).catch(() => undefined);
    }
    res.json({ ok: true });
  }),
);

r.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

export default r;
