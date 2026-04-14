import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Auth hook wrapping Supabase session.
 * Exposes:
 *   session, user, loading,
 *   signInAnonymously, signInWithGoogle, signOut,
 *   linkWithGoogle(redirectTo?)   — upgrade anon → Google
 *   linkWithEmail(email)          — upgrade anon → email (magic link)
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

  /**
   * Upgrade an anonymous user to a Google identity. The row's user_id
   * stays the same, so every existing daily_check / streak / workout row
   * stays attached. Requires "Allow manual linking" enabled in the
   * Supabase project auth settings AND the Google provider configured.
   */
  async function linkWithGoogle() {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    if (data?.url) {
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = data.url;
        }
      }, 800);
    }
  }

  /**
   * Upgrade an anonymous user to an email identity. Supabase sends a
   * confirmation link; clicking it finalises the link and future sign-ins
   * from other devices can use the same email. Requires an email provider
   * (Supabase provides a default SMTP for small volumes).
   */
  async function linkWithEmail(email) {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
  }

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInAnonymously,
    signInWithGoogle,
    signOut,
    linkWithGoogle,
    linkWithEmail,
  };
}
