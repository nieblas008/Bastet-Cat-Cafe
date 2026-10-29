"use client";
import { useState } from "react";
import type { ScheduleDay } from "@/lib/types";

export function DayRow({ day, name, isToday }: { day: ScheduleDay; name: string; isToday: boolean }) {
  const [open, setOpen] = useState(day.is_open);
  const d = day.day_of_week;
  return (
    <div className="grid items-center gap-3 rounded-[20px] border border-outline-variant bg-white p-4 md:grid-cols-[150px_140px_1fr_2fr]">
      <p className="flex items-center gap-2 font-semibold">
        {name}
        {isToday && <span className="chip bg-primary !px-2 !py-0.5 !text-[11px] text-on-primary">HOY</span>}
      </p>
      <label className={`chip min-h-12 cursor-pointer justify-center !text-sm ${open ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}>
        <input type="checkbox" name={`open_${d}`} className="sr-only" checked={open} onChange={(e) => setOpen(e.target.checked)} />
        {open ? "Abierto" : "Cerrado"}
      </label>
      <div className="flex items-center gap-2">
        <input className="input" type="time" name={`opens_${d}`} defaultValue={day.opens_at?.slice(0, 5) ?? "12:00"} disabled={!open} aria-label={`${name}: abre`} />
        <span className="text-sm text-on-surface-variant">a</span>
        <input className="input" type="time" name={`closes_${d}`} defaultValue={day.closes_at?.slice(0, 5) ?? "20:00"} disabled={!open} aria-label={`${name}: cierra`} />
      </div>
      <input className="input" name={`note_${d}`} defaultValue={day.note ?? ""} placeholder="Añadir nota (opcional)…" maxLength={200} aria-label={`${name}: nota`} />
    </div>
  );
}
