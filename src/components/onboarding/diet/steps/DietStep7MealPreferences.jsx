import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';
import {
  MEAL_VARIETY,
  CUISINE_PREFERENCES,
  SPICE_TOLERANCE,
  SNACKER_OPTIONS,
  MEAL_PREP_STYLE,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep7MealPreferences({ form, update, error }) {
  return (
    <StepShell title="Your meal preferences" error={error}>
      <FieldGroup label="Meal variety preference">
        <SingleSelect
          name="meal-variety"
          options={MEAL_VARIETY}
          value={form.mealVariety}
          onChange={(v) => update({ mealVariety: v })}
        />
      </FieldGroup>

      <FieldGroup label="Cuisine preferences">
        <MultiSelect
          name="cuisine"
          options={CUISINE_PREFERENCES}
          value={form.cuisinePreferences}
          onChange={(v) => update({ cuisinePreferences: v })}
          exclusive="No preference"
        />
      </FieldGroup>

      <FieldGroup label="Spice tolerance">
        <SingleSelect
          name="spice"
          options={SPICE_TOLERANCE}
          value={form.spiceTolerance}
          onChange={(v) => update({ spiceTolerance: v })}
          columns={4}
        />
      </FieldGroup>

      <FieldGroup label="Snacker or not">
        <SingleSelect
          name="snacker"
          options={SNACKER_OPTIONS}
          value={form.snacker}
          onChange={(v) => update({ snacker: v })}
        />
      </FieldGroup>

      <FieldGroup label="Meal prep style">
        <SingleSelect
          name="meal-prep-style"
          options={MEAL_PREP_STYLE}
          value={form.mealPrepStyle}
          onChange={(v) => update({ mealPrepStyle: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}
