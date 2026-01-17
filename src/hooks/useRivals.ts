import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Rival {
  id: string;
  rival_id: string;
  display_name: string | null;
  rival_code: string | null;
  created_at: string;
}

export interface RivalWeeklyStats {
  user_id: string;
  display_name: string | null;
  rival_code: string | null;
  weekly_score: number;
  weekly_weight: number;
  weekly_sessions: number;
  weekly_sets: number;
  weekly_max_combo: number;
}

export function useRivals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rivals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get rivalries where user is either user_id or rival_id
      const { data, error } = await supabase
        .from('rivalries')
        .select(`
          id,
          user_id,
          rival_id,
          created_at
        `)
        .or(`user_id.eq.${user.id},rival_id.eq.${user.id}`);

      if (error) throw error;

      // Get the "other" user's profile for each rivalry
      const rivalIds = data.map(r => r.user_id === user.id ? r.rival_id : r.user_id);
      
      if (rivalIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, rival_code')
        .in('id', rivalIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(rivalry => {
        const rivalId = rivalry.user_id === user.id ? rivalry.rival_id : rivalry.user_id;
        const profile = profileMap.get(rivalId);
        return {
          id: rivalry.id,
          rival_id: rivalId,
          display_name: profile?.display_name || null,
          rival_code: profile?.rival_code || null,
          created_at: rivalry.created_at,
        } as Rival;
      });
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRivalWeeklyStats() {
  const { user } = useAuth();
  const { data: rivals } = useRivals();

  return useQuery({
    queryKey: ['rival-weekly-stats', user?.id, rivals?.map(r => r.rival_id)],
    queryFn: async () => {
      if (!user || !rivals || rivals.length === 0) return [];

      const allUserIds = [user.id, ...rivals.map(r => r.rival_id)];

      // Calculate weekly stats from workout_sessions directly
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday start

      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('user_id, score_earned, total_weight, sets_completed, max_combo')
        .in('user_id', allUserIds)
        .eq('status', 'COMPLETED')
        .gte('completed_at', weekStart.toISOString());

      if (error) throw error;

      // Get profile info
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, rival_code')
        .in('id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Aggregate stats by user
      const statsMap = new Map<string, RivalWeeklyStats>();
      
      for (const userId of allUserIds) {
        const userSessions = sessions?.filter(s => s.user_id === userId) || [];
        const profile = profileMap.get(userId);
        
        statsMap.set(userId, {
          user_id: userId,
          display_name: profile?.display_name || (userId === user.id ? 'You' : null),
          rival_code: profile?.rival_code || null,
          weekly_score: userSessions.reduce((sum, s) => sum + (s.score_earned || 0), 0),
          weekly_weight: userSessions.reduce((sum, s) => sum + Number(s.total_weight || 0), 0),
          weekly_sessions: userSessions.length,
          weekly_sets: userSessions.reduce((sum, s) => sum + (s.sets_completed || 0), 0),
          weekly_max_combo: Math.max(0, ...userSessions.map(s => s.max_combo || 0)),
        });
      }

      return Array.from(statsMap.values()).sort((a, b) => b.weekly_score - a.weekly_score);
    },
    enabled: !!user && !!rivals && rivals.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useAddRival() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rivalCode: string) => {
      if (!user) throw new Error('Must be logged in');

      // Find the user by rival_code
      const { data: rivalProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, display_name, rival_code')
        .eq('rival_code', rivalCode)
        .maybeSingle();

      if (findError) throw findError;
      if (!rivalProfile) {
        throw new Error('Rival not found. Check the code and try again.');
      }

      if (rivalProfile.id === user.id) {
        throw new Error("You can't add yourself as a rival!");
      }

      // Check if rivalry already exists
      const { data: existing } = await supabase
        .from('rivalries')
        .select('id')
        .or(`and(user_id.eq.${user.id},rival_id.eq.${rivalProfile.id}),and(user_id.eq.${rivalProfile.id},rival_id.eq.${user.id})`)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('You are already rivals!');
      }

      // Create the rivalry (both directions are handled by the unique constraint)
      const { error } = await supabase
        .from('rivalries')
        .insert({
          user_id: user.id,
          rival_id: rivalProfile.id,
        });

      if (error) throw error;

      return rivalProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivals'] });
      queryClient.invalidateQueries({ queryKey: ['rival-weekly-stats'] });
    },
  });
}

export function useRemoveRival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rivalryId: string) => {
      const { error } = await supabase
        .from('rivalries')
        .delete()
        .eq('id', rivalryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivals'] });
      queryClient.invalidateQueries({ queryKey: ['rival-weekly-stats'] });
    },
  });
}

export function useProfileByRivalCode(rivalCode: string | undefined) {
  return useQuery({
    queryKey: ['profile-by-rival-code', rivalCode],
    queryFn: async () => {
      if (!rivalCode) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, rival_code, total_score, total_xp')
        .eq('rival_code', rivalCode)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!rivalCode,
  });
}

export interface RivalActivity {
  id: string;
  user_id: string;
  display_name: string | null;
  mission_id: string | null;
  mission_snapshot: { name: string; code_name: string } | null;
  completed_at: string;
  score_earned: number;
  total_weight: number;
  sets_completed: number;
  max_combo: number;
  damage_dealt: number;
}

export function useRivalActivity() {
  const { user } = useAuth();
  const { data: rivals } = useRivals();

  return useQuery({
    queryKey: ['rival-activity', user?.id, rivals?.map(r => r.rival_id)],
    queryFn: async () => {
      if (!user || !rivals || rivals.length === 0) return [];

      const rivalIds = rivals.map(r => r.rival_id);

      // Get recent completed sessions from rivals (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('id, user_id, mission_id, mission_snapshot, completed_at, score_earned, total_weight, sets_completed, max_combo, damage_dealt')
        .in('user_id', rivalIds)
        .eq('status', 'COMPLETED')
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get profile info
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', rivalIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return sessions?.map(s => ({
        id: s.id,
        user_id: s.user_id,
        display_name: profileMap.get(s.user_id)?.display_name || 'Unknown',
        mission_id: s.mission_id,
        mission_snapshot: s.mission_snapshot as { name: string; code_name: string } | null,
        completed_at: s.completed_at || '',
        score_earned: s.score_earned || 0,
        total_weight: Number(s.total_weight || 0),
        sets_completed: s.sets_completed || 0,
        max_combo: s.max_combo || 0,
        damage_dealt: s.damage_dealt || 0,
      })) || [];
    },
    enabled: !!user && !!rivals && rivals.length > 0,
    staleTime: 60 * 1000,
  });
}
