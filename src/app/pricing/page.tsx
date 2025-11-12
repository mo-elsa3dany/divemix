/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number>(0);

  async function join() {
    const now = Date.now();
    if (now - last < 10_000) {
      setMsg('Easy tiger — try again in a few seconds.');
      return;
    }
    if (!email.includes('@')) {
      setMsg('Enter a valid email.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.from('waitlist').insert({ email });
      if (error) {
        if ((error.message || '').toLowerCase().includes('duplicate'))
          setMsg('You’re already on the list. 👍');
        else throw error;
      } else {
        setMsg('All set — we’ll email you when Pro opens.');
        setEmail('');
        setLast(now);
      }
    } catch (e: any) {
      setMsg(e.message || 'Could not join. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Pricing</h1>
      <div className="card space-y-3">
        <p className="text-sm text-zinc-400">
          Free: Planner + Nitrox. Pro soon: cloud presets, share gallery, export packs,
          and more.
        </p>
        <div className="grid gap-2 max-w-md">
          <input
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" disabled={busy} onClick={join}>
            {busy ? 'Adding…' : 'Join waitlist'}
          </button>
          {msg && <div className="hint">{msg}</div>}
        </div>
      </div>
    </main>
  );
}
