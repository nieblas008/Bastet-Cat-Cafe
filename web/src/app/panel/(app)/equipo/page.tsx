import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { setMemberActive, setMemberRole } from "./actions";
import { InviteForm } from "./InviteForm";

export const metadata = { title: "Equipo" };

const ROLE = { admin: "Administradora", staff: "Equipo", padrino: "Padrino (sin panel)" } as const;

export default async function Equipo() {
  const me = await requireAdmin();
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("*").in("role", ["admin", "staff"]).order("role").order("full_name");
  const team = (data as Profile[]) ?? [];

  return (
    <>
      <PanelTitle title="Equipo" intro="Quién puede entrar al panel. “Equipo” puede editar todo menos esta página; “Administradora” además invita y quita accesos." />
      <Panel title="Invitar a alguien">
        <InviteForm />
      </Panel>
      <Panel title="Personas con acceso" className="mt-6">
        <ul className="divide-y divide-outline-variant">
          {team.map((p) => (
            <li key={p.id} className={`flex flex-wrap items-center gap-3 py-3 ${p.active ? "" : "opacity-50"}`}>
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{p.full_name || "Sin nombre"}</span>{p.id === me.id && " (tú)"}
                <span className="block text-sm text-on-surface-variant">{p.email} · desde {shortDate(p.created_at)}{!p.active && " · sin acceso"}</span>
              </span>
              {p.id !== me.id && (
                <>
                  <form action={setMemberRole.bind(null, p.id)} className="flex gap-2">
                    <select className="input !min-h-10 text-sm" name="role" defaultValue={p.role}>
                      {Object.entries(ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <SubmitButton className="btn btn-tonal btn-sm" pendingText="…">Cambiar</SubmitButton>
                  </form>
                  <form action={setMemberActive.bind(null, p.id, !p.active)}>
                    {p.active ? (
                      <ConfirmButton message={`¿Quitarle el acceso a ${p.full_name || p.email}?`}>Quitar acceso</ConfirmButton>
                    ) : (
                      <SubmitButton className="btn btn-outlined btn-sm" pendingText="…">Devolver acceso</SubmitButton>
                    )}
                  </form>
                </>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
