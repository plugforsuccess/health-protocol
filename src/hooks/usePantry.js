import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/** Normalize a grocery item string to a stable pantry key. */
export function pantryKey(item) {
  return item
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/**
 * Pantry state stored in Supabase `pantry_items`.
 * Presence in the local `have` map ⇒ the user marked the item as "have it".
 */
export function usePantry(userId) {
  const [have, setHave] = useState({});
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setReady(false);
    const { data, error } = await supabase
      .from('pantry_items')
      .select('item_key, have_it')
      .eq('user_id', userId);
    if (!error && data) {
      const map = {};
      data.forEach((row) => {
        if (row.have_it) map[row.item_key] = true;
      });
      setHave(map);
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (item) => {
      if (!userId) return;
      const key = pantryKey(item);
      const next = !have[key];

      setHave((prev) => {
        const copy = { ...prev };
        if (next) copy[key] = true;
        else delete copy[key];
        return copy;
      });

      const { error } = await supabase.from('pantry_items').upsert(
        {
          user_id: userId,
          item_key: key,
          have_it: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,item_key' }
      );

      if (error) {
        setHave((prev) => {
          const copy = { ...prev };
          if (next) delete copy[key];
          else copy[key] = true;
          return copy;
        });
        throw error;
      }
    },
    [userId, have]
  );

  const clear = useCallback(async () => {
    if (!userId) return;
    setHave({});
    const { error } = await supabase.from('pantry_items').delete().eq('user_id', userId);
    if (error) {
      await load();
      throw error;
    }
  }, [userId, load]);

  const isHave = useCallback((item) => !!have[pantryKey(item)], [have]);

  return { have, isHave, toggle, clear, ready, reload: load };
}
