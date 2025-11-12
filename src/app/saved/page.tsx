'use client';

import { useEffect, useMemo, useState } from 'react';
import { encodePlan, copy } from '@/lib/utils/share';

type Plan = {
  ts: number;
  units: 'm' | 'ft';
  depthUI: number;
  depthM: number;
  time: number;
  fo2Pct: number;
  targetPp: number;
  sac: number;
  label?: string;
  site?: string;
  result: { ppo2: number; mod: number; gas: number; cns?: number; otu?: number };
};

const KEY = 'divemix_plans';
const LOAD_KEY = 'divemix_plan_to_load';

export default function Saved() {
  const [items, setItems] = useState<Plan[]>([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'new' | 'old' | 'deep' | 'long'>('new');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function clearAll() {
    localStorage.removeItem(KEY);
    setItems([]);
  }

  function remove(ts: number) {
    const next = items.filter((i) => i.ts !== ts);
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  function loadInPlanner(p: Plan) {
    try {
      localStorage.setItem(LOAD_KEY, JSON.stringify(p));
      window.location.href = '/planner';
    } catch {
      alert('Could not load plan.');
    }
  }

  function exportAll() {
    try {
      const raw = localStorage.getItem(KEY) || '[]';
      const data = JSON.parse(raw);
      const txt = JSON.stringify(data, null, 2);
      const blob = new Blob([txt], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'divemix-plans.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = items;
    if (needle) {
      arr = arr.filter((p) => {
        const hay = [
          new Date(p.ts).toLocaleString(),
          p.label ?? '',
          p.site ?? '',
          `${p.depthM}`,
          `${p.time}`,
          `${p.fo2Pct}`,
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      });
    }
    switch (sort) {
      case 'new':
        return [...arr].sort((a, b) => b.ts - a.ts);
      case 'old':
        return [...arr].sort((a, b) => a.ts - b.ts);
      case 'deep':
        return [...arr].sort((a, b) => b.depthM - a.depthM);
      case 'long':
        return [...arr].sort((a, b) => b.time - a.time);
      default:
        return arr;
    }
  }, [items, q, sort]);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Saved Plans</h1>
        <div className="flex gap-2">
          <input
            className="input w-56"
            placeholder="Search: label, site, depth…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
            <option value="deep">Deepest</option>
            <option value="long">Longest time</option>
          </select>
          <button onClick={exportAll} className="btn">
            Export All (.json)
          </button>
          <button onClick={clearAll} className="btn">
            Clear All
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing matches. Try clearing search or save a plan.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.ts} className="card">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  {new Date(p.ts).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={async () => {
                      const payload = {
                        units: p.units,
                        depthUI: p.depthUI,
                        depthM: p.depthM,
                        time: p.time,
                        fo2Pct: p.fo2Pct,
                        targetPp: p.targetPp,
                        sac: p.sac,
                        label: p.label,
                        site: p.site,
                      };
                      const code = encodePlan(payload);
                      const url = `${location.origin}/planner?p=${code}`;
                      const ok = await copy(url);
                      alert(ok ? 'Share link copied' : url);
                    }}
                  >
                    Share
                  </button>
                  <button className="btn" onClick={() => loadInPlanner(p)}>
                    Load in Planner
                  </button>
                  <button className="btn" onClick={() => remove(p.ts)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {p.label && (
                  <span className="text-xs rounded border border-zinc-700 px-2 py-0.5 bg-zinc-900/60">
                    {p.label}
                  </span>
                )}
                {p.site && (
                  <span className="text-xs rounded border border-zinc-700 px-2 py-0.5 bg-zinc-900/60">
                    {p.site}
                  </span>
                )}
              </div>

              <div className="text-sm mt-2">
                Depth: <b>{p.depthM} m</b> · Time: <b>{p.time} min</b> · FO₂{' '}
                <b>{p.fo2Pct}%</b> · PPO₂ <b>{p.result.ppo2}</b> · MOD{' '}
                <b>{p.result.mod} m</b> · Gas <b>{p.result.gas} L</b>
                {typeof p.result.cns === 'number' || typeof p.result.otu === 'number' ? (
                  <>
                    {' '}
                    · CNS <b>{p.result.cns ?? '-'}%</b> · OTU <b>{p.result.otu ?? '-'}</b>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
