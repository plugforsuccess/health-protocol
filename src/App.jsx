import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, localDateKey } from './lib/supabase.js';
import { useAuth } from './hooks/useAuth.js';
import { useProtocolState } from './hooks/useProtocolState.js';
import { useStreak } from './hooks/useStreak.js';
import { useToast } from './hooks/useToast.js';
import { useTheme } from './hooks/useTheme.js';
import { usePantry } from './hooks/usePantry.js';
import { useWorkoutLogs } from './hooks/useWorkoutLogs.js';
import { useRestTimer } from './hooks/useRestTimer.js';
import { usePushSubscription } from './hooks/usePushSubscription.js';

import { AuthScreen } from './components/AuthScreen.jsx';
import { StickyHeader } from './components/layout/StickyHeader.jsx';
import { NTPanel } from './components/panels/NTPanel.jsx';
import { GutPanel } from './components/panels/GutPanel.jsx';
import { DietPanel } from './components/panels/DietPanel.jsx';
import { WorkoutPanel } from './components/panels/WorkoutPanel.jsx';
import { Toast } from './components/shared/Toast.jsx';
import { RestTimer } from './components/shared/RestTimer.jsx';

import { NT_SUPPS } from './data/ntSupps.js';
import { NT_LIFESTYLE } from './data/lifestyleNT.js';
import { GUT_SUPPS } from './data/gutSupps.js';
import { GUT_LIFESTYLE } from './data/lifestyleGut.js';

const VALID_TABS = ['nt', 'gut', 'diet', 'workout'];

function useTabRouting(defaultTab = 'nt') {
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return defaultTab;
    const q = new URLSearchParams(window.location.search).get('tab');
    return VALID_TABS.includes(q) ? q : defaultTab;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  }, [tab]);

  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(window.location.search).get('tab');
      if (VALID_TABS.includes(q)) setTab(q);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return [tab, setTab];
}

const NT_PHASE_KEYS = ['morning', 'midday', 'evening', 'bedtime', 'weekly'];
const GUT_PHASE_KEYS = ['morning', 'withfood', 'evening'];

const NT_PHASE_LABELS = {
  morning: '☀️ Morning',
  midday: '🌤 Midday',
  evening: '🌆 Evening',
  bedtime: '🌙 Bedtime',
  weekly: '📅 Weekly',
  lifestyle: '⚡ Lifestyle',
};
const GUT_PHASE_LABELS = {
  morning: '🌅 Fasted AM',
  withfood: '🍳 Breakfast',
  evening: '🌙 Evening',
  lifestyle: '🌿 Habits',
};

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { isLight, toggle: toggleTheme } = useTheme();
  const [tab, setTab] = useTabRouting('nt');
  const { toast, show: showToast } = useToast();

  // Theme is applied even on the auth screen — render nothing theme-dependent
  // until we know the auth state.
  if (authLoading) return <div className="loading-screen">Loading…</div>;
  if (!user) {
    return (
      <>
        <AuthScreen onSignIn={signInWithGoogle} />
        {/* Theme toggle on the auth screen would be nice, but not required */}
      </>
    );
  }

  return (
    <SignedInApp
      user={user}
      tab={tab}
      setTab={setTab}
      signOut={signOut}
      showToast={showToast}
      toast={toast}
      isLight={isLight}
      toggleTheme={toggleTheme}
    />
  );
}

function SignedInApp({ user, tab, setTab, signOut, showToast, toast, isLight, toggleTheme }) {
  const nt = useProtocolState(user.id, 'nt');
  const gut = useProtocolState(user.id, 'gut');
  const ntStreak = useStreak(user.id, 'nt');
  const gutStreak = useStreak(user.id, 'gut');
  const pantry = usePantry(user.id);
  const workout = useWorkoutLogs(user.id);
  const push = usePushSubscription(user.id);
  const restTimer = useRestTimer(push);

  // ── Midnight cross-over
  useEffect(() => {
    let lastDate = localDateKey();
    const interval = setInterval(() => {
      const now = localDateKey();
      if (now !== lastDate) {
        lastDate = now;
        nt.reload();
        gut.reload();
        workout.reload();
      }
    }, 60_000);
    const onVis = () => {
      const now = localDateKey();
      if (now !== lastDate) {
        lastDate = now;
        nt.reload();
        gut.reload();
        workout.reload();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [nt, gut, workout]);

  // ── Supplement id maps
  const ntAllSuppIds = useMemo(
    () => NT_PHASE_KEYS.flatMap((p) => (NT_SUPPS[p] || []).map((s) => s.id)),
    []
  );
  const gutAllSuppIds = useMemo(
    () => GUT_PHASE_KEYS.flatMap((p) => (GUT_SUPPS[p] || []).map((s) => s.id)),
    []
  );

  const ntAllIds = useMemo(
    () => [...ntAllSuppIds, ...NT_LIFESTYLE.map((l) => l.id)],
    [ntAllSuppIds]
  );
  const gutAllIds = useMemo(
    () => [...gutAllSuppIds, ...GUT_LIFESTYLE.map((l) => l.id)],
    [gutAllSuppIds]
  );

  const ntProgress = useMemo(
    () => ({
      done: ntAllIds.filter((id) => nt.checks[id]).length,
      total: ntAllIds.length,
    }),
    [nt.checks, ntAllIds]
  );
  const gutProgress = useMemo(
    () => ({
      done: gutAllIds.filter((id) => gut.checks[id]).length,
      total: gutAllIds.length,
    }),
    [gut.checks, gutAllIds]
  );

  const ntPhases = useMemo(
    () =>
      [
        ...NT_PHASE_KEYS.map((k) => ({
          key: k,
          label: NT_PHASE_LABELS[k],
          ids: (NT_SUPPS[k] || []).map((s) => s.id),
        })),
        { key: 'lifestyle', label: NT_PHASE_LABELS.lifestyle, ids: NT_LIFESTYLE.map((l) => l.id) },
      ].map((p) => ({ ...p, done: p.ids.length > 0 && p.ids.every((id) => nt.checks[id]) })),
    [nt.checks]
  );
  const gutPhases = useMemo(
    () =>
      [
        ...GUT_PHASE_KEYS.map((k) => ({
          key: k,
          label: GUT_PHASE_LABELS[k],
          ids: (GUT_SUPPS[k] || []).map((s) => s.id),
        })),
        { key: 'lifestyle', label: GUT_PHASE_LABELS.lifestyle, ids: GUT_LIFESTYLE.map((l) => l.id) },
      ].map((p) => ({ ...p, done: p.ids.length > 0 && p.ids.every((id) => gut.checks[id]) })),
    [gut.checks]
  );

  const ntSuppComplete = ntAllSuppIds.length > 0 && ntAllSuppIds.every((id) => nt.checks[id]);
  const gutSuppComplete = gutAllSuppIds.length > 0 && gutAllSuppIds.every((id) => gut.checks[id]);

  useEffect(() => {
    if (ntSuppComplete) ntStreak.markCompleteToday().catch(() => {});
  }, [ntSuppComplete]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gutSuppComplete) gutStreak.markCompleteToday().catch(() => {});
  }, [gutSuppComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleNT = useCallback(
    (id) => {
      nt.toggle(id).catch((e) => showToast(e?.message || 'Sync failed', { error: true }));
    },
    [nt, showToast]
  );
  const toggleGut = useCallback(
    (id) => {
      gut.toggle(id).catch((e) => showToast(e?.message || 'Sync failed', { error: true }));
    },
    [gut, showToast]
  );

  const resetCurrent = useCallback(async () => {
    const label = tab === 'nt' ? 'Neuro' : 'Gut';
    if (!confirm(`Reset all ${label} protocol checks for today?`)) return;
    try {
      if (tab === 'nt') await nt.reset();
      else if (tab === 'gut') await gut.reset();
      showToast('Today reset.');
    } catch (e) {
      showToast(e?.message || 'Reset failed', { error: true });
    }
  }, [tab, nt, gut, showToast]);

  const exportCurrent = useCallback(async () => {
    try {
      const [{ data: checks }, { data: streaks }, { data: logs }] = await Promise.all([
        supabase
          .from('daily_checks')
          .select('tab, item_id, checked, check_date, created_at')
          .eq('user_id', user.id)
          .eq('tab', tab)
          .order('check_date', { ascending: false }),
        supabase.from('streaks').select('*').eq('user_id', user.id).eq('tab', tab),
        supabase.from('daily_logs').select('*').eq('user_id', user.id),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        tab,
        daily_checks: checks || [],
        streaks: streaks || [],
        daily_logs: logs || [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protocol-${tab}-${localDateKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export downloaded.');
    } catch (e) {
      showToast(e?.message || 'Export failed', { error: true });
    }
  }, [tab, user.id, showToast]);

  const scrollToPhase = useCallback(
    (phaseKey) => {
      const id = `${tab}-section-${phaseKey}`;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [tab]
  );

  // ── Header values
  const headerProgress =
    tab === 'nt' ? ntProgress : tab === 'gut' ? gutProgress : { done: 0, total: 0 };
  const headerPhases = tab === 'nt' ? ntPhases : tab === 'gut' ? gutPhases : [];
  const headerStreak = tab === 'nt' ? ntStreak.count : tab === 'gut' ? gutStreak.count : 0;

  const onPantryError = useCallback(
    (e) => showToast(e?.message || 'Pantry sync failed', { error: true }),
    [showToast]
  );
  const onWorkoutError = useCallback(
    (e) => showToast(e?.message || 'Workout sync failed', { error: true }),
    [showToast]
  );

  return (
    <>
      <StickyHeader
        tab={tab}
        setTab={setTab}
        user={user}
        onSignOut={signOut}
        progress={headerProgress}
        phases={headerPhases}
        streakCount={headerStreak}
        scrollToPhase={scrollToPhase}
        isLight={isLight}
        toggleTheme={toggleTheme}
      />

      <NTPanel
        active={tab === 'nt'}
        checks={nt.checks}
        onToggle={toggleNT}
        onReset={resetCurrent}
        onExport={exportCurrent}
        allSuppComplete={ntSuppComplete}
      />

      <GutPanel
        active={tab === 'gut'}
        checks={gut.checks}
        onToggle={toggleGut}
        onReset={resetCurrent}
        onExport={exportCurrent}
        allSuppComplete={gutSuppComplete}
      />

      <DietPanel
        active={tab === 'diet'}
        pantry={pantry}
        onTogglePantry={pantry.toggle}
        onClearPantry={pantry.clear}
        onPantryError={onPantryError}
      />

      <WorkoutPanel
        active={tab === 'workout'}
        workout={workout}
        onStartRestTimer={restTimer.start}
        onHideRestTimer={restTimer.hide}
        onError={onWorkoutError}
      />

      <RestTimer
        state={restTimer.state}
        onTogglePause={restTimer.togglePause}
        onSkip={restTimer.hide}
      />

      <Toast toast={toast} />
    </>
  );
}
