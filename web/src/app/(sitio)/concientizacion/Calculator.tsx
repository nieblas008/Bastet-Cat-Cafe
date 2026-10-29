"use client";
import { useMemo, useState } from "react";

/**
 * Cuántos gatos pueden venir de UNA gata sin esterilizar.
 * Supuestos (los datos que dio el equipo de Bastet):
 *  - queda embarazada a los 4 meses → primera camada a los 6 meses (gestación ~2 meses)
 *  - vuelve a quedar embarazada al mes de parir → una camada cada 3 meses
 *  - camadas de 3 a 6 gatitos; la mitad son hembras
 *  - solo una parte de los gatitos llega a adulto (ajustable)
 * Es una estimación, no un dato exacto.
 */
function simulate(years: number, litter: number, survival: number) {
  const months = years * 12;
  // hembras por edad en meses (valores esperados, pueden ser fraccionarios)
  let females: number[] = [1]; // índice = edad; empieza con una gatita recién nacida
  let males = 0;
  for (let m = 0; m < months; m++) {
    const next = [0, ...females]; // todas cumplen un mes
    let births = 0;
    next.forEach((count, age) => {
      if (age >= 6 && (age - 6) % 3 === 0) births += count * litter * survival;
    });
    next[0] = births / 2;
    males += births / 2;
    females = next;
  }
  const totalFemales = females.reduce((a, b) => a + b, 0);
  return Math.round(totalFemales + males);
}

export function Calculator() {
  const [years, setYears] = useState(3);
  const [litter, setLitter] = useState(4);
  const [survival, setSurvival] = useState(50);
  const total = useMemo(() => simulate(years, litter, survival / 100), [years, litter, survival]);

  return (
    <div className="grid gap-8 rounded-[32px] bg-inverse-surface p-6 text-inverse-on-surface md:grid-cols-[1fr_1fr] md:p-10">
      <div className="grid content-start gap-6">
        <label className="grid gap-2">
          <span className="font-semibold">Años sin esterilizar: {years}</span>
          <input type="range" min={1} max={6} value={years} onChange={(e) => setYears(Number(e.target.value))} className="accent-[#FFD9E2]" />
        </label>
        <label className="grid gap-2">
          <span className="font-semibold">Gatitos por camada: {litter}</span>
          <input type="range" min={3} max={6} value={litter} onChange={(e) => setLitter(Number(e.target.value))} className="accent-[#FFD9E2]" />
        </label>
        <label className="grid gap-2">
          <span className="font-semibold">Gatitos que sobreviven en la calle: {survival}%</span>
          <input type="range" min={10} max={90} step={5} value={survival} onChange={(e) => setSurvival(Number(e.target.value))} className="accent-[#FFD9E2]" />
        </label>
        <p className="text-sm opacity-75">
          Supuestos: primera camada a los 6 meses, una camada cada 3 meses, la mitad hembras. Es una estimación para dimensionar el problema.
        </p>
      </div>
      <div className="grid place-items-center rounded-[24px] bg-white/8 p-8 text-center ring-1 ring-white/10" aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-[.14em] text-primary-container">Una sola gata, en {years} {years === 1 ? "año" : "años"}</p>
        <p className="font-display mt-2 text-6xl font-extrabold text-primary-container md:text-7xl">{new Intl.NumberFormat("es-MX").format(total)}</p>
        <p className="mt-2 text-lg">gatos</p>
        <p className="mt-4 text-sm opacity-80">Esterilizarla a tiempo deja ese número en 1.</p>
      </div>
    </div>
  );
}
