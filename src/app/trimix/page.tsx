'use client';
import { useMemo, useState } from 'react';

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
  const [rounding, setRounding] = useState(true);

  const depthM = units === 'm' ? depthUI : ftToM(depthUI);
  const endM = units === 'm' ? targetEND : ftToM(targetEND);

  // Ambient pressure at depth (ata)
  const ata = +(depthM / 10 + 1).toFixed(2);
  const endAta = +(endM / 10 + 1).toFixed(2);

  // O2 fraction from PPO2 constraint
  const o2FracRaw = Math.min(0.5, Math.max(0.08, +(maxPPO2 / ata)));
  // N2 fraction from END: (END_ata - 1) / (Depth_ata - 1)
  const n2FracRaw = Math.max(
    0,
    Math.min(0.92, +((endAta - 1) / Math.max(0.0001, ata - 1))),
  );
  let heFracRaw = 1 - o2FracRaw - n2FracRaw;

  // If infeasible (negative He), clamp and adjust N2
  if (heFracRaw < 0) {
    heFracRaw = 0;
  }

  const toPct = (x: number) => Math.round(x * 100);
  const o2Pct = rounding
    ? Math.max(8, Math.min(50, toPct(o2FracRaw)))
    : (+(o2FracRaw * 100).toFixed(1) as unknown as number);
  const n2Pct = rounding
    ? Math.max(0, Math.min(92, toPct(n2FracRaw)))
    : (+(n2FracRaw * 100).toFixed(1) as unknown as number);
  let hePct = rounding
    ? Math.max(0, 100 - o2Pct - n2Pct)
    : (+(100 - (o2Pct as number) - (n2Pct as number)).toFixed(1) as unknown as number);

  // Derived MOD for that O2 (for reference)
  const modM = Math.max(
    0,
    Math.round(10 * (maxPPO2 / Math.max(0.08, (o2Pct as number) / 100) - 1)),
  );
  const modFt = mToFt(modM);

  // Feasibility notes
  const notes: string[] = [];
  if ((o2Pct as number) < 8) notes.push('O₂ below practical limits.');
  if ((o2Pct as number) > 50) notes.push('O₂ above safe range for bottom mix.');
  if ((hePct as number) < 0) notes.push('He went negative; constraints too tight.');
  if (ata < endAta) notes.push('END deeper than depth (check inputs).');

  // Narcotic assumption: N2 narcotic, He non-narcotic, O2 narcotic for END calc is debated; here we tie END only to N2 as a simple MVP.
  // You can tweak later to treat O2 as narcotic if desired.

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Trimix (MVP)</h1>
      <p className="text-sm text-zinc-500">
        Computes a bottom mix meeting PPO₂ and END targets. Educational use only.
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

      {!!notes.length && (
        <div className="alert-warn">
          <div className="font-medium mb-1">Notes</div>
          <ul className="list-disc ml-5 text-sm">
            {notes.map((w, i) => (
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

      <p className="hint">
        Assumptions: N₂ narcotic; He non-narcotic; O₂ not counted toward END in this MVP.
        Always analyze and label cylinders.
      </p>
    </main>
  );
}
