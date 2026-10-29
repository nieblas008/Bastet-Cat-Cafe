import type { Metadata } from "next";
import { PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { getSettings } from "@/lib/data";
import { telLink, whatsappLink } from "@/lib/format";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contacto", description: "WhatsApp, teléfono, redes y ubicación de Bastet Cat Café." };

export default async function ContactPage({ searchParams }: PageProps<"/contacto">) {
  const { tema } = await searchParams;
  const settings = await getSettings();
  const wa = whatsappLink(settings);
  return (
    <>
      <PageHero eyebrow="Contacto" title="Escríbenos" intro="Para adopciones, lo más rápido es WhatsApp. Para escuelas, prensa o colaboraciones, usa el formulario." />
      <section className="container-site grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <ul className="grid content-start gap-3">
          {wa && (
            <li><a href={wa} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 hover:bg-surface-low"><Icon name="whatsapp" size={28} className="text-[#1f8f4e]" /><span><span className="block font-semibold">WhatsApp</span><span className="text-sm text-on-surface-variant">{settings.phone}</span></span></a></li>
          )}
          {settings.phone && (
            <li><a href={telLink(settings.phone)!} className="card flex items-center gap-4 p-5 hover:bg-surface-low"><Icon name="phone" size={28} className="text-primary" /><span><span className="block font-semibold">Llámanos</span><span className="text-sm text-on-surface-variant">{settings.phone}</span></span></a></li>
          )}
          {settings.instagram_url && (
            <li><a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 hover:bg-surface-low"><Icon name="instagram" size={28} className="text-primary" /><span><span className="block font-semibold">Instagram</span><span className="text-sm text-on-surface-variant">@bastetcatcafe</span></span></a></li>
          )}
          {settings.email && (
            <li><a href={`mailto:${settings.email}`} className="card flex items-center gap-4 p-5 hover:bg-surface-low"><Icon name="inbox" size={28} className="text-primary" /><span><span className="block font-semibold">Correo</span><span className="text-sm text-on-surface-variant">{settings.email}</span></span></a></li>
          )}
          {(settings.address || settings.maps_url) && (
            <li><a href={settings.maps_url ?? "#"} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 hover:bg-surface-low"><Icon name="map" size={28} className="text-primary" /><span><span className="block font-semibold">Ubicación</span><span className="text-sm text-on-surface-variant">{settings.address ?? "Ver en Maps"}</span></span></a></li>
          )}
        </ul>
        <ContactForm defaultTopic={typeof tema === "string" ? tema : "general"} />
      </section>
    </>
  );
}
