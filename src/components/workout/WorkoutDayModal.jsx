import { useEffect, useMemo, useState } from 'react';
import { workoutDateKey } from '../../hooks/useWorkoutLogs.js';
import { classifyExercise } from '../../lib/workoutIntelligence.js';
import { buildCoachingSystemPrompt } from '../../lib/coachingPrompt.js';
import { useProfile } from '../../lib/profileContext.jsx';
import { useCoachingChat } from '../../hooks/useCoachingChat.js';
import { ChatDrawer } from '../chat/ChatDrawer.jsx';
import { CoachingChat } from '../chat/CoachingChat.jsx';
import { ExerciseCard } from './ExerciseCard.jsx';
import { MobilityItem } from './MobilityItem.jsx';
import { WarmupItem } from './WarmupItem.jsx';

// Quick-tap prompts for workout coaching — base set always shown,
// plus dynamic extras based on exercise type.
const BASE_WORKOUT_PROMPTS = [
  'How do I feel this in the right muscle?',
  "I'm feeling pain \u2014 what should I modify?",
  'Show me the form cues',
  'Why is this in my program?',
  'How much rest do I need?',
];

const DYNAMIC_PROMPTS = {
  strength:     "What's the mind-muscle connection here?",
  rehab:        'Am I doing this correctly for my injury?',
  mobility:     'How deep should I go into this stretch?',
  conditioning: 'How do I pace this correctly?',
};

function getWorkoutPrompts(exercise, dayType) {
  const prompts = [...BASE_WORKOUT_PROMPTS];
  // Add dynamic prompt based on exercise/day context
  const name = (exercise?.name || '').toLowerCase();
  const isRehab = name.includes('rehab') || name.includes('eccentric') || name.includes('wrist curl');
  const isMobility = name.includes('stretch') || name.includes('mobility') || name.includes('foam roll');

  if (isRehab) {
    prompts.push(DYNAMIC_PROMPTS.rehab);
  } else if (isMobility) {
    prompts.push(DYNAMIC_PROMPTS.mobility);
  } else if (dayType === 'conditioning') {
    prompts.push(DYNAMIC_PROMPTS.conditioning);
  } else {
    prompts.push(DYNAMIC_PROMPTS.strength);
  }
  return prompts;
}

export function WorkoutDayModal({
  dayIdx,
  weekPlan,
  onClose,
  setsMap,
  mobilityMap,
  getPrevBest,
  getSuggestion,
  onLogField,
  onCycleStatus,
  onToggleMobility,
  onStartWarmup,
  onComplete,
}) {
  const { profile, injuries, surgeries } = useProfile();
  const [coachExIdx, setCoachExIdx] = useState(null);

  // Traveling toggle — persists per session date via localStorage
  const day = (dayIdx !== null && dayIdx !== undefined) ? weekPlan?.[dayIdx] : null;
  const sessionDate = day ? workoutDateKey(dayIdx, undefined, weekPlan) : null;
  const hasHotelVariant = Boolean(day?.hotel_variant);

  const [isTraveling, setIsTraveling] = useState(() => {
    if (!sessionDate) return false;
    try { return localStorage.getItem(`traveling_${sessionDate}`) === 'true'; } catch { return false; }
  });

  const handleTravelToggle = () => {
    const next = !isTraveling;
    setIsTraveling(next);
    try { localStorage.setItem(`traveling_${sessionDate}`, String(next)); } catch {}
  };

  // Derive active content from toggle state
  const activeWarmup = (isTraveling && hasHotelVariant)
    ? day.hotel_variant.warmup || []
    : day?.warmup || [];
  const activeExercises = (isTraveling && hasHotelVariant)
    ? day.hotel_variant.exercises || []
    : day?.exercises || [];
  const activeCooldown = (isTraveling && hasHotelVariant)
    ? day.hotel_variant.cooldown || []
    : day?.cooldown || [];
  const activeTitle = (isTraveling && hasHotelVariant)
    ? day.hotel_variant.title || day?.title
    : day?.title;

  useEffect(() => {
    if (dayIdx === null || dayIdx === undefined) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [dayIdx, onClose]);

  // Build coaching context for the currently selected exercise
  const coachExercise = day?.exercises?.[coachExIdx] ?? null;
  const coachSuggestion = (coachExIdx !== null && getSuggestion)
    ? getSuggestion(dayIdx, coachExIdx, sessionDate)
    : null;

  // Gather today's logged sets for this exercise
  const coachSessionLog = useMemo(() => {
    if (coachExIdx === null || !sessionDate) return [];
    const logs = [];
    const setCount = coachExercise?.sets || 0;
    for (let si = 0; si < setCount; si++) {
      const key = `${sessionDate}::${dayIdx}::${coachExIdx}::${si}`;
      if (setsMap[key]) logs.push(setsMap[key]);
    }
    return logs;
  }, [coachExIdx, sessionDate, dayIdx, coachExercise, setsMap]);

  const coachContext = useMemo(() => {
    if (!coachExercise || !profile) return null;
    return {
      profile,
      injuries: (injuries || []).filter((i) => i?.active !== false),
      surgeries: surgeries || [],
      currentExercise: coachExercise,
      currentSet: 0,
      suggestion: coachSuggestion,
      sessionLog: coachSessionLog,
    };
  }, [profile, injuries, surgeries, coachExercise, coachSuggestion, coachSessionLog]);

  const workoutChat = useCoachingChat({
    systemPromptBuilder: buildCoachingSystemPrompt,
    context: coachContext,
    accentColor: 'var(--w)',
  });

  const handleOpenCoach = (exIdx) => {
    setCoachExIdx(exIdx);
    workoutChat.openChat(true);
  };

  if (!day) return null;

  const overlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wmodal-overlay open" onClick={overlayClick} role="dialog" aria-modal="true">
      <div className="wmodal-sheet">
        <div className="wmodal-handle" />
        <div className="wmodal-header">
          <div className="wmodal-title-row">
            <span className={`wmodal-type-badge ${day.type}`}>{day.type}</span>
            <div className="wmodal-title">{activeTitle}</div>
            <button
              type="button"
              className="wmodal-close"
              onClick={onClose}
              aria-label="Close workout"
            >
              ✕
            </button>
          </div>
          <div className="wmodal-meta">
            <span>⏱ {day.duration} &nbsp;·&nbsp; 🎯 {day.focus}</span>
            {hasHotelVariant && (
              <button
                type="button"
                className={`travel-toggle${isTraveling ? ' travel-toggle--active' : ''}`}
                onClick={handleTravelToggle}
                aria-label={isTraveling ? 'Switch to home gym workout' : 'Switch to hotel workout'}
              >
                {isTraveling ? '✈️ Traveling' : '🏠 Home gym'}
              </button>
            )}
          </div>
        </div>
        <div className="wmodal-body">
          {day.type === 'rest' ? (
            <RestBody tips={day.rest_tips || []} />
          ) : day.type === 'mobility' ? (
            <MobilityBody
              dayIdx={dayIdx}
              sessionDate={sessionDate}
              items={day.mobility || []}
              mobilityMap={mobilityMap}
              onToggle={onToggleMobility}
            />
          ) : (
            <TrainBody
              dayIdx={dayIdx}
              day={day}
              activeWarmup={activeWarmup}
              activeExercises={activeExercises}
              activeCooldown={activeCooldown}
              isTraveling={isTraveling && hasHotelVariant}
              sessionDate={sessionDate}
              setsMap={setsMap}
              getPrevBest={getPrevBest}
              getSuggestion={getSuggestion}
              onLogField={onLogField}
              onCycleStatus={onCycleStatus}
              onStartWarmup={onStartWarmup}
              onComplete={onComplete}
              onOpenCoach={handleOpenCoach}
            />
          )}
        </div>
      </div>

      <ChatDrawer
        isOpen={workoutChat.isOpen}
        onClose={workoutChat.closeChat}
        title="Workout Coach"
        subtitle={coachExercise?.name}
        accentColor="var(--w)"
      >
        <CoachingChat
          messages={workoutChat.messages}
          loading={workoutChat.loading}
          onSend={workoutChat.sendMessage}
          onQuickTap={workoutChat.sendQuickTap}
          quickTapPrompts={getWorkoutPrompts(coachExercise, day.type)}
          accentColor="var(--w)"
          emptyStateText="Ask anything about this exercise"
        />
      </ChatDrawer>
    </div>
  );
}

function RestBody({ tips }) {
  return (
    <div className="wmodal-section">
      <div className="wmodal-section-title">Rest Day Tips</div>
      {tips.map((t, i) => (
        <div key={i} className="mobility-item" style={{ cursor: 'default' }}>
          <div style={{ fontSize: 20 }}>💤</div>
          <div className="mobility-content">
            <div
              className="mobility-name"
              style={{ textDecoration: 'none' }}
            >
              {t}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MobilityBody({ dayIdx, sessionDate, items, mobilityMap, onToggle }) {
  return (
    <div className="wmodal-section">
      <div className="wmodal-section-title green">Mobility Flow</div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          marginBottom: 12,
          fontFamily: 'DM Mono, monospace',
        }}
      >
        Tap each stretch when complete. Timed stretches start a countdown automatically.
      </div>
      {items.map((item, i) => {
        const key = `${sessionDate}::${dayIdx}::${i}`;
        const checked = !!mobilityMap[key];
        return (
          <MobilityItem
            key={i}
            item={item}
            checked={checked}
            onToggle={() => onToggle(dayIdx, i, item)}
          />
        );
      })}
    </div>
  );
}

function TrainBody({
  dayIdx,
  day,
  activeWarmup,
  activeExercises,
  activeCooldown,
  isTraveling,
  sessionDate,
  setsMap,
  getPrevBest,
  getSuggestion,
  onLogField,
  onCycleStatus,
  onStartWarmup,
  onComplete,
  onOpenCoach,
}) {
  // Warm-up completion lives in local state — warm-ups are a pre-flight
  // checklist, not long-lived history, so they don't need to sync to
  // Supabase. Each tap flips the item between idle → running → done.
  // The running state auto-advances when the timer callback fires.
  const [warmupStatus, setWarmupStatus] = useState({});

  const handleWarmupTap = (idx, item) => {
    const current = warmupStatus[idx];
    if (current === 'done') {
      // Un-check
      setWarmupStatus((s) => ({ ...s, [idx]: undefined }));
      return;
    }
    if (current === 'running') {
      // User tapped again mid-countdown — treat as cancel.
      setWarmupStatus((s) => ({ ...s, [idx]: undefined }));
      onStartWarmup?.(null);
      return;
    }
    setWarmupStatus((s) => ({ ...s, [idx]: 'running' }));
    onStartWarmup?.(item, () => {
      setWarmupStatus((s) => ({ ...s, [idx]: 'done' }));
    });
  };

  return (
    <>
      {isTraveling && day.hotel_variant?.equipment && (
        <div className="wmodal-section">
          <div
            style={{
              fontSize: 11,
              color: 'var(--s)',
              fontFamily: 'DM Mono, monospace',
              padding: '8px 10px',
              background: 'var(--s-dim, rgba(99,102,241,0.08))',
              borderRadius: 6,
            }}
          >
            ✈️ Hotel variant · {day.hotel_variant.equipment}
          </div>
        </div>
      )}

      {activeWarmup.length > 0 && (
        <div className="wmodal-section">
          <div className="wmodal-section-title green">Warm-Up</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              marginBottom: 12,
              fontFamily: 'DM Mono, monospace',
            }}
          >
            Tap a warm-up to start a 10-second prep countdown.
            Timed warm-ups run the full work timer automatically.
          </div>
          {activeWarmup.map((w, i) => (
            <WarmupItem
              key={i}
              item={w}
              status={warmupStatus[i]}
              onToggle={() => handleWarmupTap(i, w)}
            />
          ))}
        </div>
      )}

      <div className="wmodal-section">
        <div className="wmodal-section-title">Main Workout</div>
        {activeExercises.map((ex, ei) => {
          const kind = classifyExercise(ex);
          const suggestion = getSuggestion
            ? getSuggestion(dayIdx, ei, sessionDate)
            : null;
          return (
            <ExerciseCard
              key={ei}
              ex={ex}
              dayIdx={dayIdx}
              exIdx={ei}
              sessionDate={sessionDate}
              setsMap={setsMap}
              prevBest={getPrevBest(dayIdx, ei, sessionDate)}
              suggestion={suggestion}
              kind={kind}
              onLogField={onLogField}
              onCycleStatus={(d, e, s) => onCycleStatus(d, e, s, ex.name)}
              onOpenCoach={onOpenCoach}
            />
          );
        })}
      </div>

      {activeCooldown.length > 0 && (
        <div className="wmodal-section">
          <div className="wmodal-section-title green">Cool Down</div>
          {activeCooldown.map((c, i) => (
            <div key={i} className="mobility-item" style={{ cursor: 'default' }}>
              <div style={{ fontSize: 16 }}>🧊</div>
              <div className="mobility-content">
                <div className="mobility-name">{c.name}</div>
                <div className="mobility-detail">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="wmodal-section">
        <button
          type="button"
          onClick={() => onComplete(dayIdx)}
          style={{
            width: '100%',
            padding: 14,
            background: 'var(--w)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          ✓ &nbsp;Mark Workout Complete
        </button>
      </div>
    </>
  );
}
