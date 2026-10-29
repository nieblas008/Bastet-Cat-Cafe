import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Cliente con la llave de servicio. Se salta RLS: úsalo SOLO en el servidor
 * y solo después de comprobar que quien lo pide es admin (invitar al equipo).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("Falta SUPABASE_SECRET_KEY en las variables de entorno.");
  }
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
