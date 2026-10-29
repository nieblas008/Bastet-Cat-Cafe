"use server";
import { check, f, staffAction, UserError } from "@/lib/panel";
import type { ActionState } from "@/lib/types";

const url = (fd: FormData, k: string) => {
  const v = f.str(fd, k, 1000);
  if (v && !/^https:\/\//.test(v)) throw new UserError("Los enlaces deben empezar con https://");
  return v;
};

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const fee = f.int(fd, "adoption_fee_mxn");
    const count = f.int(fd, "adoptions_count");
    const goal = f.int(fd, "adoptions_goal");
    if (fee === null || fee < 0) throw new UserError("Pon la cuota de adopción.");
    if (count === null || count < 0) throw new UserError("Pon el número de adopciones.");
    let maps_embed_url = f.str(fd, "maps_embed_url", 2000);
    const iframe = maps_embed_url?.match(/src="([^"]+)"/);
    if (iframe) maps_embed_url = iframe[1]; // si pegaron el <iframe> completo
    if (maps_embed_url && !/^https:\/\/(www\.)?google\.com\/maps\/embed/.test(maps_embed_url)) throw new UserError("El mapa debe ser el enlace de “Insertar mapa” de Google Maps.");
    check(
      await sb
        .from("site_settings")
        .update({
          cafe_name: f.req(fd, "cafe_name", "el nombre", 80),
          tagline: f.req(fd, "tagline", "la frase", 200),
          address: f.str(fd, "address", 300),
          maps_url: url(fd, "maps_url"),
          maps_embed_url,
          phone: f.str(fd, "phone", 30),
          whatsapp_number: f.str(fd, "whatsapp_number", 30),
          email: f.str(fd, "email", 200),
          applications_email: f.str(fd, "applications_email", 200),
          instagram_url: url(fd, "instagram_url"),
          facebook_url: url(fd, "facebook_url"),
          tiktok_url: url(fd, "tiktok_url"),
          adoption_fee_mxn: fee,
          show_adoption_fee: f.bool(fd, "show_adoption_fee"),
          adoption_response_days: f.int(fd, "adoption_response_days"),
          online_applications: f.bool(fd, "online_applications"),
          adoptions_count: count,
          adoptions_count_as_of: f.date(fd, "adoptions_count_as_of"),
          adoptions_goal: goal && goal > 0 ? goal : 10000,
          show_adoptions_counter: f.bool(fd, "show_adoptions_counter"),
          entry_fee_note: f.str(fd, "entry_fee_note", 300),
          bank_name: f.str(fd, "bank_name", 80),
          bank_account_holder: f.str(fd, "bank_account_holder", 160),
          bank_clabe: f.str(fd, "bank_clabe", 30),
          bank_card_number: f.str(fd, "bank_card_number", 30),
          donations_note: f.str(fd, "donations_note", 1000),
        })
        .eq("id", 1),
    );
    return "Guardado. El sitio ya muestra los datos nuevos.";
  });
}
