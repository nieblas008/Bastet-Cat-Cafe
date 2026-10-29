import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { getBlock, getSettings, getWishlist } from "@/lib/data";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Otras formas de ayudar",
  description: "Lo que necesitan los gatos de Bastet este mes, donativos por transferencia y cómo apoyar sin adoptar.",
};

const PRIORITY = {
  urgente: { label: "Urgente", tone: "bg-error-container text-on-error-container" },
  normal: { label: "Nos hace falta", tone: "bg-tertiary-container text-on-tertiary-container" },
  cuando_se_pueda: { label: "Cuando se pueda", tone: "bg-surface-highest" },
} as const;

export default async function HelpPage() {
  const [settings, wishlist, intro] = await Promise.all([getSettings(), getWishlist(), getBlock("ayudar_intro")]);
  const wa = whatsappLink(settings, "¡Hola! Quiero llevarles un donativo en especie.");
  const hasBank = settings.bank_clabe || settings.bank_card_number;

  return (
    <>
      <PageHero eyebrow="Apoya" title={intro?.title ?? "Otras formas de ayudar"} intro={intro ? null : "No todos pueden adoptar. Pero todos pueden ayudar a que el siguiente gato llegue bien cuidado a su casa."}>
        {intro && <Markdown text={intro.body} className="prose-bastet mt-4 max-w-2xl" />}
      </PageHero>

      <section className="container-site grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card p-7 md:p-9">
          <h2 className="font-display text-3xl font-extrabold">Lo que necesitamos</h2>
          {wishlist.length ? (
            <ul className="mt-6 grid gap-3">
              {wishlist.map((w) => {
                const pct = w.quantity_needed ? Math.min(100, (w.quantity_received / w.quantity_needed) * 100) : null;
                return (
                  <li key={w.id} className="rounded-[20px] bg-surface-low p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        {w.description && <p className="text-sm text-on-surface-variant">{w.description}</p>}
                      </div>
                      <span className={`chip ${PRIORITY[w.priority].tone}`}>{PRIORITY[w.priority].label}</span>
                    </div>
                    {pct !== null && (
                      <div className="mt-3">
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-highest">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">{w.quantity_received} de {w.quantity_needed}</p>
                      </div>
                    )}
                    {w.buy_url && (
                      <a href={w.buy_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Dónde comprarlo <Icon name="arrow" size={14} />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-on-surface-variant">Por ahora estamos cubiertos. ¡Gracias!</p>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outlined mt-6">
              <Icon name="whatsapp" /> Avisar que llevo un donativo
            </a>
          )}
        </div>

        <div className="grid content-start gap-6">
          {hasBank && (
            <div className="rounded-[28px] bg-primary-container p-7 text-on-primary-container">
              <h2 className="font-display text-2xl font-extrabold">Donativos por transferencia</h2>
              <dl className="mt-4 grid gap-2 text-sm">
                {settings.bank_account_holder && (<div><dt className="font-semibold">A nombre de</dt><dd>{settings.bank_account_holder}</dd></div>)}
                {settings.bank_name && (<div><dt className="font-semibold">Banco</dt><dd>{settings.bank_name}</dd></div>)}
                {settings.bank_clabe && (<div><dt className="font-semibold">CLABE</dt><dd className="font-mono text-base">{settings.bank_clabe}</dd></div>)}
                {settings.bank_card_number && (<div><dt className="font-semibold">Tarjeta</dt><dd className="font-mono text-base">{settings.bank_card_number}</dd></div>)}
              </dl>
              {settings.donations_note && <p className="mt-4 text-sm">{settings.donations_note}</p>}
            </div>
          )}
          <Link href="/apadrina" className="card block p-7 hover:bg-surface-low">
            <h2 className="font-display text-2xl font-extrabold">Apadrina</h2>
            <p className="mt-2 text-on-surface-variant">Una aportación al mes para un michi en específico, con fotos y videos solo para ti.</p>
            <span className="mt-4 inline-flex items-center gap-1 font-semibold text-primary">Ver niveles <Icon name="arrow" size={16} /></span>
          </Link>
          <Link href="/concientizacion" className="card block p-7 hover:bg-surface-low">
            <h2 className="font-display text-2xl font-extrabold">Comparte</h2>
            <p className="mt-2 text-on-surface-variant">Esterilizar evita cientos de gatos en la calle. Comparte la calculadora.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
