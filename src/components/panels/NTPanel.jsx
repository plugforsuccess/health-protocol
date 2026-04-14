import { NT_SUPPS } from '../../data/ntSupps.js';
import { NT_LIFESTYLE } from '../../data/lifestyleNT.js';
import { DateBar } from '../shared/DateBar.jsx';
import { CompleteBanner } from '../shared/CompleteBanner.jsx';
import { Section } from '../shared/Section.jsx';
import { SuppItem } from '../shared/SuppItem.jsx';
import { LifestyleItem } from '../shared/LifestyleItem.jsx';

const NT_PHASES = [
  { key: 'morning', icon: '☀️', title: 'Morning', tag: 'ON WAKE · FASTED' },
  { key: 'midday', icon: '🌤', title: 'Midday', tag: 'WITH LUNCH' },
  { key: 'evening', icon: '🌆', title: 'Evening', tag: 'WITH DINNER' },
  { key: 'bedtime', icon: '🌙', title: 'Bedtime', tag: '1 HR BEFORE SLEEP' },
  { key: 'weekly', icon: '📅', title: 'Weekly Cycling', tag: '3–4× PER WEEK' },
];

export function NTPanel({ active, checks, onToggle, onReset, onExport, allSuppComplete }) {
  return (
    <div className={`panel${active ? ' active' : ''}`} id="panel-nt">
      <div className="wrap">
        <DateBar resetNote="Resets 00:00 local" />

        {allSuppComplete && <CompleteBanner tab="nt" />}

        {NT_PHASES.map((phase) => {
          const supps = NT_SUPPS[phase.key] || [];
          const done = supps.filter((s) => checks[s.id]).length;
          return (
            <Section
              key={phase.key}
              id={`nt-section-${phase.key}`}
              icon={phase.icon}
              title={phase.title}
              tag={phase.tag}
              done={done}
              total={supps.length}
            >
              {supps.map((s) => (
                <SuppItem
                  key={s.id}
                  supp={s}
                  tab="nt"
                  checked={!!checks[s.id]}
                  onToggle={onToggle}
                />
              ))}
            </Section>
          );
        })}

        <Section
          id="nt-section-lifestyle"
          icon="⚡"
          title="Lifestyle Habits"
          tag="DAILY"
          done={NT_LIFESTYLE.filter((l) => checks[l.id]).length}
          total={NT_LIFESTYLE.length}
        >
          <div className="lifestyle-list">
            {NT_LIFESTYLE.map((l) => (
              <LifestyleItem
                key={l.id}
                item={l}
                tab="nt"
                checked={!!checks[l.id]}
                onToggle={onToggle}
              />
            ))}
          </div>
        </Section>

        <button type="button" className="reset-btn" onClick={onReset}>
          ↺ RESET TODAY'S PROTOCOL
        </button>
        <button type="button" className="export-btn" onClick={onExport}>
          ↓ EXPORT ALL DATA
        </button>
      </div>
    </div>
  );
}
