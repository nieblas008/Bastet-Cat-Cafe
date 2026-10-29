import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { StatusBadge } from "@/components/site/CatBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { dateTime, publicImage, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CatGroup, CatInterest, CatPhoto, CatWithPhotos } from "@/lib/types";
import { addCatPhotos, deleteCat, deletePhoto, markInterestNotified, movePhoto, updateCat, updatePhotoAlt } from "../actions";
import { CatForm } from "../CatForm";
import { PhotoUploader } from "../PhotoUploader";

export const metadata = { title: "Editar gato" };

export default async function EditCat({ params, searchParams }: PageProps<"/panel/gatos/[id]">) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const sb = await createClient();
  const [{ data: cat }, { data: groups }, { data: interest }] = await Promise.all([
    sb.from("cats").select("*, cat_photos(*)").eq("id", id).maybeSingle(),
    sb.from("cat_groups").select("*").order("name"),
    sb.from("cat_interest").select("*").eq("cat_id", id).order("created_at"),
  ]);
  if (!cat) notFound();
  const c = cat as CatWithPhotos;
  const photos = [...c.cat_photos].sort((a: CatPhoto, b: CatPhoto) => a.sort_order - b.sort_order);
  const addPhotos = addCatPhotos.bind(null, c.id);
  const waiting = ((interest as CatInterest[]) ?? []).filter((i) => !i.notified);

  return (
    <>
      <PanelTitle
        title={c.name}
        back={{ href: "/panel/gatos", label: "Gatos" }}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            {c.published ? (
              <Link href={`/gatos/${c.slug}`} target="_blank" className="btn btn-outlined btn-sm"><Icon name="eye" size={18} /> Ver en el sitio</Link>
            ) : (
              <span className="chip bg-error-container text-on-error-container">Borrador</span>
            )}
          </div>
        }
      />
      {nuevo && (
        <p className="mb-5 rounded-2xl bg-success-container p-4 text-on-success-container">
          ¡Listo! Ahora agrega fotos. Cuando la ficha esté completa, marca <strong>Publicado</strong> y guarda.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="order-2 xl:order-1">
          <CatForm action={updateCat.bind(null, c.id)} cat={c} groups={(groups as CatGroup[]) ?? []} />
        </div>

        <div className="order-1 grid content-start gap-6 xl:order-2">
          <Panel title={`Fotos (${photos.length})`}>
            <p className="mb-3 text-sm text-on-surface-variant">La primera es la portada. Fotos de celular están perfectas.</p>
            <PhotoUploader folder={`gatos/${c.id}`} onUploaded={addPhotos} />
            {photos.length > 0 && (
              <ul className="mt-4 grid gap-3">
                {photos.map((p, i) => {
                  const src = publicImage(p.storage_path);
                  return (
                    <li key={p.id} className="flex gap-3 rounded-2xl bg-surface-low p-2">
                      <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-high">
                        {src && <Image src={src} alt="" fill sizes="80px" className="object-cover" />}
                        {i === 0 && <span className="chip absolute bottom-1 left-1 bg-primary !px-1.5 !py-0 !text-[10px] text-on-primary">Portada</span>}
                      </span>
                      <div className="grid min-w-0 flex-1 gap-2">
                        <form action={updatePhotoAlt.bind(null, p.id)} className="flex gap-1">
                          <input name="alt" defaultValue={p.alt ?? ""} placeholder="Descripción (para lectores de pantalla)" className="input !min-h-9 !py-1 text-sm" />
                          <SubmitButton className="btn btn-text btn-sm !min-h-9 !px-2" pendingText="…">OK</SubmitButton>
                        </form>
                        <div className="flex gap-1">
                          <form action={movePhoto.bind(null, c.id, p.id, -1)}><button className="btn btn-outlined btn-sm !min-h-9 !px-3" disabled={i === 0} aria-label="Subir">↑</button></form>
                          <form action={movePhoto.bind(null, c.id, p.id, 1)}><button className="btn btn-outlined btn-sm !min-h-9 !px-3" disabled={i === photos.length - 1} aria-label="Bajar">↓</button></form>
                          <form action={deletePhoto.bind(null, p.id)} className="ml-auto"><ConfirmButton className="btn btn-danger btn-sm !min-h-9 !px-3" message="¿Borrar esta foto?"><Icon name="trash" size={16} /></ConfirmButton></form>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {(interest as CatInterest[])?.length ? (
            <Panel title={`Quieren saber si se libera (${waiting.length})`}>
              <ul className="grid gap-2 text-sm">
                {(interest as CatInterest[]).map((i) => {
                  const wa = /^\+?[\d\s()-]{7,}$/.test(i.contact) ? whatsappLink({ whatsapp_number: i.contact, phone: null }, `¡Hola, ${i.name}! ${c.name} vuelve a estar disponible en Bastet.`) : null;
                  return (
                    <li key={i.id} className={`flex items-center justify-between gap-2 rounded-xl p-2 ${i.notified ? "opacity-50" : "bg-surface-low"}`}>
                      <span>
                        <strong>{i.name}</strong> · {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="text-primary underline">{i.contact}</a> : i.contact}
                        <span className="block text-xs text-on-surface-variant">{dateTime(i.created_at)}</span>
                      </span>
                      {!i.notified && (
                        <form action={markInterestNotified.bind(null, i.id)}><SubmitButton className="btn btn-text btn-sm" pendingText="…">Avisado</SubmitButton></form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <form action={deleteCat.bind(null, c.id)}>
              <ConfirmButton message={`¿Borrar a ${c.name} y todas sus fotos? Si ya se adoptó, mejor cambia su estado a "Adoptado" para que quede en el muro.`}>
                <Icon name="trash" size={18} /> Borrar gato
              </ConfirmButton>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
