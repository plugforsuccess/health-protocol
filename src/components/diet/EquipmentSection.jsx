import { EQUIPMENT } from '../../data/equipment.js';

export function EquipmentSection() {
  const have = EQUIPMENT?.have || [];
  const need = EQUIPMENT?.need || [];

  return (
    <div className="section">
      <div className="section-head">
        <div className="section-time">🧰 Equipment</div>
        <span className="section-tag">KITCHEN</span>
      </div>

      {have.length > 0 && (
        <>
          <div className="equip-sub have">✓ You Already Have</div>
          {have.map((e, i) => (
            <div key={i} className="equip-row">
              <div className="equip-check">✅</div>
              <div className="equip-main">
                <div className="equip-name">{e.item}</div>
                {e.use && <div className="equip-use">{e.use}</div>}
              </div>
            </div>
          ))}
        </>
      )}

      {need.length > 0 && (
        <>
          <div className="equip-sub need">🛒 You Need to Buy</div>
          {need.map((e, i) => (
            <div key={i} className="equip-row need-item">
              <div className="equip-check">🛒</div>
              <div className="equip-main">
                <div className="equip-name">{e.item}</div>
                {e.use && <div className="equip-use">{e.use}</div>}
                {e.buy && <div className="equip-buy">{e.buy}</div>}
              </div>
              {e.urgency && <div className="urgency-badge">{e.urgency}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
