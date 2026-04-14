-- Health Protocol Tracker — workout + pantry schema (addendum)
-- Run AFTER 0001_init.sql in the Supabase SQL editor.

-- ─────────────────────────────────────────
-- WORKOUT TABLES
-- ─────────────────────────────────────────

create table if not exists public.workout_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_date date not null,
  day_index integer not null,
  exercise_index integer not null,
  set_index integer not null,
  weight_lbs numeric,
  reps integer,
  status text check (status in ('done', 'failed', '')),
  created_at timestamptz default now() not null,
  unique (user_id, session_date, day_index, exercise_index, set_index)
);

create index if not exists workout_sets_user_date_idx
  on public.workout_sets (user_id, session_date, day_index);

create table if not exists public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_date date not null,
  day_index integer not null,
  completed boolean default false not null,
  volume_lbs numeric default 0 not null,
  prs_set integer default 0 not null,
  created_at timestamptz default now() not null,
  unique (user_id, session_date, day_index)
);

create index if not exists workout_sessions_user_idx
  on public.workout_sessions (user_id, session_date);

create table if not exists public.workout_mobility (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_date date not null,
  day_index integer not null,
  mobility_index integer not null,
  completed boolean default false not null,
  created_at timestamptz default now() not null,
  unique (user_id, session_date, day_index, mobility_index)
);

-- ─────────────────────────────────────────
-- PANTRY
-- ─────────────────────────────────────────

create table if not exists public.pantry_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  item_key text not null,
  have_it boolean default true not null,
  updated_at timestamptz default now() not null,
  unique (user_id, item_key)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.workout_sets enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_mobility enable row level security;
alter table public.pantry_items enable row level security;

drop policy if exists "Users own their sets" on public.workout_sets;
create policy "Users own their sets" on public.workout_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their sessions" on public.workout_sessions;
create policy "Users own their sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their mobility" on public.workout_mobility;
create policy "Users own their mobility" on public.workout_mobility
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their pantry" on public.pantry_items;
create policy "Users own their pantry" on public.pantry_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
