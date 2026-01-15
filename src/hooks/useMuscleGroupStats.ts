import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MuscleGroupStat {
  muscle_group: string;
  total_sets: number;
  total_reps: number;
  total_volume: number;
}

// Mapping muscle groups to body parts for the SVG visualization
export const MUSCLE_BODY_MAP: Record<string, string[]> = {
  'Chest': ['chest'],
  'Back': ['upper-back', 'lower-back', 'lats'],
  'Shoulders': ['shoulders', 'deltoids'],
  'Deltoids': ['shoulders', 'deltoids'],
  'Biceps': ['biceps'],
  'Triceps': ['triceps'],
  'Quadriceps': ['quads'],
  'Hamstrings': ['hamstrings'],
  'Glutes': ['glutes'],
  'Calves': ['calves'],
  'Core': ['core', 'obliques'],
  'Obliques': ['core', 'obliques'],
  'Forearms': ['forearms'],
  'Traps': ['traps'],
  'Lats': ['lats', 'upper-back'],
};

export function useMuscleGroupStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['muscle-group-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch workout sets joined with exercises to get muscle group data
      const { data, error } = await supabase
        .from('workout_sets')
        .select(`
          actual_reps,
          weight,
          session_id,
          exercises (
            primary_muscle_group
          ),
          workout_sessions!inner (
            user_id
          )
        `)
        .eq('workout_sessions.user_id', user.id);
      
      if (error) throw error;
      
      // Aggregate by muscle group
      const muscleStats: Record<string, MuscleGroupStat> = {};
      
      for (const set of data || []) {
        const muscleGroup = set.exercises?.primary_muscle_group;
        if (!muscleGroup) continue;
        
        if (!muscleStats[muscleGroup]) {
          muscleStats[muscleGroup] = {
            muscle_group: muscleGroup,
            total_sets: 0,
            total_reps: 0,
            total_volume: 0,
          };
        }
        
        muscleStats[muscleGroup].total_sets += 1;
        muscleStats[muscleGroup].total_reps += set.actual_reps || 0;
        muscleStats[muscleGroup].total_volume += (set.actual_reps || 0) * Number(set.weight || 0);
      }
      
      // Sort by total sets descending
      return Object.values(muscleStats).sort((a, b) => b.total_sets - a.total_sets);
    },
    enabled: !!user,
  });
}
