// Reusable radio-style single-select. Renders a vertical list of large
// tap targets so the questionnaire feels comfortable on mobile.
//
// Options can be either a list of plain strings (value === label) or
// a list of { id, label } objects. Selection is identified by value
// equality on `id` (or the string itself).

export function SingleSelect({ options, value, onChange, name, columns = 1 }) {
  const opts = options.map((o) =>
    typeof o === 'string' ? { id: o, label: o } : o
  );
  return (
    <div
      className="onb-singleselect"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={name}
    >
      {opts.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            type="button"
            key={String(opt.id)}
            className={`onb-option${selected ? ' selected' : ''}`}
            onClick={() => onChange(opt.id)}
            role="radio"
            aria-checked={selected}
          >
            <span className="onb-option-radio" aria-hidden="true">
              {selected ? <span className="onb-option-dot" /> : null}
            </span>
            <span className="onb-option-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
