import { ActionForm } from "@/components/panel/ActionForm";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";
import { saveSettings } from "./actions";

export const metadata = { title: "Datos del café" };

function Text({ name, label, s, hint, ...rest }: { name: keyof SiteSettings; label: string; s: SiteSettings; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" name={name} defaultValue={(s[name] as string | number | null) ?? ""} {...rest} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}
function Check({ name, label, s }: { name: keyof SiteSettings; label: string; s: SiteSettings }) {
  return <label className="check"><input type="checkbox" name={name} defaultChecked={Boolean(s[name])} /> {label}</label>;
}

export default async function Ajustes() {
  const sb = await createClient();
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).single();
  const s = data as SiteSettings;

  return (
    <>
      <PanelTitle title="Datos del café" intro="Contacto, redes, adopción, contador y datos para donar. Aparecen en todo el sitio." />
      <ActionForm action={saveSettings} className="grid gap-6">
        <Panel title="El café">
          <div className="grid gap-3 md:grid-cols-2">
            <Text s={s} name="cafe_name" label="Nombre" required />
            <Text s={s} name="tagline" label="Frase corta" required />
            <Text s={s} name="address" label="Dirección" />
            <Text s={s} name="maps_url" label="Enlace de Google Maps" placeholder="https://maps.app.goo.gl/…" />
            <Text s={s} name="maps_embed_url" label="Mapa para insertar" hint="En Google Maps: Compartir → Insertar un mapa → copia todo y pégalo aquí." />
            <Text s={s} name="entry_fee_note" label="Nota sobre la entrada" placeholder="Ej. Consumo mínimo de una bebida" />
          </div>
        </Panel>

        <Panel title="Contacto y redes">
          <div className="grid gap-3 md:grid-cols-2">
            <Text s={s} name="phone" label="Teléfono" inputMode="tel" />
            <Text s={s} name="whatsapp_number" label="WhatsApp" inputMode="tel" hint="Si lo dejas vacío, se usa el teléfono." />
            <Text s={s} name="email" label="Correo público" type="email" />
            <Text s={s} name="applications_email" label="Correo para avisos de solicitudes" type="email" hint="Interno: no se muestra en el sitio." />
            <Text s={s} name="instagram_url" label="Instagram" placeholder="https://instagram.com/…" />
            <Text s={s} name="facebook_url" label="Facebook" placeholder="https://facebook.com/…" />
            <Text s={s} name="tiktok_url" label="TikTok" placeholder="https://tiktok.com/@…" />
          </div>
        </Panel>

        <Panel title="Adopción">
          <div className="grid gap-3 md:grid-cols-2">
            <Text s={s} name="adoption_fee_mxn" label="Cuota de recuperación (MXN)" type="number" min={0} required />
            <Text s={s} name="adoption_response_days" label="Días para responder una solicitud" type="number" min={1} hint="Vacío = no se promete un plazo." />
          </div>
          <div className="mt-3 grid gap-2">
            <Check s={s} name="show_adoption_fee" label="Mostrar la cuota en el sitio" />
            <Check s={s} name="online_applications" label="Recibir solicitudes en línea" />
          </div>
        </Panel>

        <Panel title="Contador de adopciones">
          <p className="mb-3 text-sm text-on-surface-variant">Sube solo cada vez que un gato se marca como adoptado. Corrígelo aquí si hace falta.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Text s={s} name="adoptions_count" label="Adopciones hasta hoy" type="number" min={0} required />
            <Text s={s} name="adoptions_count_as_of" label="Contadas al" type="date" />
            <Text s={s} name="adoptions_goal" label="Meta" type="number" min={1} />
          </div>
          <div className="mt-3"><Check s={s} name="show_adoptions_counter" label="Mostrar el contador en el sitio" /></div>
        </Panel>

        <Panel title="Datos para donar">
          <p className="mb-3 text-sm text-on-surface-variant">Se muestran en “Apoya” y a los padrinos. Revisa que estén bien antes de publicarlos.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Text s={s} name="bank_name" label="Banco" />
            <Text s={s} name="bank_account_holder" label="A nombre de" />
            <Text s={s} name="bank_clabe" label="CLABE" inputMode="numeric" />
            <Text s={s} name="bank_card_number" label="Número de tarjeta" inputMode="numeric" />
          </div>
          <label className="field mt-3"><span>Nota para donar</span><textarea className="input" name="donations_note" rows={2} defaultValue={s.donations_note ?? ""} /></label>
        </Panel>

        <div className="sticky bottom-4 z-10">
          <SubmitButton className="btn shadow-lg">Guardar todo</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
