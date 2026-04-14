import { GUT_SUPPS } from '../../data/gutSupps.js';
import { GUT_LIFESTYLE } from '../../data/lifestyleGut.js';
import { DateBar } from '../shared/DateBar.jsx';
import { CompleteBanner } from '../shared/CompleteBanner.jsx';
import { Section } from '../shared/Section.jsx';
import { SuppItem } from '../shared/SuppItem.jsx';
import { LifestyleItem } from '../shared/LifestyleItem.jsx';

const GUT_PHASES = [
  { key: 'morning', icon: '🌅', title: 'Fasted Morning', tag: '15 MIN BEFORE FOOD' },
  { key: 'withfood', icon: '🍳', title: 'With Breakfast', tag: 'SUPPORTS MEAL' },
  { key: 'evening', icon: '🌙', title: 'Evening', tag: 'BEFORE BED' },
];

export function GutPanel({ active, checks, onToggle, onReset, onExport, allSuppComplete }) {
  return (
    <div className={`panel${active ? ' active' : ''}`} id="panel-gut">
      <div className="wrap">
        <DateBar resetNote="Resets 00:00 local" />

        <div className="gut-intro">
          <div className="gut-intro-title">GUT HEALING PROTOCOL</div>
          <div className="gut-intro-text">
            Rebuild the mucosal lining, seal tight junctions, restore microbiome
            balance, and support collagen for the colonoscopy recovery window.
          </div>
        </div>

        {allSuppComplete && <CompleteBanner tab="gut" />}

        {GUT_PHASES.map((phase) => {
          const supps = GUT_SUPPS[phase.key] || [];
          const done = supps.filter((s) => checks[s.id]).length;
          return (
            <Section
              key={phase.key}
              id={`gut-section-${phase.key}`}
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
                  tab="gut"
                  checked={!!checks[s.id]}
                  onToggle={onToggle}
                />
              ))}
            </Section>
          );
        })}

        <Section
          id="gut-section-lifestyle"
          icon="🌿"
          title="Healing Habits"
          tag="DAILY"
          done={GUT_LIFESTYLE.filter((l) => checks[l.id]).length}
          total={GUT_LIFESTYLE.length}
        >
          <div className="lifestyle-list">
            {GUT_LIFESTYLE.map((l) => (
              <LifestyleItem
                key={l.id}
                item={l}
                tab="gut"
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
