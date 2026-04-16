import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';
import {
  DIET_GOALS,
  DIAGNOSED_CONDITIONS,
  COLONOSCOPY_OPTIONS,
  FAMILY_HISTORY,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep1Goals({ form, update, error }) {
  const secondaryOptions = DIET_GOALS.filter((g) => g !== form.primaryGoal);

  return (
    <StepShell
      title="Your health picture"
      subtitle="This shapes every meal recommendation we make."
      error={error}
    >
      <FieldGroup label="Primary diet goal">
        <SingleSelect
          name="primary-diet-goal"
          options={DIET_GOALS}
          value={form.primaryGoal}
          onChange={(v) =>
            update({
              primaryGoal: v,
              secondaryGoal: form.secondaryGoal === v ? null : form.secondaryGoal,
            })
          }
        />
      </FieldGroup>

      <FieldGroup label="Secondary diet goal (optional)">
        <SingleSelect
          name="secondary-diet-goal"
          options={secondaryOptions}
          value={form.secondaryGoal}
          onChange={(v) =>
            update({ secondaryGoal: form.secondaryGoal === v ? null : v })
          }
        />
      </FieldGroup>

      <FieldGroup label="Diagnosed conditions relevant to diet">
        <MultiSelect
          name="conditions"
          options={DIAGNOSED_CONDITIONS}
          value={form.conditions}
          onChange={(v) => update({ conditions: v })}
          exclusive="None"
        />
      </FieldGroup>

      <FieldGroup label="Colonoscopy or GI procedure planned">
        <SingleSelect
          name="colonoscopy"
          options={COLONOSCOPY_OPTIONS}
          value={form.colonoscopyPlanned}
          onChange={(v) => update({ colonoscopyPlanned: v })}
        />
      </FieldGroup>

      <FieldGroup label="Family history">
        <MultiSelect
          name="family-history"
          options={FAMILY_HISTORY}
          value={form.familyHistory}
          onChange={(v) => update({ familyHistory: v })}
          exclusive="None"
        />
      </FieldGroup>

      <FieldGroup label="Medications that interact with food">
        <SingleSelect
          name="food-medications"
          options={['No', 'Yes']}
          value={form.hasFoodMedications === true ? 'Yes' : form.hasFoodMedications === false ? 'No' : null}
          onChange={(v) => update({ hasFoodMedications: v === 'Yes' })}
          columns={2}
        />
      </FieldGroup>

      {form.hasFoodMedications === true && (
        <FieldGroup
          label="Which medications?"
          hint="e.g. statins (grapefruit), blood thinners (vitamin K), MAOIs (tyramine foods), metformin"
        >
          <input
            type="text"
            className="onb-text"
            value={form.foodMedications}
            onChange={(e) => update({ foodMedications: e.target.value })}
            placeholder="e.g. statins, blood thinners"
          />
        </FieldGroup>
      )}

      {form.hasFoodMedications === true && (
        <div className="onb-banner warn">
          Some medications require specific dietary awareness. We'll flag
          relevant interactions in your meal plan.
        </div>
      )}
    </StepShell>
  );
}
