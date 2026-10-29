"use server";
import { check, f, staffAction, UserError } from "@/lib/panel";
import type { ActionState, WishlistPriority } from "@/lib/types";

const PRIORITIES: WishlistPriority[] = ["urgente", "normal", "cuando_se_pueda"];

function fields(fd: FormData) {
  const priority = (f.str(fd, "priority") ?? "normal") as WishlistPriority;
  if (!PRIORITIES.includes(priority)) throw new UserError("Prioridad no válida.");
  const buy_url = f.str(fd, "buy_url", 500);
  if (buy_url && !/^https?:\/\//.test(buy_url)) throw new UserError("El enlace debe empezar con https://");
  return {
    name: f.req(fd, "name", "qué se necesita", 120),
    description: f.str(fd, "description", 500),
    priority,
    quantity_needed: f.int(fd, "quantity_needed"),
    quantity_received: Math.max(0, f.int(fd, "quantity_received") ?? 0),
    buy_url,
    visible: f.bool(fd, "visible"),
    sort_order: f.int(fd, "sort_order") ?? 0,
  };
}

export async function createWish(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(await sb.from("wishlist_items").insert({ ...fields(fd), visible: true }));
    return "Agregado.";
  });
}

export async function updateWish(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(await sb.from("wishlist_items").update(fields(fd)).eq("id", id));
  });
}

export async function addReceived(id: string, n: number) {
  await staffAction(async ({ sb }) => {
    const row = check(await sb.from("wishlist_items").select("quantity_received").eq("id", id).single());
    check(await sb.from("wishlist_items").update({ quantity_received: Math.max(0, (row?.quantity_received ?? 0) + n) }).eq("id", id));
  });
}

export async function deleteWish(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("wishlist_items").delete().eq("id", id));
  });
}
