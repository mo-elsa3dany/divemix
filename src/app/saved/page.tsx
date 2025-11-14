'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

type PlanRow = {
  id: string;
  kind: string | null;
  label: string | null;
  site: string | null;
  created_at: string;
  raw: Record<string, unknown> | null;
};

export default function SavedPlansPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Check auth
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('getUser error', userError);
        }
        const user = data?.user;
        if (!user) {
          setError('You are not signed in. Use Login → magic link first.');
          setLoading(false);
          return;
        }

        setUserEmail(user.email ?? user.id);

        // Load plans (including raw payload so we can reopen them in the planner)
        const { data: rows, error: plansError } = await supabase
          .from('plans')
          .select('id, kind, label, site, created_at, raw')
          .order('created_at', { ascending: false });

        if (plansError) {
          throw plansError;
        }

        setPlans((rows ?? []) as PlanRow[]);
      } catch (e) {
        console.error('Could not load plans', e);
        setError('Could not load your cloud plans.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const openInPlanner = (plan: PlanRow) => {
    try {
      if (typeof window === 'undefined') return;

      const payload = plan.raw;
      if (!payload) {
        alert(
          'This plan was saved without a full payload. Newer saves will open in the planner.',
        );
        return;
      }

      const existing = window.localStorage.getItem('plans');
      const arr = existing ? JSON.parse(existing) : [];
      const list = Array.isArray(arr) ? arr : [];

      // raw should look like: { units, tech, gfLo, gfHi, dives }
      list.push(payload);
      window.localStorage.setItem('plans', JSON.stringify(list));

      // Jump to planner – it will load the last local plan
      window.location.href = '/planner';
    } catch (e) {
      console.error('Open in planner failed', e);
      alert('Could not open this plan in the planner.');
    }
  };

  return (
    <main className="container mx-auto max-w-3xl p-4 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Saved Plans</h1>
        {userEmail && <p className="text-sm text-zinc-400">Signed in as {userEmail}</p>}
      </header>

      <p className="text-sm text-zinc-400">
        Plans saved to the cloud from this browser. Local-only saves in the planner do not
        appear here.
      </p>

      <div className="flex gap-3">
        <Link href="/planner" className="btn-outline">
          Back to Planner
        </Link>
      </div>

      {loading && <p className="text-sm text-zinc-400">Loading…</p>}

      {error && !loading && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && plans.length === 0 && (
        <p className="text-sm text-zinc-400">
          No cloud plans yet. Go to the Planner and hit “Save” while signed in.
        </p>
      )}

      {!loading && !error && plans.length > 0 && (
        <ul className="space-y-3">
          {plans.map((p) => {
            const label = p.label || p.site || 'Untitled plan';
            const kindLong =
              p.kind === 'planner'
                ? 'Multi-dive plan'
                : p.kind === 'nitrox'
                  ? 'Nitrox mix'
                  : p.kind === 'trimix'
                    ? 'Trimix tool'
                    : 'Plan';

            return (
              <li key={p.id} className="card flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-zinc-500 mt-4">
                    {kindLong} • {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <button className="btn-outline text-xs" onClick={() => openInPlanner(p)}>
                  Open in Planner
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
