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

      const { data, error } = await supabase
        .from('rival_weekly_stats')
        .select('*')
        .in('user_id', allUserIds);

      if (error) throw error;

      // Ensure all users have stats (even if 0)
      const statsMap = new Map((data || []).map(s => [s.user_id, s]));
      
      return allUserIds.map(userId => {
        const existing = statsMap.get(userId);
        if (existing) return existing as RivalWeeklyStats;
        
        // Find profile info from rivals or current user
        const rival = rivals.find(r => r.rival_id === userId);
        return {
          user_id: userId,
          display_name: rival?.display_name || (userId === user.id ? 'You' : null),
          rival_code: rival?.rival_code || null,
          weekly_score: 0,
          weekly_weight: 0,
          weekly_sessions: 0,
          weekly_sets: 0,
          weekly_max_combo: 0,
        } as RivalWeeklyStats;
      }).sort((a, b) => b.weekly_score - a.weekly_score);
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
        .single();

      if (findError || !rivalProfile) {
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
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!rivalCode,
  });
}
