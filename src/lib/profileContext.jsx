import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';

// Profile context — exposes the current user's profile + injuries + surgeries
// app-wide so the workout modal, AI chat, and contraindication engine don't
// have to refetch or prop-drill. Loaded once after auth, kept in sync via
// updateProfile / refreshProfile.
//
// `loading` is true on the initial load. After that, callers should treat
// `profile === null` as "user has not completed onboarding yet".

const ProfileContext = createContext({
  profile: null,
  injuries: [],
  surgeries: [],
  loading: true,
  refreshProfile: () => Promise.resolve(),
  updateProfile: () => Promise.resolve(),
  saveInjury: () => Promise.resolve(),
  markInjuryHealed: () => Promise.resolve(),
  reactivateInjury: () => Promise.resolve(),
  saveSurgery: () => Promise.resolve(),
  deleteSurgery: () => Promise.resolve(),
  completeOnboarding: () => Promise.resolve(),
});

export function ProfileProvider({ userId, children }) {
  const [profile, setProfile]     = useState(null);
  const [injuries, setInjuries]   = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading]     = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setInjuries([]);
      setSurgeries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: prof }, { data: inj }, { data: sx }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_injuries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('user_surgeries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
      ]);
      setProfile(prof || null);
      setInjuries(inj || []);
      setSurgeries(sx || []);
    } catch (e) {
      console.warn('[profileContext] load failed', e?.message || e);
      setProfile(null);
      setInjuries([]);
      setSurgeries([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback(
    async (patch) => {
      if (!userId) throw new Error('Not signed in.');
      const payload = { user_id: userId, ...patch };
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile(data);
      return data;
    },
    [userId]
  );

  const completeOnboarding = useCallback(
    async (patch) => {
      if (!userId) throw new Error('Not signed in.');
      const payload = {
        user_id: userId,
        ...patch,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile(data);
      return data;
    },
    [userId]
  );

  // ── Injuries ─────────────────────────────────────────────────────────
  const saveInjury = useCallback(
    async (injury) => {
      if (!userId) throw new Error('Not signed in.');
      const payload = { user_id: userId, ...injury };
      const { data, error } = await supabase
        .from('user_injuries')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setInjuries((prev) => {
          const i = prev.findIndex((x) => x.id === data.id);
          if (i === -1) return [...prev, data];
          const next = prev.slice();
          next[i] = data;
          return next;
        });
      }
      return data;
    },
    [userId]
  );

  const markInjuryHealed = useCallback(
    async (injuryId) => {
      const { data, error } = await supabase
        .from('user_injuries')
        .update({ active: false })
        .eq('id', injuryId)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setInjuries((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      }
      return data;
    },
    []
  );

  const reactivateInjury = useCallback(
    async (injuryId) => {
      const { data, error } = await supabase
        .from('user_injuries')
        .update({ active: true })
        .eq('id', injuryId)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setInjuries((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      }
      return data;
    },
    []
  );

  // ── Surgeries ────────────────────────────────────────────────────────
  const saveSurgery = useCallback(
    async (surgery) => {
      if (!userId) throw new Error('Not signed in.');
      const payload = { user_id: userId, ...surgery };
      const { data, error } = await supabase
        .from('user_surgeries')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSurgeries((prev) => {
          const i = prev.findIndex((x) => x.id === data.id);
          if (i === -1) return [...prev, data];
          const next = prev.slice();
          next[i] = data;
          return next;
        });
      }
      return data;
    },
    [userId]
  );

  const deleteSurgery = useCallback(async (surgeryId) => {
    const { error } = await supabase
      .from('user_surgeries')
      .delete()
      .eq('id', surgeryId);
    if (error) throw error;
    setSurgeries((prev) => prev.filter((x) => x.id !== surgeryId));
  }, []);

  const value = useMemo(
    () => ({
      profile,
      injuries,
      surgeries,
      loading,
      refreshProfile,
      updateProfile,
      saveInjury,
      markInjuryHealed,
      reactivateInjury,
      saveSurgery,
      deleteSurgery,
      completeOnboarding,
    }),
    [
      profile,
      injuries,
      surgeries,
      loading,
      refreshProfile,
      updateProfile,
      saveInjury,
      markInjuryHealed,
      reactivateInjury,
      saveSurgery,
      deleteSurgery,
      completeOnboarding,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
