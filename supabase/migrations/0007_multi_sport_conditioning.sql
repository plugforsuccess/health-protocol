-- Rename primary_sport from text to text[] to support multi-sport athletes,
-- and add 'Conditioning & Endurance' as a primary goal option.
--
-- The goal addition is data-only (no schema change needed — goals are
-- stored as free text). The sport change requires an ALTER.

-- Convert primary_sport from text to text[]
ALTER TABLE user_profiles
  ALTER COLUMN primary_sport TYPE text[]
  USING CASE
    WHEN primary_sport IS NOT NULL THEN ARRAY[primary_sport]
    ELSE NULL
  END;
