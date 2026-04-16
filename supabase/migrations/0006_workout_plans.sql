-- AI-generated workout plans + exercise_name backfill on workout_sets
--
-- Mirrors user_meal_plans exactly. The workout tab reads from
-- user_workout_plans first, falling back to workoutWeek.js if no
-- active plan exists.

-- ─────────────────────────────────────────
-- AI WORKOUT PLANS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_workout_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_data jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  week_start_date date,
  is_active boolean DEFAULT true,
  generation_prompt_version text DEFAULT 'v1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their workout plans"
  ON user_workout_plans FOR ALL USING (auth.uid() = user_id);

CREATE INDEX user_workout_plans_active_idx
  ON user_workout_plans (user_id, is_active)
  WHERE is_active = true;

-- ─────────────────────────────────────────
-- ADD exercise_name TO workout_sets
-- ─────────────────────────────────────────
-- This column lets progression lookups survive plan regeneration.
-- The unique constraint stays on (user_id, session_date, day_index,
-- exercise_index, set_index) for backwards compat — exercise_index
-- remains the ordering tiebreaker within a session. New rows write
-- exercise_name going forward; the progression engine uses name-based
-- lookups exclusively.

ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS exercise_name text;

-- Backfill existing rows from the hardcoded workoutWeek.js mapping.
-- day_index 0..6 maps to Fri/Sat/Sun/Mon/Tue/Wed/Thu.
-- exercise_index maps to the position within each day's exercises[].
UPDATE workout_sets SET exercise_name = CASE
  -- Day 0 (Fri): Lower Body Strength
  WHEN day_index = 0 AND exercise_index = 0 THEN 'Goblet Squat'
  WHEN day_index = 0 AND exercise_index = 1 THEN 'Romanian Deadlift (Dumbbells)'
  WHEN day_index = 0 AND exercise_index = 2 THEN 'Bulgarian Split Squat'
  WHEN day_index = 0 AND exercise_index = 3 THEN 'Hip Thrust (Smith Machine or Barbell on Pad)'
  WHEN day_index = 0 AND exercise_index = 4 THEN 'Lateral Band Walk'
  WHEN day_index = 0 AND exercise_index = 5 THEN 'Calf Raise (Standing)'
  -- Day 1 (Sat): Upper Body + Elbow Rehab
  WHEN day_index = 1 AND exercise_index = 0 THEN 'Dumbbell Bench Press'
  WHEN day_index = 1 AND exercise_index = 1 THEN 'Dumbbell Row (Single Arm)'
  WHEN day_index = 1 AND exercise_index = 2 THEN 'Cable Face Pull'
  WHEN day_index = 1 AND exercise_index = 3 THEN 'Lateral Dumbbell Raise'
  WHEN day_index = 1 AND exercise_index = 4 THEN 'Eccentric Wrist Curl (Elbow Rehab)'
  WHEN day_index = 1 AND exercise_index = 5 THEN 'Reverse Wrist Curl'
  WHEN day_index = 1 AND exercise_index = 6 THEN 'Tricep Pushdown (Cable)'
  -- Day 4 (Tue): Rotational Power + Core
  WHEN day_index = 4 AND exercise_index = 0 THEN 'Cable Woodchop (High to Low)'
  WHEN day_index = 4 AND exercise_index = 1 THEN 'Pallof Press'
  WHEN day_index = 4 AND exercise_index = 2 THEN 'Med Ball Rotational Throw (against wall)'
  WHEN day_index = 4 AND exercise_index = 3 THEN 'Single Leg Romanian Deadlift'
  WHEN day_index = 4 AND exercise_index = 4 THEN 'Dead Bug'
  WHEN day_index = 4 AND exercise_index = 5 THEN 'Plank with Hip Tap'
  -- Day 5 (Wed): Athletic Conditioning
  WHEN day_index = 5 AND exercise_index = 0 THEN 'Treadmill Intervals'
  WHEN day_index = 5 AND exercise_index = 1 THEN 'Step-Up (Bench or Box)'
  WHEN day_index = 5 AND exercise_index = 2 THEN 'Agility Ladder Drill'
  WHEN day_index = 5 AND exercise_index = 3 THEN 'Battle Ropes'
  WHEN day_index = 5 AND exercise_index = 4 THEN 'Box Jump or Squat Jump'
  WHEN day_index = 5 AND exercise_index = 5 THEN 'Farmer Carry'
  ELSE exercise_name
END
WHERE exercise_name IS NULL;
