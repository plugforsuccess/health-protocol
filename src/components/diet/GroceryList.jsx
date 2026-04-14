import { pantryKey } from '../../hooks/usePantry.js';

/**
 * Grocery list for a prep day. Items tap to toggle "have it" state in the
 * shared Supabase-backed pantry (passed in via `pantry`).
 */
export function GroceryList({ groceries, pantry, onToggle }) {
  if (!groceries) return null;
  const categories = Object.entries(groceries);

  return (
    <>
      {categories.map(([category, items]) => (
        <div key={category} className="grocery-category">
          <div className="grocery-cat-title">{category}</div>
          <div className="grocery-items">
            {items.map((item, i) => {
              const key = pantryKey(item);
              const isHave = pantry ? !!pantry.have[key] : false;
              return (
                <span
                  key={i}
                  className={`grocery-item${isHave ? ' have-it' : ''}`}
                  onClick={() => onToggle?.(item)}
                >
                  <span className="have-dot" />
                  {item}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
