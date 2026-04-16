import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import { PainSlider } from '../components/PainSlider.jsx';
import {
  AGGRAVATING_MOVEMENTS,
  BODY_REGION_LABEL,
  INJURY_DURATIONS,
  INJURY_TRAJECTORIES,
  INJURY_TYPES,
  PHYSICIAN_CLEARED,
} from '../../../lib/onboardingOptions.js';

const YES_NO = [
  { id: true,  label: 'Yes' },
  { id: false, label: 'No' },
];

const DEFAULT = {
  injury_type: null,
  injury_duration: null,
  injury_trajectory: null,
  pain_at_rest: 0,
  pain_during_exercise: 0,
  aggravating_movements: [],
  physician_cleared: null,
  in_physical_therapy: false,
};

export function Step3dInjuryDetail({ regionId, form, updateInjury, error }) {
  const data = form.injuriesByRegion[regionId] || DEFAULT;
  const label = BODY_REGION_LABEL[regionId] || 'Region';
  const set = (patch) => updateInjury(regionId, patch);

  return (
    <StepShell
      title={`${label} — tell us more`}
      subtitle="All of these are optional. Skip anything you'd rather not answer."
      error={error}
    >
      <FieldGroup label="Type">
        <SingleSelect
          name="injury-type"
          options={INJURY_TYPES}
          value={data.injury_type}
          onChange={(v) => set({ injury_type: v })}
        />
      </FieldGroup>

      <FieldGroup label="How long have you had this injury?">
        <SingleSelect
          name="injury-duration"
          options={INJURY_DURATIONS}
          value={data.injury_duration}
          onChange={(v) => set({ injury_duration: v })}
        />
      </FieldGroup>

      <FieldGroup label="How is it trending?">
        <SingleSelect
          name="injury-trajectory"
          options={INJURY_TRAJECTORIES}
          value={data.injury_trajectory}
          onChange={(v) => set({ injury_trajectory: v })}
          columns={3}
        />
      </FieldGroup>

      <FieldGroup>
        <PainSlider
          id={`pain-rest-${regionId}`}
          label="Pain level at rest"
          value={data.pain_at_rest}
          onChange={(v) => set({ pain_at_rest: v })}
        />
      </FieldGroup>

      <FieldGroup>
        <PainSlider
          id={`pain-ex-${regionId}`}
          label="Pain level during exercise"
          value={data.pain_during_exercise}
          onChange={(v) => set({ pain_during_exercise: v })}
        />
      </FieldGroup>

      <FieldGroup label="What makes it worse?">
        <MultiSelect
          name="aggravating"
          options={AGGRAVATING_MOVEMENTS}
          value={data.aggravating_movements}
          onChange={(v) => set({ aggravating_movements: v })}
          exclusive="none"
        />
      </FieldGroup>

      <FieldGroup label="Cleared by a physician?">
        <SingleSelect
          name="physician-cleared"
          options={PHYSICIAN_CLEARED}
          value={data.physician_cleared}
          onChange={(v) => set({ physician_cleared: v })}
          columns={3}
        />
      </FieldGroup>

      <FieldGroup label="Currently in physical therapy?">
        <SingleSelect
          name="in-pt"
          options={YES_NO}
          value={data.in_physical_therapy}
          onChange={(v) => set({ in_physical_therapy: v })}
          columns={2}
        />
      </FieldGroup>
    </StepShell>
  );
}
