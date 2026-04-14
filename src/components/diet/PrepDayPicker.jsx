import { WEEK_MEALS } from '../../data/weekMeals.js';

export function PrepDayPicker({ activeIdx, onSelect }) {
  return (
    <div className="day-tabs">
      {WEEK_MEALS.map((d, i) => (
        <button
          key={i}
          type="button"
          className={`day-tab${activeIdx === i ? ' active' : ''}`}
          onClick={() => onSelect(i)}
        >
          {d.day}
        </button>
      ))}
    </div>
  );
}
