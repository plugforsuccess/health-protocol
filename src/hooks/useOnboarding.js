import { useCallback, useMemo, useState } from 'react';
import { useProfile } from '../lib/profileContext.jsx';
import {
  ftInToCm,
  lbsToKg,
  defaultUnitsForLocale,
} from '../lib/onboardingOptions.js';

// Centralised onboarding form state. The flow is multi-step but we keep
// every answer in one big object so the user can navigate back without
// losing data and we can run a single Supabase write at the end.
//
// Shape (camelCase mirrors what each step component cares about; we map
// it to snake_case columns just before write):
//   {
//     firstName, age, biologicalSex, dominantHand,
//     heightUnit, heightFt, heightIn, heightCm,
//     weightUnit, weightLbs, weightKg,
//     primaryGoal, secondaryGoal,
//     trainingExperience, formerAthlete, sportBackground[],
//     activityLevel, trainingHistoryNotes,
//     hasCardio, cardiovascularConditions[], cardioOther,
//     hasMedications, medicationsAffectingTraining,
//     hasRecentSurgery, surgeries[{ id?, body_region, surgery_month,
//                                    surgery_year, cleared_for_exercise }],
//     hasInjuries, injuryRegions[],
//     injuriesByRegion: { [regionId]: { ...injuryFields } },
//     excludedExercises, injuryCausingExercises,
//     trainingLocation, equipment[], missingEquipment,
//     daysPerWeek, preferredDays[], sessionDuration,
//     avgSleep, stressLevel, recoveryLevel,
//     travelFrequency, travelEquipmentAccess,
//     primarySport, competitionStatus, performanceGoals[],
//   }

const initialInjuryDetail = () => ({
  injury_type: null,
  injury_duration: null,
  injury_trajectory: null,
  pain_at_rest: 0,
  pain_during_exercise: 0,
  aggravating_movements: [],
  physician_cleared: null,
  in_physical_therapy: false,
});

function makeInitial() {
  const locale =
    typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
  const units = defaultUnitsForLocale(locale);
  return {
    firstName: '',
    age: '',
    biologicalSex: null,
    dominantHand: 'right',
    heightUnit: units === 'imperial' ? 'imperial' : 'metric',
    heightFt: '', heightIn: '', heightCm: '',
    weightUnit: units === 'imperial' ? 'imperial' : 'metric',
    weightLbs: '', weightKg: '',
    primaryGoal: null, secondaryGoal: null,
    trainingExperience: null,
    formerAthlete: null,
    sportBackground: [],
    activityLevel: null,
    trainingHistoryNotes: '',
    hasCardio: null,
    cardiovascularConditions: [],
    cardioOther: '',
    hasMedications: null,
    medicationsAffectingTraining: '',
    hasRecentSurgery: null,
    surgeries: [],
    hasInjuries: null,
    injuryRegions: [],
    injuriesByRegion: {},
    excludedExercises: '',
    injuryCausingExercises: '',
    trainingLocation: null,
    equipment: [],
    missingEquipment: '',
    daysPerWeek: null,
    preferredDays: [],
    sessionDuration: null,
    avgSleep: null,
    stressLevel: null,
    recoveryLevel: null,
    travelFrequency: null,
    travelEquipmentAccess: null,
    primarySport: [],
    competitionStatus: null,
    performanceGoals: [],
  };
}

export function useOnboarding(initialFromProfile) {
  const { completeOnboarding, saveInjury, saveSurgery } = useProfile();
  const [form, setForm] = useState(() => ({
    ...makeInitial(),
    ...(initialFromProfile || {}),
  }));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback((patch) => {
    setForm((prev) =>
      typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
    );
  }, []);

  const updateInjury = useCallback((regionId, patch) => {
    setForm((prev) => {
      const cur = prev.injuriesByRegion[regionId] || initialInjuryDetail();
      return {
        ...prev,
        injuriesByRegion: {
          ...prev.injuriesByRegion,
          [regionId]: { ...cur, ...patch },
        },
      };
    });
  }, []);

  // ── Step plan ──────────────────────────────────────────────────────────
  // Steps are a flat array of keys; injury detail steps are dynamically
  // injected (one per selected region) so the user sees a fresh card for
  // each. Using keys instead of indices keeps the back/next math simple
  // when the injury region list changes mid-flow.
  const steps = useMemo(() => {
    const base = [
      { key: 'identity',    title: "Let's build your program" },
      { key: 'training',    title: 'Your training history' },
      { key: 'medical',     title: 'A few medical questions' },
      { key: 'injuries',    title: 'Tell us about your body' },
    ];
    if (form.hasInjuries === true) {
      for (const regionId of form.injuryRegions || []) {
        base.push({ key: `injury_detail:${regionId}`, title: 'Tell us more', regionId });
      }
    }
    base.push(
      { key: 'movement_history', title: 'Movement history' },
      { key: 'equipment',        title: 'What do you have to work with?' },
      { key: 'schedule',         title: "Let's build your schedule" },
      { key: 'sport',            title: 'What are you training for?' },
      { key: 'confirmation',     title: "You're all set" }
    );
    return base;
  }, [form.hasInjuries, form.injuryRegions]);

  const totalSteps = steps.length;
  const currentStep = steps[Math.min(step, totalSteps - 1)];
  const progress = (step + 1) / totalSteps;

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback(
    (target) => {
      if (typeof target === 'number') {
        setStep(Math.max(0, Math.min(target, totalSteps - 1)));
      } else {
        const i = steps.findIndex((s) => s.key === target);
        if (i >= 0) setStep(i);
      }
    },
    [steps, totalSteps]
  );

  // ── Validation ────────────────────────────────────────────────────────
  const validateIdentity = useCallback(() => {
    if (!form.firstName.trim()) return 'Please tell us your first name.';
    const age = Number(form.age);
    if (!Number.isFinite(age) || age < 13 || age > 120) {
      return 'Please enter a valid age between 13 and 120.';
    }
    if (!form.biologicalSex) return 'Please select an option.';
    if (form.heightUnit === 'imperial') {
      if (!form.heightFt) return 'Please enter your height.';
    } else {
      if (!form.heightCm) return 'Please enter your height.';
    }
    if (form.weightUnit === 'imperial') {
      if (!form.weightLbs) return 'Please enter your weight.';
    } else {
      if (!form.weightKg) return 'Please enter your weight.';
    }
    if (!form.primaryGoal) return 'Please pick a primary goal.';
    return null;
  }, [form]);

  const validateTraining = useCallback(() => {
    if (!form.trainingExperience) return 'Please pick a training level.';
    return null;
  }, [form]);

  const validateSchedule = useCallback(() => {
    if (!form.daysPerWeek) return 'Please pick how many days per week you train.';
    if (!form.sessionDuration) return 'Please pick a session length.';
    return null;
  }, [form]);

  const validateMedical = useCallback(() => {
    if (form.hasCardio === true && form.cardiovascularConditions.length === 0) {
      return 'Please select at least one cardiovascular condition, or change to No.';
    }
    if (form.hasCardio === true && form.cardiovascularConditions.includes('Other') && !form.cardioOther.trim()) {
      return 'Please describe your cardiovascular condition.';
    }
    if (form.hasMedications === true && !form.medicationsAffectingTraining.trim()) {
      return 'Please list your medications, or change to No.';
    }
    if (form.hasRecentSurgery === true) {
      for (const sx of form.surgeries || []) {
        if (!sx.body_region) return 'Please select a body region for each surgery.';
        if (!sx.surgery_year) return 'Please enter the year for each surgery.';
        if (!sx.cleared_for_exercise) return 'Please indicate clearance status for each surgery.';
      }
    }
    return null;
  }, [form]);

  const validateInjuries = useCallback(() => {
    if (form.hasInjuries === true && (!form.injuryRegions || form.injuryRegions.length === 0)) {
      return 'Please select at least one injured area, or go back and change to No.';
    }
    return null;
  }, [form]);

  const validateInjuryDetail = useCallback((regionId) => {
    const detail = form.injuriesByRegion?.[regionId];
    if (!detail) return null;
    if (!detail.injuryType) return 'Please select the injury type.';
    if (!detail.injuryDuration) return 'Please select how long you\'ve had this injury.';
    if (!detail.injuryTrajectory) return 'Please select if it\'s improving, stable, or worsening.';
    if (!detail.physicianCleared) return 'Please indicate if you\'ve been cleared by a physician.';
    return null;
  }, [form]);

  const validateEquipment = useCallback(() => {
    if (!form.equipment || form.equipment.length === 0) {
      return 'Please select at least one equipment option.';
    }
    if (!form.trainingLocation) return 'Please select where you train.';
    return null;
  }, [form]);

  const validateSport = useCallback(() => {
    if (!form.primarySport || form.primarySport.length === 0) {
      return 'Please select at least one sport or activity.';
    }
    return null;
  }, [form]);

  const validateCurrent = useCallback(() => {
    setError(null);
    if (!currentStep) return null;
    let err = null;
    const key = currentStep.key;
    if (key === 'identity')          err = validateIdentity();
    else if (key === 'training')     err = validateTraining();
    else if (key === 'medical')      err = validateMedical();
    else if (key === 'injuries')     err = validateInjuries();
    else if (key.startsWith('injury_detail:'))
      err = validateInjuryDetail(currentStep.regionId);
    else if (key === 'equipment')    err = validateEquipment();
    else if (key === 'schedule')     err = validateSchedule();
    else if (key === 'sport')        err = validateSport();
    if (err) setError(err);
    return err;
  }, [currentStep, validateIdentity, validateTraining, validateMedical, validateInjuries, validateInjuryDetail, validateEquipment, validateSchedule, validateSport]);

  const tryGoNext = useCallback(() => {
    const err = validateCurrent();
    if (err) return false;
    goNext();
    return true;
  }, [validateCurrent, goNext]);

  // ── Save ──────────────────────────────────────────────────────────────
  // Convert the unit-aware form fields into the canonical metric values
  // the table expects, then write the profile and any injury / surgery rows
  // in parallel. Onboarding completion flag is flipped at the end.
  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const heightCm =
        form.heightUnit === 'imperial'
          ? ftInToCm(form.heightFt, form.heightIn)
          : Number(form.heightCm) || null;
      const weightKg =
        form.weightUnit === 'imperial'
          ? lbsToKg(form.weightLbs)
          : Number(form.weightKg) || null;

      const cardioConditions =
        form.hasCardio === true
          ? form.cardiovascularConditions
              .map((c) =>
                c === 'Other' && form.cardioOther.trim()
                  ? `Other: ${form.cardioOther.trim()}`
                  : c
              )
              .filter(Boolean)
          : [];

      const profilePatch = {
        first_name: form.firstName.trim() || null,
        age: Number(form.age) || null,
        biological_sex: form.biologicalSex,
        dominant_hand: form.dominantHand,
        height_cm: heightCm,
        weight_kg: weightKg,
        primary_goal: form.primaryGoal,
        secondary_goal: form.secondaryGoal,
        training_experience: form.trainingExperience,
        former_athlete: form.formerAthlete === true,
        sport_background: form.formerAthlete === true ? form.sportBackground : [],
        activity_level: form.activityLevel,
        training_history_notes: form.trainingHistoryNotes.trim() || null,
        cardiovascular_conditions: cardioConditions,
        medications_affecting_training:
          form.hasMedications === true
            ? form.medicationsAffectingTraining.trim() || null
            : null,
        days_per_week: Number(form.daysPerWeek) || null,
        preferred_days: form.preferredDays,
        session_duration_min: Number(form.sessionDuration) || null,
        avg_sleep: form.avgSleep,
        stress_level: form.stressLevel,
        recovery_level: form.recoveryLevel,
        travel_frequency: form.travelFrequency,
        travel_equipment_access: form.travelEquipmentAccess,
        primary_sport: form.primarySport,
        competition_status: form.competitionStatus,
        performance_goals: form.performanceGoals,
        equipment: form.equipment,
        training_location: form.trainingLocation,
        missing_equipment:
          form.trainingLocation === 'Home Gym'
            ? form.missingEquipment.trim() || null
            : null,
        excluded_exercises: form.excludedExercises.trim() || null,
        injury_causing_exercises: form.injuryCausingExercises.trim() || null,
      };

      const injuryRows =
        form.hasInjuries === true
          ? (form.injuryRegions || []).map((regionId) => {
              const d = form.injuriesByRegion[regionId] || {};
              return {
                body_region: regionId,
                injury_type: d.injury_type || null,
                injury_duration: d.injury_duration || null,
                injury_trajectory: d.injury_trajectory || null,
                pain_at_rest: Number.isFinite(d.pain_at_rest) ? d.pain_at_rest : null,
                pain_during_exercise: Number.isFinite(d.pain_during_exercise)
                  ? d.pain_during_exercise
                  : null,
                aggravating_movements: (d.aggravating_movements || []).filter((m) => m !== 'none'),
                physician_cleared: d.physician_cleared || null,
                in_physical_therapy: d.in_physical_therapy === true,
                active: true,
              };
            })
          : [];

      const surgeryRows =
        form.hasRecentSurgery === true
          ? (form.surgeries || []).filter((s) => s.body_region)
          : [];

      // Order matters: profile first (creates the row referenced by RLS
      // policies on the others), then fan out injury / surgery writes.
      await completeOnboarding(profilePatch);
      await Promise.all([
        ...injuryRows.map((r) => saveInjury(r)),
        ...surgeryRows.map((s) =>
          saveSurgery({
            body_region: s.body_region,
            surgery_month: s.surgery_month ? Number(s.surgery_month) : null,
            surgery_year: s.surgery_year ? Number(s.surgery_year) : null,
            cleared_for_exercise: s.cleared_for_exercise || null,
          })
        ),
      ]);
      return true;
    } catch (e) {
      const msg = e?.message || 'Could not save your profile.';
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [form, completeOnboarding, saveInjury, saveSurgery]);

  return {
    form,
    update,
    updateInjury,
    step,
    steps,
    currentStep,
    totalSteps,
    progress,
    goNext,
    goBack,
    goTo,
    tryGoNext,
    error,
    setError,
    saving,
    submit,
  };
}
