export function StreakBadge({ count, tab }) {
  const classes = ['streak-badge', count > 0 ? `active-${tab}` : ''].filter(Boolean).join(' ');
  return (
    <div className={classes} title="Streak — days in a row all supplements completed">
      <span>🔥</span>
      <span>{count}</span>
    </div>
  );
}
