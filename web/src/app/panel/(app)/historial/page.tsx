import Link from "next/link";
import { Empty, PanelTitle } from "@/components/panel/PanelBits";
import { dateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { AuditEntry } from "@/lib/types";

export const metadata = { title: "Historial" };

const TABLE: Record<string, string> = {
  cats: "Gato", cat_photos: "Foto de gato", cat_groups: "Grupo de gatos", menu_categories: "Categoría del menú", menu_items: "Platillo",
  posts: "Entrada del blog", weekly_schedule: "Horario", schedule_exceptions: "Día especial", site_settings: "Datos del café",
  page_blocks: "Texto del sitio", adoption_requirements: "Requisito", faqs: "Pregunta frecuente", adoption_applications: "Solicitud",
  adopters: "Adopción", sponsorship_tiers: "Nivel de padrino", sponsorships: "Apadrinamiento", sponsorship_payments: "Pago de padrino",
  sponsor_media: "Foto para padrinos", wishlist_items: "Necesidad", awareness_facts: "Dato de concientización",
  sterilization_resources: "Lugar para esterilizar", profiles: "Cuenta",
};
const ACTION = { INSERT: "agregó", UPDATE: "cambió", DELETE: "borró" } as const;
const PAGE = 50;

function describe(changes: Record<string, unknown> | null, action: AuditEntry["action"]) {
  if (!changes || action !== "UPDATE") return null;
  return Object.keys(changes).filter((k) => !["created_at", "updated_at"].includes(k)).slice(0, 6).join(", ");
}

export default async function Historial({ searchParams }: PageProps<"/panel/historial">) {
  const { p, tabla } = await searchParams;
  const page = Math.max(0, Number(p) || 0);
  const sb = await createClient();
  let q = sb.from("audit_log").select("*").order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE);
  if (typeof tabla === "string" && tabla in TABLE) q = q.eq("table_name", tabla);
  const [{ data }, { data: people }] = await Promise.all([q, sb.from("profiles").select("id, full_name, email").in("role", ["admin", "staff"])]);
  const rows = (data as AuditEntry[]) ?? [];
  const hasMore = rows.length > PAGE;
  const names = new Map(((people as { id: string; full_name: string; email: string | null }[]) ?? []).map((x) => [x.id, x.full_name || x.email || "Alguien"]));
  const qs = (n: number) => `/panel/historial?p=${n}${typeof tabla === "string" ? `&tabla=${tabla}` : ""}`;

  return (
    <>
      <PanelTitle title="Historial de cambios" intro="Quién cambió qué y cuándo. Útil si algo desaparece o cambia sin querer." />
      <form className="mb-5 flex flex-wrap items-end gap-2">
        <label className="field"><span>Filtrar</span>
          <select className="input" name="tabla" defaultValue={typeof tabla === "string" ? tabla : ""}>
            <option value="">Todo</option>
            {Object.entries(TABLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <button className="btn btn-tonal btn-sm" type="submit">Ver</button>
      </form>
      {rows.length === 0 ? (
        <Empty>Sin cambios registrados.</Empty>
      ) : (
        <ul className="grid gap-2">
          {rows.slice(0, PAGE).map((r) => {
            const who = r.actor_id ? names.get(r.actor_id) ?? "Una cuenta del sitio" : "El sitio (formulario o sistema)";
            const fields = describe(r.changes, r.action);
            return (
              <li key={r.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                <span className="font-semibold">{who}</span> {ACTION[r.action]} {TABLE[r.table_name]?.toLowerCase() ?? r.table_name}
                {r.summary && <> · <span className="font-semibold">{r.summary}</span></>}
                {fields && <span className="text-on-surface-variant"> ({fields})</span>}
                <span className="block text-xs text-on-surface-variant">{dateTime(r.created_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 flex gap-2">
        {page > 0 && <Link className="btn btn-outlined btn-sm" href={qs(page - 1)}>Más recientes</Link>}
        {hasMore && <Link className="btn btn-outlined btn-sm" href={qs(page + 1)}>Anteriores</Link>}
      </div>
    </>
  );
}
