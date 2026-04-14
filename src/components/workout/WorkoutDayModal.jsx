import { useEffect } from 'react';
import { WORKOUT_WEEK } from '../../data/workoutWeek.js';
import { workoutDateKey } from '../../hooks/useWorkoutLogs.js';
import { ExerciseCard } from './ExerciseCard.jsx';
import { MobilityItem } from './MobilityItem.jsx';

export function WorkoutDayModal({
  dayIdx,
  onClose,
  setsMap,
  mobilityMap,
  getPrevBest,
  onLogField,
  onCycleStatus,
  onToggleMobility,
  onComplete,
}) {
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
              onLogField={onLogField}
              onCycleStatus={onCycleStatus}
              onComplete={onComplete}
            />
          )}
        </div>
      </div>
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
  onLogField,
  onCycleStatus,
  onComplete,
}) {
  return (
    <>
      {day.warmup?.length > 0 && (
        <div className="wmodal-section">
          <div className="wmodal-section-title green">Warm-Up</div>
          {day.warmup.map((w, i) => (
            <div key={i} className="mobility-item" style={{ cursor: 'default' }}>
              <div style={{ fontSize: 16 }}>🔥</div>
              <div className="mobility-content">
                <div className="mobility-name">
                  {w.name}
                  {w.sets ? (
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}> × {w.sets}</span>
                  ) : null}
                </div>
                <div className="mobility-detail">{w.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="wmodal-section">
        <div className="wmodal-section-title">Main Workout</div>
        {day.exercises.map((ex, ei) => (
          <ExerciseCard
            key={ei}
            ex={ex}
            dayIdx={dayIdx}
            exIdx={ei}
            sessionDate={sessionDate}
            setsMap={setsMap}
            prevBest={getPrevBest(dayIdx, ei, sessionDate)}
            onLogField={onLogField}
            onCycleStatus={(d, e, s) => onCycleStatus(d, e, s, ex.name)}
          />
        ))}
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
