import { useProfile } from '../../lib/profileContext.jsx';
import { OnboardingFlow } from './OnboardingFlow.jsx';
import { DietOnboardingFlow } from './diet/DietOnboardingFlow.jsx';

// Gate component — sits between auth and the main app shell. While the
// profile is loading we render nothing (the parent shows the auth-screen
// loader). Users complete two onboarding flows in sequence:
//   1. Workout questionnaire  →  2. Diet questionnaire
// Once both are done we let the rest of the app through.

export function OnboardingGate({ onSignOut, children }) {
  const { profile, dietProfile, loading, refreshProfile, refreshDietProfile } = useProfile();

  if (loading) {
    return <div className="loading-screen">Loading profile…</div>;
  }

  // Step 1 — workout questionnaire
  const workoutDone = !!profile?.onboarding_completed;
  if (!workoutDone) {
    return (
      <OnboardingFlow
        onSignOut={onSignOut}
        onComplete={refreshProfile}
      />
    );
  }

  // Step 2 — diet questionnaire
  const dietDone = !!dietProfile?.onboarding_completed;
  if (!dietDone) {
    return (
      <DietOnboardingFlow
        onSignOut={onSignOut}
        onComplete={refreshDietProfile}
      />
    );
  }

  // Both complete — show app
  return children;
}
