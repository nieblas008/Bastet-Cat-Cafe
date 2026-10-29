import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = { title: "¡Gracias!", robots: { index: false } };

export default async function ThanksPage({ searchParams }: PageProps<"/gracias">) {
  const { tipo } = await searchParams;
  const settings = await getSettings();
  const wa = whatsappLink(settings);
  const isApplication = tipo === "solicitud";
  return (
    <section className="container-site grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-xl">
        <p className="text-6xl" aria-hidden="true">🐾</p>
        <h1 className="font-display mt-4 text-4xl font-extrabold md:text-5xl">{isApplication ? "¡Recibimos tu solicitud!" : "¡Mensaje enviado!"}</h1>
        <p className="mt-4 text-lg text-on-surface-variant">
          {isApplication
            ? `Alguien del equipo te va a contactar${settings.adoption_response_days ? ` en un máximo de ${settings.adoption_response_days} días` : ""} para agendar la entrevista. Ten a la mano tu identificación y comprobante de domicilio.`
            : "Te respondemos lo antes posible."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/gatos" className="btn">Ver a los gatos</Link>
          {wa && <a href={wa} className="btn btn-outlined" target="_blank" rel="noopener noreferrer">¿Dudas? WhatsApp</a>}
        </div>
      </div>
    </section>
  );
}
