import { useCallback, useEffect, useState } from 'react';

// Per-user progression preferences.
//
// The default rule (+5lb compound, +2.5lb isolation) is what most lifters
// want, but reviewers flagged that some athletes will want to override:
//
//   • smaller plates only at home → "+2.5lb across the board"
//   • older athlete or post-injury → smaller jumps everywhere
//   • someone progressing fast on lower body → bigger compound jumps
//
// We store these in localStorage rather than Supabase for two reasons:
//   1. It's a UX preference, not session data — no need to round-trip
//      to the network on every modal open.
//   2. It's a one-line migration to move to a synced `user_prefs` table
//      later if cross-device sync becomes important.
//
// The shape is deliberately small so it can serialise into a single key.

const STORAGE_KEY = 'health-protocol.progression-prefs';

export const DEFAULT_PROGRESSION_PREFS = {
  compoundIncrement: 5,    // lbs added when all sets done on a compound lift
  isolationIncrement: 2.5, // lbs added on small-muscle / rehab work
};

const ALLOWED_INCREMENTS = [1, 2.5, 5, 10];

function readStored() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PROGRESSION_PREFS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESSION_PREFS;
    const parsed = JSON.parse(raw);
    return {
      compoundIncrement:
        ALLOWED_INCREMENTS.includes(parsed.compoundIncrement)
          ? parsed.compoundIncrement
          : DEFAULT_PROGRESSION_PREFS.compoundIncrement,
      isolationIncrement:
        ALLOWED_INCREMENTS.includes(parsed.isolationIncrement)
          ? parsed.isolationIncrement
          : DEFAULT_PROGRESSION_PREFS.isolationIncrement,
    };
  } catch {
    return DEFAULT_PROGRESSION_PREFS;
  }
}

export function useProgressionPrefs() {
  const [prefs, setPrefs] = useState(readStored);

  const update = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Cross-tab sync — if the user opens the settings on a second tab.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      setPrefs(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { prefs, update, allowed: ALLOWED_INCREMENTS };
}
