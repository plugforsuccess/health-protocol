// Reusable chip-style multi-select. Selection is an array of option ids;
// onChange fires with the next array on every toggle. Use the optional
// `exclusive` prop to make a single id (e.g. "None") clear all others
// when picked, and vice-versa — the standard "None of the above" pattern.

export function MultiSelect({
  options,
  value = [],
  onChange,
  exclusive = null,
  name,
}) {
  const opts = options.map((o) =>
    typeof o === 'string' ? { id: o, label: o } : o
  );

  const toggle = (id) => {
    const set = new Set(value);
    if (set.has(id)) {
      set.delete(id);
    } else {
      if (exclusive && id === exclusive) {
        // Picking the exclusive option clears everything else.
        onChange([id]);
        return;
      }
      if (exclusive) set.delete(exclusive);
      set.add(id);
    }
    onChange(Array.from(set));
  };

  return (
    <div className="onb-multiselect" role="group" aria-label={name}>
      {opts.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <button
            type="button"
            key={String(opt.id)}
            className={`onb-chip${selected ? ' selected' : ''}`}
            onClick={() => toggle(opt.id)}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
