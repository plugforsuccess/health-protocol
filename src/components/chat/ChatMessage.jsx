import { useCallback, useState } from 'react';

export function ChatMessage({ message, accentColor }) {
  const [showTime, setShowTime] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.isError;

  const toggleTime = useCallback(() => {
    setShowTime((v) => !v);
  }, []);

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const className = `chat-message ${isUser ? 'user' : 'assistant'}${isError ? ' error' : ''}`;
  const style = isUser ? { background: accentColor } : undefined;

  return (
    <div>
      <div
        className={className}
        style={style}
        onClick={toggleTime}
        role="button"
        tabIndex={0}
      >
        {message.content}
      </div>
      {showTime && timeStr && (
        <div
          className="chat-message-time"
          style={{ textAlign: isUser ? 'right' : 'left' }}
        >
          {timeStr}
        </div>
      )}
      {message.hasReferral && (
        <div className="chat-referral-note">
          &rarr; Need a referral? Log this in your injury profile so we can
          track it over time.
        </div>
      )}
    </div>
  );
}
