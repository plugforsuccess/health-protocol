export function PhasePills({ tab, phases, onPillClick }) {
  const doneClass = `done-${tab}`;
  return (
    <div className="phase-pills">
      {phases.map((p) => (
        <button
          key={p.key}
          type="button"
          className={`phase-pill${p.done ? ` ${doneClass}` : ''}`}
          onClick={() => onPillClick(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
