import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type WeightHistoryEntry = {
  exerciseId: string;
  exerciseName: string;
  lastWeight: number;
  maxWeight: number;
  unit: string;
  updatedAt: string;
};

export function useWeightHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weight-history', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('user_weight_history')
        .select(`
          *,
          exercises (
            name
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Convert to a map for easy lookup
      const weightMap: Record<string, { lastWeight: number; maxWeight: number; unit: string; exerciseName: string; updatedAt: string }> = {};
      data.forEach(record => {
        weightMap[record.exercise_id] = {
          lastWeight: record.last_weight,
          maxWeight: record.max_weight,
          unit: record.unit,
          exerciseName: record.exercises?.name || 'Unknown Exercise',
          updatedAt: record.updated_at,
        };
      });
      
      return weightMap;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - weight history is session-relevant
    gcTime: 5 * 60 * 1000,
  });
}

export function useUpdateWeight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ exerciseId, weight, unit = 'lb' }: { 
      exerciseId: string; 
      weight: number; 
      unit?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Upsert the weight record
      const { data: existing } = await supabase
        .from('user_weight_history')
        .select('max_weight')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .single();
      
      const maxWeight = existing ? Math.max(existing.max_weight, weight) : weight;
      
      const { error } = await supabase
        .from('user_weight_history')
        .upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          last_weight: weight,
          max_weight: maxWeight,
          unit,
        }, {
          onConflict: 'user_id,exercise_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
    },
  });
}
