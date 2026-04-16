import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, localDateKey } from '../lib/supabase.js';
import { WORKOUT_WEEK } from '../data/workoutWeek.js';
import { classifyExercise, suggestProgression } from '../lib/workoutIntelligence.js';

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** ISO date for the given day-index relative to this week's occurrence. */
export function workoutDateKey(dayIdx, now = new Date()) {
  const today = now.getDay();
  const target = DAY_MAP.indexOf(WORKOUT_WEEK[dayIdx]?.day);
  if (target < 0) return localDateKey(now);
  const diff = target - today;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return localDateKey(d);
}

export function getTodayWorkoutIdx() {
  const name = DAY_MAP[new Date().getDay()];
  return WORKOUT_WEEK.findIndex((d) => d.day === name);
}

/**
 * Aggregates everything a workout UI needs:
 *   - sessions[] — list of workout_sessions rows (for stats / volume chart)
 *   - sets[]    — all sets for a given dayIdx's computed date (for modal)
 *   - mobility[] — mobility completions for same
 *   - logSet, cycleStatus, toggleMobility, completeWorkout
 *
 * Volume + PR are recomputed client-side on each set change, then the summary
 * is written to workout_sessions.
 */
export function useWorkoutLogs(userId) {
  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [mobility, setMobility] = useState([]);
  const [ready, setReady] = useState(false);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setReady(false);
    const [sess, allSets, mob] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false }),
      supabase.from('workout_sets').select('*').eq('user_id', userId),
      supabase.from('workout_mobility').select('*').eq('user_id', userId),
    ]);
    if (!sess.error) setSessions(sess.data || []);
    if (!allSets.error) setSets(allSets.data || []);
    if (!mob.error) setMobility(mob.data || []);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /** { [session_date__day_index]: true } for completed sessions — fast lookup. */
  const completedMap = useMemo(() => {
    const m = {};
    sessions.forEach((s) => {
      if (s.completed) m[`${s.session_date}__${s.day_index}`] = true;
    });
    return m;
  }, [sessions]);

  /** Sets keyed by `${date}::${dayIdx}::${exIdx}::${setIdx}` for modal lookup. */
  const setsMap = useMemo(() => {
    const m = {};
    sets.forEach((row) => {
      m[`${row.session_date}::${row.day_index}::${row.exercise_index}::${row.set_index}`] = row;
    });
    return m;
  }, [sets]);

  const mobilityMap = useMemo(() => {
    const m = {};
    mobility.forEach((row) => {
      m[`${row.session_date}::${row.day_index}::${row.mobility_index}`] = row.completed;
    });
    return m;
  }, [mobility]);

  /**
   * Return the full row list from the most recent session for this
   * (day_index, exercise_index) strictly BEFORE `excludeDate`, plus the
   * RPE that was logged for that session (if any). Both inputs feed
   * suggestProgression — RPE gates progression so a maxed-out session
   * doesn't trigger a +5lb bump even when all sets were completed.
   */
  const getLastSessionRows = useCallback(
    (dayIdx, exIdx, excludeDate) => {
      const byDate = {};
      sets.forEach((row) => {
        if (row.day_index !== dayIdx) return;
        if (row.exercise_index !== exIdx) return;
        if (excludeDate && row.session_date >= excludeDate) return;
        if (!byDate[row.session_date]) byDate[row.session_date] = [];
        byDate[row.session_date].push(row);
      });
      const dates = Object.keys(byDate).sort().reverse();
      if (!dates.length) return { date: null, rows: [], rpe: null };
      const date = dates[0];
      const session = sessions.find(
        (s) => s.session_date === date && s.day_index === dayIdx
      );
      const rpe = Number.isFinite(session?.rpe) ? session.rpe : null;
      return { date, rows: byDate[date], rpe };
    },
    [sets, sessions]
  );

  /**
   * Dynamic recommendation for the next session of a specific exercise.
   * The caller is responsible for the CURRENT date so we correctly exclude
   * today's in-progress rows and base the suggestion on the last COMPLETED
   * session. `prefs` carries the user's chosen progression increments
   * (defaults baked into suggestProgression if undefined).
   */
  const getSuggestion = useCallback(
    (dayIdx, exIdx, excludeDate, prefs) => {
      const ex = WORKOUT_WEEK[dayIdx]?.exercises?.[exIdx];
      if (!ex) return null;
      const { rows, rpe } = getLastSessionRows(dayIdx, exIdx, excludeDate);
      return suggestProgression({
        ex,
        priorRows: rows,
        priorCountTarget: ex.sets,
        priorRpe: rpe,
        prefs,
      });
    },
    [getLastSessionRows]
  );

  /** Calculate best weight for (exercise_index, day_index) across all past dates except `excludeDate`. */
  const getPrevBest = useCallback(
    (dayIdx, exIdx, excludeDate) => {
      let best = 0;
      sets.forEach((row) => {
        if (row.day_index !== dayIdx) return;
        if (row.exercise_index !== exIdx) return;
        if (excludeDate && row.session_date === excludeDate) return;
        const w = parseFloat(row.weight_lbs) || 0;
        if (w > best) best = w;
      });
      return best > 0 ? best : null;
    },
    [sets]
  );

  /** Calculate total volume for a given date+dayIdx. */
  const getVolumeFor = useCallback(
    (date, dayIdx) => {
      let vol = 0;
      sets.forEach((row) => {
        if (row.session_date !== date || row.day_index !== dayIdx) return;
        const w = parseFloat(row.weight_lbs) || 0;
        const r = parseFloat(row.reps) || 0;
        vol += w * r;
      });
      return vol;
    },
    [sets]
  );

  /** Calculate PR count: for each exercise in this session, is current-best > prev-best? */
  const getPRsFor = useCallback(
    (date, dayIdx) => {
      const byEx = {};
      sets.forEach((row) => {
        if (row.session_date !== date || row.day_index !== dayIdx) return;
        const w = parseFloat(row.weight_lbs) || 0;
        if (!byEx[row.exercise_index] || w > byEx[row.exercise_index]) {
          byEx[row.exercise_index] = w;
        }
      });
      let prs = 0;
      Object.entries(byEx).forEach(([exIdx, current]) => {
        const prev = getPrevBest(dayIdx, parseInt(exIdx, 10), date);
        if (prev && current > prev) prs += 1;
      });
      return prs;
    },
    [sets, getPrevBest]
  );

  /** Upsert session summary row (volume + prs). */
  const upsertSessionSummary = useCallback(
    async (date, dayIdx) => {
      if (!userId) return;
      const volume = getVolumeFor(date, dayIdx);
      const prs = getPRsFor(date, dayIdx);
      const existing = sessions.find(
        (s) => s.session_date === date && s.day_index === dayIdx
      );
      const payload = {
        user_id: userId,
        session_date: date,
        day_index: dayIdx,
        volume_lbs: volume,
        prs_set: prs,
        completed: existing?.completed || false,
      };
      const { error } = await supabase
        .from('workout_sessions')
        .upsert(payload, { onConflict: 'user_id,session_date,day_index' });
      if (error) throw error;
      // Reload sessions list to reflect new totals
      const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false });
      if (data) setSessions(data);
    },
    [userId, getVolumeFor, getPRsFor, sessions]
  );

  /** Log a single field (weight | reps) on a set. Only writes that column so
   *  it can't clobber a concurrent status update from the cycle button. */
  const logSetField = useCallback(
    async (dayIdx, exIdx, setIdx, field, value) => {
      if (!userId) return;
      const date = workoutDateKey(dayIdx);

      // Partial payload: PK + the one field we're touching. Supabase upserts
      // only the columns present, so the other column's latest value is
      // preserved on conflict (no blur/click race).
      const row = {
        user_id: userId,
        session_date: date,
        day_index: dayIdx,
        exercise_index: exIdx,
        set_index: setIdx,
      };
      if (field === 'weight') row.weight_lbs = value === '' ? null : parseFloat(value);
      if (field === 'reps') row.reps = value === '' ? null : parseInt(value, 10);

      // optimistic — merge over any existing local row so we don't drop
      // previously-entered fields.
      setSets((prev) => {
        const i = prev.findIndex(
          (r) =>
            r.session_date === date &&
            r.day_index === dayIdx &&
            r.exercise_index === exIdx &&
            r.set_index === setIdx
        );
        const existing = i >= 0 ? prev[i] : {};
        const merged = { ...existing, ...row };
        if (i >= 0) {
          const next = prev.slice();
          next[i] = merged;
          return next;
        }
        return [...prev, merged];
      });

      const { error } = await supabase
        .from('workout_sets')
        .upsert(row, { onConflict: 'user_id,session_date,day_index,exercise_index,set_index' });
      if (error) throw error;

      await upsertSessionSummary(date, dayIdx);
    },
    [userId, setsMap, upsertSessionSummary]
  );

  /** Cycle a set's status: '' → 'done' → 'failed' → ''. Returns the new status.
   *  Only writes `status` so it can't clobber a concurrent weight/reps update. */
  const cycleSetStatus = useCallback(
    async (dayIdx, exIdx, setIdx) => {
      if (!userId) return '';
      const date = workoutDateKey(dayIdx);
      const key = `${date}::${dayIdx}::${exIdx}::${setIdx}`;
      const prev = setsMap[key] || {};
      const current = prev.status || '';
      const next = current === '' ? 'done' : current === 'done' ? 'failed' : '';

      // Partial upsert — PK + status only.
      const row = {
        user_id: userId,
        session_date: date,
        day_index: dayIdx,
        exercise_index: exIdx,
        set_index: setIdx,
        status: next,
      };

      setSets((p) => {
        const i = p.findIndex(
          (r) =>
            r.session_date === date &&
            r.day_index === dayIdx &&
            r.exercise_index === exIdx &&
            r.set_index === setIdx
        );
        const existing = i >= 0 ? p[i] : {};
        const merged = { ...existing, ...row };
        if (i >= 0) {
          const arr = p.slice();
          arr[i] = merged;
          return arr;
        }
        return [...p, merged];
      });

      const { error } = await supabase
        .from('workout_sets')
        .upsert(row, { onConflict: 'user_id,session_date,day_index,exercise_index,set_index' });
      if (error) throw error;
      return next;
    },
    [userId, setsMap]
  );

  const toggleMobility = useCallback(
    async (dayIdx, mobIdx) => {
      if (!userId) return false;
      const date = workoutDateKey(dayIdx);
      const key = `${date}::${dayIdx}::${mobIdx}`;
      const next = !mobilityMap[key];

      setMobility((prev) => {
        const arr = prev.filter(
          (r) => !(r.session_date === date && r.day_index === dayIdx && r.mobility_index === mobIdx)
        );
        arr.push({
          user_id: userId,
          session_date: date,
          day_index: dayIdx,
          mobility_index: mobIdx,
          completed: next,
        });
        return arr;
      });

      const { error } = await supabase.from('workout_mobility').upsert(
        {
          user_id: userId,
          session_date: date,
          day_index: dayIdx,
          mobility_index: mobIdx,
          completed: next,
        },
        { onConflict: 'user_id,session_date,day_index,mobility_index' }
      );
      if (error) throw error;
      return next;
    },
    [userId, mobilityMap]
  );

  const completeWorkout = useCallback(
    async (dayIdx, rpe = null) => {
      if (!userId) return;
      const date = workoutDateKey(dayIdx);
      const volume = getVolumeFor(date, dayIdx);
      const prs = getPRsFor(date, dayIdx);
      // RPE is optional — null means "user skipped the prompt" and the
      // engine will fall back to "all sets done = bump" without a
      // recovery signal. Clamp to 1–10 if provided.
      const cleanRpe =
        rpe == null
          ? null
          : Math.min(10, Math.max(1, parseInt(rpe, 10))) || null;
      const payload = {
        user_id: userId,
        session_date: date,
        day_index: dayIdx,
        completed: true,
        volume_lbs: volume,
        prs_set: prs,
      };
      if (cleanRpe != null) payload.rpe = cleanRpe;
      const { error } = await supabase
        .from('workout_sessions')
        .upsert(payload, { onConflict: 'user_id,session_date,day_index' });
      if (error) throw error;
      await loadAll();
    },
    [userId, getVolumeFor, getPRsFor, loadAll]
  );

  return {
    ready,
    sessions,
    sets,
    mobility,
    setsMap,
    mobilityMap,
    completedMap,
    getPrevBest,
    getSuggestion,
    classifyExercise,
    logSetField,
    cycleSetStatus,
    toggleMobility,
    completeWorkout,
    reload: loadAll,
  };
}
