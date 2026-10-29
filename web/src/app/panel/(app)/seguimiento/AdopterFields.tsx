import type { Adopter } from "@/lib/types";
import { todayISO } from "@/lib/format";

export function AdopterFields({ adopter, cats }: { adopter?: Adopter; cats: { id: string; name: string }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="field"><span>Nombre de quien adoptó *</span><input className="input" name="full_name" required maxLength={160} defaultValue={adopter?.full_name} /></label>
      <label className="field"><span>Teléfono / WhatsApp</span><input className="input" name="phone" inputMode="tel" maxLength={30} defaultValue={adopter?.phone ?? ""} /></label>
      <label className="field"><span>Correo</span><input className="input" type="email" name="email" maxLength={200} defaultValue={adopter?.email ?? ""} /></label>
      <label className="field">
        <span>Gato (si está en el sitio)</span>
        <select className="input" name="cat_id" defaultValue={adopter?.cat_id ?? ""}>
          <option value="">— No está en el sitio —</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Nombre del gato</span><input className="input" name="cat_name" maxLength={80} defaultValue={adopter?.cat_name ?? ""} placeholder="Para adopciones de antes" /></label>
      <label className="field"><span>Fecha de adopción</span><input className="input" type="date" name="adopted_on" defaultValue={adopter?.adopted_on ?? todayISO()} /></label>
      <label className="field"><span>Contactar cada (días)</span><input className="input" type="number" name="followup_interval_days" min={1} max={365} defaultValue={adopter?.followup_interval_days ?? 7} /></label>
      <label className="field md:col-span-2"><span>Notas</span><textarea className="input" name="notes" rows={2} maxLength={4000} defaultValue={adopter?.notes ?? ""} /></label>
    </div>
  );
}
