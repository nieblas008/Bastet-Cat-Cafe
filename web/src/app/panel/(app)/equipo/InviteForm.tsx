"use client";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/ui/FormStatus";
import { inviteMember } from "./actions";

export function InviteForm() {
  const [state, action] = useActionState(inviteMember, null);
  const [copied, setCopied] = useState(false);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
        <label className="field"><span>Correo *</span><input className="input" type="email" name="email" required /></label>
        <label className="field"><span>Nombre</span><input className="input" name="full_name" maxLength={120} /></label>
        <label className="field"><span>Rol</span><select className="input" name="role" defaultValue="staff"><option value="staff">Equipo</option><option value="admin">Administradora</option></select></label>
      </div>
      <SubmitButton className="btn justify-self-start" pendingText="Creando…">Crear enlace de acceso</SubmitButton>
      {state && (
        <div role={state.ok ? "status" : "alert"} className={`grid gap-2 rounded-2xl px-4 py-3 text-sm ${state.ok ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}>
          <p className="font-semibold">{state.message}</p>
          {state.link && (
            <div className="flex flex-wrap gap-2">
              <input readOnly value={state.link} className="input !min-h-10 flex-1 bg-white text-xs" onFocus={(e) => e.currentTarget.select()} />
              <button
                type="button"
                className="btn btn-sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(state.link!);
                  setCopied(true);
                }}
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
              <a className="btn btn-outlined btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Te invito al panel de Bastet Cat Café. Entra aquí para crear tu contraseña: ${state.link}`)}`}>WhatsApp</a>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
