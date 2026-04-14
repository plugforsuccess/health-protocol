-- Health Protocol Tracker — initial schema
-- Run this in the Supabase SQL editor (Project → SQL → New query).

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

create table if not exists public.daily_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tab text not null check (tab in ('nt', 'gut')),
  item_id text not null,
  checked boolean default false not null,
  check_date date not null default current_date,
  created_at timestamptz default now() not null,
  unique (user_id, tab, item_id, check_date)
);

create index if not exists daily_checks_user_date_idx
  on public.daily_checks (user_id, tab, check_date);

create table if not exists public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tab text not null check (tab in ('nt', 'gut')),
  streak_count integer default 0 not null,
  last_completed_date date,
  updated_at timestamptz default now() not null,
  unique (user_id, tab)
);

create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  log_date date not null default current_date,
  energy_rating integer check (energy_rating between 1 and 5),
  mood_rating integer check (mood_rating between 1 and 5),
  gut_rating integer check (gut_rating between 1 and 5),
  notes text,
  created_at timestamptz default now() not null,
  unique (user_id, log_date)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.daily_checks enable row level security;
alter table public.streaks enable row level security;
alter table public.daily_logs enable row level security;

drop policy if exists "Users own their checks" on public.daily_checks;
create policy "Users own their checks" on public.daily_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their streaks" on public.streaks;
create policy "Users own their streaks" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their logs" on public.daily_logs;
create policy "Users own their logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
