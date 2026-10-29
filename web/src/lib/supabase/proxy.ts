import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, hasSupabase } from "./env";

const PUBLIC_AUTH_PATHS = ["/panel/entrar", "/padrino/entrar", "/padrino/registro", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabase) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // No pongas código entre createServerClient y getClaims (recomendación de Supabase).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const path = request.nextUrl.pathname;
  const isAuthPage = PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));
  const needsLogin = (path.startsWith("/panel") || path.startsWith("/padrino")) && !isAuthPage;

  if (!user && needsLogin) {
    const url = request.nextUrl.clone();
    url.pathname = path.startsWith("/panel") ? "/panel/entrar" : "/padrino/entrar";
    url.search = "";
    url.searchParams.set("siguiente", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
