/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/lib/supabase/useAuth';
import { supabase } from '@/lib/supabase/client';

type Row = {
  id: string;
  created_at: string;
  label: string | null;
  site: string | null;
  depth_m: number | null;
  time_min: number | null;
  fo2_pct: number | null;
  result: {
    ppo2?: number;
    mod?: number;
    gas?: number;
    cns?: number;
    otu?: number;
  } | null;
  raw: any | null;
};

const LOAD_KEY = 'divemix_plan_to_load';

export default function Cloud() {
  const { user, loading } = useSupabaseAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('plans')
      .select('id, created_at, label, site, depth_m, time_min, fo2_pct, result, raw')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setRows(data as Row[]);
      });
  }, [user?.id]);

  if (loading) return <main>Loading…</main>;
  if (!user)
    return (
      <main>
        <a className="btn" href="/login">
          Sign in
        </a>
      </main>
    );

  function loadInPlanner(r: Row) {
    try {
      const p = r.raw ?? {};
      localStorage.setItem(
        LOAD_KEY,
        JSON.stringify({
          units: p.units ?? 'm',
          depthUI: p.depthUI ?? p.depth_m ?? 0,
          depthM: p.depth_m ?? 0,
          time: p.time ?? p.time_min ?? 0,
          fo2Pct: p.fo2Pct ?? p.fo2_pct ?? 32,
          targetPp: p.targetPp ?? 1.4,
          sac: p.sac ?? 18,
          label: p.label ?? null,
          site: p.site ?? null,
          result: r.result ?? null,
        }),
      );
      window.location.href = '/planner';
    } catch {
      alert('Could not load');
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      setRows(rows.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">My Plans (Cloud)</h1>
      {rows.length === 0 ? (
        <p className="hint">No cloud plans yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={() => loadInPlanner(r)}>
                    Load in Planner
                  </button>
                  <button
                    className="btn"
                    disabled={busyId === r.id}
                    onClick={() => remove(r.id)}
                  >
                    {busyId === r.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {r.label && (
                  <span className="text-xs rounded border border-zinc-700 px-2 py-0.5 bg-zinc-900/60">
                    {r.label}
                  </span>
                )}
                {r.site && (
                  <span className="text-xs rounded border border-zinc-700 px-2 py-0.5 bg-zinc-900/60">
                    {r.site}
                  </span>
                )}
              </div>
              <div className="text-sm mt-2">
                Depth: <b>{r.depth_m ?? '-'} m</b> · Time: <b>{r.time_min ?? '-'} min</b>{' '}
                · FO₂ <b>{r.fo2_pct ?? '-'}%</b>
                {r.result && (
                  <>
                    {' '}
                    · PPO₂ <b>{r.result.ppo2 ?? '-'}</b> · MOD{' '}
                    <b>{r.result.mod ?? '-'} m</b> · Gas <b>{r.result.gas ?? '-'} L</b> ·
                    CNS <b>{r.result.cns ?? '-'}%</b>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
