// Build the AI nutrition coaching system prompt from the user's diet profile,
// workout profile, and optional current meal context.
//
// Parallel to coachingPrompt.js for workouts — lives in lib/ so it can be
// reused by future AI features (meal plan generation, weekly digests, etc.).

export function buildNutritionCoachPrompt({ dietProfile, workoutProfile, currentMeal }) {
  const dp = dietProfile || {};
  const wp = workoutProfile || {};

  const name = wp.first_name || 'the user';
  const age = wp.age ?? 'unknown age';
  const goal = dp.primaryGoal || dp.primary_goal || 'general nutrition';

  const conditionsList = dp.conditions?.join(', ') || 'None';
  const allergyList = dp.allergies?.join(', ') || 'None';
  const intoleranceList = dp.intolerances?.join(', ') || 'None';
  const gutSymptoms = dp.gutSymptoms?.join(', ') || dp.gut_symptoms?.join(', ') || 'None';
  const triggerFoods = dp.triggerFoods || dp.trigger_foods || 'None identified';
  const gutSupplements = dp.currentGutSupplements?.join(', ') || dp.current_gut_supplements?.join(', ') || 'None';

  const colonoscopy = dp.colonoscopyPlanned || dp.colonoscopy_planned || '';
  const familyHx = dp.familyHistory || dp.family_history || [];
  const dietFramework = dp.dietaryFramework || dp.dietary_framework || 'No specific framework';
  const redMeat = dp.redMeatFrequency || dp.red_meat_frequency || 'Not specified';
  const mealsPerDay = dp.mealsPerDay || dp.meals_per_day || 'Not specified';
  const fasting = dp.intermittentFasting || dp.intermittent_fasting || 'No';
  const breakfast = dp.breakfastEater || dp.breakfast_eater || 'Not specified';
  const hydration = dp.dailyHydration || dp.daily_hydration || 'Not specified';
  const antibiotics = dp.antibioticHistory || dp.antibiotic_history || 'None reported';

  let mealBlock = 'General nutrition question \u2014 no specific meal context.';
  if (currentMeal) {
    const ingredients = currentMeal.ingredients?.join(', ') || 'not listed';
    mealBlock = `CURRENT MEAL CONTEXT:
The user is looking at: ${currentMeal.name} (${currentMeal.time})
Ingredients: ${ingredients}
Protocol note: ${currentMeal.protocolNote || currentMeal.protocol_note || ''}`;
  }

  return `
You are a functional medicine nutritionist and gut health expert embedded
in a health tracking app. You are advising ${name},
a ${age}-year-old whose primary diet goal is ${goal}.

HEALTH CONDITIONS:
${conditionsList}
${colonoscopy ? `Colonoscopy planned: ${colonoscopy}` : ''}
${familyHx.length ? `Family history: ${familyHx.join(', ')}` : ''}

STRICT DIETARY RESTRICTIONS \u2014 never recommend foods that conflict:
- Allergies: ${allergyList}
- Intolerances: ${intoleranceList}
- Trigger foods: ${triggerFoods}
- Dietary framework: ${dietFramework}
- Red meat: ${redMeat}

GUT HEALTH STATUS:
- Current symptoms: ${gutSymptoms}
- Current gut supplements: ${gutSupplements}
- Antibiotic history: ${antibiotics}

EATING PATTERNS:
- Meals per day: ${mealsPerDay}
- Intermittent fasting: ${fasting}
- Breakfast eater: ${breakfast}
- Daily hydration: ${hydration}

${mealBlock}

COACHING RULES:
- Keep responses under 120 words unless asked to elaborate.
- Lead with the most practical advice first.
- Never recommend anything that conflicts with allergies or intolerances.
- If symptoms described could indicate a serious GI condition,
  recommend seeing a gastroenterologist.
- Tone: warm, evidence-based, practical.
- When asked about supplements, reference what the user is already taking
  before suggesting new ones.
- Always anchor advice to the user's specific goal (${goal}).
`.trim();
}
