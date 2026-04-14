import { useEffect, useRef, useState } from 'react';

/**
 * Bottom-sheet modal that lets an anonymous user bind their account to a
 * Google identity or an email. The user_id doesn't change, so all existing
 * data follows along.
 */
export function ConnectAccountDialog({ open, onClose, onLinkGoogle, onLinkEmail }) {
  const [busy, setBusy] = useState(null); // 'google' | 'email' | null
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);    // { kind: 'ok' | 'err', text }
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  // Reset state when re-opened.
  useEffect(() => {
    if (open) {
      setMsg(null);
      setEmail('');
      setBusy(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleGoogle() {
    setMsg(null);
    setBusy('google');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setBusy(null);
      setMsg({
        kind: 'err',
        text:
          'Linking didn\'t start. Enable "Allow manual linking" under Authentication → Settings, and make sure the Google provider is configured.',
      });
    }, 6000);

    try {
      await onLinkGoogle();
    } catch (e) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setBusy(null);
      setMsg({ kind: 'err', text: friendlyLinkError(e) });
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setMsg(null);
    setBusy('email');
    try {
      await onLinkEmail(trimmed);
      setBusy(null);
      setMsg({
        kind: 'ok',
        text: `Confirmation link sent to ${trimmed}. Click it on any device to finish linking — your data will follow.`,
      });
    } catch (e) {
      setBusy(null);
      setMsg({ kind: 'err', text: friendlyLinkError(e) });
    }
  }

  const overlayClick = (e) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };

  return (
    <div className="modal-overlay open" onClick={overlayClick} role="dialog" aria-modal="true">
      <div className="modal-sheet connect-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-title">CONNECT ACCOUNT</div>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
              disabled={!!busy}
            >
              ✕
            </button>
          </div>
          <div className="connect-sub">
            Bind this anonymous account to an email or Google identity so you
            can sign in from another device and keep all of your data.
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-section-title" style={{ color: 'var(--s)' }}>
              Link with Google
            </div>
            <button
              type="button"
              className="auth-btn"
              onClick={handleGoogle}
              disabled={!!busy}
            >
              <GoogleIcon />
              {busy === 'google' ? 'OPENING GOOGLE…' : 'CONTINUE WITH GOOGLE'}
            </button>
          </div>

          <div className="modal-section">
            <div className="modal-section-title" style={{ color: 'var(--a)' }}>
              Or link an email
            </div>
            <form onSubmit={handleEmail} className="connect-email-form">
              <input
                type="email"
                className="connect-email-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!busy}
                required
              />
              <button
                type="submit"
                className="auth-btn"
                disabled={!!busy || !email.trim()}
                style={{ marginTop: 8 }}
              >
                {busy === 'email' ? 'SENDING…' : 'SEND MAGIC LINK'}
              </button>
            </form>
            <div className="connect-hint">
              Supabase will email you a link. Click it from any device to
              complete the upgrade.
            </div>
          </div>

          {msg && (
            <div
              className={msg.kind === 'ok' ? 'connect-msg ok' : 'connect-msg err'}
            >
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyLinkError(e) {
  const msg = e?.message || 'Link failed';
  if (/manual linking/i.test(msg)) {
    return 'Manual linking is disabled in this Supabase project. Turn on "Allow manual linking" under Authentication → Settings.';
  }
  if (/identity.*already/i.test(msg)) {
    return 'That identity is already linked to a different account.';
  }
  return msg;
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
