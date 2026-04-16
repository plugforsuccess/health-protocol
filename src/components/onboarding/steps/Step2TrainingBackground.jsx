import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import {
  ACTIVITY_LEVEL,
  SPORT_BACKGROUND,
  TRAINING_EXPERIENCE,
} from '../../../lib/onboardingOptions.js';

const YES_NO = [
  { id: true,  label: 'Yes' },
  { id: false, label: 'No' },
];

export function Step2TrainingBackground({ form, update, error }) {
  return (
    <StepShell title="Your training history" error={error}>
      <FieldGroup label="Training experience">
        <SingleSelect
          name="training-experience"
          options={TRAINING_EXPERIENCE}
          value={form.trainingExperience}
          onChange={(v) => update({ trainingExperience: v })}
        />
      </FieldGroup>

      <FieldGroup label="Former athlete?">
        <SingleSelect
          name="former-athlete"
          options={YES_NO}
          value={form.formerAthlete}
          onChange={(v) =>
            update({
              formerAthlete: v,
              // Discard sport list if they flip back to "No".
              sportBackground: v === false ? [] : form.sportBackground,
            })
          }
          columns={2}
        />
      </FieldGroup>

      {form.formerAthlete === true && (
        <FieldGroup label="Sport background (pick all that apply)">
          <MultiSelect
            name="sport-background"
            options={SPORT_BACKGROUND}
            value={form.sportBackground}
            onChange={(v) => update({ sportBackground: v })}
          />
        </FieldGroup>
      )}

      <FieldGroup label="Current activity level">
        <SingleSelect
          name="activity-level"
          options={ACTIVITY_LEVEL}
          value={form.activityLevel}
          onChange={(v) => update({ activityLevel: v })}
        />
      </FieldGroup>

      <FieldGroup label="What has worked for you before? (optional)">
        <textarea
          className="onb-text onb-textarea"
          rows={3}
          value={form.trainingHistoryNotes}
          onChange={(e) => update({ trainingHistoryNotes: e.target.value })}
          placeholder="e.g. high volume upper/lower split, CrossFit, etc."
        />
      </FieldGroup>
    </StepShell>
  );
}
