import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, localDateKey } from '../lib/supabase.js';

/**
 * Manages today's daily_checks for a given tab ('nt' | 'gut').
 * Optimistic UI: toggles state immediately, syncs to Supabase in the background.
 * Returns: { checks, toggle, reset, reload, error, ready }
 */
export function useProtocolState(userId, tab) {
  const [checks, setChecks] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const dateRef = useRef(localDateKey());

  const load = useCallback(async () => {
    if (!userId) return;
    setReady(false);
    const today = localDateKey();
    dateRef.current = today;

    const { data, error: err } = await supabase
      .from('daily_checks')
      .select('item_id, checked')
      .eq('user_id', userId)
      .eq('tab', tab)
      .eq('check_date', today);

    if (err) {
      setError(err.message);
      setReady(true);
      return;
    }

    const map = {};
    (data || []).forEach((row) => {
      if (row.checked) map[row.item_id] = true;
    });
    setChecks(map);
    setReady(true);
  }, [userId, tab]);

  useEffect(() => {
    load();
  }, [load]);

  /** Optimistically toggle and upsert. Reverts on failure. */
  const toggle = useCallback(
    async (itemId) => {
      if (!userId) return;
      const today = localDateKey();
      const next = !checks[itemId];

      setChecks((prev) => {
        const copy = { ...prev };
        if (next) copy[itemId] = true;
        else delete copy[itemId];
        return copy;
      });

      const { error: err } = await supabase.from('daily_checks').upsert(
        {
          user_id: userId,
          tab,
          item_id: itemId,
          checked: next,
          check_date: today,
        },
        { onConflict: 'user_id,tab,item_id,check_date' }
      );

      if (err) {
        // revert
        setChecks((prev) => {
          const copy = { ...prev };
          if (next) delete copy[itemId];
          else copy[itemId] = true;
          return copy;
        });
        setError(err.message);
        throw err;
      }
      return next;
    },
    [userId, tab, checks]
  );

  /** Delete all of today's check rows for this tab. */
  const reset = useCallback(async () => {
    if (!userId) return;
    const today = localDateKey();
    setChecks({});
    const { error: err } = await supabase
      .from('daily_checks')
      .delete()
      .eq('user_id', userId)
      .eq('tab', tab)
      .eq('check_date', today);
    if (err) {
      setError(err.message);
      await load();
      throw err;
    }
  }, [userId, tab, load]);

  return { checks, toggle, reset, reload: load, error, ready };
}
