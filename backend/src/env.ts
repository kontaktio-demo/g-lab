/**
 * Walidacja i typowanie zmiennych środowiskowych.
 *
 * Importuj `env` zamiast `process.env` — dzięki temu literówki w nazwach
 * zostaną wykryte już na etapie kompilacji TS, a brakujące wartości
 * spowodują wyraźny crash przy starcie procesu.
 */
import 'dotenv/config';
import { z } from 'zod';

const numeric = (def: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null || v === '' ? def : Number(v)))
    .pipe(z.number().int().nonnegative());

const csvList = (def: string[] = []) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v == null || v === '' ? def : v.split(',').map((s) => s.trim()).filter(Boolean),
    );

const widthsList = csvList(['480', '1280', '2400']).pipe(
  z.array(z.coerce.number().int().positive()).min(1).max(6),
);

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: numeric(4000),
  HOST: z.string().default('0.0.0.0'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_BUCKET: z.string().default('realizacje'),

  ALLOWED_ORIGINS: csvList(['http://localhost:8080', 'http://localhost:3000']),

  MAX_UPLOAD_BYTES: numeric(15 * 1024 * 1024),
  IMAGE_WIDTHS: widthsList,
  AVIF_QUALITY: numeric(50).pipe(z.number().int().min(1).max(100)),
  WEBP_QUALITY: numeric(80).pipe(z.number().int().min(1).max(100)),
  JPEG_QUALITY: numeric(82).pipe(z.number().int().min(1).max(100)),

  RATE_LIMIT_WINDOW_MS: numeric(60_000),
  RATE_LIMIT_MAX: numeric(120),
  LEADS_RATE_LIMIT_MAX: numeric(5),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: numeric(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),
  SMTP_TO: z.string().optional().default(''),

  REVALIDATE_SECRET: z.string().optional().default(''),
  REVALIDATE_HOOK_URL: z.string().optional().default(''),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Niepoprawna konfiguracja ENV:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export const smtpEnabled = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_FROM);
export const revalidateEnabled = Boolean(env.REVALIDATE_HOOK_URL);
