'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setBusy(true);

    try {
      let origin = process.env.NEXT_PUBLIC_SITE_URL;
      if (typeof window !== 'undefined') {
        origin = window.location.origin;
      }

      const redirectTo = `${origin}/cloud`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error(error);
        setError('Could not send magic link. Please try again.');
      } else {
        setStatus('Magic link sent. Check your email to complete sign-in.');
      }
    } catch (e) {
      console.error(e);
      setError('Unexpected error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container mx-auto max-w-md p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-400">
          Enter your email to receive a one-time magic link. No passwords.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="you@example.com"
          />
        </label>

        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      {status && <p className="text-sm text-emerald-400">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="text-xs text-zinc-500">
        You&apos;ll be redirected back to DiveMix after clicking the link.
      </p>
    </main>
  );
}
