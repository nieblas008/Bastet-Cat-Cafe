"use server";
import { check, f, staffAction, UserError } from "@/lib/panel";
import type { ActionState } from "@/lib/types";

// ── Bloques de texto de las páginas ──
export async function updateBlock(key: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    check(
      await sb
        .from("page_blocks")
        .update({ title: f.str(fd, "title", 200), body: f.str(fd, "body", 50000) ?? "", visible: f.bool(fd, "visible") })
        .eq("key", key),
    );
    return "Guardado. Ya se ve en el sitio.";
  });
}

// ── Listas sencillas: requisitos, preguntas, datos y lugares para esterilizar ──
type ListTable = "adoption_requirements" | "faqs" | "awareness_facts" | "sterilization_resources";

function rowFields(table: ListTable, fd: FormData): Record<string, unknown> {
  const sort_order = f.int(fd, "sort_order") ?? 0;
  switch (table) {
    case "adoption_requirements":
      return { title: f.req(fd, "title", "el requisito", 200), description: f.str(fd, "description", 1000), sort_order };
    case "faqs": {
      const topic = f.str(fd, "topic") ?? "adopcion";
      if (!["adopcion", "visita", "apadrina", "general"].includes(topic)) throw new UserError("Tema no válido.");
      return { topic, question: f.req(fd, "question", "la pregunta", 300), answer: f.req(fd, "answer", "la respuesta", 4000), visible: f.bool(fd, "visible"), sort_order };
    }
    case "awareness_facts":
      return { headline: f.req(fd, "headline", "el dato", 200), body: f.str(fd, "body", 2000), source: f.str(fd, "source", 300), visible: f.bool(fd, "visible"), sort_order };
    case "sterilization_resources": {
      const url = f.str(fd, "url", 500);
      if (url && !/^https?:\/\//.test(url)) throw new UserError("El enlace debe empezar con https://");
      return { name: f.req(fd, "name", "el nombre", 160), address: f.str(fd, "address", 300), phone: f.str(fd, "phone", 40), url, notes: f.str(fd, "notes", 1000), visible: f.bool(fd, "visible"), sort_order };
    }
  }
}

const TABLES: ListTable[] = ["adoption_requirements", "faqs", "awareness_facts", "sterilization_resources"];
const ensure = (t: string): ListTable => {
  if (!TABLES.includes(t as ListTable)) throw new UserError("Sección no válida.");
  return t as ListTable;
};

export async function createRow(table: ListTable, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const t = ensure(table);
    const fields = rowFields(t, fd);
    check(await sb.from(t).insert(t === "adoption_requirements" ? fields : { ...fields, visible: true }));
    return "Agregado.";
  });
}

export async function updateRow(table: ListTable, id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const t = ensure(table);
    check(await sb.from(t).update(rowFields(t, fd)).eq("id", id));
  });
}

export async function deleteRow(table: ListTable, id: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from(ensure(table)).delete().eq("id", id));
  });
}
