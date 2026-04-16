// Progress bar shown above every onboarding step. Communicates both
// quantity ("Step 3 of 7") and proportion (the filled bar) so the user
// always knows how close they are to finishing.

export function ProgressBar({ step, total }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="onb-progress" aria-label={`Step ${step + 1} of ${total}`}>
      <div className="onb-progress-bar">
        <div className="onb-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="onb-progress-label">
        Step {step + 1} of {total}
      </div>
    </div>
  );
}
