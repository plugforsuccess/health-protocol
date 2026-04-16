import { useCallback, useState } from 'react';
import { DateBar } from '../shared/DateBar.jsx';
import { WeekGrid } from '../workout/WeekGrid.jsx';
import { WorkoutStats } from '../workout/WorkoutStats.jsx';
import { VolumeChart } from '../workout/VolumeChart.jsx';
import { WorkoutDayModal } from '../workout/WorkoutDayModal.jsx';
import { useWorkoutPlan } from '../../hooks/useWorkoutPlan.js';
import { workoutDateKey } from '../../hooks/useWorkoutLogs.js';
import { getRestDuration, getMobilityTimerDuration } from '../../hooks/useRestTimer.js';

// Every warm-up gets a 10-second "get ready" prep. Users asked for this
// universally so the experience is consistent — if the lifter is picking
// up a jump rope or just easing into glute bridges, those 10 seconds of
// silence let them breathe and brace before the timer starts counting
// meaningful work.
const WARMUP_PREP_SECONDS = 10;

export function WorkoutPanel({
  active,
  workout,
  onStartRestTimer,
  onHideRestTimer,
  onError,
  push,
  showToast,
}) {
  const { weekPlan } = useWorkoutPlan();
  const [openIdx, setOpenIdx] = useState(null);
  const [testing, setTesting] = useState(false);

  // End-to-end push self-test. Schedules a push 10 seconds in the future and
  // asks the user to switch apps / lock the phone. If the buzz lands, the full
  // Service Worker + schedule-push + cron + send-due-pushes + VAPID chain is
  // working. If it doesn't land, at least one of the 5 setup steps is missing.
  const handleTestPush = useCallback(async () => {
    if (!push?.schedule) {
      showToast?.('Push not initialised. Grant notification permission first.', { error: true });
      return;
    }
    setTesting(true);
    try {
      const sub = await push.ensureSubscribed?.();
      if (!sub) {
        const why = push.getReason?.() || push.reason || 'unknown';
        showToast?.(`Push unavailable: ${why}`, { error: true, duration: 8000 });
        setTesting(false);
        return;
      }
      const fireAt = new Date(Date.now() + 10_000);
      const id = await push.schedule({
        fireAt,
        title: 'Test background buzz',
        body: 'If you felt this, the whole pipeline is wired up.',
        tag: 'rest-timer-test',
      });
      if (!id) {
        const why = push.getScheduleReason?.() || push.scheduleReason || 'unknown';
        showToast?.(`schedule-push failed: ${why}`, { error: true, duration: 12000 });
      } else {
        showToast?.('Test push scheduled. Lock phone / switch apps for 10s…', {
          duration: 10_000,
        });
      }
    } catch (e) {
      showToast?.(e?.message || 'Test push failed', { error: true });
    } finally {
      setTimeout(() => setTesting(false), 11_000);
    }
  }, [push, showToast]);

  const handleCycleStatus = useCallback(
    (dayIdx, exIdx, setIdx, exerciseName) => {
      // Compute the next status locally so the rest timer fires IMMEDIATELY
      // — no awaiting the Supabase roundtrip, and no dependency on the DB
      // write succeeding. If the tables aren't set up yet or the network
      // is slow, the timer still rings.
      const date = workoutDateKey(dayIdx, undefined, weekPlan);
      const key = `${date}::${dayIdx}::${exIdx}::${setIdx}`;
      const prev = workout.setsMap[key] || {};
      const current = prev.status || '';
      const next = current === '' ? 'done' : current === 'done' ? 'failed' : '';

      if (next === 'done' || next === 'failed') {
        onStartRestTimer(getRestDuration(exerciseName), exerciseName);
      } else {
        onHideRestTimer();
      }

      // Fire the DB write in the background. Errors surface a toast but
      // never block the timer.
      workout.cycleSetStatus(dayIdx, exIdx, setIdx).catch((e) => {
        console.warn('[workout] cycleSetStatus failed', e);
        onError?.(e);
      });
    },
    [workout, weekPlan, onStartRestTimer, onHideRestTimer, onError]
  );

  const handleToggleMobility = useCallback(
    (dayIdx, mobIdx, item) => {
      const date = workoutDateKey(dayIdx, undefined, weekPlan);
      const key = `${date}::${dayIdx}::${mobIdx}`;
      const wasChecked = !!workout.mobilityMap[key];
      const now = !wasChecked;
      const dur = getMobilityTimerDuration(item);

      if (now && dur) onStartRestTimer(dur, item.name);
      else if (!now) onHideRestTimer();

      workout.toggleMobility(dayIdx, mobIdx).catch((e) => {
        console.warn('[workout] toggleMobility failed', e);
        onError?.(e);
      });
    },
    [workout, weekPlan, onStartRestTimer, onHideRestTimer, onError]
  );

  // Warm-up chain:
  //   For each programmed round (item.sets, defaults to 1):
  //     phase A → 10s prep countdown ("Get ready — Round N — <name>")
  //     phase B → optional work timer if the warm-up has a parsed duration
  //   After the LAST round → onDone() → modal marks the warm-up complete
  //
  // This handles "Lateral Bound — sets: 3" (3 prep countdowns), "High
  // Knees — 30 sec × 3" (3 prep+work cycles), and "5 min Jump Rope" (a
  // single prep+work cycle), all with the same code path.
  //
  // item=null means "cancel" (user tapped the warm-up again mid-prep).
  const handleStartWarmup = useCallback(
    (item, onDone) => {
      if (!item) {
        onHideRestTimer();
        return;
      }
      const workDur = getMobilityTimerDuration(item);
      const totalRounds = Math.max(1, parseInt(item.sets, 10) || 1);

      const finish = () => {
        try { onDone?.(); } catch {}
      };

      // Round N work phase. If the warm-up isn't timed, skip straight to
      // the next round's prep (or finish, if N was the last).
      const runWorkPhase = (round) => {
        const isLast = round >= totalRounds;
        const next = isLast ? finish : () => runPrepPhase(round + 1);
        if (!workDur) {
          next();
          return;
        }
        const title = totalRounds > 1
          ? `${item.name} — Round ${round}/${totalRounds}`
          : item.name;
        onStartRestTimer(workDur, title, {
          label: 'Warm-up · Work',
          onComplete: next,
          // Brief lingering on the last round so the user sees "GO";
          // shorter when chaining into another prep phase.
          autoHideMs: isLast ? 1200 : 200,
        });
      };

      const runPrepPhase = (round) => {
        const title = totalRounds > 1
          ? `Get ready — Round ${round}/${totalRounds} — ${item.name}`
          : `Get ready — ${item.name}`;
        onStartRestTimer(WARMUP_PREP_SECONDS, title, {
          label: totalRounds > 1
            ? `Warm-up · Prep ${round}/${totalRounds}`
            : 'Warm-up · Prep',
          onComplete: () => runWorkPhase(round),
          // Almost no hide delay when chaining into a work phase, longer
          // pause when there's no work timer so the user notices the
          // round ended before the next prep starts.
          autoHideMs: workDur ? 200 : 600,
        });
      };

      runPrepPhase(1);
    },
    [onStartRestTimer, onHideRestTimer]
  );

  const handleLogField = useCallback(
    async (dayIdx, exIdx, setIdx, field, value) => {
      try {
        await workout.logSetField(dayIdx, exIdx, setIdx, field, value);
      } catch (e) {
        onError?.(e);
      }
    },
    [workout, onError]
  );

  const handleComplete = useCallback(
    async (dayIdx) => {
      try {
        await workout.completeWorkout(dayIdx);
        setOpenIdx(null);
      } catch (e) {
        onError?.(e);
      }
    },
    [workout, onError]
  );

  return (
    <>
      <div className={`panel${active ? ' active' : ''}`} id="panel-workout">
        <div className="wrap">
          <DateBar />
          <WorkoutStats sessions={workout.sessions} />
          <WeekGrid weekPlan={weekPlan} completedMap={workout.completedMap} onOpen={setOpenIdx} />
          <VolumeChart sessions={workout.sessions} />

          {push?.schedule && (
            <button
              type="button"
              className="export-btn"
              onClick={handleTestPush}
              disabled={testing}
              style={{ marginTop: 20 }}
            >
              {testing
                ? '⏳ TEST SCHEDULED — LOCK PHONE / SWITCH APPS'
                : '🔔 TEST BACKGROUND BUZZ (10S)'}
            </button>
          )}

          {push?.debug && <PushDebugPanel debug={push.debug} />}
        </div>
      </div>

      {active && openIdx !== null && weekPlan[openIdx] && (
        <WorkoutDayModal
          dayIdx={openIdx}
          weekPlan={weekPlan}
          onClose={() => setOpenIdx(null)}
          setsMap={workout.setsMap}
          mobilityMap={workout.mobilityMap}
          getPrevBest={workout.getPrevBest}
          getSuggestion={workout.getSuggestion}
          onLogField={handleLogField}
          onCycleStatus={handleCycleStatus}
          onToggleMobility={handleToggleMobility}
          onStartWarmup={handleStartWarmup}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}

function PushDebugPanel({ debug }) {
  const Row = ({ label, ok, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ opacity: 0.8 }}>{label}</span>
      <span style={{ color: ok ? 'var(--ok, #22c55e)' : 'var(--err, #ef4444)' }}>
        {ok ? '✓' : '✗'} {value}
      </span>
    </div>
  );
  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        border: '1px solid var(--border, #333)',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>PUSH DIAGNOSTIC</div>
      <Row
        label="VAPID key in build"
        ok={debug.vapidKeyPresent}
        value={debug.vapidKeyPresent ? debug.vapidKeyPrefix + '…' : 'MISSING'}
      />
      <Row label="serviceWorker API" ok={debug.swSupported} value={debug.swSupported ? 'yes' : 'no'} />
      <Row label="PushManager API" ok={debug.pushSupported} value={debug.pushSupported ? 'yes' : 'no'} />
      <Row
        label="SW registered"
        ok={debug.swRegistered}
        value={debug.swRegistered ? 'yes' : 'pending'}
      />
      <Row
        label="Notification perm"
        ok={debug.permission === 'granted'}
        value={debug.permission}
      />
      <Row
        label="Standalone PWA"
        ok={debug.standalone}
        value={debug.standalone ? 'yes' : 'add to home screen'}
      />
      <Row label="Signed in" ok={debug.userId} value={debug.userId ? 'yes' : 'no'} />
      {debug.reason && (
        <div style={{ marginTop: 6, color: 'var(--err, #ef4444)' }}>
          last subscribe failure: {debug.reason}
        </div>
      )}
      {debug.scheduleReason && (
        <div style={{ marginTop: 6, color: 'var(--err, #ef4444)', wordBreak: 'break-word' }}>
          last schedule failure: {debug.scheduleReason}
        </div>
      )}
    </div>
  );
}
