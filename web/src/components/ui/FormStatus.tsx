"use client";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/types";

export function SubmitButton({ children, className = "btn", pendingText = "Guardando…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${state.ok ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}
    >
      {state.message}
    </p>
  );
}
