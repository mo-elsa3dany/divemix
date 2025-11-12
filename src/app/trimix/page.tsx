/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useMemo } from 'react';
import { cnsPercent, otu, ambientAtaFromMeters } from '@/lib/calc/cns';

function ftToM(ft: number) {
  return Math.round(ft / 3.28084);
}
function mToFt(m: number) {
  return Math.round(m * 3.28084);
}

export default function Trimix() {
  const [units, setUnits] = useState<'m' | 'ft'>('m');
  const [depthUI, setDepthUI] = useState(60); // 60m / 200ft
  const [maxPPO2, setMaxPPO2] = useState(1.3); // common PPO2 for tech bottom
  const [targetEND, setTargetEND] = useState(30); // target END (m) e.g., 30m
  const [bottomTime, setBottomTime] = useState(20); // minutes at depth
  const [rounding, setRounding] = useState(true);

  const depthM = units === 'm' ? depthUI : ftToM(depthUI);
  const endM = units === 'm' ? targetEND : ftToM(targetEND);

  // Ambient pressures
  const ata = ambientAtaFromMeters(depthM);
  const endAta = ambientAtaFromMeters(endM);

  // O2 fraction from PPO2 constraint
  const o2FracRaw = Math.min(0.5, Math.max(0.08, +(maxPPO2 / ata)));
  // N2 fraction from END: (END_ata - 1) / (Depth_ata - 1)
  const n2FracRaw = Math.max(
    0,
    Math.min(0.92, +((endAta - 1) / Math.max(0.0001, ata - 1))),
  );
  let heFracRaw = 1 - o2FracRaw - n2FracRaw;
  if (heFracRaw < 0) heFracRaw = 0;

  const toPct = (x: number) => Math.round(x * 100);
  const o2Pct = rounding
    ? Math.max(8, Math.min(50, toPct(o2FracRaw)))
    : (+(o2FracRaw * 100).toFixed(1) as unknown as number);
  const n2Pct = rounding
    ? Math.max(0, Math.min(92, toPct(n2FracRaw)))
    : (+(n2FracRaw * 100).toFixed(1) as unknown as number);
  const hePct = rounding
    ? Math.max(0, 100 - (o2Pct as number) - (n2Pct as number))
    : (+(100 - (o2Pct as number) - (n2Pct as number)).toFixed(1) as unknown as number);

  // PPO2 at depth for this mix
  const po2AtDepth = +(((o2Pct as number) / 100) * ata).toFixed(2);

  // Derived MOD for that O2 (for reference)
  const modM = Math.max(
    0,
    Math.round(10 * (maxPPO2 / Math.max(0.08, (o2Pct as number) / 100) - 1)),
  );
  const modFt = mToFt(modM);

  // CNS/OTU at depth for bottom segment
  const cns = cnsPercent(po2AtDepth, bottomTime);
  const otus = otu(po2AtDepth, bottomTime);

  // Warnings
  const warns: string[] = [];
  if (po2AtDepth > 1.6) warns.push(`PPO₂ ${po2AtDepth} ata exceeds 1.6 (abort).`);
  else if (po2AtDepth > 1.4)
    warns.push(`PPO₂ ${po2AtDepth} ata above 1.4 working limit (contingency only).`);
  if (cns >= 100) warns.push(`CNS ${cns}% exceeds 100%.`);
  else if (cns >= 80) warns.push(`CNS ${cns}% high (≥80%).`);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Trimix (MVP+Safety)</h1>
      <p className="text-sm text-zinc-500">
        Computes a bottom mix meeting PPO₂ and END targets, with CNS% and OTU estimate.
        Educational use only.
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
          <div className="text-sm">Max PPO₂ (ata)</div>
          <select
            className="select"
            value={maxPPO2}
            onChange={(e) => setMaxPPO2(+e.target.value)}
          >
            <option value={1.2}>1.2</option>
            <option value={1.3}>1.3</option>
            <option value={1.4}>1.4</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">
            {units === 'm' ? 'Target END (m)' : 'Target END (ft)'}
          </div>
          <input
            className="input"
            type="number"
            value={targetEND}
            onChange={(e) => setTargetEND(+e.target.value || 0)}
          />
          <div className="hint">Common: 30–40 m (100–130 ft)</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Bottom Time (min)</div>
          <input
            className="input"
            type="number"
            value={bottomTime}
            onChange={(e) => setBottomTime(+e.target.value || 0)}
          />
          <div className="hint">Used for CNS% and OTU at depth</div>
        </label>

        <label className="space-y-1">
          <div className="text-sm">Round to whole %</div>
          <select
            className="select"
            value={rounding ? 'yes' : 'no'}
            onChange={(e) => setRounding(e.target.value === 'yes')}
          >
            <option value="yes">Yes (fill-friendly)</option>
            <option value="no">No (precise)</option>
          </select>
        </label>
      </section>

      {!!warns.length && (
        <div className="alert-error">
          <div className="font-medium mb-1">Warnings</div>
          <ul className="list-disc ml-5 text-sm">
            {warns.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card space-y-2">
        <div>
          <b>Ambient @ depth:</b> {ata} ata
        </div>
        <div>
          <b>PPO₂ @ depth:</b> {po2AtDepth} ata (working ≤1.4, contingency ≤1.6)
        </div>
        <div>
          <b>Derived O₂ for PPO₂ {maxPPO2}:</b> {o2Pct}%
        </div>
        <div>
          <b>Derived N₂ for END {endM} m:</b> {n2Pct}%
        </div>
        <div>
          <b>Helium (computed):</b> {hePct}%
        </div>
        <div>
          <b>
            MOD (for O₂ {o2Pct}% @ PPO₂ {maxPPO2}):
          </b>{' '}
          {modM} m / {modFt} ft
        </div>
      </section>

      <section className="card space-y-2">
        <div className="font-medium">Oxygen Exposure (bottom segment)</div>
        <div>
          <b>CNS%:</b> {cns}%
        </div>
        <div>
          <b>OTU:</b> {otus}
        </div>
        <p className="hint">
          CNS based on NOAA single-exposure limits (interpolated). OTU ≈ (PO₂ - 0.5)^0.83
          × minutes.
        </p>
      </section>

      <p className="hint">
        Assumptions: N₂ narcotic; He non-narcotic; O₂ not counted toward END in this MVP.
        Always analyze and label cylinders.
      </p>
    </main>
  );
}
