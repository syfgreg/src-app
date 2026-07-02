import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Cloud mode is active when both Supabase env vars are present. Otherwise the
 * app runs local-only (IndexedDB, hand-rolled auth) so development and offline
 * demos work with no backend.
 */
export const cloudEnabled = !!(url && anon);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
