export function ProgressBar({ tab, progress }) {
  const { done, total } = progress;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress-row">
      <div className="progress-bar-bg">
        <div
          className={`progress-bar-fill fill-${tab}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="progress-label">
        {done} / {total}
      </div>
    </div>
  );
}
