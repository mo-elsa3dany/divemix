export const dynamic = 'force-dynamic';

import Link from 'next/link';
import ExportPanel from '../../../components/ExportPanel';
import { supa } from '../../../lib/supabase';

type PlanRow = {
  id: string;
  units: 'm' | 'ft';
  tech: boolean;
  gf_lo: number;
  gf_hi: number;
  dives_json: unknown[] | null;
  code: string;
};

async function getPlan(code: string): Promise<PlanRow | null> {
  const { data, error } = await supa
    .from('plans')
    .select('id, units, tech, gf_lo, gf_hi, dives_json, code')
    .eq('code', code)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as PlanRow | null;
}

type RouteParams = { code?: string };
type PageProps = { params?: RouteParams | Promise<RouteParams> };

// ⬇️ Accept loose props (Next's typegen sometimes makes params a Promise)
export default async function PublicPlan({ params }: PageProps) {
  const resolvedParams = params ? await params : undefined;
  const code = resolvedParams?.code ?? '';
  const plan = code ? await getPlan(code) : null;

  if (!plan) {
    return (
      <main className="container max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Plan not found</h1>
        <p className="text-zinc-500">Code: {code}</p>
        <Link className="btn" href="/saved">
          Back to Saved
        </Link>
      </main>
    );
  }

  const payload = {
    label: `Plan ${plan.code}`,
    units: plan.units,
    tech: plan.tech,
    gf: `${plan.gf_lo}/${plan.gf_hi}`,
    dives_count: plan.dives_json?.length ?? 0,
  };

  const p = encodeURIComponent(
    JSON.stringify({
      units: plan.units,
      tech: plan.tech,
      gfLo: plan.gf_lo,
      gfHi: plan.gf_hi,
      dives: plan.dives_json ?? [],
    }),
  );
  const plannerUrl = `/planner?p=${p}`;

  return (
    <main className="container max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Public Plan • {plan.code}</h1>
        <Link className="btn" href={plannerUrl}>
          Open in Planner
        </Link>
      </div>

      <div className="card space-y-2">
        <div>
          <b>Units:</b> {plan.units} · <b>Tech:</b> {String(plan.tech)} · <b>GF:</b>{' '}
          {plan.gf_lo}/{plan.gf_hi}
        </div>
        <div>
          <b>Dives:</b> {plan.dives_json?.length ?? 0}
        </div>
      </div>

      <ExportPanel title={`Plan ${plan.code}`} row={payload} />

      <div className="text-sm text-zinc-500">
        Shareable URL: {`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/v/${plan.code}`}
      </div>
    </main>
  );
}
