'use client';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';

function ftToM(ft: number) {
  return Math.round(ft / 3.28084);
}
function mToFt(m: number) {
  return Math.round(m * 3.28084);
}

export default function Nitrox() {
  const [units, setUnits] = useState<'m' | 'ft'>('m');
  const [depthUI, setDepthUI] = useState(30); // 30m / 100ft
  const [maxPPO2, setMaxPPO2] = useState(1.4);
  const [targetFO2, setTargetFO2] = useState(32); // %
  const [startO2, setStartO2] = useState(21); // %
  const [cylPress, setCylPress] = useState(200); // bar or psi? -> treat as abstract for % calc

  // Hydrostatic pressure in ata at depth: (depth/10)+1 in m; (ft/33)+1 in ft
  const depthM = units === 'm' ? depthUI : ftToM(depthUI);
  const ata = +(depthM / 10 + 1).toFixed(2);

  // Best mix for given PPO2 and depth: FO2 = PPO2 / ata
  const bestMix = Math.max(21, Math.min(40, Math.round((maxPPO2 / ata) * 100)));
  // MOD for a given FO2 and PPO2: depth(m) = 10*(PPO2/FO2 - 1)
  const modM = Math.round(10 * (maxPPO2 / Math.max(0.21, targetFO2 / 100) - 1));
  const modFt = mToFt(modM);

  // Partial pressure top-up from a starting FO2 to target FO2
  // %O2 to add ≈ (Target% - Start%) / (100 - Start%) of the remaining pressure
  const o2AddPct = Math.max(
    0,
    Math.min(100, ((targetFO2 - startO2) / Math.max(1, 100 - startO2)) * 100),
  );
  const o2AddBar = Math.round((o2AddPct / 100) * cylPress);
  const airTopBar = cylPress - o2AddBar;

  const issues: string[] = [];
  if (targetFO2 < 21 || targetFO2 > 40) issues.push('Target FO₂ must be 21–40%.');
  if (startO2 < 21 || startO2 > 40) issues.push('Start FO₂ must be 21–40%.');
  if (maxPPO2 < 1.0 || maxPPO2 > 1.6) issues.push('Max PPO₂ range is 1.0–1.6.');

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Nitrox</h1>
      <p className="text-sm text-zinc-500">
        Best Mix, MOD, and simple partial-pressure top-up. Educational use only.
      </p>

      <section className="grid grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-sm">Units</div>
          <select
            className="select"
            value={units}
            onChange={(e) => setUnits(e.target.value as any)}
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
            onChange={(e) => setDepthUI(+e.target.value || 0)}
          />
          <div className="hint">
            {units === 'm' ? `${mToFt(depthUI)} ft` : `${ftToM(depthUI)} m`}
          </div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Max PPO₂</div>
          <select
            className="select"
            value={maxPPO2}
            onChange={(e) => setMaxPPO2(+e.target.value)}
          >
            <option value={1.2}>1.2</option>
            <option value={1.4}>1.4</option>
            <option value={1.6}>1.6</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Target FO₂ (%)</div>
          <input
            className="input"
            type="number"
            value={targetFO2}
            onChange={(e) => setTargetFO2(+e.target.value || 0)}
          />
          <div className="hint">Usual rec range: 32–36%</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Starting FO₂ (%)</div>
          <input
            className="input"
            type="number"
            value={startO2}
            onChange={(e) => setStartO2(+e.target.value || 0)}
          />
          <div className="hint">Air is 21%</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Cylinder Pressure (for % calc)</div>
          <input
            className="input"
            type="number"
            value={cylPress}
            onChange={(e) => setCylPress(+e.target.value || 0)}
          />
          <div className="hint">Bar or psi — used proportionally</div>
        </label>
      </section>

      {!!issues.length && (
        <div className="alert-error">
          <div className="font-medium mb-1">Input errors</div>
          <ul className="list-disc ml-5 text-sm">
            {issues.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card space-y-2">
        <div>
          <b>Ambient pressure @ depth:</b> {ata} ata
        </div>
        <div>
          <b>Best Mix @ PPO₂ {maxPPO2}:</b> {bestMix}% O₂
        </div>
        <div>
          <b>
            MOD for {targetFO2}% @ PPO₂ {maxPPO2}:
          </b>{' '}
          {modM} m / {modFt} ft
        </div>
      </section>

      <section className="card space-y-2">
        <div className="font-medium">Partial-Pressure Top-Up (rough)</div>
        <div>
          <b>O₂ to add:</b> {Math.round(o2AddPct)}% of remaining → ≈ {o2AddBar} (same
          units as input)
        </div>
        <div>
          <b>Then top with air:</b> ≈ {airTopBar}
        </div>
        <p className="hint">
          Always analyze; this is a simplified planning aid, not a fill procedure.
        </p>
      </section>
    </main>
  );
}
