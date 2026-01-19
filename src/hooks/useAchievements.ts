import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { trackAchievementUnlocked } from '@/lib/analytics';

export interface Achievement {
  id: string;
  codeName: string;
  name: string;
  description: string | null;
  category: string;
  triggerType: string;
  triggerValue: number;
  icon: string | null;
  rarity: string;
  xpReward: number;
  isHidden: boolean;
  hint: string | null;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  notified: boolean;
  achievement: Achievement;
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(a => ({
        id: a.id,
        codeName: a.code_name,
        name: a.name,
        description: a.description,
        category: a.category,
        triggerType: a.trigger_type,
        triggerValue: Number(a.trigger_value),
        icon: a.icon,
        rarity: a.rarity,
        xpReward: a.xp_reward,
        isHidden: a.is_hidden,
        hint: a.hint,
      })) as Achievement[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - achievements definition rarely changes
    gcTime: 30 * 60 * 1000,
  });
}

export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(ua => ({
        id: ua.id,
        achievementId: ua.achievement_id,
        unlockedAt: ua.unlocked_at,
        notified: ua.notified,
        achievement: {
          id: ua.achievements.id,
          codeName: ua.achievements.code_name,
          name: ua.achievements.name,
          description: ua.achievements.description,
          category: ua.achievements.category,
          triggerType: ua.achievements.trigger_type,
          triggerValue: Number(ua.achievements.trigger_value),
          icon: ua.achievements.icon,
          rarity: ua.achievements.rarity,
          xpReward: ua.achievements.xp_reward,
          isHidden: ua.achievements.is_hidden,
          hint: ua.achievements.hint,
        },
      })) as UserAchievement[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

export function useUnnotifiedAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unnotified-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user.id)
        .eq('notified', false);
      
      if (error) throw error;
      
      return data.map(ua => ({
        id: ua.id,
        achievementId: ua.achievement_id,
        unlockedAt: ua.unlocked_at,
        notified: ua.notified,
        achievement: {
          id: ua.achievements.id,
          codeName: ua.achievements.code_name,
          name: ua.achievements.name,
          description: ua.achievements.description,
          category: ua.achievements.category,
          triggerType: ua.achievements.trigger_type,
          triggerValue: Number(ua.achievements.trigger_value),
          icon: ua.achievements.icon,
          rarity: ua.achievements.rarity,
          xpReward: ua.achievements.xp_reward,
          isHidden: ua.achievements.is_hidden,
          hint: ua.achievements.hint,
        },
      })) as UserAchievement[];
    },
    enabled: !!user,
  });
}

export function useMarkAchievementNotified() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userAchievementId: string) => {
      const { error } = await supabase
        .from('user_achievements')
        .update({ notified: true })
        .eq('id', userAchievementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['unnotified-achievements'] });
    },
  });
}

export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        })
        .select()
        .single();
      
      if (error) {
        // Ignore duplicate errors
        if (error.code === '23505') return null;
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['unnotified-achievements'] });
    },
  });
}

// Check and unlock achievements based on current stats
export function useCheckAchievements() {
  const { user } = useAuth();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const unlockAchievement = useUnlockAchievement();

  const checkAndUnlock = async (stats: {
    setsCompleted?: number;
    weightLifted?: number;
    prsSet?: number;
    missionsCompleted?: number;
    comboReached?: number;
    workoutHour?: number;
  }) => {
    if (!user || !achievements) return [];

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievementId) || []);
    const newUnlocks: Achievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      const value = achievement.triggerValue;

      switch (achievement.triggerType) {
        case 'sets_completed':
          shouldUnlock = (stats.setsCompleted || 0) >= value;
          break;
        case 'weight_lifted':
          shouldUnlock = (stats.weightLifted || 0) >= value;
          break;
        case 'prs_set':
          shouldUnlock = (stats.prsSet || 0) >= value;
          break;
        case 'missions_completed':
          shouldUnlock = (stats.missionsCompleted || 0) >= value;
          break;
        case 'combo_reached':
          shouldUnlock = (stats.comboReached || 0) >= value;
          break;
        case 'workout_hour':
          shouldUnlock = stats.workoutHour === value;
          break;
      }

      if (shouldUnlock) {
        try {
          await unlockAchievement.mutateAsync(achievement.id);
          newUnlocks.push(achievement);
        } catch (e) {
          console.error('Failed to unlock achievement:', e);
        }
      }
    }

    return newUnlocks;
  };

  return { checkAndUnlock };
}

// Rarity colors
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'text-muted-foreground';
    case 'uncommon': return 'text-success';
    case 'rare': return 'text-primary';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-warning';
    default: return 'text-muted-foreground';
  }
}

export function getRarityBorderColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'border-border';
    case 'uncommon': return 'border-success/50';
    case 'rare': return 'border-primary/50';
    case 'epic': return 'border-purple-400/50';
    case 'legendary': return 'border-warning/50';
    default: return 'border-border';
  }
}

export function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'shadow-[0_0_20px_hsl(var(--warning)/0.4)]';
    case 'epic': return 'shadow-[0_0_15px_rgba(168,85,247,0.4)]';
    case 'rare': return 'shadow-[0_0_10px_hsl(var(--primary)/0.3)]';
    default: return '';
  }
}
