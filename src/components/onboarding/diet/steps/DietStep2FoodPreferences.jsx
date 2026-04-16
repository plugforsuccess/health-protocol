import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';
import {
  DIETARY_FRAMEWORKS,
  FOOD_ALLERGIES,
  FOOD_INTOLERANCES,
  RED_MEAT_FREQUENCY,
  ALCOHOL_FREQUENCY,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep2FoodPreferences({ form, update, error }) {
  return (
    <StepShell title="What you eat" error={error}>
      <FieldGroup label="Dietary framework">
        <SingleSelect
          name="dietary-framework"
          options={DIETARY_FRAMEWORKS}
          value={form.dietaryFramework}
          onChange={(v) => update({ dietaryFramework: v })}
        />
      </FieldGroup>

      <FieldGroup label="Food allergies">
        <MultiSelect
          name="allergies"
          options={FOOD_ALLERGIES}
          value={form.allergies}
          onChange={(v) => update({ allergies: v })}
          exclusive="None"
        />
      </FieldGroup>

      <FieldGroup label="Food intolerances">
        <MultiSelect
          name="intolerances"
          options={FOOD_INTOLERANCES}
          value={form.intolerances}
          onChange={(v) => update({ intolerances: v })}
          exclusive="None"
        />
      </FieldGroup>

      <FieldGroup label="Foods you strongly dislike (optional)">
        <textarea
          className="onb-text onb-textarea"
          value={form.foodDislikes}
          onChange={(e) => update({ foodDislikes: e.target.value })}
          placeholder="e.g. cilantro, mushrooms, blue cheese, liver"
          rows={2}
        />
      </FieldGroup>

      <FieldGroup label="Foods you eat regularly and enjoy (optional)">
        <textarea
          className="onb-text onb-textarea"
          value={form.foodPreferences}
          onChange={(e) => update({ foodPreferences: e.target.value })}
          placeholder="e.g. salmon, sweet potatoes, eggs, avocado"
          rows={2}
        />
      </FieldGroup>

      <FieldGroup label="Red meat frequency">
        <SingleSelect
          name="red-meat"
          options={RED_MEAT_FREQUENCY}
          value={form.redMeatFrequency}
          onChange={(v) => update({ redMeatFrequency: v })}
        />
      </FieldGroup>

      <FieldGroup label="Alcohol consumption">
        <SingleSelect
          name="alcohol"
          options={ALCOHOL_FREQUENCY}
          value={form.alcoholFrequency}
          onChange={(v) => update({ alcoholFrequency: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}
