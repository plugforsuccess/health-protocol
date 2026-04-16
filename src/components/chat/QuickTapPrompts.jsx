export function QuickTapPrompts({ prompts, onTap }) {
  if (!prompts?.length) return null;

  return (
    <div className="chat-quick-taps">
      {prompts.map((prompt, i) => (
        <button
          key={i}
          className="quick-tap-chip"
          onClick={() => onTap(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
