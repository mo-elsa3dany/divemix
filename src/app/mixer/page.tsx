'use client';

import { useMemo, useState } from 'react';
import { nitroxTopoffPSI, modForNitrox } from '@/lib/calc/mix';
import { clamp, toInt, toFloat } from '@/lib/utils/num';

const PSI_PER_BAR = 14.5037738;
const toBar = (psi: number) => Math.round(psi / PSI_PER_BAR);
const toPsi = (bar: number) => Math.round(bar * PSI_PER_BAR);

export default function Mixer() {
  const [pUnit, setPUnit] = useState<'psi' | 'bar'>('psi');
  const [targetFO2, setTargetFO2] = useState(32); // %
  const [currentFO2, setCurrentFO2] = useState(21); // %
  const [currentP, setCurrentP] = useState(500);
  const [finalP, setFinalP] = useState(3000);
  const [targetPP, setTargetPP] = useState(1.4);

  // clamp inputs
  const tgtFO2 = clamp(targetFO2, 22, 40);
  const curFO2 = clamp(currentFO2, 0, 40);
  const curP = clamp(currentP, 0, 5000);
  const finP = clamp(finalP, 0, 5000);
  const ppCl = clamp(targetPP, 1.0, 1.6);

  const errors: string[] = [];
  if (finP < curP)
    errors.push('Final pressure must be greater than or equal to current pressure.');
  if (tgtFO2 <= curFO2 && finP > curP) {
    // If target FO2 <= current FO2 and you're topping up, you'd dilute O2 — requires O2 bleed.
    // We don't auto-bleed here; just warn.
    errors.push(
      'Target FO₂ ≤ current FO₂. To achieve target, you may need to bleed before topping.',
    );
  }

  // Run math in PSI canonical
  const resultPSI = useMemo(() => {
    const curPSI = pUnit === 'psi' ? curP : toPsi(curP);
    const finPSI = pUnit === 'psi' ? finP : toPsi(finP);
    return nitroxTopoffPSI(tgtFO2 / 100, curFO2 / 100, curPSI, finPSI);
  }, [pUnit, tgtFO2, curFO2, curP, finP]);

  // If O2 add would be negative, signal bleed/adjust
  const needsBleed = resultPSI.addO2 <= 0 && finP > curP && tgtFO2 >= curFO2;

  // Convert to UI units
  const addO2 =
    pUnit === 'psi' ? Math.max(0, resultPSI.addO2) : Math.max(0, toBar(resultPSI.addO2));
  const addAir =
    pUnit === 'psi'
      ? Math.max(0, resultPSI.addAir)
      : Math.max(0, toBar(resultPSI.addAir));

  // MOD output in m + ft
  const modM = useMemo(() => modForNitrox(ppCl, tgtFO2), [ppCl, tgtFO2]);
  const modFt = Math.round(modM * 3.28084);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nitrox</h1>
      <p className="text-sm text-zinc-600">Nitrox PP blending helper</p>

      <section className="grid grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-sm">Pressure Units</div>
          <select
            className="border rounded p-2 w-full"
            value={pUnit}
            onChange={(e) => setPUnit(e.target.value as 'psi' | 'bar')}
          >
            <option value="psi">PSI</option>
            <option value="bar">bar</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Target FO₂ (%)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={tgtFO2}
            onChange={(e) => setTargetFO2(toInt(e.target.value, tgtFO2))}
          />
          <div className="text-xs text-zinc-500">Range: 22–40%</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Current FO₂ (%)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={curFO2}
            onChange={(e) => setCurrentFO2(toInt(e.target.value, curFO2))}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">Current Pressure ({pUnit})</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={curP}
            onChange={(e) => setCurrentP(toInt(e.target.value, curP))}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">Final Pressure ({pUnit})</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={finP}
            onChange={(e) => setFinalP(toInt(e.target.value, finP))}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">Max PPO₂ (ata)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            step="0.1"
            value={ppCl}
            onChange={(e) => setTargetPP(toFloat(e.target.value, ppCl))}
          />
          <div className="text-xs text-zinc-500">Range: 1.0–1.6</div>
        </label>
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
        {needsBleed ? (
          <div className="text-red-700">
            <b>Result:</b> Target FO₂ suggests <u>bleeding O₂ / adjusting plan</u> before
            topping.
          </div>
        ) : (
          <>
            <div>
              <b>Add O₂:</b> {addO2} {pUnit}
            </div>
            <div>
              <b>Then add Air:</b> {addAir} {pUnit}
            </div>
          </>
        )}
        <div>
          <b>MOD @ PPO₂ {ppCl}:</b> {modM} m ({modFt} ft)
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        NOTE: Always confirm with a calibrated analyzer and approved procedures.
      </p>
    </main>
  );
}
