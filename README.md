# Daily Protocol Tracker

Personal React + Vite + Supabase app for tracking a daily Neurotransmitter /
Gut healing supplement protocol and a 7-day diet plan.

Migrated from the single-file vanilla JS prototype at
`legacy/nt-gut-protocol.html`.

## Stack

- **React 18** + **Vite 5**
- **Supabase** for auth (Google OAuth) and Postgres persistence
- CSS custom properties (original design system retained — dark theme only)

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

### 1. Create the Supabase project

1. Create a new project at <https://supabase.com/dashboard>.
2. In **Project Settings → API**, copy the **Project URL** and **anon /
   public** key into `.env.local`.

### 2. Run the database migrations

Open the **SQL editor** in the Supabase dashboard and run the migrations in
order:

1. `supabase/migrations/0001_init.sql` — creates `daily_checks`, `streaks`,
   `daily_logs` with per-user RLS policies.
2. `supabase/migrations/0002_workout_pantry.sql` — creates `workout_sets`,
   `workout_sessions`, `workout_mobility`, and `pantry_items` (also RLS-gated).
3. `supabase/migrations/0003_push.sql` — creates `push_subscriptions` and
   `scheduled_pushes` for Web Push. Skip only if you are disabling Web Push.

### 3. Enable anonymous sign-in (one toggle)

The primary "Start tracking" button uses Supabase anonymous auth so you
can use the app immediately with zero external config. To enable it:

1. Open **Supabase Dashboard → Authentication → Sign In / Providers**.
2. Scroll to **Anonymous Sign-Ins** and flip it on.
3. Save.

That's it. Every first-time visitor gets a real `auth.uid()` with a
generated user id; RLS works normally; data persists as long as the
browser keeps its auth token. If you ever want to keep the data when
switching devices, you can later add `linkIdentity()` to bind the
anonymous account to an email.

### 3b. (Optional) Enable Google OAuth

Only needed if you want the secondary "Use Google instead" button to work.
Skip entirely unless you need cross-device sync on a shared Google account.

1. **Authentication → Providers → Google** — toggle on and paste a Google
   OAuth client ID / secret (create one at
   <https://console.cloud.google.com/apis/credentials>).
2. Add your local dev origin (`http://localhost:5173`) and your production
   domain as authorized redirect URLs both in Google Cloud **and** in the
   Supabase Auth redirect-URL allowlist.

### 4. Set up Web Push (optional but recommended)

The rest timer in the Train tab uses Web Push to buzz your phone even when
the tab is fully backgrounded / the screen is locked. Skipping this step
leaves you with the local notification + wake lock only (works fine when
the tab is alive).

#### 4a. Generate a VAPID key pair

```bash
npx web-push generate-vapid-keys
```

Copy the two base64-url strings you get back.

- Put the **public** key in `.env.local` as `VITE_VAPID_PUBLIC_KEY`.
- Keep the **private** key secret — you'll set it as an Edge Function secret
  in the next step.

#### 4b. Deploy the Edge Functions

With the [Supabase CLI](https://supabase.com/docs/guides/cli) logged in
(`supabase login && supabase link --project-ref <your-project-ref>`):

```bash
supabase functions deploy schedule-push
supabase functions deploy send-due-pushes

supabase secrets set \
  VAPID_PUBLIC_KEY="<public-key>" \
  VAPID_PRIVATE_KEY="<private-key>" \
  VAPID_SUBJECT="mailto:you@example.com"
```

#### 4c. Schedule the cron job

In the Supabase SQL editor, enable `pg_cron` + `pg_net` if you haven't
already, then schedule the sender to run every minute:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-due-pushes',
  '* * * * *',  -- every minute
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/send-due-pushes',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

You'll need to set `app.service_role_key` at the database level (in the
Supabase dashboard → Project Settings → API → copy the service_role secret,
then in SQL editor: `alter database postgres set app.service_role_key = 'eyJ…';`).

The cron fires every minute, and the Edge Function self-loops for ~55s
sending pushes as they come due — net delivery granularity is ~2 seconds
even though the cron itself only runs 1/min.

### 5. Run it

```bash
npm run dev       # vite dev server on :5173
npm run build     # production build → dist/
npm run preview   # preview the build
```

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import it in Vercel; build command `npm run build`, output directory `dist`.
3. In the Vercel project settings, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` as Environment Variables (keys are **not**
   committed to the repo — `.env*` is in `.gitignore`).
4. Add your Vercel production URL to Supabase Auth redirect URLs.

## Project structure

```
src/
├── components/
│   ├── layout/        StickyHeader, TabSwitcher, ProgressBar, PhasePills
│   ├── shared/        SuppItem, LifestyleItem, StreakBadge, DateBar, …
│   ├── panels/        NTPanel, GutPanel, DietPanel
│   └── diet/          AvoidBanner, DayTabs, MealCard, PrepMode, PrepDayPicker, GroceryList
├── data/              Static protocol content (NT_SUPPS, GUT_SUPPS, WEEK_MEALS, DAY_PREP, …)
├── hooks/             useAuth, useProtocolState, useStreak, useToast
├── lib/               supabase.js client
└── styles/            globals.css (full original design tokens)
```

## Data persistence

- `daily_checks(user_id, tab, item_id, check_date, checked)` — one row per
  (user, tab, item, day). App uses the local calendar date (not UTC) so a
  midnight reset is tied to the user's timezone.
- `streaks(user_id, tab, streak_count, last_completed_date)` — one row per
  (user, tab). Chain extends if `last_completed_date` was yesterday;
  otherwise resets to 1 on next completion.
- `daily_logs` — reserved for a future symptom/energy/mood journal.

All writes are optimistic: the UI toggles immediately and a background
upsert syncs to Supabase. On failure the state reverts and a red toast
appears.

## Features

- **Four tabs** — Neuro (NT supplements), Gut (gut-healing supplements), Diet
  (7-day meal plan + prep mode + equipment), and Train (weekly workout
  program with set logger, rest timer, PRs).
- **Google auth** gates the app; all data is scoped to the signed-in user
  via Supabase row-level security.
- **Optimistic sync** — every check, set, and pantry toggle mutates local
  state first and syncs to Supabase in the background. Failures revert and
  surface a red toast.
- **Rest timer** — animated SVG ring countdown that auto-triggers when a
  set is marked Done/Failed or a timed mobility stretch is checked. Color
  shifts red → amber (20s) → green (10s), vibrates and shows GO at zero.
- **Recipe modal** — meal cards open a bottom-sheet with ingredients
  (with parsed portions), equipment, step-by-step instructions, tips, and
  the "why this meal" note. Closes on ✕, overlay click, and Escape.
- **Pantry tracker** — grocery items persist across prep sessions. Tap to
  mark "have it", Clear-all button wipes state after confirmation.
- **Volume chart + PR detection** — volume of the last 8 sessions plus
  per-exercise PR badges against your previous best weight.
- **Light/dark theme** — full design system for both modes, persists to
  `localStorage`, respects `prefers-color-scheme` on first load.

## Legacy

The original 2800-line single-file prototype is preserved for reference at
`legacy/nt-gut-protocol.html`. Everything it does is now in the React app.
