export const dynamic = 'force-dynamic';

async function getCloud() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const r = await fetch(`${base}/api/plans`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    return j.data ?? [];
  } catch {
    return [];
  }
}

export default async function SavedPage() {
  const cloud = await getCloud();
  return (
    <main className="container max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Saved Plans</h1>

      <section className="card space-y-3">
        <h2 className="text-xl font-medium">Cloud</h2>
        <div className="space-y-2">
          {cloud.length === 0 && <div className="muted">No cloud plans yet.</div>}
          {cloud.map((p: any) => (
            <div key={p.id} className="card">
              <div className="font-medium">Plan {p.code}</div>
              <div className="text-sm text-zinc-500">
                Units: {p.units} · Tech: {String(p.tech)} · GF {p.gf_lo}/{p.gf_hi}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
