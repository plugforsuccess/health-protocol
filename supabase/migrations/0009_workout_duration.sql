-- Track workout duration for scheduling insights
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS duration_sec integer;
