"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/** Entrar con correo y contraseña, o pedir un enlace para recuperarla. */
export function LoginForm({ next, area }: { next: string; area: "panel" | "padrino" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const sb = createClient();
    setPending(true);
    setMsg(null);
    if (mode === "reset") {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      });
      setPending(false);
      setMsg(error ? { ok: false, text: "No se pudo enviar. Intenta en unos minutos." } : { ok: true, text: "Si el correo está registrado, te llegó un enlace para elegir una contraseña nueva." });
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password: String(fd.get("password")) });
    if (error) {
      setPending(false);
      setMsg({ ok: false, text: error.message.includes("confirm") ? "Primero confirma tu correo con el enlace que te enviamos." : "Correo o contraseña incorrectos." });
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="field"><span>Correo</span><input className="input" type="email" name="email" required autoComplete="email" inputMode="email" /></label>
      {mode === "login" && (
        <label className="field"><span>Contraseña</span><input className="input" type="password" name="password" required autoComplete="current-password" /></label>
      )}
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}>
          {msg.text}
        </p>
      )}
      <button className="btn" disabled={pending}>{pending ? "Un momento…" : mode === "login" ? "Entrar" : "Enviarme el enlace"}</button>
      <button type="button" className="btn btn-text btn-sm" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setMsg(null); }}>
        {mode === "login" ? "Olvidé mi contraseña" : "Volver a entrar con contraseña"}
      </button>
      {area === "panel" && <p className="text-center text-xs text-on-surface-variant">¿No tienes cuenta? Pídele a Elizabeth que te invite desde el panel.</p>}
    </form>
  );
}
