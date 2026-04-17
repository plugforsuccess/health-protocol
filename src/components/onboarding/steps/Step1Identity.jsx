import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import {
  BIOLOGICAL_SEX,
  DOMINANT_HAND,
  PRIMARY_GOALS,
} from '../../../lib/onboardingOptions.js';

// Step 1 — Identity & Goals.
// Required fields (validated by useOnboarding): firstName, age, biologicalSex,
// height, weight, primary goal. Secondary goal and dominant hand are optional
// but pre-filled (right hand is the population default).

export function Step1Identity({ form, update, error }) {
  const secondaryOptions = PRIMARY_GOALS.filter((g) => g !== form.primaryGoal);

  return (
    <StepShell title="Let's build your program" subtitle="About 3 minutes." error={error}>
      <FieldGroup label="First name">
        <input
          type="text"
          className="onb-text"
          value={form.firstName}
          onChange={(e) => update({ firstName: e.target.value })}
          placeholder="Your first name"
          autoFocus
          autoComplete="given-name"
        />
      </FieldGroup>

      <FieldGroup label="Last name">
        <input
          type="text"
          className="onb-text"
          value={form.lastName}
          onChange={(e) => update({ lastName: e.target.value })}
          placeholder="Your last name"
          autoComplete="family-name"
        />
      </FieldGroup>

      <FieldGroup label="Age">
        <input
          type="number"
          inputMode="numeric"
          className="onb-text"
          min={13}
          max={120}
          value={form.age}
          onChange={(e) => update({ age: e.target.value })}
          placeholder="e.g. 32"
        />
      </FieldGroup>

      <FieldGroup label="Biological sex">
        <SingleSelect
          name="biological-sex"
          options={BIOLOGICAL_SEX}
          value={form.biologicalSex}
          onChange={(v) => update({ biologicalSex: v })}
        />
      </FieldGroup>

      <FieldGroup label="Height">
        <UnitToggle
          unit={form.heightUnit}
          onChange={(u) => update({ heightUnit: u })}
        />
        {form.heightUnit === 'imperial' ? (
          <div className="onb-row">
            <input
              type="number"
              inputMode="numeric"
              className="onb-text"
              placeholder="ft"
              min={3}
              max={8}
              value={form.heightFt}
              onChange={(e) => update({ heightFt: e.target.value })}
              aria-label="Height feet"
            />
            <input
              type="number"
              inputMode="numeric"
              className="onb-text"
              placeholder="in"
              min={0}
              max={11}
              value={form.heightIn}
              onChange={(e) => update({ heightIn: e.target.value })}
              aria-label="Height inches"
            />
          </div>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            className="onb-text"
            placeholder="cm"
            min={100}
            max={230}
            value={form.heightCm}
            onChange={(e) => update({ heightCm: e.target.value })}
            aria-label="Height centimetres"
          />
        )}
      </FieldGroup>

      <FieldGroup label="Weight">
        <UnitToggle
          unit={form.weightUnit}
          onChange={(u) => update({ weightUnit: u })}
        />
        {form.weightUnit === 'imperial' ? (
          <input
            type="number"
            inputMode="decimal"
            className="onb-text"
            placeholder="lbs"
            min={50}
            max={600}
            value={form.weightLbs}
            onChange={(e) => update({ weightLbs: e.target.value })}
          />
        ) : (
          <input
            type="number"
            inputMode="decimal"
            className="onb-text"
            placeholder="kg"
            min={25}
            max={300}
            value={form.weightKg}
            onChange={(e) => update({ weightKg: e.target.value })}
          />
        )}
      </FieldGroup>

      <FieldGroup label="Primary goal">
        <SingleSelect
          name="primary-goal"
          options={PRIMARY_GOALS}
          value={form.primaryGoal}
          onChange={(v) =>
            update({
              primaryGoal: v,
              // Avoid same value in primary + secondary.
              secondaryGoal: form.secondaryGoal === v ? null : form.secondaryGoal,
            })
          }
        />
      </FieldGroup>

      <FieldGroup label="Secondary goal (optional)">
        <SingleSelect
          name="secondary-goal"
          options={secondaryOptions}
          value={form.secondaryGoal}
          onChange={(v) =>
            update({ secondaryGoal: form.secondaryGoal === v ? null : v })
          }
        />
      </FieldGroup>

      <FieldGroup label="Dominant hand">
        <SingleSelect
          name="dominant-hand"
          options={DOMINANT_HAND}
          value={form.dominantHand}
          onChange={(v) => update({ dominantHand: v })}
          columns={3}
        />
      </FieldGroup>
    </StepShell>
  );
}

function UnitToggle({ unit, onChange }) {
  return (
    <div className="onb-unit-toggle" role="tablist">
      <button
        type="button"
        className={`onb-unit-btn${unit === 'imperial' ? ' active' : ''}`}
        onClick={() => onChange('imperial')}
        role="tab"
        aria-selected={unit === 'imperial'}
      >
        Imperial
      </button>
      <button
        type="button"
        className={`onb-unit-btn${unit === 'metric' ? ' active' : ''}`}
        onClick={() => onChange('metric')}
        role="tab"
        aria-selected={unit === 'metric'}
      >
        Metric
      </button>
    </div>
  );
}
