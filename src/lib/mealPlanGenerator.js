import { supabase } from './supabase.js';

// Builds the system prompt for Claude meal plan generation and calls
// a Supabase Edge Function that proxies the Claude API. The generated
// plan is stored in `user_meal_plans` and returned to the caller.
//
// We use an Edge Function rather than calling Claude directly from the
// browser so the API key stays server-side.

export function buildMealPlanPrompt({ dietProfile, workoutProfile }) {
  const firstName = workoutProfile?.first_name || 'the user';
  return `
You are a registered dietitian and functional medicine nutrition expert.
Generate a personalized 7-day meal plan for ${firstName}.

HEALTH CONTEXT:
- Primary diet goal: ${dietProfile.primary_goal || 'General Health'}
- Medical conditions: ${(dietProfile.conditions || []).join(', ') || 'None'}
- GI procedure planned: ${dietProfile.colonoscopy_planned || 'No'}
- Family history: ${(dietProfile.family_history || []).join(', ') || 'None'}
- Medications with food interactions: ${dietProfile.food_medications || 'None'}

FOOD RESTRICTIONS (ABSOLUTE — never violate):
- Dietary framework: ${dietProfile.dietary_framework || 'No specific framework'}
- Allergies: ${(dietProfile.allergies || []).join(', ') || 'None'}
- Intolerances: ${(dietProfile.intolerances || []).join(', ') || 'None'}
- Dislikes: ${dietProfile.food_dislikes || 'None listed'}
- Red meat frequency allowed: ${dietProfile.red_meat_frequency || 'Not specified'}

GUT HEALTH:
- Symptoms: ${(dietProfile.gut_symptoms || []).join(', ') || 'None'}
- Trigger foods: ${dietProfile.trigger_foods || 'None identified'}
- Current gut supplements: ${(dietProfile.current_gut_supplements || []).join(', ') || 'None'}
- Antibiotic history: ${dietProfile.antibiotic_history || 'No'}

COOKING REALITY:
- Skill level: ${dietProfile.cooking_skill || 'Not specified'}
- Weekday time: ${dietProfile.weekday_cook_time || 'Not specified'}
- Weekend time: ${dietProfile.weekend_cook_time || 'Not specified'}
- Meal prep style: ${dietProfile.meal_prep_style || 'Not specified'}
- Weekly budget: ${dietProfile.weekly_budget || 'Not specified'}
- Available equipment: ${(dietProfile.kitchen_equipment || []).join(', ') || 'Basic kitchen'}
- Eats out: ${dietProfile.eats_out || 'Not specified'}

EATING PATTERNS:
- Meals per day: ${dietProfile.meals_per_day || 3}
- Intermittent fasting: ${dietProfile.intermittent_fasting || 'No'}
- Breakfast eater: ${dietProfile.breakfast_eater || 'Not specified'}
- Biggest meal: ${dietProfile.biggest_meal || 'Varies'}

PREFERENCES:
- Cuisine: ${(dietProfile.cuisine_preferences || []).join(', ') || 'No preference'}
- Spice tolerance: ${dietProfile.spice_tolerance || 'Medium'}
- Variety: ${dietProfile.meal_variety || 'Moderate'}

WORKOUT CONTEXT (from training profile):
- Training goal: ${workoutProfile?.primary_goal || 'General Fitness'}
- Training days: ${(workoutProfile?.preferred_days || []).join(', ') || 'Not specified'}
- Session duration: ${workoutProfile?.session_duration_min || 'Not specified'} min

TRAINING SCHEDULE RULES:
- On training days (${(workoutProfile?.preferred_days || []).join(', ') || 'not specified'}): increase carbohydrates at the meal before the training session, include 25-40g protein within 60 min after the session ends
- On rest days: reduce overall carbohydrate load, maintain protein intake at the same level as training days
- If user trains in the morning: breakfast must be light and fast-digesting pre-workout, substantial post-workout meal follows
- If user trains in the evening: the largest meal of the day should follow the training session
- If user's biggest meal preference conflicts with training timing, training timing takes priority for protein delivery — adjust the non-training meal to be the larger volume meal

OUTPUT REQUIREMENTS:
Return valid JSON only. No preamble, no markdown, no explanation outside the JSON.

Schema:
{
  "generatedAt": "ISO timestamp",
  "planSummary": "2-3 sentence overview of why this plan suits the user",
  "weeklyNotes": "Key themes and strategies for this week",
  "days": [
    {
      "day": "Sunday",
      "meals": [
        {
          "time": "breakfast | lunch | dinner | snack",
          "name": "Meal name",
          "benefits": ["anti-inflammatory", "high-fiber", "cancer-protective", "gut-healing", "muscle-building"],
          "ingredients": ["ingredient with quantity"],
          "prep": "Concise prep note with timing",
          "cookTime": "X min",
          "mealPrepFriendly": true,
          "protocolNote": "Why this meal supports the user's specific health goals",
          "equipmentNeeded": ["sheet pan", "blender"],
          "recipe": {
            "time": "Total time",
            "equipList": ["equipment items"],
            "steps": [
              { "title": "Step title", "desc": "Step description" }
            ],
            "tip": "Optional timing tip",
            "why": "Why this meal matters for this user specifically"
          }
        }
      ]
    }
  ],
  "avoidFoods": ["Food to avoid based on user profile"],
  "weeklyShoppingCategories": {
    "Proteins": ["item with quantity"],
    "Vegetables": ["item"],
    "Fruits": ["item"],
    "Grains": ["item"],
    "Pantry": ["item"],
    "Herbs & Spices": ["item"]
  }
}

RULES:
1. Never include any allergen or intolerance in any meal
2. Respect red meat frequency limit strictly
3. Match cooking complexity to skill level and available time
4. Batch cook meals must reference each other (Sunday prep covers Mon-Wed)
5. Every meal must include at least one benefit tag
6. protocolNote must reference the user's specific goal or condition
7. If colonoscopy is planned, prioritize: L-Glutamine-compatible foods, high-fiber vegetables, anti-inflammatory proteins, no processed meats
8. If gut symptoms present, avoid known trigger foods and prioritize easily digestible meals
9. Equipment in recipe must only include what the user has
`.trim();
}

export async function generateMealPlan() {
  // Fetch the current user's diet profile and workout profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [{ data: dietProfile }, { data: workoutProfile }] = await Promise.all([
    supabase
      .from('user_diet_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (!dietProfile) throw new Error('Diet profile not found');

  const prompt = buildMealPlanPrompt({
    dietProfile,
    workoutProfile: workoutProfile || {},
  });

  // Call the Supabase Edge Function that proxies the Claude API
  const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
    body: { prompt },
  });

  if (error) throw error;

  const planData = data?.plan || data;

  // Mark any existing active plan as inactive
  await supabase
    .from('user_meal_plans')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Store the new plan
  const { error: insertErr } = await supabase
    .from('user_meal_plans')
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
  // If today is Sunday, use today; otherwise advance to next Sunday
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d.toISOString().slice(0, 10);
}
