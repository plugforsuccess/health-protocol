import { useCallback, useState } from 'react';
import { WEEK_MEALS } from '../../data/weekMeals.js';
import { DateBar } from '../shared/DateBar.jsx';
import { AvoidBanner } from '../diet/AvoidBanner.jsx';
import { BenefitLegend } from '../diet/BenefitLegend.jsx';
import { DayTabs } from '../diet/DayTabs.jsx';
import { MealCard } from '../diet/MealCard.jsx';
import { PrepMode } from '../diet/PrepMode.jsx';
import { RecipeModal } from '../diet/RecipeModal.jsx';
import { EquipmentSection } from '../diet/EquipmentSection.jsx';

function defaultDayIdx() {
  const i = new Date().getDay(); // 0=Sun..6=Sat, matches WEEK_MEALS ordering
  return Math.max(0, Math.min(6, i));
}

export function DietPanel({ active, pantry, onTogglePantry, onClearPantry, onPantryError }) {
  const [prepMode, setPrepMode] = useState(false);
  const [dayIdx, setDayIdx] = useState(defaultDayIdx());
  const [activeMeal, setActiveMeal] = useState(null);

  const day = WEEK_MEALS[dayIdx];

  const handleTogglePantry = useCallback(
    (item) => {
      onTogglePantry(item).catch((e) => onPantryError?.(e));
    },
    [onTogglePantry, onPantryError]
  );

  const handleClearPantry = useCallback(() => {
    if (!confirm('Clear all "have it" marks?')) return;
    onClearPantry().catch((e) => onPantryError?.(e));
  }, [onClearPantry, onPantryError]);

  return (
    <>
      <div className={`panel${active ? ' active' : ''}`} id="panel-diet">
        <div className="wrap">
          <DateBar />
          <AvoidBanner />

          <div className="week-nav">
            <div className="week-nav-top">
              <div className="week-label">
                {prepMode ? 'MEAL PREP MODE' : day?.label || 'Week Plan'}
              </div>
              <button
                type="button"
                className={`prep-btn${prepMode ? ' active' : ''}`}
                onClick={() => setPrepMode((v) => !v)}
              >
                {prepMode ? '← MEALS' : 'PREP MODE →'}
              </button>
            </div>
            {!prepMode && <DayTabs activeIdx={dayIdx} onSelect={setDayIdx} />}
          </div>

          {!prepMode ? (
            <>
              <BenefitLegend />
              {(day?.meals || []).map((meal, i) => (
                <MealCard key={i} meal={meal} onOpen={setActiveMeal} />
              ))}
              <EquipmentSection />
            </>
          ) : (
            <PrepMode
              initialIdx={dayIdx}
              pantry={pantry}
              onTogglePantry={handleTogglePantry}
              onClearPantry={handleClearPantry}
            />
          )}
        </div>
      </div>

      {active && <RecipeModal meal={activeMeal} onClose={() => setActiveMeal(null)} />}
    </>
  );
}
