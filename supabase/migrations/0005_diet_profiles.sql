-- Diet onboarding profile + AI-generated meal plans

CREATE TABLE user_diet_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  -- Goals & medical
  primary_goal text,
  secondary_goal text,
  conditions text[],
  colonoscopy_planned text,
  family_history text[],
  food_medications text,
  -- Food preferences
  dietary_framework text,
  allergies text[],
  intolerances text[],
  food_dislikes text,
  food_preferences text,
  red_meat_frequency text,
  alcohol_frequency text,
  -- Gut health
  gut_symptoms text[],
  symptom_frequency text,
  trigger_foods text,
  current_gut_supplements text[],
  antibiotic_history text,
  bowel_regularity text,
  -- Cooking
  cooking_skill text,
  weekday_cook_time text,
  weekend_cook_time text,
  meal_preps text,
  weekly_budget text,
  eats_out text,
  eats_out_restaurant_types text[],
  kitchen_equipment text[],
  -- Eating patterns
  meals_per_day integer,
  intermittent_fasting text,
  biggest_meal text,
  late_night_eating text,
  breakfast_eater text,
  daily_hydration text,
  caffeine_consumption text,
  -- Preferences
  meal_variety text,
  cuisine_preferences text[],
  spice_tolerance text,
  snacker text,
  meal_prep_style text,
  -- Supplements
  current_supplements text,
  protein_powder text,
  supplement_willingness text,
  supplement_budget text,
  -- Meta
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_diet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their diet profile"
  ON user_diet_profiles FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER user_diet_profiles_updated_at
  BEFORE UPDATE ON user_diet_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- AI-generated meal plans

CREATE TABLE user_meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_data jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  week_start_date date,
  is_active boolean DEFAULT true,
  generation_prompt_version text DEFAULT 'v1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their meal plans"
  ON user_meal_plans FOR ALL USING (auth.uid() = user_id);

-- Index for fast active plan lookup
CREATE INDEX user_meal_plans_active_idx
  ON user_meal_plans (user_id, is_active)
  WHERE is_active = true;
