"use server";
import { check, f, staffAction } from "@/lib/panel";
import type { ActionState } from "@/lib/types";

export async function updateMyProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb, profile }) => {
    check(await sb.from("profiles").update({ full_name: f.req(fd, "full_name", "tu nombre", 120), phone: f.str(fd, "phone", 30) }).eq("id", profile.id));
  }, { refresh: false });
}
