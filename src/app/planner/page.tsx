'use client';
import { ndlAtDepthMinutes, scheduleAscent } from '@/lib/deco/buhlmann';
import { gasFromFo2 } from '@/lib/deco/gas';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { cnsPercent, otu, ambientAtaFromMeters } from '@/lib/calc/cns';
import { bestMixPct, eadM, modM, ftToM, mToFt, ataFromDepthM } from '@/lib/calc/ean';
import { avgAtaOverProfile } from '@/lib/calc/profile';
import {
  ndlAirAtDepthM,
  n2IndexAfterDive,
  decayIndex,
  rntFromIndex,
} from '@/lib/calc/ndl';
import { supabase } from '@/lib/supabase/client';
import ExportPanel from '@/components/ExportPanel';

type Units = 'm' | 'ft';
type Dive = {
  label?: string;
  depthUI: number; // in current units
  timeMin: number;
  ppo2Limit: number; // 1.2–1.6
  sacLpm: number; // L/min
  fo2Pct?: number; // if blank -> Best Mix
  siMin?: number; // surface interval before THIS dive
};

type ComputedDive = Dive & {
  depthM: number;
  ata: number;
  fo2: number;
  po2AtDepth: number;
  ead: number;
  mod: number;
  cns: number;
  otus: number;
  gasL: number;
  warns: string[];
  prof: { avgATA: number; segments: { tDesc: number; tBottom: number; tAsc: number } };
  ndl: number;
  idx: number;
  idxAfterSI: number;
  rnt: number;
  overNdL: boolean;
};

function toM(units: Units, v: number) {
  return units === 'm' ? v : ftToM(v);
}

export default function Planner() {
  const [units, setUnits] = useLocalStorage<Units>('dm_units', 'm');
  // Tech mode (Bühlmann ZHL-16C + GF)
  const [tech, setTech] = useState(false);
  const [gfLo, setGfLo] = useState(30);
  const [gfHi, setGfHi] = useState(85);
  const [name, setName] = useState<string>('');
  const [dives, setDives] = useState<Dive[]>([
    {
      label: 'Dive 1',
      depthUI: units === 'm' ? 18 : 60,
      timeMin: 40,
      ppo2Limit: 1.4,
      sacLpm: 18,
      fo2Pct: 32,
      siMin: 0,
    },
  ]);

  function addDive() {
    const idx = dives.length + 1;
    setDives([
      ...dives,
      {
        label: `Dive ${idx}`,
        depthUI: units === 'm' ? 18 : 60,
        timeMin: 40,
        ppo2Limit: 1.4,
        sacLpm: 18,
        siMin: 60,
      },
    ]);
  }
  function rmDive(i: number) {
    const next = [...dives];
    next.splice(i, 1);
    setDives(next);
  }
  function updDive(i: number, patch: Partial<Dive>) {
    const next = [...dives];
    next[i] = { ...next[i], ...patch };
    setDives(next);
  }

  const computed: ComputedDive[] = useMemo(() => {
    return dives.map((d) => {
      const depthM = toM(units, d.depthUI);
      const ata = ataFromDepthM(depthM);
      const fo2 =
        d.fo2Pct == null || isNaN(d.fo2Pct)
          ? bestMixPct(depthM, d.ppo2Limit)
          : Math.max(21, Math.min(40, Math.round(d.fo2Pct)));
      const po2AtDepth = +((fo2 / 100) * ata).toFixed(2);
      const ead = eadM(fo2, depthM);
      const mod = modM(fo2, d.ppo2Limit);

      // Profile-aware gas
      const prof = avgAtaOverProfile(depthM, d.timeMin);
      const gasL = Math.max(0, Math.round(d.sacLpm * d.timeMin * prof.avgATA));

      // NDL / residual nitrogen
      const ndl = ndlAirAtDepthM(ead);
      const baseIdx = n2IndexAfterDive(d.timeMin, ndl);
      const si = Math.max(0, Math.round(d.siMin || 0));
      const idxAfterSI = decayIndex(baseIdx, si);
      const rnt = rntFromIndex(ndl, idxAfterSI);
      const overNdL = d.timeMin + rnt > ndl;

      // O2 exposure (bottom)
      const cns = cnsPercent(po2AtDepth, d.timeMin);
      const otus = otu(po2AtDepth, d.timeMin);

      const warns: string[] = [];
      if (po2AtDepth > 1.6) warns.push(`PPO₂ ${po2AtDepth} exceeds 1.6 (abort).`);
      else if (po2AtDepth > 1.4)
        warns.push(`PPO₂ ${po2AtDepth} above 1.4 working limit (contingency only).`);
      if (cns >= 100) warns.push(`CNS ${cns}% exceeds 100%.`);
      else if (cns >= 80) warns.push(`CNS ${cns}% high (≥80%).`);

      return {
        ...d,
        depthM,
        ata,
        fo2,
        po2AtDepth,
        ead,
        mod,
        cns,
        otus,
        gasL,
        warns,
        prof,
        ndl,
        idx: baseIdx,
        idxAfterSI,
        rnt,
        overNdL,
      };
    });
  }, [dives, units, tech, gfLo, gfHi]);

  const totals = useMemo(() => {
    return computed.reduce(
      (acc, x) => ({
        cns: acc.cns + x.cns,
        otus: acc.otus + x.otus,
        gasL: acc.gasL + x.gasL,
      }),
      { cns: 0, otus: 0, gasL: 0 },
    );
  }, [computed]);

  function dataPayload() {
    return {
      units,
      dives: computed.map((d) => ({
        label: d.label || '',
        depth: `${d.depthUI} ${units}`,
        depth_m: d.depthM,
        time_min: d.timeMin,
        ppo2_limit: d.ppo2Limit,
        sac_lpm: d.sacLpm,
        fo2_pct: d.fo2,
        ead_m: d.ead,
        mod_m: d.mod,
        ppo2_at_depth: d.po2AtDepth,
        cns_pct: d.cns,
        otu: d.otus,
        gas_l: d.gasL,
        ndl_min: d.ndl,
        rnt_min: d.rnt,
        si_min: d.siMin ?? 0,
      })),
      totals,
    };
  }

  function copyPublicLink() {
    const p = encodeURIComponent(JSON.stringify(dataPayload()));
    const url = `${window.location.origin}/planner?p=${p}`;
    navigator.clipboard.writeText(url);
    alert('Public link copied to clipboard.');
  }

  function saveLocal() {
    let planName = name || window.prompt('Save As (name)?', 'My Plan') || '';
    setName(planName);
    const raw =
      localStorage.getItem('dm_saved_plans') || localStorage.getItem('divemix_plans');
    const list = raw ? JSON.parse(raw) : [];
    const payload = { name: planName, kind: 'planner', ...dataPayload() };
    list.unshift(payload);
    localStorage.setItem('dm_saved_plans', JSON.stringify(list));
    alert('Saved locally.');
  }

  async function saveCloud() {
    let planName = name || window.prompt('Save As (name)?', 'My Plan') || '';
    setName(planName);
    const payload = { units, dives: computed, totals };
    const { error } = await supabase
      .from('plans')
      .insert({ name: planName, kind: 'planner', data: payload });
    if (error) {
      alert(error.message);
      return;
    }
    alert('Saved to cloud.');
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Planner (Multi-Dive · EANx)</h1>
      <p className="text-sm text-zinc-500">
        Stack multiple dives. Computes EANx Best Mix (or FO₂), MOD, EAD, PPO₂, CNS% &amp;
        OTU, avg-ATA gas, NDL/RNT with SI. Educational use only.
      </p>

      <section className="grid grid-cols-3 gap-4">
        <label className="space-y-1">
          <div className="text-sm">Units</div>
          <select
            className="select"
            value={units}
            onChange={(e) => setUnits(e.target.value as Units)}
          >
            <option value="m">Meters</option>
            <option value="ft">Feet</option>
          </select>
        </label>
        <label className="space-y-1 col-span-2">
          <div className="text-sm">Plan Name</div>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Reef double-dive"
          />
        </label>
      </section>

      <div className="space-y-4">
        {computed.map((d, idx) => (
          <section key={idx} className="card space-y-3">
            <div className="flex items-center justify-between">
              <input
                className="input"
                value={d.label || ''}
                onChange={(e) => updDive(idx, { label: e.target.value })}
                placeholder={`Dive ${idx + 1}`}
              />
              <button onClick={() => rmDive(idx)} className="text-red-400 text-sm">
                Remove
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="space-y-1">
                <div className="text-sm">
                  {units === 'm' ? 'Depth (m)' : 'Depth (ft)'}
                </div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].depthUI}
                  onChange={(e) => updDive(idx, { depthUI: +e.target.value || 0 })}
                />
                <div className="hint">
                  {units === 'm'
                    ? `${mToFt(dives[idx].depthUI)} ft`
                    : `${ftToM(dives[idx].depthUI)} m`}
                </div>
              </label>

              <label className="space-y-1">
                <div className="text-sm">Time (min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].timeMin}
                  onChange={(e) => updDive(idx, { timeMin: +e.target.value || 0 })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm">Max PPO₂ (ata)</div>
                <select
                  className="select"
                  value={dives[idx].ppo2Limit}
                  onChange={(e) => updDive(idx, { ppo2Limit: +e.target.value })}
                >
                  <option value={1.2}>1.2</option>
                  <option value={1.3}>1.3</option>
                  <option value={1.4}>1.4</option>
                  <option value={1.6}>1.6</option>
                </select>
              </label>

              <label className="space-y-1">
                <div className="text-sm">FO₂ (%)</div>
                <input
                  className="input"
                  type="number"
                  value={
                    Number.isFinite(dives[idx].fo2Pct as number)
                      ? (dives[idx].fo2Pct as number)
                      : NaN
                  }
                  placeholder={`${bestMixPct(d.depthM, dives[idx].ppo2Limit)} (Best Mix)`}
                  onChange={(e) => {
                    const v = +e.target.value;
                    updDive(idx, { fo2Pct: Number.isFinite(v) ? v : undefined });
                  }}
                />
                <div className="hint">Leave blank to use Best Mix.</div>
              </label>

              <label className="space-y-1">
                <div className="text-sm">SAC (L/min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].sacLpm}
                  onChange={(e) => updDive(idx, { sacLpm: +e.target.value || 0 })}
                />
                <div className="hint">Used for simple gas over avg ATA</div>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="space-y-1">
                <div className="text-sm">Surface Interval before this dive (min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].siMin ?? 0}
                  onChange={(e) => updDive(idx, { siMin: +e.target.value || 0 })}
                />
                <div className="hint">Reduces residual N₂ for this dive</div>
              </label>
            </div>

            {!!d.warns.length && (
              <div className="alert-error">
                <div className="font-medium mb-1">Warnings</div>
                <ul className="list-disc ml-5 text-sm">
                  {d.warns.map((w, j) => (
                    <li key={j}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="font-medium">Mix / Depth</div>
                <div>
                  FO₂: <b>{d.fo2}%</b>
                </div>
                <div>
                  ATA: <b>{d.ata}</b>
                </div>
                <div>
                  PPO₂@depth: <b>{d.po2AtDepth} ata</b>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Limits</div>
                <div>
                  MOD:{' '}
                  <b>
                    {d.mod} m / {mToFt(d.mod)} ft
                  </b>
                </div>
                <div>
                  EAD:{' '}
                  <b>
                    {d.ead} m / {mToFt(d.ead)} ft
                  </b>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Exposure / Gas</div>
                <div>
                  CNS: <b>{d.cns}%</b>
                </div>
                <div>
                  OTU: <b>{d.otus}</b>
                </div>
                <div>
                  Gas used: <b>{d.gasL} L</b>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="font-medium">NDL (Air via EAD)</div>
                <div>
                  EAD:{' '}
                  <b>
                    {d.ead} m / {mToFt(d.ead)} ft
                  </b>
                </div>
                <div>
                  NDL: <b>{d.ndl} min</b>
                </div>
                <div>
                  RNT (after SI): <b>{d.rnt} min</b>
                </div>
                {d.overNdL && (
                  <div className="alert-error mt-1">Planned time + RNT exceeds NDL</div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <button className="btn" onClick={addDive}>
        + Add Dive
      </button>

      <section className="card space-y-2">
        <div className="font-medium">Totals</div>
        <div>
          CNS total: <b>{totals.cns}%</b>
        </div>
        <div>
          OTU total: <b>{totals.otus}</b>
        </div>
        <div>
          Gas total: <b>{totals.gasL} L</b>
        </div>
      </section>

      <div className="flex gap-2">
        <button className="btn" onClick={saveLocal}>
          Save
        </button>
        <button className="btn" onClick={saveCloud}>
          Save to Cloud
        </button>
        <button className="btn" onClick={copyPublicLink}>
          Copy Public Link
        </button>
      </div>

      <ExportPanel title="Multi-Dive Plan" row={dataPayload()} />
    </main>
  );
}
