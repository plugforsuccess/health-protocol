-- Add last_name column for future billing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name text;
