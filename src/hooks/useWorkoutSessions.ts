import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export function useCompletedSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['completed-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          completed_at,
          score_earned,
          xp_earned,
          sets_completed,
          total_reps,
          total_weight,
          max_combo,
          damage_dealt,
          mission_id,
          mission_snapshot,
          missions (
            name,
            code_name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

interface SetData {
  exerciseId: string;
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  unit: string;
  scoreEarned: number;
}

export function useCreateWorkoutSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionData: {
      missionId: string;
      missionSnapshot: Record<string, unknown>;
      scoreEarned: number;
      xpEarned: number;
      setsCompleted: number;
      totalReps: number;
      totalWeight: number;
      maxCombo: number;
      damageDealt: number;
      sets?: SetData[];
      durationSeconds?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Create the session first
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert([{
          user_id: user.id,
          mission_id: sessionData.missionId,
          mission_snapshot: sessionData.missionSnapshot as unknown as import('@/integrations/supabase/types').Json,
          score_earned: sessionData.scoreEarned,
          xp_earned: sessionData.xpEarned,
          sets_completed: sessionData.setsCompleted,
          total_reps: sessionData.totalReps,
          total_weight: sessionData.totalWeight,
          max_combo: sessionData.maxCombo,
          damage_dealt: sessionData.damageDealt,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Now save individual sets if provided
      if (sessionData.sets && sessionData.sets.length > 0) {
        const setsToInsert = sessionData.sets.map(set => ({
          session_id: session.id,
          exercise_id: set.exerciseId,
          set_number: set.setNumber,
          target_reps: set.targetReps,
          actual_reps: set.actualReps,
          weight: set.weight,
          unit: set.unit,
          score_earned: set.scoreEarned,
        }));
        
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);
        
        if (setsError) {
          console.error('Failed to save workout sets:', setsError);
          // Non-blocking - session is already saved
        }
      }

      // Check if this mission is part of any campaigns and update progress
      try {
        const { data: campaignMissions } = await supabase
          .from('collection_missions')
          .select('collection_id')
          .eq('mission_id', sessionData.missionId);

        if (campaignMissions && campaignMissions.length > 0) {
          // Update progress for each campaign this mission belongs to
          for (const cm of campaignMissions) {
            await updateCampaignProgressInternal(
              user.id,
              cm.collection_id,
              sessionData.missionId,
              sessionData.scoreEarned,
              sessionData.totalWeight,
              sessionData.durationSeconds || 0
            );
          }
        }
      } catch (campaignError) {
        console.error('Failed to update campaign progress:', campaignError);
        // Non-blocking - session is already saved
      }
      
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['muscle-group-stats'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-progress'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-progress-all'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-completions'] });
    },
  });
}

// Internal helper function to update campaign progress
async function updateCampaignProgressInternal(
  userId: string,
  campaignId: string,
  missionId: string,
  score: number,
  weight: number,
  durationSeconds: number
) {
  // 1. Get campaign missions count
  const { data: campaignMissions } = await supabase
    .from('collection_missions')
    .select('mission_id')
    .eq('collection_id', campaignId);

  const totalMissions = campaignMissions?.length || 0;
  if (totalMissions === 0) return;

  // 2. Get user's completed missions for this campaign
  const missionIds = campaignMissions?.map(cm => cm.mission_id) || [];
  
  const { data: completedSessions } = await supabase
    .from('workout_sessions')
    .select('mission_id')
    .eq('user_id', userId)
    .eq('status', 'COMPLETED')
    .in('mission_id', missionIds);

  // Count unique completed missions
  const completedMissionIds = new Set(completedSessions?.map(s => s.mission_id) || []);
  completedMissionIds.add(missionId);
  const completedCount = completedMissionIds.size;

  // 3. Check if campaign is now complete
  const isComplete = completedCount >= totalMissions;

  // 4. Get or create progress record
  const { data: existingProgress } = await supabase
    .from('user_campaign_progress')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingProgress) {
    // Update existing progress
    const updates: Record<string, unknown> = {
      missions_completed_count: completedCount,
      total_missions_count: totalMissions,
      updated_at: new Date().toISOString(),
    };

    // If just completed or replaying the campaign
    if (isComplete) {
      const wasAlreadyComplete = !!existingProgress.completed_at;
      
      if (!wasAlreadyComplete) {
        updates.completed_at = new Date().toISOString();
      }
      updates.total_completions = (existingProgress.total_completions || 0) + 1;

      // Check for PR
      const currentBest = existingProgress.best_completion_time_seconds;
      const isPR = !currentBest || (durationSeconds > 0 && durationSeconds < currentBest);
      
      if (isPR && durationSeconds > 0) {
        updates.best_completion_time_seconds = durationSeconds;
      }

      await supabase
        .from('user_campaign_progress')
        .update(updates)
        .eq('id', existingProgress.id);

      // Record completion
      await supabase
        .from('campaign_completions')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          completion_time_seconds: durationSeconds || 0,
          is_personal_record: isPR,
          missions_completed: completedCount,
          total_score: score,
          total_weight: weight,
        });
    } else {
      await supabase
        .from('user_campaign_progress')
        .update(updates)
        .eq('id', existingProgress.id);
    }
  } else {
    // Create new progress record
    const newProgress = {
      user_id: userId,
      campaign_id: campaignId,
      missions_completed_count: completedCount,
      total_missions_count: totalMissions,
      completed_at: isComplete ? new Date().toISOString() : null,
      total_completions: isComplete ? 1 : 0,
      best_completion_time_seconds: isComplete && durationSeconds > 0 ? durationSeconds : null,
    };

    await supabase
      .from('user_campaign_progress')
      .insert([newProgress]);

    // Record completion if complete
    if (isComplete) {
      await supabase
        .from('campaign_completions')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          completion_time_seconds: durationSeconds || 0,
          is_personal_record: true, // First completion is always a PR
          missions_completed: completedCount,
          total_score: score,
          total_weight: weight,
        });
    }
  }
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      // Delete the session - database trigger handles profile stat updates atomically
      const { error: deleteError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
