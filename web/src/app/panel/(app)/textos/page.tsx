import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import type { AdoptionRequirement, AwarenessFact, Faq, PageBlock, SterilizationResource } from "@/lib/types";
import { createRow, deleteRow, updateBlock, updateRow } from "./actions";

export const metadata = { title: "Textos del sitio" };

const TABS = [
  ["paginas", "Textos de las páginas"],
  ["requisitos", "Requisitos para adoptar"],
  ["preguntas", "Preguntas frecuentes"],
  ["concientizacion", "Concientización"],
] as const;

const PAGE_NAME: Record<string, [string, string]> = {
  inicio: ["Inicio", "/"],
  nosotros: ["Nosotros", "/nosotros"],
  visitanos: ["Visítanos", "/visitanos"],
  adoptar: ["Adoptar", "/adoptar"],
  concientizacion: ["Concientización", "/concientizacion"],
  apadrina: ["Apadrina", "/apadrina"],
  ayudar: ["Ayudar", "/ayudar"],
  legal: ["Aviso de privacidad", "/aviso-de-privacidad"],
};

const FAQ_TOPIC = { adopcion: "Adopción", visita: "Visita", apadrina: "Apadrina", general: "General" } as const;

const MD_HINT = "Deja una línea en blanco entre párrafos. ## subtítulo, - lista, 1. pasos, **negritas**, [texto](https://enlace).";

function Visible({ value }: { value?: boolean }) {
  return <label className="check"><input type="checkbox" name="visible" defaultChecked={value ?? true} /> Visible</label>;
}
function Order({ value }: { value?: number }) {
  return <label className="field"><span>Orden</span><input className="input" type="number" name="sort_order" defaultValue={value ?? 0} /></label>;
}

/** Lista editable genérica: cada fila se abre para editar; abajo, el formulario para agregar. */
function ListEditor<T extends { id: string }>({
  table,
  rows,
  title,
  summary,
  fields,
  addLabel,
}: {
  table: Parameters<typeof createRow>[0];
  rows: T[];
  title: string;
  summary: (r: T) => React.ReactNode;
  fields: (r?: T) => React.ReactNode;
  addLabel: string;
}) {
  return (
    <Panel title={title}>
      <ul className="mb-6 grid gap-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-surface-low p-3">
            <details>
              <summary className="flex cursor-pointer items-start gap-2">
                <span className="flex-1">{summary(r)}</span>
                <span className="text-sm font-semibold text-primary">Editar</span>
              </summary>
              <div className="mt-3 grid gap-3">
                <ActionForm action={updateRow.bind(null, table, r.id)} className="grid gap-3">
                  {fields(r)}
                  <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
                </ActionForm>
                <form action={deleteRow.bind(null, table, r.id)}><ConfirmButton>Borrar</ConfirmButton></form>
              </div>
            </details>
          </li>
        ))}
      </ul>
      <h3 className="font-display mb-3 text-lg font-bold">{addLabel}</h3>
      <ActionForm action={createRow.bind(null, table)} resetOnSuccess className="grid gap-3">
        {fields()}
        <SubmitButton className="btn btn-tonal justify-self-start"><Icon name="plus" /> Agregar</SubmitButton>
      </ActionForm>
    </Panel>
  );
}

export default async function Textos({ searchParams }: PageProps<"/panel/textos">) {
  const { seccion } = await searchParams;
  const tab = TABS.some(([v]) => v === seccion) ? (seccion as string) : "paginas";
  const sb = await createClient();

  let content: React.ReactNode = null;

  if (tab === "paginas") {
    const { data } = await sb.from("page_blocks").select("*").order("page").order("sort_order");
    const blocks = (data as PageBlock[]) ?? [];
    const pages = [...new Set(blocks.map((b) => b.page))].sort((a, b) => Object.keys(PAGE_NAME).indexOf(a) - Object.keys(PAGE_NAME).indexOf(b));
    content = (
      <div className="grid gap-6">
        <p className="rounded-2xl bg-tertiary-container px-4 py-3 text-on-tertiary-container">Un bloque sin texto no se muestra en el sitio. Llénalos cuando tengan la información confirmada.</p>
        {pages.map((p) => (
          <Panel key={p}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold">{PAGE_NAME[p]?.[0] ?? p}</h2>
              {PAGE_NAME[p] && <Link href={PAGE_NAME[p][1]} target="_blank" className="btn btn-text btn-sm"><Icon name="eye" size={18} /> Ver</Link>}
            </div>
            <div className="grid gap-3">
              {blocks.filter((b) => b.page === p).map((b) => (
                <details key={b.key} className="rounded-2xl bg-surface-low p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                    <span className="flex-1 font-semibold">{b.label}</span>
                    {!b.body.trim() ? <span className="chip bg-surface-highest text-xs">Vacío · no se muestra</span> : !b.visible ? <span className="chip bg-surface-highest text-xs">Oculto</span> : null}
                    <span className="text-sm font-semibold text-primary">Editar</span>
                  </summary>
                  <ActionForm action={updateBlock.bind(null, b.key)} className="mt-3 grid gap-3">
                    <label className="field"><span>Título</span><input className="input" name="title" maxLength={200} defaultValue={b.title ?? ""} /></label>
                    <label className="field">
                      <span>Texto</span>
                      <textarea className="input min-h-[180px]" name="body" defaultValue={b.body} />
                      <span className="hint">{MD_HINT}</span>
                    </label>
                    <Visible value={b.visible} />
                    <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
                  </ActionForm>
                </details>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    );
  } else if (tab === "requisitos") {
    const { data } = await sb.from("adoption_requirements").select("*").order("sort_order");
    content = (
      <ListEditor<AdoptionRequirement>
        table="adoption_requirements"
        rows={(data as AdoptionRequirement[]) ?? []}
        title="Requisitos para adoptar"
        addLabel="Nuevo requisito"
        summary={(r) => <span className="font-semibold">{r.title}</span>}
        fields={(r) => (
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <label className="field"><span>Requisito *</span><input className="input" name="title" required maxLength={200} defaultValue={r?.title} /></label>
            <Order value={r?.sort_order} />
            <label className="field sm:col-span-2"><span>Detalle</span><input className="input" name="description" maxLength={1000} defaultValue={r?.description ?? ""} /></label>
          </div>
        )}
      />
    );
  } else if (tab === "preguntas") {
    const { data } = await sb.from("faqs").select("*").order("topic").order("sort_order");
    content = (
      <ListEditor<Faq>
        table="faqs"
        rows={(data as Faq[]) ?? []}
        title="Preguntas frecuentes"
        addLabel="Nueva pregunta"
        summary={(r) => <><span className="chip mr-2 bg-surface-high text-xs">{FAQ_TOPIC[r.topic]}</span><span className="font-semibold">{r.question}</span>{!r.visible && " (oculta)"}</>}
        fields={(r) => (
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px]">
            <label className="field"><span>Pregunta *</span><input className="input" name="question" required maxLength={300} defaultValue={r?.question} /></label>
            <label className="field"><span>Tema</span><select className="input" name="topic" defaultValue={r?.topic ?? "adopcion"}>{Object.entries(FAQ_TOPIC).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <Order value={r?.sort_order} />
            <label className="field sm:col-span-3"><span>Respuesta *</span><textarea className="input" name="answer" required rows={3} defaultValue={r?.answer} /><span className="hint">{MD_HINT}</span></label>
            <Visible value={r?.visible} />
          </div>
        )}
      />
    );
  } else {
    const [{ data: facts }, { data: res }] = await Promise.all([
      sb.from("awareness_facts").select("*").order("sort_order"),
      sb.from("sterilization_resources").select("*").order("sort_order"),
    ]);
    content = (
      <div className="grid gap-6">
        <ListEditor<AwarenessFact>
          table="awareness_facts"
          rows={(facts as AwarenessFact[]) ?? []}
          title="Datos sobre esterilización"
          addLabel="Nuevo dato"
          summary={(r) => <><span className="font-semibold">{r.headline}</span>{!r.visible && " (oculto)"}</>}
          fields={(r) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <label className="field"><span>Dato *</span><input className="input" name="headline" required maxLength={200} defaultValue={r?.headline} /></label>
              <Order value={r?.sort_order} />
              <label className="field sm:col-span-2"><span>Explicación</span><textarea className="input" name="body" rows={2} maxLength={2000} defaultValue={r?.body ?? ""} /></label>
              <label className="field sm:col-span-2"><span>Fuente</span><input className="input" name="source" maxLength={300} defaultValue={r?.source ?? ""} /></label>
              <Visible value={r?.visible} />
            </div>
          )}
        />
        <ListEditor<SterilizationResource>
          table="sterilization_resources"
          rows={(res as SterilizationResource[]) ?? []}
          title="Dónde esterilizar a bajo costo"
          addLabel="Nuevo lugar"
          summary={(r) => <><span className="font-semibold">{r.name}</span>{!r.visible && " (oculto)"}</>}
          fields={(r) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Nombre *</span><input className="input" name="name" required maxLength={160} defaultValue={r?.name} /></label>
              <label className="field"><span>Teléfono</span><input className="input" name="phone" maxLength={40} defaultValue={r?.phone ?? ""} /></label>
              <label className="field"><span>Dirección</span><input className="input" name="address" maxLength={300} defaultValue={r?.address ?? ""} /></label>
              <label className="field"><span>Enlace</span><input className="input" name="url" maxLength={500} defaultValue={r?.url ?? ""} placeholder="https://" /></label>
              <label className="field sm:col-span-2"><span>Notas (costo, días, requisitos)</span><input className="input" name="notes" maxLength={1000} defaultValue={r?.notes ?? ""} /></label>
              <Order value={r?.sort_order} />
              <Visible value={r?.visible} />
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <>
      <PanelTitle title="Textos del sitio" intro="Todo lo que dice el sitio, sin tocar código. Los cambios se ven al guardar." />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Secciones">
        {TABS.map(([v, l]) => (
          <Link key={v} href={`/panel/textos?seccion=${v}`} className={`chip min-h-10 border ${tab === v ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>{l}</Link>
        ))}
      </nav>
      {content}
    </>
  );
}
