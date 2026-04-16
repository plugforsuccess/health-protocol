import { useProfile } from '../../lib/profileContext.jsx';
import { OnboardingFlow } from './OnboardingFlow.jsx';

// Gate component — sits between auth and the main app shell. While the
// profile is loading we render nothing (the parent shows the auth-screen
// loader). If there's no completed profile, we render the questionnaire.
// Otherwise we let the rest of the app through.

export function OnboardingGate({ onSignOut, children }) {
  const { profile, loading, refreshProfile } = useProfile();

  if (loading) {
    return <div className="loading-screen">Loading profile…</div>;
  }

  const completed = !!profile?.onboarding_completed;
  if (!completed) {
    return (
      <OnboardingFlow
        onSignOut={onSignOut}
        onComplete={refreshProfile}
      />
    );
  }

  return children;
}
