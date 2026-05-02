/**
 * G-Lab image pipeline — sharp → AVIF + WebP + JPEG fallback (×3 szerokości)
 * + LQIP base64 do blur-up + blurhash. Wszystkie warianty trafiają do Supabase Storage.
 *
 * Wejście:  Buffer (oryginalny plik z Multera)
 * Wyjście:  obiekt opisujący obraz (zapisywany w polach `cover` / `gallery` w bazie)
 *
 * Architektura jest sekwencyjna w obrębie jednego obrazu (sharp jest CPU-bound,
 * a Render Free Tier ma 1 vCPU — równoległe transformacje robią więcej szkody niż pożytku),
 * ale formaty (AVIF/WebP/JPEG) na danej szerokości są generowane równolegle.
 */
import sharp, { type Metadata } from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { encode as encodeBlurhash } from 'blurhash';
import { nanoid } from 'nanoid';
import { env } from '../env.js';
import { supabaseAdmin, BUCKET } from '../supabase.js';
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  AppError,
} from '../utils/errors.js';
import { logger } from '../logger.js';

/* ────────── typy ────────── */

export type ImageFormat = 'avif' | 'webp' | 'jpeg';

export interface ImageVariant {
  format: ImageFormat;
  width: number;
  height: number;
  size: number;
  url: string;
  path: string;
}

export interface ProcessedImage {
  /** kanoniczny URL fallback (JPEG, środkowa szerokość) — używany w starym `<img>` */
  url: string;
  path: string;
  /** wymiary oryginału (po auto-rotate, przed resize) */
  width: number;
  height: number;
  /** rozmiar oryginału w bajtach */
  size: number;
  /** Mime oryginału */
  mime: string;
  /** alt-text (przekazany lub pusty) */
  alt: string;
  /** mały data-URL placeholdera (LQIP) — ~6-12kB */
  lqip: string;
  /** blurhash (~30 znaków) — alternatywa LQIP, lepsza dla blur-up */
  blurhash: string;
  /** wszystkie wersje (3 szerokości × 3 formaty = 9 wpisów) */
  variants: ImageVariant[];
}

/* ────────── walidacja wejścia ────────── */

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/gif',
]);

/**
 * Waliduje, że bufor faktycznie jest obrazem znanego typu (po magic bytes,
 * a nie tylko po nagłówku Content-Type, którym łatwo skłamać).
 */
export async function validateImageBuffer(buf: Buffer): Promise<{ mime: string }> {
  if (!buf || buf.length === 0) {
    throw new UnsupportedMediaTypeError('Pusty plik.');
  }
  if (buf.length > env.MAX_UPLOAD_BYTES) {
    throw new PayloadTooLargeError(
      `Plik za duży (${buf.length} B), limit ${env.MAX_UPLOAD_BYTES} B.`,
    );
  }
  const ft = await fileTypeFromBuffer(buf);
  if (!ft || !ACCEPTED_MIME.has(ft.mime)) {
    throw new UnsupportedMediaTypeError(
      `Nieobsługiwany format pliku${ft ? ` (${ft.mime})` : ''}. Akceptujemy: JPEG, PNG, WebP, AVIF, HEIC, TIFF, GIF.`,
    );
  }
  return { mime: ft.mime };
}

/* ────────── core: konwersja jednego rozmiaru w trzech formatach ────────── */

async function encodeOne(
  base: sharp.Sharp,
  format: ImageFormat,
  width: number,
): Promise<{ buffer: Buffer; height: number }> {
  // sharp jest immutable per-pipeline → klonujemy.
  let pipeline = base.clone().resize({ width, withoutEnlargement: true });
  switch (format) {
    case 'avif':
      pipeline = pipeline.avif({ quality: env.AVIF_QUALITY, effort: 4 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: env.WEBP_QUALITY, effort: 4 });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality: env.JPEG_QUALITY,
        mozjpeg: true,
        progressive: true,
      });
      break;
  }
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, height: info.height };
}

/* ────────── LQIP + blurhash ────────── */

async function makeLqip(base: sharp.Sharp): Promise<string> {
  // 24px szerokości, JPEG q 40 → kilka kB w base64
  const buf = await base.clone().resize({ width: 24 }).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function makeBlurhash(base: sharp.Sharp): Promise<string> {
  const { data, info } = await base
    .clone()
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });
  return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
}

/* ────────── Storage upload ────────── */

async function uploadToStorage(opts: {
  path: string;
  contentType: string;
  body: Buffer;
}): Promise<string> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(opts.path, opts.body, {
    contentType: opts.contentType,
    cacheControl: '31536000', // 1 rok — ścieżki są unikalne, więc cache na maksa
    upsert: false,
  });
  if (error) {
    throw new AppError(500, 'STORAGE_UPLOAD_FAILED', `Nie udało się wgrać ${opts.path}: ${error.message}`);
  }
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(opts.path);
  return data.publicUrl;
}

const EXT_OF: Record<ImageFormat, string> = { avif: 'avif', webp: 'webp', jpeg: 'jpg' };
const MIME_OF: Record<ImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

/* ────────── główna funkcja ────────── */

export interface ProcessImageOptions {
  /** np. 'cover' albo 'gallery' — używane jako prefiks ścieżki w Storage */
  folder?: string;
  /** opcjonalny alt-text */
  alt?: string;
  /** Użytkownik wgrywający (do logu) */
  uploaderId?: string;
}

export async function processImage(
  input: Buffer,
  opts: ProcessImageOptions = {},
): Promise<ProcessedImage> {
  const t0 = Date.now();
  const { mime } = await validateImageBuffer(input);

  // Auto-rotate na podstawie EXIF + strip metadanych (privacy + size).
  const base = sharp(input, { failOn: 'error' }).rotate();

  let meta: Metadata;
  try {
    meta = await base.metadata();
  } catch (e) {
    throw new UnsupportedMediaTypeError(`Nie udało się odczytać obrazu: ${(e as Error).message}`);
  }
  const origW = meta.width ?? 0;
  const origH = meta.height ?? 0;
  if (!origW || !origH) {
    throw new UnsupportedMediaTypeError('Obraz nie zawiera wymiarów (uszkodzony plik?).');
  }

  // Foldery i unikalna nazwa bazowa.
  const folder = (opts.folder || 'gallery').replace(/[^a-zA-Z0-9/_-]/g, '');
  const stamp = Date.now();
  const id = nanoid(8);
  const baseName = `${folder}/${stamp}-${id}`;

  // 1) LQIP + blurhash (z oryginalnego, jeszcze niezredukowanego pipeline'u).
  const [lqip, blurhash] = await Promise.all([makeLqip(base), makeBlurhash(base)]);

  // 2) Warianty: dla każdej szerokości × 3 formaty.
  // Foreach width → uruchom 3 enkodowania równolegle, ale szerokości po kolei (CPU-bound).
  const formats: ImageFormat[] = ['avif', 'webp', 'jpeg'];
  // Zod gwarantuje min 1 element w env.IMAGE_WIDTHS, ale walidujemy defensywnie.
  const baseWidths = env.IMAGE_WIDTHS.length > 0 ? env.IMAGE_WIDTHS : [1280];
  const widths = baseWidths.filter((w) => w <= Math.max(origW, 1));
  if (widths.length === 0) widths.push(Math.min(origW, baseWidths[0] ?? 1280));

  const variants: ImageVariant[] = [];
  for (const w of widths) {
    const encoded = await Promise.all(formats.map((f) => encodeOne(base, f, w)));
    // Upload wariantów dla tej szerokości równolegle.
    const uploaded = await Promise.all(
      encoded.map(async ({ buffer, height }, i) => {
        const format = formats[i]!;
        const path = `${baseName}-${w}.${EXT_OF[format]}`;
        const url = await uploadToStorage({ path, contentType: MIME_OF[format], body: buffer });
        return { format, width: w, height, size: buffer.length, url, path };
      }),
    );
    variants.push(...uploaded);
  }

  // 3) Kanoniczny URL = JPEG na środkowej szerokości (najlepsze fallback dla starych przeglądarek).
  const middleW = widths[Math.floor(widths.length / 2)]!;
  const canonical =
    variants.find((v) => v.format === 'jpeg' && v.width === middleW) ??
    variants.find((v) => v.format === 'jpeg') ??
    variants[0]!;

  const result: ProcessedImage = {
    url: canonical.url,
    path: canonical.path,
    width: origW,
    height: origH,
    size: input.length,
    mime,
    alt: (opts.alt ?? '').trim(),
    lqip,
    blurhash,
    variants,
  };

  logger.info(
    {
      uploaderId: opts.uploaderId,
      mime,
      origW,
      origH,
      bytesIn: input.length,
      variants: variants.length,
      bytesOut: variants.reduce((a, v) => a + v.size, 0),
      ms: Date.now() - t0,
    },
    'image: processed',
  );

  return result;
}

/**
 * Usuwa wszystkie warianty + ewentualnie LQIP z Supabase Storage.
 * `paths` mogą być pełnymi URL-ami albo same ścieżkami w buckecie.
 */
export async function deleteImagePaths(pathsOrUrls: string[]): Promise<{ removed: number }> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const paths = pathsOrUrls
    .map((p) => {
      if (!p) return null;
      const i = p.indexOf(marker);
      return i >= 0 ? p.slice(i + marker.length) : p.startsWith('/') ? p.slice(1) : p;
    })
    .filter((x): x is string => Boolean(x));

  if (paths.length === 0) return { removed: 0 };

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
  if (error) {
    logger.warn({ err: error.message, paths }, 'image: storage remove partial failure');
  }
  return { removed: paths.length };
}
