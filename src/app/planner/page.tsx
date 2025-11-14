'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ExportPanel from '../../components/ExportPanel';
import { supabase } from '../../lib/supabaseClient';

// ---------- Types ----------
type Units = 'm' | 'ft';

type Dive = {
  label?: string;
  depthUI: number; // depth in current UI units
  timeMin: number; // bottom time in minutes
  fo2Pct: number; // oxygen fraction percentage (e.g., 32)
  ppo2Limit: number; // PPO2 limit (e.g., 1.4)
  sacLpm?: number; // surface air consumption in L/min
  siMin?: number; // surface interval before this dive (min)
};

type ComputedDive = Dive & {
  depthM: number; // depth in meters
  ead: number; // equivalent air depth (m)
  mod: number; // maximum operating depth (m)
  po2AtDepth: number; // PPO2 at planned depth (ata)
  ndl: number; // NDL (min) using EAD->Air table
  rnt: number; // residual nitrogen time (min) (placeholder calc)
  overNdL?: boolean; // planned time + RNT > NDL
  cns: number; // CNS %
  otus: number; // OTUs
  gasL: number; // total gas used in liters (rough)
  ndlTech?: number; // optional tech-mode NDL
  schedule?: {
    // optional schedule for tech/deco preview
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

// Very coarse Air NDL table (EAD in meters) — conservative placeholders
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
  return 0; // beyond recreational NDL
}

// EAD from FO2 and actual depth (m): EAD = ((FN2/0.79)*(D+10)) - 10
const eadFromFo2 = (fo2Pct: number, depthM: number) => {
  const fn2 = 1 - fo2Pct / 100;
  return Math.max(0, Math.round(((fn2 / 0.79) * (depthM + 10) - 10) * 10) / 10);
};

// MOD in meters for given FO2 and PPO2 limit: MOD = (PPO2/FO2 - 1) * 10
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

  // Load last local plan on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem('plans');
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return;
      const last = arr[arr.length - 1];

      if (last.units) setUnits(last.units as Units);
      if (typeof last.tech === 'boolean') setTech(last.tech);
      if (typeof last.gfLo === 'number') setGfLo(last.gfLo);
      if (typeof last.gfHi === 'number') setGfHi(last.gfHi);
      if (Array.isArray(last.dives) && last.dives.length > 0) {
        setDives(last.dives);
      }
    } catch (e) {
      console.error('Failed to load local plans', e);
    }
  }, []);

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
    let lastEndN2 = 0; // placeholder for residual N2 loading proxy
    return dives.map((d, i) => {
      const depthM = units === 'm' ? d.depthUI : ftToM(d.depthUI);
      const ead = eadFromFo2(d.fo2Pct, depthM);
      const mod = modFromFo2(d.fo2Pct, d.ppo2Limit);
      const po2AtDepth = +((d.fo2Pct / 100) * ataAtDepthM(depthM)).toFixed(2);
      const ndl = ndlAirByDepth(ead);

      // Very rough RNT (placeholder): decay previous proxy with SI, never negative
      const si = i === 0 ? (d.siMin ?? 0) : (dives[i].siMin ?? 0);
      const rnt = Math.max(0, Math.round(lastEndN2 * 0.5 ** (si / 60)));
      const overNdL = d.timeMin + rnt > ndl && ndl > 0;

      // CNS/OTU super coarse placeholders
      const cns = Math.min(100, Math.round((po2AtDepth / 1.6) * d.timeMin));
      const otus = Math.round(
        (po2AtDepth - 0.5 > 0 ? po2AtDepth - 0.5 : 0) ** 2 * d.timeMin,
      );

      // Gas in liters (approx avg ATA ~ 1 + depth/20)
      const avgATA = 1 + depthM / 20;
      const gasL = Math.max(0, Math.round((d.sacLpm ?? 0) * d.timeMin * avgATA));

      // Update residual proxy for next dive
      lastEndN2 = Math.max(0, d.timeMin + rnt - ndl);

      // Optional tech preview
      let ndlTech: number | undefined;
      let schedule: ComputedDive['schedule'] | undefined;
      if (tech) {
        ndlTech = Math.max(0, Math.round(ndl * 0.9)); // placeholder slightly stricter
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
          const ascentMin = Math.max(1, Math.round(depthM / 9)); // ~9 m/min ascent
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
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem('plans');
      const plans = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(plans) ? plans : [];
      arr.push({ units, tech, gfLo, gfHi, dives });
      window.localStorage.setItem('plans', JSON.stringify(arr));
      alert('Saved locally');
    } catch (e) {
      console.error('Could not save locally', e);
      alert('Could not save locally');
    }
  };

  const saveCloud = async () => {
    const d = computed[0];
    if (!d) {
      alert('Nothing to save');
      return;
    }

    try {
      // Ensure we’re actually logged in
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('getUser error', userError);
      }
      if (!user) {
        alert('Cloud save failed: not signed in');
        return;
      }

      const payload = {
        kind: 'planner',
        units,
        label: d.label || null,
        site: d.label || null,
        depth_m: d.depthM,
        time_min: d.timeMin,
        fo2_pct: d.fo2Pct,
        target_ppo2: d.ppo2Limit,
        sac_lpm: d.sacLpm ?? null,
        tech,
        gf_lo: gfLo,
        gf_hi: gfHi,
        dives_json: dives,
        result: {
          ead_m: d.ead,
          mod_m: d.mod,
          po2_ata: d.po2AtDepth,
          ndl_min: d.ndl,
          rnt_min: d.rnt,
          cns_pct: d.cns,
          otus: d.otus,
          gas_l: d.gasL,
        },
        raw: {
          units,
          tech,
          gf_lo: gfLo,
          gf_hi: gfHi,
          dives,
        },
      };

      const { error } = await supabase.from('plans').insert(payload);

      if (error) {
        console.error('Cloud save failed', error);
        alert('Cloud save failed: ' + error.message);
        return;
      }

      alert('Saved to cloud');
    } catch (e: any) {
      console.error('Cloud save failed', e);
      alert('Cloud save failed: ' + (e?.message || 'unknown error'));
    }
  };

  const handleSave = async () => {
    saveLocal();
    await saveCloud();
  };

  const copyPublicLink = async () => {
    const params = new URLSearchParams({
      units,
      tech: String(tech),
      gfLo: String(gfLo),
      gfHi: String(gfHi),
      payload: JSON.stringify(dives),
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/planner?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied');
    } catch {
      alert(url);
    }
  };

  // ---------- UI ----------
  return (
    <main className="container max-w-5xl mx-auto p4 space-y-6 p-4">
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
        <button className="btn" onClick={handleSave}>
          Save
        </button>
        <button className="btn" onClick={copyPublicLink}>
          Copy Public Link
        </button>
        <ExportPanel title="Multi-Dive Plan" row={dataPayload()} />
      </div>
    </main>
  );
}
