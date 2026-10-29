"use client";
import { useMemo, useState } from "react";
import { CatCard } from "@/components/site/CatBits";
import { lifeStage } from "@/lib/format";
import type { CatStatus, CatWithPhotos } from "@/lib/types";

type Filters = { status: Set<string>; age: Set<string>; sex: Set<string>; compat: Set<string> };

const GROUPS: { key: keyof Filters; label: string; options: [string, string][] }[] = [
  {
    key: "status",
    label: "Estado",
    options: [
      ["disponible", "En adopción"],
      ["apartado", "Apartados"],
      ["residente", "Residentes"],
      ["en_tratamiento", "En tratamiento"],
    ],
  },
  { key: "age", label: "Edad", options: [["cachorro", "Cachorro"], ["joven", "Joven"], ["adulto", "Adulto"], ["senior", "Senior"]] },
  { key: "sex", label: "Sexo", options: [["hembra", "Hembra"], ["macho", "Macho"]] },
  { key: "compat", label: "Convive", options: [["kids", "Con niños"], ["dogs", "Con perros"], ["cats", "Con otros gatos"]] },
];

export function CatFilters({ cats, sponsors }: { cats: CatWithPhotos[]; sponsors: Record<string, number> }) {
  const [f, setF] = useState<Filters>({ status: new Set(), age: new Set(), sex: new Set(), compat: new Set() });

  const toggle = (key: keyof Filters, value: string) =>
    setF((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });

  const filtered = useMemo(
    () =>
      cats.filter((c) => {
        if (f.status.size && !f.status.has(c.status as CatStatus)) return false;
        if (f.age.size) {
          const stage = lifeStage(c.birth_date, c.age_label);
          if (!stage || !f.age.has(stage)) return false;
        }
        if (f.sex.size && (!c.sex || !f.sex.has(c.sex))) return false;
        if (f.compat.has("kids") && !c.good_with_kids) return false;
        if (f.compat.has("dogs") && !c.good_with_dogs) return false;
        if (f.compat.has("cats") && !c.good_with_cats) return false;
        return true;
      }),
    [cats, f],
  );

  const active = Object.values(f).some((s) => s.size > 0);

  return (
    <>
      <div className="container-site grid gap-3">
        {GROUPS.map((g) => (
          <div key={g.key} className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-[11px] font-bold uppercase tracking-[.14em] text-on-surface-variant">{g.label}</span>
            {g.options.map(([value, label]) => {
              const on = f[g.key].has(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(g.key, value)}
                  className={`chip min-h-10 border transition-colors ${on ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant bg-white hover:bg-surface-high"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
        {active && (
          <button type="button" className="btn btn-text btn-sm justify-self-start" onClick={() => setF({ status: new Set(), age: new Set(), sex: new Set(), compat: new Set() })}>
            Quitar filtros
          </button>
        )}
      </div>
      <div className="container-site mt-8">
        <p className="mb-4 text-sm text-on-surface-variant" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "gato" : "gatos"}
        </p>
        {filtered.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cat, i) => (
              <CatCard key={cat.id} cat={cat} index={i} sponsors={sponsors[cat.id] ?? 0} />
            ))}
          </div>
        ) : (
          <p className="rounded-[24px] bg-surface-mid p-8 text-center">Ningún gato coincide con esos filtros. Prueba quitando alguno.</p>
        )}
      </div>
    </>
  );
}
