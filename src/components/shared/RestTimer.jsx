const RT_CIRCUMFERENCE = 169.6; // 2 * π * 27

export function RestTimer({ state, onTogglePause, onSkip }) {
  const { active, paused, total, remaining, title, finished } = state;

  const display = finished ? 'GO' : Math.max(0, remaining);
  const pct = total > 0 ? remaining / total : 0;
  const offset = RT_CIRCUMFERENCE * (1 - pct);

  let ringColor = 'var(--w)';
  if (finished || remaining <= 10) ringColor = 'var(--check)';
  else if (remaining <= 20) ringColor = 'var(--g)';

  return (
    <div className={`rest-timer-wrap${active ? ' visible' : ''}`} aria-hidden={!active}>
      <div className="rest-timer-card">
        <div className="rt-ring-wrap">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle className="rt-ring-bg" cx="32" cy="32" r="27" />
            <circle
              className="rt-ring-fill"
              cx="32"
              cy="32"
              r="27"
              strokeDasharray={RT_CIRCUMFERENCE}
              strokeDashoffset={finished ? 0 : offset}
              style={{ stroke: ringColor }}
            />
          </svg>
          <div className="rt-num">{display}</div>
        </div>
        <div className="rt-info">
          <div className="rt-label">Rest Timer</div>
          <div className="rt-title">{title}</div>
          <div className="rt-btns">
            <button type="button" className="rt-btn" onClick={onTogglePause} disabled={finished}>
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="rt-btn skip" onClick={onSkip}>
              Skip →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
