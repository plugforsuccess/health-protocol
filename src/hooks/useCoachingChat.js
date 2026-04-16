import { useCallback, useEffect, useRef, useState } from 'react';

// Shared chat hook used by both the Workout Coach and Nutrition Coach.
// Manages chat state, message history, system prompt lifecycle, and
// Claude API calls. Each consumer passes a system prompt builder and
// the context object — the hook handles the rest.
//
// Message history is component-state only (not persisted to Supabase).
// History is capped at 10 messages to keep token usage bounded.

const MAX_HISTORY = 10;

const PAIN_KEYWORDS = [
  'sharp', 'shooting', 'numbness', 'tingling',
  'swelling', "can't move", 'locked up',
];

const PAIN_WARNING =
  '\u26d4 Stop this exercise immediately. The symptoms you\u2019re describing ' +
  'may indicate an acute injury. Do not continue until you\u2019ve spoken ' +
  'with a medical professional.';

const REFERRAL_PATTERNS = [
  /see (a |your )?(doctor|physician|medical professional|healthcare provider)/i,
  /see (a |your )?(physical therapist|physiotherapist|PT\b)/i,
  /consult (a |your )?(doctor|physician|medical|gastroenterologist|specialist)/i,
  /seek (immediate )?medical (attention|advice|help)/i,
  /visit (a |your )?(doctor|physician|gastroenterologist)/i,
  /recommend.{0,30}(doctor|physician|specialist|gastroenterologist|PT\b)/i,
];

export function useCoachingChat({ systemPromptBuilder, context, accentColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const sendDebounceRef = useRef(null);

  // Build system prompt when context changes
  useEffect(() => {
    if (context) {
      setSystemPrompt(systemPromptBuilder(context));
    }
  }, [context, systemPromptBuilder]);

  // Open drawer — optionally clear messages for fresh context
  const openChat = useCallback((freshContext = false) => {
    if (freshContext) setMessages([]);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || loading) return;

      // 500ms debounce
      if (sendDebounceRef.current) return;
      sendDebounceRef.current = true;
      setTimeout(() => { sendDebounceRef.current = false; }, 500);

      // Client-side acute pain check
      const lowerContent = content.toLowerCase();
      const hasPainFlag = PAIN_KEYWORDS.some((kw) => lowerContent.includes(kw));

      const userMessage = { role: 'user', content, timestamp: new Date() };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        // Trim history to last MAX_HISTORY messages for the API call
        const currentMessages = [...messages, userMessage];
        const trimmedHistory = currentMessages.slice(-MAX_HISTORY).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
            system: systemPrompt,
            messages: trimmedHistory,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error?.message || `API error ${response.status}`);
        }

        let assistantContent = data.content[0].text;

        // Prepend acute pain warning if flagged
        if (hasPainFlag) {
          assistantContent = `${PAIN_WARNING}\n\n${assistantContent}`;
        }

        // Check for injury/GI escalation — append referral note
        const hasReferral = REFERRAL_PATTERNS.some((rx) => rx.test(assistantContent));

        const assistantMessage = {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          hasReferral,
        };

        setMessages((prev) => {
          const updated = [...prev, assistantMessage];
          // Trim to keep total at MAX_HISTORY
          return updated.length > MAX_HISTORY
            ? updated.slice(updated.length - MAX_HISTORY)
            : updated;
        });
      } catch (error) {
        console.warn('[useCoachingChat] API error', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Something went wrong. Check your connection and try again.',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, systemPrompt]
  );

  const sendQuickTap = useCallback(
    (prompt) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  return {
    isOpen,
    messages,
    loading,
    accentColor,
    openChat,
    closeChat,
    sendMessage,
    sendQuickTap,
  };
}
