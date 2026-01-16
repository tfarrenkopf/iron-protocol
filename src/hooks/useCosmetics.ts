import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Cosmetic {
  id: string;
  codeName: string;
  name: string;
  description: string | null;
  type: string;
  value: string;
  rarity: string;
  unlockAchievementId: string | null;
  unlockMilestoneId: string | null;
}

export interface UserCosmetic {
  id: string;
  cosmeticId: string;
  unlockedAt: string;
  isEquipped: boolean;
  cosmetic: Cosmetic;
}

export function useCosmetics() {
  return useQuery({
    queryKey: ['cosmetics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmetics')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(c => ({
        id: c.id,
        codeName: c.code_name,
        name: c.name,
        description: c.description,
        type: c.type,
        value: c.value,
        rarity: c.rarity,
        unlockAchievementId: c.unlock_achievement_id,
        unlockMilestoneId: c.unlock_milestone_id,
      })) as Cosmetic[];
    },
  });
}

export function useUserCosmetics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-cosmetics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_cosmetics')
        .select(`
          *,
          cosmetics (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data.map(uc => ({
        id: uc.id,
        cosmeticId: uc.cosmetic_id,
        unlockedAt: uc.unlocked_at,
        isEquipped: uc.is_equipped,
        cosmetic: {
          id: uc.cosmetics.id,
          codeName: uc.cosmetics.code_name,
          name: uc.cosmetics.name,
          description: uc.cosmetics.description,
          type: uc.cosmetics.type,
          value: uc.cosmetics.value,
          rarity: uc.cosmetics.rarity,
          unlockAchievementId: uc.cosmetics.unlock_achievement_id,
          unlockMilestoneId: uc.cosmetics.unlock_milestone_id,
        },
      })) as UserCosmetic[];
    },
    enabled: !!user,
  });
}

export function useUnlockCosmetic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (cosmeticId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_cosmetics')
        .insert({
          user_id: user.id,
          cosmetic_id: cosmeticId,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') return null; // Already unlocked
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cosmetics'] });
    },
  });
}

export function useEquipCosmetic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ cosmeticId, type }: { cosmeticId: string; type: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Update profile with equipped cosmetic
      const updateField = type === 'title' ? 'equipped_title_id' : 'equipped_icon_id';
      
      const { error } = await supabase
        .from('profiles')
        .update({ [updateField]: cosmeticId })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-cosmetics'] });
    },
  });
}

export function useUnequipCosmetic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (type: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const updateField = type === 'title' ? 'equipped_title_id' : 'equipped_icon_id';
      
      const { error } = await supabase
        .from('profiles')
        .update({ [updateField]: null })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-cosmetics'] });
    },
  });
}

// Check if cosmetics should be unlocked based on achievements
export function useCheckCosmeticUnlocks() {
  const { data: cosmetics } = useCosmetics();
  const { data: userCosmetics } = useUserCosmetics();
  const unlockCosmetic = useUnlockCosmetic();

  const checkAndUnlock = async (unlockedAchievementIds: string[], completedMilestoneIds: string[]) => {
    if (!cosmetics) return;
    
    const ownedIds = new Set(userCosmetics?.map(uc => uc.cosmeticId) || []);
    
    for (const cosmetic of cosmetics) {
      if (ownedIds.has(cosmetic.id)) continue;
      
      const shouldUnlock = 
        (cosmetic.unlockAchievementId && unlockedAchievementIds.includes(cosmetic.unlockAchievementId)) ||
        (cosmetic.unlockMilestoneId && completedMilestoneIds.includes(cosmetic.unlockMilestoneId));
      
      if (shouldUnlock) {
        try {
          await unlockCosmetic.mutateAsync(cosmetic.id);
        } catch (e) {
          console.error('Failed to unlock cosmetic:', e);
        }
      }
    }
  };

  return { checkAndUnlock };
}
