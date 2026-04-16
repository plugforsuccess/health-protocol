// Dynamic workout intelligence.
//
// Two pieces live here:
//
//   1. classifyExercise(ex)
//        Decides whether a row in workoutWeek.js is:
//          • 'weighted'   — classic weight × reps (dumbbells, barbell, cable)
//          • 'bodyweight' — bodyweight for reps (box jump, dead bug, plank)
//          • 'duration'   — timed work (treadmill intervals, battle ropes,
//                           agility ladder, farmer carry)
//
//      This decides WHICH inputs SetLogger should render. Weighted shows
//      weight + reps. Bodyweight hides weight and keeps reps. Duration
//      replaces both with a seconds/distance field and a single work timer
//      per set. We DON'T want a lbs box on "Treadmill Intervals" because
//      weight is meaningless there.
//
//   2. suggestProgression({ ex, kind, last })
//        Given the previous session's rows for this exercise, suggests
//        what the user should do THIS session. The rule is the one the
//        user described:
//
//          • every set completed, no failures → bump up
//          • any failure                      → hold
//          • partial / skipped                → hold
//          • no prior data                    → fall back to the
//                                                hardcoded rec_weight
//
//      For weighted lifts the bump is a weight bump (+5lb compound,
//      +2.5lb for rehab / isolation). For bodyweight it's a +2 rep
//      bump on the target reps. For duration work it's a +15s / +1 round
//      bump on the timed target. Every suggestion comes with a human
//      reason string so the user can see WHY the app picked that number.
//
// Deliberately NOT a cloud "AI judgment" service — this is a deterministic
// rule that the user can trust. An actual LLM integration can be layered
// on later by swapping suggestProgression() for an async version.

const SMALL_MUSCLE_KEYWORDS = [
  'wrist', 'eccentric', 'curl', 'lateral raise', 'face pull', 'tricep',
  'pallof', 'band', 'dead bug', 'plank', 'calf',
];

const DURATION_REP_KEYWORDS = [
  'min on', 'min off', 'sec', 'minute', ' min', 'yards', 'yard',
  'meters', 'metres', 'rounds', 'round',
];

const BODYWEIGHT_RX = /bodyweight/i;

/**
 * Inspect an exercise row and decide which input model applies.
 * Returns: { kind, unit, target }
 *   kind  — 'weighted' | 'bodyweight' | 'duration'
 *   unit  — 'reps' | 'sec' | 'yards' (for display next to the count field)
 *   target — numeric parsed target when available (for rep-based progression)
 */
export function classifyExercise(ex) {
  if (!ex) return { kind: 'weighted', unit: 'reps', target: null };

  const reps = String(ex.reps || '').toLowerCase();
  const recWeight = String(ex.rec_weight || '').toLowerCase();

  // Duration / distance work. Reps field is the tell: "1 min ON / 1 min OFF",
  // "30 sec", "40 yards", etc.
  const isDuration =
    DURATION_REP_KEYWORDS.some((k) => reps.includes(k)) &&
    !reps.includes('each side') && // "10 each side slow" is still rep-based
    !/^\d+\s*each/.test(reps);
  if (isDuration) {
    let unit = 'sec';
    if (reps.includes('yard')) unit = 'yards';
    if (reps.includes('min') && !reps.includes('sec')) unit = 'sec'; // minutes collapse to seconds internally
    const secMatch = reps.match(/(\d+)\s*sec/);
    const minMatch = reps.match(/(\d+)\s*min/);
    const ydMatch = reps.match(/(\d+)\s*yard/);
    let target = null;
    if (unit === 'yards' && ydMatch) target = parseInt(ydMatch[1], 10);
    else if (secMatch) target = parseInt(secMatch[1], 10);
    else if (minMatch) target = parseInt(minMatch[1], 10) * 60;
    return { kind: 'duration', unit, target };
  }

  // Bodyweight-only movements. Either the suggested weight explicitly says
  // "Bodyweight" or the exercise is one of the classic BW patterns.
  if (BODYWEIGHT_RX.test(recWeight)) {
    const repMatch = reps.match(/(\d+)/);
    return {
      kind: 'bodyweight',
      unit: 'reps',
      target: repMatch ? parseInt(repMatch[1], 10) : null,
    };
  }

  // Default: weighted.
  const repMatch = reps.match(/(\d+)/);
  return {
    kind: 'weighted',
    unit: 'reps',
    target: repMatch ? parseInt(repMatch[1], 10) : null,
  };
}

/** Pick the weight increment for a weighted lift. Rehab & iso moves jump
 *  in small steps; compound / lower body lifts jump in 5lb steps.
 *
 *  Both defaults can be overridden by the caller via the `prefs` arg —
 *  some users want +2.5lb across the board (smaller plates, older
 *  athletes, injury recovery). The user-facing settings UI lives in
 *  src/hooks/useProgressionPrefs.js.
 */
function weightStep(exerciseName, prefs) {
  const compound = Number.isFinite(prefs?.compoundIncrement) ? prefs.compoundIncrement : 5;
  const isolation = Number.isFinite(prefs?.isolationIncrement) ? prefs.isolationIncrement : 2.5;
  const n = (exerciseName || '').toLowerCase();
  return SMALL_MUSCLE_KEYWORDS.some((k) => n.includes(k)) ? isolation : compound;
}

/** Best-effort pull of a starter weight from the hardcoded rec_weight string.
 *  Examples handled:
 *    "30lb dumbbell (week 1-2)"   → 30
 *    "25lb each hand (week 1)"    → 25
 *    "65-75lb barbell (week 1)"   → 65 (lower bound — start light)
 *    "10-12lb"                    → 10
 *    "Bodyweight only — weeks…"   → null
 *    "Speed 6.5-7.5 mph (160lb athlete)" → null (the 160lb is the athlete
 *                                                weight, not the load)
 */
function parseStarterWeight(recWeight) {
  if (!recWeight) return null;
  const s = String(recWeight);
  if (/bodyweight/i.test(s)) return null;
  // Skip cardio strings that mention mph / speed.
  if (/\bmph\b|\bspeed\b/i.test(s)) return null;
  // First "<num>lb" occurrence; for ranges like "65-75lb" the FIRST number
  // is the lower bound which is what we want for week-1 start.
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:-\s*\d+(?:\.\d+)?\s*)?lb/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Best-effort pull of a starter rep target from the reps string.
 *  Examples:
 *    "10"            → 10
 *    "10 each side"  → 10
 *    "8 each leg"    → 8
 *    "30 sec"        → null (duration kind handles its own prefill)
 */
function parseStarterReps(reps) {
  if (!reps) return null;
  const s = String(reps);
  if (/sec|min|yard/i.test(s)) return null;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Best-effort pull of a starter "load" value for the duration column —
 *  seconds or yards. */
function parseStarterDuration(reps) {
  if (!reps) return null;
  const s = String(reps);
  const ydMatch = s.match(/(\d+)\s*yard/i);
  if (ydMatch) return parseInt(ydMatch[1], 10);
  const secMatch = s.match(/(\d+)\s*sec/i);
  if (secMatch) return parseInt(secMatch[1], 10);
  const minMatch = s.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  return null;
}

/**
 * Aggregate a prior session's rows for one exercise into a decision shape.
 *   rows      — array of workout_sets rows, all for the SAME date/ex.
 *   targetSetCount — how many sets the programme prescribes (so we know
 *                    whether the user skipped some).
 *   sessionRpe — the user's 1–10 RPE for that whole session, if logged.
 *                Used to gate progression: completing all sets at RPE 9
 *                means there's no headroom and we should HOLD, not BUMP.
 */
function summariseLast(rows, targetSetCount, sessionRpe) {
  if (!rows || rows.length === 0) return null;
  const statuses = rows.map((r) => r.status || '');
  const loggedCount = statuses.filter((s) => s === 'done' || s === 'failed').length;
  const doneCount = statuses.filter((s) => s === 'done').length;
  const failedCount = statuses.filter((s) => s === 'failed').length;
  const allDone =
    loggedCount >= (targetSetCount || rows.length) &&
    failedCount === 0 &&
    doneCount >= (targetSetCount || rows.length);
  const weights = rows
    .map((r) => parseFloat(r.weight_lbs))
    .filter((n) => Number.isFinite(n) && n > 0);
  const reps = rows
    .map((r) => parseInt(r.reps, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return {
    allDone,
    anyFailed: failedCount > 0,
    doneCount,
    failedCount,
    loggedCount,
    maxWeight: weights.length ? Math.max(...weights) : 0,
    minWeightUsed: weights.length ? Math.min(...weights) : 0,
    medianReps: reps.length ? reps.sort((a, b) => a - b)[Math.floor(reps.length / 2)] : 0,
    rpe: Number.isFinite(sessionRpe) ? sessionRpe : null,
  };
}

/** RPE bucket used to pick coach-voice copy. */
function rpeFlavor(rpe) {
  if (!Number.isFinite(rpe)) return null;
  if (rpe >= 9) return 'maxed';
  if (rpe >= 7) return 'tough';
  if (rpe >= 4) return 'solid';
  return 'easy';
}

/**
 * Produce the user-facing suggestion for the NEXT workout of this exercise.
 *
 * Returned shape:
 *   {
 *     kind,                 // 'weighted' | 'bodyweight' | 'duration'
 *     display,              // headline string rendered in the card
 *     reason,               // short explainer
 *     dynamic,              // true → this was computed from history.
 *                           //   false → fell back to hardcoded rec_weight.
 *     delta,                // +5, 0, -2.5, +1round, etc. for UI badge
 *   }
 */
export function suggestProgression({ ex, priorRows, priorCountTarget, priorRpe, prefs }) {
  const kind = classifyExercise(ex);
  const last = summariseLast(priorRows, priorCountTarget || ex?.sets, priorRpe);
  const flavor = rpeFlavor(priorRpe);

  const baseRepTarget = parseStarterReps(ex?.reps);
  const baseDuration = parseStarterDuration(ex?.reps);
  const baseWeight = parseStarterWeight(ex?.rec_weight);

  // Duration / cardio → never show "lbs". Progression is time or rounds.
  if (kind.kind === 'duration') {
    const base = kind.target ?? baseDuration;
    if (!last || last.loggedCount === 0) {
      return {
        kind: 'duration',
        display: ex.rec_weight || `${ex.reps}`,
        reason: 'First time on this one — settle into the programmed effort and learn the pace.',
        dynamic: false,
        delta: 0,
        prefillWeight: null,
        prefillReps: base ?? null,
      };
    }
    if (last.anyFailed) {
      return {
        kind: 'duration',
        display: ex.rec_weight || `${ex.reps}`,
        reason: `You came up short last session — repeat the same work and finish it clean this week.`,
        dynamic: true,
        delta: 0,
        prefillWeight: null,
        prefillReps: base ?? null,
      };
    }
    if (last.allDone) {
      // RPE gate: if last session crushed you, hold even though you finished.
      if (flavor === 'maxed') {
        return {
          kind: 'duration',
          display: ex.rec_weight || `${ex.reps}`,
          reason: `You finished last week but RPE ${priorRpe} means you were on the edge — hold the same target and bank a clean rep.`,
          dynamic: true,
          delta: 0,
          prefillWeight: null,
          prefillReps: base ?? null,
        };
      }
      // Bump: for interval work, suggest an extra round or +15s per round.
      const isInterval = /min on|round|interval/i.test(
        (ex.reps || '') + ' ' + (ex.name || '')
      );
      if (isInterval) {
        return {
          kind: 'duration',
          display: `+1 round or +0.3 mph`,
          reason: flavor === 'easy'
            ? `Felt easy at this pace — add a round or push the speed up.`
            : `Strong session last week — ready for an extra round or a touch more speed.`,
          dynamic: true,
          delta: 1,
          prefillWeight: null,
          prefillReps: base ?? null,
        };
      }
      const bump = 15;
      const next = base ? base + bump : null;
      return {
        kind: 'duration',
        display: base ? `${next}s` : `+${bump}s`,
        reason: flavor === 'easy'
          ? `Cruised through last week — let's add 15s and make it earn the work.`
          : `Strong work last week — ready for an extra 15 seconds.`,
        dynamic: true,
        delta: bump,
        prefillWeight: null,
        prefillReps: next,
      };
    }
    return {
      kind: 'duration',
      display: ex.rec_weight || `${ex.reps}`,
      reason: `Last session was a mixed bag — hold the target and lock it in this week before pushing.`,
      dynamic: true,
      delta: 0,
      prefillWeight: null,
      prefillReps: base ?? null,
    };
  }

  // Bodyweight → weight column starts as "BW" but is OPEN for a weighted
  // progression (loaded box jumps, dumbbell split squats, etc). If the
  // user logged a weight last session, prefill that weight as the
  // starting load this session.
  if (kind.kind === 'bodyweight') {
    const base = kind.target || baseRepTarget || 0;
    const lastWeight = last?.maxWeight && last.maxWeight > 0 ? last.maxWeight : null;
    if (!last || last.loggedCount === 0) {
      return {
        kind: 'bodyweight',
        display: `Bodyweight · ${ex.reps} reps`,
        reason: `First time on this — hit the programmed reps clean. If it feels easy, add a dumbbell next round.`,
        dynamic: false,
        delta: 0,
        prefillWeight: null,
        prefillReps: base || null,
      };
    }
    if (last.anyFailed) {
      return {
        kind: 'bodyweight',
        display: lastWeight ? `${lastWeight}lb · ${base} reps` : `Bodyweight · ${base} reps`,
        reason: `Form started slipping last session — same load, own every rep this week.`,
        dynamic: true,
        delta: 0,
        prefillWeight: lastWeight,
        prefillReps: base || null,
      };
    }
    if (last.allDone && base > 0) {
      if (flavor === 'maxed') {
        return {
          kind: 'bodyweight',
          display: lastWeight ? `${lastWeight}lb · ${base} reps` : `Bodyweight · ${base} reps`,
          reason: `You finished but RPE ${priorRpe} says you had nothing left — repeat the same target and bank the win.`,
          dynamic: true,
          delta: 0,
          prefillWeight: lastWeight,
          prefillReps: base,
        };
      }
      const next = base + 2;
      return {
        kind: 'bodyweight',
        display: lastWeight ? `${lastWeight}lb · ${next} reps` : `Bodyweight · ${next} reps`,
        reason: flavor === 'easy'
          ? `Coasted through ${base} reps — time to chase ${next}.`
          : `Owned all your sets at ${base} reps — ready for ${next}.`,
        dynamic: true,
        delta: 2,
        prefillWeight: lastWeight,
        prefillReps: next,
      };
    }
    return {
      kind: 'bodyweight',
      display: lastWeight ? `${lastWeight}lb · ${ex.reps} reps` : `Bodyweight · ${ex.reps} reps`,
      reason: `Stick with the programmed reps and lock them in.`,
      dynamic: true,
      delta: 0,
      prefillWeight: lastWeight,
      prefillReps: base || null,
    };
  }

  // Weighted default.
  if (!last || last.loggedCount === 0 || last.maxWeight === 0) {
    return {
      kind: 'weighted',
      display: ex.rec_weight || '',
      reason: `First time on this lift — start with the programmed load and dial in your form.`,
      dynamic: false,
      delta: 0,
      prefillWeight: baseWeight,
      prefillReps: baseRepTarget,
    };
  }
  const step = weightStep(ex?.name, prefs);
  if (last.anyFailed) {
    return {
      kind: 'weighted',
      display: `${last.maxWeight}lb`,
      reason: `${last.maxWeight}lb beat you on a rep last week — own the same weight clean before we add to it.`,
      dynamic: true,
      delta: 0,
      prefillWeight: last.maxWeight,
      prefillReps: baseRepTarget,
    };
  }
  if (last.allDone) {
    if (flavor === 'maxed') {
      return {
        kind: 'weighted',
        display: `${last.maxWeight}lb`,
        reason: `Strong session at ${last.maxWeight}lb but RPE ${priorRpe} says you were maxed out — same weight, build a cleaner rep this week.`,
        dynamic: true,
        delta: 0,
        prefillWeight: last.maxWeight,
        prefillReps: baseRepTarget,
      };
    }
    const next = last.maxWeight + step;
    return {
      kind: 'weighted',
      display: `${next}lb`,
      reason: flavor === 'easy'
        ? `${last.maxWeight}lb felt light — ready for ${next}lb.`
        : flavor === 'tough'
        ? `Strong session at ${last.maxWeight}lb — ready for ${next}lb.`
        : `Owned every set at ${last.maxWeight}lb — let's chase ${next}.`,
      dynamic: true,
      delta: step,
      prefillWeight: next,
      prefillReps: baseRepTarget,
    };
  }
  // Partial → stay at the weight you most recently used.
  return {
    kind: 'weighted',
    display: `${last.maxWeight}lb`,
    reason: `Only ${last.doneCount} of ${priorCountTarget || ex?.sets || '?'} sets landed last week — same weight, finish them all this time.`,
    dynamic: true,
    delta: 0,
    prefillWeight: last.maxWeight,
    prefillReps: baseRepTarget,
  };
}
