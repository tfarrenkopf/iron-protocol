import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Mission = Tables<'missions'>;
export type MissionExercise = Tables<'mission_exercises'>;

export interface MissionWithExercises extends Mission {
  mission_exercises: (MissionExercise & {
    exercises: Tables<'exercises'>;
  })[];
}

export function useMissions(filters?: {
  muscleGroup?: string;
  focusArea?: string;
  showOnlyPublic?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['missions', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('missions')
        .select(`
          *,
          mission_exercises (
            *,
            exercises (*)
          )
        `)
        .order('popularity_score', { ascending: false });

      if (filters?.showOnlyPublic) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Sort mission_exercises by order_index
      const sortedData = (data as MissionWithExercises[]).map(mission => ({
        ...mission,
        mission_exercises: mission.mission_exercises?.sort((a, b) => a.order_index - b.order_index) || []
      }));

      // Apply filters
      let filtered = sortedData;
      
      if (filters?.focusArea) {
        filtered = filtered.filter(m => 
          m.focus_areas?.includes(filters.focusArea!)
        );
      }
      
      if (filters?.muscleGroup) {
        filtered = filtered.filter(m =>
          m.mission_exercises?.some(me => 
            me.exercises?.primary_muscle_group?.toLowerCase().includes(filters.muscleGroup!.toLowerCase())
          )
        );
      }

      return filtered;
    },
  });
}

export function useMission(missionId: string | undefined) {
  return useQuery({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      if (!missionId) return null;

      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          mission_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('id', missionId)
        .single();
      
      if (error) throw error;
      
      // Sort mission_exercises by order_index
      const sortedData = {
        ...data,
        mission_exercises: data.mission_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      };
      
      return sortedData as MissionWithExercises;
    },
    enabled: !!missionId,
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (mission: {
      name: string;
      code_name: string;
      description?: string;
      focus_areas?: string[];
      difficulty?: number;
      estimated_minutes?: number;
      exercises: {
        exercise_id: string;
        target_sets: number;
        target_reps: number;
        rest_between_sets_sec: number;
      }[];
    }) => {
      if (!user) throw new Error('Must be logged in to create missions');
      
      // Create mission
      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .insert({
          name: mission.name,
          code_name: mission.code_name,
          description: mission.description,
          focus_areas: mission.focus_areas,
          difficulty: mission.difficulty || 3,
          estimated_minutes: mission.estimated_minutes || 30,
          created_by: user.id,
          is_public: false,
        })
        .select()
        .single();
      
      if (missionError) throw missionError;

      // Create mission exercises
      const missionExercises = mission.exercises.map((e, index) => ({
        mission_id: missionData.id,
        exercise_id: e.exercise_id,
        order_index: index,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        rest_between_sets_sec: e.rest_between_sets_sec,
      }));

      const { error: exercisesError } = await supabase
        .from('mission_exercises')
        .insert(missionExercises);
      
      if (exercisesError) throw exercisesError;

      return missionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (mission: {
      id: string;
      name: string;
      code_name: string;
      description?: string;
      focus_areas?: string[];
      estimated_minutes?: number;
      exercises: {
        exercise_id: string;
        target_sets: number;
        target_reps: number;
        rest_between_sets_sec: number;
      }[];
    }) => {
      if (!user) throw new Error('Must be logged in to update missions');
      
      // Update mission
      const { error: missionError } = await supabase
        .from('missions')
        .update({
          name: mission.name,
          code_name: mission.code_name,
          description: mission.description,
          focus_areas: mission.focus_areas,
          estimated_minutes: mission.estimated_minutes || 30,
        })
        .eq('id', mission.id)
        .eq('created_by', user.id);
      
      if (missionError) throw missionError;

      // Delete existing mission exercises
      const { error: deleteError } = await supabase
        .from('mission_exercises')
        .delete()
        .eq('mission_id', mission.id);
      
      if (deleteError) throw deleteError;

      // Create new mission exercises
      const missionExercises = mission.exercises.map((e, index) => ({
        mission_id: mission.id,
        exercise_id: e.exercise_id,
        order_index: index,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        rest_between_sets_sec: e.rest_between_sets_sec,
      }));

      const { error: exercisesError } = await supabase
        .from('mission_exercises')
        .insert(missionExercises);
      
      if (exercisesError) throw exercisesError;

      return mission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
