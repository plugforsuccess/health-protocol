import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';
import {
  COOKING_SKILL,
  WEEKDAY_COOK_TIME,
  WEEKEND_COOK_TIME,
  MEAL_PREP_OPTIONS,
  WEEKLY_BUDGET,
  EATS_OUT_FREQUENCY,
  RESTAURANT_TYPES,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep4CookingReality({ form, update, error }) {
  const showRestaurants =
    form.eatsOut === '3–5x per week' || form.eatsOut === 'Most meals';

  return (
    <StepShell
      title="How you actually cook"
      subtitle="Be honest — we build your plan around your real life, not an ideal one."
      error={error}
    >
      <FieldGroup label="Cooking skill level">
        <SingleSelect
          name="cooking-skill"
          options={COOKING_SKILL}
          value={form.cookingSkill}
          onChange={(v) => update({ cookingSkill: v })}
        />
      </FieldGroup>

      <FieldGroup label="Weekday time available for cooking">
        <SingleSelect
          name="weekday-cook-time"
          options={WEEKDAY_COOK_TIME}
          value={form.weekdayCookTime}
          onChange={(v) => update({ weekdayCookTime: v })}
        />
      </FieldGroup>

      <FieldGroup label="Weekend time available">
        <SingleSelect
          name="weekend-cook-time"
          options={WEEKEND_COOK_TIME}
          value={form.weekendCookTime}
          onChange={(v) => update({ weekendCookTime: v })}
        />
      </FieldGroup>

      <FieldGroup label="Do you meal prep?">
        <SingleSelect
          name="meal-prep"
          options={MEAL_PREP_OPTIONS}
          value={form.mealPreps}
          onChange={(v) => update({ mealPreps: v })}
        />
      </FieldGroup>

      <FieldGroup label="Weekly grocery budget">
        <SingleSelect
          name="weekly-budget"
          options={WEEKLY_BUDGET}
          value={form.weeklyBudget}
          onChange={(v) => update({ weeklyBudget: v })}
        />
      </FieldGroup>

      <FieldGroup label="How often do you eat out?">
        <SingleSelect
          name="eats-out"
          options={EATS_OUT_FREQUENCY}
          value={form.eatsOut}
          onChange={(v) => update({ eatsOut: v })}
        />
      </FieldGroup>

      {showRestaurants && (
        <FieldGroup label="What types of restaurants do you frequent most?">
          <MultiSelect
            name="restaurant-types"
            options={RESTAURANT_TYPES}
            value={form.eatsOutRestaurantTypes}
            onChange={(v) => update({ eatsOutRestaurantTypes: v })}
          />
        </FieldGroup>
      )}
    </StepShell>
  );
}
