import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "./auth";
import { createClient } from "./supabase/server";
import type { ActionState, Profile } from "./types";

type Ctx = { sb: Awaited<ReturnType<typeof createClient>>; profile: Profile };

/** Mensajes de error de Postgres traducidos a algo que el equipo entienda. */
export function friendlyError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err?.code === "23505") return "Ya existe uno con ese nombre o dirección web. Usa otro.";
  if (err?.code === "23503") return "No se puede borrar porque otra cosa depende de esto (por ejemplo, una categoría con platillos).";
  if (err?.code === "23514") return "Algún dato no es válido. Revisa los campos marcados.";
  if (err?.code === "42501") return "No tienes permiso para hacer esto.";
  if (err?.message?.includes("Solo una administradora")) return err.message;
  if (err?.message?.includes("No puedes quitarte")) return err.message;
  return "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";
}

/** Refresca el sitio público para que los cambios se vean al instante. */
export function refreshSite() {
  revalidatePath("/", "layout");
}

/**
 * Envuelve una acción del panel: comprueba la sesión, corre la acción y
 * convierte cualquier error en un mensaje para el formulario.
 */
export async function staffAction(
  fn: (ctx: Ctx) => Promise<string | void>,
  opts: { admin?: boolean; refresh?: boolean } = {},
): Promise<ActionState> {
  const profile = opts.admin ? await requireAdmin() : await requireStaff();
  const sb = await createClient();
  try {
    const msg = await fn({ sb, profile });
    if (opts.refresh !== false) refreshSite();
    return { ok: true, message: msg || "Guardado." };
  } catch (e) {
    if (isRedirect(e)) throw e;
    console.error(e);
    return { ok: false, message: e instanceof UserError ? e.message : friendlyError(e) };
  }
}

/** Error con un mensaje pensado para mostrarse tal cual. */
export class UserError extends Error {}

function isRedirect(e: unknown) {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

/** Lanza si Supabase regresó error. */
export function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

// ── Lectura de FormData ──
export const f = {
  str(fd: FormData, k: string, max = 5000) {
    const v = String(fd.get(k) ?? "").trim();
    return v ? v.slice(0, max) : null;
  },
  req(fd: FormData, k: string, label: string, max = 5000) {
    const v = f.str(fd, k, max);
    if (!v) throw new UserError(`Falta: ${label}.`);
    return v;
  },
  bool(fd: FormData, k: string) {
    const v = fd.get(k);
    return v === "on" || v === "true" || v === "1" || v === "si";
  },
  triBool(fd: FormData, k: string) {
    const v = fd.get(k);
    return v === "si" ? true : v === "no" ? false : null;
  },
  int(fd: FormData, k: string) {
    const v = String(fd.get(k) ?? "").trim();
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  },
  num(fd: FormData, k: string) {
    const v = String(fd.get(k) ?? "").trim().replace(/[$,\s]/g, "");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
  date(fd: FormData, k: string) {
    const v = String(fd.get(k) ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  },
  time(fd: FormData, k: string) {
    const v = String(fd.get(k) ?? "").trim();
    return /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : null;
  },
  /** "a, b, c" o una por línea → ["a","b","c"] */
  list(fd: FormData, k: string) {
    return String(fd.get(k) ?? "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);
  },
  all(fd: FormData, k: string) {
    return fd.getAll(k).map(String).filter(Boolean);
  },
};

/** datetime-local (hora de Tijuana) → ISO con zona. */
export function tijuanaLocalToISO(v: string | null) {
  if (!v) return null;
  // Calcula el desfase de Tijuana para esa fecha (PST/PDT)
  const guess = new Date(`${v}:00Z`);
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: "America/Tijuana", timeZoneName: "shortOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-8";
  const m = tzName.match(/GMT([+-]\d+)(?::(\d+))?/);
  const hours = m ? Number(m[1]) : -8;
  const sign = hours < 0 ? "-" : "+";
  const abs = String(Math.abs(hours)).padStart(2, "0");
  return new Date(`${v}:00${sign}${abs}:${m?.[2] ?? "00"}`).toISOString();
}

/** ISO → valor para <input type="datetime-local"> en hora de Tijuana. */
export function isoToTijuanaLocal(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}
