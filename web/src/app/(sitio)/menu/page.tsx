import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getCats, getMenu, getSettings } from "@/lib/data";
import { DIETARY_LABEL, money, publicImage } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Menú",
  description: "Café de especialidad, bebidas, pan dulce y antojos salados. Tu consumo mantiene el refugio.",
};

function Item({ item }: { item: MenuItem }) {
  const img = publicImage(item.photo_path);
  return (
    <li className={`flex items-center gap-4 py-4 ${item.available ? "" : "opacity-55"}`}>
      {img && (
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface-high">
          <Image src={img} alt="" fill sizes="56px" className="object-cover" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[17px] font-bold">{item.name}</span>
          {item.badge && <span className="chip bg-tertiary-container !px-2 !py-0.5 !text-[11px] text-on-tertiary-container">{item.badge}</span>}
          {item.dietary_tags.map((t) => (
            <span key={t} className="chip bg-success-container !px-2 !py-0.5 !text-[11px] text-on-success-container">{DIETARY_LABEL[t] ?? t}</span>
          ))}
          {!item.available && <span className="chip bg-surface-highest !px-2 !py-0.5 !text-[11px]">Agotado hoy</span>}
        </p>
        {(item.description || item.price_note) && (
          <p className="mt-0.5 text-sm text-on-surface-variant">{[item.description, item.price_note].filter(Boolean).join(" · ")}</p>
        )}
      </div>
      <span className="font-display shrink-0 text-lg font-extrabold">{money(item.price_mxn)}</span>
    </li>
  );
}

export default async function MenuPage() {
  const [menu, cats, settings] = await Promise.all([getMenu(), getCats(), getSettings()]);
  const seasonal = menu.flatMap((c) => c.items).filter((i) => i.seasonal);
  const adoptable = cats.filter((c) => c.status === "disponible").length;

  return (
    <>
      <section className="container-site pt-10 pb-4 md:pt-14">
        <h1 className="font-display text-[44px] font-extrabold leading-none md:text-[64px]">El menú</h1>
        <p className="mt-3 max-w-xl text-on-surface-variant">Precios en pesos. Pides y pagas en la barra: tu consumo mantiene el refugio.</p>
      </section>

      {menu.length === 0 ? (
        <p className="container-site mt-6 rounded-[24px] bg-surface-mid p-8">El menú se está actualizando. Pregunta en la barra.</p>
      ) : (
        <>
          <nav className="sticky top-[72px] z-20 border-y border-outline-variant/60 bg-surface/95 backdrop-blur md:top-[108px]" aria-label="Categorías del menú">
            <ul className="container-site flex gap-2 overflow-x-auto py-3">
              {seasonal.length > 0 && (
                <li><a href="#temporada" className="chip min-h-10 border border-tertiary bg-tertiary-container text-on-tertiary-container"><Icon name="star" size={14} /> De temporada</a></li>
              )}
              {menu.map((c) => (
                <li key={c.id}><a href={`#${c.slug}`} className="chip min-h-10 border border-outline-variant bg-white hover:bg-surface-high">{c.name}</a></li>
              ))}
            </ul>
          </nav>

          <div className="container-site mt-6 grid gap-10 lg:grid-cols-[1.4fr_.6fr]">
            <div className="grid gap-10">
              {seasonal.length > 0 && (
                <section id="temporada" className="scroll-mt-40 rounded-[28px] bg-tertiary-container p-5 text-on-tertiary-container md:p-7">
                  <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><Icon name="star" /> De temporada</h2>
                  <ul className="divide-y divide-on-tertiary-container/15">{seasonal.map((i) => <Item key={i.id} item={i} />)}</ul>
                </section>
              )}
              {menu.map((c) => (
                <section key={c.id} id={c.slug} className="scroll-mt-40">
                  <h2 className="font-display flex items-center gap-3 text-2xl font-extrabold md:text-3xl">
                    <span className="grid size-10 place-items-center rounded-2xl bg-primary-container text-primary"><Icon name={c.icon ?? "coffee"} /></span>
                    {c.name}
                  </h2>
                  {c.description && <p className="mt-2 text-on-surface-variant">{c.description}</p>}
                  <ul className="mt-2 divide-y divide-outline-variant/70">{c.items.map((i) => <Item key={i.id} item={i} />)}</ul>
                </section>
              ))}
            </div>

            <aside className="grid content-start gap-5">
              {adoptable > 0 && (
                <Link href="/gatos" className="rounded-[28px] bg-primary-container p-6 text-on-primary-container hover:brightness-[.98]">
                  <p className="font-display text-xl font-extrabold">¿Ya conociste a los michis?</p>
                  <p className="mt-1 text-sm">{adoptable} de los gatos que ves aquí buscan familia. Conócelos desde tu mesa.</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-semibold">Ver gatos <Icon name="arrow" size={16} /></span>
                </Link>
              )}
              {settings.entry_fee_note && (
                <div className="card p-6 text-sm">
                  <p className="font-semibold">Para tu visita</p>
                  <p className="mt-1 text-on-surface-variant">{settings.entry_fee_note}</p>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </>
  );
}
