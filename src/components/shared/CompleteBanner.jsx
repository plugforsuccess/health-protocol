export function CompleteBanner({ tab }) {
  const title = tab === 'nt' ? 'NEURO STACK COMPLETE' : 'GUT STACK COMPLETE';
  const sub =
    tab === 'nt'
      ? 'All supplements checked. Streak extended.'
      : 'All gut-healing supplements checked.';
  return (
    <div className={`complete-banner ${tab}-banner`}>
      <div className="complete-title">{title}</div>
      <div className="complete-sub">{sub}</div>
    </div>
  );
}
