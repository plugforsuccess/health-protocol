import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';
import {
  GUT_SYMPTOMS,
  SYMPTOM_FREQUENCY,
  GUT_SUPPLEMENT_OPTIONS,
  ANTIBIOTIC_HISTORY,
  BOWEL_REGULARITY,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep3GutHealth({ form, update, error }) {
  const hasSymptoms =
    form.gutSymptoms.length > 0 && !form.gutSymptoms.includes('None');

  return (
    <StepShell
      title="Your gut health"
      subtitle="Digestive symptoms tell us a lot about what your body needs."
      error={error}
    >
      <FieldGroup label="Current digestive symptoms">
        <MultiSelect
          name="gut-symptoms"
          options={GUT_SYMPTOMS}
          value={form.gutSymptoms}
          onChange={(v) => update({ gutSymptoms: v })}
          exclusive="None"
        />
      </FieldGroup>

      {hasSymptoms && (
        <FieldGroup label="Symptom frequency">
          <SingleSelect
            name="symptom-frequency"
            options={SYMPTOM_FREQUENCY}
            value={form.symptomFrequency}
            onChange={(v) => update({ symptomFrequency: v })}
          />
        </FieldGroup>
      )}

      <FieldGroup label="Known trigger foods (optional)">
        <textarea
          className="onb-text onb-textarea"
          value={form.triggerFoods}
          onChange={(e) => update({ triggerFoods: e.target.value })}
          placeholder="e.g. gluten, dairy, raw onion, spicy food, caffeine"
          rows={2}
        />
      </FieldGroup>

      <FieldGroup label="Current gut supplements">
        <SingleSelect
          name="has-gut-supps"
          options={['No', 'Yes']}
          value={form.hasGutSupplements === true ? 'Yes' : form.hasGutSupplements === false ? 'No' : null}
          onChange={(v) => update({ hasGutSupplements: v === 'Yes' })}
          columns={2}
        />
      </FieldGroup>

      {form.hasGutSupplements === true && (
        <FieldGroup label="Which gut supplements?">
          <MultiSelect
            name="gut-supplements"
            options={GUT_SUPPLEMENT_OPTIONS}
            value={form.currentGutSupplements}
            onChange={(v) => update({ currentGutSupplements: v })}
          />
          <input
            type="text"
            className="onb-text"
            value={form.gutSupplementOther}
            onChange={(e) => update({ gutSupplementOther: e.target.value })}
            placeholder="Other (type here)"
            style={{ marginTop: 6 }}
          />
        </FieldGroup>
      )}

      <FieldGroup label="Antibiotic use in past 12 months">
        <SingleSelect
          name="antibiotic-history"
          options={ANTIBIOTIC_HISTORY}
          value={form.antibioticHistory}
          onChange={(v) => update({ antibioticHistory: v })}
        />
      </FieldGroup>

      <FieldGroup label="Bowel regularity">
        <SingleSelect
          name="bowel-regularity"
          options={BOWEL_REGULARITY}
          value={form.bowelRegularity}
          onChange={(v) => update({ bowelRegularity: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}
