import { useEffect, useMemo, useRef } from 'react';
import { useProfile } from '../lib/profileContext.jsx';
import { WORKOUT_WEEK } from '../data/workoutWeek.js';
import { generateWorkoutPlan } from '../lib/workoutPlanGenerator.js';

// Resolves the active workout plan — reads from user_workout_plans
// (via profileContext) and falls back to the hardcoded WORKOUT_WEEK
// silently if no DB plan exists or the plan is malformed.
//
// The returned `weekPlan` has the same shape as WORKOUT_WEEK: an array
// of 7 day objects ordered Sun–Sat, each with warmup[], exercises[],
// cooldown[], mobility[], rest_tips[].
//
// `planSource` is 'ai' or 'fallback' — UI can use this if needed but
// should NOT show a banner or error when on fallback.
//
// If onboarding is complete but no plan exists (e.g. user closed the
// app during generation), this hook silently retries generation in the
// background. The fallback plan shows immediately — no blocking screen.

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizePlanDays(planData) {
  if (!planData?.days || !Array.isArray(planData.days) || planData.days.length !== 7) {
    return null;
  }

  // Sort days Sun–Sat regardless of how the AI ordered them
  const byDay = {};
  for (const d of planData.days) {
    byDay[d.day] = d;
  }

  const sorted = DAY_ORDER.map((abbr) => {
    const d = byDay[abbr];
    if (!d) return null;
    // Normalize hotel_variant inner arrays if present
    const hv = d.hotel_variant
      ? {
          ...d.hotel_variant,
          warmup: d.hotel_variant.warmup || [],
          exercises: (d.hotel_variant.exercises || []).map((ex) => ({
            ...ex,
            injury: ex.injury ?? null,
          })),
          cooldown: d.hotel_variant.cooldown || [],
        }
      : null;

    return {
      ...d,
      // Ensure all arrays exist so downstream never crashes
      warmup: d.warmup || [],
      exercises: (d.exercises || []).map((ex) => ({
        ...ex,
        injury: ex.injury ?? null,
      })),
      cooldown: d.cooldown || [],
      mobility: d.mobility || [],
      rest_tips: d.rest_tips || [],
      hotel_variant: hv,
    };
  });

  // If any day is missing, the plan is invalid
  if (sorted.some((d) => d === null)) return null;
  return sorted;
}

export function useWorkoutPlan() {
  const { profile, activeWorkoutPlan, loading, refreshWorkoutPlan } = useProfile();
  const retryAttempted = useRef(false);

  // Background retry: onboarding complete but no active plan.
  // Fires once per app session — not on every render.
  useEffect(() => {
    if (loading) return;
    if (retryAttempted.current) return;
    const onboardingDone = !!profile?.onboarding_completed;
    const hasPlan = !!activeWorkoutPlan;

    if (onboardingDone && !hasPlan) {
      retryAttempted.current = true;
      generateWorkoutPlan()
        .then(() => refreshWorkoutPlan?.())
        .catch((e) => {
          console.warn('[useWorkoutPlan] background retry failed:', e?.message || e);
        });
    }
  }, [loading, profile, activeWorkoutPlan, refreshWorkoutPlan]);

  return useMemo(() => {
    if (activeWorkoutPlan?.plan_data) {
      const normalized = normalizePlanDays(activeWorkoutPlan.plan_data);
      if (normalized) {
        return {
          weekPlan: normalized,
          planSource: 'ai',
          planSummary: activeWorkoutPlan.plan_data.planSummary || null,
        };
      }
    }
    // Silent fallback — no error, no banner
    return {
      weekPlan: WORKOUT_WEEK,
      planSource: 'fallback',
      planSummary: null,
    };
  }, [activeWorkoutPlan]);
}
