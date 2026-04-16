import { FieldGroup, StepShell } from '../../components/StepShell.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';
import { KITCHEN_EQUIPMENT } from '../../../../lib/dietOnboardingOptions.js';

export function DietStep5Equipment({ form, update, error }) {
  return (
    <StepShell title="Your kitchen setup" error={error}>
      <FieldGroup label="What do you have? (select all that apply)">
        <MultiSelect
          name="kitchen-equipment"
          options={KITCHEN_EQUIPMENT}
          value={form.kitchenEquipment}
          onChange={(v) => update({ kitchenEquipment: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}
