// Las páginas públicas se sirven desde caché y se refrescan cada 5 min,
// o al instante cuando alguien guarda algo en el panel (revalidatePath).
export const revalidate = 300;

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/format";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  // Datos estructurados para Google (SEO local)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: settings.cafe_name,
    description: settings.tagline,
    url: SITE_URL,
    telephone: settings.phone ?? undefined,
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: "Tijuana", addressRegion: "Baja California", addressCountry: "MX" }
      : undefined,
    sameAs: [settings.instagram_url, settings.facebook_url, settings.tiktok_url].filter(Boolean),
  };
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppFab />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
