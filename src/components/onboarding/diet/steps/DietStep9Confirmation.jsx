import { StepShell } from '../../components/StepShell.jsx';

function summarise(form) {
  const conditionsList =
    form.conditions.length > 0 && !form.conditions.includes('None')
      ? form.conditions
      : ['None flagged'];

  const restrictions = [];
  if (form.allergies.length > 0 && !form.allergies.includes('None')) {
    restrictions.push(...form.allergies.map((a) => `${a} (allergy)`));
  }
  if (form.intolerances.length > 0 && !form.intolerances.includes('None')) {
    restrictions.push(...form.intolerances.map((i) => `${i} (intolerance)`));
  }
  if (restrictions.length === 0) restrictions.push('None');

  const gutSymptomsList =
    form.gutSymptoms.length > 0 && !form.gutSymptoms.includes('None')
      ? form.gutSymptoms
      : ['None'];

  return {
    primaryGoal: form.primaryGoal || '—',
    conditions: conditionsList,
    framework: form.dietaryFramework || '—',
    restrictions,
    cookingSkill: form.cookingSkill || '—',
    weekdayTime: form.weekdayCookTime || '—',
    mealPrepStyle: form.mealPrepStyle || '—',
    gutSymptoms: gutSymptomsList,
  };
}

export function DietStep9Confirmation({ form, onEdit, onSubmit, saving, error }) {
  const s = summarise(form);

  return (
    <StepShell
      title="Your diet profile"
      subtitle="Quick check before we generate your meal plan."
      error={error}
    >
      <div className="onb-summary-card">
        <SummaryRow label="Primary goal" value={s.primaryGoal} />
        <SummaryRow label="Dietary framework" value={s.framework} />
        <SummaryRow label="Cooking skill" value={s.cookingSkill} />
        <SummaryRow label="Weekday cook time" value={s.weekdayTime} />
        <SummaryRow label="Meal prep style" value={s.mealPrepStyle} />

        <div className="onb-summary-row column">
          <span className="onb-summary-label">Conditions flagged</span>
          <ul className="onb-summary-list">
            {s.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="onb-summary-row column">
          <span className="onb-summary-label">Key restrictions</span>
          <ul className="onb-summary-list">
            {s.restrictions.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="onb-summary-row column">
          <span className="onb-summary-label">Gut symptoms</span>
          <ul className="onb-summary-list">
            {s.gutSymptoms.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        className="onb-btn primary"
        onClick={onSubmit}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Generate my meal plan'}
      </button>
      <button
        type="button"
        className="onb-btn ghost"
        onClick={onEdit}
        disabled={saving}
      >
        Edit answers
      </button>
    </StepShell>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="onb-summary-row">
      <span className="onb-summary-label">{label}</span>
      <span className="onb-summary-value">{value}</span>
    </div>
  );
}
