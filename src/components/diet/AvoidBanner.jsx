import { AVOID_FOODS } from '../../data/avoidFoods.js';

export function AvoidBanner() {
  return (
    <div className="avoid-banner">
      <div className="avoid-title">⚠ AVOID COMPLETELY</div>
      <div className="avoid-grid">
        {AVOID_FOODS.map((f, i) => (
          <span key={i} className="avoid-pill">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
