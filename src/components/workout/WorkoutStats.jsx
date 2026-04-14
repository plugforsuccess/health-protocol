export function WorkoutStats({ sessions }) {
  const completed = sessions.filter((s) => s.completed);
  const sessionCount = completed.length;
  const prs = completed.reduce((acc, s) => acc + (s.prs_set || 0), 0);

  // Day streak: consecutive calendar days with a completed session, starting today.
  let streak = 0;
  const byDate = new Set(completed.map((s) => s.session_date));
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    if (byDate.has(key)) streak++;
    else if (i > 0) break;
  }

  return (
    <div className="workout-stats">
      <div className="stat-card">
        <div className="stat-num">{streak}</div>
        <div className="stat-label">DAY STREAK</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{sessionCount}</div>
        <div className="stat-label">SESSIONS</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{prs}</div>
        <div className="stat-label">PRS SET</div>
      </div>
    </div>
  );
}
