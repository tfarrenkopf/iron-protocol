import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricalBoss {
  id: string;
  name: string;
  code_name: string;
  lore: string;
  max_hp: number;
  current_hp: number;
  weaknesses: string[];
  weakness_multiplier: number;
  is_defeated: boolean;
  defeated_at: string | null;
  week_start: string;
  week_end: string;
  total_damage_dealt?: number;
  unique_contributors?: number;
}

export function useBossHistory(limit = 10) {
  return useQuery({
    queryKey: ['boss-history', limit],
    queryFn: async (): Promise<HistoricalBoss[]> => {
      // Fetch past bosses (not currently active) ordered by week_start desc
      const { data: bosses, error } = await supabase
        .from('weekly_bosses')
        .select('*')
        .eq('is_active', false)
        .order('week_start', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      if (!bosses || bosses.length === 0) return [];

      // Fetch damage stats for each boss
      const bossesWithStats = await Promise.all(
        bosses.map(async (boss) => {
          const { data: damageData } = await supabase
            .from('weekly_boss_damage')
            .select('total_damage, user_id')
            .eq('boss_id', boss.id);

          const totalDamage = damageData?.reduce((sum, d) => sum + (d.total_damage || 0), 0) || 0;
          const uniqueContributors = new Set(damageData?.map(d => d.user_id) || []).size;

          return {
            ...boss,
            total_damage_dealt: totalDamage,
            unique_contributors: uniqueContributors,
          } as HistoricalBoss;
        })
      );

      return bossesWithStats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - historical data doesn't change
  });
}

// Synthetic historical boss data for guests
export function getSyntheticBossHistory(): HistoricalBoss[] {
  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  
  return [
    {
      id: 'synth-boss-1',
      name: 'Crimson Berserker',
      code_name: 'crimson_berserker_20260112',
      lore: 'Once a training drone, now corrupted by a viral subroutine.',
      max_hp: 1500000,
      current_hp: 0,
      weaknesses: ['ARMS', 'CHEST'],
      weakness_multiplier: 1.3,
      is_defeated: true,
      defeated_at: new Date(now.getTime() - weekMs * 0.5).toISOString(),
      week_start: new Date(now.getTime() - weekMs).toISOString(),
      week_end: new Date(now.getTime()).toISOString(),
      total_damage_dealt: 1500000,
      unique_contributors: 24,
    },
    {
      id: 'synth-boss-2',
      name: 'Shadow Reaper',
      code_name: 'shadow_reaper_20260105',
      lore: 'An assassin protocol gone rogue. Fast but fragile.',
      max_hp: 1200000,
      current_hp: 180000,
      weaknesses: ['BACK', 'CORE'],
      weakness_multiplier: 1.3,
      is_defeated: false,
      defeated_at: null,
      week_start: new Date(now.getTime() - weekMs * 2).toISOString(),
      week_end: new Date(now.getTime() - weekMs).toISOString(),
      total_damage_dealt: 1020000,
      unique_contributors: 18,
    },
    {
      id: 'synth-boss-3',
      name: 'Iron Goliath',
      code_name: 'iron_goliath_20251229',
      lore: 'A rogue war machine forged from wreckage.',
      max_hp: 1000000,
      current_hp: 0,
      weaknesses: ['LEGS', 'BACK'],
      weakness_multiplier: 1.25,
      is_defeated: true,
      defeated_at: new Date(now.getTime() - weekMs * 2.3).toISOString(),
      week_start: new Date(now.getTime() - weekMs * 3).toISOString(),
      week_end: new Date(now.getTime() - weekMs * 2).toISOString(),
      total_damage_dealt: 1000000,
      unique_contributors: 31,
    },
  ];
}
