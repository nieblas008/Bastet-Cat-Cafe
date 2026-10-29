import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces que manda Supabase por correo:
// invitación al equipo, confirmación de cuenta y recuperar contraseña.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/panel";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/panel";

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) {
    const back = next.startsWith("/padrino") ? "/padrino/entrar" : "/panel/entrar";
    return NextResponse.redirect(`${origin}${back}?error=enlace`);
  }
  // Invitación o recuperación: primero que elija su contraseña
  const dest = type === "invite" || type === "recovery" ? `/cuenta/contrasena?next=${encodeURIComponent(next)}` : next;
  return NextResponse.redirect(`${origin}${dest}`);
}
