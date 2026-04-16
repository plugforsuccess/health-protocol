// 0–10 pain scale slider with a numeric badge. Stays accessible — under
// the hood it's a native range input so screen readers and keyboard users
// get standard slider semantics.

const COLOR_BY_PAIN = (n) => {
  if (n >= 8) return '#ef4444'; // red
  if (n >= 5) return '#f59e0b'; // amber
  if (n >= 2) return '#facc15'; // yellow
  return '#22c55e';             // green
};

export function PainSlider({ label, value = 0, onChange, id }) {
  const v = Number.isFinite(value) ? value : 0;
  const color = COLOR_BY_PAIN(v);
  return (
    <div className="onb-pain-slider">
      <div className="onb-pain-row">
        <label className="onb-pain-label" htmlFor={id}>
          {label}
        </label>
        <span className="onb-pain-badge" style={{ background: color, color: '#0a0a0f' }}>
          {v} / 10
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={v}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="onb-pain-input"
        style={{ accentColor: color }}
      />
      <div className="onb-pain-scale">
        <span>0 — none</span>
        <span>5 — moderate</span>
        <span>10 — worst</span>
      </div>
    </div>
  );
}
