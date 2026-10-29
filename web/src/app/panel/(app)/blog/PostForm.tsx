"use client";
import { useState } from "react";
import { ActionForm } from "@/components/panel/ActionForm";
import { SubmitButton } from "@/components/ui/FormStatus";
import { POST_CATEGORY_LABEL } from "@/lib/format";
import type { ActionState, Post } from "@/lib/types";

type Action = (s: ActionState, fd: FormData) => Promise<ActionState>;

/** Formulario de entradas del blog. Los campos del evento solo aparecen si la categoría es "Evento". */
export function PostForm({ action, post, cats, local }: { action: Action; post?: Post; cats: { id: string; name: string }[]; local: { published: string; starts: string; ends: string } }) {
  const [category, setCategory] = useState(post?.category ?? "noticia");
  return (
    <ActionForm action={action} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field md:col-span-2"><span>Título *</span><input className="input" name="title" required maxLength={160} defaultValue={post?.title} /></label>
        <label className="field">
          <span>Categoría</span>
          <select className="input" name="category" value={category} onChange={(e) => setCategory(e.target.value as Post["category"])}>
            {Object.entries(POST_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Gato relacionado</span>
          <select className="input" name="related_cat_id" defaultValue={post?.related_cat_id ?? ""}>
            <option value="">Ninguno</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field md:col-span-2"><span>Resumen (sale en la tarjeta)</span><input className="input" name="excerpt" maxLength={300} defaultValue={post?.excerpt ?? ""} /></label>
      </div>

      {category === "evento" && (
        <fieldset className="grid gap-3 rounded-2xl bg-surface-low p-4 md:grid-cols-3">
          <legend className="field-label px-1">Datos del evento</legend>
          <label className="field"><span>Empieza *</span><input className="input" type="datetime-local" name="event_starts_at" required defaultValue={local.starts} /></label>
          <label className="field"><span>Termina</span><input className="input" type="datetime-local" name="event_ends_at" defaultValue={local.ends} /></label>
          <label className="field"><span>Lugar</span><input className="input" name="event_location" maxLength={200} defaultValue={post?.event_location ?? ""} placeholder="En el café" /></label>
        </fieldset>
      )}

      <label className="field">
        <span>Texto</span>
        <textarea className="input min-h-[280px] font-mono text-[15px]" name="body" defaultValue={post?.body ?? ""} />
        <span className="hint">Deja una línea en blanco entre párrafos. ## para subtítulos, - para listas, **negritas**, [texto](https://enlace).</span>
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="field"><span>Texto del botón</span><input className="input" name="cta_label" maxLength={60} defaultValue={post?.cta_label ?? ""} placeholder={category === "sorteo" ? "Participa en Instagram" : "Ej. Reserva tu lugar"} /></label>
        <label className="field"><span>Enlace del botón</span><input className="input" name="cta_url" maxLength={500} defaultValue={post?.cta_url ?? ""} placeholder="https://…" /></label>
        <label className="field"><span>Dirección web (opcional)</span><input className="input" name="slug" maxLength={80} defaultValue={post?.slug ?? ""} placeholder="se genera del título" /></label>
        <label className="field"><span>Fecha de publicación</span><input className="input" type="datetime-local" name="published_at" defaultValue={local.published} /><span className="hint">Si la pones en el futuro, aparece sola ese día.</span></label>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="check"><input type="radio" name="status" value="borrador" defaultChecked={(post?.status ?? "borrador") === "borrador"} /> Borrador</label>
        <label className="check"><input type="radio" name="status" value="publicado" defaultChecked={post?.status === "publicado"} /> Publicado</label>
        <label className="check"><input type="checkbox" name="pinned" defaultChecked={post?.pinned} /> Fijar arriba</label>
      </div>
      <SubmitButton className="btn justify-self-start">{post ? "Guardar" : "Crear entrada"}</SubmitButton>
    </ActionForm>
  );
}
