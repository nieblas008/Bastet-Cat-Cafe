import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, dateTime, longDate, todayISO, whatsappLink } from "@/lib/format";
import { isoToTijuanaLocal } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";
import type { AdoptionApplication, ApplicationNote, Profile } from "@/lib/types";
import { addNote, completeAdoption, deleteApplication, deleteNote, updateApplication } from "../actions";

export const metadata = { title: "Solicitud" };

const yn = (v: boolean | null) => (v === true ? "Sí" : v === false ? "No" : "—");
const HOUSING: Record<string, string> = { casa: "Casa", departamento: "Departamento", cuarto: "Cuarto", otro: "Otro" };
const TENURE: Record<string, string> = { propia: "Propia", rentada: "Rentada", familiar: "De la familia" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-on-surface-variant">{label}</dt>
      <dd className="whitespace-pre-line">{value || "—"}</dd>
    </div>
  );
}

export default async function Solicitud({ params }: PageProps<"/panel/solicitudes/[id]">) {
  const { id } = await params;
  const sb = await createClient();
  const [{ data }, { data: notesData }, { data: staffData }, { data: catsData }, { data: adopter }] = await Promise.all([
    sb.from("adoption_applications").select("*, cats(id, name, slug, status)").eq("id", id).maybeSingle(),
    sb.from("application_notes").select("*, profiles(full_name)").eq("application_id", id).order("created_at"),
    sb.from("profiles").select("id, full_name").in("role", ["admin", "staff"]).eq("active", true).order("full_name"),
    sb.from("cats").select("id, name, status").neq("status", "adoptado").order("name"),
    sb.from("adopters").select("id").eq("application_id", id).maybeSingle(),
  ]);
  if (!data) notFound();
  const app = data as AdoptionApplication & { cats: { id: string; name: string; slug: string; status: string } | null };
  const notes = (notesData as (ApplicationNote & { profiles: { full_name: string } | null })[]) ?? [];
  const staff = (staffData as Pick<Profile, "id" | "full_name">[]) ?? [];
  const cats = (catsData as { id: string; name: string; status: string }[]) ?? [];
  if (app.cats && !cats.some((c) => c.id === app.cats!.id)) cats.unshift(app.cats);
  const wa = whatsappLink({ whatsapp_number: app.phone, phone: app.phone }, `Hola ${app.full_name.split(" ")[0]}, te escribimos de Bastet Cat Café por tu solicitud de adopción.`);

  return (
    <>
      <PanelTitle
        title={app.full_name}
        intro={`${app.cats ? `Quiere adoptar a ${app.cats.name}` : "Pide ayuda para elegir gato"} · llegó el ${longDate(app.created_at)}`}
        back={{ href: "/panel/solicitudes", label: "Solicitudes" }}
        action={<span className={`chip ${APPLICATION_STATUS_TONE[app.status]}`}>{APPLICATION_STATUS_LABEL[app.status]}</span>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="grid gap-6">
          <Panel title="Contacto">
            <dl className="divide-y divide-outline-variant">
              <Row label="Teléfono" value={app.phone} />
              <Row label="Correo" value={app.email && <a className="text-primary underline" href={`mailto:${app.email}`}>{app.email}</a>} />
              <Row label="Edad" value={app.age} />
              <Row label="Ciudad / colonia" value={[app.city, app.neighborhood].filter(Boolean).join(" · ")} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm"><Icon name="whatsapp" size={18} /> Escribir por WhatsApp</a>}
              <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="btn btn-outlined btn-sm"><Icon name="phone" size={18} /> Llamar</a>
            </div>
          </Panel>

          <Panel title="Requisitos">
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                ["Identificación oficial", app.has_official_id],
                ["Comprobante de domicilio", app.has_proof_of_address],
                ["Transportadora", app.has_carrier],
                ["Acepta la cuota", app.accepts_fee],
              ].map(([l, v]) => (
                <li key={l as string} className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${v ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}>
                  <Icon name={v ? "check" : "close"} size={18} /> {l}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Hogar y familia">
            <dl className="divide-y divide-outline-variant">
              <Row label="Vivienda" value={[app.housing_type && HOUSING[app.housing_type], app.housing_tenure && TENURE[app.housing_tenure]].filter(Boolean).join(" · ")} />
              <Row label="¿El dueño permite mascotas?" value={yn(app.landlord_allows_pets)} />
              <Row label="Adultos / niños" value={`${app.household_adults ?? "—"} / ${app.household_children ?? "—"}`} />
              <Row label="Edades de los niños" value={app.children_ages} />
              <Row label="Otras mascotas" value={app.other_pets} />
              <Row label="¿Esterilizadas?" value={yn(app.pets_sterilized)} />
              <Row label="Horas solo al día" value={app.hours_alone} />
              <Row label="¿Mudanza en el año?" value={yn(app.planned_move)} />
              <Row label="¿Cambios en casa?" value={yn(app.expecting_family_change)} />
              <Row label="Gatos antes" value={app.previous_cats} />
              <Row label="¿Por qué adoptar?" value={app.why_adopt} />
              <Row label="Algo más" value={app.extra_notes} />
            </dl>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Estado y entrevista">
            <ActionForm action={updateApplication.bind(null, app.id)} className="grid gap-3">
              <label className="field">
                <span>Estado</span>
                <select className="input" name="status" defaultValue={app.status}>
                  {Object.entries(APPLICATION_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Gato</span>
                <select className="input" name="cat_id" defaultValue={app.cat_id ?? ""}>
                  <option value="">Ayúdenme a elegir</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Entrevista (fecha y hora)</span><input className="input" type="datetime-local" name="interview_at" defaultValue={isoToTijuanaLocal(app.interview_at)} /></label>
              <label className="field">
                <span>Quién la lleva</span>
                <select className="input" name="assigned_to" defaultValue={app.assigned_to ?? ""}>
                  <option value="">Nadie todavía</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || "Sin nombre"}</option>)}
                </select>
              </label>
              <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
            </ActionForm>
          </Panel>

          <Panel title="Notas del equipo">
            {notes.length > 0 && (
              <ul className="mb-4 grid gap-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-surface-low p-3">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                      <span>{n.profiles?.full_name || "Equipo"} · {dateTime(n.created_at)}</span>
                      <form action={deleteNote.bind(null, n.id)}><ConfirmButton className="text-xs font-semibold text-error" message="¿Borrar la nota?">Borrar</ConfirmButton></form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={addNote.bind(null, app.id)} resetOnSuccess className="grid gap-3">
              <textarea className="input" name="body" required rows={3} placeholder="Ej. Llamé, entrevista el sábado. Tiene patio cerrado." />
              <SubmitButton className="btn btn-tonal btn-sm justify-self-start">Agregar nota</SubmitButton>
            </ActionForm>
          </Panel>

          <Panel title="Cerrar la adopción">
            {adopter ? (
              <p>
                Ya está registrada. <Link className="font-semibold text-primary underline" href={`/panel/seguimiento/${adopter.id}`}>Ver seguimiento</Link>
              </p>
            ) : (
              <ActionForm action={completeAdoption.bind(null, app.id)} className="grid gap-3">
                <p className="text-sm text-on-surface-variant">Marca al gato como adoptado (suma al contador) y abre su seguimiento.</p>
                <label className="field">
                  <span>Gato adoptado</span>
                  <select className="input" name="cat_id" defaultValue={app.cat_id ?? ""} required>
                    <option value="" disabled>Elige…</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field"><span>Fecha</span><input className="input" type="date" name="adopted_on" defaultValue={todayISO()} /></label>
                  <label className="field"><span>Seguimiento cada (días)</span><input className="input" type="number" name="followup_interval_days" min={1} max={365} defaultValue={7} /></label>
                </div>
                <SubmitButton className="btn justify-self-start"><Icon name="heart" /> Registrar adopción</SubmitButton>
              </ActionForm>
            )}
          </Panel>

          <form action={deleteApplication.bind(null, app.id)}>
            <ConfirmButton message="¿Borrar esta solicitud y sus notas? Hazlo solo si es spam o la persona lo pidió.">
              <Icon name="trash" size={16} /> Borrar solicitud
            </ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
