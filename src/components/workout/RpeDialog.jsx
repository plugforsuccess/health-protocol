import { useEffect, useState } from 'react';

// Rate of Perceived Exertion (RPE) prompt shown when the user marks a
// workout complete. Captures a single 1–10 score for the whole session.
//
// Reviewer flagged that without RPE the engine flies blind on recovery —
// a user can complete every set at target weight and still be on fumes.
// suggestProgression() reads this value and gates the +5lb bump:
//
//   • RPE 1–3  ("easy")    → coach copy says "felt light"
//   • RPE 4–6  ("solid")   → standard bump
//   • RPE 7–8  ("tough")   → standard bump but coach copy is calmer
//   • RPE 9–10 ("maxed")   → HOLD THE WEIGHT, no bump even if all done
//
// The user can dismiss without logging — RPE is optional. The progression
// engine just falls back to "all sets done = bump" without RPE data.

const ANCHORS = [
  { value: 1,  label: 'Trivial — could go forever' },
  { value: 3,  label: 'Easy — light work' },
  { value: 5,  label: 'Moderate — meaningful effort' },
  { value: 7,  label: 'Hard — pushed but composed' },
  { value: 9,  label: 'Brutal — very little left' },
  { value: 10, label: 'Max — absolute limit' },
];

function describe(rpe) {
  let best = ANCHORS[0];
  for (const a of ANCHORS) {
    if (a.value <= rpe) best = a;
  }
  return best.label;
}

export function RpeDialog({ open, onSubmit, onSkip }) {
  const [rpe, setRpe] = useState(6);

  // Reset to neutral midpoint each time the dialog opens fresh.
  useEffect(() => {
    if (open) setRpe(6);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="wmodal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 800 }}
    >
      <div className="wmodal-sheet" style={{ maxWidth: 460 }}>
        <div className="wmodal-handle" />
        <div className="wmodal-header">
          <div className="wmodal-title-row">
            <div className="wmodal-title">How did that feel?</div>
            <button
              type="button"
              className="wmodal-close"
              onClick={onSkip}
              aria-label="Skip RPE"
            >
              ✕
            </button>
          </div>
          <div className="wmodal-meta">
            Rate of Perceived Exertion · 1 (trivial) → 10 (absolute max)
          </div>
        </div>
        <div className="wmodal-body" style={{ paddingTop: 12 }}>
          <div className="rpe-display">
            <div className="rpe-value">{rpe}</div>
            <div className="rpe-anchor">{describe(rpe)}</div>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={rpe}
            onChange={(e) => setRpe(parseInt(e.target.value, 10))}
            className="rpe-slider"
            aria-label="RPE"
          />
          <div className="rpe-scale">
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>10</span>
          </div>
          <div className="rpe-help">
            Why we ask: completing every set at RPE 9 means there's no
            headroom for more weight next session. Honest scores get you
            better suggestions.
          </div>
          <div className="rpe-actions">
            <button
              type="button"
              className="rpe-btn rpe-skip"
              onClick={onSkip}
            >
              Skip
            </button>
            <button
              type="button"
              className="rpe-btn rpe-submit"
              onClick={() => onSubmit(rpe)}
            >
              Save & Finish Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
