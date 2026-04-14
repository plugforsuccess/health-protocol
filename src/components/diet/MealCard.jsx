import { useState } from 'react';

export function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`meal-card${open ? ' open' : ''}`}>
      <div className="meal-header" onClick={() => setOpen((v) => !v)}>
        <span className={`meal-time-badge ${meal.time}`}>{meal.time}</span>
        <div className="meal-name">{meal.name}</div>
        <div className="benefit-dots">
          {(meal.benefits || []).map((b, i) => (
            <span key={i} className={`benefit-dot ${b}`} />
          ))}
        </div>
        <button
          type="button"
          className="expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <polyline
              points="2.5,4.5 6.5,8.5 10.5,4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="meal-drawer">
        <div className="meal-drawer-inner">
          <div className="ingredient-list">
            {(meal.ingredients || []).map((ing, i) => (
              <span key={i} className="ingredient-tag">
                {ing}
              </span>
            ))}
          </div>
          <div className="meal-prep-note">{meal.prep}</div>
        </div>
      </div>
    </div>
  );
}
