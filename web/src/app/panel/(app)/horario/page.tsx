import { ActionForm } from "@/components/panel/ActionForm";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { Panel, PanelTitle } from "@/components/panel/PanelBits";
import { SubmitButton } from "@/components/ui/FormStatus";
import { Icon } from "@/components/ui/Icon";
import { DAY_NAMES, WEEK_ORDER, longDate, time12, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleDay, ScheduleException } from "@/lib/types";
import { addException, deleteException, saveWeek } from "./actions";
import { DayRow } from "./DayRow";

export const metadata = { title: "Horario" };

export default async function SchedulePage() {
  const sb = await createClient();
  const [{ data: week }, { data: exceptions }] = await Promise.all([
    sb.from("weekly_schedule").select("*").order("day_of_week"),
    sb.from("schedule_exceptions").select("*").gte("date", todayISO()).order("date"),
  ]);
  const days = (week as ScheduleDay[]) ?? [];
  const todayDow = new Date(`${todayISO()}T12:00:00Z`).getUTCDay();

  return (
    <>
      <PanelTitle title="Horario de la semana" intro="Lo que guardes aquí alimenta el chip “Abierto ahora”, el inicio, Visítanos y el pie de página." />
      <ActionForm action={saveWeek} className="grid gap-3">
        {WEEK_ORDER.map((d) => {
          const day = days.find((x) => x.day_of_week === d) ?? { day_of_week: d, is_open: false, opens_at: null, closes_at: null, note: null };
          return <DayRow key={d} day={day} name={DAY_NAMES[d]} isToday={d === todayDow} />;
        })}
        <p className="text-sm text-on-surface-variant">Tip: cuando cierren un día, deja una nota. La gente agradece saber por qué.</p>
        <div className="sticky bottom-0 -mx-4 bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0">
          <SubmitButton className="btn w-full md:w-auto">Guardar y publicar</SubmitButton>
        </div>
      </ActionForm>

      <Panel title="Días especiales" className="mt-8">
        <p className="mb-4 text-sm text-on-surface-variant">Feriados, cierres por evento o un horario distinto solo por un día. Tienen prioridad sobre el horario de la semana.</p>
        <ActionForm action={addException} resetOnSuccess className="grid gap-3 md:grid-cols-[auto_auto_1fr_1fr_2fr_auto] md:items-end">
          <label className="field"><span>Fecha</span><input className="input" type="date" name="date" required min={todayISO()} /></label>
          <label className="check md:pb-1"><input type="checkbox" name="is_open" /> Abrimos</label>
          <label className="field"><span>Abre</span><input className="input" type="time" name="opens_at" /></label>
          <label className="field"><span>Cierra</span><input className="input" type="time" name="closes_at" /></label>
          <label className="field"><span>Nota</span><input className="input" name="note" placeholder="Ej. Cerrado por Navidad" maxLength={200} /></label>
          <SubmitButton className="btn btn-tonal"><Icon name="plus" /> Agregar</SubmitButton>
        </ActionForm>
        {((exceptions as ScheduleException[]) ?? []).length > 0 && (
          <ul className="mt-5 divide-y divide-outline-variant">
            {(exceptions as ScheduleException[]).map((e) => (
              <li key={e.date} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <strong>{longDate(e.date, { weekday: "long", year: undefined })}</strong> ·{" "}
                  {e.is_open ? `${time12(e.opens_at)} – ${time12(e.closes_at)}` : "Cerrado"}
                  {e.note && <span className="block text-sm text-on-surface-variant">{e.note}</span>}
                </span>
                <form action={deleteException.bind(null, e.date)}>
                  <ConfirmButton message="¿Quitar este día especial?"><Icon name="trash" size={16} /></ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
