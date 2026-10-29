"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignUpForm({ next }: { next: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get("password"));
    if (password.length < 8) return setMsg({ ok: false, text: "La contraseña necesita al menos 8 caracteres." });
    setPending(true);
    setMsg(null);
    const sb = createClient();
    const { data, error } = await sb.auth.signUp({
      email: String(fd.get("email")).trim(),
      password,
      options: {
        data: { full_name: String(fd.get("full_name")).trim(), phone: String(fd.get("phone") ?? "").trim() || null },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    setPending(false);
    if (error) {
      return setMsg({ ok: false, text: /registered|exists/i.test(error.message) ? "Ese correo ya tiene cuenta. Entra con tu contraseña." : "No se pudo crear la cuenta. Intenta de nuevo." });
    }
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setMsg({ ok: true, text: "¡Listo! Te mandamos un correo para confirmar tu cuenta. Ábrelo desde este mismo teléfono o computadora." });
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="field"><span>Tu nombre *</span><input className="input" name="full_name" required maxLength={120} autoComplete="name" /></label>
      <label className="field"><span>Correo *</span><input className="input" type="email" name="email" required autoComplete="email" inputMode="email" /></label>
      <label className="field"><span>WhatsApp</span><input className="input" name="phone" inputMode="tel" maxLength={30} autoComplete="tel" /><span className="hint">Para avisarte cuando confirmemos tu pago.</span></label>
      <label className="field"><span>Contraseña *</span><input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
      <label className="check text-sm"><input type="checkbox" required /> Leí el <Link href="/aviso-de-privacidad" target="_blank" className="underline">aviso de privacidad</Link></label>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}>{msg.text}</p>
      )}
      <button className="btn" disabled={pending}>{pending ? "Creando…" : "Crear mi cuenta"}</button>
    </form>
  );
}
