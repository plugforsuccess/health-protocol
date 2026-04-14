import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Auth hook wrapping Supabase session.
 * Exposes: { session, user, loading, signInAnonymously, signInWithGoogle, signOut }
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!mounted) return;
      setSession(s ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    // signInWithOAuth returns the redirect URL but does NOT navigate on its
    // own in all runtimes. If the browser hasn't started redirecting within
    // a second, do it explicitly so the button doesn't hang on "SIGNING IN…"
    // when Google provider misconfiguration blocks the automatic redirect.
    if (data?.url) {
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = data.url;
        }
      }, 800);
    }
  }

  async function signInAnonymously() {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    // The session fires through onAuthStateChange, which updates state.
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInAnonymously,
    signInWithGoogle,
    signOut,
  };
}
