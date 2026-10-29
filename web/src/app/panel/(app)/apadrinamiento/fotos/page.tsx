import Image from "next/image";
import Link from "next/link";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Empty, Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { SponsorMedia } from "@/lib/types";
import { PhotoUploader } from "../../gatos/PhotoUploader";
import { addSponsorMedia, deleteSponsorMedia, updateMediaCaption } from "../actions";

export const metadata = { title: "Fotos para padrinos" };

export default async function FotosPadrinos({ searchParams }: PageProps<"/panel/apadrinamiento/fotos">) {
  const { gato } = await searchParams;
  const sb = await createClient();
  const { data: catsData } = await sb.from("cats").select("id, name, status").neq("status", "adoptado").order("name");
  const cats = (catsData as { id: string; name: string }[]) ?? [];
  const catId = typeof gato === "string" && cats.some((c) => c.id === gato) ? gato : cats[0]?.id;
  const cat = cats.find((c) => c.id === catId);

  let media: (SponsorMedia & { url: string | null })[] = [];
  let sponsors = 0;
  if (catId) {
    const [{ data }, { count }] = await Promise.all([
      sb.from("sponsor_media").select("*").eq("cat_id", catId).order("created_at", { ascending: false }),
      sb.from("sponsorships").select("id", { count: "exact", head: true }).eq("cat_id", catId).eq("status", "activa"),
    ]);
    sponsors = count ?? 0;
    const list = (data as SponsorMedia[]) ?? [];
    const { data: signed } = list.length ? await sb.storage.from("padrinos").createSignedUrls(list.map((m) => m.storage_path), 3600) : { data: [] };
    media = list.map((m) => ({ ...m, url: signed?.find((s) => s.path === m.storage_path)?.signedUrl ?? null }));
  }

  return (
    <>
      <PanelTitle
        title="Fotos y videos para padrinos"
        intro="Lo que subas aquí es privado: solo lo ven los padrinos activos de ese gato, desde su cuenta."
        back={{ href: "/panel/apadrinamiento", label: "Apadrinamiento" }}
      />
      {cats.length === 0 ? (
        <Empty>Primero agrega gatos.</Empty>
      ) : (
        <>
          <nav className="mb-5 flex flex-wrap gap-2" aria-label="Gato">
            {cats.map((c) => (
              <Link key={c.id} href={`/panel/apadrinamiento/fotos?gato=${c.id}`} className={`chip min-h-10 border ${c.id === catId ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>{c.name}</Link>
            ))}
          </nav>
          <Panel title={`${cat?.name} · ${sponsors} ${sponsors === 1 ? "padrino activo" : "padrinos activos"}`}>
            <div className="mb-5 max-w-sm">
              <PhotoUploader key={catId} folder={catId!} bucket="padrinos" allowVideo label="Subir fotos o videos" onUploaded={addSponsorMedia.bind(null, catId!)} />
            </div>
            {media.length === 0 ? (
              <p className="text-on-surface-variant">Todavía no hay nada para sus padrinos.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {media.map((m) => (
                  <li key={m.id} className="overflow-hidden rounded-2xl border border-outline-variant">
                    <div className="relative aspect-square bg-surface-high">
                      {m.url && (m.media_type === "video" ? (
                        <video src={m.url} controls preload="metadata" className="size-full object-cover" />
                      ) : (
                        <Image src={m.url} alt={m.caption ?? ""} fill sizes="300px" className="object-cover" unoptimized />
                      ))}
                    </div>
                    <div className="grid gap-2 p-3">
                      <form action={updateMediaCaption.bind(null, m.id)} className="flex gap-2">
                        <input className="input !min-h-10 flex-1 text-sm" name="caption" defaultValue={m.caption ?? ""} placeholder="Descripción" maxLength={300} />
                        <SubmitButton className="btn btn-tonal btn-sm" pendingText="…">OK</SubmitButton>
                      </form>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span>{shortDate(m.created_at)}</span>
                        <form action={deleteSponsorMedia.bind(null, m.id)}><ConfirmButton className="font-semibold text-error" message="¿Borrar este archivo?"><Icon name="trash" size={14} /> Borrar</ConfirmButton></form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
