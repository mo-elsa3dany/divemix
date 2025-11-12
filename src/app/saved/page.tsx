'use client';

import { useEffect, useState } from 'react';

type Plan = {
  ts: number;
  units: 'm' | 'ft';
  depthUI: number;
  depthM: number;
  time: number;
  fo2Pct: number;
  targetPp: number;
  sac: number;
  result: { ppo2: number; mod: number; gas: number; cns?: number; otu?: number };
};

const KEY = 'divemix_plans';
const LOAD_KEY = 'divemix_plan_to_load';

export default function Saved() {
  const [items, setItems] = useState<Plan[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
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

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Plans</h1>
        <div className="flex gap-2">
          <button onClick={exportAll} className="btn">
            Export All (.json)
          </button>
          <button onClick={clearAll} className="btn">
            Clear All
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No saved plans yet. Create one in the Planner.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.ts} className="card">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  {new Date(p.ts).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={() => loadInPlanner(p)}>
                    Load in Planner
                  </button>
                  <button className="btn" onClick={() => remove(p.ts)}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-sm mt-1">
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
