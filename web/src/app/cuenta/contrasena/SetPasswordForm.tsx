"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SetPasswordForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const name = String(fd.get("full_name") ?? "").trim();
    if (password.length < 8) return setError("La contraseña necesita al menos 8 caracteres.");
    if (password !== fd.get("password2")) return setError("Las contraseñas no coinciden.");
    setPending(true);
    const sb = createClient();
    const { data, error } = await sb.auth.updateUser({ password, data: name ? { full_name: name } : undefined });
    if (error) {
      setPending(false);
      return setError("No se pudo guardar. El enlace pudo haber caducado: pide otro.");
    }
    if (name && data.user) await sb.from("profiles").update({ full_name: name }).eq("id", data.user.id);
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="field"><span>Tu nombre</span><input className="input" name="full_name" autoComplete="name" /></label>
      <label className="field"><span>Contraseña nueva</span><input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
      <label className="field"><span>Repítela</span><input className="input" type="password" name="password2" required minLength={8} autoComplete="new-password" /></label>
      {error && <p role="alert" className="rounded-2xl bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">{error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Guardando…" : "Guardar y entrar"}</button>
    </form>
  );
}
