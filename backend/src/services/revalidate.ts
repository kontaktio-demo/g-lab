/**
 * Trigger rebuildu strony statycznej (Netlify / Vercel build hook).
 *
 * Wywoływane po każdym CRUD na realizacjach, żeby publiczna strona
 * dostała świeże dane (mimo że i tak fetchuje runtime z backendu —
 * to działa jako "second line of defense" dla SEO i first-paint).
 */
import { env, revalidateEnabled } from '../env.js';
import { logger } from '../logger.js';

let lastTrigger = 0;
const COOLDOWN_MS = 30_000; // nie spamuj webhooka — 30s odstępu

export async function triggerRevalidate(reason: string): Promise<{ triggered: boolean; reason?: string }> {
  if (!revalidateEnabled) return { triggered: false, reason: 'REVALIDATE_HOOK_URL nie ustawiony.' };

  const now = Date.now();
  if (now - lastTrigger < COOLDOWN_MS) {
    return { triggered: false, reason: 'cooldown' };
  }
  lastTrigger = now;

  try {
    const res = await fetch(env.REVALIDATE_HOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason, ts: now }),
    });
    const ok = res.ok;
    logger[ok ? 'info' : 'warn']({ reason, status: res.status }, 'revalidate: webhook called');
    return { triggered: ok };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'revalidate: webhook failed');
    return { triggered: false, reason: (err as Error).message };
  }
}
