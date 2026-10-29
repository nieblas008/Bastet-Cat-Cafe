"use server";
import { redirect } from "next/navigation";
import { check, f, staffAction, UserError } from "@/lib/panel";
import { slugify } from "@/lib/format";
import type { ActionState, CatStatus } from "@/lib/types";

const STATUSES: CatStatus[] = ["disponible", "apartado", "adoptado", "residente", "en_tratamiento"];

function catFields(fd: FormData) {
  const status = f.str(fd, "status") as CatStatus | null;
  if (status && !STATUSES.includes(status)) throw new UserError("Estado no válido.");
  const sex = f.str(fd, "sex");
  return {
    name: f.req(fd, "name", "el nombre", 80),
    status: status ?? "disponible",
    sex: sex === "hembra" || sex === "macho" ? sex : null,
    birth_date: f.date(fd, "birth_date"),
    age_label: f.str(fd, "age_label", 40),
    arrived_at: f.date(fd, "arrived_at"),
    reserved_until: f.date(fd, "reserved_until"),
    short_bio: f.str(fd, "short_bio", 300),
    personality: f.str(fd, "personality", 5000),
    traits: f.list(fd, "traits"),
    vaccinated: f.bool(fd, "vaccinated"),
    sterilized: f.bool(fd, "sterilized"),
    dewormed: f.bool(fd, "dewormed"),
    health_notes: f.str(fd, "health_notes", 1000),
    good_with_kids: f.triBool(fd, "good_with_kids"),
    good_with_dogs: f.triBool(fd, "good_with_dogs"),
    good_with_cats: f.triBool(fd, "good_with_cats"),
    special_needs: f.bool(fd, "special_needs"),
    special_needs_notes: f.str(fd, "special_needs_notes", 1000),
    featured: f.bool(fd, "featured"),
    published: f.bool(fd, "published"),
    sort_order: f.int(fd, "sort_order") ?? 0,
  };
}

async function resolveGroup(sb: Parameters<Parameters<typeof staffAction>[0]>[0]["sb"], fd: FormData) {
  const newGroup = f.str(fd, "new_group", 80);
  if (newGroup) {
    const kind = f.str(fd, "new_group_kind") === "camada" ? "camada" : "pareja";
    const g = check(await sb.from("cat_groups").insert({ name: newGroup, kind }).select("id").single());
    return g!.id as string;
  }
  return f.str(fd, "group_id");
}

export async function createCat(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const res = await staffAction(async ({ sb, profile }) => {
    const fields = catFields(fd);
    const base = slugify(f.str(fd, "slug") ?? fields.name) || "gato";
    let slug = base;
    for (let n = 2; ; n++) {
      const { data } = await sb.from("cats").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${base}-${n}`;
    }
    const group_id = await resolveGroup(sb, fd);
    const row = check(await sb.from("cats").insert({ ...fields, slug, group_id, created_by: profile.id, updated_by: profile.id }).select("id").single());
    id = row!.id;
  });
  if (res?.ok) redirect(`/panel/gatos/${id}?nuevo=1`);
  return res;
}

export async function updateCat(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb, profile }) => {
    const fields = catFields(fd);
    const slugIn = f.str(fd, "slug");
    const group_id = await resolveGroup(sb, fd);
    const patch: Record<string, unknown> = { ...fields, group_id, updated_by: profile.id };
    if (slugIn) patch.slug = slugify(slugIn);
    check(await sb.from("cats").update(patch).eq("id", id));
    return "Guardado. Ya se ve en el sitio.";
  });
}

export async function setCatStatus(id: string, fd: FormData) {
  const status = String(fd.get("status")) as CatStatus;
  await staffAction(async ({ sb, profile }) => {
    if (!STATUSES.includes(status)) throw new UserError("Estado no válido.");
    check(await sb.from("cats").update({ status, updated_by: profile.id }).eq("id", id));
  });
}

export async function bulkStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb, profile }) => {
    const ids = f.all(fd, "ids");
    const status = f.str(fd, "status") as CatStatus;
    if (!ids.length) throw new UserError("Marca al menos un gato.");
    if (!STATUSES.includes(status)) throw new UserError("Elige el nuevo estado.");
    // Uno por uno para que el contador de adopciones y el historial registren cada cambio
    for (const id of ids) check(await sb.from("cats").update({ status, updated_by: profile.id }).eq("id", id));
    return `${ids.length} ${ids.length === 1 ? "gato actualizado" : "gatos actualizados"}.`;
  });
}

export async function togglePublished(id: string, publish: boolean) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("cats").update({ published: publish }).eq("id", id));
  });
}

export async function deleteCat(id: string) {
  const res = await staffAction(async ({ sb }) => {
    const photos = check(await sb.from("cat_photos").select("storage_path").eq("cat_id", id)) ?? [];
    const paths = photos.map((p) => p.storage_path).filter((p) => !/^https?:/.test(p));
    if (paths.length) await sb.storage.from("publico").remove(paths);
    check(await sb.from("cats").delete().eq("id", id));
  });
  if (res?.ok) redirect("/panel/gatos?borrado=1");
}

// ── Fotos ──
export async function addCatPhotos(catId: string, paths: string[]) {
  return staffAction(async ({ sb }) => {
    const existing = check(await sb.from("cat_photos").select("sort_order").eq("cat_id", catId).order("sort_order", { ascending: false }).limit(1));
    let next = (existing?.[0]?.sort_order ?? -1) + 1;
    const rows = paths
      .filter((p) => p.startsWith(`gatos/${catId}/`))
      .map((storage_path) => ({ cat_id: catId, storage_path, sort_order: next++ }));
    if (rows.length) check(await sb.from("cat_photos").insert(rows));
    return "Fotos agregadas.";
  });
}

export async function movePhoto(catId: string, photoId: string, dir: -1 | 1) {
  await staffAction(async ({ sb }) => {
    const photos = check(await sb.from("cat_photos").select("id, sort_order").eq("cat_id", catId).order("sort_order")) ?? [];
    const i = photos.findIndex((p) => p.id === photoId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= photos.length) return;
    [photos[i], photos[j]] = [photos[j], photos[i]];
    for (let k = 0; k < photos.length; k++) check(await sb.from("cat_photos").update({ sort_order: k }).eq("id", photos[k].id));
  });
}

export async function updatePhotoAlt(photoId: string, fd: FormData) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("cat_photos").update({ alt: f.str(fd, "alt", 200) }).eq("id", photoId));
  });
}

export async function deletePhoto(photoId: string) {
  await staffAction(async ({ sb }) => {
    const photo = check(await sb.from("cat_photos").select("storage_path").eq("id", photoId).single());
    if (photo && !/^https?:/.test(photo.storage_path)) await sb.storage.from("publico").remove([photo.storage_path]);
    check(await sb.from("cat_photos").delete().eq("id", photoId));
  });
}

export async function markInterestNotified(id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("cat_interest").update({ notified: true }).eq("id", id));
  }, { refresh: false });
}
