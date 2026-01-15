import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useWipeAllData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      // Delete all workout sessions for this user
      const { error: sessionsError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('user_id', user.id);
      
      if (sessionsError) throw sessionsError;
      
      // Delete all user-created exercises (private ones only)
      const { error: exercisesError } = await supabase
        .from('exercises')
        .delete()
        .eq('created_by', user.id)
        .eq('is_public', false);
      
      if (exercisesError) throw exercisesError;
      
      // Delete weight history
      const { error: weightError } = await supabase
        .from('user_weight_history')
        .delete()
        .eq('user_id', user.id);
      
      if (weightError) throw weightError;
      
      // Reset profile stats to zero
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_score: 0,
          total_xp: 0,
          total_sets: 0,
          total_reps: 0,
          total_weight: 0,
          max_combo: 0,
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
    },
  });
}
