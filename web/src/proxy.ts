import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Solo las zonas con sesión. El sitio público no pasa por aquí y se puede cachear.
  matcher: ["/panel/:path*", "/padrino/:path*", "/auth/:path*", "/cuenta/:path*"],
};
