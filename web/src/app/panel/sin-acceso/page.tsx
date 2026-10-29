import Link from "next/link";

export const metadata = { title: "Sin acceso", robots: { index: false } };

export default function NoAccess() {
  return (
    <main className="grid min-h-svh place-items-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-extrabold">Tu cuenta no tiene acceso al panel</h1>
        <p className="mt-3 text-on-surface-variant">Si eres parte del equipo, pídele a una administradora que te dé acceso. Si eres padrino, tu portal está en otra parte.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/padrino" className="btn">Portal de padrinos</Link>
          <form action="/auth/salir" method="post"><button className="btn btn-outlined">Salir</button></form>
        </div>
      </div>
    </main>
  );
}
