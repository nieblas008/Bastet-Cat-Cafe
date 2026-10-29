"use server";
import { redirect } from "next/navigation";
import { check, f, staffAction, UserError } from "@/lib/panel";
import type { ActionState, PaymentMethod, SponsorshipStatus } from "@/lib/types";

const STATUSES: SponsorshipStatus[] = ["pendiente", "activa", "pausada", "cancelada"];
const METHODS: PaymentMethod[] = ["transferencia", "tarjeta", "efectivo"];
const today = () => new Date().toISOString().slice(0, 10);

// ── Niveles ──
function tierFields(fd: FormData) {
  const monthly = f.num(fd, "monthly_mxn");
  if (!monthly || monthly <= 0) throw new UserError("Pon el monto mensual.");
  return {
    name: f.req(fd, "name", "el nombre", 60),
    monthly_mxn: monthly,
    description: f.str(fd, "description", 500),
    perks: f.str(fd, "perks", 2000)?.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12) ?? [],
    visible: f.bool(fd, "visible"),
    sort_order: f.int(fd, "sort_order") ?? 0,
  };
}

export async function createTier(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(await sb.from("sponsorship_tiers").insert({ ...tierFields(fd), visible: true }));
    return "Nivel creado.";
  });
}

export async function updateTier(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(await sb.from("sponsorship_tiers").update(tierFields(fd)).eq("id", id));
  });
}

export async function deleteTier(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("sponsorship_tiers").delete().eq("id", id));
  });
}

// ── Apadrinamientos ──
export async function setSponsorshipStatus(id: string, status: SponsorshipStatus) {
  await staffAction(async ({ sb }) => {
    if (!STATUSES.includes(status)) throw new UserError("Estado no válido.");
    const current = check(await sb.from("sponsorships").select("started_at").eq("id", id).single());
    const patch: Record<string, unknown> = { status };
    if (status === "activa" && !current?.started_at) patch.started_at = today();
    if (status === "activa") patch.ended_at = null;
    if (status === "cancelada") patch.ended_at = today();
    check(await sb.from("sponsorships").update(patch).eq("id", id));
  });
}

export async function updateSponsorship(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const status = f.str(fd, "status") as SponsorshipStatus;
    const method = f.str(fd, "payment_method") as PaymentMethod;
    if (!STATUSES.includes(status) || !METHODS.includes(method)) throw new UserError("Opción no válida.");
    check(
      await sb
        .from("sponsorships")
        .update({
          status,
          payment_method: method,
          tier_id: f.str(fd, "tier_id"),
          started_at: f.date(fd, "started_at") ?? (status === "activa" ? today() : null),
          ended_at: f.date(fd, "ended_at"),
          public_name: f.str(fd, "public_name", 80),
          show_publicly: f.bool(fd, "show_publicly"),
          is_gift: f.bool(fd, "is_gift"),
          gift_recipient: f.str(fd, "gift_recipient", 120),
          notes: f.str(fd, "notes", 4000),
        })
        .eq("id", id),
    );
  });
}

export async function addPayment(sponsorshipId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb, profile }) => {
    const amount = f.num(fd, "amount_mxn");
    if (!amount || amount <= 0) throw new UserError("Pon el monto.");
    const method = (f.str(fd, "method") ?? "transferencia") as PaymentMethod;
    if (!METHODS.includes(method)) throw new UserError("Método no válido.");
    check(
      await sb.from("sponsorship_payments").insert({
        sponsorship_id: sponsorshipId,
        amount_mxn: amount,
        paid_on: f.date(fd, "paid_on") ?? today(),
        method,
        reference: f.str(fd, "reference", 120),
        recorded_by: profile.id,
      }),
    );
    return "Pago registrado.";
  }, { refresh: false });
}

export async function deletePayment(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("sponsorship_payments").delete().eq("id", id));
  }, { refresh: false });
}

export async function deleteSponsorship(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("sponsorships").delete().eq("id", id));
  });
  redirect("/panel/apadrinamiento");
}

// ── Fotos y videos privados para padrinos ──
export async function addSponsorMedia(catId: string, paths: string[]) {
  return staffAction(async ({ sb, profile }) => {
    const rows = paths
      .filter((p) => p.startsWith(`${catId}/`))
      .map((p) => ({ cat_id: catId, storage_path: p, media_type: /\.(mp4|mov|webm|qt)$/i.test(p) ? "video" : "foto", uploaded_by: profile.id }));
    if (rows.length) check(await sb.from("sponsor_media").insert(rows));
  }, { refresh: false });
}

export async function updateMediaCaption(id: string, fd: FormData) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("sponsor_media").update({ caption: f.str(fd, "caption", 300) }).eq("id", id));
  }, { refresh: false });
}

export async function deleteSponsorMedia(id: string) {
  await staffAction(async ({ sb }) => {
    const m = check(await sb.from("sponsor_media").select("storage_path").eq("id", id).single());
    if (m?.storage_path) await sb.storage.from("padrinos").remove([m.storage_path]);
    check(await sb.from("sponsor_media").delete().eq("id", id));
  }, { refresh: false });
}
