import cors, { type CorsOptions } from 'cors';
import { env } from '../env.js';
import { logger } from '../logger.js';

const allowed = new Set(env.ALLOWED_ORIGINS);
const wildcard = allowed.has('*');

if (wildcard) {
  logger.warn('⚠️  CORS: ALLOWED_ORIGINS zawiera "*" — w produkcji ogranicz do konkretnych domen.');
}

export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Brak origin (np. healthcheck, curl, server-to-server) → pozwól.
    if (!origin) return cb(null, true);
    if (wildcard || allowed.has(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} jest poza listą dozwolonych.`));
  },
  credentials: true,
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
};

export const corsMw = cors(corsOptions);
