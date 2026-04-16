-- Health Protocol Tracker — RPE (Rate of Perceived Exertion) on workout sessions.
-- Run AFTER 0003_push.sql in the Supabase SQL editor.
--
-- Why this column exists:
--   The dynamic progression engine (src/lib/workoutIntelligence.js) decides
--   whether to bump a user's weight next session based on whether they
--   completed all sets last session. That signal is necessary but not
--   sufficient: a user can complete every set at target and still be
--   running on fumes (poor sleep, life stress, accumulated fatigue).
--   Adding a 1-10 RPE captured at session completion gives the engine a
--   subjective recovery signal — "all done at RPE 9" should HOLD, not
--   BUMP, because the user has no headroom for a heavier load.
--
-- Range: 1 = trivial, 5 = moderate, 10 = max effort. Nullable so existing
-- rows and skipped prompts don't break anything.

alter table public.workout_sessions
  add column if not exists rpe smallint check (rpe is null or (rpe >= 1 and rpe <= 10));
