import ExportPanel from '@/components/ExportPanel';
('use client');
import { useState } from 'react';
import { cnsPercent, otu, ambientAtaFromMeters } from '@/lib/calc/cns';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

function ftToM(ft: number) {
  return Math.round(ft / 3.28084);
}
function mToFt(m: number) {
  return Math.round(m * 3.28084);
}

type RoundMode = 'whole' | 'half' | 'exact';
const roundModeLabel = {
  whole: 'Yes (fill-friendly)',
  half: '0.5% steps',
  exact: 'No (precise)',
};

function roundPct(x: number, mode: RoundMode) {
  if (mode === 'exact') return +(x * 100).toFixed(1);
  const raw = x * 100;
  if (mode === 'half') return Math.max(0, Math.min(100, Math.round(raw * 2) / 2));
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export default function Trimix() {
  const [units, setUnits] = useLocalStorage<'m' | 'ft'>('dm_units', 'm');
  const [depthUI, setDepthUI] = useState(60);
  const [maxPPO2, setMaxPPO2] = useState(1.3);
  const [targetEND, setTargetEND] = useState(30);
  const [bottomTime, setBottomTime] = useState(20);
  const [mode, setMode] = useState<RoundMode>('whole');

  const depthM = units === 'm' ? depthUI : ftToM(depthUI);
  const endM = units === 'm' ? targetEND : ftToM(targetEND);

  const ata = ambientAtaFromMeters(depthM);
  const endAta = ambientAtaFromMeters(endM);

  const o2FracRaw = Math.min(0.5, Math.max(0.08, +(maxPPO2 / ata)));
  const n2FracRaw = Math.max(
    0,
    Math.min(0.92, +((endAta - 1) / Math.max(0.0001, ata - 1))),
  );
  let heFracRaw = 1 - o2FracRaw - n2FracRaw;
  if (heFracRaw < 0) heFracRaw = 0;

  const o2Pct = roundPct(o2FracRaw, mode);
  const n2Pct = roundPct(n2FracRaw, mode);
  const hePct = Math.max(
    0,
    +(100 - (o2Pct as number) - (n2Pct as number)).toFixed(mode === 'exact' ? 1 : 0),
  );

  const po2AtDepth = +(((o2Pct as number) / 100) * ata).toFixed(2);
  const modM = Math.max(
    0,
    Math.round(10 * (maxPPO2 / Math.max(0.08, (o2Pct as number) / 100) - 1)),
  );
  const modFt = mToFt(modM);

  const cns = cnsPercent(po2AtDepth, bottomTime);
  const otus = otu(po2AtDepth, bottomTime);

  const warns: string[] = [];
  if (po2AtDepth > 1.6) warns.push(`PPO₂ ${po2AtDepth} ata exceeds 1.6 (abort).`);
  else if (po2AtDepth > 1.4)
    warns.push(`PPO₂ ${po2AtDepth} ata above 1.4 working limit (contingency only).`);
  if (cns >= 100) warns.push(`CNS ${cns}% exceeds 100%.`);
  else if (cns >= 80) warns.push(`CNS ${cns}% high (≥80%).`);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Trimix</h1>
      <p className="text-sm text-zinc-500">
        Bottom mix meeting PPO₂ and END targets, with CNS% and OTU. Educational use only.
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
          <div className="text-sm">Round mix to</div>
          <select
            className="select"
            value={mode}
            onChange={(e) => setMode(e.target.value as RoundMode)}
          >
            <option value="whole">{roundModeLabel.whole}</option>
            <option value="half">{roundModeLabel.half}</option>
            <option value="exact">{roundModeLabel.exact}</option>
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

      <ExportPanel
        title="Trimix Plan"
        row={{
          units,
          depth: depthUI + ' ' + units,
          target_end_m: targetEND,
          bottom_time_min: bottomTime,
          ppo2_limit: maxPPO2,
        }}
      />
    </main>
  );
}
