import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_leaderboard')
        .select('*')
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });
}

// Function to update profile stats after workout
export function useUpdateProfileStats() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (stats: {
      score: number;
      xp: number;
      sets: number;
      reps: number;
      weight: number;
      maxCombo: number;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update with new stats
      const { error } = await supabase
        .from('profiles')
        .update({
          total_score: profile.total_score + stats.score,
          total_xp: profile.total_xp + stats.xp,
          total_sets: profile.total_sets + stats.sets,
          total_reps: profile.total_reps + stats.reps,
          total_weight: profile.total_weight + stats.weight,
          max_combo: Math.max(profile.max_combo, stats.maxCombo),
        })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
