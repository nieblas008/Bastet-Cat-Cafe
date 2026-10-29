"use server";
import { check, staffAction } from "@/lib/panel";

export async function setHandled(id: string, handled: boolean) {
  await staffAction(async ({ sb, profile }) => {
    check(await sb.from("contact_messages").update({ handled, handled_by: handled ? profile.id : null }).eq("id", id));
  }, { refresh: false });
}

export async function deleteMessage(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("contact_messages").delete().eq("id", id));
  }, { refresh: false });
}
