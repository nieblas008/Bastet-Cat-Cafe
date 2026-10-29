import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Empty, Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { money, shortDate, SPONSORSHIP_STATUS_LABEL, SPONSORSHIP_STATUS_TONE } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Sponsorship, SponsorshipTier } from "@/lib/types";
import { createTier, deleteTier, setSponsorshipStatus, updateTier } from "./actions";

export const metadata = { title: "Apadrinamiento" };

type Row = Sponsorship & {
  profiles: { full_name: string; email: string | null; phone: string | null } | null;
  cats: { name: string } | null;
  sponsorship_tiers: { name: string; monthly_mxn: number } | null;
};

function TierFields({ tier }: { tier?: SponsorshipTier }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="field"><span>Nombre *</span><input className="input" name="name" required maxLength={60} defaultValue={tier?.name} placeholder="Ej. Padrino de croquetas" /></label>
      <label className="field"><span>Monto mensual (MXN) *</span><input className="input" name="monthly_mxn" required inputMode="decimal" defaultValue={tier?.monthly_mxn} /></label>
      <label className="field sm:col-span-2"><span>Descripción</span><input className="input" name="description" maxLength={500} defaultValue={tier?.description ?? ""} /></label>
      <label className="field sm:col-span-2"><span>Qué incluye (uno por línea)</span><textarea className="input" name="perks" rows={3} defaultValue={tier?.perks.join("\n")} /></label>
      <label className="field"><span>Orden</span><input className="input" type="number" name="sort_order" defaultValue={tier?.sort_order ?? 0} /></label>
      {tier && <label className="check self-end"><input type="checkbox" name="visible" defaultChecked={tier.visible} /> Visible en el sitio</label>}
    </div>
  );
}

export default async function Apadrinamiento() {
  const sb = await createClient();
  const [{ data }, { data: tiersData }] = await Promise.all([
    sb.from("sponsorships").select("*, profiles(full_name, email, phone), cats(name), sponsorship_tiers(name, monthly_mxn)").order("created_at", { ascending: false }).limit(300),
    sb.from("sponsorship_tiers").select("*").order("sort_order"),
  ]);
  const rows = (data as Row[]) ?? [];
  const tiers = (tiersData as SponsorshipTier[]) ?? [];
  const pending = rows.filter((r) => r.status === "pendiente");
  const active = rows.filter((r) => r.status === "activa" || r.status === "pausada");
  const ended = rows.filter((r) => r.status === "cancelada");

  const Item = ({ r }: { r: Row }) => (
    <li className="flex flex-wrap items-center gap-3 rounded-[20px] border border-outline-variant bg-white p-4">
      <span className={`chip text-xs ${SPONSORSHIP_STATUS_TONE[r.status]}`}>{SPONSORSHIP_STATUS_LABEL[r.status]}</span>
      <Link href={`/panel/apadrinamiento/${r.id}`} className="min-w-0 flex-1">
        <span className="font-semibold">{r.profiles?.full_name || r.profiles?.email || "Padrino"}</span> apadrina a <span className="font-semibold">{r.cats?.name ?? "—"}</span>
        <span className="block text-sm text-on-surface-variant">
          {r.sponsorship_tiers ? `${r.sponsorship_tiers.name} · ${money(r.sponsorship_tiers.monthly_mxn)}/mes` : "Sin nivel"}
          {r.started_at ? ` · desde ${shortDate(r.started_at)}` : ` · lo pidió el ${shortDate(r.created_at)}`}
          {r.is_gift ? " · 🎁 regalo" : ""}
        </span>
      </Link>
      {r.status === "pendiente" && (
        <form action={setSponsorshipStatus.bind(null, r.id, "activa")}><SubmitButton className="btn btn-sm" pendingText="…"><Icon name="check" size={18} /> Ya pagó: activar</SubmitButton></form>
      )}
      <Link href={`/panel/apadrinamiento/${r.id}`} className="btn btn-outlined btn-sm">Abrir</Link>
    </li>
  );

  return (
    <>
      <PanelTitle
        title="Apadrinamiento"
        intro="Las personas piden apadrinar desde el sitio. Cuando confirmes su primer pago, actívalo: así ven las fotos privadas de su gato."
        action={<Link href="/panel/apadrinamiento/fotos" className="btn btn-tonal btn-sm"><Icon name="upload" size={18} /> Fotos para padrinos</Link>}
      />
      <div className="grid gap-8">
        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Por confirmar ({pending.length})</h2>
          {pending.length === 0 ? <Empty>No hay solicitudes pendientes.</Empty> : <ul className="grid gap-3">{pending.map((r) => <Item key={r.id} r={r} />)}</ul>}
        </section>
        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Activos ({active.length})</h2>
          {active.length === 0 ? <Empty>Todavía no hay padrinos activos.</Empty> : <ul className="grid gap-3">{active.map((r) => <Item key={r.id} r={r} />)}</ul>}
        </section>
        {ended.length > 0 && (
          <details>
            <summary className="font-display cursor-pointer text-lg font-bold">Terminados ({ended.length})</summary>
            <ul className="mt-3 grid gap-3">{ended.map((r) => <Item key={r.id} r={r} />)}</ul>
          </details>
        )}

        <Panel title="Niveles de apadrinamiento">
          {tiers.length === 0 ? (
            <p className="mb-4 text-on-surface-variant">Todavía no hay niveles. Crea al menos uno para que la gente pueda apadrinar.</p>
          ) : (
            <ul className="mb-6 grid gap-3">
              {tiers.map((t) => (
                <li key={t.id} className="rounded-2xl bg-surface-low p-4">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                      <span className="font-semibold">{t.name}</span> · {money(t.monthly_mxn)}/mes {!t.visible && <span className="chip bg-surface-highest text-xs">Oculto</span>}
                      <span className="ml-auto text-sm font-semibold text-primary">Editar</span>
                    </summary>
                    <div className="mt-3 grid gap-3">
                      <ActionForm action={updateTier.bind(null, t.id)} className="grid gap-3">
                        <TierFields tier={t} />
                        <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
                      </ActionForm>
                      <form action={deleteTier.bind(null, t.id)}><ConfirmButton message="¿Borrar el nivel? Los padrinos que lo tengan quedan sin nivel.">Borrar nivel</ConfirmButton></form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
          <h3 className="font-display mb-3 text-lg font-bold">Nuevo nivel</h3>
          <ActionForm action={createTier} resetOnSuccess className="grid gap-3">
            <TierFields />
            <SubmitButton className="btn btn-tonal justify-self-start"><Icon name="plus" /> Crear nivel</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
