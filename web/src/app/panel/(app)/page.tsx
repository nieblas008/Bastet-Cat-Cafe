import Link from "next/link";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { Icon } from "@/components/ui/Icon";
import { requireStaff } from "@/lib/auth";
import { APPLICATION_STATUS_LABEL, CAT_STATUS, dateTime, number, shortDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CatStatus } from "@/lib/types";

export const metadata = { title: "Inicio" };

export default async function PanelHome({ searchParams }: PageProps<"/panel">) {
  const { aviso } = await searchParams;
  const profile = await requireStaff();
  const sb = await createClient();
  const monthStart = `${todayISO().slice(0, 7)}-01`;

  const [{ data: cats }, { data: apps }, { count: appsMonth }, { data: followups }, { data: settings }, { data: schedule }] = await Promise.all([
    sb.from("cats").select("status, published"),
    sb.from("adoption_applications").select("id, full_name, status, created_at, cats(name)").in("status", ["nueva", "en_entrevista"]).order("created_at", { ascending: false }).limit(6),
    sb.from("adoption_applications").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    sb.from("adopters").select("id, full_name, cat_name, next_followup_on, cats(name)").eq("followup_active", true).lte("next_followup_on", todayISO()).order("next_followup_on").limit(6),
    sb.from("site_settings").select("adoptions_count, adoptions_goal").eq("id", 1).single(),
    sb.from("weekly_schedule").select("is_open"),
  ]);

  const counts = (cats ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    if (!c.published) acc.borrador = (acc.borrador ?? 0) + 1;
    return acc;
  }, {});
  const noSchedule = !(schedule ?? []).some((d) => d.is_open);

  return (
    <>
      <PanelTitle title={`Hola${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} intro="Lo más usado está aquí. Todo lo que guardes se publica al instante." />
      {aviso === "solo-admin" && <p className="mb-4 rounded-2xl bg-tertiary-container p-4 text-sm text-on-tertiary-container">Esa sección es solo para administradoras.</p>}
      {noSchedule && (
        <Link href="/panel/horario" className="mb-4 flex items-center gap-3 rounded-2xl bg-error-container p-4 text-on-error-container">
          <Icon name="clock" /> <span className="flex-1 font-semibold">Todavía no hay horario. Captúralo para que el sitio diga si están abiertos.</span> <Icon name="arrow" />
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/panel/gatos/nuevo" className="btn !min-h-16 !justify-start !rounded-[20px] !px-5"><Icon name="plus" /> Dar de alta un gato</Link>
        <Link href="/panel/horario" className="btn btn-tonal !min-h-16 !justify-start !rounded-[20px] !px-5"><Icon name="clock" /> Horario de la semana</Link>
        <Link href="/panel/menu" className="btn btn-tonal !min-h-16 !justify-start !rounded-[20px] !px-5"><Icon name="coffee" /> Menú y agotados</Link>
        <Link href="/panel/blog/nuevo" className="btn btn-tonal !min-h-16 !justify-start !rounded-[20px] !px-5"><Icon name="book" /> Nueva publicación</Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Gatos">
          <ul className="grid gap-2">
            {(Object.keys(CAT_STATUS) as CatStatus[]).map((s) => (
              <li key={s} className="flex justify-between">
                <Link href={`/panel/gatos?estado=${s}`} className="hover:underline">{CAT_STATUS[s].label}</Link>
                <span className="font-display text-lg font-bold">{counts[s] ?? 0}</span>
              </li>
            ))}
            {counts.borrador ? <li className="flex justify-between text-on-surface-variant"><span>Borradores sin publicar</span><span className="font-bold">{counts.borrador}</span></li> : null}
          </ul>
          {settings && (
            <p className="mt-4 rounded-2xl bg-primary-container p-3 text-sm text-on-primary-container">
              Contador: <strong>{number(settings.adoptions_count)}</strong> de {number(settings.adoptions_goal)} adopciones
            </p>
          )}
        </Panel>

        <Panel title={`Solicitudes por atender · ${appsMonth ?? 0} este mes`}>
          {apps?.length ? (
            <ul className="divide-y divide-outline-variant">
              {apps.map((a) => (
                <li key={a.id}>
                  <Link href={`/panel/solicitudes/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:underline">
                    <span>
                      <span className="font-semibold">{a.full_name}</span>
                      <span className="block text-xs text-on-surface-variant">
                        {(a.cats as unknown as { name: string } | null)?.name ?? "Sin gato elegido"} · {dateTime(a.created_at)}
                      </span>
                    </span>
                    <span className={`chip ${a.status === "nueva" ? "bg-primary text-on-primary" : "bg-tertiary-container text-on-tertiary-container"}`}>
                      {APPLICATION_STATUS_LABEL[a.status as keyof typeof APPLICATION_STATUS_LABEL]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant">Nada pendiente.</p>
          )}
          <Link href="/panel/solicitudes" className="btn btn-text btn-sm mt-2">Ver todas</Link>
        </Panel>

        <Panel title="Seguimiento: toca contactar">
          {followups?.length ? (
            <ul className="divide-y divide-outline-variant">
              {followups.map((a) => (
                <li key={a.id}>
                  <Link href={`/panel/seguimiento/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:underline">
                    <span>
                      <span className="font-semibold">{a.full_name}</span>
                      <span className="block text-xs text-on-surface-variant">{(a.cats as unknown as { name: string } | null)?.name ?? a.cat_name ?? ""}</span>
                    </span>
                    <span className="text-xs">{shortDate(a.next_followup_on)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant">Nadie pendiente hoy.</p>
          )}
          <Link href="/panel/seguimiento" className="btn btn-text btn-sm mt-2">Ver seguimiento</Link>
        </Panel>
      </div>
    </>
  );
}
