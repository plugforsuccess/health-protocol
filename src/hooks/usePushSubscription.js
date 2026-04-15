import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Subscribes this device to Web Push and persists the subscription to
 * Supabase so the send-due-pushes Edge Function can reach it.
 *
 * `ensureSubscribed()` is idempotent — call it on every rest-timer start.
 * The first call prompts for Notification permission; subsequent calls
 * are a cheap check against the existing subscription.
 */
export function usePushSubscription(userId) {
  const [status, setStatus] = useState('unknown'); // 'unknown' | 'unsupported' | 'prompt' | 'granted' | 'denied'
  const [reason, setReason] = useState(null); // last failure reason code from ensureSubscribed
  const [scheduleReason, setScheduleReason] = useState(null); // last failure reason code from schedule()
  const [swRegistered, setSwRegistered] = useState(false);
  const regRef = useRef(null);

  // Register the Service Worker once on mount.
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        regRef.current = reg;
        setSwRegistered(true);
        setStatus(
          Notification.permission === 'granted'
            ? 'granted'
            : Notification.permission === 'denied'
              ? 'denied'
              : 'prompt'
        );
      })
      .catch((err) => {
        console.warn('[push] SW registration failed', err);
        setStatus('unsupported');
      });
  }, []);

  const ensureSubscribed = useCallback(async () => {
    if (!userId) {
      setReason('no-user');
      return null;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setReason('unsupported-browser');
      return null;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[push] VITE_VAPID_PUBLIC_KEY missing; push disabled.');
      setReason('missing-vapid-key');
      return null;
    }

    const reg = regRef.current || (await navigator.serviceWorker.ready);
    if (!reg) {
      setReason('no-sw-registration');
      return null;
    }

    // Permission gate — will prompt if still 'default'.
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setStatus(result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt');
      if (result !== 'granted') {
        setReason(`permission-${result}`);
        return null;
      }
    } else {
      setStatus(Notification.permission);
    }
    if (Notification.permission !== 'granted') {
      setReason(`permission-${Notification.permission}`);
      return null;
    }

    // Reuse existing subscription if present.
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      } catch (err) {
        console.warn('[push] subscribe() failed', err);
        setReason(`subscribe-failed: ${err?.name || 'unknown'}`);
        return null;
      }
    }

    const json = sub.toJSON();
    // Upsert the subscription (idempotent per endpoint).
    const { error: upsertErr } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'user_id,endpoint' }
    );
    if (upsertErr) {
      console.warn('[push] upsert failed', upsertErr);
      setReason(`db-upsert-failed: ${upsertErr.message}`);
      return null;
    }

    setReason(null);
    return sub;
  }, [userId]);

  /** Queue a push to fire at `fireAt` (Date | ISO string). Returns row id or null. */
  const schedule = useCallback(
    async ({ fireAt, title, body, tag = 'rest-timer' }) => {
      const sub = await ensureSubscribed();
      if (!sub) {
        setScheduleReason('not-subscribed');
        return null;
      }
      const iso =
        fireAt instanceof Date ? fireAt.toISOString() : new Date(fireAt).toISOString();
      let data, error;
      try {
        ({ data, error } = await supabase.functions.invoke('schedule-push', {
          body: { fire_at: iso, title, body, tag },
        }));
      } catch (e) {
        console.warn('[push] invoke threw', e);
        setScheduleReason(`invoke-threw: ${e?.message || e?.name || 'unknown'}`);
        return null;
      }
      if (error) {
        console.warn('[push] schedule failed', error);
        // Try to pull HTTP status + body out of the FunctionsHttpError shape.
        let detail = error.message || error.name || 'unknown';
        const ctx = error.context;
        if (ctx?.status) detail = `HTTP ${ctx.status}`;
        if (ctx?.response) {
          try {
            const body = await ctx.response.clone().text();
            if (body) detail += `: ${body.slice(0, 200)}`;
          } catch {
            /* ignore */
          }
        }
        setScheduleReason(`edge-fn: ${detail}`);
        return null;
      }
      if (!data?.id) {
        setScheduleReason(`no-id: ${JSON.stringify(data).slice(0, 150)}`);
        return null;
      }
      setScheduleReason(null);
      return data.id;
    },
    [ensureSubscribed]
  );

  /** Mark a scheduled push cancelled so it won't fire. No-op if already sent. */
  const cancel = useCallback(async (id) => {
    if (!id) return;
    await supabase
      .from('scheduled_pushes')
      .update({ cancelled: true })
      .eq('id', id)
      .eq('sent', false);
  }, []);

  const debug = {
    vapidKeyPresent: !!VAPID_PUBLIC_KEY,
    vapidKeyPrefix: VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.slice(0, 10) : null,
    swSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    pushSupported: typeof window !== 'undefined' && 'PushManager' in window,
    notificationApi: typeof Notification !== 'undefined',
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'n/a',
    standalone:
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && navigator.standalone) ||
      false,
    swRegistered,
    userId: !!userId,
    status,
    reason,
    scheduleReason,
  };

  return { status, reason, scheduleReason, debug, ensureSubscribed, schedule, cancel };
}

/** Convert a base64-url VAPID public key to the Uint8Array PushManager wants. */
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
