"use server";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import type { ActionState } from "@/lib/types";

// Formularios públicos. Solo pueden INSERTAR (lo garantiza RLS).
// El campo "sitio_web" es una trampa para bots: las personas no lo ven.

const str = (fd: FormData, k: string, max = 2000) => {
  const v = String(fd.get(k) ?? "").trim();
  return v ? v.slice(0, max) : null;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "si" || fd.get(k) === "true";
const triBool = (fd: FormData, k: string) => (fd.get(k) === "si" ? true : fd.get(k) === "no" ? false : null);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return UUID.test(v) ? v : null;
};
const int = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

export async function submitAdoptionApplication(_: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "sitio_web")) redirect("/gracias?tipo=solicitud");
  const sb = createPublicClient();
  if (!sb) return { ok: false, message: "El sitio todavía no está conectado a la base de datos." };

  const full_name = str(fd, "full_name", 160);
  const phone = str(fd, "phone", 30);
  if (!full_name || !phone) return { ok: false, message: "Necesitamos tu nombre y un teléfono o WhatsApp." };
  if (!bool(fd, "privacy_accepted")) return { ok: false, message: "Para enviar la solicitud acepta el aviso de privacidad." };
  const age = int(fd, "age");
  if (age !== null && age < 18) return { ok: false, message: "Para adoptar necesitas ser mayor de edad." };

  const { error } = await sb.from("adoption_applications").insert({
    cat_id: uuid(fd, "cat_id"),
    full_name,
    phone,
    email: str(fd, "email", 200),
    city: str(fd, "city", 120),
    neighborhood: str(fd, "neighborhood", 120),
    age,
    has_official_id: bool(fd, "has_official_id"),
    has_proof_of_address: bool(fd, "has_proof_of_address"),
    has_carrier: bool(fd, "has_carrier"),
    accepts_fee: bool(fd, "accepts_fee"),
    housing_type: str(fd, "housing_type", 20),
    housing_tenure: str(fd, "housing_tenure", 20),
    landlord_allows_pets: triBool(fd, "landlord_allows_pets"),
    household_adults: int(fd, "household_adults"),
    household_children: int(fd, "household_children"),
    children_ages: str(fd, "children_ages", 200),
    other_pets: str(fd, "other_pets", 1000),
    pets_sterilized: triBool(fd, "pets_sterilized"),
    planned_move: triBool(fd, "planned_move"),
    expecting_family_change: triBool(fd, "expecting_family_change"),
    hours_alone: str(fd, "hours_alone", 200),
    previous_cats: str(fd, "previous_cats", 2000),
    why_adopt: str(fd, "why_adopt", 4000),
    extra_notes: str(fd, "extra_notes", 4000),
    privacy_accepted: true,
  });
  if (error) {
    console.error("solicitud", error);
    return { ok: false, message: "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp." };
  }
  redirect("/gracias?tipo=solicitud");
}

export async function submitContact(_: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "sitio_web")) redirect("/gracias?tipo=mensaje");
  const sb = createPublicClient();
  if (!sb) return { ok: false, message: "El sitio todavía no está conectado a la base de datos." };
  const name = str(fd, "name", 160);
  const message = str(fd, "message", 5000);
  const email = str(fd, "email", 200);
  const phone = str(fd, "phone", 30);
  if (!name || !message) return { ok: false, message: "Escribe tu nombre y tu mensaje." };
  if (!email && !phone) return { ok: false, message: "Déjanos un correo o un teléfono para responderte." };
  const allowed = ["general", "adopcion", "prensa", "escuelas", "eventos", "encontre_un_gato"];
  const topicRaw = str(fd, "topic", 40) ?? "general";
  const { error } = await sb.from("contact_messages").insert({
    name,
    message,
    email,
    phone,
    topic: allowed.includes(topicRaw) ? topicRaw : "general",
  });
  if (error) {
    console.error("contacto", error);
    return { ok: false, message: "No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp." };
  }
  redirect("/gracias?tipo=mensaje");
}

export async function submitCatInterest(_: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "sitio_web")) return { ok: true, message: "¡Listo! Te avisamos." };
  const sb = createPublicClient();
  if (!sb) return { ok: false, message: "El sitio todavía no está conectado a la base de datos." };
  const name = str(fd, "name", 120);
  const contact = str(fd, "contact", 160);
  const cat_id = uuid(fd, "cat_id");
  if (!name || !contact || contact.length < 5 || !cat_id) return { ok: false, message: "Escribe tu nombre y un WhatsApp o correo." };
  const { error } = await sb.from("cat_interest").insert({ name, contact, cat_id });
  if (error) return { ok: false, message: "No se pudo guardar. Intenta de nuevo." };
  return { ok: true, message: "¡Listo! Si vuelve a estar disponible, te avisamos." };
}
