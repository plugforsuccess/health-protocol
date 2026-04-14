import { getMobilityTimerDuration } from '../../hooks/useRestTimer.js';

export function MobilityItem({ item, checked, onToggle }) {
  const dur = getMobilityTimerDuration(item);
  return (
    <div
      className={`mobility-item${checked ? ' done-mob' : ''}`}
      onClick={onToggle}
    >
      <div className="mobility-check">{checked ? '✓' : ''}</div>
      <div className="mobility-content">
        <div className="mobility-name">
          {item.name}{' '}
          <span
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {item.sets}
          </span>
          {dur && (
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 9,
                color: 'var(--s)',
                marginLeft: 6,
              }}
            >
              ⏱ {dur}s
            </span>
          )}
        </div>
        <div className="mobility-detail">{item.detail}</div>
      </div>
    </div>
  );
}
