export function SetLogger({
  dayIdx,
  exIdx,
  setCount,
  sessionDate,
  setsMap,
  onLogField,
  onCycleStatus,
}) {
  const rows = [];
  for (let si = 0; si < setCount; si++) {
    const key = `${sessionDate}::${dayIdx}::${exIdx}::${si}`;
    const setLog = setsMap[key] || {};
    const status = setLog.status || '';
    rows.push(
      <div key={si} className="set-row">
        <div className="set-num">{si + 1}</div>
        <input
          className="set-input"
          type="number"
          placeholder="lbs"
          defaultValue={setLog.weight_lbs ?? ''}
          inputMode="decimal"
          step="any"
          min="0"
          onBlur={(e) => onLogField(dayIdx, exIdx, si, 'weight', e.target.value)}
        />
        <input
          className="set-input"
          type="number"
          placeholder="reps"
          defaultValue={setLog.reps ?? ''}
          inputMode="numeric"
          step="1"
          min="0"
          onBlur={(e) => onLogField(dayIdx, exIdx, si, 'reps', e.target.value)}
        />
        <button
          type="button"
          className={`set-check${status === 'done' ? ' done' : status === 'failed' ? ' failed' : ''}`}
          onClick={() => onCycleStatus(dayIdx, exIdx, si)}
        >
          {status === 'done' ? '✓' : status === 'failed' ? '✗' : ''}
        </button>
      </div>
    );
  }

  return (
    <div className="set-logger">
      <div className="set-labels">
        <div className="set-label">SET</div>
        <div className="set-label">WEIGHT (lb)</div>
        <div className="set-label">REPS</div>
        <div className="set-label"></div>
      </div>
      {rows}
    </div>
  );
}
