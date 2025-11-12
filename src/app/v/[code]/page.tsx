'use client';
import { useEffect, useState } from 'react';
import { decodePlan } from '@/lib/utils/share';
import { mToFt } from '@/lib/calc/gas';

export default function PublicView({ params }: { params: { code: string } }) {
  const [plan, setPlan] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = decodePlan<any>(params.code);
      if (!p) throw new Error('Invalid code');
      setPlan(p);
    } catch (e: any) {
      setErr(e.message || 'Bad link');
    }
  }, [params.code]);

  if (err) return <main className="card">Link error: {err}</main>;
  if (!plan) return <main>Loading…</main>;

  const depthM =
    plan.units === 'ft'
      ? Math.round(plan.depthUI / 3.28084)
      : (plan.depthM ?? plan.depthUI);
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Shared Dive Plan</h1>
      <div className="card space-y-1">
        {plan.label && (
          <div>
            <b>Label:</b> {plan.label}
          </div>
        )}
        {plan.site && (
          <div>
            <b>Site:</b> {plan.site}
          </div>
        )}
        <div>
          <b>Units:</b> {plan.units}
        </div>
        <div>
          <b>Depth:</b> {plan.depthUI} {plan.units} ({depthM} m / {mToFt(depthM)} ft)
        </div>
        <div>
          <b>Time:</b> {plan.time} min
        </div>
        <div>
          <b>FO₂:</b> {plan.fo2Pct}% · <b>Max PPO₂:</b> {plan.targetPp}
        </div>
        <div>
          <b>SAC:</b> {plan.sac} L/min
        </div>
      </div>
      <a className="btn" href="/planner">
        Open in Planner
      </a>
      <p className="hint">
        Viewer only. Always verify with training agency and a dive computer.
      </p>
    </main>
  );
}
