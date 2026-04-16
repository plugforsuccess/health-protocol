import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { SingleSelect } from '../../components/SingleSelect.jsx';
import {
  PROTEIN_POWDER,
  SUPPLEMENT_WILLINGNESS,
  SUPPLEMENT_BUDGET,
} from '../../../../lib/dietOnboardingOptions.js';

export function DietStep8Supplements({ form, update, error }) {
  return (
    <StepShell title="Supplements & nutrition" error={error}>
      <FieldGroup label="Currently taking any supplements?">
        <SingleSelect
          name="has-supplements"
          options={['No', 'Yes']}
          value={form.hasCurrentSupplements === true ? 'Yes' : form.hasCurrentSupplements === false ? 'No' : null}
          onChange={(v) => update({ hasCurrentSupplements: v === 'Yes' })}
          columns={2}
        />
      </FieldGroup>

      {form.hasCurrentSupplements === true && (
        <FieldGroup label="Which supplements?">
          <textarea
            className="onb-text onb-textarea"
            value={form.currentSupplements}
            onChange={(e) => update({ currentSupplements: e.target.value })}
            placeholder="e.g. vitamin D, fish oil, protein powder, creatine"
            rows={2}
          />
        </FieldGroup>
      )}

      <FieldGroup label="Protein powder user">
        <SingleSelect
          name="protein-powder"
          options={PROTEIN_POWDER}
          value={form.proteinPowder}
          onChange={(v) => update({ proteinPowder: v })}
        />
      </FieldGroup>

      <FieldGroup label="Willingness to supplement">
        <SingleSelect
          name="supplement-willingness"
          options={SUPPLEMENT_WILLINGNESS}
          value={form.supplementWillingness}
          onChange={(v) => update({ supplementWillingness: v })}
        />
      </FieldGroup>

      <FieldGroup label="Monthly supplement budget">
        <SingleSelect
          name="supplement-budget"
          options={SUPPLEMENT_BUDGET}
          value={form.supplementBudget}
          onChange={(v) => update({ supplementBudget: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}
