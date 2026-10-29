import Link from "next/link";
import { LoginForm } from "@/components/ui/LoginForm";

export const metadata = { title: "Entrar" };

export default async function PadrinoLogin({ searchParams }: PageProps<"/padrino/entrar">) {
  const { siguiente, error } = await searchParams;
  const next = typeof siguiente === "string" && siguiente.startsWith("/padrino") ? siguiente : "/padrino";
  const query = next.includes("?") ? next.slice(next.indexOf("?")) : "";
  return (
    <div className="mx-auto mt-6 max-w-md">
      <div className="card p-8">
        <h1 className="font-display text-3xl font-extrabold">Portal de padrinos</h1>
        <p className="mt-2 text-on-surface-variant">Entra para ver las fotos y videos de tu michi.</p>
        {error === "enlace" && <p className="mt-5 rounded-2xl bg-error-container p-3 text-sm text-on-error-container">El enlace ya caducó o ya se usó. Intenta entrar o pide uno nuevo.</p>}
        <LoginForm next={next} area="padrino" />
        <p className="mt-6 text-center text-sm">
          ¿Primera vez? <Link href={`/padrino/registro${query}`} className="font-semibold text-primary underline">Crea tu cuenta</Link>
        </p>
      </div>
    </div>
  );
}
