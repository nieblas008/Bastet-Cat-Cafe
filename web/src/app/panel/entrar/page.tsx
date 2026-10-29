import Image from "next/image";
import { LoginForm } from "@/components/ui/LoginForm";

export const metadata = { title: "Panel · Entrar", robots: { index: false } };

export default async function PanelLogin({ searchParams }: PageProps<"/panel/entrar">) {
  const { siguiente, error } = await searchParams;
  const next = typeof siguiente === "string" && siguiente.startsWith("/panel") ? siguiente : "/panel";
  return (
    <main className="grid min-h-svh place-items-center bg-surface-low px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-brand"><Image src="/logo.svg" alt="" width={48} height={48} /></span>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Panel de Bastet</h1>
            <p className="text-sm text-on-surface-variant">Solo para el equipo del café</p>
          </div>
        </div>
        {error === "enlace" && <p className="mt-5 rounded-2xl bg-error-container p-3 text-sm text-on-error-container">El enlace ya caducó o ya se usó. Pide uno nuevo.</p>}
        <LoginForm next={next} area="panel" />
      </div>
    </main>
  );
}
