// Kind-aware set logger.
//
// The panel tells us what model applies (via `kind`):
//   • weighted   — weight + reps (classic)
//   • bodyweight — reps only; the weight column is replaced by a "BW" tag
//   • duration   — no weight, no reps; a single "DURATION" input (seconds)
//                  and the check button mark the interval complete.
//                  The unit label ("sec" / "yards") is rendered next to
//                  the input so the user knows what they're entering.
//
// Making the inputs match the exercise type is the minimum bar — we were
// showing "lbs" and "reps" on Treadmill Intervals, which is nonsense.

export function SetLogger({
  dayIdx,
  exIdx,
  setCount,
  sessionDate,
  setsMap,
  kind,
  onLogField,
  onCycleStatus,
}) {
  const mode = kind?.kind || 'weighted';
  const unitLabel =
    mode === 'duration'
      ? kind?.unit === 'yards'
        ? 'YARDS'
        : 'SEC'
      : 'REPS';

  const rows = [];
  for (let si = 0; si < setCount; si++) {
    const key = `${sessionDate}::${dayIdx}::${exIdx}::${si}`;
    const setLog = setsMap[key] || {};
    const status = setLog.status || '';

    // Column 2: weight (weighted only) — bodyweight/duration replaced with
    // a non-interactive tag so the grid lines still line up.
    let col2;
    if (mode === 'weighted') {
      col2 = (
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
      );
    } else if (mode === 'bodyweight') {
      col2 = <div className="set-na">BW</div>;
    } else {
      // duration — the single meaningful input lives in col3
      col2 = <div className="set-na">—</div>;
    }

    // Column 3: reps OR seconds/yards (reps field is reused for duration
    // writes so we don't need a schema change — parsed as an int either way).
    const col3 = (
      <input
        className="set-input"
        type="number"
        placeholder={mode === 'duration' ? (kind.unit === 'yards' ? 'yds' : 'sec') : 'reps'}
        defaultValue={setLog.reps ?? ''}
        inputMode="numeric"
        step="1"
        min="0"
        onBlur={(e) => onLogField(dayIdx, exIdx, si, 'reps', e.target.value)}
      />
    );

    rows.push(
      <div key={si} className="set-row">
        <div className="set-num">{si + 1}</div>
        {col2}
        {col3}
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
        <div className="set-label">
          {mode === 'weighted' ? 'WEIGHT (LB)' : mode === 'bodyweight' ? 'LOAD' : 'LOAD'}
        </div>
        <div className="set-label">{unitLabel}</div>
        <div className="set-label"></div>
      </div>
      {rows}
    </div>
  );
}
