export function VolumeChart({ sessions }) {
  const logs = sessions
    .filter((s) => (s.volume_lbs || 0) > 0)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(-8);

  if (logs.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">VOLUME (LAST 8 SESSIONS)</div>
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 11,
            color: 'var(--muted)',
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          Log your first workout to see progress
        </div>
      </div>
    );
  }

  const maxVol = Math.max(...logs.map((s) => s.volume_lbs || 0));

  return (
    <div className="chart-container">
      <div className="chart-title">VOLUME (LAST 8 SESSIONS)</div>
      <div className="chart-canvas">
        <div className="chart-bars">
          {logs.map((s) => {
            const pct = maxVol > 0 ? ((s.volume_lbs || 0) / maxVol) * 90 : 0;
            const d = new Date(s.session_date);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            const val = s.volume_lbs > 0 ? Math.round(s.volume_lbs / 1000) + 'k' : '';
            return (
              <div key={s.id || s.session_date + s.day_index} className="chart-bar-wrap">
                <div className="chart-bar-val">{val}</div>
                <div className="chart-bar" style={{ height: pct + 'px' }} />
                <div className="chart-bar-label">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
