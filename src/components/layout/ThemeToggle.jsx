export function ThemeToggle({ isLight, onToggle }) {
  return (
    <div className="theme-toggle-wrap">
      <span className="theme-icon">{isLight ? '☀️' : '🌙'}</span>
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggle}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-pressed={isLight}
      />
    </div>
  );
}
