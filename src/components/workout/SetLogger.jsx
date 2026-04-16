// Kind-aware set logger with three quality-of-life rules:
//
//   1. Inputs reflect the exercise type:
//        • weighted   — weight + reps
//        • bodyweight — weight (placeholder "BW" — OPEN so users who want
//                       to load box jumps / split squats can) + reps
//        • duration   — no weight (greyed-out "—") + a seconds/yards field
//
//   2. Suggested weight + reps PREFILL the inputs. If the engine says
//      "use 25lb today", the input shows 25 by default. The user can
//      type something else, and that override is what gets logged.
//      If they leave it untouched, the prefilled 25 saves on first
//      blur. (We use the React `key` of the input to re-mount when
//      the suggestion changes, so the defaultValue is honoured.)
//
//   3. Sets unlock sequentially. Only the FIRST un-marked set is
//      interactive — its inputs accept text and its check button
//      cycles state. Sets after that are dimmed and disabled until
//      the prior set is marked done OR failed. This stops users from
//      logging set 4 before set 1, and it gives the train tab a clear
//      "what do I do RIGHT NOW" focus.

export function SetLogger({
  dayIdx,
  exIdx,
  setCount,
  sessionDate,
  setsMap,
  kind,
  suggestion,
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

  // Find the active set: the lowest index whose status is empty (i.e.
  // hasn't been marked done or failed yet). Once every set has a status,
  // active === setCount, which means everything stays unlocked (so the
  // user can correct numbers after the lift).
  let activeIdx = setCount;
  for (let si = 0; si < setCount; si++) {
    const k = `${sessionDate}::${dayIdx}::${exIdx}::${si}`;
    const status = setsMap[k]?.status || '';
    if (status === '') {
      activeIdx = si;
      break;
    }
  }

  // Used in each input's React key. `defaultValue` is only applied on
  // mount, so we need the input to re-mount whenever its effective
  // prefill changes — including the moment a previously-locked set
  // becomes the active one (and thus picks up the suggestion's prefill
  // for the first time).
  const prefillSig = `${suggestion?.prefillWeight ?? '_'}|${suggestion?.prefillReps ?? '_'}`;

  const rows = [];
  for (let si = 0; si < setCount; si++) {
    const key = `${sessionDate}::${dayIdx}::${exIdx}::${si}`;
    const setLog = setsMap[key] || {};
    const status = setLog.status || '';
    const locked = si > activeIdx;

    // Prefill is ONLY used for the next-up set when the user hasn't
    // entered anything yet. Subsequent sets prefill from prior session
    // too, but we don't auto-fill across the WHOLE block — the user
    // typically wants to drop weight if a set fails.
    const weightPrefill =
      setLog.weight_lbs == null && si === activeIdx ? suggestion?.prefillWeight : null;
    const repsPrefill =
      setLog.reps == null && si === activeIdx ? suggestion?.prefillReps : null;

    // Column 2: weight column. Always editable except for duration kind
    // (where it's meaningless). For bodyweight the placeholder is "BW".
    let col2;
    if (mode === 'duration') {
      col2 = <div className="set-na">—</div>;
    } else {
      col2 = (
        <input
          key={`w-${si}-${weightPrefill ?? '_'}-${prefillSig}`}
          className="set-input"
          type="number"
          placeholder={mode === 'bodyweight' ? 'BW' : 'lbs'}
          defaultValue={
            setLog.weight_lbs ?? (weightPrefill != null ? weightPrefill : '')
          }
          inputMode="decimal"
          step="any"
          min="0"
          disabled={locked}
          onBlur={(e) => onLogField(dayIdx, exIdx, si, 'weight', e.target.value)}
        />
      );
    }

    // Column 3: reps OR seconds/yards. Reps slot is reused for duration
    // writes — it parses as int either way, so no schema change required.
    const col3 = (
      <input
        key={`r-${si}-${repsPrefill ?? '_'}-${prefillSig}`}
        className="set-input"
        type="number"
        placeholder={mode === 'duration' ? (kind.unit === 'yards' ? 'yds' : 'sec') : 'reps'}
        defaultValue={setLog.reps ?? (repsPrefill != null ? repsPrefill : '')}
        inputMode="numeric"
        step="1"
        min="0"
        disabled={locked}
        onBlur={(e) => onLogField(dayIdx, exIdx, si, 'reps', e.target.value)}
      />
    );

    rows.push(
      <div key={si} className={`set-row${locked ? ' locked' : ''}`}>
        <div className="set-num">{si + 1}</div>
        {col2}
        {col3}
        <button
          type="button"
          className={`set-check${status === 'done' ? ' done' : status === 'failed' ? ' failed' : ''}`}
          disabled={locked}
          aria-disabled={locked}
          title={locked ? 'Finish the previous set first' : undefined}
          onClick={() => {
            if (locked) return;
            onCycleStatus(dayIdx, exIdx, si);
          }}
        >
          {status === 'done' ? '✓' : status === 'failed' ? '✗' : locked ? '🔒' : ''}
        </button>
      </div>
    );
  }

  return (
    <div className="set-logger">
      <div className="set-labels">
        <div className="set-label">SET</div>
        <div className="set-label">
          {mode === 'weighted' ? 'WEIGHT (LB)' : mode === 'bodyweight' ? 'LOAD (LB)' : 'LOAD'}
        </div>
        <div className="set-label">{unitLabel}</div>
        <div className="set-label"></div>
      </div>
      {rows}
    </div>
  );
}
