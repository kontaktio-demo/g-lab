import { z } from 'zod';
import { slugify } from '../utils/slugify.js';

/* ───────────────── shared ───────────────── */

export const ImageVariantSchema = z.object({
  format: z.enum(['avif', 'webp', 'jpeg']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  size: z.number().int().nonnegative(),
  url: z.string().url(),
  path: z.string().min(1),
});

export const ProcessedImageSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  size: z.number().int().nonnegative(),
  mime: z.string().min(1),
  alt: z.string().default(''),
  lqip: z.string().default(''),
  blurhash: z.string().default(''),
  variants: z.array(ImageVariantSchema).default([]),
});

/* ───────────────── realizations ───────────────── */

export const UslugaEnum = z.enum(['chiptuning', 'dpf-egr', 'hamownia', 'inne']);

const intOrNull = z
  .union([z.number().int(), z.string()])
  .nullable()
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  });

export const RealizationCreateSchema = z.object({
  title: z.string().trim().min(1, 'Tytuł jest wymagany.').max(200),
  slug: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? slugify(v) : '')),
  samochod: z.string().trim().max(160).optional().default(''),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format daty: YYYY-MM-DD')
    .optional()
    .default(() => new Date().toISOString().slice(0, 10)),
  krotki_opis: z.string().trim().max(280).optional().default(''),
  body: z.string().optional().default(''),

  marka: z.string().trim().max(80).optional().default(''),
  usluga: UslugaEnum.optional().default('chiptuning'),
  stage: z.string().trim().max(40).optional().default(''),
  silnik: z.string().trim().max(80).optional().default(''),
  sterownik: z.string().trim().max(80).optional().default(''),

  km0: intOrNull,
  km1: intOrNull,
  nm0: intOrNull,
  nm1: intOrNull,

  narzedzia: z.array(z.string().trim().max(80)).max(50).optional().default([]),

  cover: ProcessedImageSchema.nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  gallery: z.array(ProcessedImageSchema).max(50).optional().default([]),

  published: z.boolean().optional().default(true),
});
export type RealizationCreateInput = z.infer<typeof RealizationCreateSchema>;

// Update — wszystko opcjonalne (PATCH-like, ale używamy PUT z partial body).
export const RealizationUpdateSchema = RealizationCreateSchema.partial();
export type RealizationUpdateInput = z.infer<typeof RealizationUpdateSchema>;

export const RealizationListQuerySchema = z.object({
  marka: z.string().trim().optional(),
  usluga: UslugaEnum.optional(),
  rok: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  /** include drafts (auth required) */
  include_drafts: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional()
    .transform((v) => v === '1' || v === 'true'),
});

/* ───────────────── leads ───────────────── */

export const LeadCreateSchema = z.object({
  source: z.enum(['wycena', 'kontakt', 'api']).default('kontakt'),
  name: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().email().max(160).optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().max(5000).optional().default(''),
  payload: z.record(z.unknown()).optional().default({}),
  // honeypot — jeśli wypełnione, traktujemy jako spam
  website: z.string().max(0).optional().or(z.string().transform(() => undefined)),
});
export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

export const LeadStatusEnum = z.enum(['new', 'in_progress', 'done', 'spam']);

export const LeadUpdateSchema = z.object({
  status: LeadStatusEnum,
});

export const LeadListQuerySchema = z.object({
  status: LeadStatusEnum.optional(),
  source: z.enum(['wycena', 'kontakt', 'api']).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/* ───────────────── auth ───────────────── */

export const LoginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(6).max(200),
});

/* ───────────────── catalog ───────────────── */

export const CatalogQuerySchema = z.object({
  marka: z.string().trim().optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CatalogCarSchema = z.object({
  marka: z.string().trim().min(1),
  model: z.string().trim().optional().default(''),
  generacja: z.string().trim().optional().default(''),
  rok_od: z.string().trim().optional().default(''),
  rok_do: z.string().trim().optional().default(''),
  silnik: z.string().trim().min(1),
  moc_kw_seryjna: intOrNull,
  moc_km_seryjna: intOrNull,
  moc_kw_tuning: intOrNull,
  moc_km_tuning: intOrNull,
  moment_seryjny: intOrNull,
  moment_tuning: intOrNull,
  sterownik: z.string().trim().optional().default(''),
  slug: z.string().trim().optional().default(''),
});

export const CatalogImportSchema = z.object({
  mode: z.enum(['replace', 'upsert']).default('upsert'),
  rows: z.array(CatalogCarSchema).min(1).max(10_000),
});

/* ───────────────── upload ───────────────── */

export const UploadQuerySchema = z.object({
  folder: z
    .enum(['cover', 'gallery', 'misc'])
    .optional()
    .default('gallery'),
  alt: z.string().trim().max(200).optional().default(''),
});
