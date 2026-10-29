"use client";
import { useFormStatus } from "react-dom";

/** Botón que pide confirmación antes de enviar (para borrar). */
export function ConfirmButton({ children, message = "¿Seguro? Esto no se puede deshacer.", className = "btn btn-danger btn-sm" }: { children: React.ReactNode; message?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
