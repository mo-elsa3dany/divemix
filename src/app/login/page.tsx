'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/useAuth';

export default function Login() {
  const { user } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">You’re signed in</h1>
        <p className="hint">{user.email}</p>
        <div className="flex gap-2">
          <a className="btn" href="/cloud">
            Go to My Plans
          </a>
          <button
            className="btn"
            onClick={async () => {
              await supabase.auth.signOut();
              location.reload();
            }}
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="hint">We’ll send a magic link to your email.</p>
      <div className="grid gap-3 max-w-md">
        <input
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: window.location.origin + '/cloud' },
              });
              if (error) throw error;
              setMsg('Check your inbox for the sign-in link.');
            } catch (e: any) {
              setMsg(e.message || 'Failed to send link');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Sending…' : 'Send magic link'}
        </button>
        {msg && <div className="card">{msg}</div>}
      </div>
    </main>
  );
}
