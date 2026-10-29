"use server";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/format";
import { check, f, staffAction, tijuanaLocalToISO, UserError } from "@/lib/panel";
import type { ActionState, PostCategory } from "@/lib/types";

const CATEGORIES: PostCategory[] = ["concientizacion", "evento", "noticia", "historia", "sorteo"];

function postFields(fd: FormData) {
  const category = f.str(fd, "category") as PostCategory | null;
  if (!category || !CATEGORIES.includes(category)) throw new UserError("Elige una categoría.");
  const cta_url = f.str(fd, "cta_url", 500);
  if (cta_url && !/^(https?:\/\/|\/)/.test(cta_url)) throw new UserError("El enlace del botón debe empezar con https:// o /.");
  const publish = f.str(fd, "status") === "publicado";
  const starts = tijuanaLocalToISO(f.str(fd, "event_starts_at"));
  if (category === "evento" && !starts) throw new UserError("Pon la fecha y hora del evento.");
  return {
    title: f.req(fd, "title", "el título", 160),
    excerpt: f.str(fd, "excerpt", 300),
    body: f.str(fd, "body", 50000) ?? "",
    category,
    status: publish ? ("publicado" as const) : ("borrador" as const),
    pinned: f.bool(fd, "pinned"),
    published_at: tijuanaLocalToISO(f.str(fd, "published_at")),
    event_starts_at: category === "evento" ? starts : null,
    event_ends_at: category === "evento" ? tijuanaLocalToISO(f.str(fd, "event_ends_at")) : null,
    event_location: category === "evento" ? f.str(fd, "event_location", 200) : null,
    cta_label: f.str(fd, "cta_label", 60),
    cta_url,
    related_cat_id: f.str(fd, "related_cat_id"),
  };
}

async function uniqueSlug(sb: Parameters<Parameters<typeof staffAction>[0]>[0]["sb"], text: string, exceptId?: string) {
  const base = slugify(text) || "entrada";
  let slug = base;
  for (let n = 2; ; n++) {
    let q = sb.from("posts").select("id").eq("slug", slug);
    if (exceptId) q = q.neq("id", exceptId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n}`;
  }
}

export async function createPost(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const res = await staffAction(async ({ sb }) => {
    const fields = postFields(fd);
    if (fields.status === "publicado" && !fields.published_at) fields.published_at = new Date().toISOString();
    const slug = await uniqueSlug(sb, f.str(fd, "slug") ?? fields.title);
    const row = check(await sb.from("posts").insert({ ...fields, slug }).select("id").single());
    id = row!.id;
  });
  if (res?.ok && id) redirect(`/panel/blog/${id}?nuevo=1`);
  return res;
}

export async function updatePost(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const fields = postFields(fd);
    if (fields.status === "publicado" && !fields.published_at) fields.published_at = new Date().toISOString();
    const slugInput = f.str(fd, "slug");
    const update: Record<string, unknown> = { ...fields };
    if (slugInput) update.slug = await uniqueSlug(sb, slugInput, id);
    check(await sb.from("posts").update(update).eq("id", id));
    return fields.status === "publicado" ? "Guardado y publicado." : "Guardado como borrador.";
  });
}

export async function setCover(id: string, paths: string[]) {
  return staffAction(async ({ sb }) => {
    const path = paths.find((p) => p.startsWith(`blog/${id}/`));
    if (!path) return;
    const post = check(await sb.from("posts").select("cover_path").eq("id", id).single());
    if (post?.cover_path && !/^https?:/.test(post.cover_path)) await sb.storage.from("publico").remove([post.cover_path]);
    check(await sb.from("posts").update({ cover_path: path }).eq("id", id));
  });
}

export async function removeCover(id: string) {
  await staffAction(async ({ sb }) => {
    const post = check(await sb.from("posts").select("cover_path").eq("id", id).single());
    if (post?.cover_path && !/^https?:/.test(post.cover_path)) await sb.storage.from("publico").remove([post.cover_path]);
    check(await sb.from("posts").update({ cover_path: null }).eq("id", id));
  });
}

export async function deletePost(id: string) {
  await staffAction(async ({ sb }) => {
    const post = check(await sb.from("posts").select("cover_path").eq("id", id).single());
    if (post?.cover_path && !/^https?:/.test(post.cover_path)) await sb.storage.from("publico").remove([post.cover_path]);
    check(await sb.from("posts").delete().eq("id", id));
  });
  redirect("/panel/blog");
}
