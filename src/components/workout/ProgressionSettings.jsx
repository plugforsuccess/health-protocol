import { useState } from 'react';

// Compact, collapsible settings strip for the train tab.
//
// Reviewer flagged that the +5lb compound bump is too large for some
// athletes (older lifters, recovery, smaller plates). Rather than ship
// a full Settings tab for one knob, this lives inline above the week
// grid — collapsed by default so it doesn't clutter the workout view.

export function ProgressionSettings({ prefs, allowed, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="prog-settings">
      <button
        type="button"
        className="prog-settings-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>⚙ Progression Increments</span>
        <span className="prog-settings-summary">
          Compound +{prefs.compoundIncrement}lb · Isolation +{prefs.isolationIncrement}lb
        </span>
        <span className="prog-settings-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="prog-settings-body">
          <div className="prog-settings-help">
            How much to add when you complete every set last session.
            Lower these if you train with smaller plates or are easing
            back from injury.
          </div>
          <Row
            label="Compound lifts (squat, bench, row, etc.)"
            value={prefs.compoundIncrement}
            allowed={allowed}
            onChange={(v) => onChange({ compoundIncrement: v })}
          />
          <Row
            label="Isolation / rehab (curls, raises, wrist work)"
            value={prefs.isolationIncrement}
            allowed={allowed}
            onChange={(v) => onChange({ isolationIncrement: v })}
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, allowed, onChange }) {
  return (
    <div className="prog-settings-row">
      <div className="prog-settings-label">{label}</div>
      <div className="prog-settings-options">
        {allowed.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`prog-opt${value === opt ? ' selected' : ''}`}
            onClick={() => onChange(opt)}
          >
            +{opt}lb
          </button>
        ))}
      </div>
    </div>
  );
}
