'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type SavedPlanLocal = {
  id: string;
  name: string;
  kind: 'planner' | 'nitrox' | 'trimix';
  created_at: string;
  updated_at: string;
  // Older saves put the payload at the top level; new saves keep it in data for cloud parity
  units?: 'm' | 'ft';
  dives?: any[];
  totals?: any;
  data?: any; // normalized container
};

type SavedPlanCloud = {
  id: string;
  name: string;
  kind: 'planner' | 'nitrox' | 'trimix';
  created_at: string;
  data: any;
};

function uid() {
  // simple unique id for local items
  const r = Math.random().toString(36).slice(2);
  return 'pln_' + Date.now().toString(36) + '_' + r;
}

function nowISO() {
  return new Date().toISOString();
}

function normalizeLocal(list: any[]): SavedPlanLocal[] {
  const out: SavedPlanLocal[] = [];
  for (const item of list || []) {
    // legacy items may have no id/timestamps and data fields at top-level
    const hasData = !!item?.data;
    const id = item.id || uid();
    const created_at = item.created_at || nowISO();
    const updated_at = nowISO();
    const name = item.name || 'Untitled';
    const kind = (item.kind || 'planner') as SavedPlanLocal['kind'];

    if (hasData) {
      out.push({
        id,
        name,
        kind,
        created_at,
        updated_at,
        data: item.data,
        units: item.units,
        dives: item.dives,
        totals: item.totals,
      });
    } else {
      // Wrap legacy payload into data
      const data = { units: item.units, dives: item.dives, totals: item.totals };
      out.push({
        id,
        name,
        kind,
        created_at,
        updated_at,
        data,
        units: item.units,
        dives: item.dives,
        totals: item.totals,
      });
    }
  }
  return out;
}

function saveLocalList(list: SavedPlanLocal[]) {
  localStorage.setItem('dm_saved_plans', JSON.stringify(list));
}

function toPlannerURLPayload(p: any) {
  // Accept both cloud shape {data:{units,dives,totals}} and local legacy {units,dives,totals}
  const data = p?.data ?? { units: p?.units, dives: p?.dives, totals: p?.totals };
  const payload = { units: data?.units, dives: data?.dives, totals: data?.totals };
  return `/planner?p=${encodeURIComponent(JSON.stringify(payload))}`;
}

export default function SavedPage() {
  const router = useRouter();
  const [localPlans, setLocalPlans] = useState<SavedPlanLocal[] | null>(null);
  const [cloudPlans, setCloudPlans] = useState<SavedPlanCloud[] | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);

  // Load + migrate local
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem('dm_saved_plans') || localStorage.getItem('divemix_plans');
      const parsed = raw ? JSON.parse(raw) : [];
      const norm = normalizeLocal(parsed);
      setLocalPlans(norm);
      saveLocalList(norm);
    } catch {
      setLocalPlans([]);
    }
  }, []);

  // Load cloud
  useEffect(() => {
    (async () => {
      setLoadingCloud(true);
      const { data, error } = await supabase
        .from('plans')
        .select('id,name,kind,created_at,data')
        .order('created_at', { ascending: false });
      if (!error) setCloudPlans((data || []) as any);
      setLoadingCloud(false);
    })();
  }, []);

  function renameLocal(id: string) {
    const name = window.prompt('Rename to?');
    if (!name) return;
    setLocalPlans((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) =>
        p.id === id ? { ...p, name, updated_at: nowISO() } : p,
      );
      saveLocalList(next);
      return next;
    });
  }

  function duplicateLocal(id: string) {
    setLocalPlans((prev) => {
      if (!prev) return prev;
      const it = prev.find((p) => p.id === id);
      if (!it) return prev;
      const copy: SavedPlanLocal = {
        ...it,
        id: uid(),
        name: `${it.name} (copy)`,
        created_at: nowISO(),
        updated_at: nowISO(),
      };
      const next = [copy, ...prev];
      saveLocalList(next);
      return next;
    });
  }

  function deleteLocal(id: string) {
    if (!confirm('Delete this local plan?')) return;
    setLocalPlans((prev) => {
      if (!prev) return prev;
      const next = prev.filter((p) => p.id !== id);
      saveLocalList(next);
      return next;
    });
  }

  async function renameCloud(id: string) {
    const name = window.prompt('Rename to?');
    if (!name) return;
    const { error } = await supabase.from('plans').update({ name }).eq('id', id);
    if (!error) {
      setCloudPlans((prev) =>
        prev ? prev.map((p) => (p.id === id ? { ...p, name } : p)) : prev,
      );
    } else alert(error.message);
  }

  async function deleteCloud(id: string) {
    if (!confirm('Delete this cloud plan?')) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (!error) setCloudPlans((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    else alert(error.message);
  }

  function exportJSON(obj: any, filename: string) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    a.click();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Saved Plans</h1>
      <p className="text-sm text-zinc-500">
        Manage your local and cloud plans. Load, rename, duplicate, delete, export.
      </p>

      <section className="space-y-3">
        <div className="text-lg font-medium">Local</div>
        {!localPlans && <div className="text-sm text-zinc-500">Loading…</div>}
        {localPlans && localPlans.length === 0 && (
          <div className="text-sm text-zinc-500">No local plans yet.</div>
        )}
        {localPlans && localPlans.length > 0 && (
          <div className="space-y-3">
            {localPlans.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-500">
                    {p.kind} · {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() => router.push(toPlannerURLPayload(p))}
                  >
                    Load
                  </button>
                  <button className="btn" onClick={() => exportJSON(p, `${p.name}.json`)}>
                    Export JSON
                  </button>
                  <button className="btn" onClick={() => duplicateLocal(p.id)}>
                    Duplicate
                  </button>
                  <button className="btn" onClick={() => renameLocal(p.id)}>
                    Rename
                  </button>
                  <button className="btn" onClick={() => deleteLocal(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="text-lg font-medium">Cloud</div>
        {loadingCloud && <div className="text-sm text-zinc-500">Loading from cloud…</div>}
        {cloudPlans && cloudPlans.length === 0 && (
          <div className="text-sm text-zinc-500">No cloud plans yet.</div>
        )}
        {cloudPlans && cloudPlans.length > 0 && (
          <div className="space-y-3">
            {cloudPlans.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-500">
                    {p.kind} · {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() => router.push(toPlannerURLPayload(p))}
                  >
                    Load
                  </button>
                  <button className="btn" onClick={() => exportJSON(p, `${p.name}.json`)}>
                    Export JSON
                  </button>
                  <button className="btn" onClick={() => renameCloud(p.id)}>
                    Rename
                  </button>
                  <button className="btn" onClick={() => deleteCloud(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
