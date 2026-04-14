const TABS = [
  { key: 'nt', label: '🧠 NEURO' },
  { key: 'gut', label: '🌿 GUT' },
  { key: 'diet', label: '🥗 DIET' },
];

export function TabSwitcher({ tab, setTab }) {
  return (
    <div className="tab-switcher">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`tab-btn${tab === t.key ? ` active-${t.key}` : ''}`}
          onClick={() => setTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
