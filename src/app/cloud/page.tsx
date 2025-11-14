'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function CloudCallbackPage() {
  useEffect(() => {
    // This forces Supabase to inspect the URL and persist the session
    const syncSession = async () => {
      try {
        await supabase.auth.getUser();
      } catch (e) {
        console.error('Error syncing Supabase session on /cloud:', e);
      }
    };
    syncSession();
  }, []);

  return (
    <main className="container mx-auto max-w-md p-4 space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Signed in</h1>
        <p className="text-sm text-zinc-400">
          Your magic link has been verified. Your session is now active on this device.
        </p>
      </header>

      <p className="text-sm text-zinc-400">
        You can continue to your saved cloud plans or back to the planner.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/saved" className="btn">
          Go to Saved Plans
        </Link>
        <Link href="/planner" className="btn-outline">
          Back to Planner
        </Link>
      </div>

      <p className="text-xs text-zinc-500">
        If you refresh or reopen the site on this browser, you should stay signed in until
        you explicitly sign out or clear your browser data.
      </p>
    </main>
  );
}
