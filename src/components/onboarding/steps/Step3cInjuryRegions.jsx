import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { BodyRegionSelector } from '../components/BodyRegionSelector.jsx';

const YES_NO = [
  { id: true,  label: 'Yes' },
  { id: false, label: 'No' },
];

export function Step3cInjuryRegions({ form, update, error }) {
  const handleHasInjury = (v) => {
    if (v === false) {
      // Clear any previously entered injury data so we don't accidentally
      // save stale rows.
      update({ hasInjuries: false, injuryRegions: [], injuriesByRegion: {} });
    } else {
      update({ hasInjuries: v });
    }
  };

  const handleRegions = (next) => {
    // Drop injury detail data for regions that were just deselected so
    // a checkbox flip doesn't leave orphan answers in state.
    const trimmed = {};
    for (const id of next) {
      if (form.injuriesByRegion[id]) trimmed[id] = form.injuriesByRegion[id];
    }
    update({ injuryRegions: next, injuriesByRegion: trimmed });
  };

  return (
    <StepShell
      title="Tell us about your body"
      subtitle="This is the most important section. Be honest — we use this to protect you."
      error={error}
    >
      <FieldGroup label="Do you have any current injuries or chronic pain?">
        <SingleSelect
          name="has-injuries"
          options={YES_NO}
          value={form.hasInjuries}
          onChange={handleHasInjury}
          columns={2}
        />
      </FieldGroup>

      {form.hasInjuries === true && (
        <FieldGroup
          label="Tap every region that's affected"
          hint="You'll fill in details for each one on the next screens."
        >
          <BodyRegionSelector value={form.injuryRegions} onChange={handleRegions} />
        </FieldGroup>
      )}
    </StepShell>
  );
}
