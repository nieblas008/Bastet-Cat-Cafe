import Link from "next/link";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Empty, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { dateTime, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/lib/types";
import { deleteMessage, setHandled } from "./actions";

export const metadata = { title: "Mensajes" };

const TOPIC: Record<string, string> = {
  general: "General",
  adopcion: "Adopción",
  prensa: "Prensa",
  escuelas: "Escuelas",
  eventos: "Eventos",
  encontre_un_gato: "Encontré un gato",
};

export default async function Mensajes({ searchParams }: PageProps<"/panel/mensajes">) {
  const { ver } = await searchParams;
  const showAll = ver === "todos";
  const sb = await createClient();
  let q = sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (!showAll) q = q.eq("handled", false);
  const [{ data }, { data: interestData }] = await Promise.all([
    q,
    sb.from("cat_interest").select("*, cats(name)").eq("notified", false).order("created_at", { ascending: false }).limit(50),
  ]);
  const msgs = (data as ContactMessage[]) ?? [];
  const interest = (interestData as { id: string; name: string; contact: string; created_at: string; cats: { name: string } | null }[]) ?? [];

  return (
    <>
      <PanelTitle
        title="Mensajes"
        intro="Lo que llega del formulario de contacto. Márcalo como atendido cuando ya respondiste."
        action={<Link href={showAll ? "/panel/mensajes" : "/panel/mensajes?ver=todos"} className="btn btn-text btn-sm">{showAll ? "Solo pendientes" : "Ver todos"}</Link>}
      />
      {msgs.length === 0 ? (
        <Empty>{showAll ? "No hay mensajes." : "Nada pendiente. 🎉"}</Empty>
      ) : (
        <ul className="grid gap-3">
          {msgs.map((m) => {
            const wa = m.phone ? whatsappLink({ whatsapp_number: m.phone, phone: m.phone }, `Hola ${m.name.split(" ")[0]}, te respondemos de Bastet Cat Café.`) : null;
            return (
              <li key={m.id} className={`rounded-[20px] border bg-white p-4 ${m.handled ? "border-outline-variant opacity-70" : "border-primary"}`}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="chip bg-surface-high text-xs">{TOPIC[m.topic] ?? m.topic}</span>
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-on-surface-variant">· {dateTime(m.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line">{m.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outlined btn-sm"><Icon name="whatsapp" size={18} /> {m.phone}</a>}
                  {m.email && <a href={`mailto:${m.email}`} className="btn btn-outlined btn-sm">{m.email}</a>}
                  <form action={setHandled.bind(null, m.id, !m.handled)} className="ml-auto">
                    <SubmitButton className={`btn btn-sm ${m.handled ? "btn-text" : ""}`} pendingText="…">{m.handled ? "Marcar pendiente" : <><Icon name="check" size={18} /> Atendido</>}</SubmitButton>
                  </form>
                  <form action={deleteMessage.bind(null, m.id)}><ConfirmButton className="btn btn-text btn-sm text-error" message="¿Borrar el mensaje?"><Icon name="trash" size={16} /></ConfirmButton></form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {interest.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display mb-1 text-xl font-bold">Avísenme si se libera</h2>
          <p className="mb-3 text-on-surface-variant">Personas interesadas en un gato apartado. Avísales y márcalo desde la ficha del gato.</p>
          <ul className="grid gap-2">
            {interest.map((i) => (
              <li key={i.id} className="rounded-2xl bg-white p-3 text-sm"><span className="font-semibold">{i.name}</span> ({i.contact}) quiere a <span className="font-semibold">{i.cats?.name}</span> · {dateTime(i.created_at)}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
