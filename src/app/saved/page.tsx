'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function Saved() {
  const [localPlans, setLocalPlans] = useState<any[]>([]);
  const [cloudPlans, setCloudPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Local
  useEffect(() => {
    try {
      const rawA = localStorage.getItem('dm_saved_plans');
      const rawB = localStorage.getItem('divemix_plans');
      const raw = rawA || rawB;
      if (raw) {
        const parsed = JSON.parse(raw);
        setLocalPlans(parsed);
      }
    } catch {}
  }, []);

  // Load Cloud
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('plans')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setCloudPlans(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  function deleteLocal(idx: number) {
    const next = [...localPlans];
    next.splice(idx, 1);
    setLocalPlans(next);
    localStorage.setItem('dm_saved_plans', JSON.stringify(next));
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Saved Plans</h1>

      {loading && <p className="text-sm opacity-60">Loading…</p>}

      {/* LOCAL LIST */}
      <section className="space-y-2">
        <h2 className="font-medium">Local</h2>
        {!localPlans.length && <p className="text-sm opacity-50">No local plans.</p>}

        <ul className="space-y-2">
          {localPlans.map((p, idx) => (
            <li
              key={idx}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div className="text-sm">
                <div>
                  <b>{p.name ?? '(unnamed)'}</b>
                </div>
                <div className="opacity-60">kind: {p.kind ?? 'planner'}</div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/planner?p=${encodeURIComponent(JSON.stringify(p))}`}
                  className="text-blue-500 underline text-sm"
                >
                  Load
                </Link>
                <button onClick={() => deleteLocal(idx)} className="text-red-500 text-sm">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CLOUD LIST */}
      <section className="space-y-2">
        <h2 className="font-medium">Cloud</h2>
        {!cloudPlans.length && <p className="text-sm opacity-50">No cloud plans.</p>}

        <ul className="space-y-2">
          {cloudPlans.map((p) => (
            <li
              key={p.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div className="text-sm">
                <div>
                  <b>{p.name ?? '(unnamed)'}</b>
                </div>
                <div className="opacity-60">kind: {p.kind ?? 'planner'}</div>
                {p.created_at && (
                  <div className="opacity-60">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div>
                <Link
                  href={`/planner?p=${encodeURIComponent(JSON.stringify(p.data ?? {}))}`}
                  className="text-blue-500 underline text-sm"
                >
                  Load
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
