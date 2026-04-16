// Centralised option lists for the onboarding questionnaire.
// Keeping every dropdown / multi-select source-of-truth in one file means
// new sections, copy tweaks, and additions to the contraindication engine
// don't have to be hunted across step components.

export const BODY_REGIONS = [
  { id: 'neck-cervical-spine',    label: 'Neck / Cervical Spine' },
  { id: 'left-shoulder',          label: 'Left Shoulder' },
  { id: 'right-shoulder',         label: 'Right Shoulder' },
  { id: 'left-elbow',             label: 'Left Elbow' },
  { id: 'right-elbow',            label: 'Right Elbow' },
  { id: 'left-wrist-hand',        label: 'Left Wrist / Hand' },
  { id: 'right-wrist-hand',       label: 'Right Wrist / Hand' },
  { id: 'upper-back-thoracic',    label: 'Upper Back / Thoracic' },
  { id: 'lower-back-lumbar',      label: 'Lower Back / Lumbar' },
  { id: 'left-hip',               label: 'Left Hip' },
  { id: 'right-hip',              label: 'Right Hip' },
  { id: 'left-knee',              label: 'Left Knee' },
  { id: 'right-knee',             label: 'Right Knee' },
  { id: 'left-ankle-foot',        label: 'Left Ankle / Foot' },
  { id: 'right-ankle-foot',       label: 'Right Ankle / Foot' },
];

export const BODY_REGION_LABEL = Object.fromEntries(
  BODY_REGIONS.map((r) => [r.id, r.label])
);

export const PRIMARY_GOALS = [
  'Fat Loss',
  'Muscle Gain',
  'Athletic Performance',
  'Conditioning & Endurance',
  'Injury Rehab',
  'General Fitness',
  'Longevity',
];

export const BIOLOGICAL_SEX = [
  { id: 'male',                label: 'Male' },
  { id: 'female',              label: 'Female' },
  { id: 'prefer_not_to_say',   label: 'Prefer not to say' },
];

export const DOMINANT_HAND = [
  { id: 'right',         label: 'Right' },
  { id: 'left',          label: 'Left' },
  { id: 'ambidextrous',  label: 'Ambidextrous' },
];

export const TRAINING_EXPERIENCE = [
  'Beginner (< 1 yr)',
  'Intermediate (1–3 yrs)',
  'Advanced (3–5 yrs)',
  'Athlete (5+ yrs)',
];

export const SPORT_BACKGROUND = [
  'Basketball', 'Tennis', 'Golf', 'Football', 'Soccer',
  'Baseball', 'Track', 'Swimming', 'Other',
];

export const ACTIVITY_LEVEL = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];

export const CARDIO_CONDITIONS = [
  'High blood pressure (hypertension)',
  'Heart arrhythmia / irregular heartbeat',
  'History of heart attack or stroke',
  'Congenital heart condition',
  'Other',
];

export const INJURY_TYPES = [
  { id: 'acute',        label: 'Acute (happened recently, still healing)' },
  { id: 'chronic',      label: 'Chronic (ongoing, long-term)' },
  { id: 'post_surgery', label: 'Post-surgery / recovering' },
];

export const INJURY_DURATIONS = [
  'Less than 4 weeks',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  'Over a year',
];

export const INJURY_TRAJECTORIES = [
  { id: 'improving',  label: 'Getting better' },
  { id: 'stable',     label: 'Stable — not changing' },
  { id: 'worsening',  label: 'Getting worse' },
];

// Aggravating movement IDs map to MOVEMENT_CONTRAINDICATIONS keys in
// workoutIntelligence.js — keep them in sync.
export const AGGRAVATING_MOVEMENTS = [
  { id: 'overhead-pressing', label: 'Overhead pressing / reaching' },
  { id: 'pushing',           label: 'Pushing movements (bench, push-up)' },
  { id: 'pulling',           label: 'Pulling movements (rows, pull-ups)' },
  { id: 'squatting',         label: 'Squatting / knee bend' },
  { id: 'hinging',           label: 'Hip hinging (deadlift, RDL)' },
  { id: 'rotation',          label: 'Rotation / twisting' },
  { id: 'impact',            label: 'Impact / jumping' },
  { id: 'gripping',          label: 'Gripping / squeezing' },
  { id: 'none',              label: 'None of the above' },
];

export const PHYSICIAN_CLEARED = [
  { id: 'yes',         label: 'Yes' },
  { id: 'no',          label: 'No' },
  { id: 'in_progress', label: 'In progress' },
];

export const SURGERY_CLEARED = [
  { id: 'yes',        label: 'Yes' },
  { id: 'no',         label: 'No' },
  { id: 'partially',  label: 'Partially' },
];

export const TRAINING_LOCATION = [
  'Commercial Gym',
  'Home Gym',
  'Hotel',
  'Outdoor',
  'No Equipment',
];

export const EQUIPMENT = [
  'Barbell + Rack', 'Dumbbells', 'Kettlebells', 'Cable Machine',
  'Smith Machine', 'Resistance Bands', 'Pull-up Bar', 'Bench',
  'Treadmill', 'Rower', 'Assault Bike', 'Battle Ropes',
  'Agility Ladder', 'Med Ball', 'Foam Roller',
];

export const DAYS_PER_WEEK = [2, 3, 4, 5, 6];

export const WEEKDAYS = [
  { id: 'mon', label: 'Mon' }, { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' }, { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' }, { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const SESSION_DURATION = [
  { id: 30, label: '30 min' },
  { id: 45, label: '45 min' },
  { id: 60, label: '60 min' },
  { id: 75, label: '75+ min' },
];

export const AVG_SLEEP = ['Under 6 hrs', '6–7 hrs', '7–8 hrs', '8+ hrs'];

export const STRESS_LEVEL = ['Low', 'Moderate', 'High', 'Very High'];

export const RECOVERY_LEVEL = [
  'I feel fully recovered',
  'Slightly fatigued',
  'Usually sore',
  'Chronically fatigued',
];

export const TRAVEL_FREQUENCY = [
  'Rarely',
  '1–2x per month',
  'Weekly',
  'Most of the time',
];

export const TRAVEL_EQUIPMENT = [
  'Hotel gym (basic — dumbbells + cardio machines)',
  'Full commercial gym nearby',
  'Resistance bands only',
  'Bodyweight only — no equipment',
];

export const PRIMARY_SPORT = [
  'Basketball', 'Tennis', 'Golf', 'Running', 'Cycling',
  'Swimming', 'Hiking', 'Boxing', 'Combat Sports (MMA/BJJ)',
  'Soccer', 'Baseball', 'Football', 'None — general fitness',
];

export const COMPETITION_STATUS = [
  'Off-season',
  'In-season',
  'No competition',
];

export const PERFORMANCE_GOALS = [
  'Increase vertical jump',
  'Improve sprint speed',
  'Improve endurance',
  'Increase flexibility',
  'Improve rotational power',
  'Reduce injury risk',
  'Improve posture',
  'None',
];

// Locale → unit hint. Used only to default the height/weight unit toggle.
// Anything other than US locale defaults to metric.
export function defaultUnitsForLocale(locale) {
  const us = /^en-US/i.test(locale || '');
  return us ? 'imperial' : 'metric';
}

// ── Conversion helpers ────────────────────────────────────────────────
export function ftInToCm(ft, inches) {
  const f = Number(ft) || 0;
  const i = Number(inches) || 0;
  return Math.round((f * 12 + i) * 2.54 * 10) / 10;
}

export function cmToFtIn(cm) {
  const totalIn = (Number(cm) || 0) / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - ft * 12);
  return { ft, inches };
}

export function lbsToKg(lbs) {
  const n = Number(lbs);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 0.45359237 * 10) / 10;
}

export function kgToLbs(kg) {
  const n = Number(kg);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n / 0.45359237 * 10) / 10;
}
