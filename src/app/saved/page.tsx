'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthStatus from '../../components/AuthStatus';

type Plan = {
  id?: string;
  code?: string;
  name?: string | null;
  kind?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function SavedPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/plans');
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        const data = await res.json();
        const maybePlans: any = (data as any).plans ?? data;
        const list: Plan[] = Array.isArray(maybePlans) ? maybePlans : [];
        setPlans(list);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('Could not load your cloud plans. Make sure you are signed in.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="container mx-auto max-w-3xl p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Saved Cloud Plans</h1>
        <p className="text-sm text-zinc-400">
          Plans saved to your account from the Planner, Nitrox, and Trimix tools.
        </p>
      </header>

      {loading && <p className="text-sm text-zinc-400">Loading your plans…</p>}

      {error && !loading && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (!plans || plans.length === 0) && (
        <p className="text-sm text-zinc-400">
          You don&apos;t have any cloud-saved plans yet. Save a plan from the Planner,
          Nitrox, or Trimix pages to see it here.
        </p>
      )}

      {!loading && !error && plans && plans.length > 0 && (
        <section className="space-y-3">
          <ul className="space-y-2">
            {plans.map((p, idx) => {
              const created = p.created_at ? new Date(p.created_at).toLocaleString() : '';
              const label = p.name || 'Untitled plan';

              let kindShort = 'Plan';
              let kindLong = 'Plan';
              if (p.kind === 'planner') {
                kindShort = 'Planner';
                kindLong = 'Multi-dive plan';
              } else if (p.kind === 'nitrox') {
                kindShort = 'Nitrox';
                kindLong = 'Nitrox mix';
              } else if (p.kind === 'trimix') {
                kindShort = 'Trimix';
                kindLong = 'Trimix tool';
              }

              const key = p.id || p.code || String(idx);
              const href = p.code ? '/v/' + p.code : undefined;

              return (
                <li
                  key={key}
                  className="border border-zinc-800 rounded-lg p-3 flex items-center justify-between gap-3 bg-zinc-950/40"
                >
                  <div className="space-y-1">
                    {href ? (
                      <Link href={href} className="text-sm font-medium hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <div className="text-sm font-medium">{label}</div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">
                        {kindShort}
                      </span>
                      <span>{kindLong}</span>
                      {created && <span>• Saved {created}</span>}
                    </div>
                  </div>

                  {href && (
                    <Link href={href} className="btn-outline text-xs">
                      Open
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
