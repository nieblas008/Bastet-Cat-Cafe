import { SetPasswordForm } from "./SetPasswordForm";

export const metadata = { title: "Elige tu contraseña", robots: { index: false } };

export default async function SetPasswordPage({ searchParams }: PageProps<"/cuenta/contrasena">) {
  const { next } = await searchParams;
  const dest = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/panel";
  return (
    <main className="grid min-h-svh place-items-center bg-surface-low px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-extrabold">Elige tu contraseña</h1>
        <p className="mt-2 text-on-surface-variant">Mínimo 8 caracteres. La vas a usar para entrar desde tu celular.</p>
        <SetPasswordForm next={dest} />
      </div>
    </main>
  );
}
