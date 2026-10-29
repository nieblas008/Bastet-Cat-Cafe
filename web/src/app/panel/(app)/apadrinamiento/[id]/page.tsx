import { notFound } from "next/navigation";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { longDate, money, PAYMENT_METHOD_LABEL, SPONSORSHIP_STATUS_LABEL, SPONSORSHIP_STATUS_TONE, todayISO, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Sponsorship, SponsorshipPayment, SponsorshipTier } from "@/lib/types";
import { addPayment, deletePayment, deleteSponsorship, updateSponsorship } from "../actions";

export const metadata = { title: "Padrino" };

export default async function PadrinoDetalle({ params }: PageProps<"/panel/apadrinamiento/[id]">) {
  const { id } = await params;
  const sb = await createClient();
  const [{ data }, { data: paymentsData }, { data: tiersData }] = await Promise.all([
    sb.from("sponsorships").select("*, profiles(full_name, email, phone), cats(name, slug)").eq("id", id).maybeSingle(),
    sb.from("sponsorship_payments").select("*").eq("sponsorship_id", id).order("paid_on", { ascending: false }),
    sb.from("sponsorship_tiers").select("*").order("sort_order"),
  ]);
  if (!data) notFound();
  const s = data as Sponsorship & { profiles: { full_name: string; email: string | null; phone: string | null } | null; cats: { name: string; slug: string } | null };
  const payments = (paymentsData as SponsorshipPayment[]) ?? [];
  const tiers = (tiersData as SponsorshipTier[]) ?? [];
  const tier = tiers.find((t) => t.id === s.tier_id);
  const total = payments.reduce((sum, p) => sum + Number(p.amount_mxn), 0);
  const name = s.profiles?.full_name || s.profiles?.email || "Padrino";
  const wa = s.profiles?.phone ? whatsappLink({ whatsapp_number: s.profiles.phone, phone: s.profiles.phone }, `Hola ${name.split(" ")[0]}, te escribimos de Bastet Cat Café sobre tu apadrinamiento de ${s.cats?.name ?? "tu gato"}.`) : null;

  return (
    <>
      <PanelTitle
        title={`${name} → ${s.cats?.name ?? "gato"}`}
        intro={[s.profiles?.email, s.profiles?.phone].filter(Boolean).join(" · ")}
        back={{ href: "/panel/apadrinamiento", label: "Apadrinamiento" }}
        action={<span className={`chip ${SPONSORSHIP_STATUS_TONE[s.status]}`}>{SPONSORSHIP_STATUS_LABEL[s.status]}</span>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-6">
          <Panel title="Pagos">
            <p className="mb-4 text-on-surface-variant">
              {payments.length} {payments.length === 1 ? "pago" : "pagos"} · {money(total)} en total{tier ? ` · cuota ${money(tier.monthly_mxn)}/mes` : ""}
            </p>
            {payments.length > 0 && (
              <ul className="mb-5 divide-y divide-outline-variant">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="font-semibold">{money(p.amount_mxn)}</span>
                    <span className="flex-1 text-sm text-on-surface-variant">{longDate(p.paid_on)} · {PAYMENT_METHOD_LABEL[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                    <form action={deletePayment.bind(null, p.id)}><ConfirmButton className="text-xs font-semibold text-error" message="¿Borrar este pago?">Borrar</ConfirmButton></form>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={addPayment.bind(null, s.id)} resetOnSuccess className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field"><span>Monto (MXN)</span><input className="input" name="amount_mxn" required inputMode="decimal" defaultValue={tier?.monthly_mxn} /></label>
                <label className="field"><span>Fecha</span><input className="input" type="date" name="paid_on" defaultValue={todayISO()} /></label>
                <label className="field"><span>Método</span><select className="input" name="method" defaultValue={s.payment_method}>{Object.entries(PAYMENT_METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label className="field"><span>Referencia</span><input className="input" name="reference" maxLength={120} placeholder="Folio o nota" /></label>
              </div>
              <SubmitButton className="btn btn-tonal btn-sm justify-self-start"><Icon name="plus" size={18} /> Registrar pago</SubmitButton>
            </ActionForm>
          </Panel>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outlined justify-self-start"><Icon name="whatsapp" /> Escribirle por WhatsApp</a>}
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Datos del apadrinamiento">
            <ActionForm action={updateSponsorship.bind(null, s.id)} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field"><span>Estado</span><select className="input" name="status" defaultValue={s.status}>{Object.entries(SPONSORSHIP_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label className="field"><span>Nivel</span><select className="input" name="tier_id" defaultValue={s.tier_id ?? ""}><option value="">Sin nivel</option>{tiers.map((t) => <option key={t.id} value={t.id}>{t.name} · {money(t.monthly_mxn)}</option>)}</select></label>
                <label className="field"><span>Forma de pago</span><select className="input" name="payment_method" defaultValue={s.payment_method}>{Object.entries(PAYMENT_METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label className="field"><span>Desde</span><input className="input" type="date" name="started_at" defaultValue={s.started_at ?? ""} /></label>
                <label className="field"><span>Hasta</span><input className="input" type="date" name="ended_at" defaultValue={s.ended_at ?? ""} /></label>
                <label className="field"><span>Nombre en el muro</span><input className="input" name="public_name" maxLength={80} defaultValue={s.public_name ?? ""} /></label>
              </div>
              <label className="check"><input type="checkbox" name="show_publicly" defaultChecked={s.show_publicly} /> Aceptó aparecer en el muro de padrinos</label>
              <label className="check"><input type="checkbox" name="is_gift" defaultChecked={s.is_gift} /> Es un regalo</label>
              <label className="field"><span>Para quién es el regalo</span><input className="input" name="gift_recipient" maxLength={120} defaultValue={s.gift_recipient ?? ""} /></label>
              <label className="field"><span>Notas internas</span><textarea className="input" name="notes" rows={3} defaultValue={s.notes ?? ""} /></label>
              <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
            </ActionForm>
          </Panel>
          <form action={deleteSponsorship.bind(null, s.id)}>
            <ConfirmButton message="¿Borrar el apadrinamiento y sus pagos? Mejor márcalo como Terminado si solo dejó de apoyar."><Icon name="trash" size={16} /> Borrar</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
