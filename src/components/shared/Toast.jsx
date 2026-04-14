export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast${toast.error ? ' error' : ''}`} role="status">
      {toast.message}
    </div>
  );
}
