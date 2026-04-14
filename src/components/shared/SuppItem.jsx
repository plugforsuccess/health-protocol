import { useState } from 'react';
import { CheckSvg } from './CheckSvg.jsx';
import { NT_LABELS } from '../../data/ntLabels.js';

export function SuppItem({ supp, tab, checked, onToggle }) {
  const [open, setOpen] = useState(false);
  const classes = [
    'supp-item',
    checked ? `checked-${tab}` : '',
    supp.warn ? 'warn-item' : '',
    open ? 'open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dots = supp.nt || [];

  return (
    <div className={classes}>
      <div
        className="supp-row"
        onClick={(e) => {
          // Don't toggle when clicking the chevron
          if (e.target.closest('.expand-btn')) return;
          onToggle(supp.id);
        }}
      >
        <div className="check-circle">
          <CheckSvg />
        </div>
        <div className="supp-main">
          <div className="supp-name">{supp.name}</div>
          <div className="supp-meta">
            <span className="supp-dose">{supp.dose}</span>
            <div className="nt-dots">
              {dots.map((n, i) => (
                <span key={i} className={`nt-dot ${n}`} />
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label={open ? 'Collapse details' : 'Expand details'}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <polyline
              points="2.5,4.5 6.5,8.5 10.5,4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="drawer">
        <div className="drawer-inner">
          <div className="drawer-why">{supp.why}</div>
          <div className="drawer-tags">
            {dots.map((n, i) => (
              <span key={i} className={`drawer-tag ${n}`}>
                {NT_LABELS[n] || n}
              </span>
            ))}
          </div>
          <div className="drawer-brand">
            Best source: <span>{supp.brand}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
