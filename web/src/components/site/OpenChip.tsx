"use client";
import { useEffect, useState } from "react";
import { openStatus } from "@/lib/format";
import type { ScheduleDay, ScheduleException } from "@/lib/types";

/** Se calcula en el navegador para que esté al día aunque la página venga de caché. */
export function OpenChip({ week, exceptions, className = "" }: { week: ScheduleDay[]; exceptions: ScheduleException[]; className?: string }) {
  const [status, setStatus] = useState(() => openStatus(week, exceptions));
  useEffect(() => {
    const tick = () => setStatus(openStatus(week, exceptions));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [week, exceptions]);

  if (!status.known) return null;
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] font-semibold ${className}`} suppressHydrationWarning>
      <span className={`pulse-dot size-2.5 rounded-full ${status.open ? "bg-success text-success/40" : "bg-error text-error/40"}`} />
      <span suppressHydrationWarning>{status.label}</span>
    </span>
  );
}
