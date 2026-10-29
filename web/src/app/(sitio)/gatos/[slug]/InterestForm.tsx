"use client";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/FormStatus";
import { submitCatInterest } from "../../actions";

export function InterestForm({ catId, catName }: { catId: string; catName: string }) {
  const [state, action] = useActionState(submitCatInterest, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-3 rounded-[24px] bg-tertiary-container p-5 text-on-tertiary-container">
      <p className="font-semibold">{catName} está apartado. ¿Quieres que te avisemos si vuelve a estar disponible?</p>
      <input type="hidden" name="cat_id" value={catId} />
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" name="name" placeholder="Tu nombre" required maxLength={120} aria-label="Tu nombre" />
        <input className="input" name="contact" placeholder="WhatsApp o correo" required maxLength={160} aria-label="WhatsApp o correo" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-sm justify-self-start" pendingText="Enviando…">Avísenme</SubmitButton>
    </form>
  );
}
