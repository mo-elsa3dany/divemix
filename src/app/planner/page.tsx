'use client';

import { useMemo, useState } from 'react';
import { ppO2, modMeters, gasUsedLiters, mToFt } from '@/lib/calc/gas';
import { clamp, toInt, toFloat } from '@/lib/utils/num';
import { cnsPercent, otus } from '@/lib/calc/cns';
import { downloadJSON, downloadText } from '@/lib/utils/export';

export default function Planner() {
  const [units, setUnits] = useState<'m' | 'ft'>('m');
  const [depthInUI, setDepthInUI] = useState(18); // m or ft based on units
  const [time, setTime] = useState(40); // min
  const [fo2Pct, setFo2Pct] = useState(32); // %
  const [targetPp, setTargetPp] = useState(1.4); // ata
  const [sac, setSac] = useState(18); // L/min at surface

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
  const cns = useMemo(() => cnsPercent(ppo2, timeCl), [ppo2, timeCl]);
  const otu = useMemo(() => otus(ppo2, timeCl), [ppo2, timeCl]);

  const warnings: string[] = [];
  const errors: string[] = [];

  if (ppo2 > ppCl) warnings.push(`PPO₂ ${ppo2.toFixed(2)} exceeds max ${ppCl}.`);
  if (depthM > mod)
    warnings.push(`Depth ${depthM} m exceeds MOD ${mod} m for FO₂ ${fo2Cl}%.`);
  if (fo2Cl < 21 || fo2Cl > 40) errors.push('FO₂ must be 21–40%.');
  if (timeCl < 1 || timeCl > 300) errors.push('Time must be 1–300 minutes.');
  if (sacCl < 8 || sacCl > 30) warnings.push('SAC outside typical range (8–30 L/min).');
  if (cns >= 80 && cns < 100) warnings.push(`High CNS load: ${cns}%`);
  if (cns >= 100) errors.push(`CNS ${cns}% (exceeds 100%)`);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Dive Planner</h1>
      <p className="text-sm text-zinc-600">
        Educational tool. Not a substitute for formal training or a dive computer.
      </p>

      <section className="grid grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-sm">Units</div>
          <select
            className="select"
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
            className="input"
            type="number"
            value={depthUI}
            onChange={(e) => setDepthInUI(toInt(e.target.value, depthUI))}
            onBlur={() => setDepthInUI(depthUI)}
          />
          <div className="hint">
            {units === 'm'
              ? `${mToFt(depthUI)} ft`
              : `${Math.round(depthUI / 3.28084)} m`}
          </div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Bottom Time (min)</div>
          <input
            className="input"
            type="number"
            value={timeCl}
            onChange={(e) => setTime(toInt(e.target.value, timeCl))}
          />
          <div className="hint">Range: 1–300</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">FO₂ (%)</div>
          <input
            className="input"
            type="number"
            value={fo2Cl}
            onChange={(e) => setFo2Pct(toInt(e.target.value, fo2Cl))}
          />
          <div className="hint">Range: 21–40</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Max PPO₂</div>
          <select
            className="select"
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
            className="input"
            type="number"
            value={sacCl}
            onChange={(e) => setSac(toInt(e.target.value, sacCl))}
          />
          <div className="hint">Typical: 8–30</div>
        </label>
      </section>

      {!!errors.length && (
        <div className="alert-error">
          <div className="font-medium mb-1">Input errors</div>
          <ul className="list-disc ml-5 text-sm">
            {errors.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card space-y-2">
        <div>
          <b>PPO₂ @ depth:</b> {ppo2.toFixed(2)} ata
        </div>
        <div>
          <b>MOD @ PPO₂ {ppCl}:</b> {mod} m ({mToFt(mod)} ft)
        </div>
        <div>
          <b>Estimated gas used:</b> {gasL} L
        </div>
        <div className="pt-1 border-t mt-2">
          <div>
            <b>CNS%:</b> {cns}%
          </div>
          <div>
            <b>OTU:</b> {otu}
          </div>
        </div>
      </section>

      {!!warnings.length && (
        <div className="alert-warn">
          <div className="font-medium mb-1">Warnings</div>
          <ul className="list-disc ml-5 text-sm">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          className="btn btn-primary"
          onClick={() => {
            const entry = {
              ts: Date.now(),
              units,
              depthUI,
              depthM,
              time: timeCl,
              fo2Pct: fo2Cl,
              targetPp: ppCl,
              sac: sacCl,
              result: { ppo2: +ppo2.toFixed(2), mod, gas: gasL, cns, otu },
            };
            try {
              const KEY = 'divemix_plans';
              const prev = JSON.parse(localStorage.getItem(KEY) || '[]');
              const next = [entry, ...prev].slice(0, 50);
              localStorage.setItem(KEY, JSON.stringify(next));
              alert('Plan saved ✔');
            } catch {
              alert('Could not save plan.');
            }
          }}
        >
          Save Plan
        </button>

        <button
          className="btn"
          onClick={() => {
            const txt = [
              `Dive Plan @ ${new Date().toLocaleString()}`,
              `Units: ${units}`,
              `Depth: ${depthUI} ${units} (${depthM} m)`,
              `Time: ${timeCl} min`,
              `FO2: ${fo2Cl}%  | Max PPO2: ${ppCl}`,
              `SAC: ${sacCl} L/min`,
              `--- Results ---`,
              `PPO2: ${ppo2.toFixed(2)} ata`,
              `MOD: ${mod} m (${Math.round(mod * 3.28084)} ft)`,
              `Gas used: ${gasL} L`,
              `CNS: ${cns}% | OTU: ${otu}`,
            ].join('\n');
            downloadText('divemix-plan.txt', txt);
          }}
        >
          Export .txt
        </button>

        <button
          className="btn"
          onClick={() => {
            const payload = {
              ts: Date.now(),
              units,
              depthUI,
              depthM,
              time: timeCl,
              fo2Pct: fo2Cl,
              targetPp: ppCl,
              sac: sacCl,
              result: { ppo2: +ppo2.toFixed(2), mod, gas: gasL, cns, otu },
            };
            downloadJSON('divemix-plan.json', payload);
          }}
        >
          Export .json
        </button>

        <a href="/saved" className="underline self-center">
          View Saved
        </a>
      </div>
    </main>
  );
}
