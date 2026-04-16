import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, localDateKey } from '../lib/supabase.js';
import { WORKOUT_WEEK } from '../data/workoutWeek.js';
import { classifyExercise, suggestProgression } from '../lib/workoutIntelligence.js';
import { normalizeExerciseName } from '../lib/workoutPlanGenerator.js';

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** ISO date for the given day-index relative to this week's occurrence.
 *  Accepts an optional weekPlan to read day abbreviations from; falls
 *  back to the hardcoded WORKOUT_WEEK. */
export function workoutDateKey(dayIdx, now = new Date(), weekPlan) {
  const plan = weekPlan || WORKOUT_WEEK;
  const today = now.getDay();
  const target = DAY_MAP.indexOf(plan[dayIdx]?.day);
  if (target < 0) return localDateKey(now);
  const diff = target - today;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return localDateKey(d);
}

export function getTodayWorkoutIdx() {
  const name = DAY_MAP[new Date().getDay()];
  // Works for both hardcoded and AI plans — always 7 days Sun–Sat
  return DAY_MAP.indexOf(name);
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
 *
 * `weekPlan` is the active plan (from useWorkoutPlan). It's used to look up
 * exercise objects for progression suggestions.
 */
export function useWorkoutLogs(userId, weekPlan) {
  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [mobility, setMobility] = useState([]);
  const [ready, setReady] = useState(false);

  // Resolve the plan — callers may pass undefined during initial render
  const plan = weekPlan || WORKOUT_WEEK;

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
   * Return the full row list from the most recent session for this exercise
   * strictly BEFORE `excludeDate`. Uses name-based matching with
   * normalization so progression survives plan regeneration.
   *
   * Fallback logic is EXPLICIT:
   *   - If the row HAS exercise_name → match by normalized name only.
   *     If names don't match, skip. Never fall through to index.
   *   - If the row has NO exercise_name (legacy) → match by index only.
   *   - If we can't resolve a target name (no exercise at position) →
   *     fall back to pure index matching for all rows.
   */
  const getLastSessionRows = useCallback(
    (dayIdx, exIdx, excludeDate) => {
      const ex = plan[dayIdx]?.exercises?.[exIdx];
      const targetName = ex ? normalizeExerciseName(ex.name) : null;

      const byDate = {};
      sets.forEach((row) => {
        if (excludeDate && row.session_date >= excludeDate) return;

        if (targetName) {
          if (row.exercise_name) {
            // Row has a name → match by name exclusively. If the name
            // doesn't match, this row belongs to a different exercise
            // even if the indices happen to overlap from a prior plan.
            if (normalizeExerciseName(row.exercise_name) !== targetName) return;
          } else {
            // Legacy row without exercise_name → fall back to index
            if (row.day_index !== dayIdx) return;
            if (row.exercise_index !== exIdx) return;
          }
        } else {
          // No target name (can't resolve exercise) → pure index match
          if (row.day_index !== dayIdx) return;
          if (row.exercise_index !== exIdx) return;
        }

        if (!byDate[row.session_date]) byDate[row.session_date] = [];
        byDate[row.session_date].push(row);
      });
      const dates = Object.keys(byDate).sort().reverse();
      if (!dates.length) return { date: null, rows: [] };
      return { date: dates[0], rows: byDate[dates[0]] };
    },
    [sets, plan]
  );

  /**
   * Dynamic recommendation for the next session of a specific exercise.
   * Reads the exercise from the active plan (not hardcoded data).
   */
  const getSuggestion = useCallback(
    (dayIdx, exIdx, excludeDate) => {
      const ex = plan[dayIdx]?.exercises?.[exIdx];
      if (!ex) return null;
      const { rows } = getLastSessionRows(dayIdx, exIdx, excludeDate);
      return suggestProgression({
        ex,
        priorRows: rows,
        priorCountTarget: ex.sets,
      });
    },
    [getLastSessionRows, plan]
  );

  /** Calculate best weight for an exercise across all past dates except `excludeDate`.
   *  Same explicit name/index branching as getLastSessionRows. */
  const getPrevBest = useCallback(
    (dayIdx, exIdx, excludeDate) => {
      const ex = plan[dayIdx]?.exercises?.[exIdx];
      const targetName = ex ? normalizeExerciseName(ex.name) : null;

      let best = 0;
      sets.forEach((row) => {
        if (excludeDate && row.session_date === excludeDate) return;

        if (targetName) {
          if (row.exercise_name) {
            if (normalizeExerciseName(row.exercise_name) !== targetName) return;
          } else {
            if (row.day_index !== dayIdx) return;
            if (row.exercise_index !== exIdx) return;
          }
        } else {
          if (row.day_index !== dayIdx) return;
          if (row.exercise_index !== exIdx) return;
        }

        const w = parseFloat(row.weight_lbs) || 0;
        if (w > best) best = w;
      });
      return best > 0 ? best : null;
    },
    [sets, plan]
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

  /** Log a single field (weight | reps) on a set. Writes exercise_name
   *  alongside the index columns so future name-based lookups work. */
  const logSetField = useCallback(
    async (dayIdx, exIdx, setIdx, field, value) => {
      if (!userId) return;
      const date = workoutDateKey(dayIdx, undefined, plan);
      const ex = plan[dayIdx]?.exercises?.[exIdx];

      // exercise_name written on every new row for name-based progression.
      // Index columns preserved for backwards compat (see migration 0006).
      const row = {
        user_id: userId,
        session_date: date,
        day_index: dayIdx,
        exercise_index: exIdx,
        set_index: setIdx,
        exercise_name: ex?.name || null,
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
    [userId, plan, upsertSessionSummary]
  );

  /** Cycle a set's status: '' → 'done' → 'failed' → ''. Returns the new status.
   *  Writes exercise_name alongside index columns. */
  const cycleSetStatus = useCallback(
    async (dayIdx, exIdx, setIdx) => {
      if (!userId) return '';
      const date = workoutDateKey(dayIdx, undefined, plan);
      const key = `${date}::${dayIdx}::${exIdx}::${setIdx}`;
      const prev = setsMap[key] || {};
      const current = prev.status || '';
      const next = current === '' ? 'done' : current === 'done' ? 'failed' : '';

      const ex = plan[dayIdx]?.exercises?.[exIdx];

      // Partial upsert — PK + status + exercise_name.
      const row = {
        user_id: userId,
        session_date: date,
        day_index: dayIdx,
        exercise_index: exIdx,
        set_index: setIdx,
        status: next,
        exercise_name: ex?.name || null,
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
    [userId, plan, setsMap]
  );

  const toggleMobility = useCallback(
    async (dayIdx, mobIdx) => {
      if (!userId) return false;
      const date = workoutDateKey(dayIdx, undefined, plan);
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
    [userId, plan, mobilityMap]
  );

  const completeWorkout = useCallback(
    async (dayIdx) => {
      if (!userId) return;
      const date = workoutDateKey(dayIdx, undefined, plan);
      const volume = getVolumeFor(date, dayIdx);
      const prs = getPRsFor(date, dayIdx);
      const { error } = await supabase.from('workout_sessions').upsert(
        {
          user_id: userId,
          session_date: date,
          day_index: dayIdx,
          completed: true,
          volume_lbs: volume,
          prs_set: prs,
        },
        { onConflict: 'user_id,session_date,day_index' }
      );
      if (error) throw error;
      await loadAll();
    },
    [userId, plan, getVolumeFor, getPRsFor, loadAll]
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
