import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage.jsx';
import { ChatInput } from './ChatInput.jsx';
import { QuickTapPrompts } from './QuickTapPrompts.jsx';
import { ChatLoadingDots } from './ChatLoadingDots.jsx';

// Shared chat UI used inside the ChatDrawer for both workout and
// nutrition coaching. Renders messages, quick-tap prompts, loading
// indicator, and the input row.

export function CoachingChat({
  messages,
  loading,
  onSend,
  onQuickTap,
  quickTapPrompts,
  accentColor,
  emptyStateText,
}) {
  const [promptsVisible, setPromptsVisible] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Reset prompt visibility when messages clear (new context)
  useEffect(() => {
    if (messages.length === 0) setPromptsVisible(true);
  }, [messages.length]);

  function handleSend(text) {
    onSend(text);
    setPromptsVisible(false);
  }

  function handleQuickTap(prompt) {
    onQuickTap(prompt);
    setPromptsVisible(false);
  }

  return (
    <div className="coaching-chat">
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty-state">
            {emptyStateText || 'Ask anything'}
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} accentColor={accentColor} />
        ))}
        {loading && <ChatLoadingDots />}
        <div ref={messagesEndRef} />
      </div>

      {promptsVisible && messages.length === 0 && (
        <QuickTapPrompts prompts={quickTapPrompts} onTap={handleQuickTap} />
      )}

      <ChatInput
        onSend={handleSend}
        disabled={loading}
        accentColor={accentColor}
      />
    </div>
  );
}
