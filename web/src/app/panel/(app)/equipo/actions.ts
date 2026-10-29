"use server";
import { requireAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/format";
import { check, f, friendlyError, staffAction, UserError } from "@/lib/panel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/types";

export type InviteState = { ok: boolean; message: string; link?: string } | null;

/**
 * Crea la cuenta (o encuentra la existente), le da el rol y regresa un enlace
 * de un solo uso para que la persona elija su contraseña. El enlace se manda
 * por WhatsApp o correo; no depende de configurar correos en Supabase.
 */
export async function inviteMember(_: InviteState, fd: FormData): Promise<InviteState> {
  await requireAdmin();
  try {
    const email = f.req(fd, "email", "el correo", 200).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("Ese correo no se ve bien.");
    const full_name = f.str(fd, "full_name", 120) ?? "";
    const role: AppRole = f.str(fd, "role") === "admin" ? "admin" : "staff";
    const admin = createAdminClient();
    const next = encodeURIComponent("/panel");

    let res = await admin.auth.admin.generateLink({ type: "invite", email, options: { data: { full_name } } });
    let type = "invite";
    if (res.error && /already|registered|exists/i.test(res.error.message)) {
      // Ya tiene cuenta (por ejemplo, es padrino): enlace para recuperar contraseña
      res = await admin.auth.admin.generateLink({ type: "recovery", email });
      type = "recovery";
    }
    if (res.error || !res.data.user) throw res.error ?? new Error("Sin usuario");
    const userId = res.data.user.id;
    await admin.auth.admin.updateUserById(userId, { app_metadata: { role } });
    const patch: Record<string, unknown> = { role, active: true };
    if (full_name) patch.full_name = full_name;
    check(await admin.from("profiles").update(patch).eq("id", userId));

    const link = `${SITE_URL}/auth/confirm?token_hash=${res.data.properties.hashed_token}&type=${type}&next=${next}`;
    return { ok: true, message: `Listo. Manda este enlace a ${full_name || email}. Sirve una sola vez y caduca en 24 horas.`, link };
  } catch (e) {
    console.error(e);
    return { ok: false, message: e instanceof UserError ? e.message : e instanceof Error && e.message.includes("SUPABASE_SECRET_KEY") ? e.message : friendlyError(e) };
  }
}

export async function setMemberRole(id: string, fd: FormData) {
  await staffAction(async ({ sb }) => {
    const role = f.str(fd, "role") as AppRole;
    if (!["admin", "staff", "padrino"].includes(role)) throw new UserError("Rol no válido.");
    check(await sb.from("profiles").update({ role }).eq("id", id));
  }, { admin: true, refresh: false });
}

export async function setMemberActive(id: string, active: boolean) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("profiles").update({ active }).eq("id", id));
  }, { admin: true, refresh: false });
}

