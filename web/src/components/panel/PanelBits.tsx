import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function PanelTitle({ title, intro, back, action }: { title: string; intro?: string; back?: { href: string; label: string }; action?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <Icon name="back" size={16} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{title}</h1>
          {intro && <p className="mt-1 max-w-2xl text-on-surface-variant">{intro}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[24px] border border-outline-variant bg-white p-5 md:p-6 ${className}`}>
      {title && <h2 className="font-display mb-4 text-xl font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[20px] bg-surface-mid p-6 text-center text-on-surface-variant">{children}</p>;
}

/** Selector Sí / No / No sabemos para datos que pueden ser desconocidos. */
export function TriState({ name, label, value }: { name: string; label: string; value: boolean | null }) {
  const current = value === true ? "si" : value === false ? "no" : "";
  return (
    <fieldset className="grid gap-2">
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {[
          ["si", "Sí"],
          ["no", "No"],
          ["", "No sabemos"],
        ].map(([v, l]) => (
          <label key={v || "x"} className="chip min-h-11 cursor-pointer border border-outline-variant bg-white px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-container">
            <input type="radio" name={name} value={v} defaultChecked={current === v} className="sr-only" /> {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
