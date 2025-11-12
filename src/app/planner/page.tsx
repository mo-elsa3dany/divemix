'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { cnsPercent, otu, ambientAtaFromMeters } from '@/lib/calc/cns';
import { bestMixPct, eadM, modM, ftToM, mToFt, ataFromDepthM } from '@/lib/calc/ean';
import { supabase } from '@/lib/supabase/client';
import ExportPanel from '@/components/ExportPanel';

type Units = 'm' | 'ft';
type Dive = {
  label?: string;
  depthUI: number; // in current units
  timeMin: number;
  ppo2Limit: number; // 1.2–1.6
  sacLpm: number; // surface gas rate (L/min)
  fo2Pct?: number; // if omitted, compute Best Mix
};

function toM(units: Units, v: number) {
  return units === 'm' ? v : ftToM(v);
}

export default function Planner() {
  const [units, setUnits] = useLocalStorage<Units>('dm_units', 'm');
  const [name, setName] = useState<string>('');
  const [dives, setDives] = useState<Dive[]>([
    {
      label: 'Dive 1',
      depthUI: units === 'm' ? 18 : 60,
      timeMin: 40,
      ppo2Limit: 1.4,
      sacLpm: 18,
      fo2Pct: 32,
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

  const computed = useMemo(() => {
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
      const cns = cnsPercent(po2AtDepth, d.timeMin);
      const otus = otu(po2AtDepth, d.timeMin);
      const gasL = Math.max(0, Math.round(d.sacLpm * d.timeMin * ata)); // simple bottom segment gas
      const warns: string[] = [];
      if (po2AtDepth > 1.6) warns.push(`PPO₂ ${po2AtDepth} exceeds 1.6 (abort).`);
      else if (po2AtDepth > 1.4)
        warns.push(`PPO₂ ${po2AtDepth} above 1.4 working limit (contingency only).`);
      if (cns >= 100) warns.push(`CNS ${cns}% exceeds 100%.`);
      else if (cns >= 80) warns.push(`CNS ${cns}% high (≥80%).`);
      return { ...d, depthM, ata, fo2, po2AtDepth, ead, mod, cns, otus, gasL, warns };
    });
  }, [dives, units]);

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

  // ---- Saving & share ----
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
        Stack multiple dives. Computes EANx Best Mix (or use FO₂), MOD, EAD, PPO₂, CNS%
        &amp; OTU. Educational use only.
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
        {computed.map((d, i) => (
          <section key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <input
                className="input"
                value={d.label || ''}
                onChange={(e) => updDive(i, { label: e.target.value })}
                placeholder={`Dive ${i + 1}`}
              />
              <button onClick={() => rmDive(i)} className="text-red-400 text-sm">
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
                  value={dives[i].depthUI}
                  onChange={(e) => updDive(i, { depthUI: +e.target.value || 0 })}
                />
                <div className="hint">
                  {units === 'm'
                    ? `${mToFt(dives[i].depthUI)} ft`
                    : `${ftToM(dives[i].depthUI)} m`}
                </div>
              </label>

              <label className="space-y-1">
                <div className="text-sm">Time (min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[i].timeMin}
                  onChange={(e) => updDive(i, { timeMin: +e.target.value || 0 })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm">Max PPO₂ (ata)</div>
                <select
                  className="select"
                  value={dives[i].ppo2Limit}
                  onChange={(e) => updDive(i, { ppo2Limit: +e.target.value })}
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
                  value={dives[i].fo2Pct ?? NaN}
                  placeholder={`${bestMixPct(d.depthM, dives[i].ppo2Limit)} (Best Mix)`}
                  onChange={(e) =>
                    updDive(i, {
                      fo2Pct: isNaN(+e.target.value) ? undefined : +e.target.value || 0,
                    })
                  }
                />
                <div className="hint">Leave blank to use Best Mix.</div>
              </label>

              <label className="space-y-1">
                <div className="text-sm">SAC (L/min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[i].sacLpm}
                  onChange={(e) => updDive(i, { sacLpm: +e.target.value || 0 })}
                />
                <div className="hint">Used for simple gas at depth (bottom only)</div>
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

      {/* Simple export using the current computed payload */}
      <ExportPanel title="Multi-Dive Plan" row={dataPayload()} />
    </main>
  );
}
