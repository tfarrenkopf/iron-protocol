import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useIsHandler() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-handler', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'handler')
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useToggleHandlerMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (enableHandler: boolean) => {
      if (!user) throw new Error('Must be logged in');
      
      if (enableHandler) {
        // Add handler role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'handler' });
        
        if (error) throw error;
      } else {
        // Remove handler role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', 'handler');
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-handler'] });
    },
  });
}

// Squads CRUD
export function useSquads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['squads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('squads')
        .select(`
          *,
          squad_members (
            id,
            user_id,
            share_stats,
            joined_at,
            profiles (
              display_name
            )
          )
        `)
        .eq('handler_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateSquad() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (squadData: { name: string; code_name: string; description?: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('squads')
        .insert({
          handler_id: user.id,
          name: squadData.name,
          code_name: squadData.code_name,
          description: squadData.description,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

export function useUpdateSquad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      squadId, 
      data 
    }: { 
      squadId: string; 
      data: { name?: string; code_name?: string; description?: string } 
    }) => {
      const { error } = await supabase
        .from('squads')
        .update(data)
        .eq('id', squadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

export function useDeleteSquad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (squadId: string) => {
      const { error } = await supabase
        .from('squads')
        .delete()
        .eq('id', squadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
  });
}

// Squad by invite code (for joining)
export function useSquadByInviteCode(inviteCode: string) {
  return useQuery({
    queryKey: ['squad-invite', inviteCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squads')
        .select(`
          id,
          name,
          code_name,
          description,
          handler_id,
          profiles:handler_id (
            display_name
          )
        `)
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!inviteCode && inviteCode.length === 12,
  });
}

export function useJoinSquad() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (squadId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squadId,
          user_id: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-squads'] });
    },
  });
}

export function useLeaveSquad() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (squadId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-squads'] });
    },
  });
}

// User's squad memberships (as an athlete)
export function useMySquads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-squads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('squad_members')
        .select(`
          id,
          share_stats,
          joined_at,
          squads (
            id,
            name,
            code_name,
            description,
            handler_id,
            profiles:handler_id (
              display_name
            )
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateMemberStats() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ squadId, shareStats }: { squadId: string; shareStats: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('squad_members')
        .update({ share_stats: shareStats })
        .eq('squad_id', squadId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-squads'] });
    },
  });
}
