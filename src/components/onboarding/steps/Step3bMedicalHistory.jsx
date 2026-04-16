import { FieldGroup, StepShell } from '../components/StepShell.jsx';
import { SingleSelect } from '../components/SingleSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import {
  BODY_REGIONS,
  CARDIO_CONDITIONS,
  SURGERY_CLEARED,
} from '../../../lib/onboardingOptions.js';

const YES_NO = [
  { id: true,  label: 'Yes' },
  { id: false, label: 'No' },
];

export function Step3bMedicalHistory({ form, update, error }) {
  const surgeries = form.surgeries || [];

  const addSurgery = () => {
    update({
      surgeries: [
        ...surgeries,
        {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          body_region: null,
          surgery_month: '',
          surgery_year: '',
          cleared_for_exercise: null,
        },
      ],
    });
  };
  const removeSurgery = (id) => {
    update({ surgeries: surgeries.filter((s) => s.id !== id) });
  };
  const patchSurgery = (id, patch) => {
    update({
      surgeries: surgeries.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  // Auto-create the first row when the user toggles "Yes" so they don't have
  // to figure out an "Add" button.
  const handleHasSurgery = (v) => {
    if (v === true && surgeries.length === 0) {
      update({
        hasRecentSurgery: true,
        surgeries: [
          {
            id: `local-${Date.now()}`,
            body_region: null,
            surgery_month: '',
            surgery_year: '',
            cleared_for_exercise: null,
          },
        ],
      });
    } else if (v === false) {
      update({ hasRecentSurgery: false, surgeries: [] });
    } else {
      update({ hasRecentSurgery: v });
    }
  };

  return (
    <StepShell
      title="A few medical questions"
      subtitle="We use this to keep your program safe — not to diagnose anything."
      error={error}
    >
      <FieldGroup label="Cardiovascular conditions">
        <SingleSelect
          name="has-cardio"
          options={[
            { id: false, label: 'No' },
            { id: true,  label: 'Yes — select below' },
          ]}
          value={form.hasCardio}
          onChange={(v) =>
            update({
              hasCardio: v,
              cardiovascularConditions: v === false ? [] : form.cardiovascularConditions,
              cardioOther: v === false ? '' : form.cardioOther,
            })
          }
          columns={2}
        />

        {form.hasCardio === true && (
          <>
            <div style={{ height: 10 }} />
            <MultiSelect
              name="cardio-conditions"
              options={CARDIO_CONDITIONS}
              value={form.cardiovascularConditions}
              onChange={(v) => update({ cardiovascularConditions: v })}
            />
            {form.cardiovascularConditions.includes('Other') && (
              <input
                type="text"
                className="onb-text"
                style={{ marginTop: 10 }}
                placeholder="Please describe…"
                value={form.cardioOther}
                onChange={(e) => update({ cardioOther: e.target.value })}
              />
            )}
            {form.cardiovascularConditions.length > 0 && (
              <div className="onb-banner warn">
                ⚠ High-intensity intervals and maximal effort sets will be modified
                in your program. Always follow your physician's guidance on exercise
                intensity.
              </div>
            )}
          </>
        )}
      </FieldGroup>

      <FieldGroup label="Medications affecting training?">
        <SingleSelect
          name="has-meds"
          options={YES_NO}
          value={form.hasMedications}
          onChange={(v) =>
            update({
              hasMedications: v,
              medicationsAffectingTraining:
                v === false ? '' : form.medicationsAffectingTraining,
            })
          }
          columns={2}
        />
        {form.hasMedications === true && (
          <>
            <textarea
              className="onb-text onb-textarea"
              style={{ marginTop: 10 }}
              rows={2}
              value={form.medicationsAffectingTraining}
              onChange={(e) => update({ medicationsAffectingTraining: e.target.value })}
              placeholder="e.g. beta blockers, blood thinners, corticosteroids, statins"
            />
            <div className="onb-field-hint">
              Beta blockers reduce heart rate response. Blood thinners increase
              bruising risk. These affect how we program intensity and contact
              exercises.
            </div>
          </>
        )}
      </FieldGroup>

      <FieldGroup label="Recent surgeries (past 24 months)?">
        <SingleSelect
          name="has-surgery"
          options={YES_NO}
          value={form.hasRecentSurgery}
          onChange={handleHasSurgery}
          columns={2}
        />

        {form.hasRecentSurgery === true && (
          <div className="onb-surgery-list">
            {surgeries.map((sx, i) => (
              <SurgeryRow
                key={sx.id}
                index={i}
                surgery={sx}
                onChange={(patch) => patchSurgery(sx.id, patch)}
                onRemove={() => removeSurgery(sx.id)}
              />
            ))}
            <button type="button" className="onb-link-btn" onClick={addSurgery}>
              + Add another surgery
            </button>
          </div>
        )}
      </FieldGroup>
    </StepShell>
  );
}

function SurgeryRow({ index, surgery, onChange, onRemove }) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="onb-card">
      <div className="onb-card-head">
        <span className="onb-card-title">Surgery #{index + 1}</span>
        <button type="button" className="onb-link-btn danger" onClick={onRemove}>
          Remove
        </button>
      </div>

      <FieldGroup label="Body region">
        <select
          className="onb-text"
          value={surgery.body_region || ''}
          onChange={(e) => onChange({ body_region: e.target.value || null })}
        >
          <option value="">Select a region…</option>
          {BODY_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </FieldGroup>

      <FieldGroup label="Approximate date">
        <div className="onb-row">
          <select
            className="onb-text"
            value={surgery.surgery_month || ''}
            onChange={(e) => onChange({ surgery_month: e.target.value })}
            aria-label="Month"
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            className="onb-text"
            value={surgery.surgery_year || ''}
            onChange={(e) => onChange({ surgery_year: e.target.value })}
            aria-label="Year"
          >
            <option value="">Year</option>
            {Array.from({ length: 3 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </FieldGroup>

      <FieldGroup label="Fully cleared for exercise?">
        <SingleSelect
          name={`surgery-cleared-${index}`}
          options={SURGERY_CLEARED}
          value={surgery.cleared_for_exercise}
          onChange={(v) => onChange({ cleared_for_exercise: v })}
          columns={3}
        />
      </FieldGroup>
    </div>
  );
}
