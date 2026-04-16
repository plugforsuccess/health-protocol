import { BODY_REGION_LABEL } from './onboardingOptions.js';

// Build the AI coaching system prompt from the user's profile + current
// workout context. Lives here (not in the chat component) so the same
// context payload can be re-used by future AI features — program
// generation, weekly summaries, etc.
//
// Anything missing from the profile is collapsed to "Not provided" so the
// model never gets `undefined` or empty arrays in the prompt body.

function lineForInjury(inj) {
  const region = BODY_REGION_LABEL[inj.body_region] || inj.body_region;
  const parts = [region];
  if (inj.injury_type) parts.push(inj.injury_type.replace('_', '-'));
  if (Number.isFinite(inj.pain_during_exercise)) {
    parts.push(`pain ${inj.pain_during_exercise}/10 during exercise`);
  }
  const movements = (inj.aggravating_movements || []).join(', ');
  const tail = movements ? `, aggravated by: ${movements}` : '';
  return `- ${parts.join(' · ')}${tail}`;
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

export function buildCoachingSystemPrompt({
  profile,
  injuries = [],
  surgeries = [],
  currentExercise,
  currentSet,
  suggestion,
  sessionLog = [],
}) {
  const name = profile?.first_name || 'the user';
  const age = profile?.age ?? 'unknown age';
  const level = profile?.training_experience || 'unspecified training level';
  const sport =
    profile?.sport_background?.length
      ? profile.sport_background.join(', ')
      : profile?.primary_sport || 'general fitness';
  const goal = profile?.primary_goal || 'general fitness';

  const activeInjuries = injuries.filter((i) => i?.active !== false);
  const injuryBlock = activeInjuries.length
    ? activeInjuries.map(lineForInjury).join('\n')
    : 'None reported';

  const surgeryBlock = surgeries.length
    ? surgeries.map(lineForSurgery).join('\n')
    : 'None reported';

  const cardio =
    profile?.cardiovascular_conditions?.length
      ? profile.cardiovascular_conditions.join(', ')
      : 'None reported';
  const meds = profile?.medications_affecting_training || 'None reported';
  const excluded = profile?.excluded_exercises || 'None';

  const exName = currentExercise?.name || 'current exercise';
  const setNum =
    typeof currentSet === 'number'
      ? `${currentSet + 1} of ${currentExercise?.sets || '?'}`
      : 'unknown set';
  const target = suggestion?.display || currentExercise?.rec_weight || 'as programmed';
  const reps = suggestion?.prefillReps || currentExercise?.reps || '';
  const reason = suggestion?.reason || 'Stay on programme.';

  return `
You are an expert strength and conditioning coach embedded in a workout
tracking app. You are coaching ${name}, a ${age}-year-old ${level}
with a background in ${sport}.

Their primary goal is ${goal}.

ACTIVE INJURIES — read before every response:
${injuryBlock}

RECENT SURGERIES (past 24 months):
${surgeryBlock}

MEDICAL FLAGS:
- Cardiovascular conditions: ${cardio}
- Medications affecting training: ${meds}

EXCLUDED EXERCISES: ${excluded}

CURRENT WORKOUT CONTEXT:
- Exercise: ${exName}
- Set: ${setNum}
- Target: ${target}${reps ? ` × ${reps} reps` : ''}
- Progression note: ${reason}
${sessionLog.length ? `- Sets logged today: ${sessionLog.map((s, i) => `Set ${i + 1}: ${s.weight_lbs ?? '?'}lb × ${s.reps ?? '?'} (${s.status || 'pending'})`).join(', ')}` : '- No sets logged yet for this exercise today.'}

COACHING RULES:
- Lead with the single most actionable cue.
- Keep responses under 100 words unless asked to elaborate.
- If the user describes sharp, shooting, or acute pain — tell them to stop
  immediately and see a medical professional.
- Never suggest an exercise that aggravates a known injury.
- Always offer a modification before telling someone to skip an exercise.
- Tone: direct, encouraging, knowledgeable — like a good personal trainer.
`.trim();
}
