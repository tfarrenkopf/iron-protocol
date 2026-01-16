import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Milestone {
  id: string;
  name: string;
  codeName: string;
  description: string | null;
  category: string;
  targetValue: number;
  icon: string | null;
  tier: number;
  sortOrder: number;
}

export interface UserMilestone {
  id: string;
  milestoneId: string;
  currentValue: number;
  completedAt: string | null;
  notified: boolean;
  milestone: Milestone;
}

export function useMilestones() {
  return useQuery({
    queryKey: ['milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(m => ({
        id: m.id,
        name: m.name,
        codeName: m.code_name,
        description: m.description,
        category: m.category,
        targetValue: m.target_value,
        icon: m.icon,
        tier: m.tier,
        sortOrder: m.sort_order,
      })) as Milestone[];
    },
  });
}

export function useUserMilestones() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-milestones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_milestones')
        .select(`
          *,
          milestones (*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(um => ({
        id: um.id,
        milestoneId: um.milestone_id,
        currentValue: um.current_value,
        completedAt: um.completed_at,
        notified: um.notified,
        milestone: {
          id: um.milestones.id,
          name: um.milestones.name,
          codeName: um.milestones.code_name,
          description: um.milestones.description,
          category: um.milestones.category,
          targetValue: um.milestones.target_value,
          icon: um.milestones.icon,
          tier: um.milestones.tier,
          sortOrder: um.milestones.sort_order,
        },
      })) as UserMilestone[];
    },
    enabled: !!user,
  });
}

// Get newly completed milestones that haven't been notified
export function useUnnotifiedMilestones() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unnotified-milestones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_milestones')
        .select(`
          *,
          milestones (*)
        `)
        .eq('user_id', user.id)
        .eq('notified', false)
        .not('completed_at', 'is', null);
      
      if (error) throw error;
      
      return data.map(um => ({
        id: um.id,
        milestoneId: um.milestone_id,
        currentValue: um.current_value,
        completedAt: um.completed_at,
        notified: um.notified,
        milestone: {
          id: um.milestones.id,
          name: um.milestones.name,
          codeName: um.milestones.code_name,
          description: um.milestones.description,
          category: um.milestones.category,
          targetValue: um.milestones.target_value,
          icon: um.milestones.icon,
          tier: um.milestones.tier,
          sortOrder: um.milestones.sort_order,
        },
      })) as UserMilestone[];
    },
    enabled: !!user,
  });
}

export function useMarkMilestoneNotified() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userMilestoneId: string) => {
      const { error } = await supabase
        .from('user_milestones')
        .update({ notified: true })
        .eq('id', userMilestoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['unnotified-milestones'] });
    },
  });
}

// Calculate progress percentage
export function getMilestoneProgress(currentValue: number, targetValue: number): number {
  return Math.min(100, (currentValue / targetValue) * 100);
}

// Get tier label
export function getTierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'Bronze';
    case 2: return 'Silver';
    case 3: return 'Gold';
    case 4: return 'Platinum';
    case 5: return 'Diamond';
    default: return 'Unknown';
  }
}

// Get tier color class
export function getTierColor(tier: number): string {
  switch (tier) {
    case 1: return 'text-amber-600';
    case 2: return 'text-slate-400';
    case 3: return 'text-yellow-400';
    case 4: return 'text-cyan-400';
    case 5: return 'text-purple-400';
    default: return 'text-muted-foreground';
  }
}
