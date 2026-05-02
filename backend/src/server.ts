/**
 * G-Lab Backend — entry point.
 *
 * Stack: Express 4 (CommonJS-style import w ESM dzięki `esModuleInterop`),
 *        helmet, compression, CORS allowlist, pino-http (structured logs),
 *        zod (walidacja), rate-limit, multer + sharp (image pipeline),
 *        Supabase Auth (JWT) + service-role client.
 */
import express, { type Express } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import http from 'node:http';

import { env, isDev } from './env.js';
import { logger } from './logger.js';
import { corsMw } from './middleware/cors.js';
import { requestId } from './middleware/requestId.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { openapi } from './openapi.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import realizationsRoutes from './routes/realizations.js';
import catalogRoutes from './routes/catalog.js';
import leadsRoutes from './routes/leads.js';
import uploadsRoutes from './routes/uploads.js';
import statsRoutes from './routes/stats.js';
import revalidateRoutes from './routes/revalidate.js';

export function buildApp(): Express {
  const app = express();

  // Render / Vercel / Cloudflare są za reverse proxy — bez tego rate-limit liczy
  // wszystkich na jeden adres (proxy), a `req.ip` jest niepoprawny.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // ── Security & infra ──
  // CSP dopasowany do dwóch faktycznych konsumentów:
  //   - JSON API (większość ruchu) — tu CSP nie ma wpływu, bo to nie jest dokument HTML,
  //   - Swagger UI na /api/docs (HTML + bundled JS/CSS z swagger-ui-express).
  // Bez wykluczeń Swagger UI nie odpalał się (inline script + style), dlatego pozwalamy
  // na 'unsafe-inline' w skryptach/stylach TYLKO dla tego endpointu wewnątrz naszego origin.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // pliki z Supabase muszą być osadzane z innego origin
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          // Swagger UI ładuje runtime config inline
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );
  app.use(compression());
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as { id?: string }).id ?? 'unknown',
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(corsMw);

  // ── Body parsers ──
  // Limity celowo niskie — duże pliki idą przez multer w /api/uploads/*.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Rate-limit globalny ──
  app.use(globalLimiter);

  // ── Routes ──
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/realizations', realizationsRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/revalidate', revalidateRoutes);

  // OpenAPI — JSON spec + Swagger UI.
  app.get('/api/openapi.json', (_req, res) => res.json(openapi));
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapi as object, {
      customSiteTitle: 'G-Lab API · docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  // Root → szybki rozejrzeń info.
  app.get('/', (_req, res) => {
    res.json({
      service: 'g-lab-backend',
      docs: '/api/docs',
      health: '/health',
      env: env.NODE_ENV,
    });
  });

  // 404 + central error handler na samym końcu.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/* ───── start serwera (tylko gdy uruchamiamy bezpośrednio) ───── */

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = buildApp();
  const server = http.createServer(app);

  server.listen(env.PORT, env.HOST, () => {
    logger.info(
      { host: env.HOST, port: env.PORT, env: env.NODE_ENV },
      `🚀 G-Lab backend listening on http://${env.HOST}:${env.PORT}`,
    );
    if (isDev) {
      logger.info(`📚 Docs:   http://localhost:${env.PORT}/api/docs`);
      logger.info(`❤️  Health: http://localhost:${env.PORT}/health`);
    }
  });

  // Graceful shutdown — zamknij sesje TCP, zanim Render ubije proces.
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutdown: zamykanie serwera HTTP…');
    const t = setTimeout(() => {
      logger.warn('shutdown: timeout, force exit');
      process.exit(1);
    }, 10_000);
    server.close((err) => {
      clearTimeout(t);
      if (err) {
        logger.error({ err: err.message }, 'shutdown: błąd przy zamykaniu');
        process.exit(1);
      }
      logger.info('shutdown: zakończone czysto');
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, 'uncaughtException');
    process.exit(1);
  });
}
