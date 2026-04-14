import { CheckSvg } from './CheckSvg.jsx';

export function LifestyleItem({ item, tab, checked, onToggle }) {
  const classes = ['life-item', checked ? `checked-${tab}` : ''].filter(Boolean).join(' ');
  return (
    <div className={classes} onClick={() => onToggle(item.id)}>
      <div className="life-check">
        <CheckSvg size={9} />
      </div>
      <div className="life-content">
        <div className="life-title">
          {item.icon} {item.title}
        </div>
        <div className="life-desc">{item.desc}</div>
      </div>
    </div>
  );
}
