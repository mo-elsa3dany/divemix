import { mToFt } from '@/lib/calc/gas';
import { decodePlan } from '@/lib/utils/share';

type Params = { code: string };

export default async function PublicView({ params }: { params: Promise<Params> }) {
  const { code } = await params;

  let plan: any | null = null;
  let err: string | null = null;

  try {
    plan = decodePlan<any>(code);
    if (!plan) throw new Error('Invalid code');
  } catch (e: any) {
    err = e?.message || 'Bad link';
  }

  if (err) return <main className="card">Link error: {err}</main>;

  const depthM =
    plan.units === 'ft'
      ? Math.round((plan.depthUI ?? plan.depthM ?? 0) / 3.28084)
      : (plan.depthM ?? plan.depthUI ?? 0);

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
          <b>Depth:</b> {plan.depthUI ?? depthM} {plan.units} ({depthM} m /{' '}
          {mToFt(depthM)} ft)
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
        Viewer only. Always verify with a dive computer and agency standards.
      </p>
    </main>
  );
}
