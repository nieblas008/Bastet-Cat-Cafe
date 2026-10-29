"use server";
import { redirect } from "next/navigation";
import { check, f, staffAction, tijuanaLocalToISO, UserError } from "@/lib/panel";
import type { ActionState } from "@/lib/types";

const CHANNELS = ["whatsapp", "llamada", "correo", "en_persona", "otro"];
const OUTCOMES = ["todo_bien", "atencion", "sin_respuesta", "devolucion"];

function adopterFields(fd: FormData) {
  return {
    full_name: f.req(fd, "full_name", "el nombre", 160),
    phone: f.str(fd, "phone", 30),
    email: f.str(fd, "email", 200),
    cat_id: f.str(fd, "cat_id"),
    cat_name: f.str(fd, "cat_name", 80),
    adopted_on: f.date(fd, "adopted_on") ?? new Date().toISOString().slice(0, 10),
    followup_interval_days: Math.min(365, Math.max(1, f.int(fd, "followup_interval_days") ?? 7)),
    notes: f.str(fd, "notes", 4000),
  };
}

export async function createAdopter(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const res = await staffAction(async ({ sb }) => {
    const fields = adopterFields(fd);
    if (!fields.cat_id && !fields.cat_name) throw new UserError("Pon el nombre del gato.");
    const row = check(await sb.from("adopters").insert(fields).select("id").single());
    id = row!.id;
  }, { refresh: false });
  if (res?.ok && id) redirect(`/panel/seguimiento/${id}`);
  return res;
}

export async function updateAdopter(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(
      await sb
        .from("adopters")
        .update({ ...adopterFields(fd), next_followup_on: f.date(fd, "next_followup_on"), followup_active: f.bool(fd, "followup_active") })
        .eq("id", id),
    );
  }, { refresh: false });
}

export async function logContact(adopterId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb, profile }) => {
    const channel = f.str(fd, "channel") ?? "whatsapp";
    const outcome = f.str(fd, "outcome") ?? "todo_bien";
    if (!CHANNELS.includes(channel) || !OUTCOMES.includes(outcome)) throw new UserError("Opción no válida.");
    check(
      await sb.from("followup_contacts").insert({
        adopter_id: adopterId,
        channel,
        outcome,
        notes: f.str(fd, "notes", 4000),
        contacted_at: tijuanaLocalToISO(f.str(fd, "contacted_at")) ?? new Date().toISOString(),
        by_profile: profile.id,
      }),
    );
    if (outcome === "devolucion") check(await sb.from("adopters").update({ followup_active: false }).eq("id", adopterId));
    return "Contacto registrado. El próximo seguimiento se agendó solo.";
  }, { refresh: false });
}

export async function deleteContact(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("followup_contacts").delete().eq("id", id));
  }, { refresh: false });
}

export async function deleteAdopter(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("adopters").delete().eq("id", id));
  }, { refresh: false });
  redirect("/panel/seguimiento");
}
