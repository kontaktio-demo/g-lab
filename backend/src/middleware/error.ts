import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { AppError } from '../utils/errors.js';
import { logger } from '../logger.js';
import { isProd } from '../env.js';

/**
 * Centralny error handler. Mapuje znane wyjątki na czyste odpowiedzi JSON.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // 1) AppError - znamy strukturę.
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      requestId: req.id,
    });
    return;
  }

  // 2) Zod (walidacja) → 400 + ładny payload.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dane wejściowe są niepoprawne.',
        details: err.flatten(),
      },
      requestId: req.id,
    });
    return;
  }

  // 3) Multer (upload) — limity rozmiaru, zła liczba plików etc.
  if (err instanceof MulterError) {
    const map: Record<string, number> = {
      LIMIT_FILE_SIZE: 413,
      LIMIT_UNEXPECTED_FILE: 400,
      LIMIT_FILE_COUNT: 400,
      LIMIT_FIELD_KEY: 400,
      LIMIT_FIELD_VALUE: 400,
      LIMIT_FIELD_COUNT: 400,
      LIMIT_PART_COUNT: 400,
    };
    res.status(map[err.code] ?? 400).json({
      error: { code: err.code, message: err.message },
      requestId: req.id,
    });
    return;
  }

  // 4) CORS rejection (rzucany jako Error z naszego middleware)
  if (err instanceof Error && err.message.startsWith('CORS:')) {
    res.status(403).json({
      error: { code: 'CORS_FORBIDDEN', message: err.message },
      requestId: req.id,
    });
    return;
  }

  // 5) Fallback — log + 500.
  const e = err as Error;
  logger.error(
    { err: { message: e?.message, stack: e?.stack }, requestId: req.id, path: req.path },
    'Nieobsłużony błąd serwera',
  );
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Wystąpił błąd serwera.' : (e?.message ?? 'Wystąpił błąd serwera.'),
    },
    requestId: req.id,
  });
}

/** 404 dla nieznanych ścieżek — montowane na końcu, przed errorHandler. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Endpoint ${req.method} ${req.originalUrl} nie istnieje.` },
    requestId: req.id,
  });
}
