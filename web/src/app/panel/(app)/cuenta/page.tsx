import Link from "next/link";
import { ActionForm } from "@/components/panel/ActionForm";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { requireStaff } from "@/lib/auth";
import { updateMyProfile } from "./actions";

export const metadata = { title: "Mi cuenta" };

export default async function MiCuenta() {
  const me = await requireStaff();
  return (
    <>
      <PanelTitle title="Mi cuenta" intro={`${me.email} · ${me.role === "admin" ? "Administradora" : "Equipo"}`} />
      <div className="grid max-w-xl gap-6">
        <Panel title="Mis datos">
          <ActionForm action={updateMyProfile} className="grid gap-3">
            <label className="field"><span>Nombre</span><input className="input" name="full_name" required maxLength={120} defaultValue={me.full_name} /></label>
            <label className="field"><span>Teléfono</span><input className="input" name="phone" inputMode="tel" maxLength={30} defaultValue={me.phone ?? ""} /></label>
            <SubmitButton className="btn btn-sm justify-self-start">Guardar</SubmitButton>
          </ActionForm>
        </Panel>
        <Panel title="Contraseña">
          <Link href="/cuenta/contrasena?next=/panel/cuenta" className="btn btn-outlined btn-sm">Cambiar contraseña</Link>
        </Panel>
        <form action="/auth/salir" method="post">
          <button className="btn btn-text">Cerrar sesión</button>
        </form>
      </div>
    </>
  );
}
