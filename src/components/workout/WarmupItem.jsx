import { getMobilityTimerDuration } from '../../hooks/useRestTimer.js';

/**
 * Tappable warm-up row.
 *
 * Every warm-up — timed OR rep-based — gets a 10-second "get ready"
 * countdown when tapped. Timed warm-ups (e.g. "5 min Jump Rope") then
 * start a work timer for the parsed duration; rep-based warm-ups
 * (e.g. "15 reps Glute Bridge") just mark complete after the 10s prep.
 *
 * The actual timer is started by the parent (panel) so the existing
 * rest-timer infrastructure (wake lock, fallback push, audio beep on
 * completion) is reused — we don't fork a second timer hook.
 *
 * State machine:
 *   idle    → tap → running    (10s prep firing)
 *   running → prep ends → either 'work' phase timer OR jump straight to done
 *   done    → tap → idle       (user uncheck)
 *
 * Visual: looks like a mobility-item so it fits the existing modal rhythm,
 * but adds a pulsing border while running so the user knows the timer is
 * live on top of this row.
 */
export function WarmupItem({ item, status, onToggle }) {
  const dur = getMobilityTimerDuration(item);
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isRoundPause = typeof status === 'string' && status.startsWith('round-');
  const completedRound = isRoundPause ? parseInt(status.split('-')[1], 10) : 0;
  const totalSets = Math.max(1, parseInt(item.sets, 10) || 1);

  let checkLabel = '';
  if (isDone) checkLabel = '✓';
  else if (isRunning) checkLabel = '…';
  else if (isRoundPause) checkLabel = `${completedRound}/${totalSets}`;

  return (
    <div
      className={`mobility-item warmup-item${isDone ? ' done-mob' : ''}${isRunning ? ' running' : ''}${isRoundPause ? ' round-pause' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
    >
      <div className="mobility-check">{checkLabel}</div>
      <div className="mobility-content">
        <div className="mobility-name">
          {item.name}
          {item.sets ? (
            <span
              style={{
                fontSize: 10,
                color: 'var(--muted)',
                fontFamily: 'DM Mono, monospace',
                marginLeft: 6,
              }}
            >
              × {item.sets}
            </span>
          ) : null}
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 9,
              color: dur ? 'var(--s)' : 'var(--muted)',
              marginLeft: 6,
            }}
          >
            {dur ? `⏱ 5s prep + ${formatDur(dur)}` : '⏱ 5s prep'}
          </span>
        </div>
        <div className="mobility-detail">{item.detail}</div>
      </div>
    </div>
  );
}

function formatDur(sec) {
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60} min`;
  if (sec >= 60) return `${Math.floor(sec / 60)}m${sec % 60}s`;
  return `${sec}s`;
}
