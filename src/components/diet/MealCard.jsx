/**
 * Meal card — tap anywhere to open the recipe modal (replaces the legacy
 * inline drawer). Optional onOpenChat callback adds a small chat icon for
 * asking the nutrition coach about this specific meal.
 */
export function MealCard({ meal, onOpen, onOpenChat }) {
  return (
    <div className="meal-card">
      <div className="meal-header" onClick={() => onOpen(meal)}>
        <span className={`meal-time-badge ${meal.time}`}>{meal.time}</span>
        <div className="meal-name">{meal.name}</div>
        <div className="benefit-dots">
          {(meal.benefits || []).map((b, i) => (
            <span key={i} className={`benefit-dot ${b}`} />
          ))}
        </div>
        {onOpenChat && (
          <button
            type="button"
            className="meal-coach-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(meal);
            }}
            aria-label="Ask nutritionist about this meal"
          >
            💬
          </button>
        )}
        <button
          type="button"
          className="expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(meal);
          }}
          aria-label="Open recipe"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <polyline
              points="4,2.5 9,6.5 4,10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
