"use client";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/FormStatus";
import { submitContact } from "../actions";

const TOPICS = [
  ["general", "Pregunta general"],
  ["adopcion", "Adopción"],
  ["escuelas", "Campaña en mi escuela"],
  ["eventos", "Eventos y reuniones privadas"],
  ["prensa", "Prensa o colaboración"],
  ["encontre_un_gato", "Encontré un gato"],
];

export function ContactForm({ defaultTopic = "general" }: { defaultTopic?: string }) {
  const [state, action] = useActionState(submitContact, null);
  return (
    <form action={action} className="card grid gap-4 p-6 md:p-8">
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="field">
        <span>Tema</span>
        <select name="topic" className="input" defaultValue={TOPICS.some(([v]) => v === defaultTopic) ? defaultTopic : "general"}>
          {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="field"><span>Nombre *</span><input className="input" name="name" required maxLength={160} autoComplete="name" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field"><span>Correo</span><input className="input" type="email" name="email" maxLength={200} autoComplete="email" /></label>
        <label className="field"><span>Teléfono</span><input className="input" name="phone" maxLength={30} inputMode="tel" autoComplete="tel" /></label>
      </div>
      <label className="field"><span>Mensaje *</span><textarea className="input" name="message" required maxLength={5000} /></label>
      <FormMessage state={state} />
      <SubmitButton className="btn justify-self-start" pendingText="Enviando…">Enviar mensaje</SubmitButton>
    </form>
  );
}
