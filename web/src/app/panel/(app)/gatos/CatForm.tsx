import { ActionForm } from "@/components/panel/ActionForm";
import { Panel, TriState } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { CAT_STATUS } from "@/lib/format";
import type { ActionState, Cat, CatGroup, CatStatus } from "@/lib/types";

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>;

export function CatForm({ action, cat, groups }: { action: Action; cat?: Cat; groups: CatGroup[] }) {
  return (
    <ActionForm action={action} className="grid gap-6">
      <Panel title="Lo básico">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field"><span>Nombre *</span><input className="input" name="name" required maxLength={80} defaultValue={cat?.name} /></label>
          <label className="field">
            <span>Estado</span>
            <select className="input" name="status" defaultValue={cat?.status ?? "disponible"}>
              {(Object.keys(CAT_STATUS) as CatStatus[]).map((s) => <option key={s} value={s}>{CAT_STATUS[s].label}</option>)}
            </select>
          </label>
          <fieldset className="grid gap-2">
            <legend className="field-label">Sexo</legend>
            <div className="flex gap-2">
              {[["hembra", "Hembra"], ["macho", "Macho"], ["", "No sabemos"]].map(([v, l]) => (
                <label key={v || "x"} className="chip min-h-11 cursor-pointer border border-outline-variant bg-white px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-container">
                  <input type="radio" name="sex" value={v} defaultChecked={(cat?.sex ?? "") === v} className="sr-only" /> {l}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field"><span>Llegó al café</span><input className="input" type="date" name="arrived_at" defaultValue={cat?.arrived_at ?? ""} /></label>
          <label className="field">
            <span>Fecha de nacimiento (aproximada)</span>
            <input className="input" type="date" name="birth_date" defaultValue={cat?.birth_date ?? ""} />
            <span className="hint">Con esto la edad se calcula sola.</span>
          </label>
          <label className="field">
            <span>…o escribe la edad</span>
            <input className="input" name="age_label" placeholder="Ej. unos 2 años" maxLength={40} defaultValue={cat?.age_label ?? ""} />
          </label>
          {cat?.status === "apartado" && (
            <label className="field">
              <span>Apartado hasta</span>
              <input className="input" type="date" name="reserved_until" defaultValue={cat?.reserved_until ?? ""} />
              <span className="hint">Se pone una semana automáticamente al apartarlo.</span>
            </label>
          )}
        </div>
      </Panel>

      <Panel title="Cómo es">
        <div className="grid gap-4">
          <label className="field">
            <span>Frase corta para la tarjeta</span>
            <input className="input" name="short_bio" maxLength={300} defaultValue={cat?.short_bio ?? ""} placeholder="Ej. Duerme en el estante de las tazas y nadie se atreve a moverlo." />
          </label>
          <label className="field">
            <span>Su historia y personalidad</span>
            <textarea className="input !min-h-40" name="personality" maxLength={5000} defaultValue={cat?.personality ?? ""} />
            <span className="hint">Puedes usar **negritas** y dejar una línea en blanco entre párrafos.</span>
          </label>
          <label className="field">
            <span>Rasgos (separados por comas)</span>
            <input className="input" name="traits" defaultValue={cat?.traits.join(", ") ?? ""} placeholder="apapachadora, curiosa, dormilona" />
          </label>
        </div>
      </Panel>

      <Panel title="Salud y convivencia">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="check"><input type="checkbox" name="vaccinated" defaultChecked={cat?.vaccinated} /> Vacunas al día</label>
          <label className="check"><input type="checkbox" name="sterilized" defaultChecked={cat?.sterilized} /> Esterilizado</label>
          <label className="check"><input type="checkbox" name="dewormed" defaultChecked={cat?.dewormed} /> Desparasitado</label>
        </div>
        <label className="field mt-3"><span>Notas de salud (públicas)</span><input className="input" name="health_notes" maxLength={1000} defaultValue={cat?.health_notes ?? ""} /></label>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <TriState name="good_with_kids" label="¿Convive con niños?" value={cat?.good_with_kids ?? null} />
          <TriState name="good_with_dogs" label="¿Convive con perros?" value={cat?.good_with_dogs ?? null} />
          <TriState name="good_with_cats" label="¿Convive con gatos?" value={cat?.good_with_cats ?? null} />
        </div>
        <label className="check mt-4"><input type="checkbox" name="special_needs" defaultChecked={cat?.special_needs} /> Necesita cuidados especiales (senior, enfermedad crónica…)</label>
        <label className="field"><span>¿Qué implica adoptarlo?</span><input className="input" name="special_needs_notes" maxLength={1000} defaultValue={cat?.special_needs_notes ?? ""} /></label>
      </Panel>

      <Panel title="Pareja o camada">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">
            <span>Se adopta junto con…</span>
            <select className="input" name="group_id" defaultValue={cat?.group_id ?? ""}>
              <option value="">Nadie, va solo</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.kind})</option>)}
            </select>
          </label>
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <label className="field"><span>…o crea un grupo nuevo</span><input className="input" name="new_group" placeholder="Ej. Tamal y Nube" maxLength={80} /></label>
            <select className="input !w-auto" name="new_group_kind" aria-label="Tipo de grupo"><option value="pareja">Pareja</option><option value="camada">Camada</option></select>
          </div>
        </div>
      </Panel>

      <Panel title="Publicación">
        <label className="check"><input type="checkbox" name="published" defaultChecked={cat?.published ?? false} /> <span><strong>Publicado</strong>: se ve en el sitio. Déjalo sin marcar mientras completas la ficha.</span></label>
        <label className="check"><input type="checkbox" name="featured" defaultChecked={cat?.featured} /> Destacado: sale primero en el inicio</label>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-on-surface-variant">Opciones avanzadas</summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="field"><span>Dirección web</span><input className="input" name="slug" defaultValue={cat?.slug ?? ""} placeholder="se genera del nombre" /><span className="hint">bastetcatcafe.com/gatos/<strong>{cat?.slug ?? "nombre"}</strong></span></label>
            <label className="field"><span>Orden (menor sale primero)</span><input className="input" type="number" name="sort_order" defaultValue={cat?.sort_order ?? 0} /></label>
          </div>
        </details>
      </Panel>

      <div className="sticky bottom-0 -mx-4 border-t border-outline-variant bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <SubmitButton className="btn w-full md:w-auto">{cat ? "Guardar cambios" : "Crear gato"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
