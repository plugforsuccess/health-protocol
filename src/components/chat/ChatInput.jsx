import { useRef, useState } from 'react';

export function ChatInput({ onSend, disabled, accentColor }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  function handleSend() {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input-row">
      <input
        ref={inputRef}
        className="chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        autoFocus
        enterKeyHint="send"
      />
      <button
        className="chat-send-btn"
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        style={{ background: accentColor }}
        aria-label="Send message"
      >
        &uarr;
      </button>
    </div>
  );
}
