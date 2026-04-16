import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import {
  MEALS_PER_DAY,
  INTERMITTENT_FASTING,
  BIGGEST_MEAL,
  LATE_NIGHT_EATING,
  BREAKFAST_EATER,
  DAILY_HYDRATION,
  CAFFEINE_CONSUMPTION,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep6EatingPatterns({ form, update, error }) {
  return (
    <StepShell title="How you eat" error={error}>
      <FieldGroup label="Meals per day">
        <SingleSelect
          name="meals-per-day"
          options={MEALS_PER_DAY}
          value={form.mealsPerDay}
          onChange={(v) => update({ mealsPerDay: v })}
          columns={4}
        />
      </FieldGroup>

      <FieldGroup label="Intermittent fasting">
        <SingleSelect
          name="intermittent-fasting"
          options={INTERMITTENT_FASTING}
          value={form.intermittentFasting}
          onChange={(v) => update({ intermittentFasting: v })}
        />
      </FieldGroup>

      <FieldGroup label="Biggest meal of the day">
        <SingleSelect
          name="biggest-meal"
          options={BIGGEST_MEAL}
          value={form.biggestMeal}
          onChange={(v) => update({ biggestMeal: v })}
          columns={2}
        />
      </FieldGroup>

      <FieldGroup label="Late night eating (after 9pm)">
        <SingleSelect
          name="late-night"
          options={LATE_NIGHT_EATING}
          value={form.lateNightEating}
          onChange={(v) => update({ lateNightEating: v })}
          columns={3}
        />
      </FieldGroup>

      <FieldGroup label="Breakfast eater">
        <SingleSelect
          name="breakfast"
          options={BREAKFAST_EATER}
          value={form.breakfastEater}
          onChange={(v) => update({ breakfastEater: v })}
        />
      </FieldGroup>

      <FieldGroup label="Daily water intake">
        <SingleSelect
          name="hydration"
          options={DAILY_HYDRATION}
          value={form.dailyHydration}
          onChange={(v) => update({ dailyHydration: v })}
          columns={2}
        />
      </FieldGroup>

      <FieldGroup label="Caffeine consumption">
        <SingleSelect
          name="caffeine"
          options={CAFFEINE_CONSUMPTION}
          value={form.caffeineConsumption}
          onChange={(v) => update({ caffeineConsumption: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}
