import { useCallback, useEffect, useRef } from 'react';

// Slide-up bottom sheet wrapper for the coaching chat.
// Sits at z-index 800-801, above the rest timer (700) but below nothing
// critical. Closes on X, swipe-down, or tap-outside.

export function ChatDrawer({ isOpen, onClose, title, subtitle, accentColor, children }) {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Handle viewport resize for mobile keyboard
  useEffect(() => {
    if (!isOpen || typeof visualViewport === 'undefined') return;
    const vv = visualViewport;
    const handler = () => {
      if (sheetRef.current) {
        const offset = window.innerHeight - vv.height;
        sheetRef.current.style.transform = offset > 0 ? `translateY(-${offset}px)` : '';
      }
    };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, [isOpen]);

  // Swipe-down to close
  const handleTouchStart = useCallback((e) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (startYRef.current === null) return;
      const diff = e.changedTouches[0].clientY - startYRef.current;
      if (diff > 80) onClose();
      startYRef.current = null;
    },
    [onClose]
  );

  // Tap overlay to close
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="chat-drawer-overlay" onClick={handleOverlayClick}>
      <div
        ref={sheetRef}
        className="chat-drawer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
      >
        <div className="chat-drawer-handle" />
        <div className="chat-drawer-header">
          <div>
            <div className="chat-drawer-title" style={{ color: accentColor }}>
              {title}
            </div>
            {subtitle && <div className="chat-drawer-subtitle">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="chat-drawer-close"
            onClick={onClose}
            aria-label="Close chat"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
