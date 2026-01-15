import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Exercise = Tables<'exercises'>;

export function useExercises() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercises', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function usePublicMissionExercises() {
  return useQuery({
    queryKey: ['exercises', 'public-mission-allowed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_public', true)
        .eq('is_public_mission_allowed', true)
        .order('name');
      
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (exercise: {
      name: string;
      description?: string;
      equipment?: string[];
      primary_muscle_group: string;
      secondary_muscle_groups?: string[];
      focus_areas?: string[];
      instructions_setup?: string;
      instructions_execution?: string;
      instructions_tips?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to create exercises');
      
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          ...exercise,
          equipment: (exercise.equipment || []) as any,
          created_by: user.id,
          is_public: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
