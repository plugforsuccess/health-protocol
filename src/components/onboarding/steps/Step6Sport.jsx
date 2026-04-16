import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import {
  COMPETITION_STATUS,
  PERFORMANCE_GOALS,
  PRIMARY_SPORT,
} from '../../../lib/onboardingOptions.js';

export function Step6Sport({ form, update, error }) {
  return (
    <StepShell title="What are you training for?" error={error}>
      <FieldGroup label="Primary sport or activity">
        <SingleSelect
          name="primary-sport"
          options={PRIMARY_SPORT}
          value={form.primarySport}
          onChange={(v) => update({ primarySport: v })}
        />
      </FieldGroup>

      <FieldGroup label="Competition or performance event">
        <SingleSelect
          name="competition-status"
          options={COMPETITION_STATUS}
          value={form.competitionStatus}
          onChange={(v) => update({ competitionStatus: v })}
          columns={3}
        />
      </FieldGroup>

      <FieldGroup label="Specific performance goals">
        <MultiSelect
          name="performance-goals"
          options={PERFORMANCE_GOALS}
          value={form.performanceGoals}
          onChange={(v) => update({ performanceGoals: v })}
          exclusive="None"
        />
      </FieldGroup>
    </StepShell>
  );
}
