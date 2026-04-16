// Centralised option lists for the diet onboarding questionnaire.
// Mirrors the pattern in onboardingOptions.js — every dropdown and
// multi-select source-of-truth lives here so step components stay lean.

export const DIET_GOALS = [
  'Fat Loss',
  'Muscle Gain',
  'Gut Healing',
  'Cancer Prevention',
  'Manage a Condition',
  'General Health',
  'Performance Fuel',
];

export const DIAGNOSED_CONDITIONS = [
  'IBS',
  'Crohn\'s Disease',
  'Ulcerative Colitis',
  'Celiac Disease',
  'Type 2 Diabetes',
  'Prediabetes',
  'PCOS',
  'Hypothyroid',
  'High Cholesterol',
  'High Blood Pressure',
  'None',
];

export const COLONOSCOPY_OPTIONS = [
  'No',
  'Yes — within 6 months',
  'Yes — within 12 months',
  'Yes — over a year away',
];

export const FAMILY_HISTORY = [
  'Colorectal Cancer',
  'Heart Disease',
  'Type 2 Diabetes',
  'Stomach or GI Cancer',
  'None',
];

export const DIETARY_FRAMEWORKS = [
  'Omnivore',
  'Pescatarian',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Mediterranean',
  'Gluten-Free',
  'No specific framework',
];

export const FOOD_ALLERGIES = [
  'Tree Nuts',
  'Peanuts',
  'Shellfish',
  'Fish',
  'Eggs',
  'Soy',
  'Wheat',
  'Gluten',
  'Sesame',
  'Dairy',
  'None',
];

export const FOOD_INTOLERANCES = [
  'Dairy',
  'Lactose',
  'Fructose',
  'FODMAPs',
  'Nightshades',
  'Histamine',
  'Sulfites',
  'None',
];

export const RED_MEAT_FREQUENCY = [
  'Daily',
  'A few times a week',
  'Once a week',
  'Rarely',
  'Never',
];

export const ALCOHOL_FREQUENCY = [
  'Never',
  'Socially (a few times a month)',
  'Weekly',
  'Several times a week',
];

export const GUT_SYMPTOMS = [
  'Bloating',
  'Gas',
  'Constipation',
  'Diarrhea',
  'Acid Reflux',
  'Nausea',
  'Cramping',
  'None',
];

export const SYMPTOM_FREQUENCY = [
  'Daily',
  'Several times a week',
  'Weekly',
  'Occasionally',
];

export const GUT_SUPPLEMENT_OPTIONS = [
  'Probiotic capsules',
  'Probiotic tea / kombucha',
  'L-Glutamine',
  'Collagen peptides',
  'Digestive enzymes',
  'Zinc Carnosine',
];

export const ANTIBIOTIC_HISTORY = [
  'No',
  'Yes — once',
  'Yes — multiple courses',
];

export const BOWEL_REGULARITY = [
  'Very regular',
  'Mostly regular',
  'Irregular',
  'Varies significantly',
];

export const COOKING_SKILL = [
  { id: 'Beginner', label: 'Beginner (I follow recipes step by step)' },
  { id: 'Intermediate', label: 'Intermediate (comfortable improvising)' },
  { id: 'Advanced', label: 'Advanced (cook without recipes)' },
];

export const WEEKDAY_COOK_TIME = [
  'Under 15 min',
  '15–30 min',
  '30–45 min',
  '45+ min',
];

export const WEEKEND_COOK_TIME = [
  'Under 30 min',
  '30–60 min',
  '1–2 hrs',
  '2+ hrs',
];

export const MEAL_PREP_OPTIONS = [
  'Yes — every week',
  'Sometimes',
  'Want to start',
  'No — I cook fresh',
];

export const WEEKLY_BUDGET = [
  'Under $75',
  '$75–$150',
  '$150–$250',
  '$250+',
];

export const EATS_OUT_FREQUENCY = [
  'Rarely (home almost always)',
  '1–2x per week',
  '3–5x per week',
  'Most meals',
];

export const RESTAURANT_TYPES = [
  'Fast Casual',
  'Sit-Down',
  'Mediterranean',
  'Asian',
  'American Grill',
  'Varies',
];

export const KITCHEN_EQUIPMENT = [
  'Crockpot / Slow Cooker',
  'Instant Pot / Pressure Cooker',
  'Air Fryer',
  'Blender / NutriBullet',
  'Food Processor',
  'Kitchen Scale (grams)',
  'Sheet Pans / Baking Trays (multiple)',
  '9x13 Baking Dish',
  'Cast Iron Skillet',
  'Rice Cooker',
  'Spiralizer',
  'Glass Meal Prep Containers (4+)',
  'Fine Mesh Strainer',
  'Parchment Paper (always stocked)',
];

export const MEALS_PER_DAY = [
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4' },
  { id: 5, label: '5+' },
];

export const INTERMITTENT_FASTING = [
  'No',
  'Yes — 16:8',
  'Yes — 18:6',
  'Yes — other window',
  'Interested but not started',
];

export const BIGGEST_MEAL = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Varies',
];

export const LATE_NIGHT_EATING = [
  'Never',
  'Occasionally',
  'Regularly',
];

export const BREAKFAST_EATER = [
  'Yes — always',
  'Sometimes',
  'Rarely',
  'Never (coffee only)',
];

export const DAILY_HYDRATION = [
  'Under 1L',
  '1–2L',
  '2–3L',
  '3L+',
];

export const CAFFEINE_CONSUMPTION = [
  'None',
  '1 coffee or tea',
  '2–3 cups',
  '4+ cups',
];

export const MEAL_VARIETY = [
  { id: 'Simple', label: 'Simple — same meals work for me' },
  { id: 'Moderate', label: 'Moderate variety' },
  { id: 'High', label: 'High variety — I get bored easily' },
];

export const CUISINE_PREFERENCES = [
  'Mediterranean',
  'Asian',
  'American',
  'Latin',
  'Middle Eastern',
  'West African',
  'Caribbean',
  'No preference',
];

export const SPICE_TOLERANCE = [
  'Mild',
  'Medium',
  'Hot',
  'Very Hot',
];

export const SNACKER_OPTIONS = [
  'Yes — I need snacks',
  'No — I prefer 3 meals',
  'Depends on the day',
];

export const MEAL_PREP_STYLE = [
  'Batch cook everything Sunday',
  'Two sessions (Sun + Wed)',
  'Cook fresh daily',
  'Mix of both',
];

export const PROTEIN_POWDER = [
  'No',
  'Yes — whey',
  'Yes — plant-based',
  'Interested',
];

export const SUPPLEMENT_WILLINGNESS = [
  'Open to anything',
  'Prefer food-first',
  'Minimal supplements only',
];

export const SUPPLEMENT_BUDGET = [
  'Under $50',
  '$50–$100',
  '$100–$200',
  '$200+',
];
