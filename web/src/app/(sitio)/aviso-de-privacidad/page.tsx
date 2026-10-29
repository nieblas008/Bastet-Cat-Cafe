import type { Metadata } from "next";
import { PageHero } from "@/components/site/CatBits";
import { Markdown } from "@/components/ui/Markdown";
import { getBlock, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default async function PrivacyPage() {
  const [block, settings] = await Promise.all([getBlock("aviso_privacidad"), getSettings()]);
  return (
    <>
      <PageHero title="Aviso de privacidad" />
      <section className="container-site max-w-3xl">
        {block ? (
          <Markdown text={block.body} />
        ) : (
          <div className="prose-bastet">
            <p>
              {settings.cafe_name} usa los datos que nos compartes en los formularios de este sitio (nombre, teléfono, correo y respuestas de la
              solicitud de adopción) únicamente para dar seguimiento a tu solicitud o mensaje. No los vendemos ni los compartimos con terceros.
            </p>
            <p>Para pedir que corrijamos o borremos tus datos, escríbenos por WhatsApp o a nuestro correo de contacto.</p>
            <p className="text-sm text-on-surface-variant">El texto completo del aviso de privacidad está en preparación.</p>
          </div>
        )}
      </section>
    </>
  );
}
