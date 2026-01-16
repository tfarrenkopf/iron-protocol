import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type RecordType = 'WEIGHT' | 'REPS' | 'VOLUME';

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: RecordType;
  value: number;
  unit: string;
  achievedAt: string;
}

export interface PRCheckResult {
  isNewPR: boolean;
  recordType: RecordType;
  newValue: number;
  previousValue: number | null;
  exerciseName: string;
}

export function usePersonalRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('personal_records')
        .select(`
          *,
          exercises (
            name
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Convert to a nested map: exerciseId -> recordType -> record
      const recordMap: Record<string, Record<RecordType, PersonalRecord>> = {};
      
      data.forEach(record => {
        if (!recordMap[record.exercise_id]) {
          recordMap[record.exercise_id] = {} as Record<RecordType, PersonalRecord>;
        }
        recordMap[record.exercise_id][record.record_type as RecordType] = {
          id: record.id,
          exerciseId: record.exercise_id,
          exerciseName: record.exercises?.name || 'Unknown Exercise',
          recordType: record.record_type as RecordType,
          value: record.value,
          unit: record.unit,
          achievedAt: record.achieved_at,
        };
      });
      
      return recordMap;
    },
    enabled: !!user,
  });
}

export function useCheckAndUpdatePR() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      exerciseId, 
      exerciseName,
      weight, 
      reps,
      sessionId,
      unit = 'lb' 
    }: { 
      exerciseId: string;
      exerciseName: string;
      weight: number; 
      reps: number;
      sessionId?: string;
      unit?: string;
    }): Promise<PRCheckResult[]> => {
      if (!user) return [];
      
      const newPRs: PRCheckResult[] = [];
      const volume = weight * reps;
      
      // Fetch current records for this exercise
      const { data: existingRecords } = await supabase
        .from('personal_records')
        .select('record_type, value')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId);
      
      const currentRecords: Record<string, number> = {};
      existingRecords?.forEach(r => {
        currentRecords[r.record_type] = r.value;
      });
      
      // Check each record type
      const checks: { type: RecordType; value: number }[] = [
        { type: 'WEIGHT', value: weight },
        { type: 'REPS', value: reps },
        { type: 'VOLUME', value: volume },
      ];
      
      for (const check of checks) {
        // Skip if value is 0 (bodyweight with no reps doesn't count)
        if (check.value === 0) continue;
        
        const previousValue = currentRecords[check.type] || null;
        const isNewPR = previousValue === null || check.value > previousValue;
        
        if (isNewPR) {
          // Upsert the new record
          const { error } = await supabase
            .from('personal_records')
            .upsert({
              user_id: user.id,
              exercise_id: exerciseId,
              record_type: check.type,
              value: check.value,
              unit: check.type === 'REPS' ? 'reps' : unit,
              achieved_at: new Date().toISOString(),
              session_id: sessionId || null,
            }, {
              onConflict: 'user_id,exercise_id,record_type'
            });
          
          if (!error) {
            newPRs.push({
              isNewPR: true,
              recordType: check.type,
              newValue: check.value,
              previousValue,
              exerciseName,
            });
          }
        }
      }
      
      return newPRs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-records'] });
    },
  });
}

// Get all PRs for display in stats/profile
export function useAllPersonalRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-personal-records', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('personal_records')
        .select(`
          *,
          exercises (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(record => ({
        id: record.id,
        exerciseId: record.exercise_id,
        exerciseName: record.exercises?.name || 'Unknown Exercise',
        recordType: record.record_type as RecordType,
        value: record.value,
        unit: record.unit,
        achievedAt: record.achieved_at,
      }));
    },
    enabled: !!user,
  });
}

// Get count of PRs set by user
export function usePersonalRecordsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personal-records-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('personal_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}
