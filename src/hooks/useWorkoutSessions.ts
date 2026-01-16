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
      missionSnapshot: Record<string, unknown>;
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
        .insert([{
          user_id: user.id,
          mission_id: sessionData.missionId,
          mission_snapshot: sessionData.missionSnapshot as unknown as import('@/integrations/supabase/types').Json,
          score_earned: sessionData.scoreEarned,
          xp_earned: sessionData.xpEarned,
          sets_completed: sessionData.setsCompleted,
          total_reps: sessionData.totalReps,
          total_weight: sessionData.totalWeight,
          max_combo: sessionData.maxCombo,
          damage_dealt: sessionData.damageDealt,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        }])
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
      
      // Delete the session - database trigger handles profile stat updates atomically
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
