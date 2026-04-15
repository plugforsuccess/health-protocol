import { SetLogger } from './SetLogger.jsx';

// The card renders a dynamic "Next session target" banner pulled from
// getSuggestion(). If the user completed all sets last week, the banner
// says something like "+5lb — all sets cleared at 35lb". If they missed
// a set, it says "hold 35lb". If there's no history at all, it falls back
// to the hardcoded rec_weight so the programme still works on week 1.
//
// We only render the weight/reps grid when inputs are meaningful (weighted
// or bodyweight). For duration work the grid still appears because
// `sets` is still iterated, but the SetLogger swaps the inputs for a
// seconds field and a "BW"/"—" placeholder so users aren't prompted to
// enter bogus lbs on Treadmill Intervals or Battle Ropes.

export function ExerciseCard({
  ex,
  dayIdx,
  exIdx,
  sessionDate,
  setsMap,
  prevBest,
  suggestion,
  kind,
  onLogField,
  onCycleStatus,
}) {
  const dynamic = suggestion?.dynamic;
  const suggestedLine = suggestion?.display || ex.rec_weight;

  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <div className="exercise-name">
          {ex.name}
          {prevBest ? <span className="pr-badge">PR: {prevBest}lb</span> : null}
          {dynamic && suggestion?.delta > 0 && (
            <span className="progress-badge">↑ progress</span>
          )}
          {dynamic && suggestion?.delta === 0 && (
            <span className="hold-badge">hold</span>
          )}
        </div>
        <div className="exercise-meta">
          {ex.sets} sets × {ex.reps} &nbsp;·&nbsp; Suggested: {suggestedLine}
        </div>
        {suggestion?.reason && (
          <div className={`suggestion-reason${dynamic ? ' dynamic' : ''}`}>
            {dynamic ? '🧠 ' : ''}
            {suggestion.reason}
          </div>
        )}
      </div>
      {ex.injury && <div className="exercise-injury-note">{ex.injury}</div>}
      <div className="exercise-note">{ex.note}</div>
      <SetLogger
        dayIdx={dayIdx}
        exIdx={exIdx}
        setCount={ex.sets}
        sessionDate={sessionDate}
        setsMap={setsMap}
        kind={kind}
        onLogField={onLogField}
        onCycleStatus={onCycleStatus}
      />
    </div>
  );
}
