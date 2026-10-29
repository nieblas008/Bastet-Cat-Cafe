import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { dateTime, FOLLOWUP_CHANNEL_LABEL, FOLLOWUP_OUTCOME_LABEL, longDate, whatsappLink } from "@/lib/format";
import { isoToTijuanaLocal } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";
import type { Adopter, FollowupContact } from "@/lib/types";
import { deleteAdopter, deleteContact, logContact, updateAdopter } from "../actions";
import { AdopterFields } from "../AdopterFields";

export const metadata = { title: "Seguimiento" };

const OUTCOME_TONE: Record<string, string> = {
  todo_bien: "bg-success-container text-on-success-container",
  atencion: "bg-tertiary-container text-on-tertiary-container",
  sin_respuesta: "bg-surface-highest text-on-surface-variant",
  devolucion: "bg-error-container text-on-error-container",
};

export default async function SeguimientoDetalle({ params, searchParams }: PageProps<"/panel/seguimiento/[id]">) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const sb = await createClient();
  const [{ data }, { data: contactsData }, { data: catsData }] = await Promise.all([
    sb.from("adopters").select("*").eq("id", id).maybeSingle(),
    sb.from("followup_contacts").select("*, profiles(full_name)").eq("adopter_id", id).order("contacted_at", { ascending: false }),
    sb.from("cats").select("id, name").order("name"),
  ]);
  if (!data) notFound();
  const a = data as Adopter;
  const contacts = (contactsData as (FollowupContact & { profiles: { full_name: string } | null })[]) ?? [];
  const cats = (catsData as { id: string; name: string }[]) ?? [];
  const wa = a.phone ? whatsappLink({ whatsapp_number: a.phone, phone: a.phone }, `Hola ${a.full_name.split(" ")[0]}, somos Bastet Cat Café. ¿Cómo va ${a.cat_name ?? "tu gato"} en casa?`) : null;

  return (
    <>
      <PanelTitle
        title={`${a.cat_name ?? "Gato"} con ${a.full_name}`}
        intro={`Adoptado el ${longDate(a.adopted_on)}${a.followup_active && a.next_followup_on ? ` · próximo contacto: ${longDate(a.next_followup_on)}` : ""}`}
        back={{ href: "/panel/seguimiento", label: "Seguimiento" }}
        action={wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm"><Icon name="whatsapp" size={18} /> Escribir</a>}
      />
      {nuevo && <p className="mb-6 rounded-2xl bg-success-container px-4 py-3 font-semibold text-on-success-container">¡Adopción registrada! Ya cuenta en el contador del sitio.</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-6">
          <Panel title="Registrar un contacto">
            <ActionForm action={logContact.bind(null, a.id)} resetOnSuccess className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="field"><span>Cuándo</span><input className="input" type="datetime-local" name="contacted_at" defaultValue={isoToTijuanaLocal(new Date().toISOString())} /></label>
                <label className="field"><span>Por dónde</span><select className="input" name="channel">{Object.entries(FOLLOWUP_CHANNEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label className="field"><span>¿Cómo va?</span><select className="input" name="outcome">{Object.entries(FOLLOWUP_OUTCOME_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              </div>
              <textarea className="input" name="notes" rows={3} placeholder="Ej. Ya come bien y duerme en la cama. Mandaron foto." />
              <SubmitButton className="btn justify-self-start"><Icon name="check" /> Guardar contacto</SubmitButton>
            </ActionForm>
          </Panel>

          <Panel title="Historial">
            {contacts.length === 0 ? (
              <p className="text-on-surface-variant">Todavía no hay contactos registrados.</p>
            ) : (
              <ol className="grid gap-3">
                {contacts.map((c) => (
                  <li key={c.id} className="rounded-2xl bg-surface-low p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={`chip text-xs ${OUTCOME_TONE[c.outcome]}`}>{FOLLOWUP_OUTCOME_LABEL[c.outcome]}</span>
                      <span className="text-on-surface-variant">{dateTime(c.contacted_at)} · {FOLLOWUP_CHANNEL_LABEL[c.channel]} · {c.profiles?.full_name || "Equipo"}</span>
                      <form action={deleteContact.bind(null, c.id)} className="ml-auto"><ConfirmButton className="text-xs font-semibold text-error" message="¿Borrar este contacto?">Borrar</ConfirmButton></form>
                    </div>
                    {c.notes && <p className="mt-2 whitespace-pre-line">{c.notes}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Datos">
            <ActionForm action={updateAdopter.bind(null, a.id)} className="grid gap-3">
              <AdopterFields adopter={a} cats={cats} />
              <label className="field"><span>Próximo contacto</span><input className="input" type="date" name="next_followup_on" defaultValue={a.next_followup_on ?? ""} /></label>
              <label className="check"><input type="checkbox" name="followup_active" defaultChecked={a.followup_active} /> Seguir contactando</label>
              <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
            </ActionForm>
            {a.application_id && <Link href={`/panel/solicitudes/${a.application_id}`} className="mt-4 inline-block text-sm font-semibold text-primary underline">Ver la solicitud original</Link>}
          </Panel>
          <form action={deleteAdopter.bind(null, a.id)}>
            <ConfirmButton message="¿Borrar este registro y su historial? (No cambia el contador.)"><Icon name="trash" size={16} /> Borrar registro</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
