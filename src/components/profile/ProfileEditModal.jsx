import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProfile } from '../../lib/profileContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { generateWorkoutPlan } from '../../lib/workoutPlanGenerator.js';
import { generateMealPlan } from '../../lib/mealPlanGenerator.js';
import {
  ACTIVITY_LEVEL,
  AVG_SLEEP,
  BIOLOGICAL_SEX,
  BODY_REGION_LABEL,
  COMPETITION_STATUS,
  DAYS_PER_WEEK,
  DOMINANT_HAND,
  EQUIPMENT,
  PERFORMANCE_GOALS,
  PRIMARY_GOALS,
  PRIMARY_SPORT,
  RECOVERY_LEVEL,
  SESSION_DURATION,
  STRESS_LEVEL,
  TRAINING_EXPERIENCE,
  TRAINING_LOCATION,
  TRAVEL_FREQUENCY,
} from '../../lib/onboardingOptions.js';
import { MultiSelect } from '../onboarding/components/MultiSelect.jsx';
import { SingleSelect } from '../onboarding/components/SingleSelect.jsx';
import { FieldGroup } from '../onboarding/components/StepShell.jsx';

// Profile edit modal — opened from the header. The user can update any
// onboarding answer post-completion. Injuries get a separate panel where
// they can mark a region "healed" (active=false) without losing the
// historical record.

// Fields that affect workout plan generation. Changes to any of these
// trigger a regeneration prompt after saving.
//
// DO trigger: schedule, goals, equipment, exercise restrictions, travel equipment
// DO NOT trigger: name, age, sex, sleep, stress, recovery, travel frequency
const PLAN_RELEVANT_FIELDS = [
  'days_per_week',
  'preferred_days',
  'session_duration_min',
  'primary_goal',
  'equipment',
  'travel_equipment_access',
  'excluded_exercises',
  'primary_sport',
  'performance_goals',
];

function planFieldsChanged(before, after) {
  for (const key of PLAN_RELEVANT_FIELDS) {
    // Only compare fields that exist in the patch — fields not present
    // in the edit form (like preferred_days) are not editable here and
    // should not trigger a false positive.
    if (!(key in after)) continue;
    const a = JSON.stringify(before?.[key] ?? null);
    const b = JSON.stringify(after?.[key] ?? null);
    if (a !== b) return true;
  }
  return false;
}

export function ProfileEditModal({ open, onClose, onError }) {
  const {
    profile,
    injuries,
    activeWorkoutPlan,
    updateProfile,
    markInjuryHealed,
    reactivateInjury,
    refreshWorkoutPlan,
  } = useProfile();
  const [tab, setTab] = useState('profile');
  const [draft, setDraft] = useState(() => profileToDraft(profile));
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Reset the local draft every time the modal is opened, so cancel
  // really discards in-flight edits.
  useEffect(() => {
    if (open) {
      setDraft(profileToDraft(profile));
      setTab('profile');
      setConfirmRegen(false);
      setRegenerating(false);
    }
  }, [open, profile]);

  // Lock body scroll while the modal is open. Mirrors WorkoutDayModal so
  // the focus stays inside the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const patch = draftToPatch(draft);
      await updateProfile(patch);
      // If plan-relevant fields changed and an AI plan exists, offer regeneration
      if (activeWorkoutPlan && planFieldsChanged(profile, patch)) {
        setConfirmRegen(true);
        setSaving(false);
        return;
      }
      onClose?.();
    } catch (e) {
      onError?.(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = useCallback(async () => {
    setConfirmRegen(false);
    setRegenerating(true);
    try {
      await generateWorkoutPlan();
      await refreshWorkoutPlan();
    } catch (e) {
      console.warn('[ProfileEdit] workout plan regeneration failed:', e?.message || e);
    } finally {
      setRegenerating(false);
      onClose?.();
    }
  }, [refreshWorkoutPlan, onClose]);

  const handleManualRegenerate = useCallback(async () => {
    if (!window.confirm(
      'This will build a new workout program. Your logged sets and PRs are preserved. Continue?'
    )) return;
    setRegenerating(true);
    try {
      await generateWorkoutPlan();
      await refreshWorkoutPlan();
    } catch (e) {
      console.warn('[ProfileEdit] manual regeneration failed:', e?.message || e);
      onError?.(e);
    } finally {
      setRegenerating(false);
    }
  }, [refreshWorkoutPlan, onError]);

  const activeInjuries = useMemo(() => injuries.filter((i) => i.active !== false), [injuries]);
  const healedInjuries = useMemo(() => injuries.filter((i) => i.active === false), [injuries]);

  if (!open) return null;

  // Regenerating loading state
  if (regenerating) {
    return (
      <div className="wmodal-overlay open" role="dialog" aria-modal="true">
        <div className="wmodal-sheet">
          <div className="wmodal-handle" />
          <div className="wmodal-body">
            <div className="onb-generating">
              <div className="onb-generating-icon">💪</div>
              <h2 className="onb-generating-title">Building your new program…</h2>
              <p className="onb-generating-sub">
                Analyzing your goals, schedule, injuries, and equipment
              </p>
              <div className="onb-generating-spinner" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation dialog after saving plan-relevant changes
  if (confirmRegen) {
    return (
      <div className="wmodal-overlay open" role="dialog" aria-modal="true">
        <div className="wmodal-sheet">
          <div className="wmodal-handle" />
          <div className="wmodal-header">
            <div className="wmodal-title-row">
              <div className="wmodal-title">Build a new program?</div>
            </div>
          </div>
          <div className="wmodal-body">
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)', marginBottom: 16 }}>
              You changed settings that affect your workout plan. Would you like to build a new
              program? Your logged sets and PRs are preserved.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="onb-btn ghost"
                onClick={() => { setConfirmRegen(false); onClose?.(); }}
              >
                Keep current
              </button>
              <button
                type="button"
                className="onb-btn primary"
                onClick={handleRegenerate}
              >
                Build new program
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="wmodal-overlay open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="wmodal-sheet">
        <div className="wmodal-handle" />
        <div className="wmodal-header">
          <div className="wmodal-title-row">
            <div className="wmodal-title">Your profile</div>
            <button type="button" className="wmodal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab${tab === 'profile' ? ' active' : ''}`}
              onClick={() => setTab('profile')}
            >
              Profile
            </button>
            <button
              type="button"
              className={`profile-tab${tab === 'injuries' ? ' active' : ''}`}
              onClick={() => setTab('injuries')}
            >
              Injuries ({activeInjuries.length})
            </button>
            <button
              type="button"
              className={`profile-tab${tab === 'programs' ? ' active' : ''}`}
              onClick={() => setTab('programs')}
            >
              Programs
            </button>
            <button
              type="button"
              className={`profile-tab${tab === 'meals' ? ' active' : ''}`}
              onClick={() => setTab('meals')}
            >
              Meal Plans
            </button>
          </div>
        </div>
        <div className="wmodal-body">
          {tab === 'profile' && (
            <>
              <ProfileFields draft={draft} set={set} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" className="onb-btn ghost" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="onb-btn primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </>
          )}

          {tab === 'injuries' && (
            <InjuriesPanel
              active={activeInjuries}
              healed={healedInjuries}
              onMarkHealed={markInjuryHealed}
              onReactivate={reactivateInjury}
              onError={onError}
              onInjuryChanged={() => {
                if (activeWorkoutPlan) setConfirmRegen(true);
              }}
            />
          )}

          {tab === 'programs' && (
            <ProgramsPanel
              onRegenerate={handleManualRegenerate}
              regenerating={regenerating}
              onError={onError}
            />
          )}

          {tab === 'meals' && (
            <MealPlansPanel onError={onError} />
          )}

          {tab !== 'programs' && tab !== 'meals' && activeWorkoutPlan && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border2)' }}>
              <button
                type="button"
                className="onb-btn ghost"
                style={{ width: '100%' }}
                onClick={handleManualRegenerate}
                disabled={regenerating}
              >
                Build a new program
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function profileToDraft(profile) {
  if (!profile) return {};
  return {
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    age: profile.age ?? '',
    biological_sex: profile.biological_sex || null,
    dominant_hand: profile.dominant_hand || 'right',
    primary_goal: profile.primary_goal || null,
    secondary_goal: profile.secondary_goal || null,
    training_experience: profile.training_experience || null,
    activity_level: profile.activity_level || null,
    days_per_week: profile.days_per_week || null,
    session_duration_min: profile.session_duration_min || null,
    avg_sleep: profile.avg_sleep || null,
    stress_level: profile.stress_level || null,
    recovery_level: profile.recovery_level || null,
    travel_frequency: profile.travel_frequency || null,
    primary_sport: profile.primary_sport || [],
    competition_status: profile.competition_status || null,
    performance_goals: profile.performance_goals || [],
    equipment: profile.equipment || [],
    training_location: profile.training_location || null,
    excluded_exercises: profile.excluded_exercises || '',
  };
}

function draftToPatch(draft) {
  return {
    first_name: draft.first_name?.trim() || null,
    last_name: draft.last_name?.trim() || null,
    age: Number(draft.age) || null,
    biological_sex: draft.biological_sex,
    dominant_hand: draft.dominant_hand,
    primary_goal: draft.primary_goal,
    secondary_goal: draft.secondary_goal,
    training_experience: draft.training_experience,
    activity_level: draft.activity_level,
    days_per_week: Number(draft.days_per_week) || null,
    session_duration_min: Number(draft.session_duration_min) || null,
    avg_sleep: draft.avg_sleep,
    stress_level: draft.stress_level,
    recovery_level: draft.recovery_level,
    travel_frequency: draft.travel_frequency,
    primary_sport: draft.primary_sport,
    competition_status: draft.competition_status,
    performance_goals: draft.performance_goals,
    equipment: draft.equipment,
    training_location: draft.training_location,
    excluded_exercises: draft.excluded_exercises?.trim() || null,
  };
}

function ProfileFields({ draft, set }) {
  const secondaryOptions = PRIMARY_GOALS.filter((g) => g !== draft.primary_goal);

  return (
    <div className="onb-step-body">
      <FieldGroup label="First name">
        <input
          type="text"
          className="onb-text"
          value={draft.first_name || ''}
          onChange={(e) => set({ first_name: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Last name">
        <input
          type="text"
          className="onb-text"
          value={draft.last_name || ''}
          onChange={(e) => set({ last_name: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Age">
        <input
          type="number"
          className="onb-text"
          value={draft.age ?? ''}
          onChange={(e) => set({ age: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Biological sex">
        <SingleSelect
          name="bs"
          options={BIOLOGICAL_SEX}
          value={draft.biological_sex}
          onChange={(v) => set({ biological_sex: v })}
        />
      </FieldGroup>
      <FieldGroup label="Dominant hand">
        <SingleSelect
          name="dh"
          options={DOMINANT_HAND}
          value={draft.dominant_hand}
          onChange={(v) => set({ dominant_hand: v })}
          columns={3}
        />
      </FieldGroup>
      <FieldGroup label="Primary goal">
        <SingleSelect
          name="pg"
          options={PRIMARY_GOALS}
          value={draft.primary_goal}
          onChange={(v) =>
            set({
              primary_goal: v,
              secondary_goal: draft.secondary_goal === v ? null : draft.secondary_goal,
            })
          }
        />
      </FieldGroup>
      <FieldGroup label="Secondary goal">
        <SingleSelect
          name="sg"
          options={secondaryOptions}
          value={draft.secondary_goal}
          onChange={(v) => set({ secondary_goal: draft.secondary_goal === v ? null : v })}
        />
      </FieldGroup>
      <FieldGroup label="Training experience">
        <SingleSelect
          name="te"
          options={TRAINING_EXPERIENCE}
          value={draft.training_experience}
          onChange={(v) => set({ training_experience: v })}
        />
      </FieldGroup>
      <FieldGroup label="Activity level">
        <SingleSelect
          name="al"
          options={ACTIVITY_LEVEL}
          value={draft.activity_level}
          onChange={(v) => set({ activity_level: v })}
        />
      </FieldGroup>
      <FieldGroup label="Days per week">
        <SingleSelect
          name="dpw"
          options={DAYS_PER_WEEK.map((n) => ({ id: n, label: String(n) }))}
          value={draft.days_per_week}
          onChange={(v) => set({ days_per_week: v })}
          columns={5}
        />
      </FieldGroup>
      <FieldGroup label="Session duration">
        <SingleSelect
          name="sd"
          options={SESSION_DURATION}
          value={draft.session_duration_min}
          onChange={(v) => set({ session_duration_min: v })}
          columns={4}
        />
      </FieldGroup>
      <FieldGroup label="Average sleep">
        <SingleSelect
          name="as"
          options={AVG_SLEEP}
          value={draft.avg_sleep}
          onChange={(v) => set({ avg_sleep: v })}
          columns={2}
        />
      </FieldGroup>
      <FieldGroup label="Stress level">
        <SingleSelect
          name="sl"
          options={STRESS_LEVEL}
          value={draft.stress_level}
          onChange={(v) => set({ stress_level: v })}
          columns={2}
        />
      </FieldGroup>
      <FieldGroup label="Recovery">
        <SingleSelect
          name="rl"
          options={RECOVERY_LEVEL}
          value={draft.recovery_level}
          onChange={(v) => set({ recovery_level: v })}
        />
      </FieldGroup>
      <FieldGroup label="Travel frequency">
        <SingleSelect
          name="tf"
          options={TRAVEL_FREQUENCY}
          value={draft.travel_frequency}
          onChange={(v) => set({ travel_frequency: v })}
        />
      </FieldGroup>
      <FieldGroup label="Sports (select all that apply)">
        <MultiSelect
          name="ps"
          options={PRIMARY_SPORT}
          value={draft.primary_sport}
          onChange={(v) => set({ primary_sport: v })}
          exclusive="None — general fitness"
        />
      </FieldGroup>
      <FieldGroup label="Competition status">
        <SingleSelect
          name="cs"
          options={COMPETITION_STATUS}
          value={draft.competition_status}
          onChange={(v) => set({ competition_status: v })}
          columns={3}
        />
      </FieldGroup>
      <FieldGroup label="Performance goals">
        <MultiSelect
          name="perf"
          options={PERFORMANCE_GOALS}
          value={draft.performance_goals}
          onChange={(v) => set({ performance_goals: v })}
          exclusive="None"
        />
      </FieldGroup>
      <FieldGroup label="Training location">
        <SingleSelect
          name="tl"
          options={TRAINING_LOCATION}
          value={draft.training_location}
          onChange={(v) => set({ training_location: v })}
        />
      </FieldGroup>
      <FieldGroup label="Equipment">
        <MultiSelect
          name="eq"
          options={EQUIPMENT}
          value={draft.equipment}
          onChange={(v) => set({ equipment: v })}
        />
      </FieldGroup>
      <FieldGroup label="Excluded exercises">
        <textarea
          className="onb-text onb-textarea"
          rows={3}
          value={draft.excluded_exercises || ''}
          onChange={(e) => set({ excluded_exercises: e.target.value })}
        />
      </FieldGroup>
    </div>
  );
}

// ── Programs Panel ────────────────────────────────────────────────────
// Shows all workout plans (active + archived). Each card is expandable
// to reveal the day-by-day breakdown. Previous plans are kept with
// is_active=false for audit purposes.

const TYPE_ICON = { strength: '🏋️', conditioning: '⚡', mobility: '🧘', rest: '😴' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function PlanDayRow({ day }) {
  const icon = TYPE_ICON[day.type] || '📋';
  const exerciseCount =
    day.type === 'mobility'
      ? day.mobility?.length || 0
      : day.exercises?.length || 0;
  const label =
    day.type === 'rest'
      ? 'Rest'
      : `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', width: 32 }}>
        {day.day}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{day.title}</span>
      <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>
        {label}
      </span>
    </div>
  );
}

function PlanExerciseList({ day }) {
  if (day.type === 'rest') {
    return (
      <div style={{ paddingLeft: 30, marginTop: 4 }}>
        {(day.rest_tips || []).map((tip, i) => (
          <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', padding: '2px 0' }}>
            {tip}
          </div>
        ))}
      </div>
    );
  }
  const items = day.type === 'mobility' ? day.mobility : day.exercises;
  if (!items?.length) return null;
  return (
    <div style={{ paddingLeft: 30, marginTop: 4 }}>
      {items.map((ex, i) => (
        <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', padding: '2px 0' }}>
          {ex.name}
          {ex.sets ? ` · ${ex.sets}×${ex.reps}` : ''}
          {ex.detail ? ` — ${ex.detail}` : ''}
        </div>
      ))}
    </div>
  );
}

function PlanCard({ plan, isActive, expandedId, onToggle, onReactivate, reactivating }) {
  const pd = plan.plan_data;
  const expanded = expandedId === plan.id;
  const days = pd?.days || [];
  const trainingDays = days.filter((d) => d.type !== 'rest').length;

  return (
    <div className={`onb-card${isActive ? '' : ' muted'}`}>
      <div
        className="onb-card-head"
        style={{ cursor: 'pointer', marginBottom: expanded ? 10 : 0 }}
        onClick={() => onToggle(plan.id)}
      >
        <div>
          <span className="onb-card-title">
            {isActive ? 'Current program' : formatDate(plan.generated_at)}
          </span>
          <div className="onb-field-hint" style={{ marginTop: 2 }}>
            {trainingDays} training day{trainingDays !== 1 ? 's' : ''} / week
            {isActive ? '' : ` · v${plan.generation_prompt_version || '1'}`}
          </div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          ▾
        </span>
      </div>

      {expanded && (
        <div>
          {pd?.planSummary && (
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10, padding: '8px 10px', background: 'var(--surface2, var(--surface))', borderRadius: 6 }}>
              {pd.planSummary}
            </div>
          )}
          {days.map((day, i) => (
            <div key={i}>
              <PlanDayRow day={day} />
              <PlanExerciseList day={day} />
            </div>
          ))}
          {isActive && (
            <div className="onb-field-hint" style={{ marginTop: 8 }}>
              Generated {formatDate(plan.generated_at)}
            </div>
          )}
          {!isActive && onReactivate && (
            <button
              type="button"
              className="onb-btn primary"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => onReactivate(plan.id)}
              disabled={reactivating}
            >
              {reactivating ? 'Switching…' : 'Use this program'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramsPanel({ onRegenerate, regenerating, onError }) {
  const { activeWorkoutPlan, refreshWorkoutPlan } = useProfile();
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [reactivating, setReactivating] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('user_workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false });
    if (error) {
      console.warn('[ProgramsPanel] load failed', error);
      onError?.(error);
    }
    setAllPlans(data || []);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans, activeWorkoutPlan]);

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleReactivate = useCallback(async (planId) => {
    setReactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // Deactivate current plan
      await supabase
        .from('user_workout_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Reactivate selected plan
      const { error } = await supabase
        .from('user_workout_plans')
        .update({ is_active: true })
        .eq('id', planId);

      if (error) throw error;

      await refreshWorkoutPlan();
      await loadPlans();
    } catch (e) {
      console.warn('[ProgramsPanel] reactivate failed', e?.message || e);
      onError?.(e);
    } finally {
      setReactivating(false);
    }
  }, [refreshWorkoutPlan, loadPlans, onError]);


  if (loading) {
    return (
      <div className="onb-step-body">
        <p className="onb-field-hint">Loading programs…</p>
      </div>
    );
  }

  const active = allPlans.find((p) => p.is_active);
  const previous = allPlans.filter((p) => !p.is_active);

  return (
    <div className="onb-step-body">
      <h3 className="profile-section-title">Current program</h3>
      {active ? (
        <PlanCard
          plan={active}
          isActive
          expandedId={expandedId}
          onToggle={handleToggle}
        />
      ) : (
        <div className="onb-card">
          <p className="onb-field-hint" style={{ margin: 0 }}>
            No AI-generated program yet. You're using the default plan.
          </p>
        </div>
      )}

      <button
        type="button"
        className="onb-btn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onRegenerate}
        disabled={regenerating}
      >
        {active ? 'Build a new program' : 'Build my program'}
      </button>

      {previous.length > 0 && (
        <>
          <h3 className="profile-section-title" style={{ marginTop: 24 }}>
            Previous programs ({previous.length})
          </h3>
          {previous.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isActive={false}
              expandedId={expandedId}
              onToggle={handleToggle}
              onReactivate={handleReactivate}
              reactivating={reactivating}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ── Meal Plans Panel ──────────────────────────────────────────────────

function MealPlanCard({ plan, isActive, expandedId, onToggle, onReactivate, reactivating }) {
  const pd = plan.plan_data;
  const expanded = expandedId === plan.id;
  const days = pd?.days || [];
  const mealCount = days.reduce((sum, d) => sum + (d.meals?.length || 0), 0);

  return (
    <div className={`onb-card${isActive ? '' : ' muted'}`}>
      <div
        className="onb-card-head"
        style={{ cursor: 'pointer', marginBottom: expanded ? 10 : 0 }}
        onClick={() => onToggle(plan.id)}
      >
        <div>
          <span className="onb-card-title">
            {isActive ? 'Current meal plan' : formatDate(plan.generated_at)}
          </span>
          <div className="onb-field-hint" style={{ marginTop: 2 }}>
            {mealCount} meals / week
            {isActive ? '' : ` · v${plan.generation_prompt_version || '1'}`}
          </div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          ▾
        </span>
      </div>

      {expanded && (
        <div>
          {pd?.planSummary && (
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10, padding: '8px 10px', background: 'var(--surface2, var(--surface))', borderRadius: 6 }}>
              {pd.planSummary}
            </div>
          )}
          {days.map((day, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text)', padding: '4px 0' }}>
                {day.day}
              </div>
              {(day.meals || []).map((meal, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, padding: '2px 0 2px 12px' }}>
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', width: 55, flexShrink: 0 }}>
                    {meal.time}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text)' }}>
                    {meal.name}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {isActive && (
            <div className="onb-field-hint" style={{ marginTop: 8 }}>
              Generated {formatDate(plan.generated_at)}
            </div>
          )}
          {!isActive && onReactivate && (
            <button
              type="button"
              className="onb-btn primary"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => onReactivate(plan.id)}
              disabled={reactivating}
            >
              {reactivating ? 'Switching…' : 'Use this meal plan'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MealPlansPanel({ onError }) {
  const { activeMealPlan, refreshDietProfile } = useProfile();
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [reactivating, setReactivating] = useState(false);
  const [building, setBuilding] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('user_meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false });
    if (error) {
      console.warn('[MealPlansPanel] load failed', error);
      onError?.(error);
    }
    setAllPlans(data || []);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans, activeMealPlan]);

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleReactivate = useCallback(async (planId) => {
    setReactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      await supabase
        .from('user_meal_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { error } = await supabase
        .from('user_meal_plans')
        .update({ is_active: true })
        .eq('id', planId);

      if (error) throw error;

      await refreshDietProfile();
      await loadPlans();
    } catch (e) {
      console.warn('[MealPlansPanel] reactivate failed', e?.message || e);
      onError?.(e);
    } finally {
      setReactivating(false);
    }
  }, [refreshDietProfile, loadPlans, onError]);

  const handleBuildNew = useCallback(async () => {
    if (!window.confirm(
      'This will build a new meal plan. Your current plan moves to Previous Meal Plans. Continue?'
    )) return;
    setBuilding(true);
    try {
      await generateMealPlan();
      await refreshDietProfile();
      await loadPlans();
    } catch (e) {
      console.warn('[MealPlansPanel] build failed', e?.message || e);
      onError?.(e);
    } finally {
      setBuilding(false);
    }
  }, [refreshDietProfile, loadPlans, onError]);

  if (loading) {
    return (
      <div className="onb-step-body">
        <p className="onb-field-hint">Loading meal plans…</p>
      </div>
    );
  }

  const active = allPlans.find((p) => p.is_active);
  const previous = allPlans.filter((p) => !p.is_active);

  return (
    <div className="onb-step-body">
      <h3 className="profile-section-title">Current meal plan</h3>
      {active ? (
        <MealPlanCard
          plan={active}
          isActive
          expandedId={expandedId}
          onToggle={handleToggle}
        />
      ) : (
        <div className="onb-card">
          <p className="onb-field-hint" style={{ margin: 0 }}>
            No AI-generated meal plan yet. You're using the default plan.
          </p>
        </div>
      )}

      <button
        type="button"
        className="onb-btn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={handleBuildNew}
        disabled={building}
      >
        {building ? 'Building…' : active ? 'Build a new meal plan' : 'Build my meal plan'}
      </button>

      {previous.length > 0 && (
        <>
          <h3 className="profile-section-title" style={{ marginTop: 24 }}>
            Previous meal plans ({previous.length})
          </h3>
          {previous.map((plan) => (
            <MealPlanCard
              key={plan.id}
              plan={plan}
              isActive={false}
              expandedId={expandedId}
              onToggle={handleToggle}
              onReactivate={handleReactivate}
              reactivating={reactivating}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ── Injuries Panel ────────────────────────────────────────────────────

function InjuriesPanel({ active, healed, onMarkHealed, onReactivate, onError, onInjuryChanged }) {
  const handle = async (fn, id) => {
    try {
      await fn(id);
      onInjuryChanged?.();
    } catch (e) {
      onError?.(e);
    }
  };

  return (
    <div className="onb-step-body">
      <h3 className="profile-section-title">Active injuries</h3>
      {active.length === 0 ? (
        <p className="onb-field-hint">No active injuries on file.</p>
      ) : (
        active.map((inj) => (
          <div key={inj.id} className="onb-card">
            <div className="onb-card-head">
              <span className="onb-card-title">
                {BODY_REGION_LABEL[inj.body_region] || inj.body_region}
              </span>
              <button
                type="button"
                className="onb-link-btn"
                onClick={() => handle(onMarkHealed, inj.id)}
              >
                Mark as healed
              </button>
            </div>
            <div className="onb-field-hint">
              {inj.injury_type ? `${inj.injury_type} · ` : ''}
              pain {inj.pain_during_exercise ?? '?'}/10 during exercise
            </div>
          </div>
        ))
      )}

      {healed.length > 0 && (
        <>
          <h3 className="profile-section-title" style={{ marginTop: 18 }}>
            Healed history
          </h3>
          {healed.map((inj) => (
            <div key={inj.id} className="onb-card muted">
              <div className="onb-card-head">
                <span className="onb-card-title">
                  {BODY_REGION_LABEL[inj.body_region] || inj.body_region}
                </span>
                <button
                  type="button"
                  className="onb-link-btn"
                  onClick={() => handle(onReactivate, inj.id)}
                >
                  Reactivate
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
