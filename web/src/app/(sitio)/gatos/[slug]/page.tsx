import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatCard, StatusBadge, compatText } from "@/components/site/CatBits";
import { Gallery } from "@/components/site/Gallery";
import { ShareButton } from "@/components/site/ShareButton";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getCat, getGroupMates, getSettings, getSponsorCounts } from "@/lib/data";
import { catAge, longDate, money, publicImage, whatsappLink } from "@/lib/format";
import { InterestForm } from "./InterestForm";

export async function generateMetadata({ params }: PageProps<"/gatos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCat(slug);
  if (!cat) return { title: "Gato no encontrado" };
  const img = publicImage(cat.cat_photos[0]?.storage_path);
  return {
    title: `${cat.name} · ${cat.status === "disponible" ? "en adopción" : "Bastet"}`,
    description: cat.short_bio ?? `Conoce a ${cat.name}, de Bastet Cat Café en Tijuana.`,
    openGraph: img ? { images: [{ url: img }] } : undefined,
  };
}

export default async function CatPage({ params }: PageProps<"/gatos/[slug]">) {
  const { slug } = await params;
  const [cat, settings, sponsors] = await Promise.all([getCat(slug), getSettings(), getSponsorCounts()]);
  if (!cat) notFound();
  const mates = cat.group_id ? await getGroupMates(cat.group_id, cat.id) : [];

  const age = catAge(cat.birth_date, cat.age_label);
  const compat = compatText(cat);
  const wa = whatsappLink(settings, `¡Hola! Me interesa adoptar a ${cat.name}. Lo vi en su sitio web.`);
  const photos = cat.cat_photos
    .map((p) => ({ src: publicImage(p.storage_path), alt: p.alt ?? "" }))
    .filter((p): p is { src: string; alt: string } => Boolean(p.src));
  const canAdopt = cat.status === "disponible";
  const canSponsor = cat.status !== "adoptado";

  const health = [
    { ok: cat.vaccinated, label: cat.sex === "hembra" ? "Vacunada" : "Vacunado" },
    { ok: cat.sterilized, label: cat.sex === "hembra" ? "Esterilizada" : "Esterilizado" },
    { ok: cat.dewormed, label: cat.sex === "hembra" ? "Desparasitada" : "Desparasitado" },
  ];

  return (
    <>
      <nav className="container-site pt-8 text-sm" aria-label="Ruta">
        <Link href="/gatos" className="font-semibold text-primary hover:underline">Gatitos</Link>
        <span className="mx-2 text-on-surface-variant">/</span>
        <span>{cat.name}</span>
      </nav>

      <section className="container-site mt-6 grid gap-10 lg:grid-cols-[.95fr_1.05fr]">
        <div className="relative">
          <Gallery photos={photos} name={cat.name} />
          <StatusBadge status={cat.status} className="absolute left-4 top-4 !text-sm shadow" />
        </div>

        <div>
          <h1 className="font-display text-5xl font-extrabold md:text-6xl">{cat.name}</h1>
          <p className="mt-2 text-on-surface-variant">
            {[age, cat.sex, cat.arrived_at && `en el café desde ${longDate(cat.arrived_at, { day: undefined })}`].filter(Boolean).join(" · ")}
          </p>

          {cat.personality ? <Markdown text={cat.personality} className="prose-bastet mt-5" /> : cat.short_bio && <p className="mt-5 text-lg">{cat.short_bio}</p>}

          {(cat.traits.length > 0 || compat) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {cat.traits.map((t) => (
                <span key={t} className="chip bg-secondary-container text-on-secondary-container">{t}</span>
              ))}
              {cat.good_with_kids && <span className="chip bg-secondary-container text-on-secondary-container">convive con niños</span>}
              {cat.good_with_dogs && <span className="chip bg-secondary-container text-on-secondary-container">convive con perros</span>}
              {cat.good_with_cats && <span className="chip bg-secondary-container text-on-secondary-container">convive con gatos</span>}
            </div>
          )}

          <div className="card mt-6 p-5">
            <p className="font-semibold">Salud</p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {health.map((h) => (
                <li key={h.label} className={`inline-flex items-center gap-2 text-sm font-semibold ${h.ok ? "text-success" : "text-on-surface-variant"}`}>
                  <span className={`grid size-5 place-items-center rounded-full ${h.ok ? "bg-success text-white" : "bg-surface-highest"}`}>
                    {h.ok && <Icon name="check" size={14} />}
                  </span>
                  {h.ok ? h.label : `${h.label.replace(/[oa]$/, "")}… pendiente`}
                </li>
              ))}
            </ul>
            {cat.health_notes && <p className="mt-3 text-sm text-on-surface-variant">{cat.health_notes}</p>}
          </div>

          {cat.special_needs && (
            <div className="mt-4 rounded-[20px] bg-tertiary-container p-5 text-on-tertiary-container">
              <p className="font-semibold">Necesita cuidados especiales</p>
              {cat.special_needs_notes && <p className="mt-1 text-sm">{cat.special_needs_notes}</p>}
            </div>
          )}

          {cat.cat_groups && cat.cat_groups.adopt_together && (
            <div className="mt-4 rounded-[20px] bg-primary-container p-5 text-on-primary-container">
              <p className="font-semibold">
                {cat.cat_groups.kind === "pareja" ? "Se adopta en pareja" : "Es parte de una camada"}: {cat.cat_groups.name}
              </p>
              {cat.cat_groups.description && <p className="mt-1 text-sm">{cat.cat_groups.description}</p>}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {canAdopt && (
              <Link href={settings.online_applications ? `/adoptar/solicitud?gato=${cat.slug}` : "/adoptar"} className="btn w-full !min-h-14 !text-base">
                <Icon name="heart" /> Iniciar proceso de adopción
              </Link>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outlined">
                  <Icon name="whatsapp" /> Pregunta por WhatsApp
                </a>
              )}
              <ShareButton title={`${cat.name} · Bastet Cat Café`} text={`Conoce a ${cat.name}, busca familia en Tijuana.`} />
            </div>
            {canSponsor && (
              <Link href={`/apadrina?gato=${cat.slug}`} className="btn btn-tonal">
                Apadrinar a {cat.name}
                {sponsors[cat.id] ? ` · ${sponsors[cat.id]} ${sponsors[cat.id] === 1 ? "padrino" : "padrinos"}` : ""}
              </Link>
            )}
          </div>

          {cat.status === "apartado" && (
            <div className="mt-5">
              <InterestForm catId={cat.id} catName={cat.name} />
            </div>
          )}

          {canAdopt && settings.show_adoption_fee && (
            <p className="mt-4 text-center text-sm text-on-surface-variant">
              Cuota de recuperación: {money(settings.adoption_fee_mxn)}. Cubre vacunas, esterilización, desparasitación y baños.
            </p>
          )}
        </div>
      </section>

      {mates.length > 0 && (
        <section className="container-site mt-16">
          <h2 className="font-display text-3xl font-extrabold">Va con {mates.length === 1 ? "su compañero" : "sus compañeros"}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mates.map((m, i) => (
              <CatCard key={m.id} cat={m} index={i + 1} />
            ))}
          </div>
        </section>
      )}

      <section className="container-site mt-16">
        <div className="rounded-[28px] bg-surface-mid p-7 md:p-9">
          <h2 className="font-display text-2xl font-extrabold md:text-3xl">¿Cómo funciona la adopción?</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["Revisa los requisitos", "Identificación, comprobante de domicilio, transportadora y la cuota de recuperación."],
              ["Envía tu solicitud", settings.online_applications ? "En línea o por WhatsApp, como prefieras." : "Por WhatsApp."],
              ["Entrevista", "Platicamos de 30 a 40 minutos para conocer tu hogar."],
              ["A casa", "Si todo está listo, el gato se puede ir contigo el mismo día."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-[20px] bg-white p-5">
                <p className="text-sm font-bold text-primary">Paso {i + 1}</p>
                <p className="font-display mt-1 text-lg font-bold">{t}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{d}</p>
              </li>
            ))}
          </ol>
          <Link href="/adoptar" className="btn btn-outlined mt-6">Ver todos los detalles</Link>
        </div>
      </section>
    </>
  );
}
