import Image from "next/image";
import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Empty, Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { DIETARY_LABEL, money, publicImage } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { PhotoUploader } from "../gatos/PhotoUploader";
import { createCategory, createItem, deleteCategory, deleteItem, removeItemPhoto, setItemPhoto, toggleAvailable, updateCategory, updateItem } from "./actions";

export const metadata = { title: "Menú" };

const ICONS = [["coffee", "Café"], ["tea", "Té"], ["cold", "Frío"], ["bread", "Pan"], ["salty", "Salado"], ["sweet", "Postre"], ["star", "Especial"]];

function ItemFields({ item, categories }: { item?: MenuItem; categories: MenuCategory[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="field"><span>Nombre *</span><input className="input" name="name" required maxLength={120} defaultValue={item?.name} /></label>
      <label className="field"><span>Precio (MXN) *</span><input className="input" name="price_mxn" required inputMode="decimal" defaultValue={item?.price_mxn} placeholder="65" /></label>
      <label className="field md:col-span-2"><span>Descripción corta</span><input className="input" name="description" maxLength={300} defaultValue={item?.description ?? ""} /></label>
      <label className="field">
        <span>Categoría</span>
        <select className="input" name="category_id" defaultValue={item?.category_id ?? categories[0]?.id}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Nota de precio</span><input className="input" name="price_note" maxLength={80} defaultValue={item?.price_note ?? ""} placeholder="Ej. avena +$10" /></label>
      <label className="field"><span>Etiqueta</span><input className="input" name="badge" maxLength={40} defaultValue={item?.badge ?? ""} placeholder="Ej. favorito de la casa" /></label>
      <label className="field"><span>Orden</span><input className="input" type="number" name="sort_order" defaultValue={item?.sort_order ?? 0} /></label>
      <fieldset className="md:col-span-2">
        <legend className="field-label mb-2">Contiene / es</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DIETARY_LABEL).map(([v, l]) => (
            <label key={v} className="chip min-h-10 cursor-pointer border border-outline-variant bg-white has-[:checked]:border-primary has-[:checked]:bg-primary-container">
              <input type="checkbox" name="dietary_tags" value={v} defaultChecked={item?.dietary_tags.includes(v)} className="sr-only" /> {l}
            </label>
          ))}
        </div>
      </fieldset>
      {item && (
        <div className="flex flex-wrap gap-x-6 md:col-span-2">
          <label className="check"><input type="checkbox" name="available" defaultChecked={item.available} /> Disponible hoy</label>
          <label className="check"><input type="checkbox" name="seasonal" defaultChecked={item.seasonal} /> De temporada</label>
          <label className="check"><input type="checkbox" name="visible" defaultChecked={item.visible} /> Visible en el menú</label>
        </div>
      )}
      {!item && <label className="check md:col-span-2"><input type="checkbox" name="seasonal" /> De temporada</label>}
    </div>
  );
}

export default async function MenuAdmin() {
  const sb = await createClient();
  const [{ data: cats }, { data: items }] = await Promise.all([
    sb.from("menu_categories").select("*").order("sort_order"),
    sb.from("menu_items").select("*").order("sort_order").order("name"),
  ]);
  const categories = (cats as MenuCategory[]) ?? [];
  const all = (items as MenuItem[]) ?? [];

  return (
    <>
      <PanelTitle title="Menú" intro="Marca “Agotado” cuando se acabe algo: el menú del QR se actualiza al momento." action={<Link href="/menu" target="_blank" className="btn btn-outlined btn-sm"><Icon name="eye" size={18} /> Ver menú</Link>} />

      {categories.length === 0 ? (
        <Empty>Primero crea una categoría (por ejemplo “Café”) aquí abajo.</Empty>
      ) : (
        <div className="grid gap-6">
          {categories.map((c) => {
            const list = all.filter((i) => i.category_id === c.id);
            return (
              <Panel key={c.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display flex items-center gap-2 text-xl font-bold"><Icon name={c.icon ?? "coffee"} /> {c.name} {!c.visible && <span className="chip bg-surface-highest text-xs">Oculta</span>}</h2>
                  <details className="relative">
                    <summary className="btn btn-text btn-sm cursor-pointer list-none">Editar categoría</summary>
                    <div className="mt-2 grid gap-3 rounded-2xl bg-surface-low p-4 md:w-[420px]">
                      <ActionForm action={updateCategory.bind(null, c.id)} className="grid gap-3">
                        <label className="field"><span>Nombre</span><input className="input" name="name" defaultValue={c.name} required /></label>
                        <label className="field"><span>Descripción</span><input className="input" name="description" defaultValue={c.description ?? ""} /></label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="field"><span>Ícono</span><select className="input" name="icon" defaultValue={c.icon ?? "coffee"}>{ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                          <label className="field"><span>Orden</span><input className="input" type="number" name="sort_order" defaultValue={c.sort_order} /></label>
                        </div>
                        <label className="check"><input type="checkbox" name="visible" defaultChecked={c.visible} /> Visible</label>
                        <SubmitButton className="btn btn-sm">Guardar</SubmitButton>
                      </ActionForm>
                      <form action={deleteCategory.bind(null, c.id)}><ConfirmButton message="¿Borrar la categoría? Debe estar vacía.">Borrar categoría</ConfirmButton></form>
                    </div>
                  </details>
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Sin platillos todavía.</p>
                ) : (
                  <ul className="divide-y divide-outline-variant">
                    {list.map((item) => {
                      const img = publicImage(item.photo_path);
                      return (
                        <li key={item.id} className="py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-surface-high">
                              {img ? <Image src={img} alt="" fill sizes="48px" className="object-cover" /> : <span className="grid size-full place-items-center text-primary/40"><Icon name={c.icon ?? "coffee"} size={18} /></span>}
                            </span>
                            <span className={`min-w-0 flex-1 ${item.available ? "" : "opacity-50"}`}>
                              <span className="font-semibold">{item.name}</span> {!item.visible && <span className="chip bg-surface-highest !py-0 text-[11px]">Oculto</span>}
                              <span className="block text-sm text-on-surface-variant">{money(item.price_mxn)}{item.description ? ` · ${item.description}` : ""}</span>
                            </span>
                            <form action={toggleAvailable.bind(null, item.id, !item.available)}>
                              <SubmitButton className={`btn btn-sm ${item.available ? "btn-outlined" : "btn-danger"}`} pendingText="…">
                                {item.available ? "Marcar agotado" : "Agotado · reactivar"}
                              </SubmitButton>
                            </form>
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-semibold text-primary">Editar</summary>
                            <div className="mt-3 grid gap-4 rounded-2xl bg-surface-low p-4">
                              <ActionForm action={updateItem.bind(null, item.id)} className="grid gap-3">
                                <ItemFields item={item} categories={categories} />
                                <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
                              </ActionForm>
                              <div className="flex flex-wrap items-start gap-3">
                                <PhotoUploader folder={`menu/${item.id}`} multiple={false} label={item.photo_path ? "Cambiar foto" : "Agregar foto (opcional)"} onUploaded={setItemPhoto.bind(null, item.id)} />
                                {item.photo_path && <form action={removeItemPhoto.bind(null, item.id)}><ConfirmButton className="btn btn-outlined btn-sm" message="¿Quitar la foto?">Quitar foto</ConfirmButton></form>}
                                <form action={deleteItem.bind(null, item.id)} className="ml-auto"><ConfirmButton message={`¿Borrar ${item.name} del menú?`}><Icon name="trash" size={16} /> Borrar</ConfirmButton></form>
                              </div>
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {categories.length > 0 && (
          <Panel title="Agregar al menú">
            <ActionForm action={createItem} resetOnSuccess className="grid gap-3">
              <ItemFields categories={categories} />
              <SubmitButton className="btn justify-self-start"><Icon name="plus" /> Agregar</SubmitButton>
            </ActionForm>
          </Panel>
        )}
        <Panel title="Nueva categoría">
          <ActionForm action={createCategory} resetOnSuccess className="grid gap-3">
            <label className="field"><span>Nombre</span><input className="input" name="name" required placeholder="Ej. Bebidas frías" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>Ícono</span><select className="input" name="icon">{ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="field"><span>Orden</span><input className="input" type="number" name="sort_order" defaultValue={categories.length + 1} /></label>
            </div>
            <SubmitButton className="btn btn-tonal justify-self-start">Crear categoría</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
