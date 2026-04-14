import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Rest timer that survives tab backgrounding.
 *
 * How we keep it accurate when the tab is hidden:
 *
 * 1. We never decrement a counter. Instead we store an absolute `endTime`
 *    (wall-clock ms) and compute `remaining` every tick from Date.now().
 *    Even if the browser throttles setInterval to ~1/min in a hidden tab,
 *    the next tick that does fire still computes the correct remaining.
 *
 * 2. On `visibilitychange` we tick immediately — so the moment you return
 *    to the tab, the display jumps to the correct value.
 *
 * 3. We request a Screen Wake Lock while the timer is active, which on
 *    supported browsers (Chrome/Edge Android, desktop Chromium) keeps the
 *    screen from sleeping mid-rest. The lock is re-acquired on return
 *    because browsers auto-release it when the document hides.
 *
 * 4. If the timer completes while the tab is hidden we fire a browser
 *    Notification (if permission was granted). Permission is requested
 *    the first time `start()` is called.
 *
 * Caveat — on a fully locked phone, the tab/JS runtime may be suspended
 * entirely. In that case the notification only fires once the user
 * unlocks and revives the page. The only real fix for that is Web Push
 * via a Service Worker, which requires server infrastructure.
 */
export function useRestTimer() {
  const [state, setState] = useState({
    active: false,
    paused: false,
    total: 90,
    remaining: 90,
    title: '',
    finished: false,
  });

  // Refs (no re-render on change)
  const endTimeRef = useRef(null);          // wall-clock ms when timer should hit 0
  const pauseStartRef = useRef(null);       // wall-clock ms the pause started (null if not paused)
  const intervalRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const wakeLockRef = useRef(null);
  const finishedRef = useRef(false);
  const activeRef = useRef(false);

  // ── Wake Lock helpers ─────────────────────────────────────────────
  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener?.('release', () => {
          // Browser released it (e.g. page hidden). We'll re-acquire on visibility.
          wakeLockRef.current = null;
        });
      }
    } catch {
      // Wake Lock isn't available (iOS < 16.4 PWA, Firefox, etc.) — silently no-op.
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {}
    wakeLockRef.current = null;
  }, []);

  // ── Cleanup helpers ───────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimers();
    releaseWakeLock();
    endTimeRef.current = null;
    pauseStartRef.current = null;
    finishedRef.current = false;
    activeRef.current = false;
    setState((s) => ({
      ...s,
      active: false,
      paused: false,
      finished: false,
    }));
  }, [clearTimers, releaseWakeLock]);

  // ── Core tick: compute remaining from wall clock ──────────────────
  const tick = useCallback(() => {
    if (!activeRef.current || endTimeRef.current == null) return;
    if (pauseStartRef.current != null) return; // paused — don't advance

    const msLeft = endTimeRef.current - Date.now();
    const remaining = Math.max(0, Math.ceil(msLeft / 1000));

    if (remaining === 0 && !finishedRef.current) {
      // Fire completion side effects exactly once
      finishedRef.current = true;
      setState((s) => ({ ...s, remaining: 0, finished: true, active: true }));

      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {}

      // If the user is on another tab/app when the timer ends, surface
      // a system notification so they know rest is done.
      if (
        typeof document !== 'undefined' &&
        document.hidden &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification('Rest timer done', {
            body: 'Next set ready.',
            tag: 'rest-timer',
            silent: false,
          });
        } catch {}
      }

      // Auto-hide the card 3s later. setTimeout may be throttled in a
      // hidden tab — that's fine, we just clear it on hide() regardless.
      hideTimeoutRef.current = setTimeout(() => hide(), 3000);

      // Stop the interval — we're done ticking until next start().
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Release screen lock; rest is over.
      releaseWakeLock();
      return;
    }

    // Normal tick — update remaining in state only if it changed.
    setState((s) => (s.remaining === remaining ? s : { ...s, remaining }));
  }, [hide, releaseWakeLock]);

  // ── Public API ────────────────────────────────────────────────────
  const start = useCallback(
    (seconds, title = '') => {
      clearTimers();
      releaseWakeLock();

      finishedRef.current = false;
      activeRef.current = true;
      pauseStartRef.current = null;
      endTimeRef.current = Date.now() + seconds * 1000;

      setState({
        active: true,
        paused: false,
        total: seconds,
        remaining: seconds,
        title: title || 'Next set in…',
        finished: false,
      });

      // Request notification permission on first use (async, non-blocking).
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        try {
          Notification.requestPermission().catch(() => {});
        } catch {}
      }

      acquireWakeLock();

      // Tick at 250ms when visible for smooth ring animation. Browsers throttle
      // this when hidden, but wall-clock arithmetic keeps remaining correct.
      intervalRef.current = setInterval(tick, 250);
      tick();
    },
    [acquireWakeLock, clearTimers, releaseWakeLock, tick]
  );

  const togglePause = useCallback(() => {
    setState((s) => {
      const nextPaused = !s.paused;
      if (nextPaused) {
        // Freeze: record the instant we paused.
        pauseStartRef.current = Date.now();
      } else if (pauseStartRef.current != null && endTimeRef.current != null) {
        // Unfreeze: shift endTime forward by the duration of the pause.
        const pausedFor = Date.now() - pauseStartRef.current;
        endTimeRef.current = endTimeRef.current + pausedFor;
        pauseStartRef.current = null;
      }
      return { ...s, paused: nextPaused };
    });
  }, []);

  // ── Visibility handling ───────────────────────────────────────────
  // When the tab becomes visible: tick immediately (so the UI jumps to the
  // correct remaining) and re-acquire the wake lock if the browser released
  // it while we were hidden.
  useEffect(() => {
    const onVis = async () => {
      if (document.hidden) return;
      tick();
      if (activeRef.current && !finishedRef.current) {
        await acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [tick, acquireWakeLock]);

  // ── Unmount cleanup ───────────────────────────────────────────────
  useEffect(
    () => () => {
      clearTimers();
      releaseWakeLock();
    },
    [clearTimers, releaseWakeLock]
  );

  return { state, start, hide, togglePause };
}

/**
 * Map exercise name → rest duration (seconds). Ported verbatim.
 */
export function getRestDuration(exName) {
  if (!exName) return 90;
  const n = exName.toLowerCase();
  if (n.includes('wrist') || n.includes('eccentric') || n.includes('elbow')) return 60;
  if (
    n.includes('lateral raise') ||
    n.includes('calf') ||
    n.includes('face pull') ||
    n.includes('band') ||
    n.includes('tricep') ||
    n.includes('curl') ||
    n.includes('dead bug') ||
    n.includes('plank') ||
    n.includes('pallof')
  )
    return 60;
  if (
    n.includes('interval') ||
    n.includes('agility') ||
    n.includes('rope') ||
    n.includes('jump') ||
    n.includes('battle')
  )
    return 75;
  return 90;
}

/**
 * Parse timed mobility duration (seconds) from the item's name+detail text.
 * Returns null for rep-based stretches.
 */
export function getMobilityTimerDuration(item) {
  const text = ((item?.name || '') + ' ' + (item?.detail || '')).toLowerCase();
  if (text.includes(' reps') || (text.includes('each side') && !text.includes('sec'))) return null;
  const secMatch = text.match(/(\d+)\s*sec/);
  if (secMatch) return parseInt(secMatch[1], 10);
  const minMatch = text.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  return null;
}
