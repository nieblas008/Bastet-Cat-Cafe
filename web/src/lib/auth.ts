import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Perfil de quien tiene la sesión abierta, o null. Una consulta por petición. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Para páginas y acciones del panel: personal activo (admin o staff). */
export async function requireStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/panel/entrar");
  if (!profile.active || (profile.role !== "admin" && profile.role !== "staff")) redirect("/panel/sin-acceso");
  return profile;
}

/** Solo administradoras (manejo del equipo). */
export async function requireAdmin() {
  const profile = await requireStaff();
  if (profile.role !== "admin") redirect("/panel?aviso=solo-admin");
  return profile;
}

/** Portal del padrino: cualquier cuenta activa. */
export async function requireAccount() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/padrino/entrar");
  return profile;
}
