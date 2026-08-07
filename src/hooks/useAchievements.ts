import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Achievement, UserAchievement, UserStats } from '../types/achievements';

export const useAchievements = (userId: string | undefined) => {
  const [catalog, setCatalog] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!userId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch Catalog
      const { data: catData, error: catError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('reward_amount', { ascending: true });

      if (catError) throw catError;
      
      // Fetch User's Unlocked Achievements
      const { data: unData, error: unError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);
        
      if (unError) throw unError;

      // Fetch User Stats (for progress calculation)
      const { data: stData, error: stError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (stError && stError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw stError;
      }

      setCatalog(catData as Achievement[]);
      setUnlocked(unData as UserAchievement[]);
      setStats(stData as UserStats | null || null);
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    catalog,
    unlocked,
    stats,
    loading,
    error,
    refresh: fetchAchievements,
  };
};
