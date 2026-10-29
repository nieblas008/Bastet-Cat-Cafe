import type { Metadata } from "next";
import Link from "next/link";
import { CatImage, PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { getAdoptedCats, getCats, getSponsorCounts } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { CatFilters } from "./CatFilters";

export const metadata: Metadata = {
  title: "Gatos en adopción",
  description: "Conoce a los gatos que viven en Bastet Cat Café y buscan familia en Tijuana.",
};

export default async function CatsPage() {
  const [cats, adopted, sponsors] = await Promise.all([getCats(), getAdoptedCats(24), getSponsorCounts()]);
  const adoptable = cats.filter((c) => c.status === "disponible").length;

  return (
    <>
      <PageHero
        title="Los michis de la casa"
        intro={
          cats.length
            ? `${cats.length} ${cats.length === 1 ? "michi vive" : "michis viven"} en el café${adoptable ? ` · ${adoptable} ${adoptable === 1 ? "busca" : "buscan"} familia` : ""}. Los residentes ya son de aquí, y quien está en tratamiento pronto se anima.`
            : "Pronto verás aquí a los gatos del café."
        }
      />
      <CatFilters cats={cats} sponsors={sponsors} />

      <section className="container-site mt-16">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-primary-container p-7 text-on-primary-container md:p-9">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-extrabold">¿Te enamoraste de alguno?</h2>
            <p className="mt-2">Antes de escribirnos, revisa los requisitos. Así tu proceso es más rápido.</p>
          </div>
          <Link href="/adoptar" className="btn">
            Cómo adoptar <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      {adopted.length > 0 && (
        <section className="container-site mt-16" id="adoptados">
          <h2 className="font-display text-3xl font-extrabold">El muro de los adoptados</h2>
          <p className="mt-2 text-on-surface-variant">Los que ya se fueron a casa. Así termina el proceso.</p>
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
            {adopted.map((cat, i) => (
              <li key={cat.id} className="text-center">
                <CatImage cat={cat} index={i} sizes="180px" />
                <p className="font-display mt-2 font-bold">{cat.name}</p>
                {cat.adopted_at && <p className="text-xs text-on-surface-variant">Adoptado el {shortDate(cat.adopted_at)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
