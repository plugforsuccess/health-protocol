import { SetLogger } from './SetLogger.jsx';

export function ExerciseCard({
  ex,
  dayIdx,
  exIdx,
  sessionDate,
  setsMap,
  prevBest,
  onLogField,
  onCycleStatus,
}) {
  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <div className="exercise-name">
          {ex.name}
          {prevBest ? <span className="pr-badge">PR: {prevBest}lb</span> : null}
        </div>
        <div className="exercise-meta">
          {ex.sets} sets × {ex.reps} &nbsp;·&nbsp; Suggested: {ex.rec_weight}
        </div>
      </div>
      {ex.injury && <div className="exercise-injury-note">{ex.injury}</div>}
      <div className="exercise-note">{ex.note}</div>
      <SetLogger
        dayIdx={dayIdx}
        exIdx={exIdx}
        setCount={ex.sets}
        sessionDate={sessionDate}
        setsMap={setsMap}
        onLogField={onLogField}
        onCycleStatus={onCycleStatus}
      />
    </div>
  );
}
