import { useCallback, useState } from 'react';
import { DateBar } from '../shared/DateBar.jsx';
import { WeekGrid } from '../workout/WeekGrid.jsx';
import { WorkoutStats } from '../workout/WorkoutStats.jsx';
import { VolumeChart } from '../workout/VolumeChart.jsx';
import { WorkoutDayModal } from '../workout/WorkoutDayModal.jsx';
import { WORKOUT_WEEK } from '../../data/workoutWeek.js';
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
    async (dayIdx, exIdx, setIdx, exerciseName) => {
      try {
        const next = await workout.cycleSetStatus(dayIdx, exIdx, setIdx);
        if (next === 'done' || next === 'failed') {
          onStartRestTimer(getRestDuration(exerciseName), exerciseName);
        } else {
          onHideRestTimer();
        }
      } catch (e) {
        onError?.(e);
      }
    },
    [workout, onStartRestTimer, onHideRestTimer, onError]
  );

  const handleToggleMobility = useCallback(
    async (dayIdx, mobIdx, item) => {
      try {
        const now = await workout.toggleMobility(dayIdx, mobIdx);
        const dur = getMobilityTimerDuration(item);
        if (now && dur) onStartRestTimer(dur, item.name);
        else if (!now) onHideRestTimer();
      } catch (e) {
        onError?.(e);
      }
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
