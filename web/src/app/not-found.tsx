import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="text-7xl" aria-hidden="true">🙀</p>
        <h1 className="font-display mt-4 text-4xl font-extrabold">Esta página se escondió</h1>
        <p className="mt-3 text-on-surface-variant">Como buen gato, no está donde la buscabas.</p>
        <Link href="/" className="btn mt-8">Volver al inicio</Link>
      </div>
    </main>
  );
}
