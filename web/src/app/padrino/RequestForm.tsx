"use client";
import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/FormStatus";
import { money } from "@/lib/format";
import type { SponsorshipTier } from "@/lib/types";
import { requestSponsorship } from "./actions";

export function RequestForm({ cats, tiers, cat, tier }: { cats: { id: string; name: string; slug: string }[]; tiers: SponsorshipTier[]; cat?: string; tier?: string }) {
  const [state, action] = useActionState(requestSponsorship, null);
  const [show, setShow] = useState(false);
  const [gift, setGift] = useState(false);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-4">
      <label className="field">
        <span>Tu michi</span>
        <select className="input" name="cat_id" required defaultValue={cat ?? ""}>
          <option value="" disabled>Elige…</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <fieldset className="grid gap-2">
        <legend className="field-label mb-1">Cómo quieres apoyar</legend>
        {tiers.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-outline-variant bg-white p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-container/40">
            <input type="radio" name="tier_id" value={t.id} required defaultChecked={t.id === tier} className="mt-1" />
            <span>
              <span className="font-semibold">{t.name}</span> · {money(t.monthly_mxn)} al mes
              {t.description && <span className="block text-sm text-on-surface-variant">{t.description}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span>Forma de pago</span>
        <select className="input" name="payment_method" defaultValue="transferencia">
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo en el café</option>
        </select>
      </label>
      <label className="check"><input type="checkbox" name="show_publicly" checked={show} onChange={(e) => setShow(e.target.checked)} /> Quiero aparecer en el muro de padrinos</label>
      {show && <label className="field"><span>Nombre para el muro</span><input className="input" name="public_name" maxLength={80} placeholder="Ej. Ana G." /></label>}
      <label className="check"><input type="checkbox" name="is_gift" checked={gift} onChange={(e) => setGift(e.target.checked)} /> Es un regalo para alguien</label>
      {gift && <label className="field"><span>¿Para quién?</span><input className="input" name="gift_recipient" maxLength={120} /></label>}
      <FormMessage state={state} />
      <SubmitButton className="btn justify-self-start" pendingText="Enviando…">Quiero apadrinar</SubmitButton>
    </form>
  );
}
