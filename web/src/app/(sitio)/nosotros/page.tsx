import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdoptionCounter, PageHero } from "@/components/site/CatBits";
import { Markdown } from "@/components/ui/Markdown";
import { getBlock, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Bastet Cat Café: un café de especialidad que sostiene un refugio felino en Tijuana.",
};

export default async function AboutPage() {
  const [settings, story, arrive, goal] = await Promise.all([
    getSettings(),
    getBlock("nosotros_historia"),
    getBlock("nosotros_como_llegan"),
    getBlock("nosotros_meta"),
  ]);

  return (
    <>
      <PageHero eyebrow="Nosotros" title="Un café que sostiene un refugio" intro="El consumo del café mantiene a los gatos. Los gatos que viven aquí están en adopción." />
      <section className="container-site grid items-start gap-10 lg:grid-cols-2">
        <div className="grid gap-8">
          {story && (
            <div>
              <h2 className="font-display text-3xl font-extrabold">{story.title}</h2>
              <Markdown text={story.body} className="prose-bastet mt-4" />
            </div>
          )}
          {arrive && (
            <div className="rounded-[28px] bg-surface-mid p-7">
              <h2 className="font-display text-2xl font-extrabold">{arrive.title}</h2>
              <Markdown text={arrive.body} className="prose-bastet mt-3 !text-base" />
            </div>
          )}
        </div>
        <div className="grid gap-6">
          <div className="blob-b relative aspect-[4/3] overflow-hidden">
            <Image src="/img/fachada.jpg" alt="La fachada de Bastet Cat Café" fill sizes="(min-width:1024px) 560px, 92vw" className="object-cover" />
          </div>
          {settings.show_adoptions_counter && settings.adoptions_count > 0 && (
            <AdoptionCounter count={settings.adoptions_count} goal={settings.adoptions_goal} asOf={settings.adoptions_count_as_of} />
          )}
          {goal && (
            <div>
              <h2 className="font-display text-2xl font-extrabold">{goal.title}</h2>
              <Markdown text={goal.body} className="prose-bastet mt-3 !text-base" />
            </div>
          )}
        </div>
      </section>
      <section className="container-site mt-14 flex flex-wrap gap-3">
        <Link href="/gatos" className="btn">Conoce a los gatos</Link>
        <Link href="/concientizacion" className="btn btn-tonal">Concientización</Link>
        <Link href="/contacto" className="btn btn-outlined">Contacto</Link>
      </section>
    </>
  );
}
