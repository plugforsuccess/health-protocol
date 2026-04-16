import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useProfile } from '../lib/profileContext.jsx';

// Diet onboarding form state. Same pattern as useOnboarding — one big
// object, multi-step navigation, single Supabase write at the end.
// The diet profile is stored in a separate `user_diet_profiles` table
// and the generated meal plan goes to `user_meal_plans`.

function makeInitial() {
  return {
    // Section 1 — Goals & Medical
    primaryGoal: null,
    secondaryGoal: null,
    conditions: [],
    colonoscopyPlanned: null,
    familyHistory: [],
    hasFoodMedications: null,
    foodMedications: '',
    // Section 2 — Food Preferences
    dietaryFramework: null,
    allergies: [],
    intolerances: [],
    foodDislikes: '',
    foodPreferences: '',
    redMeatFrequency: null,
    alcoholFrequency: null,
    // Section 3 — Gut Health
    gutSymptoms: [],
    symptomFrequency: null,
    triggerFoods: '',
    hasGutSupplements: null,
    currentGutSupplements: [],
    gutSupplementOther: '',
    antibioticHistory: null,
    bowelRegularity: null,
    // Section 4 — Cooking Reality
    cookingSkill: null,
    weekdayCookTime: null,
    weekendCookTime: null,
    mealPreps: null,
    weeklyBudget: null,
    eatsOut: null,
    eatsOutRestaurantTypes: [],
    // Section 5 — Kitchen Equipment
    kitchenEquipment: [],
    // Section 6 — Eating Patterns
    mealsPerDay: null,
    intermittentFasting: null,
    biggestMeal: null,
    lateNightEating: null,
    breakfastEater: null,
    dailyHydration: null,
    caffeineConsumption: null,
    // Section 7 — Meal Preferences
    mealVariety: null,
    cuisinePreferences: [],
    spiceTolerance: null,
    snacker: null,
    mealPrepStyle: null,
    // Section 8 — Supplements
    hasCurrentSupplements: null,
    currentSupplements: '',
    proteinPowder: null,
    supplementWillingness: null,
    supplementBudget: null,
  };
}

export function useDietOnboarding() {
  const { profile } = useProfile();
  const [form, setForm] = useState(makeInitial);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback((patch) => {
    setForm((prev) =>
      typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
    );
  }, []);

  // ── Step plan ──────────────────────────────────────────────────────────
  const steps = useMemo(() => [
    { key: 'goals',            title: 'Your health picture' },
    { key: 'food_preferences', title: 'What you eat' },
    { key: 'gut_health',       title: 'Your gut health' },
    { key: 'cooking_reality',  title: 'How you actually cook' },
    { key: 'equipment',        title: 'Your kitchen setup' },
    { key: 'eating_patterns',  title: 'How you eat' },
    { key: 'meal_preferences', title: 'Your meal preferences' },
    { key: 'supplements',      title: 'Supplements & nutrition' },
    { key: 'confirmation',     title: 'Your diet profile' },
  ], []);

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
  const validateGoals = useCallback(() => {
    if (!form.primaryGoal) return 'Please select a primary diet goal.';
    return null;
  }, [form]);

  const validateFoodPrefs = useCallback(() => {
    if (!form.dietaryFramework) return 'Please select a dietary framework.';
    if (form.allergies.length === 0) return 'Please select your allergies or None.';
    return null;
  }, [form]);

  const validateCooking = useCallback(() => {
    if (!form.cookingSkill) return 'Please select your cooking skill level.';
    if (!form.weekdayCookTime) return 'Please select weekday cooking time.';
    if (!form.mealPreps) return 'Please select a meal prep preference.';
    return null;
  }, [form]);

  const validateCurrent = useCallback(() => {
    setError(null);
    if (!currentStep) return null;
    let err = null;
    switch (currentStep.key) {
      case 'goals':            err = validateGoals();    break;
      case 'food_preferences': err = validateFoodPrefs(); break;
      case 'cooking_reality':  err = validateCooking();  break;
      default: err = null;
    }
    if (err) setError(err);
    return err;
  }, [currentStep, validateGoals, validateFoodPrefs, validateCooking]);

  const tryGoNext = useCallback(() => {
    const err = validateCurrent();
    if (err) return false;
    goNext();
    return true;
  }, [validateCurrent, goNext]);

  // ── Save ──────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const userId = profile?.user_id;
      if (!userId) throw new Error('Not signed in.');

      const gutSupps =
        form.hasGutSupplements === true
          ? [
              ...form.currentGutSupplements,
              ...(form.gutSupplementOther.trim()
                ? [`Other: ${form.gutSupplementOther.trim()}`]
                : []),
            ]
          : [];

      const payload = {
        user_id: userId,
        // Goals & Medical
        primary_goal: form.primaryGoal,
        secondary_goal: form.secondaryGoal,
        conditions:
          form.conditions.includes('None') ? [] : form.conditions,
        colonoscopy_planned: form.colonoscopyPlanned,
        family_history:
          form.familyHistory.includes('None') ? [] : form.familyHistory,
        food_medications:
          form.hasFoodMedications === true
            ? form.foodMedications.trim() || null
            : null,
        // Food Preferences
        dietary_framework: form.dietaryFramework,
        allergies:
          form.allergies.includes('None') ? [] : form.allergies,
        intolerances:
          form.intolerances.includes('None') ? [] : form.intolerances,
        food_dislikes: form.foodDislikes.trim() || null,
        food_preferences: form.foodPreferences.trim() || null,
        red_meat_frequency: form.redMeatFrequency,
        alcohol_frequency: form.alcoholFrequency,
        // Gut Health
        gut_symptoms:
          form.gutSymptoms.includes('None') ? [] : form.gutSymptoms,
        symptom_frequency:
          form.gutSymptoms.length > 0 && !form.gutSymptoms.includes('None')
            ? form.symptomFrequency
            : null,
        trigger_foods: form.triggerFoods.trim() || null,
        current_gut_supplements: gutSupps,
        antibiotic_history: form.antibioticHistory,
        bowel_regularity: form.bowelRegularity,
        // Cooking
        cooking_skill: form.cookingSkill,
        weekday_cook_time: form.weekdayCookTime,
        weekend_cook_time: form.weekendCookTime,
        meal_preps: form.mealPreps,
        weekly_budget: form.weeklyBudget,
        eats_out: form.eatsOut,
        eats_out_restaurant_types:
          form.eatsOut === '3–5x per week' || form.eatsOut === 'Most meals'
            ? form.eatsOutRestaurantTypes
            : [],
        kitchen_equipment: form.kitchenEquipment,
        // Eating Patterns
        meals_per_day: form.mealsPerDay ? Number(form.mealsPerDay) : null,
        intermittent_fasting: form.intermittentFasting,
        biggest_meal: form.biggestMeal,
        late_night_eating: form.lateNightEating,
        breakfast_eater: form.breakfastEater,
        daily_hydration: form.dailyHydration,
        caffeine_consumption: form.caffeineConsumption,
        // Preferences
        meal_variety: form.mealVariety,
        cuisine_preferences:
          form.cuisinePreferences.includes('No preference')
            ? []
            : form.cuisinePreferences,
        spice_tolerance: form.spiceTolerance,
        snacker: form.snacker,
        meal_prep_style: form.mealPrepStyle,
        // Supplements
        current_supplements:
          form.hasCurrentSupplements === true
            ? form.currentSupplements.trim() || null
            : null,
        protein_powder: form.proteinPowder,
        supplement_willingness: form.supplementWillingness,
        supplement_budget: form.supplementBudget,
        // Meta
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      const { error: dbErr } = await supabase
        .from('user_diet_profiles')
        .upsert(payload, { onConflict: 'user_id' });
      if (dbErr) throw dbErr;

      return true;
    } catch (e) {
      const msg = e?.message || 'Could not save your diet profile.';
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [form, profile]);

  return {
    form,
    update,
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
    generating,
    setGenerating,
    submit,
  };
}
