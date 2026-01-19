import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getWeekStartDateString } from '@/lib/weekUtils';

interface WarReportSnapshot {
  id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_code: string;
  week_start_date: string;
  total_completions: number;
  unique_players_count: number;
  average_completion_time_seconds: number;
  replay_rate: number;
  fastest_completion_seconds: number | null;
  total_weight_lifted: number;
  total_score: number;
}

interface WarReportStats {
  totalCampaignsActive: number;
  totalCompletionsThisWeek: number;
  totalPlayersThisWeek: number;
  totalWeightThisWeek: number;
  mostCompletedCampaigns: WarReportSnapshot[];
  fastestCampaigns: WarReportSnapshot[];
  mostReplayedCampaigns: WarReportSnapshot[];
  highestScoringCampaigns: WarReportSnapshot[];
}

// Generate anonymous player alias for display
export const generateAnonymousAlias = (index: number): string => {
  const prefixes = ['UNIT', 'RUNNER', 'CADET', 'AGENT', 'GHOST', 'PHANTOM', 'WOLF', 'HAWK'];
  const suffixes = ['Δ', 'Ω', 'Σ', 'Ξ', 'Ψ', 'Λ', 'Θ', 'Π'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${prefix}-${suffix}${num.toString().padStart(2, '0')}`;
};

// Format time in MM:SS format
export const formatCompletionTime = (seconds: number | null): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format large numbers with K/M suffix
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Helper to get week start date - now using centralized utility
function getWeekStart(): string {
  return getWeekStartDateString();
}

// Fetch live data from campaign_completions when snapshots are empty
async function fetchLiveWarReport(): Promise<WarReportStats> {
  const weekStart = getWeekStart();
  
  // Fetch campaign completions for this week with collection info
  const { data: completions, error } = await supabase
    .from('campaign_completions')
    .select(`
      id,
      campaign_id,
      user_id,
      completion_time_seconds,
      total_weight,
      total_score,
      completed_at,
      collections!inner(name, code_name)
    `)
    .gte('completed_at', weekStart);

  if (error) throw error;

  // Group by campaign
  const campaignMap = new Map<string, {
    campaign_id: string;
    campaign_name: string;
    campaign_code: string;
    completions: number;
    users: Set<string>;
    times: number[];
    total_weight: number;
    total_score: number;
  }>();

  (completions || []).forEach((c: any) => {
    const existing = campaignMap.get(c.campaign_id);
    if (existing) {
      existing.completions++;
      existing.users.add(c.user_id);
      if (c.completion_time_seconds) existing.times.push(c.completion_time_seconds);
      existing.total_weight += c.total_weight || 0;
      existing.total_score += c.total_score || 0;
    } else {
      campaignMap.set(c.campaign_id, {
        campaign_id: c.campaign_id,
        campaign_name: c.collections?.name || 'Unknown Campaign',
        campaign_code: c.collections?.code_name || 'UNKNOWN',
        completions: 1,
        users: new Set([c.user_id]),
        times: c.completion_time_seconds ? [c.completion_time_seconds] : [],
        total_weight: c.total_weight || 0,
        total_score: c.total_score || 0,
      });
    }
  });

  // Transform to snapshots
  const transformedSnapshots: WarReportSnapshot[] = Array.from(campaignMap.values()).map((c) => {
    const avgTime = c.times.length > 0 
      ? Math.round(c.times.reduce((a, b) => a + b, 0) / c.times.length)
      : 0;
    const fastestTime = c.times.length > 0 ? Math.min(...c.times) : null;
    const replayRate = c.users.size > 0 ? Math.round((c.completions / c.users.size - 1) * 100) : 0;

    return {
      id: c.campaign_id,
      campaign_id: c.campaign_id,
      campaign_name: c.campaign_name,
      campaign_code: c.campaign_code,
      week_start_date: weekStart,
      total_completions: c.completions,
      unique_players_count: c.users.size,
      average_completion_time_seconds: avgTime,
      replay_rate: Math.max(0, replayRate),
      fastest_completion_seconds: fastestTime,
      total_weight_lifted: c.total_weight,
      total_score: c.total_score,
    };
  });

  // Calculate aggregates
  const totalCompletionsThisWeek = transformedSnapshots.reduce((sum, s) => sum + s.total_completions, 0);
  const totalPlayersThisWeek = transformedSnapshots.reduce((sum, s) => sum + s.unique_players_count, 0);
  const totalWeightThisWeek = transformedSnapshots.reduce((sum, s) => sum + s.total_weight_lifted, 0);

  // Sort for different categories
  const mostCompletedCampaigns = [...transformedSnapshots]
    .sort((a, b) => b.total_completions - a.total_completions)
    .slice(0, 5);

  const fastestCampaigns = [...transformedSnapshots]
    .filter(s => s.fastest_completion_seconds)
    .sort((a, b) => (a.fastest_completion_seconds || 999999) - (b.fastest_completion_seconds || 999999))
    .slice(0, 5);

  const mostReplayedCampaigns = [...transformedSnapshots]
    .sort((a, b) => b.replay_rate - a.replay_rate)
    .slice(0, 5);

  const highestScoringCampaigns = [...transformedSnapshots]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 5);

  return {
    totalCampaignsActive: transformedSnapshots.length,
    totalCompletionsThisWeek,
    totalPlayersThisWeek,
    totalWeightThisWeek,
    mostCompletedCampaigns,
    fastestCampaigns,
    mostReplayedCampaigns,
    highestScoringCampaigns,
  };
}

export const useWarReport = () => {
  return useQuery({
    queryKey: ['war-report'],
    queryFn: async (): Promise<WarReportStats> => {
      // First try to fetch from snapshots table
      const { data: snapshots, error } = await supabase
        .from('war_report_campaign_snapshots')
        .select(`
          id,
          campaign_id,
          week_start_date,
          total_completions,
          unique_players_count,
          average_completion_time_seconds,
          replay_rate,
          fastest_completion_seconds,
          total_weight_lifted,
          total_score,
          collections!inner(name, code_name)
        `)
        .gte('week_start_date', getWeekStart())
        .order('total_completions', { ascending: false });

      if (error) throw error;

      // If no snapshots exist, fallback to live data from campaign_completions
      if (!snapshots || snapshots.length === 0) {
        return fetchLiveWarReport();
      }

      // Transform snapshot data
      const transformedSnapshots: WarReportSnapshot[] = (snapshots || []).map((s: any) => ({
        id: s.id,
        campaign_id: s.campaign_id,
        campaign_name: s.collections?.name || 'Unknown Campaign',
        campaign_code: s.collections?.code_name || 'UNKNOWN',
        week_start_date: s.week_start_date,
        total_completions: s.total_completions || 0,
        unique_players_count: s.unique_players_count || 0,
        average_completion_time_seconds: s.average_completion_time_seconds || 0,
        replay_rate: s.replay_rate || 0,
        fastest_completion_seconds: s.fastest_completion_seconds,
        total_weight_lifted: s.total_weight_lifted || 0,
        total_score: s.total_score || 0,
      }));

      // Calculate aggregates
      const totalCompletionsThisWeek = transformedSnapshots.reduce((sum, s) => sum + s.total_completions, 0);
      const totalPlayersThisWeek = transformedSnapshots.reduce((sum, s) => sum + s.unique_players_count, 0);
      const totalWeightThisWeek = transformedSnapshots.reduce((sum, s) => sum + s.total_weight_lifted, 0);

      // Sort for different categories
      const mostCompletedCampaigns = [...transformedSnapshots]
        .sort((a, b) => b.total_completions - a.total_completions)
        .slice(0, 5);

      const fastestCampaigns = [...transformedSnapshots]
        .filter(s => s.fastest_completion_seconds)
        .sort((a, b) => (a.fastest_completion_seconds || 999999) - (b.fastest_completion_seconds || 999999))
        .slice(0, 5);

      const mostReplayedCampaigns = [...transformedSnapshots]
        .sort((a, b) => b.replay_rate - a.replay_rate)
        .slice(0, 5);

      const highestScoringCampaigns = [...transformedSnapshots]
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 5);

      return {
        totalCampaignsActive: transformedSnapshots.length,
        totalCompletionsThisWeek,
        totalPlayersThisWeek,
        totalWeightThisWeek,
        mostCompletedCampaigns,
        fastestCampaigns,
        mostReplayedCampaigns,
        highestScoringCampaigns,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Focus area labels based on behavior
export const getFocusAreaLabel = (snapshot: WarReportSnapshot): string => {
  if (snapshot.replay_rate > 50) return 'GRINDER ZONE';
  if (snapshot.fastest_completion_seconds && snapshot.fastest_completion_seconds < 600) return 'SPEED RUN';
  if (snapshot.total_completions > 20) return 'HIGH TRAFFIC';
  if (snapshot.unique_players_count > 10) return 'POPULAR';
  return 'ACTIVE';
};
