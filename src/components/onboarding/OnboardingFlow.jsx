import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding.js';
import { generateWorkoutPlan } from '../../lib/workoutPlanGenerator.js';
import { ProgressBar } from './components/ProgressBar.jsx';
import { Step1Identity } from './steps/Step1Identity.jsx';
import { Step2TrainingBackground } from './steps/Step2TrainingBackground.jsx';
import { Step3bMedicalHistory } from './steps/Step3bMedicalHistory.jsx';
import { Step3cInjuryRegions } from './steps/Step3cInjuryRegions.jsx';
import { Step3dInjuryDetail } from './steps/Step3dInjuryDetail.jsx';
import { Step3eMovementHistory } from './steps/Step3eMovementHistory.jsx';
import { Step4Equipment } from './steps/Step4Equipment.jsx';
import { Step5Schedule } from './steps/Step5Schedule.jsx';
import { Step6Sport } from './steps/Step6Sport.jsx';
import { Step7Confirmation } from './steps/Step7Confirmation.jsx';

// Multi-step onboarding container. Owns navigation chrome (progress bar +
// back/next buttons) and routes the active step key to the right component.
// Step components are dumb — they receive form + update + error and render
// fields. The hook handles validation and Supabase write.

export function OnboardingFlow({ onComplete, onSignOut }) {
  const onb = useOnboarding();
  const {
    form,
    update,
    updateInjury,
    step,
    steps,
    currentStep,
    totalSteps,
    progress,
    goBack,
    goTo,
    tryGoNext,
    error,
    saving,
    submit,
  } = onb;

  const [generating, setGenerating] = useState(false);
  const [longWait, setLongWait] = useState(false);

  // Simple slide animation between steps. We track the previous step index
  // so we can reverse the slide direction when the user goes back. Flipping
  // a key on the outer div forces React to re-mount the step body so the
  // animation always plays.
  const prevRef = useRef(step);
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    setDirection(step >= prevRef.current ? 'forward' : 'back');
    prevRef.current = step;
  }, [step]);

  // Scroll the step body to the top whenever the step changes. Without this
  // a long step (Step1) leaves the next step scrolled halfway down.
  const bodyRef = useRef(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

  const handleNext = async () => {
    if (currentStep?.key === 'confirmation') {
      const ok = await submit();
      if (!ok) return;

      // Trigger workout plan generation
      setGenerating(true);
      setLongWait(false);
      const timer = setTimeout(() => setLongWait(true), 8000);
      try {
        await generateWorkoutPlan();
      } catch (e) {
        // Non-blocking — user proceeds with hardcoded fallback plan.
        // Retry happens silently on next app open via profileContext refresh.
        console.warn('[OnboardingFlow] workout plan generation failed:', e?.message || e);
      } finally {
        clearTimeout(timer);
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
          <div className="onb-generating-icon">💪</div>
          <h2 className="onb-generating-title">Building your personalized program…</h2>
          <p className="onb-generating-sub">
            Analyzing your goals, schedule, injuries, and equipment
          </p>
          <div className="onb-generating-spinner" />
          {longWait && (
            <p className="onb-generating-sub" style={{ marginTop: 12, opacity: 0.7 }}>
              This may take a moment
            </p>
          )}
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
        <span className="onb-topbar-title">DAILY PROTOCOL</span>
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
        key={`${step}-${currentStep?.key}`}
      >
        <StepBody
          stepKey={currentStep?.key}
          regionId={currentStep?.regionId}
          form={form}
          update={update}
          updateInjury={updateInjury}
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

function StepBody({
  stepKey,
  regionId,
  form,
  update,
  updateInjury,
  error,
  saving,
  onEdit,
  onSubmit,
}) {
  if (!stepKey) return null;
  if (stepKey.startsWith('injury_detail:')) {
    return (
      <Step3dInjuryDetail
        regionId={regionId}
        form={form}
        updateInjury={updateInjury}
        error={error}
      />
    );
  }
  switch (stepKey) {
    case 'identity':
      return <Step1Identity form={form} update={update} error={error} />;
    case 'training':
      return <Step2TrainingBackground form={form} update={update} error={error} />;
    case 'medical':
      return <Step3bMedicalHistory form={form} update={update} error={error} />;
    case 'injuries':
      return <Step3cInjuryRegions form={form} update={update} error={error} />;
    case 'movement_history':
      return <Step3eMovementHistory form={form} update={update} error={error} />;
    case 'equipment':
      return <Step4Equipment form={form} update={update} error={error} />;
    case 'schedule':
      return <Step5Schedule form={form} update={update} error={error} />;
    case 'sport':
      return <Step6Sport form={form} update={update} error={error} />;
    case 'confirmation':
      return (
        <Step7Confirmation
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
