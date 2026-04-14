import { useEffect, useRef, useState } from 'react';
import { hasSupabaseConfig } from '../lib/supabase.js';

export function AuthScreen({ onSignInAnonymously, onSignInWithGoogle }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // 'anon' | 'google' | null
  const [err, setErr] = useState(null);
  const [showGoogle, setShowGoogle] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  async function handleAnon() {
    setErr(null);
    setLoading(true);
    setMode('anon');
    try {
      await onSignInAnonymously();
    } catch (e) {
      const msg = e?.message || 'Sign-in failed';
      // Common case: admin hasn't toggled on anonymous sign-ins yet.
      const friendly = /anonymous/i.test(msg)
        ? 'Anonymous sign-in is disabled. Enable it in Supabase → Authentication → Sign In / Providers → "Allow anonymous sign-ins".'
        : msg;
      setErr(friendly);
      setLoading(false);
      setMode(null);
    }
  }

  async function handleGoogle() {
    setErr(null);
    setLoading(true);
    setMode('google');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setMode(null);
      setErr(
        'Sign-in didn\'t start. Enable Google under Authentication → Providers in Supabase, and add this origin to the redirect URL allowlist.'
      );
    }, 6000);

    try {
      await onSignInWithGoogle();
    } catch (e) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setErr(e?.message || 'Sign-in failed');
      setLoading(false);
      setMode(null);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">DAILY PROTOCOL</div>
        <div className="auth-tag">NEURO · GUT · DIET · TRAIN</div>
        <div className="auth-sub">
          Personal protocol tracker. Your checks, streaks, workout logs, and
          rest-timer pushes all sync to a private account tied to this
          browser.
        </div>

        <button
          type="button"
          className="auth-btn"
          onClick={handleAnon}
          disabled={loading || !hasSupabaseConfig}
        >
          {loading && mode === 'anon' ? 'STARTING…' : '→  START TRACKING'}
        </button>

        {!showGoogle ? (
          <button
            type="button"
            onClick={() => setShowGoogle(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.1em',
              marginTop: 14,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            USE GOOGLE INSTEAD
          </button>
        ) : (
          <button
            type="button"
            className="auth-btn"
            onClick={handleGoogle}
            disabled={loading || !hasSupabaseConfig}
            style={{ marginTop: 10 }}
          >
            <GoogleIcon />
            {loading && mode === 'google' ? 'SIGNING IN…' : 'CONTINUE WITH GOOGLE'}
          </button>
        )}

        {!hasSupabaseConfig && (
          <div className="auth-error">
            Missing Supabase env. Copy .env.example → .env.local and fill in
            VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
          </div>
        )}
        {err && <div className="auth-error">{err}</div>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.8 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.1-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5 0 9.5-1.7 12.9-4.6l-6-5c-2 1.3-4.4 2.1-6.9 2.1-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.7 39.1 16.3 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6 5c-.4.4 6.7-4.9 6.7-14.4 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
