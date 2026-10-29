"use server";
import { check, f, staffAction, UserError } from "@/lib/panel";
import type { ActionState } from "@/lib/types";

export async function saveWeek(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    for (let d = 0; d < 7; d++) {
      const is_open = f.bool(fd, `open_${d}`);
      const opens_at = f.time(fd, `opens_${d}`);
      const closes_at = f.time(fd, `closes_${d}`);
      if (is_open && (!opens_at || !closes_at)) throw new UserError("Pon hora de apertura y cierre en los días abiertos.");
      if (is_open && opens_at! >= closes_at!) throw new UserError("La hora de cierre debe ser después de la de apertura.");
      check(
        await sb
          .from("weekly_schedule")
          .update({ is_open, opens_at: is_open ? opens_at : null, closes_at: is_open ? closes_at : null, note: f.str(fd, `note_${d}`, 200) })
          .eq("day_of_week", d),
      );
    }
    return "Horario publicado.";
  });
}

export async function addException(_: ActionState, fd: FormData): Promise<ActionState> {
  return staffAction(async ({ sb }) => {
    const date = f.date(fd, "date");
    if (!date) throw new UserError("Elige la fecha.");
    const is_open = f.bool(fd, "is_open");
    const opens_at = f.time(fd, "opens_at");
    const closes_at = f.time(fd, "closes_at");
    if (is_open && (!opens_at || !closes_at)) throw new UserError("Si ese día abren, pon el horario.");
    check(
      await sb.from("schedule_exceptions").upsert({
        date,
        is_open,
        opens_at: is_open ? opens_at : null,
        closes_at: is_open ? closes_at : null,
        note: f.str(fd, "note", 200),
      }),
    );
    return "Día especial guardado.";
  });
}

export async function deleteException(date: string) {
  await staffAction(async ({ sb }) => {
    check(await sb.from("schedule_exceptions").delete().eq("date", date));
  });
}
