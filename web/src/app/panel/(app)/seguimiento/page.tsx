import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { Empty, Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { shortDate, todayISO, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Adopter } from "@/lib/types";
import { createAdopter } from "./actions";
import { AdopterFields } from "./AdopterFields";

export const metadata = { title: "Seguimiento" };

export default async function Seguimiento({ searchParams }: PageProps<"/panel/seguimiento">) {
  const { ver } = await searchParams;
  const showAll = ver === "todos";
  const sb = await createClient();
  let q = sb.from("adopters").select("*").order("next_followup_on", { ascending: true, nullsFirst: false }).limit(300);
  if (!showAll) q = q.eq("followup_active", true);
  const [{ data }, { data: catsData }] = await Promise.all([q, sb.from("cats").select("id, name").order("name")]);
  const adopters = (data as Adopter[]) ?? [];
  const cats = (catsData as { id: string; name: string }[]) ?? [];
  const today = todayISO();
  const due = adopters.filter((a) => a.followup_active && a.next_followup_on && a.next_followup_on <= today);
  const later = adopters.filter((a) => !due.includes(a));

  const Item = ({ a }: { a: Adopter }) => {
    const isDue = due.includes(a);
    const wa = a.phone ? whatsappLink({ whatsapp_number: a.phone, phone: a.phone }, `Hola ${a.full_name.split(" ")[0]}, somos Bastet Cat Café. ¿Cómo va ${a.cat_name ?? "tu gato"} en casa?`) : null;
    return (
      <li className={`flex flex-wrap items-center gap-3 rounded-[20px] border bg-white p-4 ${isDue ? "border-primary" : "border-outline-variant"}`}>
        <Link href={`/panel/seguimiento/${a.id}`} className="min-w-0 flex-1">
          <span className="font-semibold">{a.cat_name ?? "Gato"}</span> con {a.full_name}
          <span className="block text-sm text-on-surface-variant">
            Adoptado el {shortDate(a.adopted_on)} · {a.followup_active ? (a.next_followup_on ? `próximo contacto ${shortDate(a.next_followup_on)}` : "sin fecha") : "seguimiento terminado"}
          </span>
        </Link>
        {isDue && <span className="chip bg-primary text-xs text-on-primary">Toca hoy</span>}
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outlined btn-sm"><Icon name="whatsapp" size={18} /> WhatsApp</a>}
        <Link href={`/panel/seguimiento/${a.id}`} className="btn btn-tonal btn-sm">Registrar contacto</Link>
      </li>
    );
  };

  return (
    <>
      <PanelTitle
        title="Seguimiento de adopciones"
        intro="Después de cada adopción, escribe a la familia cada cierto tiempo. Al registrar un contacto, el siguiente se agenda solo."
        action={<Link href={showAll ? "/panel/seguimiento" : "/panel/seguimiento?ver=todos"} className="btn btn-text btn-sm">{showAll ? "Solo activos" : "Ver todos"}</Link>}
      />
      {adopters.length === 0 ? (
        <Empty>Todavía no hay adopciones registradas. Se agregan solas al cerrar una solicitud, o puedes agregar una aquí abajo.</Empty>
      ) : (
        <div className="grid gap-6">
          {due.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-xl font-bold">Toca contactar ({due.length})</h2>
              <ul className="grid gap-3">{due.map((a) => <Item key={a.id} a={a} />)}</ul>
            </section>
          )}
          {later.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-xl font-bold">Próximos</h2>
              <ul className="grid gap-3">{later.map((a) => <Item key={a.id} a={a} />)}</ul>
            </section>
          )}
        </div>
      )}
      <Panel title="Agregar una adopción de antes" className="mt-8">
        <ActionForm action={createAdopter} className="grid gap-3">
          <AdopterFields cats={cats} />
          <SubmitButton className="btn btn-tonal justify-self-start"><Icon name="plus" /> Agregar</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
