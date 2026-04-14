import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Rest timer with a 1-second countdown. Auto-hides 3s after completing.
 * Behavior ported from legacy:
 *   startRestTimer(seconds, exerciseName)
 *   hideRestTimer()                // skip
 *   toggleTimerPause()
 *   timerComplete()                // vibrates + displays GO
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

  const intervalRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    },
    []
  );

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const hide = useCallback(() => {
    clearTimers();
    pausedRef.current = false;
    setState((s) => ({ ...s, active: false, paused: false, finished: false }));
  }, []);

  const start = useCallback((seconds, title = '') => {
    clearTimers();
    pausedRef.current = false;
    setState({
      active: true,
      paused: false,
      total: seconds,
      remaining: seconds,
      title: title || 'Next set in…',
      finished: false,
    });

    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setState((s) => {
        const next = s.remaining - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          try {
            navigator.vibrate?.([200, 100, 200]);
          } catch {}
          hideTimeoutRef.current = setTimeout(() => {
            hide();
          }, 3000);
          return { ...s, remaining: 0, finished: true, active: true };
        }
        return { ...s, remaining: next };
      });
    }, 1000);
  }, [hide]);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setState((s) => ({ ...s, paused: pausedRef.current }));
  }, []);

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
