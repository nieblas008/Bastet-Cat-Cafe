import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getAwareness, getBlock, getPosts } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Calculator } from "./Calculator";

export const metadata: Metadata = {
  title: "Concientización",
  description: "Abandono y esterilización: por qué una sola gata sin esterilizar puede convertirse en cientos de gatos.",
};

export default async function AwarenessPage() {
  const [intro, found, { facts, resources }, posts] = await Promise.all([
    getBlock("concientizacion_intro"),
    getBlock("concientizacion_encontre"),
    getAwareness(),
    getPosts({ category: "concientizacion", limit: 6 }),
  ]);

  return (
    <>
      <PageHero eyebrow="Concientización" title={intro?.title ?? "Esterilizar es la forma de cuidar"}>
        {intro && <Markdown text={intro.body} className="prose-bastet mt-4 max-w-2xl" />}
      </PageHero>

      {facts.length > 0 && (
        <section className="container-site">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f, i) => (
              <li key={f.id} className={`rounded-[28px] p-6 ${["bg-primary-container text-on-primary-container", "bg-tertiary-container text-on-tertiary-container", "bg-secondary-container text-on-secondary-container", "bg-surface-highest"][i % 4]}`}>
                <p className="font-display text-3xl font-extrabold">{f.headline}</p>
                {f.body && <p className="mt-2">{f.body}</p>}
                {f.source && <p className="mt-3 text-xs opacity-70">Fuente: {f.source}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="calculadora" className="container-site mt-16 scroll-mt-28">
        <h2 className="font-display text-3xl font-extrabold md:text-4xl">Haz la cuenta</h2>
        <p className="mt-2 max-w-2xl text-on-surface-variant">Mueve los controles y mira cuántos gatos pueden nacer de una sola gata que nadie esterilizó.</p>
        <div className="mt-6">
          <Calculator />
        </div>
      </section>

      {found && (
        <section className="container-site mt-16">
          <div className="rounded-[28px] bg-tertiary-container p-7 text-on-tertiary-container md:p-9">
            <h2 className="font-display text-3xl font-extrabold">{found.title}</h2>
            <Markdown text={found.body} className="prose-bastet mt-3" />
            <Link href="/contacto?tema=encontre_un_gato" className="btn mt-6">Escríbenos</Link>
          </div>
        </section>
      )}

      {resources.length > 0 && (
        <section className="container-site mt-16">
          <h2 className="font-display text-3xl font-extrabold">Dónde esterilizar en Tijuana</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {resources.map((r) => (
              <li key={r.id} className="card p-6">
                <p className="font-display text-xl font-bold">{r.name}</p>
                {r.address && <p className="mt-1 text-sm text-on-surface-variant">{r.address}</p>}
                {r.notes && <p className="mt-2 text-sm">{r.notes}</p>}
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-primary">
                  {r.phone && <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>}
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer">Sitio web</a>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-site mt-16 grid gap-6 md:grid-cols-[1.2fr_.8fr]">
        {posts.length > 0 && (
          <div>
            <h2 className="font-display text-3xl font-extrabold">Para leer y compartir</h2>
            <ul className="mt-6 grid gap-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="card flex items-center justify-between gap-4 p-5 hover:bg-surface-low">
                    <span>
                      <span className="font-semibold">{p.title}</span>
                      <span className="block text-xs text-on-surface-variant">{shortDate(p.published_at)}</span>
                    </span>
                    <Icon name="arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-[28px] bg-primary-container p-7 text-on-primary-container">
          <h2 className="font-display text-2xl font-extrabold">¿Eres maestra o maestro?</h2>
          <p className="mt-2">Damos pláticas sobre abandono y esterilización en primarias y secundarias de Tijuana.</p>
          <Link href="/contacto?tema=escuelas" className="btn mt-5">Invítanos a tu escuela</Link>
        </div>
      </section>
    </>
  );
}
