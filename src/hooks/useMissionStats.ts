import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MissionStats {
  completionCount: number;
  uniquePlayers: number;
  avgScore: number;
  totalWeightLifted: number;
}

export interface MissionLeaderboardEntry {
  missionId: string;
  userId: string;
  displayName: string;
  scoreEarned: number;
  totalWeight: number;
  maxCombo: number;
  completedAt: string;
  rank: number;
}

export interface UserMissionRank {
  userRank: number | null;
  userBestScore: number | null;
  totalPlayers: number;
}

export function useMissionStats(missionId: string | undefined) {
  return useQuery({
    queryKey: ['mission-stats', missionId],
    queryFn: async (): Promise<MissionStats> => {
      if (!missionId) return { completionCount: 0, uniquePlayers: 0, avgScore: 0, totalWeightLifted: 0 };
      
      const { data, error } = await supabase
        .rpc('get_mission_stats', { p_mission_id: missionId });
      
      if (error) throw error;
      
      const result = data?.[0] || { completion_count: 0, unique_players: 0, avg_score: 0, total_weight_lifted: 0 };
      
      return {
        completionCount: Number(result.completion_count) || 0,
        uniquePlayers: Number(result.unique_players) || 0,
        avgScore: Math.round(Number(result.avg_score) || 0),
        totalWeightLifted: Number(result.total_weight_lifted) || 0,
      };
    },
    enabled: !!missionId,
  });
}

export function useMissionLeaderboard(missionId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['mission-leaderboard', missionId, limit],
    queryFn: async (): Promise<MissionLeaderboardEntry[]> => {
      if (!missionId) return [];
      
      const { data, error } = await supabase
        .from('mission_leaderboard')
        .select('*')
        .eq('mission_id', missionId)
        .lte('rank', limit)
        .order('rank', { ascending: true });
      
      if (error) throw error;
      
      return data.map(entry => ({
        missionId: entry.mission_id,
        userId: entry.user_id,
        displayName: entry.display_name || 'ANONYMOUS',
        scoreEarned: entry.score_earned,
        totalWeight: Number(entry.total_weight),
        maxCombo: entry.max_combo,
        completedAt: entry.completed_at,
        rank: Number(entry.rank),
      }));
    },
    enabled: !!missionId,
  });
}

export function useUserMissionRank(missionId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-mission-rank', missionId, user?.id],
    queryFn: async (): Promise<UserMissionRank | null> => {
      if (!missionId || !user) return null;
      
      const { data, error } = await supabase
        .rpc('get_user_mission_rank', { 
          p_user_id: user.id,
          p_mission_id: missionId 
        });
      
      if (error) throw error;
      
      const result = data?.[0];
      if (!result) return null;
      
      return {
        userRank: result.user_rank ? Number(result.user_rank) : null,
        userBestScore: result.user_best_score ? Number(result.user_best_score) : null,
        totalPlayers: Number(result.total_players) || 0,
      };
    },
    enabled: !!missionId && !!user,
  });
}

// Get popularity tier based on score
export function getPopularityTier(score: number): { label: string; color: string; glow: boolean } | null {
  if (score >= 100) return { label: '🔥 HOT', color: 'text-warning', glow: true };
  if (score >= 50) return { label: '⚡ POPULAR', color: 'text-secondary', glow: false };
  if (score >= 20) return { label: '✨ RISING', color: 'text-primary', glow: false };
  return null;
}

// Format warrior count for display
export function formatWarriorCount(count: number): string {
  if (count === 0) return 'Be the first to conquer this mission';
  if (count === 1) return '1 warrior completed this mission';
  if (count < 100) return `${count} warriors completed this mission`;
  if (count < 1000) return `${count} warriors survived this battle`;
  return `${(count / 1000).toFixed(1)}K warriors have fallen here`;
}
