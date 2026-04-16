import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import {
  AVG_SLEEP,
  DAYS_PER_WEEK,
  RECOVERY_LEVEL,
  SESSION_DURATION,
  STRESS_LEVEL,
  TRAVEL_EQUIPMENT,
  TRAVEL_FREQUENCY,
  WEEKDAYS,
} from '../../../lib/onboardingOptions.js';

const TRAVEL_FOLLOWUP = new Set(['1–2x per month', 'Weekly', 'Most of the time']);

export function Step5Schedule({ form, update, error }) {
  return (
    <StepShell title="Let's build your schedule" error={error}>
      <FieldGroup label="Days available per week">
        <SingleSelect
          name="days-per-week"
          options={DAYS_PER_WEEK.map((n) => ({ id: n, label: String(n) }))}
          value={form.daysPerWeek}
          onChange={(v) => update({ daysPerWeek: v })}
          columns={5}
        />
      </FieldGroup>

      <FieldGroup label="Preferred training days">
        <MultiSelect
          name="preferred-days"
          options={WEEKDAYS}
          value={form.preferredDays}
          onChange={(v) => update({ preferredDays: v })}
        />
      </FieldGroup>

      <FieldGroup label="Session duration">
        <SingleSelect
          name="session-duration"
          options={SESSION_DURATION}
          value={form.sessionDuration}
          onChange={(v) => update({ sessionDuration: v })}
          columns={4}
        />
      </FieldGroup>

      <FieldGroup label="Average sleep">
        <SingleSelect
          name="avg-sleep"
          options={AVG_SLEEP}
          value={form.avgSleep}
          onChange={(v) => update({ avgSleep: v })}
          columns={2}
        />
      </FieldGroup>

      <FieldGroup label="Current stress level">
        <SingleSelect
          name="stress-level"
          options={STRESS_LEVEL}
          value={form.stressLevel}
          onChange={(v) => update({ stressLevel: v })}
          columns={2}
        />
      </FieldGroup>

      <FieldGroup label="Recovery between sessions">
        <SingleSelect
          name="recovery-level"
          options={RECOVERY_LEVEL}
          value={form.recoveryLevel}
          onChange={(v) => update({ recoveryLevel: v })}
        />
      </FieldGroup>

      <FieldGroup label="Travel frequency">
        <SingleSelect
          name="travel-frequency"
          options={TRAVEL_FREQUENCY}
          value={form.travelFrequency}
          onChange={(v) =>
            update({
              travelFrequency: v,
              travelEquipmentAccess: TRAVEL_FOLLOWUP.has(v)
                ? form.travelEquipmentAccess
                : null,
            })
          }
        />
      </FieldGroup>

      {TRAVEL_FOLLOWUP.has(form.travelFrequency) && (
        <FieldGroup label="When you travel, what do you typically have access to?">
          <SingleSelect
            name="travel-equipment"
            options={TRAVEL_EQUIPMENT}
            value={form.travelEquipmentAccess}
            onChange={(v) => update({ travelEquipmentAccess: v })}
          />
        </FieldGroup>
      )}
    </StepShell>
  );
}
