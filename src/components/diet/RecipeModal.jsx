import { useEffect } from 'react';
import { RECIPES } from '../../data/recipes.js';

/**
 * Bottom-sheet recipe modal. Open when `meal` is non-null.
 * Falls back to meal.prep as a single step when the recipe name isn't in RECIPES.
 */
export function RecipeModal({ meal, onClose }) {
  // Close on Escape + lock body scroll when open
  useEffect(() => {
    if (!meal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [meal, onClose]);

  if (!meal) return null;

  const recipe = RECIPES[meal.name] || null;
  const ingredients = recipe?.ingredients || meal.ingredients || [];

  const overlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay open" onClick={overlayClick} role="dialog" aria-modal="true">
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title-row">
            <span className={`modal-time-badge ${meal.time}`}>{meal.time}</span>
            <div className="modal-title">{meal.name}</div>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close recipe"
            >
              ✕
            </button>
          </div>
          {(recipe?.time || recipe?.equipment) && (
            <div className="modal-meta">
              {recipe?.time && <div className="modal-meta-item">⏱ {recipe.time}</div>}
              {recipe?.equipment && <div className="modal-meta-item">🍳 {recipe.equipment}</div>}
            </div>
          )}
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-section-title">Ingredients</div>
            <div className="modal-ingredients">
              {ingredients.map((ing, i) => (
                <IngredientTag key={i} raw={ing} />
              ))}
            </div>
          </div>

          {recipe?.equipList?.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Equipment Needed</div>
              <div className="modal-equip-list">
                {recipe.equipList.map((e, i) => (
                  <span key={i} className="modal-equip-item">
                    🍳 {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">Step by Step</div>
            <div className="modal-steps">
              {recipe?.steps?.length ? (
                recipe.steps.map((s, i) => (
                  <div key={i} className="modal-step">
                    <div className="modal-step-num">{i + 1}</div>
                    <div className="modal-step-content">
                      <div className="modal-step-title">{s.title}</div>
                      <div className="modal-step-desc">{s.desc}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="modal-step">
                  <div className="modal-step-num">1</div>
                  <div className="modal-step-content">
                    <div className="modal-step-desc">{meal.prep}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {recipe?.tip && (
            <div className="modal-section">
              <div className="modal-tip-box">
                <div className="modal-tip-title">Timing Tip</div>
                <div className="modal-tip-text">{recipe.tip}</div>
              </div>
            </div>
          )}

          {recipe?.why && (
            <div className="modal-section">
              <div className="modal-why-box">
                <div className="modal-why-title">Why This Meal</div>
                <div className="modal-why-text">{recipe.why}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Split a quantity prefix (number/fraction + optional unit) from the ingredient name. */
function IngredientTag({ raw }) {
  const fractionChars = '½¼¾⅓⅔';
  const firstChar = raw.charAt(0);
  const hasQuantity = /\d/.test(firstChar) || fractionChars.includes(firstChar);

  if (!hasQuantity) return <span className="modal-ingredient">{raw}</span>;

  const tokens = raw.split(/\s+/);
  const units = new Set(['oz', 'tbsp', 'tsp', 'cup', 'cups', 'lb', 'lbs', 'g', 'ml']);
  let portion = tokens[0];
  let rest = tokens.slice(1);
  if (rest.length > 0 && units.has(rest[0].toLowerCase())) {
    portion += ' ' + rest[0];
    rest = rest.slice(1);
  }

  return (
    <span className="modal-ingredient">
      <span className="ing-portion">{portion}</span>
      {rest.length > 0 ? ' ' + rest.join(' ') : ''}
    </span>
  );
}
