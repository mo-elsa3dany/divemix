'use client';
import Link from 'next/link';
import { usePlans, CloudPlanSummary } from '@/lib/usePlans';

export default function ClientCloudList() {
  const plans = usePlans();
  if (!plans?.length) return <div className="muted">No cloud plans yet.</div>;
  return (
    <div className="space-y-2">
      {plans.map((p: CloudPlanSummary) => (
        <Link
          key={p.id}
          href={`/v/${p.code}`}
          className="card block hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <div className="font-medium">Plan {p.code}</div>
          <div className="text-sm text-zinc-500">
            Units: {p.units} · Tech: {String(p.tech)} · GF {p.gf_lo}/{p.gf_hi}
          </div>
        </Link>
      ))}
    </div>
  );
}
