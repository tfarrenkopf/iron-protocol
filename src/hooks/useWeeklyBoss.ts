import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WeeklyBoss {
  id: string;
  name: string;
  code_name: string;
  lore: string;
  image_url: string | null;
  max_hp: number;
  current_hp: number;
  weaknesses: string[];
  weakness_multiplier: number;
  week_start: string;
  week_end: string;
  is_defeated: boolean;
  defeated_at: string | null;
  total_damage_dealt: number;
  unique_contributors: number;
}

export interface UserBossDamage {
  total_damage: number;
  contribution_count: number;
  weakness_hits_count: number;
}

export interface DamageResult {
  baseDamage: number;
  bonusDamage: number;
  totalDamage: number;
  weaknessHits: string[];
}

// Calculate damage from workout stats
export function calculateBossDamage(
  sets: number,
  reps: number,
  totalWeight: number,
  focusAreas: string[],
  weaknesses: string[],
  weaknessMultiplier: number = 1.25
): DamageResult {
  // Base damage: sets × reps + weight/10
  const baseDamage = Math.floor(sets * reps + totalWeight / 10);
  
  // Check for weakness hits
  const weaknessHits = focusAreas.filter(area => 
    weaknesses.some(w => w.toUpperCase() === area.toUpperCase())
  );
  
  // Bonus damage from weaknesses
  const bonusDamage = weaknessHits.length > 0 
    ? Math.floor(baseDamage * (weaknessMultiplier - 1))
    : 0;
  
  return {
    baseDamage,
    bonusDamage,
    totalDamage: baseDamage + bonusDamage,
    weaknessHits,
  };
}

// Fetch active weekly boss
export function useWeeklyBoss() {
  return useQuery({
    queryKey: ['weekly-boss'],
    queryFn: async (): Promise<WeeklyBoss | null> => {
      const { data, error } = await supabase
        .rpc('get_active_weekly_boss');
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      return data[0] as WeeklyBoss;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time HP updates
  });
}

// Fetch user's damage for current boss
export function useUserBossDamage() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-boss-damage', user?.id],
    queryFn: async (): Promise<UserBossDamage> => {
      if (!user) return { total_damage: 0, contribution_count: 0, weakness_hits_count: 0 };
      
      const { data, error } = await supabase
        .rpc('get_user_boss_damage', { p_user_id: user.id });
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return { total_damage: 0, contribution_count: 0, weakness_hits_count: 0 };
      }
      
      return data[0] as UserBossDamage;
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

// Apply damage to boss
export function useApplyBossDamage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      sessionId,
      baseDamage,
      bonusDamage,
      weaknessHits,
    }: {
      userId: string;
      sessionId: string;
      baseDamage: number;
      bonusDamage: number;
      weaknessHits: string[];
    }) => {
      const { data, error } = await supabase
        .rpc('apply_boss_damage', {
          p_user_id: userId,
          p_session_id: sessionId,
          p_base_damage: baseDamage,
          p_bonus_damage: bonusDamage,
          p_weakness_hits: weaknessHits,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-boss'] });
      queryClient.invalidateQueries({ queryKey: ['user-boss-damage'] });
    },
  });
}

// Synthetic boss data for guests
export function getSyntheticBossData(): WeeklyBoss {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // Simulate community progress (random between 20-80%)
  const progress = 0.2 + Math.random() * 0.6;
  const maxHp = 1000000;
  const currentHp = Math.floor(maxHp * (1 - progress));
  
  return {
    id: 'synthetic-boss',
    name: 'Iron Goliath',
    code_name: 'iron_goliath',
    lore: 'Born from the wreckage of a forgotten facility, the Iron Goliath now stalks the protocol. Its cores pulse with stolen power—only the collective might of all operatives can bring it down.',
    image_url: null,
    max_hp: maxHp,
    current_hp: currentHp,
    weaknesses: ['LEGS', 'BACK'],
    weakness_multiplier: 1.25,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    is_defeated: false,
    defeated_at: null,
    total_damage_dealt: maxHp - currentHp,
    unique_contributors: Math.floor(50 + Math.random() * 150),
  };
}

export function getSyntheticUserDamage(): UserBossDamage {
  return {
    total_damage: Math.floor(500 + Math.random() * 2000),
    contribution_count: Math.floor(3 + Math.random() * 10),
    weakness_hits_count: Math.floor(1 + Math.random() * 5),
  };
}
