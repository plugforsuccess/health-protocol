const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function DateBar({ resetNote }) {
  const now = new Date();
  const day = DAYS[now.getDay()];
  const info = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  return (
    <div className="date-bar">
      <div className="date-day">{day}</div>
      <div className="date-info">{info}</div>
      {resetNote && <div className="reset-note">{resetNote}</div>}
    </div>
  );
}
