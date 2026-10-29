"use client";
import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/ui/FormStatus";
import type { ActionState } from "@/lib/types";

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>;

/** Formulario del panel con mensaje de "Guardado" / error debajo. */
export function ActionForm({
  action,
  children,
  className = "grid gap-5",
  resetOnSuccess = false,
  id,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  id?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} id={id} action={formAction} className={className}>
      {children}
      <FormMessage state={state} />
    </form>
  );
}
