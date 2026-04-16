import { BODY_REGIONS } from '../../../lib/onboardingOptions.js';

// Tappable grid of body region buttons. We deliberately use a button grid
// instead of an SVG silhouette — buttons are accessible by default, render
// crisply across screen sizes, and the labels (Left/Right) are explicit
// rather than relying on the user to remember anatomical orientation.

export function BodyRegionSelector({ value = [], onChange }) {
  const toggle = (id) => {
    const set = new Set(value);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange(Array.from(set));
  };

  return (
    <div className="onb-body-grid">
      {BODY_REGIONS.map((r) => {
        const selected = value.includes(r.id);
        return (
          <button
            type="button"
            key={r.id}
            onClick={() => toggle(r.id)}
            className={`onb-body-cell${selected ? ' selected' : ''}`}
            aria-pressed={selected}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
