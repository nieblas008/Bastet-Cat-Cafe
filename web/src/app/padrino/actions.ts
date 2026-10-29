"use server";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, PaymentMethod } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

/** El padrino pide apadrinar. Queda "pendiente" hasta que el café confirme el pago. */
export async function requestSponsorship(_: ActionState, fd: FormData): Promise<ActionState> {
  const profile = await requireAccount();
  const sb = await createClient();
  const cat_id = String(fd.get("cat_id") ?? "");
  const tier_id = String(fd.get("tier_id") ?? "");
  const method = String(fd.get("payment_method") ?? "transferencia") as PaymentMethod;
  if (!UUID.test(cat_id)) return { ok: false, message: "Elige a tu michi." };
  if (!UUID.test(tier_id)) return { ok: false, message: "Elige cómo quieres apoyar." };
  if (!["transferencia", "tarjeta", "efectivo"].includes(method)) return { ok: false, message: "Elige la forma de pago." };

  const { data: dup } = await sb.from("sponsorships").select("id").eq("sponsor_id", profile.id).eq("cat_id", cat_id).in("status", ["pendiente", "activa"]).maybeSingle();
  if (dup) return { ok: false, message: "Ya apadrinas (o pediste apadrinar) a este michi." };

  const show = fd.get("show_publicly") === "on";
  const publicName = String(fd.get("public_name") ?? "").trim().slice(0, 80);
  const isGift = fd.get("is_gift") === "on";
  const { error } = await sb.from("sponsorships").insert({
    sponsor_id: profile.id,
    cat_id,
    tier_id,
    payment_method: method,
    show_publicly: show,
    public_name: show ? publicName || profile.full_name.split(" ")[0] || null : null,
    is_gift: isGift,
    gift_recipient: isGift ? String(fd.get("gift_recipient") ?? "").trim().slice(0, 120) || null : null,
  });
  if (error) {
    console.error(error);
    return { ok: false, message: "No se pudo registrar. Intenta de nuevo o escríbenos por WhatsApp." };
  }
  revalidatePath("/padrino");
  return { ok: true, message: "¡Gracias! Ya registramos tu solicitud. Abajo están los datos para tu primer pago." };
}
