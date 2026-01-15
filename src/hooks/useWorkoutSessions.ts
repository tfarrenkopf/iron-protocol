import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useCompletedSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['completed-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          completed_at,
          score_earned,
          xp_earned,
          sets_completed,
          total_reps,
          total_weight,
          max_combo,
          mission_id,
          mission_snapshot,
          missions (
            name,
            code_name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateWorkoutSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionData: {
      missionId: string;
      missionSnapshot: {
        name: string;
        code_name: string;
      };
      scoreEarned: number;
      xpEarned: number;
      setsCompleted: number;
      totalReps: number;
      totalWeight: number;
      maxCombo: number;
      damageDealt: number;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          mission_id: sessionData.missionId,
          mission_snapshot: sessionData.missionSnapshot,
          score_earned: sessionData.scoreEarned,
          xp_earned: sessionData.xpEarned,
          sets_completed: sessionData.setsCompleted,
          total_reps: sessionData.totalReps,
          total_weight: sessionData.totalWeight,
          max_combo: sessionData.maxCombo,
          damage_dealt: sessionData.damageDealt,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      // Get session data first to subtract from profile
      const { data: session, error: fetchError } = await supabase
        .from('workout_sessions')
        .select('score_earned, xp_earned, sets_completed, total_reps, total_weight, max_combo')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      if (!session) throw new Error('Session not found');
      
      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_score, total_xp, total_sets, total_reps, total_weight')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Update profile by subtracting session values
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_score: Math.max(0, profile.total_score - session.score_earned),
          total_xp: Math.max(0, profile.total_xp - session.xp_earned),
          total_sets: Math.max(0, profile.total_sets - session.sets_completed),
          total_reps: Math.max(0, profile.total_reps - session.total_reps),
          total_weight: Math.max(0, profile.total_weight - Number(session.total_weight)),
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Delete the session
      const { error: deleteError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
