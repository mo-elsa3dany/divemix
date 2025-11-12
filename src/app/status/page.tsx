'use client';

export default function Status() {
  const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local/dev';
  const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'local';
  const msg = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE || '';
  const builtAt = new Date().toLocaleString();

  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-semibold">Status</h1>
      <div className="card space-y-1">
        <div>
          <b>Commit:</b> {sha.slice(0, 7)}
        </div>
        <div>
          <b>Branch:</b> {branch}
        </div>
        <div>
          <b>Message:</b> {msg}
        </div>
        <div>
          <b>Built:</b> {builtAt}
        </div>
      </div>
      <p className="hint">Tip: on Vercel, these values come from env automatically.</p>
    </main>
  );
}
