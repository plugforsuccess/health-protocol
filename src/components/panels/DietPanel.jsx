import { useState } from 'react';
import { WEEK_MEALS } from '../../data/weekMeals.js';
import { DateBar } from '../shared/DateBar.jsx';
import { AvoidBanner } from '../diet/AvoidBanner.jsx';
import { BenefitLegend } from '../diet/BenefitLegend.jsx';
import { DayTabs } from '../diet/DayTabs.jsx';
import { MealCard } from '../diet/MealCard.jsx';
import { PrepMode } from '../diet/PrepMode.jsx';

function defaultDayIdx() {
  // Our WEEK_MEALS is Sun..Sat (0..6) matching Date.getDay().
  const i = new Date().getDay();
  return Math.max(0, Math.min(6, i));
}

export function DietPanel({ active }) {
  const [prepMode, setPrepMode] = useState(false);
  const [dayIdx, setDayIdx] = useState(defaultDayIdx());

  const day = WEEK_MEALS[dayIdx];

  return (
    <div className={`panel${active ? ' active' : ''}`} id="panel-diet">
      <div className="wrap">
        <DateBar />
        <AvoidBanner />

        <div className="week-nav">
          <div className="week-nav-top">
            <div className="week-label">
              {prepMode ? 'MEAL PREP MODE' : day?.label || 'Week Plan'}
            </div>
            <button
              type="button"
              className={`prep-btn${prepMode ? ' active' : ''}`}
              onClick={() => setPrepMode((v) => !v)}
            >
              {prepMode ? '← MEALS' : 'PREP MODE →'}
            </button>
          </div>
          {!prepMode && <DayTabs activeIdx={dayIdx} onSelect={setDayIdx} />}
        </div>

        {!prepMode ? (
          <>
            <BenefitLegend />
            {(day?.meals || []).map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </>
        ) : (
          <PrepMode initialIdx={dayIdx} />
        )}
      </div>
    </div>
  );
}
