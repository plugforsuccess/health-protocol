import { useCallback, useMemo, useState } from 'react';
import { useProfile } from '../../lib/profileContext.jsx';
import { WEEK_MEALS } from '../../data/weekMeals.js';
import { DateBar } from '../shared/DateBar.jsx';
import { AvoidBanner } from '../diet/AvoidBanner.jsx';
import { BenefitLegend } from '../diet/BenefitLegend.jsx';
import { DayTabs } from '../diet/DayTabs.jsx';
import { MealCard } from '../diet/MealCard.jsx';
import { PrepMode } from '../diet/PrepMode.jsx';
import { RecipeModal } from '../diet/RecipeModal.jsx';
import { EquipmentSection } from '../diet/EquipmentSection.jsx';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function defaultDayIdx() {
  const i = new Date().getDay(); // 0=Sun..6=Sat
  return Math.max(0, Math.min(6, i));
}

// Map AI benefit tags to the short codes used by MealCard/BenefitLegend
function mapBenefits(benefits) {
  if (!benefits) return [];
  const map = {
    'anti-inflammatory': 'anti',
    'high-fiber': 'fiber',
    'cancer-protective': 'cancer',
    'gut-healing': 'anti',
    'muscle-building': 'anti',
  };
  return benefits.map((b) => map[b] || b);
}

// Convert AI plan_data.days to the WEEK_MEALS format
function aiPlanToWeekMeals(planData) {
  if (!planData?.days?.length) return null;
  return DAY_NAMES.map((dayName, i) => {
    const aiDay = planData.days.find((d) => d.day === dayName) || planData.days[i];
    if (!aiDay) return { day: DAY_SHORT[i], label: dayName, meals: [] };
    return {
      day: DAY_SHORT[i],
      label: dayName,
      meals: (aiDay.meals || []).map((m) => ({
        time: m.time,
        name: m.name,
        benefits: mapBenefits(m.benefits),
        ingredients: m.ingredients || [],
        prep: m.prep || '',
        protocolNote: m.protocolNote,
        recipe: m.recipe || null,
      })),
    };
  });
}

export function DietPanel({ active, pantry, onTogglePantry, onClearPantry, onPantryError }) {
  const { activeMealPlan, dietProfile } = useProfile();
  const [prepMode, setPrepMode] = useState(false);
  const [dayIdx, setDayIdx] = useState(defaultDayIdx());
  const [activeMeal, setActiveMeal] = useState(null);

  const weekMeals = useMemo(() => {
    if (activeMealPlan?.plan_data) {
      return aiPlanToWeekMeals(activeMealPlan.plan_data) || WEEK_MEALS;
    }
    return WEEK_MEALS;
  }, [activeMealPlan]);

  const hasPersonalPlan = !!activeMealPlan?.plan_data;
  const needsProfile = !dietProfile?.onboarding_completed;

  const day = weekMeals[dayIdx];

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
