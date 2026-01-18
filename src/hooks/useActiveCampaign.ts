import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useActiveCampaign() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activeCampaignId, isLoading } = useQuery({
    queryKey: ['active-campaign', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('active_campaign_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.active_campaign_id as string | null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  const setActiveCampaign = useMutation({
    mutationFn: async (campaignId: string | null) => {
      if (!user) throw new Error('Must be logged in');

      // When activating a campaign, start a fresh "run" so previous completions don't count.
      if (campaignId) {
        const nowIso = new Date().toISOString();

        // Check if a progress row exists
        const { data: existingProgress, error: existingError } = await supabase
          .from('user_campaign_progress')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existingProgress?.id) {
          const { error: resetError } = await supabase
            .from('user_campaign_progress')
            .update({
              missions_completed_count: 0,
              completed_at: null,
              current_run_started_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', existingProgress.id);

          if (resetError) throw resetError;
        } else {
          // Create a progress row for this campaign so we can track the run window
          const { count, error: countError } = await supabase
            .from('collection_missions')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', campaignId);

          if (countError) throw countError;

          const { error: insertError } = await supabase
            .from('user_campaign_progress')
            .insert({
              user_id: user.id,
              campaign_id: campaignId,
              missions_completed_count: 0,
              total_missions_count: count || 0,
              completed_at: null,
              current_run_started_at: nowIso,
              updated_at: nowIso,
            });

          if (insertError) throw insertError;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ active_campaign_id: campaignId })
        .eq('id', user.id);

      if (error) throw error;
      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['active-campaign', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaign-progress', campaignId] });
        queryClient.invalidateQueries({ queryKey: ['campaign-completed-missions', campaignId] });
        queryClient.invalidateQueries({ queryKey: ['active-campaign-details'] });
        queryClient.invalidateQueries({ queryKey: ['active-campaign-progress'] });
        queryClient.invalidateQueries({ queryKey: ['active-campaign-completed-missions'] });
      }
    },
  });

  // Forfeit: clear active campaign AND reset progress (soft reset)
  const forfeitCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!user) throw new Error('Must be logged in');

      // 1. Reset the campaign progress (missions_completed_count to 0)
      const { error: progressError } = await supabase
        .from('user_campaign_progress')
        .update({ 
          missions_completed_count: 0,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // 2. Clear the active campaign
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_campaign_id: null })
        .eq('id', user.id);

      if (profileError) throw profileError;

      return campaignId;
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['active-campaign', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-progress', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-progress-all'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['active-campaign-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-campaign-progress'] });
      queryClient.invalidateQueries({ queryKey: ['active-campaign-completed-missions'] });
    },
  });

  return {
    activeCampaignId,
    isLoading,
    setActiveCampaign: setActiveCampaign.mutate,
    forfeitCampaign: forfeitCampaign.mutate,
    isSettingActive: setActiveCampaign.isPending,
    isForfeiting: forfeitCampaign.isPending,
  };
}

// Hook to get full active campaign details with progress
export function useActiveCampaignDetails() {
  const { user } = useAuth();
  const { activeCampaignId, isLoading: isLoadingId } = useActiveCampaign();

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['active-campaign-details', activeCampaignId],
    queryFn: async () => {
      if (!activeCampaignId) return null;

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_missions (
            id,
            mission_id,
            order_index,
            missions (
              id,
              name,
              code_name,
              estimated_minutes,
              difficulty
            )
          )
        `)
        .eq('id', activeCampaignId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!activeCampaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes - campaign definition doesn't change often
    gcTime: 10 * 60 * 1000,
  });

  // Get progress for active campaign
  const { data: progress } = useQuery({
    queryKey: ['active-campaign-progress', activeCampaignId, user?.id],
    queryFn: async () => {
      if (!activeCampaignId || !user) return null;

      const { data, error } = await supabase
        .from('user_campaign_progress')
        .select('*')
        .eq('campaign_id', activeCampaignId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeCampaignId && !!user,
  });

  // Get completed mission IDs for this campaign (only for the CURRENT run)
  const { data: completedMissionIds } = useQuery({
    queryKey: ['active-campaign-completed-missions', activeCampaignId, user?.id, progress?.current_run_started_at],
    queryFn: async () => {
      if (!activeCampaignId || !user || !campaign) return new Set<string>();

      const runStartedAt = (progress as any)?.current_run_started_at;
      if (!runStartedAt) return new Set<string>();

      const missionIds = campaign.collection_missions?.map((cm: any) => cm.mission_id) || [];
      if (missionIds.length === 0) return new Set<string>();

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('mission_id')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .gte('started_at', runStartedAt)
        .in('mission_id', missionIds);

      if (error) throw error;
      return new Set(data?.map(s => s.mission_id) || []);
    },
    enabled: !!activeCampaignId && !!user && !!campaign && !!(progress as any)?.current_run_started_at,
  });

  return {
    campaign,
    progress,
    completedMissionIds: completedMissionIds || new Set<string>(),
    isLoading: isLoadingId || isLoadingCampaign,
  };
}
