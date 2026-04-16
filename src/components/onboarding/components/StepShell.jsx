// Common chrome around every step body — title, optional subtext, the
// scrollable content area, and an error slot for inline validation.

export function StepShell({ title, subtitle, error, children }) {
  return (
    <div className="onb-step">
      <div className="onb-step-head">
        <h2 className="onb-step-title">{title}</h2>
        {subtitle ? <p className="onb-step-sub">{subtitle}</p> : null}
      </div>
      <div className="onb-step-body">{children}</div>
      {error ? <div className="onb-step-error">⚠ {error}</div> : null}
    </div>
  );
}

export function FieldGroup({ label, hint, children }) {
  return (
    <div className="onb-field">
      {label ? <div className="onb-field-label">{label}</div> : null}
      {children}
      {hint ? <div className="onb-field-hint">{hint}</div> : null}
    </div>
  );
}
