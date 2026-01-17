import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CampaignProgress {
  id: string;
  user_id: string;
  campaign_id: string;
  missions_completed_count: number;
  total_missions_count: number;
  completed_at: string | null;
  best_completion_time_seconds: number | null;
  total_completions: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignCompletion {
  id: string;
  user_id: string;
  campaign_id: string;
  completion_time_seconds: number;
  completed_at: string;
  is_personal_record: boolean;
  missions_completed: number;
  total_score: number;
  total_weight: number;
  created_at: string;
}

// Fetch progress for a specific campaign
export function useCampaignProgress(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-progress', campaignId, user?.id],
    queryFn: async () => {
      if (!campaignId || !user) return null;

      const { data, error } = await supabase
        .from('user_campaign_progress')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CampaignProgress | null;
    },
    enabled: !!campaignId && !!user,
  });
}

// Fetch all campaign progress for current user
export function useAllCampaignProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-progress-all', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_campaign_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as CampaignProgress[];
    },
    enabled: !!user,
  });
}

// Fetch completion history for a campaign
export function useCampaignCompletions(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-completions', campaignId, user?.id],
    queryFn: async () => {
      if (!campaignId || !user) return [];

      const { data, error } = await supabase
        .from('campaign_completions')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as CampaignCompletion[];
    },
    enabled: !!campaignId && !!user,
  });
}

// Update campaign progress after completing a mission
export function useUpdateCampaignProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      campaignId,
      missionId,
      sessionData,
    }: {
      campaignId: string;
      missionId: string;
      sessionData: {
        score: number;
        weight: number;
        duration_seconds: number;
      };
    }) => {
      if (!user) throw new Error('Must be logged in');

      // 1. Get campaign missions count
      const { data: campaignMissions, error: missionsError } = await supabase
        .from('collection_missions')
        .select('mission_id')
        .eq('collection_id', campaignId);

      if (missionsError) throw missionsError;

      const totalMissions = campaignMissions?.length || 0;

      // 2. Get user's completed missions for this campaign
      const missionIds = campaignMissions?.map(cm => cm.mission_id) || [];
      
      const { data: completedSessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('mission_id')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .in('mission_id', missionIds);

      if (sessionsError) throw sessionsError;

      // Count unique completed missions (including the one just completed)
      const completedMissionIds = new Set(completedSessions?.map(s => s.mission_id) || []);
      completedMissionIds.add(missionId);
      const completedCount = completedMissionIds.size;

      // 3. Check if campaign is now complete
      const isComplete = completedCount >= totalMissions && totalMissions > 0;

      // 4. Get or create progress record
      const { data: existingProgress } = await supabase
        .from('user_campaign_progress')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProgress) {
        // Update existing progress
        const updates: any = {
          missions_completed_count: completedCount,
          total_missions_count: totalMissions,
          updated_at: new Date().toISOString(),
        };

        // If just completed the campaign
        if (isComplete && !existingProgress.completed_at) {
          updates.completed_at = new Date().toISOString();
          updates.total_completions = (existingProgress.total_completions || 0) + 1;

          // Check for PR
          const currentBest = existingProgress.best_completion_time_seconds;
          if (!currentBest || sessionData.duration_seconds < currentBest) {
            updates.best_completion_time_seconds = sessionData.duration_seconds;
          }
        } else if (isComplete) {
          // Replay completion
          updates.total_completions = (existingProgress.total_completions || 0) + 1;
          
          const currentBest = existingProgress.best_completion_time_seconds;
          if (!currentBest || sessionData.duration_seconds < currentBest) {
            updates.best_completion_time_seconds = sessionData.duration_seconds;
          }
        }

        const { error: updateError } = await supabase
          .from('user_campaign_progress')
          .update(updates)
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;

        // Record completion if campaign complete
        if (isComplete) {
          const isPR = !existingProgress.best_completion_time_seconds || 
            sessionData.duration_seconds < existingProgress.best_completion_time_seconds;

          await supabase
            .from('campaign_completions')
            .insert({
              user_id: user.id,
              campaign_id: campaignId,
              completion_time_seconds: sessionData.duration_seconds,
              is_personal_record: isPR,
              missions_completed: completedCount,
              total_score: sessionData.score,
              total_weight: sessionData.weight,
            });

          return { isComplete: true, isPR, completedCount, totalMissions };
        }

        return { isComplete: false, isPR: false, completedCount, totalMissions };
      } else {
        // Create new progress record
        const newProgress: any = {
          user_id: user.id,
          campaign_id: campaignId,
          missions_completed_count: completedCount,
          total_missions_count: totalMissions,
        };

        if (isComplete) {
          newProgress.completed_at = new Date().toISOString();
          newProgress.total_completions = 1;
          newProgress.best_completion_time_seconds = sessionData.duration_seconds;
        }

        const { error: insertError } = await supabase
          .from('user_campaign_progress')
          .insert(newProgress);

        if (insertError) throw insertError;

        // Record completion if campaign complete
        if (isComplete) {
          await supabase
            .from('campaign_completions')
            .insert({
              user_id: user.id,
              campaign_id: campaignId,
              completion_time_seconds: sessionData.duration_seconds,
              is_personal_record: true, // First completion is always a PR
              missions_completed: completedCount,
              total_score: sessionData.score,
              total_weight: sessionData.weight,
            });

          return { isComplete: true, isPR: true, completedCount, totalMissions };
        }

        return { isComplete: false, isPR: false, completedCount, totalMissions };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-progress', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-progress-all'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-completions', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['active-campaign-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-campaign-progress'] });
      queryClient.invalidateQueries({ queryKey: ['active-campaign-completed-missions'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.campaignId] });
    },
  });
}

// Get campaign leaderboard
export function useCampaignLeaderboard(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-leaderboard', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      const { data, error } = await supabase
        .from('campaign_completions')
        .select(`
          *,
          profiles:user_id (display_name, rival_code)
        `)
        .eq('campaign_id', campaignId)
        .eq('is_personal_record', true)
        .order('completion_time_seconds', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
}
