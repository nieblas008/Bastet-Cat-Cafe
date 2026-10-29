import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/CatBits";
import { getCats, getRequirements, getSettings } from "@/lib/data";
import { money, whatsappLink } from "@/lib/format";
import { ApplicationForm } from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Solicitud de adopción",
  description: "Llena tu solicitud para adoptar un gato de Bastet Cat Café.",
};

export default async function ApplicationPage({ searchParams }: PageProps<"/adoptar/solicitud">) {
  const { gato } = await searchParams;
  const [settings, cats, requirements] = await Promise.all([getSettings(), getCats(), getRequirements()]);
  const available = cats.filter((c) => c.status === "disponible").map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const preselected = typeof gato === "string" ? available.find((c) => c.slug === gato)?.id : undefined;
  const wa = whatsappLink(settings, "¡Hola! Quiero iniciar un proceso de adopción.");

  if (!settings.online_applications) {
    return (
      <PageHero title="Solicitud de adopción" intro="Por ahora las solicitudes se reciben por WhatsApp.">
        {wa && <a href={wa} className="btn mt-6" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>}
      </PageHero>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Adopción"
        title="Solicitud de adopción"
        intro="Toma unos 10 minutos. Con esto preparamos tu entrevista; nada de lo que contestes es definitivo."
      />
      <div className="container-site">
        <div className="rounded-[24px] bg-surface-mid p-5 text-sm">
          <p className="font-semibold">Antes de empezar, ten en cuenta:</p>
          <ul className="mt-2 list-disc pl-5">
            {requirements.map((r) => (
              <li key={r.id}>
                {/cuota/i.test(r.title) && settings.show_adoption_fee ? `${r.title}: ${money(settings.adoption_fee_mxn)}` : r.title}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            ¿Prefieres hablar con alguien? <Link href="/adoptar" className="font-semibold text-primary underline">Hazlo por WhatsApp</Link>.
          </p>
        </div>
        <ApplicationForm cats={available} preselected={preselected} feeLabel={settings.show_adoption_fee ? money(settings.adoption_fee_mxn) : null} />
      </div>
    </>
  );
}
