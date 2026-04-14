-- Health Protocol Tracker — Web Push schema (addendum)
-- Run AFTER 0001_init.sql and 0002_workout_pantry.sql.

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

-- One row per (user, device) push subscription.
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now() not null,
  unique (user_id, endpoint)
);

-- Queue of pushes to be delivered at `fire_at`.
create table if not exists public.scheduled_pushes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  fire_at timestamptz not null,
  title text not null,
  body text not null,
  tag text default 'rest-timer' not null,
  sent boolean default false not null,
  cancelled boolean default false not null,
  created_at timestamptz default now() not null
);

-- Partial index dramatically speeds up the sender's lookup:
--   "give me all rows where fire_at <= now() and sent=false and cancelled=false"
create index if not exists scheduled_pushes_due_idx
  on public.scheduled_pushes (fire_at)
  where sent = false and cancelled = false;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.push_subscriptions enable row level security;
alter table public.scheduled_pushes enable row level security;

drop policy if exists "Users own their push subscriptions" on public.push_subscriptions;
create policy "Users own their push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their scheduled pushes" on public.scheduled_pushes;
create policy "Users own their scheduled pushes" on public.scheduled_pushes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: the send-due-pushes Edge Function bypasses RLS via the service role
-- key, so it can read all users' pending pushes to deliver them.
