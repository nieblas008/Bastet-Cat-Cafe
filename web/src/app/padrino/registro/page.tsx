import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: PageProps<"/padrino/registro">) {
  const { gato, nivel } = await searchParams;
  const qs = new URLSearchParams();
  if (typeof gato === "string") qs.set("gato", gato.slice(0, 100));
  if (typeof nivel === "string") qs.set("nivel", nivel.slice(0, 40));
  const next = `/padrino${qs.size ? `?${qs}` : ""}`;
  if (await getCurrentProfile()) redirect(next);
  return (
    <div className="mx-auto mt-6 max-w-md">
      <div className="card p-8">
        <h1 className="font-display text-3xl font-extrabold">Hazte padrino</h1>
        <p className="mt-2 text-on-surface-variant">Crea tu cuenta y en el siguiente paso eliges a tu michi y cómo quieres apoyar.</p>
        <SignUpForm next={next} />
        <p className="mt-6 text-center text-sm">
          ¿Ya tienes cuenta? <Link href={`/padrino/entrar?siguiente=${encodeURIComponent(next)}`} className="font-semibold text-primary underline">Entra</Link>
        </p>
      </div>
    </div>
  );
}
