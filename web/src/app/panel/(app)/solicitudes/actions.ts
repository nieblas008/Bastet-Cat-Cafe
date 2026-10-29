"use server";
import { redirect } from "next/navigation";
import { check, f, staffAction, tijuanaLocalToISO, UserError } from "@/lib/panel";
import type { ActionState, ApplicationStatus } from "@/lib/types";

const STATUSES: ApplicationStatus[] = ["nueva", "en_entrevista", "aprobada", "rechazada", "adoptada", "cancelada"];

export async function updateApplication(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(
    async ({ sb }) => {
      const status = f.str(fd, "status") as ApplicationStatus | null;
      if (!status || !STATUSES.includes(status)) throw new UserError("Elige un estado.");
      check(
        await sb
          .from("adoption_applications")
          .update({
            status,
            interview_at: tijuanaLocalToISO(f.str(fd, "interview_at")),
            assigned_to: f.str(fd, "assigned_to"),
            cat_id: f.str(fd, "cat_id"),
          })
          .eq("id", id),
      );
    },
    { refresh: false },
  );
}

export async function addNote(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(
    async ({ sb, profile }) => {
      const body = f.req(fd, "body", "la nota", 4000);
      check(await sb.from("application_notes").insert({ application_id: id, author_id: profile.id, body }));
      return "Nota agregada.";
    },
    { refresh: false },
  );
}

export async function deleteNote(noteId: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("application_notes").delete().eq("id", noteId));
  }, { refresh: false });
}

/**
 * Cierra la adopción: marca la solicitud como "Adoptó", el gato como adoptado
 * (eso suma al contador) y crea el registro de seguimiento.
 */
export async function completeAdoption(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  let adopterId = "";
  const res = await staffAction(async ({ sb }) => {
    const app = check(await sb.from("adoption_applications").select("*, cats(name)").eq("id", id).single()) as {
      id: string; cat_id: string | null; full_name: string; phone: string; email: string | null; cats: { name: string } | null;
    };
    const catId = f.str(fd, "cat_id") ?? app.cat_id;
    let catName = f.str(fd, "cat_name", 80) ?? app.cats?.name ?? null;
    if (catId) {
      const cat = check(await sb.from("cats").select("name").eq("id", catId).single());
      catName = cat?.name ?? catName;
    }
    if (!catId && !catName) throw new UserError("Elige qué gato se adoptó.");
    const adopted_on = f.date(fd, "adopted_on") ?? new Date().toISOString().slice(0, 10);
    const existing = check(await sb.from("adopters").select("id").eq("application_id", id).maybeSingle());
    if (existing) throw new UserError("Esta adopción ya está registrada en Seguimiento.");
    const row = check(
      await sb
        .from("adopters")
        .insert({
          application_id: id,
          cat_id: catId,
          cat_name: catName,
          full_name: app.full_name,
          phone: app.phone,
          email: app.email,
          adopted_on,
          followup_interval_days: f.int(fd, "followup_interval_days") ?? 7,
        })
        .select("id")
        .single(),
    );
    adopterId = row!.id;
    check(await sb.from("adoption_applications").update({ status: "adoptada", cat_id: catId }).eq("id", id));
    if (catId) check(await sb.from("cats").update({ status: "adoptado", adopted_at: adopted_on }).eq("id", catId));
  });
  if (res?.ok && adopterId) redirect(`/panel/seguimiento/${adopterId}?nuevo=1`);
  return res;
}

export async function deleteApplication(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("adoption_applications").delete().eq("id", id));
  }, { refresh: false });
  redirect("/panel/solicitudes");
}
