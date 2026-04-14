import { useCallback, useEffect, useState } from 'react';
import { supabase, localDateKey } from '../lib/supabase.js';

/**
 * Streak state for a tab. Count increments when the full supplement set is
 * checked for the day AND today isn't already recorded as completed.
 * Streak chain breaks if `last_completed_date` isn't yesterday.
 */
export function useStreak(userId, tab) {
  const [count, setCount] = useState(0);
  const [lastDate, setLastDate] = useState(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setReady(false);
    const { data, error } = await supabase
      .from('streaks')
      .select('streak_count, last_completed_date')
      .eq('user_id', userId)
      .eq('tab', tab)
      .maybeSingle();
    if (!error && data) {
      setCount(data.streak_count || 0);
      setLastDate(data.last_completed_date || null);
    } else {
      setCount(0);
      setLastDate(null);
    }
    setReady(true);
  }, [userId, tab]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Called whenever all supplements for a tab are complete. No-op if today
   * is already marked complete. Otherwise: chain from yesterday or reset to 1.
   */
  const markCompleteToday = useCallback(async () => {
    if (!userId) return;
    const today = localDateKey();
    if (lastDate === today) return; // already counted today

    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = localDateKey(y);

    const newCount = lastDate === yesterday ? count + 1 : 1;

    // optimistic
    setCount(newCount);
    setLastDate(today);

    const { error } = await supabase.from('streaks').upsert(
      {
        user_id: userId,
        tab,
        streak_count: newCount,
        last_completed_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,tab' }
    );

    if (error) {
      // revert on failure
      await load();
      throw error;
    }
  }, [userId, tab, count, lastDate, load]);

  return { count, lastDate, ready, markCompleteToday, reload: load };
}
