import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CAT_STATUS, catAge, publicImage } from "@/lib/format";
import type { CatStatus, CatWithPhotos } from "@/lib/types";

const BLOBS = ["blob-a", "blob-b", "blob-c"];

export function StatusBadge({ status, className = "" }: { status: CatStatus; className?: string }) {
  const s = CAT_STATUS[status];
  return <span className={`chip ${s.tone} ${className}`}>{s.label}</span>;
}

export function CatImage({
  cat,
  index = 0,
  photoIndex = 0,
  sizes = "(min-width: 1024px) 360px, 90vw",
  priority = false,
  className = "",
}: {
  cat: CatWithPhotos;
  index?: number;
  photoIndex?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const photo = cat.cat_photos?.[photoIndex];
  const src = publicImage(photo?.storage_path);
  return (
    <div className={`relative aspect-square overflow-hidden bg-surface-highest ${BLOBS[index % 3]} ${className}`}>
      {src ? (
        <Image src={src} alt={photo?.alt || `Foto de ${cat.name}`} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="grid size-full place-items-center bg-[radial-gradient(120%_90%_at_20%_10%,#FFD9E2_0%,#F5E4E7_45%,#FFDCBD_100%)] text-primary/50">
          <Icon name="paw" size={72} />
        </div>
      )}
    </div>
  );
}

export function compatText(cat: Pick<CatWithPhotos, "good_with_kids" | "good_with_dogs" | "good_with_cats">) {
  const list = [cat.good_with_kids && "niños", cat.good_with_dogs && "perros", cat.good_with_cats && "gatos"].filter(Boolean);
  return list.length ? `Convive con ${list.join(" · ")}` : null;
}

export function CatCard({ cat, index = 0, sponsors = 0 }: { cat: CatWithPhotos; index?: number; sponsors?: number }) {
  const age = catAge(cat.birth_date, cat.age_label);
  const compat = compatText(cat);
  return (
    <Link
      href={`/gatos/${cat.slug}`}
      className="card group flex flex-col p-3 pb-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(62,0,29,.45)]"
    >
      <div className="relative">
        <CatImage cat={cat} index={index} className="transition-transform duration-700 ease-[var(--ease-spring)] group-hover:scale-[1.02]" />
        <StatusBadge status={cat.status} className="absolute bottom-3 left-3 shadow-sm" />
        {sponsors > 0 && (
          <span className="chip absolute right-3 top-3 bg-white/90 text-primary shadow-sm">
            <Icon name="heart" size={14} /> Apadrinado
          </span>
        )}
      </div>
      <div className="mt-4 px-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold">{cat.name}</h3>
          <span className="text-xs text-on-surface-variant">
            {[age, cat.sex].filter(Boolean).join(" · ")}
          </span>
        </div>
        {cat.short_bio && <p className="mt-1.5 line-clamp-3 text-sm text-on-surface-variant">{cat.short_bio}</p>}
        {cat.traits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cat.traits.slice(0, 3).map((t) => (
              <span key={t} className="chip bg-secondary-container !px-2.5 !py-1 !text-xs text-on-secondary-container">
                {t}
              </span>
            ))}
          </div>
        )}
        {cat.status === "apartado" && cat.reserved_until && (
          <p className="mt-3 text-xs font-semibold text-tertiary">Alguien está en proceso. Si no se concreta, vuelve a estar disponible.</p>
        )}
        {compat && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-tertiary">
            <Icon name="check" size={14} /> {compat}
          </p>
        )}
      </div>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, intro, action }: { eyebrow?: string; title: string; intro?: string | null; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</p>}
        <h2 className="font-display mt-2 text-3xl font-extrabold md:text-[40px] md:leading-[1.05]">{title}</h2>
        {intro && <p className="mt-3 text-on-surface-variant md:text-lg">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string | null; children?: React.ReactNode }) {
  return (
    <section className="container-site pt-12 pb-8 md:pt-16">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</p>}
      <h1 className="font-display mt-2 text-[42px] font-extrabold leading-[1.02] md:text-[64px]">{title}</h1>
      {intro && <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">{intro}</p>}
      {children}
    </section>
  );
}

export function AdoptionCounter({ count, goal, asOf }: { count: number; goal: number; asOf?: string | null }) {
  const pct = Math.min(100, (count / goal) * 100);
  return (
    <div className="rounded-[28px] bg-primary-container p-6 text-on-primary-container md:p-8">
      <p className="text-xs font-bold uppercase tracking-[.14em]">Rumbo a {new Intl.NumberFormat("es-MX").format(goal)} adopciones</p>
      <p className="font-display mt-2 text-5xl font-extrabold md:text-6xl">
        {new Intl.NumberFormat("es-MX").format(count)}
        <span className="ml-2 text-xl font-bold opacity-70">gatos con familia</span>
      </p>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/70" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={count}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm opacity-80">
        Llevamos el {pct.toFixed(0)}% de la meta de nuestra fundadora{asOf ? "" : ""}. Cada adopción cuenta.
      </p>
    </div>
  );
}
