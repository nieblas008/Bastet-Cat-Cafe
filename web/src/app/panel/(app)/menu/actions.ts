"use server";
import { check, f, staffAction, UserError } from "@/lib/panel";
import { slugify } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const DIETARY = ["vegetariano", "vegano", "lacteos", "nueces", "gluten", "picante"];

function itemFields(fd: FormData) {
  const price = f.num(fd, "price_mxn");
  if (price === null || price < 0) throw new UserError("Pon un precio válido.");
  return {
    category_id: f.req(fd, "category_id", "la categoría"),
    name: f.req(fd, "name", "el nombre", 120),
    description: f.str(fd, "description", 300),
    price_mxn: price,
    price_note: f.str(fd, "price_note", 80),
    badge: f.str(fd, "badge", 40),
    dietary_tags: f.all(fd, "dietary_tags").filter((t) => DIETARY.includes(t)),
    available: f.bool(fd, "available"),
    seasonal: f.bool(fd, "seasonal"),
    visible: f.bool(fd, "visible"),
    sort_order: f.int(fd, "sort_order") ?? 0,
  };
}

export async function createItem(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(await sb.from("menu_items").insert({ ...itemFields(fd), available: true, visible: true }));
    return "Agregado al menú.";
  });
}

export async function updateItem(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(await sb.from("menu_items").update(itemFields(fd)).eq("id", id));
  });
}

export async function toggleAvailable(id: string, available: boolean) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("menu_items").update({ available }).eq("id", id));
  });
}

export async function deleteItem(id: string) {
  await staffAction(async ({ sb }) => {
    const item = check(await sb.from("menu_items").select("photo_path").eq("id", id).single());
    if (item?.photo_path && !/^https?:/.test(item.photo_path)) await sb.storage.from("publico").remove([item.photo_path]);
    check(await sb.from("menu_items").delete().eq("id", id));
  });
}

export async function setItemPhoto(id: string, paths: string[]) {
  return staffAction(async ({ sb }) => {
    const path = paths.find((p) => p.startsWith(`menu/${id}/`));
    if (!path) return;
    const item = check(await sb.from("menu_items").select("photo_path").eq("id", id).single());
    if (item?.photo_path && !/^https?:/.test(item.photo_path)) await sb.storage.from("publico").remove([item.photo_path]);
    check(await sb.from("menu_items").update({ photo_path: path }).eq("id", id));
  });
}

export async function removeItemPhoto(id: string) {
  await staffAction(async ({ sb }) => {
    const item = check(await sb.from("menu_items").select("photo_path").eq("id", id).single());
    if (item?.photo_path && !/^https?:/.test(item.photo_path)) await sb.storage.from("publico").remove([item.photo_path]);
    check(await sb.from("menu_items").update({ photo_path: null }).eq("id", id));
  });
}

export async function createCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const name = f.req(fd, "name", "el nombre", 60);
    check(await sb.from("menu_categories").insert({ name, slug: slugify(name) || `cat-${Date.now()}`, icon: f.str(fd, "icon", 20), sort_order: f.int(fd, "sort_order") ?? 0 }));
    return "Categoría creada.";
  });
}

export async function updateCategory(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(
      await sb
        .from("menu_categories")
        .update({
          name: f.req(fd, "name", "el nombre", 60),
          icon: f.str(fd, "icon", 20),
          description: f.str(fd, "description", 300),
          sort_order: f.int(fd, "sort_order") ?? 0,
          visible: f.bool(fd, "visible"),
        })
        .eq("id", id),
    );
  });
}

export async function deleteCategory(id: string) {
  await staffAction(async ({ sb }) => {
    const { count } = await sb.from("menu_items").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (count) throw new UserError("Primero mueve o borra los platillos de esta categoría.");
    check(await sb.from("menu_categories").delete().eq("id", id));
  });
}
