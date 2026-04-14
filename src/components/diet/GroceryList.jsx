import { useState } from 'react';

/**
 * Grocery list for a given prep day. Categories come from DAY_PREP[idx].groceries.
 * "Have it" toggles are local UI state (pantry), not synced to Supabase.
 */
export function GroceryList({ groceries }) {
  const [haveIt, setHaveIt] = useState({});

  if (!groceries) return null;

  const categories = Object.entries(groceries);

  return (
    <>
      {categories.map(([category, items]) => (
        <div key={category} className="grocery-category">
          <div className="grocery-cat-title">{category}</div>
          <div className="grocery-items">
            {items.map((item, i) => {
              const key = `${category}::${item}`;
              const isHave = !!haveIt[key];
              return (
                <span
                  key={i}
                  className={`grocery-item${isHave ? ' have-it' : ''}`}
                  onClick={() =>
                    setHaveIt((prev) => {
                      const next = { ...prev };
                      if (next[key]) delete next[key];
                      else next[key] = true;
                      return next;
                    })
                  }
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
