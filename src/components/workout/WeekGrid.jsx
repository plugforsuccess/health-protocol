import { WORKOUT_WEEK } from '../../data/workoutWeek.js';
import { workoutDateKey, getTodayWorkoutIdx } from '../../hooks/useWorkoutLogs.js';

export function WeekGrid({ completedMap, onOpen }) {
  const todayIdx = getTodayWorkoutIdx();
  return (
    <div className="week-grid">
      {WORKOUT_WEEK.map((d, i) => {
        const date = workoutDateKey(i);
        const logged = !!completedMap[`${date}__${i}`];
        const classes = [
          'day-cell',
          d.type,
          i === todayIdx ? 'today' : '',
          logged ? 'logged' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div key={i} className={classes} onClick={() => onOpen(i)}>
            <div className="day-cell-label">{d.day}</div>
            <div className="day-cell-type">{d.icon}</div>
            <div className="day-cell-name">{d.type}</div>
          </div>
        );
      })}
    </div>
  );
}
