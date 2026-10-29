import type { Metadata } from "next";
import { PageHero } from "@/components/site/CatBits";
import { OpenChip } from "@/components/site/OpenChip";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getBlock, getFaqs, getSchedule, getSettings } from "@/lib/data";
import { DAY_NAMES, WEEK_ORDER, telLink, time12, whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Visítanos",
  description: "Horario, ubicación y cómo funciona una visita a Bastet Cat Café en Tijuana.",
};

export default async function VisitPage() {
  const [settings, { week, exceptions }, rules, directions, access, faqs] = await Promise.all([
    getSettings(),
    getSchedule(),
    getBlock("visita_reglas"),
    getBlock("visita_como_llegar"),
    getBlock("visita_accesibilidad"),
    getFaqs("visita"),
  ]);
  const wa = whatsappLink(settings, "¡Hola! Quiero preguntar sobre una visita al café.");
  const hasHours = week.some((d) => d.is_open);

  return (
    <>
      <PageHero eyebrow="Visítanos" title="Ven a conocernos">
        <OpenChip week={week} exceptions={exceptions} className="mt-4 rounded-full bg-surface-mid px-4 py-2" />
      </PageHero>

      <section className="container-site grid gap-6 lg:grid-cols-2">
        <div className="card p-7">
          <h2 className="font-display text-2xl font-extrabold">Horario</h2>
          {hasHours ? (
            <ul className="mt-4 divide-y divide-outline-variant/70">
              {WEEK_ORDER.map((d) => {
                const day = week.find((w) => w.day_of_week === d);
                return (
                  <li key={d} className="flex justify-between gap-4 py-3">
                    <span className="font-semibold">{DAY_NAMES[d]}</span>
                    <span className="text-right">
                      {day?.is_open ? `${time12(day.opens_at)} – ${time12(day.closes_at)}` : "Cerrado"}
                      {day?.note && <span className="block text-xs text-on-surface-variant">{day.note}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-on-surface-variant">Estamos confirmando el horario. Escríbenos antes de venir.</p>
          )}
          {exceptions.length > 0 && (
            <div className="mt-4 rounded-2xl bg-tertiary-container p-4 text-sm text-on-tertiary-container">
              <p className="font-semibold">Días especiales</p>
              <ul className="mt-1">
                {exceptions.map((e) => (
                  <li key={e.date}>
                    {new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${e.date}T12:00:00Z`))}:{" "}
                    {e.is_open ? `${time12(e.opens_at)} – ${time12(e.closes_at)}` : "cerrado"}
                    {e.note ? ` · ${e.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          {settings.maps_embed_url ? (
            <iframe src={settings.maps_embed_url} title="Mapa de Bastet Cat Café" className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="grid h-40 place-items-center bg-surface-mid text-primary/60"><Icon name="map" size={48} /></div>
          )}
          <div className="p-7">
            <h2 className="font-display text-2xl font-extrabold">Dónde estamos</h2>
            <p className="mt-2">{settings.address ?? "Tijuana, Baja California"}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {settings.maps_url && <a href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="btn"><Icon name="map" /> Abrir en Maps</a>}
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outlined"><Icon name="whatsapp" /> WhatsApp</a>}
              {settings.phone && <a href={telLink(settings.phone)!} className="btn btn-text"><Icon name="phone" /> {settings.phone}</a>}
            </div>
            {settings.entry_fee_note && <p className="mt-5 rounded-2xl bg-surface-mid p-4 text-sm">{settings.entry_fee_note}</p>}
          </div>
        </div>
      </section>

      {[rules, directions, access].some(Boolean) && (
        <section className="container-site mt-12 grid gap-6 md:grid-cols-2">
          {[rules, directions, access].filter(Boolean).map((b) => (
            <div key={b!.key} className={`rounded-[28px] p-7 ${b!.key === "visita_reglas" ? "bg-tertiary-container text-on-tertiary-container md:col-span-2" : "bg-surface-mid"}`}>
              <h2 className="font-display text-2xl font-extrabold">{b!.title}</h2>
              <Markdown text={b!.body} className="prose-bastet mt-3 !text-base" />
            </div>
          ))}
        </section>
      )}

      {faqs.length > 0 && (
        <section className="container-site mt-12">
          <h2 className="font-display text-3xl font-extrabold">Preguntas frecuentes</h2>
          <div className="mt-6 grid gap-3">
            {faqs.map((f) => (
              <details key={f.id} className="card p-5">
                <summary className="cursor-pointer font-semibold">{f.question}</summary>
                <Markdown text={f.answer} className="prose-bastet mt-3 !text-base" />
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
