import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Empty, Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import type { WishlistItem } from "@/lib/types";
import { addReceived, createWish, deleteWish, updateWish } from "./actions";

export const metadata = { title: "Lo que necesitamos" };

const PRIORITY = { urgente: "Urgente", normal: "Normal", cuando_se_pueda: "Cuando se pueda" } as const;

function Fields({ item }: { item?: WishlistItem }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="field"><span>¿Qué se necesita? *</span><input className="input" name="name" required maxLength={120} defaultValue={item?.name} placeholder="Ej. Arena aglomerante" /></label>
      <label className="field"><span>Prioridad</span><select className="input" name="priority" defaultValue={item?.priority ?? "normal"}>{Object.entries(PRIORITY).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="field sm:col-span-2"><span>Detalle</span><input className="input" name="description" maxLength={500} defaultValue={item?.description ?? ""} placeholder="Marca, tamaño, para quién…" /></label>
      <label className="field"><span>Cantidad necesaria</span><input className="input" type="number" min={1} name="quantity_needed" defaultValue={item?.quantity_needed ?? ""} /></label>
      <label className="field"><span>Ya recibimos</span><input className="input" type="number" min={0} name="quantity_received" defaultValue={item?.quantity_received ?? 0} /></label>
      <label className="field"><span>Enlace para comprar</span><input className="input" name="buy_url" maxLength={500} defaultValue={item?.buy_url ?? ""} placeholder="https://amazon.com.mx/…" /></label>
      <label className="field"><span>Orden</span><input className="input" type="number" name="sort_order" defaultValue={item?.sort_order ?? 0} /></label>
      {item && <label className="check"><input type="checkbox" name="visible" defaultChecked={item.visible} /> Visible en el sitio</label>}
    </div>
  );
}

export default async function Necesidades() {
  const sb = await createClient();
  const { data } = await sb.from("wishlist_items").select("*").order("sort_order").order("name");
  const items = (data as WishlistItem[]) ?? [];
  return (
    <>
      <PanelTitle title="Lo que necesitamos" intro="La lista de donaciones en especie que aparece en “Apoya”. Suma lo que vaya llegando." action={<Link href="/ayudar" target="_blank" className="btn btn-outlined btn-sm"><Icon name="eye" size={18} /> Ver en el sitio</Link>} />
      {items.length === 0 ? (
        <Empty>La lista está vacía.</Empty>
      ) : (
        <ul className="grid gap-3">
          {items.map((i) => {
            const done = i.quantity_needed !== null && i.quantity_received >= i.quantity_needed;
            return (
              <li key={i.id} className="rounded-[20px] border border-outline-variant bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`chip text-xs ${i.priority === "urgente" ? "bg-error-container text-on-error-container" : "bg-surface-high"}`}>{PRIORITY[i.priority]}</span>
                  <span className={`min-w-0 flex-1 ${i.visible ? "" : "opacity-50"}`}>
                    <span className="font-semibold">{i.name}</span>
                    <span className="block text-sm text-on-surface-variant">
                      {i.quantity_needed ? `${i.quantity_received} de ${i.quantity_needed}` : `${i.quantity_received} recibidos`}
                      {done ? " · ¡completo!" : ""}{!i.visible ? " · oculto" : ""}
                    </span>
                  </span>
                  <form action={addReceived.bind(null, i.id, 1)}><SubmitButton className="btn btn-tonal btn-sm" pendingText="…"><Icon name="plus" size={16} /> Llegó 1</SubmitButton></form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">Editar</summary>
                  <div className="mt-3 grid gap-3 rounded-2xl bg-surface-low p-4">
                    <ActionForm action={updateWish.bind(null, i.id)} className="grid gap-3">
                      <Fields item={i} />
                      <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
                    </ActionForm>
                    <form action={deleteWish.bind(null, i.id)}><ConfirmButton message={`¿Quitar “${i.name}” de la lista?`}>Quitar</ConfirmButton></form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      <Panel title="Agregar a la lista" className="mt-8">
        <ActionForm action={createWish} resetOnSuccess className="grid gap-3">
          <Fields />
          <SubmitButton className="btn btn-tonal justify-self-start"><Icon name="plus" /> Agregar</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
