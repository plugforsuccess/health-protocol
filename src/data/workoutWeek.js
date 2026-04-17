export const WORKOUT_WEEK = [
  {
    day: 'Fri', label: 'Friday', type: 'strength', icon: '🏋️',
    title: 'Lower Body Strength',
    duration: '55 min', focus: 'Quads · Glutes · Hip Stability',
    warmup: [
      { name: 'Hip Flexor Stretch', detail: '60 sec each side — kneeling lunge position, tuck pelvis under', sets: 2 },
      { name: 'Glute Bridge', detail: '15 reps — activate glutes before loading them', sets: 2 },
      { name: 'Leg Swing', detail: '10 forward + 10 lateral each leg — hip mobility', sets: 1 },
      { name: 'Bodyweight Squat', detail: '10 reps slow — prime movement pattern', sets: 2 },
    ],
    exercises: [
      { name: 'Goblet Squat', sets: 4, reps: '10', rec_weight: '30lb dumbbell (week 1-2)', note: 'Hold dumbbell at chest. Sit deep into squat. Drives quad and glute simultaneously. Start light — form first.', injury: null },
      { name: 'Romanian Deadlift (Dumbbells)', sets: 4, reps: '10', rec_weight: '25lb each hand (week 1-2)', note: 'Hinge at hips, soft knee bend, dumbbells track close to legs. Strongest glute and hamstring exercise. No barbell — protects elbow.', injury: null },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '8 each leg', rec_weight: 'Bodyweight only — weeks 1-2', note: 'Rear foot elevated on bench. Most effective single-leg exercise for basketball cutting and court sports. Expose quad weakness safely.', injury: null },
      { name: 'Hip Thrust (Smith Machine or Barbell on Pad)', sets: 4, reps: '12', rec_weight: '65-75lb barbell (week 1)', note: 'Upper back on bench, drive hips to ceiling, squeeze glutes at top. Most direct glute builder. Bar rests on hip crease not elbow.', injury: null },
      { name: 'Lateral Band Walk', sets: 3, reps: '15 each direction', rec_weight: 'Light resistance band (red/green)', note: 'Hip abductor activation. Critical for knee stability in basketball and tennis lateral cuts.', injury: null },
      { name: 'Calf Raise (Standing)', sets: 3, reps: '20', rec_weight: 'Bodyweight or 20lb dumbbells', note: 'Slow 3-sec lower. Achilles and calf resilience for court sports.', injury: null },
    ],
    cooldown: [
      { name: 'Incline Treadmill Walk', detail: '20 min — incline 8-10, speed 3.5 mph. Your second cardio session of the week. Zero elbow impact, high cardiovascular output. Non-negotiable for summer sport readiness.' },
      { name: 'Pigeon Pose', detail: '90 sec each side — deep hip flexor and glute release', sets: 2 },
      { name: 'Standing Quad Stretch', detail: '45 sec each side', sets: 2 },
      { name: 'Supine Hamstring Stretch', detail: '60 sec each side — on your back, leg straight up', sets: 2 },
      { name: 'Child\'s Pose', detail: '60 sec — spinal decompression' },
    ]
  },
  {
    day: 'Sat', label: 'Saturday', type: 'strength', icon: '💪',
    title: 'Upper Body + Elbow Rehab',
    duration: '55 min', focus: 'Chest · Back · Shoulder · Elbow Rehab',
    warmup: [
      { name: 'Arm Circle', detail: '10 forward + 10 backward each arm — shoulder warm-up', sets: 2 },
      { name: 'Band Pull-Apart', detail: '15 reps — posterior shoulder activation, no elbow stress', sets: 3 },
      { name: 'Doorway Chest Stretch', detail: '45 sec — pec and anterior shoulder mobility', sets: 2 },
      { name: 'Wrist Circle', detail: '10 each direction — prepare elbow joint', sets: 2 },
    ],
    exercises: [
      { name: 'Dumbbell Bench Press', sets: 4, reps: '10', rec_weight: '35lb each hand (week 1)', note: 'Neutral grip (palms facing each other) reduces elbow stress vs barbell. Control the descent — 3 seconds down. No barbell until elbow improves.', injury: '⚠ No barbell bench press — aggravates lateral epicondylitis. Dumbbells only.' },
      { name: 'Dumbbell Row (Single Arm)', sets: 4, reps: '10 each side', rec_weight: '40lb (week 1)', note: 'Brace on bench, drive elbow toward hip. Most important upper back exercise for golf posture and tennis backhand.', injury: null },
      { name: 'Cable Face Pull', sets: 4, reps: '15', rec_weight: '20lb', note: 'Rope attachment at eye level. Pull toward face, elbows high, external rotate at end. Heals the shoulder imbalance causing tightness.', injury: null },
      { name: 'Lateral Dumbbell Raise', sets: 3, reps: '12', rec_weight: '10-12lb', note: 'Slight forward lean, lead with elbows not wrists. Builds shoulder stability for tennis serve and overhead reach.', injury: '⚠ Stop if sharp pain. Use lighter weight than you think.' },
      { name: 'Eccentric Wrist Curl (Elbow Rehab)', sets: 3, reps: '15', rec_weight: '5lb only — do not go heavier', note: 'ELBOW REHAB — Forearm on bench, palm up. Use OTHER hand to curl up, then SLOWLY lower with injured arm only (3 sec down). Eccentric loading is clinically proven to heal tendinitis.', injury: '🔴 This is your most important exercise. Do not skip it.' },
      { name: 'Reverse Wrist Curl', sets: 3, reps: '15', rec_weight: '5lb only', note: 'Palm facing DOWN this time. Targets extensors — the exact muscles involved in tennis elbow. Same slow eccentric principle.', injury: '🔴 Elbow rehab — do both directions every session.' },
      { name: 'Tricep Pushdown (Cable)', sets: 3, reps: '12', rec_weight: '30lb (week 1)', note: 'Rope or straight bar. Locks out elbow joint and builds stability around the tendon.', injury: null },
    ],
    cooldown: [
      { name: 'Cross-Body Shoulder Stretch', detail: '60 sec each side — posterior capsule release for right shoulder tightness', sets: 2 },
      { name: 'Sleeper Stretch', detail: '60 sec right side only — specific for posterior shoulder tightness' },
      { name: 'Forearm Extensor Stretch', detail: '45 sec each arm — arm extended, palm down, other hand pulls fingers toward floor' },
      { name: 'Doorway Pec Stretch', detail: '45 sec each side', sets: 2 },
    ]
  },
  {
    day: 'Sun', label: 'Sunday', type: 'mobility', icon: '🧘',
    title: 'Full Body Mobility',
    duration: '40 min', focus: 'Hip Flexors · Thoracic · Shoulder · Recovery',
    warmup: [],
    exercises: [],
    mobility: [
      { name: '90/90 Hip Stretch', detail: '90 sec each side — front leg at 90°, back leg at 90°. Best hip flexor and external rotator stretch for golf rotation.', sets: '2 rounds' },
      { name: 'Couch Stretch', detail: '90 sec each side — rear foot on couch or wall, forward knee on floor. Most aggressive hip flexor release.', sets: '2 rounds' },
      { name: 'Thoracic Spine Rotation', detail: '10 each side on all fours — thread needle. Opens thoracic spine for golf backswing and tennis serve.', sets: '3 rounds' },
      { name: 'World\'s Greatest Stretch', detail: '5 each side slow — combines hip flexor, thoracic, hamstring. One movement for full chain.', sets: '2 rounds' },
      { name: 'Sleeper Stretch', detail: '90 sec right shoulder only — lie on right side, right arm at 90°, use left hand to gently press forearm toward floor.', sets: '3 rounds' },
      { name: 'Band Shoulder Distraction', detail: '60 sec each arm — loop band around rack, step back, arm straight, let band pull and distract the joint.', sets: '2 rounds' },
      { name: 'Deep Squat Hold', detail: '60 sec — heels flat if possible, elbows press knees out. Ankle and hip mobility for basketball.', sets: '3 rounds' },
      { name: 'Supine Hip Flexor Release', detail: '60 sec each side — lie on back, pull one knee to chest, let other leg fully relax flat.', sets: '2 rounds' },
      { name: 'Child\'s Pose with Reach', detail: '60 sec each side — reach arm as far as possible, breathe into stretch.', sets: '2 rounds' },
      { name: 'Foam Roll — IT Band + Quads', detail: '60 sec each — slow roll, pause on tight spots. Critical for knee health in court sports.', sets: '1 round' },
    ],
    cooldown: []
  },
  {
    day: 'Mon', label: 'Monday', type: 'rest', icon: '😴',
    title: 'Rest Day',
    duration: 'Full rest', focus: 'Recovery · Protein intake · Sleep',
    warmup: [], exercises: [],
    rest_tips: [
      'Prioritize protein today — your muscles repair on rest days not workout days',
      'Get 7–9 hrs sleep — growth hormone peaks during deep sleep',
      'Take your morning supplements — the L-Tyrosine and Alpha-GPC support recovery',
      'Light walk is fine — 20 min easy pace supports blood flow to recovering muscles',
      'Avoid alcohol — directly impairs muscle protein synthesis',
    ],
    cooldown: []
  },
  {
    day: 'Tue', label: 'Tuesday', type: 'conditioning', icon: '🏀',
    title: 'Rotational Power + Core',
    duration: '50 min', focus: 'Golf · Tennis · Basketball · Anti-Rotation Core',
    warmup: [
      { name: 'Hip Circle', detail: '10 each direction — hands on hips, draw big circles', sets: 2 },
      { name: 'Lateral Shuffle', detail: '10 yards each direction × 4 — court sport activation', sets: 2 },
      { name: 'Medicine Ball Slam', detail: '8 reps — if available. Full body priming.', sets: 2 },
      { name: 'T-Spine Rotation on Floor', detail: '8 each side — side lying', sets: 2 },
    ],
    exercises: [
      { name: 'Cable Woodchop (High to Low)', sets: 4, reps: '10 each side', rec_weight: '20lb (week 1)', note: 'Cable at highest setting. Rotate from high to low, fully extend arms. Mimics golf downswing and tennis forehand. Core rotational power.', injury: null },
      { name: 'Pallof Press', sets: 4, reps: '12 each side', rec_weight: '15lb', note: 'Cable at chest height, stand sideways to machine. Press straight out, hold 2 sec, return. Anti-rotation core — stabilizes spine during sport rotation.', injury: null },
      { name: 'Med Ball Rotational Throw (against wall)', sets: 4, reps: '10 each side', rec_weight: '8lb med ball', note: 'Stand sideways to wall. Load hips, rotate explosively, throw ball at wall. Most sport-specific exercise for golf and tennis power transfer.', injury: null },
      { name: 'Single Leg Romanian Deadlift', sets: 3, reps: '8 each leg', rec_weight: '15-20lb dumbbell', note: 'Balance and posterior chain in one. Basketball — forces the stabilizers needed for landing and cutting on one leg.', injury: null },
      { name: 'Dead Bug', sets: 3, reps: '8 each side', rec_weight: 'Bodyweight', note: 'Lie on back, arms and legs up. Slowly lower opposite arm and leg without back lifting. Deep core stability — protects lumbar spine during rotation.', injury: null },
      { name: 'Plank with Hip Tap', sets: 3, reps: '10 each side', rec_weight: 'Bodyweight', note: 'Standard plank, rotate hip to touch floor each side. Anti-rotation under fatigue.', injury: null },
    ],
    cooldown: [
      { name: 'Figure 4 Stretch', detail: '60 sec each side — glute and external rotator release after rotational work', sets: 2 },
      { name: 'Lunge with Twist', detail: '5 each side slow — hip flexor and thoracic combined', sets: 2 },
      { name: 'Seated Thoracic Rotation', detail: '10 each side — hands behind head, rotate fully', sets: 2 },
    ]
  },
  {
    day: 'Wed', label: 'Wednesday', type: 'conditioning', icon: '⚡',
    title: 'Athletic Conditioning',
    duration: '50 min', focus: 'Cardio Base · Court Readiness · Endurance',
    warmup: [
      { name: 'Jump Rope or Jog', detail: '5 min easy — elevate heart rate gradually', sets: 1 },
      { name: 'High Knees', detail: '30 sec × 3 — hip flexor activation under load', sets: 3 },
      { name: 'Lateral Bound', detail: '5 each side — single leg lateral jump. Court sports prep.', sets: 3 },
    ],
    exercises: [
      { name: 'Treadmill Intervals', sets: 6, reps: '1 min ON / 1 min OFF', rec_weight: 'Speed 6.5-7.5 mph (160lb athlete)', note: 'Sprint 1 min, walk 1 min. 6 rounds total. Builds the anaerobic capacity needed for basketball runs and tennis points.', injury: null },
      { name: 'Step-Up (Bench or Box)', sets: 3, reps: '12 each leg', rec_weight: '20lb dumbbells (week 1)', note: 'Drive through the heel of the front foot. Controls the eccentric on the way down. Quad and glute under functional load.', injury: null },
      { name: 'Agility Ladder Drill', sets: 4, reps: '30 sec', rec_weight: 'Bodyweight', note: 'If no ladder — tape on floor. Two-foot in each square forward, lateral shuffle pattern, ickey shuffle. Foot speed for basketball and tennis.', injury: null },
      { name: 'Battle Ropes', sets: 4, reps: '30 sec', rec_weight: 'Standard ropes — full effort', note: 'Alternating waves. Arms move independently — avoids loading the elbow joint directly while building shoulder endurance.', injury: '⚠ If elbow flares — switch to rowing machine same duration.' },
      { name: 'Box Jump or Squat Jump', sets: 4, reps: '8', rec_weight: 'Bodyweight — 20-24in box', note: 'Explosive lower body power. Land softly with bent knees. Basketball — jump training directly translates to vertical and first-step explosion.', injury: null },
      { name: 'Farmer Carry', sets: 3, reps: '40 yards', rec_weight: '40lb each hand (week 1)', note: 'Walk tall, shoulders packed down. Grip strength — directly rehabilitates elbow by loading the tendon under controlled tension.', injury: null },
    ],
    cooldown: [
      { name: 'Easy Walk or Bike', detail: '5 min — heart rate recovery' },
      { name: 'Hip Flexor Stretch', detail: '60 sec each side — mandatory after running intervals', sets: 2 },
      { name: 'Calf Stretch', detail: '60 sec each side — wall stretch, straight and bent knee versions', sets: 2 },
      { name: 'Full Body Shake Out', detail: '2 min — loose limbs, breathe, release tension' },
    ]
  },
  {
    day: 'Thu', label: 'Thursday', type: 'rest', icon: '😴',
    title: 'Rest Day',
    duration: 'Full rest', focus: 'Recovery · Meal prep prep · Mental rest',
    warmup: [], exercises: [],
    rest_tips: [
      'Today is your shopping and meal prep planning day — physical rest, mental prep',
      'Optional: 20 min easy walk or gentle yoga — nothing that creates muscle soreness',
      'Review next week\'s workout plan — mental rehearsal improves performance',
      'Foam roll for 10 min — no intensity, just maintenance rolling',
      'Hydration focus — 3L+ water today, your joints and tendons depend on it',
    ],
    cooldown: []
  },
];
