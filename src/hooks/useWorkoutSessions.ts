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

interface SetData {
  exerciseId: string;
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  unit: string;
  scoreEarned: number;
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
      sets?: SetData[];
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Create the session first
      const { data: session, error } = await supabase
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
      
      // Now save individual sets if provided
      if (sessionData.sets && sessionData.sets.length > 0) {
        const setsToInsert = sessionData.sets.map(set => ({
          session_id: session.id,
          exercise_id: set.exerciseId,
          set_number: set.setNumber,
          target_reps: set.targetReps,
          actual_reps: set.actualReps,
          weight: set.weight,
          unit: set.unit,
          score_earned: set.scoreEarned,
        }));
        
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);
        
        if (setsError) {
          console.error('Failed to save workout sets:', setsError);
          // Non-blocking - session is already saved
        }
      }
      
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['muscle-group-stats'] });
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
