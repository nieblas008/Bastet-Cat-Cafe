import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, hasSupabase } from "./env";

/**
 * Cliente anónimo, sin cookies, para leer el contenido público.
 * Así las páginas públicas se pueden cachear (ISR) y refrescar desde el panel.
 */
export function createPublicClient() {
  if (!hasSupabase) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
