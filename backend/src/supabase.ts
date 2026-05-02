import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Klient z prawami "service_role" — używany po stronie serwera do operacji
 * administracyjnych (omija RLS). NIGDY nie eksponujemy tego klucza klientowi.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'g-lab-backend/1.0' } },
  },
);

/**
 * Tworzy klienta z anon key + nadanym tokenem JWT konkretnego użytkownika.
 * Wszystkie zapytania będą wykonane jako ten użytkownik (RLS aktywny).
 *
 * Używamy w endpointach piszących dane przez auth — żeby skorzystać z polityk
 * RLS i nie polegać tylko na walidacji backendu.
 */
export function supabaseAsUser(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Bucket name dla obrazów (Storage). */
export const BUCKET = env.SUPABASE_BUCKET;
