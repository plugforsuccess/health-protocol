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
}) {
  const [openIdx, setOpenIdx] = useState(null);

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
