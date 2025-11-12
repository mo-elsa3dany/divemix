'use client';

import React, { useMemo, useState } from 'react';
import ExportPanel from '../../components/ExportPanel';

// ---------- Types ----------
type Units = 'm' | 'ft';

type Dive = {
  label?: string;
  depthUI: number; // UI units depth
  timeMin: number; // bottom time (min)
  fo2Pct: number; // O2 percent (e.g., 32)
  ppo2Limit: number; // PPO2 limit (ata)
  sacLpm?: number; // L/min
  siMin?: number; // surface interval (min)
};

type ComputedDive = Dive & {
  depthM: number;
  ead: number;
  mod: number;
  po2AtDepth: number;
  ndl: number;
  rnt: number;
  overNdL?: boolean;
  cns: number;
  otus: number;
  gasL: number;
  ndlTech?: number;
  schedule?: {
    stops: { depthM: number; timeMin: number }[];
    ascentMin: number;
    decoMin: number;
    runtimeMin: number;
  };
};

// ---------- Helpers ----------
const mToFt = (m: number) => Math.round(m * 3.28084);
const ftToM = (ft: number) => Math.round((ft / 3.28084) * 10) / 10;
const ataAtDepthM = (m: number) => 1 + m / 10;

function ndlAirByDepth(eadM: number): number {
  const d = Math.max(0, Math.round(eadM));
  if (d <= 12) return 147;
  if (d <= 14) return 98;
  if (d <= 16) return 72;
  if (d <= 18) return 56;
  if (d <= 20) return 45;
  if (d <= 22) return 37;
  if (d <= 25) return 29;
  if (d <= 30) return 20;
  if (d <= 32) return 16;
  if (d <= 35) return 14;
  if (d <= 40) return 9;
  return 0;
}

const eadFromFo2 = (fo2Pct: number, depthM: number) => {
  const fn2 = 1 - fo2Pct / 100;
  return Math.max(0, Math.round(((fn2 / 0.79) * (depthM + 10) - 10) * 10) / 10);
};

const modFromFo2 = (fo2Pct: number, ppo2Limit: number) => {
  const fo2 = fo2Pct / 100;
  if (fo2 <= 0) return 0;
  return Math.max(0, Math.round((ppo2Limit / fo2 - 1) * 10));
};

// ---------- Component ----------
export default function PlannerPage() {
  const [units, setUnits] = useState<Units>('m');
  const [tech, setTech] = useState<boolean>(false);
  const [gfLo, setGfLo] = useState<number>(30);
  const [gfHi, setGfHi] = useState<number>(85);

  const [dives, setDives] = useState<Dive[]>([
    {
      label: 'Dive 1',
      depthUI: 18,
      timeMin: 40,
      fo2Pct: 32,
      ppo2Limit: 1.4,
      sacLpm: 18,
      siMin: 60,
    },
  ]);

  const updDive = (idx: number, patch: Partial<Dive>) =>
    setDives((ds) => ds.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const addDive = () =>
    setDives((ds) => [
      ...ds,
      {
        label: `Dive ${ds.length + 1}`,
        depthUI: 18,
        timeMin: 40,
        fo2Pct: 32,
        ppo2Limit: 1.4,
        sacLpm: 18,
        siMin: 60,
      },
    ]);

  const rmDive = (idx: number) => setDives((ds) => ds.filter((_, i) => i !== idx));

  const computed: ComputedDive[] = useMemo(() => {
    let lastEndN2 = 0;
    return dives.map((d, i) => {
      const depthM = units === 'm' ? d.depthUI : ftToM(d.depthUI);
      const ead = eadFromFo2(d.fo2Pct, depthM);
      const mod = modFromFo2(d.fo2Pct, d.ppo2Limit);
      const po2AtDepth = +((d.fo2Pct / 100) * ataAtDepthM(depthM)).toFixed(2);
      const ndl = ndlAirByDepth(ead);

      const si = i === 0 ? (d.siMin ?? 0) : (dives[i].siMin ?? 0);
      const rnt = Math.max(0, Math.round(lastEndN2 * 0.5 ** (si / 60)));
      const overNdL = d.timeMin + rnt > ndl && ndl > 0;

      const cns = Math.min(100, Math.round((po2AtDepth / 1.6) * d.timeMin));
      const otus = Math.round(
        (po2AtDepth - 0.5 > 0 ? po2AtDepth - 0.5 : 0) ** 2 * d.timeMin,
      );

      const avgATA = 1 + depthM / 20;
      const gasL = Math.max(0, Math.round((d.sacLpm ?? 0) * d.timeMin * avgATA));

      lastEndN2 = Math.max(0, d.timeMin + rnt - ndl);

      let ndlTech: number | undefined;
      let schedule: ComputedDive['schedule'] | undefined;
      if (tech) {
        ndlTech = Math.max(0, Math.round(ndl * 0.9));
        if (overNdL) {
          const decoMin = Math.max(3, Math.round((d.timeMin + rnt - ndl) / 2));
          const stops = [
            { depthM: 9, timeMin: Math.max(0, Math.round(decoMin / 3)) },
            { depthM: 6, timeMin: Math.max(0, Math.round(decoMin / 3)) },
            {
              depthM: 3,
              timeMin: Math.max(0, decoMin - 2 * Math.max(0, Math.round(decoMin / 3))),
            },
          ].filter((s) => s.timeMin > 0);
          const ascentMin = Math.max(1, Math.round(depthM / 9));
          const runtimeMin = d.timeMin + ascentMin + decoMin;
          schedule = { stops, ascentMin, decoMin, runtimeMin };
        }
      }

      return {
        ...d,
        depthM,
        ead,
        mod,
        po2AtDepth,
        ndl,
        rnt,
        overNdL,
        cns,
        otus,
        gasL,
        ndlTech,
        schedule,
      };
    });
  }, [dives, units, tech, gfLo, gfHi]);

  // ----- Export / Save helpers -----
  const dataPayload = () => {
    const d = computed[0];
    if (!d) return {};
    return {
      label: d.label || '',
      depth: `${d.depthUI} ${units}`,
      depth_m: d.depthM,
      time_min: d.timeMin,
      ppo2_limit: d.ppo2Limit,
      sac_lpm: d.sacLpm ?? 0,
      fo2_pct: d.fo2Pct,
      ead_m: d.ead,
      mod_m: d.mod,
      po2_ata: d.po2AtDepth,
      ndl_min: d.ndl,
      rnt_min: d.rnt,
      over_ndl: !!d.overNdL,
      cns_pct: d.cns,
      otus: d.otus,
      gas_l: d.gasL,
    };
  };

  const saveLocal = () => {
    try {
      const plans = JSON.parse(localStorage.getItem('plans') || '[]');
      plans.push({ units, tech, gfLo, gfHi, dives });
      localStorage.setItem('plans', JSON.stringify(plans));
      alert('Saved locally');
    } catch {
      alert('Could not save locally');
    }
  };

  const saveCloud = async () => {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units, tech, gfLo, gfHi, dives }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Save failed');
      alert(`Saved: code ${j.data.code}`);
    } catch (e: any) {
      alert(e?.message || 'Cloud save failed');
    }
  };

  const copyPublicLink = async () => {
    const params = new URLSearchParams({
      units,
      tech: String(tech),
      gfLo: String(gfLo),
      gfHi: String(gfHi),
      payload: JSON.stringify(dives),
    });
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/planner?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied');
    } catch {
      alert(url);
    }
  };

  // ---------- UI ----------
  return (
    <main className="container max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Planner (Multi-Dive · EANx)</h1>

      <section className="card space-y-3">
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2">
            <span>Units</span>
            <select
              className="select"
              value={units}
              onChange={(e) => setUnits(e.target.value as Units)}
            >
              <option value="m">Metric (m)</option>
              <option value="ft">Imperial (ft)</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tech}
              onChange={(e) => setTech(e.target.checked)}
            />
            <span>Tech Mode (ZHL-16C + GF)</span>
          </label>

          {tech && (
            <div className="flex items-center gap-2">
              <span>GF</span>
              <input
                className="input w-16"
                type="number"
                value={gfLo}
                onChange={(e) => setGfLo(+e.target.value || 0)}
              />
              <span>/</span>
              <input
                className="input w-16"
                type="number"
                value={gfHi}
                onChange={(e) => setGfHi(+e.target.value || 0)}
              />
            </div>
          )}

          <button className="btn ml-auto" onClick={addDive}>
            + Add Dive
          </button>
        </div>
      </section>

      <div className="space-y-4">
        {computed.map((d, idx) => (
          <section key={idx} className="card space-y-3">
            <div className="flex items-center justify-between">
              <input
                className="input"
                value={dives[idx].label || ''}
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
                  onChange={(e) => updDive(idx, { ppo2Limit: +e.target.value || 1.4 })}
                >
                  <option value={1.2}>1.2</option>
                  <option value={1.3}>1.3</option>
                  <option value={1.4}>1.4</option>
                  <option value={1.5}>1.5</option>
                  <option value={1.6}>1.6</option>
                </select>
              </label>

              <label className="space-y-1">
                <div className="text-sm">FO₂ (%)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].fo2Pct}
                  onChange={(e) => updDive(idx, { fo2Pct: +e.target.value || 0 })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm">SAC (L/min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].sacLpm ?? 0}
                  onChange={(e) => updDive(idx, { sacLpm: +e.target.value || 0 })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm">Surface interval (min)</div>
                <input
                  className="input"
                  type="number"
                  value={dives[idx].siMin ?? 0}
                  onChange={(e) => updDive(idx, { siMin: +e.target.value || 0 })}
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div>
                  EAD: <b>{d.ead} m</b>
                </div>
                <div>
                  MOD: <b>{d.mod} m</b>
                </div>
                <div>
                  PPO₂ at depth: <b>{d.po2AtDepth.toFixed(2)} ATA</b>
                </div>
              </div>
              <div>
                <div>
                  NDL (Air via EAD): <b>{d.ndl} min</b>
                </div>
                <div>
                  RNT (after SI): <b>{d.rnt} min</b>
                </div>
                {tech && (
                  <div>
                    NDL (ZHL-16C, GF {gfLo}/{gfHi}): <b>{d.ndlTech ?? '—'} min</b>
                  </div>
                )}
                {d.overNdL && (
                  <div className="alert-error mt-1">Planned time + RNT exceeds NDL</div>
                )}
              </div>
              <div>
                <div>
                  CNS: <b>{d.cns}%</b> · OTU: <b>{d.otus}</b>
                </div>
                <div>
                  Gas: <b>{d.gasL} L</b>
                </div>
              </div>
            </div>

            {tech && d.schedule?.stops?.length ? (
              <div className="mt-2">
                <div className="font-medium">Deco Schedule</div>
                <ul className="list-disc ml-5 text-sm">
                  {d.schedule.stops.map((s, j) => (
                    <li key={j}>
                      Stop @ <b>{s.depthM} m</b> for <b>{s.timeMin} min</b>
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-zinc-500 mt-1">
                  Deco: <b>{d.schedule.decoMin} min</b> · Ascent:{' '}
                  <b>{d.schedule.ascentMin} min</b> · Runtime:{' '}
                  <b>{d.schedule.runtimeMin} min</b>
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="btn" onClick={saveLocal}>
          Save
        </button>
        <button className="btn" onClick={saveCloud}>
          Save to Cloud
        </button>
        <button className="btn" onClick={copyPublicLink}>
          Copy Public Link
        </button>
        <ExportPanel title="Multi-Dive Plan" row={dataPayload()} />
      </div>
    </main>
  );
}
