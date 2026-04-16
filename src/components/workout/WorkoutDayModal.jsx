import { useEffect, useState } from 'react';
import { WORKOUT_WEEK } from '../../data/workoutWeek.js';
import { workoutDateKey } from '../../hooks/useWorkoutLogs.js';
import { classifyExercise } from '../../lib/workoutIntelligence.js';
import { ExerciseCard } from './ExerciseCard.jsx';
import { MobilityItem } from './MobilityItem.jsx';
import { WarmupItem } from './WarmupItem.jsx';
import { RpeDialog } from './RpeDialog.jsx';

export function WorkoutDayModal({
  dayIdx,
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
  // RPE prompt sits between "tap complete" and the actual save. The user
  // can submit a 1–10 score or skip — either path resolves to onComplete.
  const [rpePromptOpen, setRpePromptOpen] = useState(false);
  const requestComplete = () => setRpePromptOpen(true);
  const finishWith = (rpe) => {
    setRpePromptOpen(false);
    onComplete(dayIdx, rpe);
  };
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

  if (dayIdx === null || dayIdx === undefined) return null;
  const day = WORKOUT_WEEK[dayIdx];
  if (!day) return null;
  const sessionDate = workoutDateKey(dayIdx);

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
            <div className="wmodal-title">{day.title}</div>
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
            ⏱ {day.duration} &nbsp;·&nbsp; 🎯 {day.focus}
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
              sessionDate={sessionDate}
              setsMap={setsMap}
              getPrevBest={getPrevBest}
              getSuggestion={getSuggestion}
              onLogField={onLogField}
              onCycleStatus={onCycleStatus}
              onStartWarmup={onStartWarmup}
              onRequestComplete={requestComplete}
            />
          )}
        </div>
      </div>
      <RpeDialog
        open={rpePromptOpen}
        onSubmit={(rpe) => finishWith(rpe)}
        onSkip={() => finishWith(null)}
      />
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
  sessionDate,
  setsMap,
  getPrevBest,
  getSuggestion,
  onLogField,
  onCycleStatus,
  onStartWarmup,
  onRequestComplete,
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
      {day.warmup?.length > 0 && (
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
          {day.warmup.map((w, i) => (
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
        {day.exercises.map((ex, ei) => {
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
            />
          );
        })}
      </div>

      {day.cooldown?.length > 0 && (
        <div className="wmodal-section">
          <div className="wmodal-section-title green">Cool Down</div>
          {day.cooldown.map((c, i) => (
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
          onClick={onRequestComplete}
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
