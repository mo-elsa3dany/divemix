'use client';

import { useState } from 'react';
import ExportPanel from '../../components/ExportPanel';

type Units = 'm' | 'ft';

function modFromFo2(fo2Pct: number, ppo2: number, units: Units) {
  const fo2 = fo2Pct / 100;
  if (fo2 <= 0) return 0;
  const ata = ppo2 / fo2;
  if (units === 'm') {
    return Math.max(0, (ata - 1) * 10);
  } else {
    return Math.max(0, (ata - 1) * 33);
  }
}

function toBoth(depth: number, units: Units) {
  if (units === 'm') {
    const m = depth;
    const ft = depth * 3.28084;
    return { m, ft };
  } else {
    const ft = depth;
    const m = depth / 3.28084;
    return { m, ft };
  }
}

export default function NitroxPage() {
  const [units, setUnits] = useState<Units>('m');
  const [fo2Pct, setFo2Pct] = useState(32); // EAN32 default
  const [ppo2Limit, setPpo2Limit] = useState(1.4);
  const [planDepth, setPlanDepth] = useState(30); // 30m / 100ft default

  const mod = modFromFo2(fo2Pct, ppo2Limit, units);
  const both = toBoth(mod, units);
  const planBoth = toBoth(planDepth, units);
  const ataAtPlan = units === 'm' ? planDepth / 10 + 1 : planDepth / 33 + 1;
  const ppo2AtPlan = (fo2Pct / 100) * ataAtPlan;
  const overLimit = ppo2AtPlan > ppo2Limit;

  const exportRow = {
    tool: 'Nitrox',
    units,
    fo2_pct: fo2Pct,
    ppo2_limit: ppo2Limit,
    plan_depth_ui: planDepth,
    plan_depth_m: planBoth.m.toFixed(1),
    plan_depth_ft: planBoth.ft.toFixed(0),
    mod_m: both.m.toFixed(1),
    mod_ft: both.ft.toFixed(0),
    ppo2_at_plan: +ppo2AtPlan.toFixed(2),
    over_limit: overLimit ? 'YES' : 'NO',
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Nitrox Mixer</h1>
        <p className="text-zinc-500 text-sm md:text-base">
          Set your planned depth, FO₂, and PPO₂ limit to see your MOD and whether the mix
          is acceptable for the dive. Use this as a planning tool before you go to the gas
          panel.
        </p>
      </header>

      <section className="card space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Units</div>
            <div className="inline-flex rounded border overflow-hidden">
              <button
                type="button"
                onClick={() => setUnits('m')}
                className={`px-3 py-1 text-sm ${units === 'm' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
              >
                m / bar
              </button>
              <button
                type="button"
                onClick={() => setUnits('ft')}
                className={`px-3 py-1 text-sm ${units === 'ft' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
              >
                ft / psi
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wide text-zinc-500">
              Planned depth ({units})
            </label>
            <input
              type="number"
              className="input"
              value={planDepth}
              min={0}
              onChange={(e) => setPlanDepth(+e.target.value || 0)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wide text-zinc-500">
              FO₂ (%)
            </label>
            <input
              type="number"
              className="input"
              value={fo2Pct}
              min={21}
              max={40}
              onChange={(e) => setFo2Pct(+e.target.value || 0)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wide text-zinc-500">
              PPO₂ limit (ata)
            </label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={ppo2Limit}
              min={1.2}
              max={1.6}
              onChange={(e) => setPpo2Limit(+e.target.value || 0)}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="card border bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">MOD</div>
            <div className="text-lg font-semibold">
              {both.m.toFixed(1)} m / {both.ft.toFixed(0)} ft
            </div>
            <p className="text-xs text-zinc-500">
              Maximum operating depth for this mix at PPO₂ {ppo2Limit.toFixed(1)} ata.
            </p>
          </div>

          <div className="card border bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Planned PPO₂
            </div>
            <div className="text-lg font-semibold">{ppo2AtPlan.toFixed(2)} ata</div>
            <p className="text-xs text-zinc-500">
              PPO₂ at {planBoth.m.toFixed(1)} m / {planBoth.ft.toFixed(0)} ft.
            </p>
          </div>

          <div
            className={`card border space-y-1 ${overLimit ? 'bg-red-50 dark:bg-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">Status</div>
            <div className="text-lg font-semibold">
              {overLimit ? 'Over PPO₂ limit' : 'Within PPO₂ limit'}
            </div>
            <p className="text-xs text-zinc-500">
              {overLimit
                ? 'Reduce depth, lower FO₂, or accept a lower PPO₂ limit.'
                : 'Mix and plan are within the PPO₂ limit at this depth.'}
            </p>
          </div>
        </div>

        <ExportPanel title="Nitrox Mix" row={exportRow} />
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">What to do with these numbers</h2>
        <p className="text-sm text-zinc-500">
          This checklist is aimed at certified gas blenders. Always follow your agency
          procedures and local regulations.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Confirm the planned depth, FO₂, and PPO₂ limit in the calculator above.</li>
          <li>Check that the PPO₂ at the planned depth is within your chosen limit.</li>
          <li>
            At the filling station, verify the cylinder is in test, correctly labeled, and
            suitable for oxygen-enriched gas.
          </li>
          <li>
            Decide your blending method (partial pressure / continuous) and set the panel
            accordingly.
          </li>
          <li>
            For partial-pressure blending:
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Calculate or confirm the required O₂ pressure for your target FO₂.</li>
              <li>
                Slowly add O₂ while monitoring cylinder temperature and panel pressure.
              </li>
              <li>Top with clean air to final working pressure.</li>
            </ul>
          </li>
          <li>
            Allow the cylinder to cool to ambient temperature, then analyze FO₂ with a
            calibrated analyzer.
          </li>
          <li>
            Compare analyzed FO₂ to the planned FO₂. If it is out of tolerance, adjust and
            re-analyze.
          </li>
          <li>
            Label the cylinder with analyzed FO₂, MOD, date, and initials as per your
            procedures.
          </li>
          <li>
            Brief the diver on analyzed FO₂, MOD, and any depth limits based on this mix
            before the dive.
          </li>
        </ol>
      </section>
    </main>
  );
}
