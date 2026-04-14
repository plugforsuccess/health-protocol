export function Section({ id, icon, title, tag, done, total, children }) {
  const allDone = total > 0 && done === total;
  return (
    <div className="section" id={id}>
      <div className="section-head">
        <div className="section-time">
          {icon} {title}
        </div>
        {tag && <span className="section-tag">{tag}</span>}
        <span className={`section-count${allDone ? ' all-done' : ''}`}>
          {done}/{total}
        </span>
      </div>
      {children}
    </div>
  );
}
