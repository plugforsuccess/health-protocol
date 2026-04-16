import { supabase } from './supabase.js';
import { BODY_REGION_LABEL } from './onboardingOptions.js';

// Builds the system prompt for Claude workout plan generation and calls
// the Claude API. The generated plan is stored in `user_workout_plans`
// and returned to the caller.
//
// Mirrors mealPlanGenerator.js architecture exactly.

// ─────────────────────────────────────────────────────────────────────
// EXERCISE NAME NORMALIZATION
// ─────────────────────────────────────────────────────────────────────
// Used by the progression engine to match history across plan
// regenerations. "Romanian Deadlift (Dumbbells)" and "Romanian
// Deadlift" should match. Strips parentheticals, punctuation, and
// collapses whitespace.

export function normalizeExerciseName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')     // strip parentheticals
    .replace(/[^a-z0-9\s]/g, '') // strip punctuation
    .trim()
    .replace(/\s+/g, ' ');       // collapse whitespace
}

// ─────────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────

function lineForInjury(inj) {
  const region = BODY_REGION_LABEL[inj.body_region] || inj.body_region;
  const parts = [region];
  if (inj.injury_type) parts.push(inj.injury_type.replace('_', '-'));
  if (Number.isFinite(inj.pain_during_exercise)) {
    parts.push(`pain ${inj.pain_during_exercise}/10 during exercise`);
  }
  const trajectory = inj.injury_trajectory || 'unknown';
  const duration = inj.injury_duration || 'unspecified duration';
  const movements = (inj.aggravating_movements || []).join(', ');
  return `- ${parts.join(' · ')}, trajectory: ${trajectory}, duration: ${duration}${movements ? `, aggravated by: ${movements}` : ''}`;
}

function lineForSurgery(sx) {
  const region = BODY_REGION_LABEL[sx.body_region] || sx.body_region;
  const date =
    sx.surgery_month && sx.surgery_year
      ? `${sx.surgery_month}/${sx.surgery_year}`
      : sx.surgery_year
        ? `${sx.surgery_year}`
        : 'date unknown';
  const cleared =
    sx.cleared_for_exercise === 'yes'
      ? 'cleared'
      : sx.cleared_for_exercise === 'partially'
        ? 'partially cleared'
        : sx.cleared_for_exercise === 'no'
          ? 'NOT cleared for exercise'
          : 'clearance unknown';
  return `- ${region} (${date}, ${cleared})`;
}

export function buildWorkoutPlanPrompt({ profile, injuries, surgeries }) {
  const activeInjuries = (injuries || [])
    .filter((i) => i?.active !== false)
    .map(lineForInjury)
    .join('\n') || 'None reported';

  const recentSurgeries = (surgeries || [])
    .map(lineForSurgery)
    .join('\n') || 'None reported';

  const cardio =
    profile?.cardiovascular_conditions?.length
      ? profile.cardiovascular_conditions.join(', ')
      : 'None reported';
  const cardioWarning = profile?.cardiovascular_conditions?.length
    ? '\n⚠ Modify high-intensity intervals — no maximal effort sets'
    : '';

  return `
You are an expert strength and conditioning coach. Generate a
personalized weekly workout program as valid JSON only.

USER PROFILE:
- Name: ${profile?.first_name || 'User'}
- Age: ${profile?.age ?? 'unknown'}
- Sex: ${profile?.biological_sex || 'not specified'}
- Dominant hand: ${profile?.dominant_hand || 'not specified'}
- Goal: ${profile?.primary_goal || 'General fitness'}
- Secondary goal: ${profile?.secondary_goal || 'None'}
- Training experience: ${profile?.training_experience || 'not specified'}
- Former athlete: ${profile?.former_athlete ? 'Yes' : 'No'}
- Sport background: ${profile?.sport_background?.join(', ') || 'None'}
- Activity level: ${profile?.activity_level || 'not specified'}

SCHEDULE:
- Days available: ${profile?.days_per_week ?? 3} per week
- Preferred days: ${profile?.preferred_days?.join(', ') || 'Not specified'}
- Session duration: ${profile?.session_duration_min || 45} min
- Sleep: ${profile?.avg_sleep || 'Not specified'}
- Stress: ${profile?.stress_level || 'Not specified'}
- Recovery: ${profile?.recovery_level || 'Not specified'}
- Travel frequency: ${profile?.travel_frequency || 'Not specified'}
- Travel equipment access: ${profile?.travel_equipment_access || 'Not specified'}

EQUIPMENT AVAILABLE:
${profile?.equipment?.join(', ') || 'Bodyweight only'}
Training location: ${profile?.training_location || 'Not specified'}
Missing equipment user wishes they had: ${profile?.missing_equipment || 'None'}

SPORT & PERFORMANCE:
- Primary sport: ${profile?.primary_sport || 'None'}
- Competition status: ${profile?.competition_status || 'Not competing'}
- Performance goals: ${profile?.performance_goals?.join(', ') || 'None'}

ACTIVE INJURIES — build around these, never aggravate:
${activeInjuries}

RECENT SURGERIES:
${recentSurgeries}

CARDIOVASCULAR CONDITIONS:
${cardio}${cardioWarning}

EXCLUDED EXERCISES:
${profile?.excluded_exercises || 'None'}

EXERCISES THAT HAVE CAUSED INJURY:
${profile?.injury_causing_exercises || 'None'}

TRAINING NOTES:
${profile?.training_history_notes || 'None'}

TRAVEL CONTEXT:
- Travel frequency: ${profile?.travel_frequency || 'rarely'}
- Equipment when traveling: ${profile?.travel_equipment_access || 'Unknown — assume bodyweight only'}

OUTPUT REQUIREMENTS:
Return valid JSON only — no markdown, no explanation outside JSON.

Schema:
{
  "planSummary": "2-3 sentence overview of why this plan suits the user",
  "generatedAt": "ISO timestamp",
  "days": [
    {
      "day": "Sun",
      "label": "Sunday",
      "type": "strength | mobility | conditioning | rest",
      "icon": "emoji",
      "title": "Session Title",
      "duration": "55 min",
      "focus": "Primary · Secondary · Tertiary",
      "warmup": [
        {
          "name": "Exercise Name",
          "detail": "Duration/reps — coaching cue",
          "sets": 2
        }
      ],
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 4,
          "reps": "10",
          "rec_weight": "30lb dumbbell",
          "note": "Coaching note explaining form and purpose",
          "injury": null
        }
      ],
      "cooldown": [
        {
          "name": "Stretch Name",
          "detail": "Duration — technique cue"
        }
      ],
      "mobility": [],
      "rest_tips": [],
      "hotel_variant": null | {
        "title": "Hotel Session Title",
        "equipment": "Equipment available description",
        "warmup": [{ "name": "...", "detail": "...", "sets": 2 }],
        "exercises": [{ "name": "...", "sets": 4, "reps": "10", "rec_weight": "...", "note": "..." }],
        "cooldown": [{ "name": "...", "detail": "..." }]
      }
    }
  ]
}

RULES:
1. Return valid JSON only — no markdown fences, no preamble
2. Generate exactly 7 days — one per day of the week ordered Sun through Sat
3. Use 3-letter day abbreviations: Sun, Mon, Tue, Wed, Thu, Fri, Sat
4. Respect days_per_week — if user has ${profile?.days_per_week ?? 3} training days, program ${profile?.days_per_week ?? 3} training days and ${7 - (profile?.days_per_week ?? 3)} rest/active recovery days
5. Preferred days MUST be training days — rest days fill the gaps
6. type "rest" days: populate rest_tips[], leave exercises/warmup/cooldown/mobility empty arrays
7. type "mobility" days: populate mobility[], leave exercises empty array
8. type "strength" or "conditioning" days: populate warmup[], exercises[], cooldown[], leave mobility/rest_tips as empty arrays
9. Never include exercises that aggravate active injuries
10. If cardiovascular condition exists — cap conditioning intensity, no max-effort intervals, include RPE guidance in notes
11. Equipment in rec_weight must only reference what is available: ${profile?.equipment?.join(', ') || 'bodyweight only'}
12. injury field on exercises: null if safe, brief warning string if modification needed
13. Include sport-specific movements if sport background exists
14. Session duration must match ${profile?.session_duration_min || 45} min — adjust exercise count accordingly
15. planSummary must explain why this specific plan suits this user
16. Exercise names must be specific and standard (e.g. "Goblet Squat" not "squat", "Dumbbell Bench Press" not "bench") so the progression engine can classify them
17. For weighted exercises, rec_weight format: "Xlb description" (e.g. "30lb dumbbell", "25lb each hand")
18. For bodyweight exercises, rec_weight: "Bodyweight" or "Bodyweight — add Xlb when ready"
19. For timed/cardio exercises, reps format: "Xs" or "X min ON / X min OFF"
20. HOTEL VARIANTS — travel frequency is "${profile?.travel_frequency || 'rarely'}":
    - If travel_frequency is "rarely": set hotel_variant to null on ALL days
    - Otherwise: for every strength and conditioning day, generate a hotel_variant object
    - hotel_variant uses ONLY the equipment from travel_equipment_access: "${profile?.travel_equipment_access || 'bodyweight only'}"
    - If travel equipment is "bodyweight only": zero equipment exercises only
    - If travel equipment is "hotel gym (basic)": dumbbells + treadmill + bench only
    - If travel equipment is "full commercial gym": same as primary plan, different exercise order
    - If travel equipment is "resistance bands only": bands + bodyweight only
    - hotel_variant must hit the same muscle groups as the primary session
    - hotel_variant duration must match session_duration_min (${profile?.session_duration_min || 45} min)
    - hotel_variant exercises must include sets, reps, rec_weight, and coaching note
    - Rest days and mobility days: set hotel_variant to null
`.trim();
}

// ─────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function validateWorkoutPlan(plan, profile) {
  if (!plan || typeof plan !== 'object') return 'Plan is not an object';
  if (!Array.isArray(plan.days) || plan.days.length !== 7) return 'Plan must have exactly 7 days';

  for (let i = 0; i < plan.days.length; i++) {
    const d = plan.days[i];
    if (!d.type) return `Day ${i} missing type`;
    if (!d.title) return `Day ${i} missing title`;
    if (!['strength', 'conditioning', 'mobility', 'rest'].includes(d.type)) {
      return `Day ${i} has invalid type: ${d.type}`;
    }
    if (!DAY_ABBREVS.includes(d.day)) return `Day ${i} has invalid day abbreviation: ${d.day}`;

    if (d.type === 'rest') {
      if (!Array.isArray(d.rest_tips) || d.rest_tips.length === 0) {
        return `Day ${i} is rest but has no rest_tips`;
      }
    } else if (d.type === 'mobility') {
      if (!Array.isArray(d.mobility) || d.mobility.length === 0) {
        return `Day ${i} is mobility but has no mobility items`;
      }
    } else {
      // strength or conditioning — must have at least one exercise
      if (!Array.isArray(d.exercises) || d.exercises.length === 0) {
        return `Day ${i} is ${d.type} but has no exercises`;
      }
      for (let j = 0; j < d.exercises.length; j++) {
        const ex = d.exercises[j];
        if (!ex.name) return `Day ${i} exercise ${j} missing name`;
        if (!ex.sets || !ex.reps) return `Day ${i} exercise ${j} missing sets or reps`;
      }
    }
  }

  // Check equipment references (best-effort)
  if (profile?.equipment?.length) {
    const available = new Set(
      (profile.equipment || []).map((e) => e.toLowerCase())
    );
    // Only flag if rec_weight mentions clearly unavailable heavy equipment
    // (barbell, cable machine, etc.) — skip if user has 'full gym' or similar
    const hasFullGym = available.has('full gym') || available.has('gym membership');
    if (!hasFullGym) {
      for (const d of plan.days) {
        for (const ex of d.exercises || []) {
          const rw = (ex.rec_weight || '').toLowerCase();
          if (rw.includes('barbell') && !available.has('barbell')) {
            return `Exercise "${ex.name}" references barbell but user doesn't have one`;
          }
          if ((rw.includes('cable') || rw.includes('machine')) && !available.has('cable machine') && !available.has('cables')) {
            return `Exercise "${ex.name}" references cable/machine but user doesn't have one`;
          }
        }
      }
    }
  }

  // Hotel variant check — warn but never fail the plan
  if (profile?.travel_frequency && profile.travel_frequency !== 'rarely') {
    const trainingDays = plan.days.filter(
      (d) => d.type === 'strength' || d.type === 'conditioning'
    );
    const missingVariants = trainingDays.filter((d) => !d.hotel_variant);
    if (missingVariants.length > 0) {
      console.warn(
        `[WorkoutPlan] Missing hotel variants for: ${missingVariants.map((d) => d.day).join(', ')}. ` +
        `Primary plan is valid — hotel variants will be unavailable for these days.`
      );
    }
  }

  return null; // valid
}

// ─────────────────────────────────────────────────────────────────────
// GENERATE + STORE
// ─────────────────────────────────────────────────────────────────────

export async function generateWorkoutPlan() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [{ data: profile }, { data: injuries }, { data: surgeries }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_injuries')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('user_surgeries')
      .select('*')
      .eq('user_id', user.id),
  ]);

  if (!profile) throw new Error('Profile not found');

  const prompt = buildWorkoutPlanPrompt({
    profile,
    injuries: injuries || [],
    surgeries: surgeries || [],
  });

  // Call Claude API directly (same pattern as coaching chat).
  // When the edge function is built, swap to:
  //   supabase.functions.invoke('generate-workout-plan', { body: { prompt } })
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || '';

  // Parse JSON — Claude sometimes wraps in markdown fences
  let planData;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    planData = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse workout plan JSON');
  }

  // Validate before storing
  const validationError = validateWorkoutPlan(planData, profile);
  if (validationError) {
    console.warn('[workoutPlanGenerator] validation failed:', validationError);
    throw new Error(`Plan validation failed: ${validationError}`);
  }

  // Ensure every day has all arrays to prevent UI crashes
  planData.days = planData.days.map((d) => ({
    ...d,
    warmup: d.warmup || [],
    exercises: d.exercises || [],
    cooldown: d.cooldown || [],
    mobility: d.mobility || [],
    rest_tips: d.rest_tips || [],
  }));

  // If this is the user's first AI plan, check if they have workout
  // history from the hardcoded plan. If so, snapshot it as a "v0" row
  // so it appears in Previous Programs and can be reactivated.
  const { count: existingPlanCount } = await supabase
    .from('user_workout_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (existingPlanCount === 0) {
    const { count: setCount } = await supabase
      .from('workout_sets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (setCount > 0) {
      // User has history against the hardcoded plan — preserve it
      const { WORKOUT_WEEK } = await import('../data/workoutWeek.js');
      await supabase.from('user_workout_plans').insert({
        user_id: user.id,
        plan_data: {
          planSummary: 'Original hand-built program from app launch. Sport-specific for basketball, tennis, and golf with elbow rehab protocol.',
          generatedAt: new Date().toISOString(),
          days: WORKOUT_WEEK,
        },
        is_active: false,
        generation_prompt_version: 'v0',
        week_start_date: null,
      });
    }
  }

  // Mark any existing active plan as inactive (keep for history)
  await supabase
    .from('user_workout_plans')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Store the new plan
  const { error: insertErr } = await supabase
    .from('user_workout_plans')
    .insert({
      user_id: user.id,
      plan_data: planData,
      is_active: true,
      generation_prompt_version: 'v1',
      week_start_date: getNextSunday(),
    });

  if (insertErr) throw insertErr;

  return planData;
}

function getNextSunday() {
  const d = new Date();
  const day = d.getDay();
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d.toISOString().slice(0, 10);
}
