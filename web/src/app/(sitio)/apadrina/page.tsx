import type { Metadata } from "next";
import Link from "next/link";
import { CatImage, PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getBlock, getCats, getFaqs, getSponsorWall, getTiers } from "@/lib/data";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Apadrina a un gato",
  description: "Con una aportación mensual cubres la comida y los cuidados de un gato de Bastet, y recibes contenido exclusivo.",
};

export default async function SponsorPage({ searchParams }: PageProps<"/apadrina">) {
  const { gato } = await searchParams;
  const [tiers, cats, wall, intro, faqs] = await Promise.all([getTiers(), getCats(), getSponsorWall(), getBlock("apadrina_intro"), getFaqs("apadrina")]);
  const selected = typeof gato === "string" ? cats.find((c) => c.slug === gato) : undefined;
  const sponsorable = cats.filter((c) => c.status !== "adoptado").slice(0, 8);

  return (
    <>
      <PageHero
        eyebrow="Apadrina"
        title={selected ? `Apadrina a ${selected.name}` : intro?.title ?? "Apadrina a un michi"}
        intro={intro ? null : "Si no puedes adoptar, puedes cuidar a uno desde lejos. Tu aportación mensual paga su comida, su arena y sus visitas al veterinario."}
      >
        {intro && <Markdown text={intro.body} className="prose-bastet mt-4 max-w-2xl" />}
      </PageHero>

      {tiers.length > 0 ? (
        <section className="container-site">
          <ul className="grid gap-5 md:grid-cols-3">
            {tiers.map((t, i) => (
              <li key={t.id} className={`flex flex-col rounded-[28px] p-7 ${i === 1 ? "bg-primary text-on-primary" : "card"}`}>
                <p className="font-display text-2xl font-extrabold">{t.name}</p>
                <p className="font-display mt-3 text-4xl font-extrabold">
                  {money(t.monthly_mxn)}
                  <span className="text-base font-semibold opacity-75"> /mes</span>
                </p>
                {t.description && <p className="mt-3 opacity-90">{t.description}</p>}
                {t.perks.length > 0 && (
                  <ul className="mt-4 grid gap-2">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-2"><Icon name="check" size={18} className="mt-0.5" /> {p}</li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/padrino/registro?nivel=${t.id}${selected ? `&gato=${selected.slug}` : ""}`}
                  className={`btn mt-auto !mt-6 ${i === 1 ? "!bg-white !text-primary" : ""}`}
                >
                  Elegir {t.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-on-surface-variant">
            Por ahora el pago es por transferencia: te registras, eliges a tu michi y el equipo te comparte los datos. Al confirmar tu pago se activa tu acceso al portal.
          </p>
        </section>
      ) : (
        <p className="container-site rounded-[24px] bg-surface-mid p-8">Los niveles de apadrinamiento se publican muy pronto.</p>
      )}

      {!selected && sponsorable.length > 0 && (
        <section className="container-site mt-16">
          <h2 className="font-display text-3xl font-extrabold">¿A quién vas a apadrinar?</h2>
          <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {sponsorable.map((c, i) => (
              <li key={c.id}>
                <Link href={`/apadrina?gato=${c.slug}`} className="block text-center">
                  <CatImage cat={c} index={i} sizes="240px" />
                  <p className="font-display mt-2 font-bold">{c.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-site mt-16 grid gap-6 md:grid-cols-3">
        {[
          ["1", "Elige nivel y michi", "Te registras con tu correo. Tarda un minuto."],
          ["2", "Transfiere", "Te mandamos los datos para el pago mensual. El dinero llega directo a Bastet."],
          ["3", "Entra a tu portal", "Fotos y videos de tu michi que solo ven sus padrinos."],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-[24px] bg-surface-mid p-6">
            <p className="font-display text-3xl font-extrabold text-primary">{n}</p>
            <p className="font-display mt-1 text-xl font-bold">{t}</p>
            <p className="mt-1 text-on-surface-variant">{d}</p>
          </div>
        ))}
      </section>

      {wall.length > 0 && (
        <section className="container-site mt-16">
          <h2 className="font-display text-3xl font-extrabold">Muro de padrinos</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {wall.map((w, i) => (
              <li key={i} className="chip bg-primary-container !px-4 !py-2 text-on-primary-container">
                <Icon name="heart" size={14} /> {w.public_name} · padrino de {w.cat_name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="container-site mt-16">
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

      <p className="container-site mt-10 text-sm">
        ¿Ya eres padrino? <Link href="/padrino" className="font-semibold text-primary underline">Entra a tu portal</Link>.
      </p>
    </>
  );
}
