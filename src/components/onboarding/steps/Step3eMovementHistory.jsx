import { FieldGroup, StepShell } from '../components/StepShell.jsx';

export function Step3eMovementHistory({ form, update, error }) {
  return (
    <StepShell
      title="Movement history"
      subtitle="Optional, but it helps us route around exercises that hurt you in the past."
      error={error}
    >
      <FieldGroup label="Are there any exercises you cannot or should not perform?">
        <textarea
          className="onb-text onb-textarea"
          rows={3}
          value={form.excludedExercises}
          onChange={(e) => update({ excludedExercises: e.target.value })}
          placeholder="e.g. no barbell back squat, no overhead press, no running"
        />
      </FieldGroup>

      <FieldGroup label="Any exercises that have caused injury in the past?">
        <textarea
          className="onb-text onb-textarea"
          rows={3}
          value={form.injuryCausingExercises}
          onChange={(e) => update({ injuryCausingExercises: e.target.value })}
          placeholder="e.g. barbell bench press hurt my shoulder, box jumps flare my knee"
        />
      </FieldGroup>
    </StepShell>
  );
}
