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
 * 4. If the timer completes while the tab is hidden we fire a local
 *    Notification (if permission was granted).
 *
 * 5. To survive a FULLY suspended / locked device: when the timer starts
 *    we optionally schedule a Web Push via the caller-provided
 *    `push.schedule({ fireAt, title, body })`. If the tab dies before the
 *    timer fires, the server-side cron sends the push and the OS wakes
 *    the phone. If the tab is alive and the timer completes locally we
 *    `push.cancel(id)` to avoid a duplicate buzz.
 *
 * The `push` argument is optional — without it, the timer still works
 * exactly as before.
 */
export function useRestTimer(push) {
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
  const scheduledPushIdRef = useRef(null);  // id of the queued push row (for cancellation)
  const audioCtxRef = useRef(null);         // shared AudioContext for the beep

  // ── Audio beep ───────────────────────────────────────────────────
  // The Vibration API can't increase motor strength (that's fixed hardware),
  // and vibration alone is missable when the phone is in a pocket or on iOS
  // where the API doesn't exist. We pair the vibrate pattern with a loud
  // 4-beep alarm via Web Audio.
  //
  // AudioContext must be created/resumed inside a user gesture; we init it
  // at start() (which IS a user-gesture descendant via the set-check tap)
  // so the context is unlocked and ready when the timer fires at 0s.
  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    } catch {}
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback(() => {
    const ac = audioCtxRef.current;
    if (!ac) return;
    // Resume if Safari auto-suspended it (happens on focus loss).
    if (ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }
    const now = ac.currentTime;
    // Four 220ms "beeps" at alternating pitches — snappy, unambiguous,
    // impossible to confuse with a regular notification chime.
    const pattern = [
      { t: 0.00, freq: 880 },
      { t: 0.33, freq: 1320 },
      { t: 0.66, freq: 880 },
      { t: 0.99, freq: 1320 },
    ];
    pattern.forEach(({ t, freq }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square'; // harsher + louder-sounding than sine
      osc.frequency.value = freq;
      // Envelope to avoid harsh click at start/end.
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.45, now + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.22);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.23);
    });
  }, []);

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
    // Cancel any outstanding scheduled push so the server doesn't fire a
    // redundant buzz after the user has already moved on.
    if (scheduledPushIdRef.current && push?.cancel) {
      const id = scheduledPushIdRef.current;
      scheduledPushIdRef.current = null;
      push.cancel(id).catch(() => {});
    } else {
      scheduledPushIdRef.current = null;
    }
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
  }, [clearTimers, releaseWakeLock, push]);

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

      // Tab was alive at completion, so cancel the server-side fallback push.
      if (scheduledPushIdRef.current && push?.cancel) {
        const id = scheduledPushIdRef.current;
        scheduledPushIdRef.current = null;
        push.cancel(id).catch(() => {});
      }

      // Maximum-perceivability pattern. Vibration motors can't be made
      // stronger (intensity is hardware-fixed), so we maximise DURATION
      // and density: four 1.5-second pulses with 100ms gaps = 6.1 s of
      // near-continuous buzzing. Alarm-like rather than notification-like.
      try {
        navigator.vibrate?.([1500, 100, 1500, 100, 1500, 100, 1500]);
      } catch {}

      // Simultaneous audio alarm — compensates when the phone is in a
      // pocket, on iOS (no Vibration API), or on low-intensity motors.
      playBeep();

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
  }, [hide, releaseWakeLock, playBeep, push]);

  // ── Public API ────────────────────────────────────────────────────
  const start = useCallback(
    (seconds, title = '') => {
      clearTimers();
      releaseWakeLock();

      // If a previous timer scheduled a fallback push and hasn't been
      // cancelled yet, cancel it now — we're starting fresh.
      if (scheduledPushIdRef.current && push?.cancel) {
        const prevId = scheduledPushIdRef.current;
        push.cancel(prevId).catch(() => {});
      }
      scheduledPushIdRef.current = null;

      // Init + resume the AudioContext while we're inside a user gesture
      // (this start() call descends from the set-check tap). iOS/Safari
      // require this so the beep can fire from a non-gesture context
      // when the timer expires.
      const ac = ensureAudio();
      if (ac && ac.state === 'suspended') {
        ac.resume().catch(() => {});
      }

      finishedRef.current = false;
      activeRef.current = true;
      pauseStartRef.current = null;
      const endMs = Date.now() + seconds * 1000;
      endTimeRef.current = endMs;

      setState({
        active: true,
        paused: false,
        total: seconds,
        remaining: seconds,
        title: title || 'Next set in…',
        finished: false,
      });

      acquireWakeLock();

      // Tick at 250ms when visible for smooth ring animation. Browsers throttle
      // this when hidden, but wall-clock arithmetic keeps remaining correct.
      intervalRef.current = setInterval(tick, 250);
      tick();

      // Fallback: schedule a Web Push on the server for 2s AFTER the local
      // completion. If the tab is alive at t=seconds the local notification
      // fires and we'll cancel this push. If the tab is dead the server
      // delivers the push 2s later so the OS wakes the phone.
      if (push?.schedule) {
        const title2 = title || 'Next set ready';
        push
          .schedule({
            fireAt: new Date(endMs + 2000),
            title: 'Rest timer done',
            body: title2,
            tag: 'rest-timer',
          })
          .then((id) => {
            // Only store if we're still the active timer — start() may have
            // been called again in the interim.
            if (id && endTimeRef.current === endMs) {
              scheduledPushIdRef.current = id;
            } else if (id && push?.cancel) {
              // Stale — cancel it.
              push.cancel(id).catch(() => {});
            }
          })
          .catch(() => {});
      }
    },
    [acquireWakeLock, clearTimers, ensureAudio, releaseWakeLock, tick, push]
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
