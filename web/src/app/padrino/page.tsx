import Image from "next/image";
import Link from "next/link";
import { CatImage } from "@/components/site/CatBits";
import { Icon } from "@/components/ui/Icon";
import { requireAccount } from "@/lib/auth";
import { getSettings, getTiers } from "@/lib/data";
import { longDate, money, shortDate, SPONSORSHIP_STATUS_LABEL, SPONSORSHIP_STATUS_TONE, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CatWithPhotos, SponsorMedia, Sponsorship, SponsorshipPayment } from "@/lib/types";
import { RequestForm } from "./RequestForm";

export const metadata = { title: "Mi michi" };

type Row = Sponsorship & { cats: CatWithPhotos | null; sponsorship_tiers: { name: string; monthly_mxn: number } | null; sponsorship_payments: SponsorshipPayment[] };

export default async function Portal({ searchParams }: PageProps<"/padrino">) {
  const profile = await requireAccount();
  const { gato, nivel } = await searchParams;
  const sb = await createClient();
  const [{ data }, { data: catsData }, tiers, settings] = await Promise.all([
    sb.from("sponsorships").select("*, cats(*, cat_photos(*)), sponsorship_tiers(name, monthly_mxn), sponsorship_payments(*)").eq("sponsor_id", profile.id).order("created_at", { ascending: false }),
    sb.from("cats").select("id, name, slug").eq("published", true).neq("status", "adoptado").order("name"),
    getTiers(),
    getSettings(),
  ]);
  const mine = (data as Row[]) ?? [];
  const cats = (catsData as { id: string; name: string; slug: string }[]) ?? [];
  const active = mine.filter((s) => s.status === "activa");
  const pending = mine.filter((s) => s.status === "pendiente");

  // Fotos y videos privados de los gatos que apadrina (RLS solo deja ver los suyos)
  const activeCatIds = [...new Set(active.map((s) => s.cat_id))];
  let media: (SponsorMedia & { url: string | null })[] = [];
  if (activeCatIds.length) {
    const { data: m } = await sb.from("sponsor_media").select("*").in("cat_id", activeCatIds).order("created_at", { ascending: false }).limit(120);
    const list = (m as SponsorMedia[]) ?? [];
    const { data: signed } = list.length ? await sb.storage.from("padrinos").createSignedUrls(list.map((x) => x.storage_path), 3600) : { data: [] };
    media = list.map((x) => ({ ...x, url: signed?.find((s) => s.path === x.storage_path)?.signedUrl ?? null }));
  }

  const preCat = typeof gato === "string" ? cats.find((c) => c.slug === gato)?.id : undefined;
  const preTier = typeof nivel === "string" ? nivel : undefined;
  const hasBank = settings.bank_clabe || settings.bank_card_number;
  const wa = whatsappLink(settings, `Hola, soy ${profile.full_name || profile.email}. Les mando mi comprobante de apadrinamiento.`);
  const first = (profile.full_name || "").split(" ")[0];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold">{first ? `Hola, ${first}` : "Hola"} 🐾</h1>
          <p className="mt-1 text-on-surface-variant">{active.length ? "Gracias por cuidar a tu michi." : "Aquí ves tus apadrinamientos y las fotos privadas de tu michi."}</p>
        </div>
        <form action="/auth/salir?a=padrino" method="post"><button className="btn btn-text btn-sm">Cerrar sesión</button></form>
      </div>

      {active.map((s) => {
        const catMedia = media.filter((m) => m.cat_id === s.cat_id);
        return (
          <section key={s.id} className="card overflow-hidden">
            <div className="grid gap-6 p-6 md:grid-cols-[200px_1fr]">
              <div className="relative aspect-square overflow-hidden rounded-[24px] bg-surface-high">{s.cats && <CatImage cat={s.cats} sizes="200px" />}</div>
              <div>
                <span className={`chip text-xs ${SPONSORSHIP_STATUS_TONE[s.status]}`}>{SPONSORSHIP_STATUS_LABEL[s.status]}</span>
                <h2 className="font-display mt-2 text-3xl font-extrabold">{s.cats?.name}</h2>
                <p className="text-on-surface-variant">
                  {s.sponsorship_tiers ? `${s.sponsorship_tiers.name} · ${money(s.sponsorship_tiers.monthly_mxn)} al mes` : ""}
                  {s.started_at ? ` · desde ${longDate(s.started_at)}` : ""}
                </p>
                {s.cats?.slug && s.cats.published && <Link href={`/gatos/${s.cats.slug}`} className="mt-3 inline-block text-sm font-semibold text-primary underline">Ver su ficha</Link>}
              </div>
            </div>
            <div className="border-t border-outline-variant p-6">
              <h3 className="font-display mb-3 text-xl font-bold">Solo para sus padrinos</h3>
              {catMedia.length === 0 ? (
                <p className="text-on-surface-variant">Pronto subiremos fotos y videos de {s.cats?.name}.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {catMedia.map((m) => (
                    <li key={m.id} className="overflow-hidden rounded-2xl bg-surface-high">
                      <div className="relative aspect-square">
                        {m.url && (m.media_type === "video" ? (
                          <video src={m.url} controls preload="metadata" playsInline className="size-full object-cover" />
                        ) : (
                          <Image src={m.url} alt={m.caption ?? `Foto de ${s.cats?.name}`} fill sizes="(min-width: 768px) 300px, 50vw" className="object-cover" unoptimized />
                        ))}
                      </div>
                      {(m.caption || m.created_at) && <p className="p-2 text-xs text-on-surface-variant">{m.caption}{m.caption ? " · " : ""}{shortDate(m.created_at)}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {s.sponsorship_payments.length > 0 && (
              <details className="border-t border-outline-variant p-6">
                <summary className="cursor-pointer font-semibold">Mis aportaciones ({s.sponsorship_payments.length})</summary>
                <ul className="mt-3 grid gap-1 text-sm">
                  {[...s.sponsorship_payments].sort((a, b) => b.paid_on.localeCompare(a.paid_on)).map((p) => (
                    <li key={p.id}>{longDate(p.paid_on)} · {money(p.amount_mxn)}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        );
      })}

      {pending.length > 0 && (
        <section className="card p-6">
          <h2 className="font-display text-2xl font-bold">Por confirmar</h2>
          <ul className="mt-3 grid gap-2">
            {pending.map((s) => (
              <li key={s.id}>
                <span className="font-semibold">{s.cats?.name}</span> · {s.sponsorship_tiers ? `${s.sponsorship_tiers.name}, ${money(s.sponsorship_tiers.monthly_mxn)} al mes` : ""}
                <span className="block text-sm text-on-surface-variant">Lo pediste el {shortDate(s.created_at)}. En cuanto confirmemos tu primer pago, aquí verás sus fotos privadas.</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-surface-low p-4">
            <h3 className="font-semibold">Cómo pagar</h3>
            {hasBank ? (
              <dl className="mt-2 grid gap-1 text-sm">
                {settings.bank_name && <div><dt className="inline font-semibold">Banco: </dt><dd className="inline">{settings.bank_name}</dd></div>}
                {settings.bank_account_holder && <div><dt className="inline font-semibold">A nombre de: </dt><dd className="inline">{settings.bank_account_holder}</dd></div>}
                {settings.bank_clabe && <div><dt className="inline font-semibold">CLABE: </dt><dd className="inline font-mono">{settings.bank_clabe}</dd></div>}
                {settings.bank_card_number && <div><dt className="inline font-semibold">Tarjeta: </dt><dd className="inline font-mono">{settings.bank_card_number}</dd></div>}
              </dl>
            ) : (
              <p className="mt-1 text-sm">Escríbenos y te pasamos los datos, o paga en efectivo en el café.</p>
            )}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-3"><Icon name="whatsapp" size={18} /> Mandar comprobante</a>}
          </div>
        </section>
      )}

      <section className="card p-6">
        <h2 className="font-display mb-4 text-2xl font-bold">{mine.length ? "Apadrinar a otro michi" : "Elige a tu michi"}</h2>
        {tiers.length === 0 || cats.length === 0 ? (
          <p className="text-on-surface-variant">Estamos preparando el apadrinamiento. Vuelve pronto o escríbenos.</p>
        ) : (
          <RequestForm cats={cats} tiers={tiers} cat={preCat} tier={preTier} />
        )}
      </section>
    </div>
  );
}
