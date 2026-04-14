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

### 2. Run the database migration

Open the **SQL editor** in the Supabase dashboard and paste the contents of
`supabase/migrations/0001_init.sql`, then **Run**. This creates three tables
(`daily_checks`, `streaks`, `daily_logs`) with row-level-security policies
so each user only ever sees their own rows.

### 3. Enable Google OAuth

1. **Authentication → Providers → Google** — toggle on and paste a Google
   OAuth client ID / secret (create one at
   <https://console.cloud.google.com/apis/credentials>).
2. Add your local dev origin (`http://localhost:5173`) and your production
   domain as authorized redirect URLs both in Google Cloud **and** in the
   Supabase Auth redirect-URL allowlist.

### 4. Run it

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

## Legacy

The original 2800-line single-file prototype (including the unused workout
tab, recipe modal, and theme toggle — all out of scope for this migration)
is preserved for reference at `legacy/nt-gut-protocol.html`.
