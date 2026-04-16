import { useEffect, useRef, useState } from 'react';
import { useDietOnboarding } from '../../../hooks/useDietOnboarding.js';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { DietStep1Goals } from './steps/DietStep1Goals.jsx';
import { DietStep2FoodPreferences } from './steps/DietStep2FoodPreferences.jsx';
import { DietStep3GutHealth } from './steps/DietStep3GutHealth.jsx';
import { DietStep4CookingReality } from './steps/DietStep4CookingReality.jsx';
import { DietStep5Equipment } from './steps/DietStep5Equipment.jsx';
import { DietStep6EatingPatterns } from './steps/DietStep6EatingPatterns.jsx';
import { DietStep7MealPreferences } from './steps/DietStep7MealPreferences.jsx';
import { DietStep8Supplements } from './steps/DietStep8Supplements.jsx';
import { DietStep9Confirmation } from './steps/DietStep9Confirmation.jsx';
import { generateMealPlan } from '../../../lib/mealPlanGenerator.js';

// Diet onboarding multi-step container. Same architecture as
// OnboardingFlow — owns navigation chrome, routes step keys to
// components. Step components are dumb (form + update + error).

export function DietOnboardingFlow({ onComplete, onSignOut }) {
  const onb = useDietOnboarding();
  const {
    form,
    update,
    step,
    steps,
    currentStep,
    totalSteps,
    progress,
    goBack,
    goTo,
    tryGoNext,
    error,
    setError,
    saving,
    generating,
    setGenerating,
    submit,
  } = onb;

  const prevRef = useRef(step);
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    setDirection(step >= prevRef.current ? 'forward' : 'back');
    prevRef.current = step;
  }, [step]);

  const bodyRef = useRef(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

  const handleNext = async () => {
    if (currentStep?.key === 'confirmation') {
      const ok = await submit();
      if (!ok) return;

      // Trigger meal plan generation
      setGenerating(true);
      try {
        await generateMealPlan();
      } catch (e) {
        // Non-blocking — user can still proceed; meal plan can be
        // regenerated later from the Diet tab.
        console.warn('[DietOnboarding] meal plan generation failed:', e?.message || e);
      } finally {
        setGenerating(false);
      }
      onComplete?.();
      return;
    }
    tryGoNext();
  };

  const handleEditFromConfirmation = () => goTo(0);

  if (generating) {
    return (
      <div className="onb-screen">
        <div className="onb-generating">
          <div className="onb-generating-icon">🥗</div>
          <h2 className="onb-generating-title">Building your personalized meal plan…</h2>
          <p className="onb-generating-sub">
            Analyzing your health goals, restrictions, and cooking reality
          </p>
          <div className="onb-generating-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="onb-screen">
      <div className="onb-topbar">
        <button
          type="button"
          className="onb-link-btn"
          onClick={goBack}
          disabled={step === 0}
          aria-label="Back"
        >
          ← Back
        </button>
        <span className="onb-topbar-title">DIET PROFILE</span>
        <button
          type="button"
          className="onb-link-btn muted"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </div>

      <ProgressBar step={step} total={totalSteps} />

      <div
        ref={bodyRef}
        className={`onb-stage ${direction}`}
        key={`diet-${step}-${currentStep?.key}`}
      >
        <DietStepBody
          stepKey={currentStep?.key}
          form={form}
          update={update}
          error={error}
          saving={saving}
          onEdit={handleEditFromConfirmation}
          onSubmit={handleNext}
        />
      </div>

      {currentStep?.key !== 'confirmation' && (
        <div className="onb-footer">
          <div className="onb-progress-mini">
            {Math.round(progress * 100)}% complete
          </div>
          <button
            type="button"
            className="onb-btn primary"
            onClick={handleNext}
          >
            {step === totalSteps - 1 ? 'Finish' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
}

function DietStepBody({ stepKey, form, update, error, saving, onEdit, onSubmit }) {
  if (!stepKey) return null;
  switch (stepKey) {
    case 'goals':
      return <DietStep1Goals form={form} update={update} error={error} />;
    case 'food_preferences':
      return <DietStep2FoodPreferences form={form} update={update} error={error} />;
    case 'gut_health':
      return <DietStep3GutHealth form={form} update={update} error={error} />;
    case 'cooking_reality':
      return <DietStep4CookingReality form={form} update={update} error={error} />;
    case 'equipment':
      return <DietStep5Equipment form={form} update={update} error={error} />;
    case 'eating_patterns':
      return <DietStep6EatingPatterns form={form} update={update} error={error} />;
    case 'meal_preferences':
      return <DietStep7MealPreferences form={form} update={update} error={error} />;
    case 'supplements':
      return <DietStep8Supplements form={form} update={update} error={error} />;
    case 'confirmation':
      return (
        <DietStep9Confirmation
          form={form}
          onEdit={onEdit}
          onSubmit={onSubmit}
          saving={saving}
          error={error}
        />
      );
    default:
      return null;
  }
}
