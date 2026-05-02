import pino from 'pino';
import { env, isDev } from './env.js';

/**
 * Strukturalny logger Pino.
 * - W developmencie: pretty-print przez pino-pretty.
 * - W produkcji: czysty JSON (Render zbiera logi z stdout).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'g-lab-backend' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.SUPABASE_SERVICE_ROLE_KEY',
    ],
    censor: '[REDACTED]',
  },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', singleLine: false },
        },
      }
    : {}),
});

export type Logger = typeof logger;
