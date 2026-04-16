-- Health Protocol Tracker — onboarding profile, injuries, surgeries
-- Run AFTER 0003_push.sql in the Supabase SQL editor.
--
-- This migration adds the schema for the onboarding questionnaire described
-- in HEALTH_PROTOCOL_DEV_BRIEF_ADDENDUM.md. The data captured here is the
-- foundation for AI coaching context, exercise contraindication warnings,
-- and personalized program generation.
--
-- Three tables:
--   user_profiles  — one row per user. Identity, goals, medical, schedule,
--                    equipment. Acts as the primary "this user exists in
--                    the app" check via onboarding_completed.
--   user_injuries  — one row per injured body region. Driven by Step 3c.
--                    Marked active=false when the user marks an injury healed.
--   user_surgeries — one row per recent surgery (past 24 months).

-- ─────────────────────────────────────────
-- USER PROFILES
-- ─────────────────────────────────────────

create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  -- Identity
  first_name text,
  age integer check (age between 13 and 120),
  biological_sex text check (biological_sex in ('male', 'female', 'prefer_not_to_say')),
  dominant_hand text check (dominant_hand in ('right', 'left', 'ambidextrous')),
  height_cm numeric,
  weight_kg numeric,
  -- Goals
  primary_goal text,
  secondary_goal text,
  -- Training background
  training_experience text,
  former_athlete boolean default false,
  sport_background text[],
  activity_level text,
  training_history_notes text,
  -- Medical
  cardiovascular_conditions text[],
  medications_affecting_training text,
  -- Schedule
  days_per_week integer check (days_per_week between 1 and 7),
  preferred_days text[],
  session_duration_min integer,
  avg_sleep text,
  stress_level text,
  recovery_level text,
  travel_frequency text,
  travel_equipment_access text,
  -- Sport
  primary_sport text,
  competition_status text,
  performance_goals text[],
  -- Equipment
  equipment text[],
  training_location text,
  missing_equipment text,
  -- Movement history
  excluded_exercises text,
  injury_causing_exercises text,
  -- Onboarding completion
  onboarding_completed boolean default false not null,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists user_profiles_user_idx
  on public.user_profiles (user_id);

-- ─────────────────────────────────────────
-- USER INJURIES
-- ─────────────────────────────────────────

create table if not exists public.user_injuries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  body_region text not null,
  injury_type text check (injury_type in ('acute', 'chronic', 'post_surgery')),
  injury_duration text,
  injury_trajectory text check (injury_trajectory in ('improving', 'stable', 'worsening')),
  pain_at_rest integer check (pain_at_rest between 0 and 10),
  pain_during_exercise integer check (pain_during_exercise between 0 and 10),
  aggravating_movements text[],
  physician_cleared text check (physician_cleared in ('yes', 'no', 'in_progress')),
  in_physical_therapy boolean default false,
  active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists user_injuries_user_active_idx
  on public.user_injuries (user_id, active);

-- ─────────────────────────────────────────
-- USER SURGERIES
-- ─────────────────────────────────────────

create table if not exists public.user_surgeries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  body_region text not null,
  surgery_month integer check (surgery_month between 1 and 12),
  surgery_year integer,
  cleared_for_exercise text check (cleared_for_exercise in ('yes', 'no', 'partially')),
  created_at timestamptz default now() not null
);

create index if not exists user_surgeries_user_idx
  on public.user_surgeries (user_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.user_profiles enable row level security;
alter table public.user_injuries enable row level security;
alter table public.user_surgeries enable row level security;

drop policy if exists "Users own their profile" on public.user_profiles;
create policy "Users own their profile" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their injuries" on public.user_injuries;
create policy "Users own their injuries" on public.user_injuries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their surgeries" on public.user_surgeries;
create policy "Users own their surgeries" on public.user_surgeries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ─────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_injuries_set_updated_at on public.user_injuries;
create trigger user_injuries_set_updated_at
  before update on public.user_injuries
  for each row execute function public.set_updated_at();
