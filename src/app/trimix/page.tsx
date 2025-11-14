'use client';

import { useState } from 'react';
import ExportPanel from '../../components/ExportPanel';

type Units = 'm' | 'ft';

function ataAtDepth(depth: number, units: Units) {
  if (units === 'm') return depth / 10 + 1;
  return depth / 33 + 1;
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

// Very simple END estimate ignoring water vapour / CO2 corrections
function endDepth(depth: number, heFraction: number, units: Units) {
  const ata = ataAtDepth(depth, units);
  const narcFrac = 1 - heFraction; // assume O2+N2 both narcotic
  const narcAta = ata * narcFrac;
  if (units === 'm') {
    return Math.max(0, (narcAta - 1) * 10);
  } else {
    return Math.max(0, (narcAta - 1) * 33);
  }
}

export default function TrimixPage() {
  const [units, setUnits] = useState<Units>('m');
  const [depth, setDepth] = useState(60); // 60 m / ~200 ft
  const [fo2Pct, setFo2Pct] = useState(18);
  const [fhePct, setFhePct] = useState(45);
  const [ppo2Limit, setPpo2Limit] = useState(1.4);

  const fo2 = fo2Pct / 100;
  const fhe = fhePct / 100;
  const fn2 = Math.max(0, 1 - fo2 - fhe);

  const ata = ataAtDepth(depth, units);
  const ppo2 = fo2 * ata;

  const end = endDepth(depth, fhe, units);
  const endBoth = toBoth(end, units);
  const depthBoth = toBoth(depth, units);

  const overPpo2 = ppo2 > ppo2Limit;

  const exportRow = {
    tool: 'Trimix',
    units,
    depth_ui: depth,
    depth_m: depthBoth.m.toFixed(1),
    depth_ft: depthBoth.ft.toFixed(0),
    fo2_pct: fo2Pct,
    fhe_pct: fhePct,
    fn2_pct: +(fn2 * 100).toFixed(1),
    ppo2_at_depth: +ppo2.toFixed(2),
    ppo2_limit: ppo2Limit,
    end_m: endBoth.m.toFixed(1),
    end_ft: endBoth.ft.toFixed(0),
    over_ppo2: overPpo2 ? 'YES' : 'NO',
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Trimix Tools</h1>
        <p className="text-zinc-500 text-sm md:text-base">
          Rough planning for Trimix dives: see END and PPO₂ at depth for a given blend.
          Use this as a planning aid alongside proper decompression and gas planning
          tools.
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
              value={depth}
              min={0}
              onChange={(e) => setDepth(+e.target.value || 0)}
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
              min={8}
              max={21}
              onChange={(e) => setFo2Pct(+e.target.value || 0)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wide text-zinc-500">
              FHe (%)
            </label>
            <input
              type="number"
              className="input"
              value={fhePct}
              min={0}
              max={80}
              onChange={(e) => setFhePct(+e.target.value || 0)}
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
            <div className="text-xs uppercase tracking-wide text-zinc-500">At depth</div>
            <div className="text-lg font-semibold">
              {depthBoth.m.toFixed(1)} m / {depthBoth.ft.toFixed(0)} ft
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Ambient pressure: {ata.toFixed(2)} ata.
            </p>
          </div>

          <div className="card border bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">END</div>
            <div className="text-lg font-semibold">
              {endBoth.m.toFixed(1)} m / {endBoth.ft.toFixed(0)} ft
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Equivalent narcotic depth assuming O₂ + N₂ narcotic, He non-narcotic.
            </p>
          </div>

          <div
            className={`card border space-y-1 ${overPpo2 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">PPO₂</div>
            <div className="text-lg font-semibold">
              {ppo2.toFixed(2)} ata ({overPpo2 ? 'Over limit' : 'Within limit'})
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Adjust FO₂, depth, or PPO₂ limit to stay within your planning rules.
            </p>
          </div>
        </div>

        <ExportPanel title="Trimix Plan" row={exportRow} />
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">What to do with these numbers</h2>
        <p className="text-sm text-zinc-500">
          This is a planning aid for trained Trimix divers and gas blenders. It does not
          replace proper decompression planning or training.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Confirm that END and PPO₂ at the planned depth match your team&apos;s limits.
          </li>
          <li>
            Check that FO₂, FHe, and FN₂ are sensible for the depth and environment.
          </li>
          <li>
            Use dedicated deco software or tables (Bühlmann + GF, VPM, etc.) to build the
            full decompression profile.
          </li>
          <li>
            At the filling station, verify cylinders, valves, and cleanliness are
            appropriate for high-He / high-O₂ mixes.
          </li>
          <li>
            Blend the mix according to your panel procedure, analyze O₂ and He, and record
            both values with tolerances.
          </li>
          <li>
            Verify that analyzed FO₂ and FHe still give acceptable END and PPO₂ at the
            planned depth.
          </li>
          <li>
            Label cylinders with FO₂, FHe, MOD, working pressure, date, and blender
            initials, as per your standards.
          </li>
          <li>
            Brief the team on gases carried, MODs, ascent strategy, and gas switch depths
            before the dive.
          </li>
        </ol>
      </section>
    </main>
  );
}
