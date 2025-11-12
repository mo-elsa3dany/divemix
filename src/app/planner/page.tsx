'use client';

import { useEffect, useMemo, useState } from 'react';
import { ppO2, modMeters, gasUsedLiters, mToFt } from '@/lib/calc/gas';
import { clamp, toInt, toFloat } from '@/lib/utils/num';

const KEY = 'divemix_plans';
const LOAD_KEY = 'divemix_plan_to_load';

type Plan = {
  ts: number;
  units: 'm' | 'ft';
  depthUI: number; // as shown to user in current units
  depthM: number; // meters (canonical)
  time: number; // min
  fo2Pct: number; // %
  targetPp: number; // ata
  sac: number; // L/min
  result: { ppo2: number; mod: number; gas: number };
};

export default function Planner() {
  const [units, setUnits] = useState<'m' | 'ft'>('m');
  const [depthInUI, setDepthInUI] = useState(18);
  const [time, setTime] = useState(40);
  const [fo2Pct, setFo2Pct] = useState(32);
  const [targetPp, setTargetPp] = useState(1.4);
  const [sac, setSac] = useState(18);

  // clamp all inputs
  const depthUI = clamp(depthInUI, 0, units === 'm' ? 60 : Math.round(60 * 3.28084));
  const timeCl = clamp(time, 1, 300);
  const fo2Cl = clamp(fo2Pct, 21, 40);
  const ppCl = clamp(targetPp, 1.0, 1.6);
  const sacCl = clamp(sac, 8, 30);

  // convert to meters for calc
  const depthM = useMemo(
    () => (units === 'm' ? depthUI : Math.round(depthUI / 3.28084)),
    [depthUI, units],
  );
  const fo2 = useMemo(() => fo2Cl / 100, [fo2Cl]);

  const ppo2 = useMemo(() => ppO2(depthM, fo2), [depthM, fo2]);
  const mod = useMemo(() => modMeters(ppCl, fo2), [ppCl, fo2]);
  const gasL = useMemo(
    () => gasUsedLiters(sacCl, timeCl, depthM),
    [sacCl, timeCl, depthM],
  );

  // Load-once mechanism from Saved page (uses LOAD_KEY)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOAD_KEY);
      if (!raw) return;
      const p: Plan = JSON.parse(raw);
      localStorage.removeItem(LOAD_KEY);
      // Apply stored values
      setUnits(p.units);
      setDepthInUI(p.units === 'm' ? p.depthM : Math.round(p.depthM * 3.28084));
      setTime(p.time);
      setFo2Pct(p.fo2Pct);
      setTargetPp(p.targetPp);
      setSac(p.sac);
    } catch {
      /* ignore */
    }
  }, []);

  function savePlan() {
    const entry: Plan = {
      ts: Date.now(),
      units,
      depthUI,
      depthM,
      time: timeCl,
      fo2Pct: fo2Cl,
      targetPp: ppCl,
      sac: sacCl,
      result: { ppo2: +ppo2.toFixed(2), mod, gas: gasL },
    };
    try {
      const prev: Plan[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      const next = [entry, ...prev].slice(0, 50);
      localStorage.setItem(KEY, JSON.stringify(next));
      alert('Plan saved ✔');
    } catch {
      alert('Could not save plan.');
    }
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  if (ppo2 > ppCl) warnings.push(`PPO₂ ${ppo2.toFixed(2)} exceeds max ${ppCl}.`);
  if (depthM > mod)
    warnings.push(`Depth ${depthM} m exceeds MOD ${mod} m for FO₂ ${fo2Cl}%.`);
  if (fo2Cl < 21 || fo2Cl > 40) errors.push('FO₂ must be 21–40%.');
  if (timeCl < 1 || timeCl > 300) errors.push('Time must be 1–300 minutes.');
  if (sacCl < 8 || sacCl > 30) warnings.push('SAC outside typical range (8–30 L/min).');

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dive Planner</h1>
      <p className="text-sm text-zinc-600">
        Educational tool. Not a substitute for formal training or a dive computer.
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
            value={depthUI}
            onChange={(e) => setDepthInUI(toInt(e.target.value, depthUI))}
            onBlur={() => setDepthInUI(depthUI)}
          />
          <div className="text-xs text-zinc-500">
            {units === 'm'
              ? `${mToFt(depthUI)} ft`
              : `${Math.round(depthUI / 3.28084)} m`}
          </div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Bottom Time (min)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={timeCl}
            onChange={(e) => setTime(toInt(e.target.value, timeCl))}
          />
          <div className="text-xs text-zinc-500">Range: 1–300</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">FO₂ (%)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={fo2Cl}
            onChange={(e) => setFo2Pct(toInt(e.target.value, fo2Cl))}
          />
          <div className="text-xs text-zinc-500">Range: 21–40</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Max PPO₂</div>
          <select
            className="border rounded p-2 w-full"
            value={ppCl}
            onChange={(e) => setTargetPp(toFloat(e.target.value, ppCl))}
          >
            <option value={1.2}>1.2</option>
            <option value={1.4}>1.4</option>
            <option value={1.6}>1.6</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">SAC (L/min)</div>
          <input
            className="border rounded p-2 w-full"
            type="number"
            value={sacCl}
            onChange={(e) => setSac(toInt(e.target.value, sacCl))}
          />
          <div className="text-xs text-zinc-500">Typical: 8–30</div>
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
        <div>
          <b>PPO₂ @ depth:</b> {ppo2.toFixed(2)} ata
        </div>
        <div>
          <b>MOD @ PPO₂ {ppCl}:</b> {mod} m ({mToFt(mod)} ft)
        </div>
        <div>
          <b>Estimated gas used:</b> {gasL} L
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

      <div className="flex gap-3">
        <button onClick={savePlan} className="border rounded px-4 py-2">
          Save Plan
        </button>
        <a href="/saved" className="underline self-center">
          View Saved
        </a>
      </div>
    </main>
  );
}
