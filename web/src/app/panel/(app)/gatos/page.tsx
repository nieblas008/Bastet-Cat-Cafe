import Image from "next/image";
import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { Empty, PanelTitle } from "@/components/panel/PanelBits";
import { StatusBadge } from "@/components/site/CatBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { CAT_STATUS, catAge, publicImage } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CatStatus, CatWithPhotos } from "@/lib/types";
import { bulkStatus, setCatStatus } from "./actions";

export const metadata = { title: "Gatos" };

export default async function CatsAdmin({ searchParams }: PageProps<"/panel/gatos">) {
  const { estado, borrado } = await searchParams;
  const sb = await createClient();
  let q = sb.from("cats").select("*, cat_photos(*)").order("published", { ascending: true }).order("sort_order").order("created_at", { ascending: false });
  if (typeof estado === "string" && estado in CAT_STATUS) q = q.eq("status", estado);
  else q = q.neq("status", "adoptado");
  const { data } = await q;
  const cats = ((data as CatWithPhotos[]) ?? []).map((c) => ({ ...c, cat_photos: c.cat_photos.sort((a, b) => a.sort_order - b.sort_order) }));

  return (
    <>
      <PanelTitle
        title="Gatos"
        intro="Toca un gato para editarlo. El estado se cambia directo desde la lista."
        action={<Link href="/panel/gatos/nuevo" className="btn"><Icon name="plus" /> Nuevo gato</Link>}
      />
      {borrado && <p className="mb-4 rounded-2xl bg-success-container p-3 text-sm text-on-success-container">Gato borrado.</p>}

      <nav className="mb-5 flex flex-wrap gap-2">
        <Link href="/panel/gatos" className={`chip min-h-10 border ${!estado ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>En el café</Link>
        {(Object.keys(CAT_STATUS) as CatStatus[]).map((s) => (
          <Link key={s} href={`/panel/gatos?estado=${s}`} className={`chip min-h-10 border ${estado === s ? "border-primary bg-primary-container" : "border-outline-variant bg-white"}`}>{CAT_STATUS[s].label}</Link>
        ))}
      </nav>

      {cats.length === 0 ? (
        <Empty>No hay gatos aquí todavía. <Link href="/panel/gatos/nuevo" className="font-semibold text-primary underline">Da de alta el primero</Link>.</Empty>
      ) : (
        <>
          <ul className="grid gap-3">
            {cats.map((cat) => {
              const img = publicImage(cat.cat_photos[0]?.storage_path);
              return (
                <li key={cat.id} className="flex flex-wrap items-center gap-4 rounded-[20px] border border-outline-variant bg-white p-3">
                  <input type="checkbox" name="ids" value={cat.id} form="bulk" className="size-5 accent-[var(--color-primary)]" aria-label={`Seleccionar a ${cat.name}`} />
                  <Link href={`/panel/gatos/${cat.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-surface-high">
                      {img ? <Image src={img} alt="" fill sizes="64px" className="object-cover" /> : <span className="grid size-full place-items-center text-primary/50"><Icon name="paw" /></span>}
                    </span>
                    <span className="min-w-0">
                      <span className="font-display block text-lg font-bold">{cat.name}</span>
                      <span className="block text-xs text-on-surface-variant">
                        {[catAge(cat.birth_date, cat.age_label), cat.sex].filter(Boolean).join(" · ")}
                        {!cat.published && <span className="ml-2 font-bold text-error">Borrador</span>}
                        {cat.cat_photos.length === 0 && <span className="ml-2 font-bold text-tertiary">Sin fotos</span>}
                      </span>
                    </span>
                  </Link>
                  <form action={setCatStatus.bind(null, cat.id)} className="flex items-center gap-2">
                    <StatusBadge status={cat.status} className="hidden md:inline-flex" />
                    <select name="status" defaultValue={cat.status} className="input !min-h-11 !w-auto !py-1 text-sm" aria-label={`Estado de ${cat.name}`}>
                      {(Object.keys(CAT_STATUS) as CatStatus[]).map((s) => <option key={s} value={s}>{CAT_STATUS[s].label}</option>)}
                    </select>
                    <SubmitButton className="btn btn-sm btn-outlined" pendingText="…">Cambiar</SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 rounded-[20px] bg-surface-mid p-4">
            <p className="mb-3 text-sm font-semibold">Cambio en grupo (por ejemplo, cuando se adopta una camada completa): marca los gatos de la lista y elige el estado.</p>
            <ActionForm id="bulk" action={bulkStatus} className="flex flex-wrap items-center gap-3">
              <select name="status" className="input !w-auto" defaultValue="">
                <option value="" disabled>Nuevo estado…</option>
                {(Object.keys(CAT_STATUS) as CatStatus[]).map((s) => <option key={s} value={s}>{CAT_STATUS[s].label}</option>)}
              </select>
              <SubmitButton className="btn btn-sm">Aplicar a los marcados</SubmitButton>
            </ActionForm>
          </div>
        </>
      )}
    </>
  );
}
