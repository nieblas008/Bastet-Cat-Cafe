import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getBlock, getFaqs, getRequirements, getSettings } from "@/lib/data";
import { money, whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cómo adoptar",
  description: "Requisitos, cuota de recuperación y proceso para adoptar un gato en Bastet Cat Café, Tijuana.",
};

export default async function AdoptPage() {
  const [settings, requirements, faqs, intro, process, grace, followup] = await Promise.all([
    getSettings(),
    getRequirements(),
    getFaqs("adopcion"),
    getBlock("adoptar_intro"),
    getBlock("adoptar_proceso"),
    getBlock("adoptar_periodo_gracia"),
    getBlock("adoptar_seguimiento"),
  ]);
  const wa = whatsappLink(settings, "¡Hola! Quiero iniciar un proceso de adopción.");
  const visibleReqs = settings.show_adoption_fee ? requirements : requirements.filter((r) => !/cuota/i.test(r.title));

  return (
    <>
      <PageHero eyebrow="Adopción" title={intro?.title ?? "Adoptar en Bastet"} intro={null}>
        {intro && <Markdown text={intro.body} className="prose-bastet mt-4 max-w-2xl !text-lg text-on-surface-variant" />}
      </PageHero>

      <section className="container-site grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card p-7 md:p-9">
          <h2 className="font-display text-3xl font-extrabold">Los requisitos</h2>
          <p className="mt-2 text-on-surface-variant">Tenlos listos antes de la entrevista. Así todo es más rápido.</p>
          <ol className="mt-6 grid gap-3">
            {visibleReqs.map((r, i) => (
              <li key={r.id} className="flex gap-4 rounded-[20px] bg-surface-low p-4">
                <span className="font-display grid size-10 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-on-primary">{i + 1}</span>
                <span>
                  <span className="font-semibold">{r.title}</span>
                  {r.description && <span className="block text-sm text-on-surface-variant">{r.description}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid content-start gap-6">
          {settings.show_adoption_fee && (
            <div className="rounded-[28px] bg-primary-container p-7 text-on-primary-container">
              <p className="text-xs font-bold uppercase tracking-[.14em]">Cuota de recuperación</p>
              <p className="font-display mt-2 text-5xl font-extrabold">{money(settings.adoption_fee_mxn)}</p>
              <p className="mt-3">
                No es una venta. Cubre lo que el café ya invirtió en el gato desde que llegó: vacunas, esterilización, desparasitación y baños.
              </p>
            </div>
          )}
          <div className="rounded-[28px] bg-surface-mid p-7">
            <h2 className="font-display text-2xl font-extrabold">¿Listo?</h2>
            <p className="mt-2 text-on-surface-variant">
              {settings.adoption_response_days
                ? `Te respondemos en un máximo de ${settings.adoption_response_days} ${settings.adoption_response_days === 1 ? "día" : "días"}.`
                : "Te contactamos para agendar la entrevista."}
            </p>
            <div className="mt-5 grid gap-3">
              {settings.online_applications && (
                <Link href="/adoptar/solicitud" className="btn">
                  <Icon name="heart" /> Llenar la solicitud en línea
                </Link>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={settings.online_applications ? "btn btn-outlined" : "btn"}>
                  <Icon name="whatsapp" /> Empezar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-site mt-16">
        <h2 className="font-display text-3xl font-extrabold">{process?.title ?? "Así es el proceso"}</h2>
        {process ? (
          <Markdown text={process.body} className="prose-bastet mt-4 max-w-3xl" />
        ) : (
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["Solicitud", "En línea o por WhatsApp. Puedes elegir un gato o pedirnos que te ayudemos a encontrar uno."],
              ["Entrevista", "Dura de 30 a 40 minutos. Buscamos un hogar que aguante los años que vienen: mudanzas, bebés, otras mascotas."],
              ["Requisitos", "Traes identificación, comprobante de domicilio, transportadora y la cuota."],
              ["Mismo día", "Si todo está en orden, tu gato se va contigo ese mismo día."],
            ].map(([t, d], i) => (
              <li key={t} className="card p-5">
                <p className="text-sm font-bold text-primary">Paso {i + 1}</p>
                <p className="font-display mt-1 text-lg font-bold">{t}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{d}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {(grace || followup) && (
        <section className="container-site mt-12 grid gap-6 md:grid-cols-2">
          {[grace, followup].filter(Boolean).map((b) => (
            <div key={b!.key} className="rounded-[28px] bg-tertiary-container p-7 text-on-tertiary-container">
              <h3 className="font-display text-2xl font-extrabold">{b!.title}</h3>
              <Markdown text={b!.body} className="prose-bastet mt-3 !text-base" />
            </div>
          ))}
        </section>
      )}

      {faqs.length > 0 && (
        <section className="container-site mt-16">
          <h2 className="font-display text-3xl font-extrabold">Preguntas frecuentes</h2>
          <div className="mt-6 grid gap-3">
            {faqs.map((f) => (
              <details key={f.id} className="card group p-5 open:bg-surface-low">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.question}
                  <Icon name="plus" className="transition-transform group-open:rotate-45" />
                </summary>
                <Markdown text={f.answer} className="prose-bastet mt-3 !text-base" />
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
