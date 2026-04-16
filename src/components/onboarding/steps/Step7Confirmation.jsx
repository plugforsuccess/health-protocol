import { StepShell } from '../components/StepShell.jsx';
import { BODY_REGION_LABEL, SESSION_DURATION } from '../../../lib/onboardingOptions.js';

function summarise(form) {
  const sessionLabel =
    SESSION_DURATION.find((s) => s.id === form.sessionDuration)?.label ||
    (form.sessionDuration ? `${form.sessionDuration} min` : 'Not set');

  const injuriesList =
    form.hasInjuries === true && form.injuryRegions.length > 0
      ? form.injuryRegions.map((r) => BODY_REGION_LABEL[r] || r)
      : ['None reported'];

  return {
    name: form.firstName || '—',
    goal: form.primaryGoal || '—',
    level: form.trainingExperience || '—',
    days: form.daysPerWeek ? `${form.daysPerWeek} days/week` : '—',
    duration: sessionLabel,
    sport: form.primarySport || '—',
    injuries: injuriesList,
  };
}

export function Step7Confirmation({ form, onEdit, onSubmit, saving, error }) {
  const s = summarise(form);

  return (
    <StepShell
      title="You're all set"
      subtitle="Quick check before we save your profile."
      error={error}
    >
      <div className="onb-summary-card">
        <SummaryRow label="Name" value={s.name} />
        <SummaryRow label="Goal" value={s.goal} />
        <SummaryRow label="Training level" value={s.level} />
        <SummaryRow label="Schedule" value={`${s.days} · ${s.duration}`} />
        <SummaryRow label="Sport focus" value={s.sport} />
        <div className="onb-summary-row column">
          <span className="onb-summary-label">Injuries flagged</span>
          <ul className="onb-summary-list">
            {s.injuries.map((inj) => (
              <li key={inj}>{inj}</li>
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
        {saving ? 'Saving…' : 'Looks good — start my program'}
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
