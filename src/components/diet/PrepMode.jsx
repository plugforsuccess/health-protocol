import { useState } from 'react';
import { DAY_PREP } from '../../data/dayPrep.js';
import { PrepDayPicker } from './PrepDayPicker.jsx';
import { GroceryList } from './GroceryList.jsx';

export function PrepMode({ initialIdx = 0, pantry, onTogglePantry, onClearPantry }) {
  const [idx, setIdx] = useState(initialIdx);
  const prep = DAY_PREP[idx];
  if (!prep) return null;

  return (
    <>
      <div className="prep-intro">
        <div className="prep-intro-title">PREP DAY</div>
        <div className="prep-intro-text">
          Duration: <strong>{prep.duration}</strong> · Covers:{' '}
          <strong>{prep.covers}</strong>. Tap another day to see its prep plan.
        </div>
      </div>

      <PrepDayPicker activeIdx={idx} onSelect={setIdx} />

      <div style={{ marginTop: '18px' }}>
        <div className="pantry-legend">
          <span className="pantry-legend-dot" />
          <span>Tap items you already own to cross them off</span>
          <button
            type="button"
            className="pantry-clear-btn"
            onClick={onClearPantry}
          >
            Clear all
          </button>
        </div>
        <GroceryList groceries={prep.groceries} pantry={pantry} onToggle={onTogglePantry} />
      </div>

      <div style={{ marginTop: '18px' }}>
        <div className="grocery-cat-title">PREP STEPS</div>
        {(prep.steps || []).map((step, i) => (
          <div key={i} className="prep-step">
            <div className="prep-step-num">{i + 1}</div>
            <div className="prep-step-content">
              <div className="prep-step-title">{step.title}</div>
              <div className="prep-step-desc">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
