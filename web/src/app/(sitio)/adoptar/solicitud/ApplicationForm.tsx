"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/FormStatus";
import { submitAdoptionApplication } from "../../actions";

type CatOption = { id: string; name: string };

function YesNo({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="field-label">{label}</legend>
      <div className="flex gap-2">
        {[
          ["si", "Sí"],
          ["no", "No"],
        ].map(([v, l]) => (
          <label key={v} className="chip min-h-11 cursor-pointer border border-outline-variant bg-white px-5 has-[:checked]:border-primary has-[:checked]:bg-primary-container">
            <input type="radio" name={name} value={v} className="sr-only" /> {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ApplicationForm({ cats, preselected, feeLabel }: { cats: CatOption[]; preselected?: string; feeLabel: string | null }) {
  const [state, action] = useActionState(submitAdoptionApplication, null);
  const [checks, setChecks] = useState({ id: false, address: false, carrier: false, fee: false });
  const allReady = checks.id && checks.address && checks.carrier && (feeLabel ? checks.fee : true);

  return (
    <form action={action} className="mt-8 grid gap-10">
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <fieldset className="card grid gap-4 p-6 md:p-8">
        <legend className="font-display px-2 text-2xl font-extrabold">1. ¿Cumples con los requisitos?</legend>
        <p className="text-sm text-on-surface-variant">Marca lo que ya tienes. Si te falta algo, puedes enviar la solicitud igual.</p>
        <label className="check"><input type="checkbox" name="has_official_id" onChange={(e) => setChecks((c) => ({ ...c, id: e.target.checked }))} /> Tengo identificación oficial</label>
        <label className="check"><input type="checkbox" name="has_proof_of_address" onChange={(e) => setChecks((c) => ({ ...c, address: e.target.checked }))} /> Tengo comprobante de domicilio</label>
        <label className="check"><input type="checkbox" name="has_carrier" onChange={(e) => setChecks((c) => ({ ...c, carrier: e.target.checked }))} /> Tengo (o voy a conseguir) transportadora</label>
        {feeLabel && (
          <label className="check"><input type="checkbox" name="accepts_fee" onChange={(e) => setChecks((c) => ({ ...c, fee: e.target.checked }))} /> Puedo cubrir la cuota de recuperación de {feeLabel}</label>
        )}
        {!allReady && (
          <p className="rounded-2xl bg-tertiary-container p-3 text-sm text-on-tertiary-container">
            Sin problema: si pasas la entrevista y te falta algún requisito, te podemos apartar al gato hasta una semana mientras lo completas.
          </p>
        )}
      </fieldset>

      <fieldset className="card grid gap-4 p-6 md:p-8">
        <legend className="font-display px-2 text-2xl font-extrabold">2. El gato</legend>
        <label className="field">
          <span>¿A quién quieres adoptar?</span>
          <select name="cat_id" className="input" defaultValue={preselected ?? ""}>
            <option value="">Todavía no sé, ayúdenme a elegir</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="card grid gap-4 p-6 md:p-8">
        <legend className="font-display px-2 text-2xl font-extrabold">3. Tus datos</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field"><span>Nombre completo *</span><input className="input" name="full_name" required maxLength={160} autoComplete="name" /></label>
          <label className="field"><span>Teléfono o WhatsApp *</span><input className="input" name="phone" required maxLength={30} inputMode="tel" autoComplete="tel" /></label>
          <label className="field"><span>Correo</span><input className="input" type="email" name="email" maxLength={200} autoComplete="email" /></label>
          <label className="field"><span>Edad</span><input className="input" type="number" name="age" min={18} max={120} /></label>
          <label className="field"><span>Ciudad</span><input className="input" name="city" defaultValue="Tijuana" maxLength={120} /></label>
          <label className="field"><span>Colonia</span><input className="input" name="neighborhood" maxLength={120} /></label>
        </div>
      </fieldset>

      <fieldset className="card grid gap-5 p-6 md:p-8">
        <legend className="font-display px-2 text-2xl font-extrabold">4. Tu hogar</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">
            <span>Tipo de vivienda</span>
            <select name="housing_type" className="input" defaultValue="">
              <option value="">Elige una opción</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="cuarto">Cuarto</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="field">
            <span>La vivienda es</span>
            <select name="housing_tenure" className="input" defaultValue="">
              <option value="">Elige una opción</option>
              <option value="propia">Propia</option>
              <option value="rentada">Rentada</option>
              <option value="familiar">De un familiar</option>
            </select>
          </label>
          <label className="field"><span>¿Cuántos adultos viven ahí?</span><input className="input" type="number" name="household_adults" min={0} max={30} /></label>
          <label className="field"><span>¿Cuántos niños?</span><input className="input" type="number" name="household_children" min={0} max={30} /></label>
          <label className="field md:col-span-2"><span>Edades de los niños (si hay)</span><input className="input" name="children_ages" maxLength={200} /></label>
        </div>
        <YesNo name="landlord_allows_pets" label="Si rentas, ¿el dueño permite mascotas?" />
        <label className="field"><span>¿Tienes otras mascotas? ¿Cuáles?</span><textarea className="input" name="other_pets" maxLength={1000} /></label>
        <YesNo name="pets_sterilized" label="¿Tus otras mascotas están esterilizadas?" />
        <label className="field"><span>¿Cuántas horas al día estaría solo el gato?</span><input className="input" name="hours_alone" maxLength={200} /></label>
      </fieldset>

      <fieldset className="card grid gap-5 p-6 md:p-8">
        <legend className="font-display px-2 text-2xl font-extrabold">5. Lo que viene</legend>
        <p className="text-sm text-on-surface-variant">Un gato vive de 15 a 20 años. Estas preguntas nos ayudan a que no regrese.</p>
        <YesNo name="planned_move" label="¿Planeas mudarte en el próximo año?" />
        <YesNo name="expecting_family_change" label="¿Esperas cambios en casa? (un bebé, pareja nueva, otra mascota)" />
        <label className="field"><span>¿Has tenido gatos antes? Cuéntanos</span><textarea className="input" name="previous_cats" maxLength={2000} /></label>
        <label className="field"><span>¿Por qué quieres adoptar?</span><textarea className="input" name="why_adopt" maxLength={4000} /></label>
        <label className="field"><span>¿Algo más que debamos saber?</span><textarea className="input" name="extra_notes" maxLength={4000} /></label>
      </fieldset>

      <div className="grid gap-4">
        <label className="check">
          <input type="checkbox" name="privacy_accepted" required />
          <span>
            Acepto el <Link href="/aviso-de-privacidad" className="font-semibold text-primary underline" target="_blank">aviso de privacidad</Link> y que me contacten para la entrevista.
          </span>
        </label>
        <FormMessage state={state} />
        <SubmitButton className="btn !min-h-14 justify-self-start !px-8 !text-base" pendingText="Enviando…">
          Enviar solicitud
        </SubmitButton>
      </div>
    </form>
  );
}
