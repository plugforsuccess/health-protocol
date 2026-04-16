import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import { EQUIPMENT, TRAINING_LOCATION } from '../../../lib/onboardingOptions.js';

export function Step4Equipment({ form, update, error }) {
  return (
    <StepShell title="What do you have to work with?" error={error}>
      <FieldGroup label="Primary training location">
        <SingleSelect
          name="training-location"
          options={TRAINING_LOCATION}
          value={form.trainingLocation}
          onChange={(v) =>
            update({
              trainingLocation: v,
              missingEquipment: v === 'Home Gym' ? form.missingEquipment : '',
            })
          }
        />
      </FieldGroup>

      <FieldGroup label="Available equipment (pick all that apply)">
        <MultiSelect
          name="equipment"
          options={EQUIPMENT}
          value={form.equipment}
          onChange={(v) => update({ equipment: v })}
        />
      </FieldGroup>

      {form.trainingLocation === 'Home Gym' && (
        <FieldGroup label="Any equipment you're missing that you'd like workouts programmed around?">
          <textarea
            className="onb-text onb-textarea"
            rows={2}
            value={form.missingEquipment}
            onChange={(e) => update({ missingEquipment: e.target.value })}
            placeholder="e.g. landmine attachment, GHD, sled"
          />
        </FieldGroup>
      )}
    </StepShell>
  );
}
