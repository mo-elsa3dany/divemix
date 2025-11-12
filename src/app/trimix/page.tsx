'use client';

import { useMemo, useState } from 'react';
import { clamp, toFloat, toInt } from '@/lib/utils/num';
import { validateFractions, ppo2AtDepth, modForMix, endMeters } from '@/lib/calc/trimix';

export default function Trimix() {
  // UI state
  const [units, setUnits] = useState<'m' | 'ft'>('m');
  const [depthUI, setDepthUI] = useState(45); // m or ft (based on units)
  const [fo2PctUI, setFo2PctUI] = useState(21); // %
  const [fhePctUI, setFhePctUI] = useState(35); // %
  const [maxPP, setMaxPP] = useState(1.4); // ata

  // Clamp inputs
  const depthClamped = clamp(depthUI, 0, units === 'm' ? 120 : Math.round(120 * 3.28084));
  const fo2Clamped = clamp(fo2PctUI, 8, 40); // allow very low O2 (e.g., Tx10/70)
  const fheClamped = clamp(fhePctUI, 0, 90);
  const maxPPClamped = clamp(maxPP, 1.0, 1.6);

  // Canonical meters for calc
  const depthM = useMemo(
    () => (units === 'm' ? depthClamped : Math.round(depthClamped / 3.28084)),
    [depthClamped, units],
  );

  // Validate fractions & get parts
  const vf = useMemo(
    () => validateFractions(fo2Clamped, fheClamped),
    [fo2Clamped, fheClamped],
  );

  // Calculations
  const ppo2 = useMemo(() => ppo2AtDepth(depthM, vf.fo2), [depthM, vf.fo2]);
  const mod = useMemo(() => modForMix(vf.fo2, maxPPClamped), [vf.fo2, maxPPClamped]);
  const endM = useMemo(() => endMeters(depthM, vf.fo2, vf.fhe), [depthM, vf.fo2, vf.fhe]);
  const endFt = Math.round(endM * 3.28084);
  const fn2Pct = Math.round(vf.fn2 * 100);

  // Problems / warnings
  const errors: string[] = [...vf.errors];
  const warnings: string[] = [];

  if (ppo2 > maxPPClamped)
    warnings.push(`PPO₂ ${ppo2.toFixed(2)} exceeds max ${maxPPClamped}.`);
  if (depthM > mod)
    warnings.push(`Depth ${depthM} m exceeds MOD ${mod} m for O₂ ${fo2Clamped}%.`);
  if (vf.fo2 + vf.fhe > 1) errors.push('O₂% + He% must be ≤ 100%.');
  if (vf.fo2 <= 0) errors.push('O₂% too low.');
  if (vf.fn2 < 0) errors.push('Negative N₂ fraction (check O₂%/He%).');

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Trimix Planner</h1>
      <p className="text-sm text-zinc-600">
        Calculates PPO₂, MOD, and END for Trimix. Educational use only.
      </p>

      <section className="grid grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-sm">Units</div>
          <select
            className="border rounded p-2"
            value={units}
            onChange={(e) => setUnits(e.target.value as 'm' | 'ft')}
          >
            <option value="m">Meters</option>
            <option value="ft">Feet</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">{units === 'm' ? 'Depth (m)' : 'Depth (ft)'}</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={depthClamped}
            onChange={(e) => setDepthUI(toInt(e.target.value, depthClamped))}
            onBlur={() => setDepthUI(depthClamped)}
          />
          <div className="text-xs text-zinc-500">
            {units === 'm'
              ? `${Math.round(depthClamped * 3.28084)} ft`
              : `${Math.round(depthClamped / 3.28084)} m`}
          </div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">O₂ (%)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={fo2Clamped}
            onChange={(e) => setFo2PctUI(toInt(e.target.value, fo2Clamped))}
          />
          <div className="text-xs text-zinc-500">Range: 8–40%</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">He (%)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={fheClamped}
            onChange={(e) => setFhePctUI(toInt(e.target.value, fheClamped))}
          />
          <div className="text-xs text-zinc-500">Range: 0–90%</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Max PPO₂ (ata)</div>
          <select
            className="border rounded p-2 w-full"
            value={maxPPClamped}
            onChange={(e) => setMaxPP(toFloat(e.target.value, maxPPClamped))}
          >
            <option value={1.2}>1.2</option>
            <option value={1.4}>1.4</option>
            <option value={1.6}>1.6</option>
          </select>
        </label>

        <div className="space-y-1">
          <div className="text-sm">Resulting N₂ (%)</div>
          <div className="border rounded p-2">{fn2Pct}%</div>
        </div>
      </section>

      {!!errors.length && (
        <div className="border border-red-500 bg-red-900/40 rounded p-3">
          <div className="font-medium mb-1">Input errors</div>
          <ul className="list-disc ml-5 text-sm">
            {errors.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded border p-4 space-y-2">
        <div>
          <b>PPO₂ @ depth:</b> {ppo2.toFixed(2)} ata
        </div>
        <div>
          <b>MOD @ PPO₂ {maxPPClamped}:</b> {mod} m ({Math.round(mod * 3.28084)} ft)
        </div>
        <div>
          <b>END:</b> {endM} m ({endFt} ft)
        </div>
      </section>

      {!!warnings.length && (
        <div className="border border-amber-500 bg-amber-900/40 rounded p-3">
          <div className="font-medium mb-1">Warnings</div>
          <ul className="list-disc ml-5 text-sm">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
