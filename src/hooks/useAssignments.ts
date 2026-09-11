import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export interface Assignment {
  id: string;
  handler_id: string;
  mission_snapshot: {
    id: string;
    name: string;
    code_name: string;
    description?: string;
    focus_areas?: string[];
    estimated_minutes?: number;
    difficulty?: number;
    intro_lore?: string;
    outro_lore?: string;
    mission_exercises?: Array<{
      exercise_id: string;
      target_sets: number;
      target_reps: number;
      rest_between_sets_sec: number;
      exercises: {
        id: string;
        name: string;
        primary_muscle_group: string;
        equipment: string[];
        instructions_setup?: string;
        instructions_execution?: string;
        instructions_tips?: string;
      };
    }>;
  };
  assignee_type: 'USER' | 'SQUAD';
  assignee_id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  assigned_at: string;
  due_at: string | null;
  handler_name?: string;
  squad_name?: string;
}

// Get user's active assignments (incoming orders)
export function useMyAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_assignments', { _user_id: user.id });
      
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: !!user,
  });
}

// Handler's sent assignments
export function useHandlerAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['handler-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('mission_assignments')
        .select('*')
        .eq('handler_id', user.id)
        .order('assigned_at', { ascending: false });
      
      if (assignmentsError) throw assignmentsError;
      if (!assignmentsData) return [];

      // Enrich with squad/profile data based on assignee_type
      const enrichedAssignments = await Promise.all(
        assignmentsData.map(async (assignment) => {
          if (assignment.assignee_type === 'SQUAD') {
            const { data: squadData } = await supabase
              .from('squads')
              .select('name, code_name')
              .eq('id', assignment.assignee_id)
              .maybeSingle();
            return { ...assignment, squads: squadData, profiles: null };
          } else {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', assignment.assignee_id)
              .maybeSingle();
            return { ...assignment, profiles: profileData, squads: null };
          }
        })
      );

      return enrichedAssignments;
    },
    enabled: !!user,
  });
}

// Create assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (assignmentData: {
      missionSnapshot: object;
      assigneeType: 'USER' | 'SQUAD';
      assigneeId: string;
      dueAt?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('mission_assignments')
        .insert([{
          handler_id: user.id,
          mission_snapshot: assignmentData.missionSnapshot as unknown as import('@/integrations/supabase/types').Json,
          assignee_type: assignmentData.assigneeType,
          assignee_id: assignmentData.assigneeId,
          due_at: assignmentData.dueAt,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handler-assignments'] });
    },
  });
}

// Update assignment status (for athletes)
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      status, 
      sessionId 
    }: { 
      assignmentId: string; 
      status: 'IN_PROGRESS' | 'COMPLETED'; 
      sessionId?: string;
    }) => {
      const updateData: Partial<Tables<'mission_assignments'>> = { status };
      
      if (status === 'IN_PROGRESS') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString();
        if (sessionId) {
          updateData.completed_session_id = sessionId;
        }
      }
      
      const { error } = await supabase
        .from('mission_assignments')
        .update(updateData as any)
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['handler-assignments'] });
    },
  });
}

// Update assignment mission snapshot (for handlers only)
export function useUpdateAssignmentSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      missionSnapshot 
    }: { 
      assignmentId: string; 
      missionSnapshot: object;
    }) => {
      const { error } = await supabase
        .from('mission_assignments')
        .update({ mission_snapshot: missionSnapshot as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handler-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
    },
  });
}

// Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('mission_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handler-assignments'] });
    },
  });
}
