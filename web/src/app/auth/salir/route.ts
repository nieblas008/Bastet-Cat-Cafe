import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const to = new URL(request.url).searchParams.get("a") === "padrino" ? "/padrino/entrar" : "/panel/entrar";
  return NextResponse.redirect(new URL(to, request.url), { status: 303 });
}
