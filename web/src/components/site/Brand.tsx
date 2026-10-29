import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3 no-underline" aria-label="Bastet Cat Café, inicio">
      <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-brand shadow-[0_6px_18px_rgba(185,0,98,.28)] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-12 group-hover:scale-105">
        <Image src="/logo.svg" alt="" width={44} height={44} priority />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="font-display block text-[21px] font-extrabold">Bastet</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.14em] text-primary">Cat Café · Tijuana</span>
        </span>
      )}
    </Link>
  );
}
