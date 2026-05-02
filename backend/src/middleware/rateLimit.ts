import rateLimit from 'express-rate-limit';
import { env } from '../env.js';

/**
 * Globalny rate limit (ochrona przed abusem). Liczone per IP.
 * Render kładzie X-Forwarded-For — `app.set('trust proxy', 1)` w server.ts.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Zbyt wiele żądań — spróbuj za chwilę.' } },
});

/**
 * Bardzo restrykcyjny limit dla endpointu wysyłającego leady,
 * żeby nie zabili nas spamem.
 */
export const leadsLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LEADS_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Wysłałeś już kilka zapytań — odczekaj chwilę.' } },
});
