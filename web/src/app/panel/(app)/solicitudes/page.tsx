import Link from "next/link";
import { Empty, PanelTitle } from "@/components/panel/PanelBits";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE as STATUS_TONE, dateTime, shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { AdoptionApplication } from "@/lib/types";

export const metadata = { title: "Solicitudes" };


const FILTERS: [string, string][] = [
  ["abiertas", "Abiertas"],
  ["nueva", "Nuevas"],
  ["en_entrevista", "En entrevista"],
  ["aprobada", "Aprobadas"],
  ["cerradas", "Cerradas"],
  ["todas", "Todas"],
];

export default async function Solicitudes({ searchParams }: PageProps<"/panel/solicitudes">) {
  const { estado: raw } = await searchParams;
  const estado = typeof raw === "string" ? raw : "abiertas";
  const sb = await createClient();
  let q = sb.from("adoption_applications").select("*, cats(name, slug)").order("created_at", { ascending: false }).limit(200);
  if (estado === "abiertas") q = q.in("status", ["nueva", "en_entrevista", "aprobada"]);
  else if (estado === "cerradas") q = q.in("status", ["rechazada", "adoptada", "cancelada"]);
  else if (estado in APPLICATION_STATUS_LABEL) q = q.eq("status", estado);
  const { data } = await q;
  const apps = (data as (AdoptionApplication & { cats: { name: string; slug: string } | null })[]) ?? [];

  return (
    <>
      <PanelTitle title="Solicitudes de adopción" intro="Lo que llega del formulario del sitio. Abre una para ver sus respuestas, agendar la entrevista y dejar notas." />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filtrar">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={`/panel/solicitudes?estado=${v}`} className={`chip min-h-10 border ${estado === v ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>
            {l}
          </Link>
        ))}
      </nav>
      {apps.length === 0 ? (
        <Empty>No hay solicitudes aquí.</Empty>
      ) : (
        <ul className="grid gap-3">
          {apps.map((a) => (
            <li key={a.id}>
              <Link href={`/panel/solicitudes/${a.id}`} className="flex flex-wrap items-center gap-3 rounded-[20px] border border-outline-variant bg-white p-4 hover:border-primary">
                <span className={`chip text-xs ${STATUS_TONE[a.status]}`}>{APPLICATION_STATUS_LABEL[a.status]}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{a.full_name}</span>
                  <span className="block text-sm text-on-surface-variant">
                    {a.cats?.name ? `Quiere a ${a.cats.name}` : "Pide ayuda para elegir"} · {a.phone}
                  </span>
                </span>
                <span className="text-right text-sm text-on-surface-variant">
                  {a.interview_at ? <>Entrevista: {dateTime(a.interview_at)}</> : <>Llegó el {shortDate(a.created_at)}</>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
