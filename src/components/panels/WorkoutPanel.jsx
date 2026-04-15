import { useCallback, useState } from 'react';
import { DateBar } from '../shared/DateBar.jsx';
import { WeekGrid } from '../workout/WeekGrid.jsx';
import { WorkoutStats } from '../workout/WorkoutStats.jsx';
import { VolumeChart } from '../workout/VolumeChart.jsx';
import { WorkoutDayModal } from '../workout/WorkoutDayModal.jsx';
import { WORKOUT_WEEK } from '../../data/workoutWeek.js';
import { workoutDateKey } from '../../hooks/useWorkoutLogs.js';
import { getRestDuration, getMobilityTimerDuration } from '../../hooks/useRestTimer.js';

export function WorkoutPanel({
  active,
  workout,
  onStartRestTimer,
  onHideRestTimer,
  onError,
  push,
  showToast,
}) {
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
        const why = push.reason || 'unknown';
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
        const why = push.scheduleReason || 'unknown';
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
      const date = workoutDateKey(dayIdx);
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
    [workout, onStartRestTimer, onHideRestTimer, onError]
  );

  const handleToggleMobility = useCallback(
    (dayIdx, mobIdx, item) => {
      const date = workoutDateKey(dayIdx);
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
    [workout, onStartRestTimer, onHideRestTimer, onError]
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
          <WeekGrid completedMap={workout.completedMap} onOpen={setOpenIdx} />
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

      {active && openIdx !== null && WORKOUT_WEEK[openIdx] && (
        <WorkoutDayModal
          dayIdx={openIdx}
          onClose={() => setOpenIdx(null)}
          setsMap={workout.setsMap}
          mobilityMap={workout.mobilityMap}
          getPrevBest={workout.getPrevBest}
          onLogField={handleLogField}
          onCycleStatus={handleCycleStatus}
          onToggleMobility={handleToggleMobility}
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
