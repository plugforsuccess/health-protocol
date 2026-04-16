# Stakeholder Brief — Train Tab: Dynamic Workout Intelligence

**Branch:** `claude/dynamic-workout-intelligence-lksto`
**Commits:** `d0b2b7d`, `d801759`

---

## Executive Summary

The Train tab has been transformed from a static, hardcoded workout viewer into a **dynamic, adaptive coaching surface**. Five user-facing problems were identified and resolved across two pull-requests-worth of work:

| # | Problem (before) | Solution (after) |
|---|---|---|
| 1 | Warm-ups were passive text; users had no timing guidance | Every warm-up tap fires a 10-second "get ready" countdown, then auto-runs a work timer for timed warm-ups (e.g. 5-min jump rope). Multi-round warm-ups (e.g. "Lateral Bound × 3") chain through every round. |
| 2 | Treadmill Intervals and other cardio/bodyweight moves displayed nonsensical `lbs` and `reps` inputs | Each exercise is automatically classified (`weighted` / `bodyweight` / `duration`) and the input grid adapts. Treadmill Intervals now show a `SEC` field; Farmer Carry shows `YARDS`. |
| 3 | Weights & reps were hardcoded with no week-on-week progression | A new progression engine reads each user's prior session and suggests the next target — **+5 lb** when all sets cleared, **hold** when a set failed, **+2 reps** for bodyweight, **+15 s / +1 round** for cardio. Each suggestion ships with a human-readable reason ("All sets cleared at 35 lb — bump +5 lb"). |
| 4 | Bodyweight exercises blocked users from loading them with weight | The weight column is now an open input on bodyweight moves, defaulting to "BW" but accepting any load (e.g. dumbbell Bulgarian split squats). |
| 5 | All sets were unlocked at once, leading to disordered logging | Sets unlock **sequentially** — only the next-up set is interactive; later sets are dimmed and locked with a 🔒 icon until the prior set is marked done or failed. |

---

## Business & UX Impact

- **Adherence**: Sequential unlocking and prefilled targets remove decision friction during a workout — the user always sees exactly one next action.
- **Progressive overload**: The dynamic engine guarantees users are pushed harder when they complete sets and held back when they don't, which is the single highest-leverage variable for strength training results.
- **Intellectual honesty**: Showing the *reason* for every suggestion ("Only 2 / 6 sets last session — repeat before progressing") builds user trust in the app's recommendations.
- **Conditioning equity**: A user "out of shape on Wednesday's intervals" who only completes 2 of 6 rounds is no longer told to push harder next week — the engine sees the partial completion and suggests holding the same target.
- **Defensible**: Logic is fully deterministic and auditable. No LLM in the hot path (no latency, no cost, works offline). An async LLM variant can be layered on `suggestProgression()` later without UI changes.

---

## Technical Changes

### Files added

```
src/lib/workoutIntelligence.js          (+302 lines)
src/components/workout/WarmupItem.jsx   ( +63 lines)
```

### Files modified

```
src/hooks/useRestTimer.js                   (chained-phase callback support)
src/hooks/useWorkoutLogs.js                 (getSuggestion + getLastSessionRows)
src/components/panels/WorkoutPanel.jsx      (multi-round warm-up chain)
src/components/workout/WorkoutDayModal.jsx  (warm-up state machine, kind plumbing)
src/components/workout/SetLogger.jsx        (kind-aware inputs, prefill, sequential locks)
src/components/workout/ExerciseCard.jsx     (suggestion banner + badges)
src/components/shared/RestTimer.jsx         (custom phase labels)
src/styles/addendum.css                     (new badges, locked rows, warmup pulse)
```

### New core module: `src/lib/workoutIntelligence.js`

Two pure functions, no side effects, fully testable:

**`classifyExercise(ex)`** — sorts an exercise into `{ kind, unit, target }`.
Possible `kind` values:
- `weighted` — classic weight × reps (default)
- `bodyweight` — reps only, optional load
- `duration` — seconds or yards, no weight

Triggers:
- `rec_weight` contains "Bodyweight" → `bodyweight`
- `reps` contains "min", "sec", "yards", "round" → `duration`

**`suggestProgression({ ex, priorRows, priorCountTarget })`** — returns:

```js
{
  kind: 'weighted' | 'bodyweight' | 'duration',
  display: '40lb',                          // headline shown in card
  reason: 'All sets cleared at 35lb — bump +5lb.',
  dynamic: true,                            // false → fallback to hardcoded
  delta: 5,                                 // for the ↑ progress badge
  prefillWeight: 40,                        // input default
  prefillReps: 10,                          // input default
}
```

**Rules table:**

| Last session | Weighted | Bodyweight | Duration |
|---|---|---|---|
| All sets done, no fails | **+5 lb** (+2.5 lb for rehab/iso) | **+2 reps** | **+15 s** / **+1 round** |
| Any failed set | Hold weight | Repeat clean | Repeat same effort |
| Partial / skipped | Hold weight | Hold target | Hold target |
| No prior data | Use hardcoded `rec_weight` | Hit programmed reps | Use programmed effort |

---

### Warm-up timer chain (`WorkoutPanel.jsx`)

```js
// For each programmed round (item.sets):
//   Phase A → 10s prep ("Get ready — Round N/M — <name>")
//   Phase B → optional work timer if duration is parsed from detail
// After last round → mark warm-up complete
```

Reuses the existing rest-timer infrastructure — wake lock, audio beep, fallback Web Push for backgrounded tabs.

| Warm-up | Plays |
|---|---|
| `Lateral Bound · 5 each side · sets: 3` | 10 s prep × 3 |
| `High Knees · 30 sec × 3 · sets: 3` | (10 s prep + 30 s work) × 3 |
| `Jump Rope · 5 min · sets: 1` | 10 s prep + 5:00 work |

---

### Kind-aware `SetLogger`

Three quality-of-life rules in one component:

1. **Inputs reflect the type** — bodyweight gets an open input with `BW` placeholder; duration replaces weight with a non-interactive `—` cell and reps with a `SEC` / `YARDS` field.
2. **Prefilled defaults** — suggested weight & reps populate the active row's inputs; the user can override by typing or just blur to keep the suggestion.
3. **Sequential unlocking** — `activeIdx` is computed as the first un-marked set; all later rows are `disabled`, dimmed, and show `🔒` until the prior set is marked done or failed.

---

### `useRestTimer` extension

```js
// New start() options:
//   onComplete  — fired exactly once at 0s (used to chain warm-up phases)
//   autoHideMs  — how long the card lingers post-completion
//   label       — short tag above title ("Warm-up · Prep 1/3")
```

Allows arbitrary multi-phase timer chains without forking a second timer hook.

---

## Risk & Backwards Compatibility

- **No DB schema changes.** All progression logic runs client-side off existing `workout_sets` rows.
- **First-week users unaffected.** When prior-session data is absent, the engine falls back to the hardcoded `rec_weight` string, so the programme works on day one exactly as before.
- **Build verified.** `vite build` clean, no warnings or errors. CSS bundle: 41.76 kB → 41.76 kB (negligible delta). JS bundle: +2.2 kB gzipped.
- **No new dependencies.**
- **Fully deterministic.** No external API calls; no rate-limit risk; no cost per workout.

---

## Future Roadmap (not in this branch)

- Optional LLM-backed `suggestProgressionAsync()` for nuanced coaching language.
- Persist warm-up completion to Supabase so it survives modal close/reopen.
- Track adherence to dynamic suggestions to feed a follow-up "your progression is +12% faster than baseline" stat card.
- A/B framework to validate the +5 lb / +2.5 lb increments against actual user PR rates.

---

**Branch ready to merge:** `claude/dynamic-workout-intelligence-lksto`
**Reviewers needed:** product + design sign-off on copy of suggestion reasons; engineering review of the chained-timer state machine.
