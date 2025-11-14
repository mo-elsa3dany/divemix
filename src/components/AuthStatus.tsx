import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data && data.user) {
          setEmail(data.user.email ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecked(true);
      }
    };
    load();
  }, []);

  if (!checked) return null;

  if (!email) {
    return (
      <p className="text-xs text-zinc-500">
        Not signed in. Cloud saves will be local-only.
      </p>
    );
  }

  return (
    <p className="text-xs text-zinc-400">
      Signed in as <span className="font-medium">{email}</span>
    </p>
  );
}
