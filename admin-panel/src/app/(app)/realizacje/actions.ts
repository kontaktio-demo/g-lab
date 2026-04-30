'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { GalleryItem } from '@/lib/types';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'realizacje';

export type RealizationFormState = { error?: string; ok?: boolean } | null;

function readGallery(formData: FormData): GalleryItem[] {
  const raw = formData.get('gallery_json');
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((g): g is GalleryItem => g && typeof g.url === 'string')
      .map((g) => ({ url: g.url, alt: typeof g.alt === 'string' ? g.alt : '' }));
  } catch {
    return [];
  }
}

function buildPayload(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) throw new Error('Tytuł jest wymagany.');

  const slugInput = String(formData.get('slug') ?? '').trim();
  const slug = slugify(slugInput || title);
  if (!slug) throw new Error('Slug jest wymagany.');

  const data = String(formData.get('data') ?? '').trim() || new Date().toISOString().slice(0, 10);

  return {
    title,
    slug,
    samochod:    String(formData.get('samochod')    ?? '').trim(),
    data,
    krotki_opis: String(formData.get('krotki_opis') ?? '').trim(),
    body:        String(formData.get('body')        ?? ''),
    cover_url:   String(formData.get('cover_url')   ?? '').trim() || null,
    gallery:     readGallery(formData),
    published:   formData.get('published') === 'on' || formData.get('published') === 'true',
  };
}

export async function createRealization(_prev: RealizationFormState, formData: FormData): Promise<RealizationFormState> {
  const supabase = await createClient();
  let payload;
  try { payload = buildPayload(formData); }
  catch (e) { return { error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('realizations')
    .insert(payload)
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/realizacje');
  revalidatePath('/');
  redirect(`/realizacje/${data.id}/edit?saved=1`);
}

export async function updateRealization(id: string, _prev: RealizationFormState, formData: FormData): Promise<RealizationFormState> {
  const supabase = await createClient();
  let payload;
  try { payload = buildPayload(formData); }
  catch (e) { return { error: (e as Error).message }; }

  const { error } = await supabase.from('realizations').update(payload).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/realizacje');
  revalidatePath(`/realizacje/${id}/edit`);
  revalidatePath('/');
  return { ok: true };
}

export async function deleteRealization(id: string): Promise<void> {
  const supabase = await createClient();

  // Pobierz pliki, by usunąć z Storage
  const { data: row } = await supabase
    .from('realizations')
    .select('cover_url, gallery')
    .eq('id', id)
    .single();

  const paths: string[] = [];
  const extract = (url?: string | null) => {
    if (!url) return;
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx >= 0) paths.push(url.slice(idx + marker.length));
  };
  extract(row?.cover_url);
  if (Array.isArray(row?.gallery)) {
    for (const g of row!.gallery as GalleryItem[]) extract(g?.url);
  }
  if (paths.length) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from('realizations').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/realizacje');
  revalidatePath('/');
  redirect('/realizacje?deleted=1');
}
