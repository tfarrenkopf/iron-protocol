import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PRCheckResult, RecordType } from './usePersonalRecords';

interface SetData {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  unit?: string;
}

interface BatchPersistResult {
  weightUpdates: number;
  newPRs: PRCheckResult[];
}

/**
 * Batch persist hook - saves all weight history and PRs at once
 * Called only at mission end to avoid per-set DB calls
 */
export function useBatchPersist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      sets,
      sessionId,
    }: { 
      sets: SetData[];
      sessionId?: string;
    }): Promise<BatchPersistResult> => {
      if (!user || sets.length === 0) {
        return { weightUpdates: 0, newPRs: [] };
      }

      // Group sets by exercise to find max weight/reps/volume per exercise
      const exerciseMaxes = new Map<string, {
        exerciseName: string;
        maxWeight: number;
        maxReps: number;
        maxVolume: number;
        lastWeight: number;
        unit: string;
      }>();

      sets.forEach(set => {
        const existing = exerciseMaxes.get(set.exerciseId);
        const volume = set.weight * set.reps;
        
        if (existing) {
          existing.maxWeight = Math.max(existing.maxWeight, set.weight);
          existing.maxReps = Math.max(existing.maxReps, set.reps);
          existing.maxVolume = Math.max(existing.maxVolume, volume);
          existing.lastWeight = set.weight; // Last set's weight
        } else {
          exerciseMaxes.set(set.exerciseId, {
            exerciseName: set.exerciseName,
            maxWeight: set.weight,
            maxReps: set.reps,
            maxVolume: volume,
            lastWeight: set.weight,
            unit: set.unit || 'lb',
          });
        }
      });

      const exerciseIds = Array.from(exerciseMaxes.keys());
      
      // Fetch existing weight history and PRs in parallel
      const [weightHistoryResult, existingPRsResult] = await Promise.all([
        supabase
          .from('user_weight_history')
          .select('exercise_id, max_weight')
          .eq('user_id', user.id)
          .in('exercise_id', exerciseIds),
        supabase
          .from('personal_records')
          .select('exercise_id, record_type, value')
          .eq('user_id', user.id)
          .in('exercise_id', exerciseIds),
      ]);

      // Build lookup maps
      const existingWeights = new Map<string, number>();
      weightHistoryResult.data?.forEach(w => {
        existingWeights.set(w.exercise_id, w.max_weight);
      });

      const existingPRs = new Map<string, Record<string, number>>();
      existingPRsResult.data?.forEach(pr => {
        if (!existingPRs.has(pr.exercise_id)) {
          existingPRs.set(pr.exercise_id, {});
        }
        existingPRs.get(pr.exercise_id)![pr.record_type] = pr.value;
      });

      // Prepare batch updates
      const weightHistoryUpserts: any[] = [];
      const prUpserts: any[] = [];
      const newPRs: PRCheckResult[] = [];

      exerciseMaxes.forEach((data, exerciseId) => {
        // Weight history upsert
        const existingMax = existingWeights.get(exerciseId) || 0;
        weightHistoryUpserts.push({
          user_id: user.id,
          exercise_id: exerciseId,
          last_weight: data.lastWeight,
          max_weight: Math.max(existingMax, data.maxWeight),
          unit: data.unit,
        });

        // PR checks
        const exercisePRs = existingPRs.get(exerciseId) || {};
        
        const checks: { type: RecordType; value: number }[] = [
          { type: 'WEIGHT', value: data.maxWeight },
          { type: 'REPS', value: data.maxReps },
          { type: 'VOLUME', value: data.maxVolume },
        ];

        checks.forEach(check => {
          if (check.value === 0) return;
          
          const previousValue = exercisePRs[check.type] || null;
          const isNewPR = previousValue === null || check.value > previousValue;

          if (isNewPR) {
            prUpserts.push({
              user_id: user.id,
              exercise_id: exerciseId,
              record_type: check.type,
              value: check.value,
              unit: check.type === 'REPS' ? 'reps' : data.unit,
              achieved_at: new Date().toISOString(),
              session_id: sessionId || null,
            });

            newPRs.push({
              isNewPR: true,
              recordType: check.type,
              newValue: check.value,
              previousValue,
              exerciseName: data.exerciseName,
            });
          }
        });
      });

      // Execute batch upserts in parallel
      await Promise.all([
        weightHistoryUpserts.length > 0 
          ? supabase
              .from('user_weight_history')
              .upsert(weightHistoryUpserts, { onConflict: 'user_id,exercise_id' })
          : Promise.resolve(),
        prUpserts.length > 0
          ? supabase
              .from('personal_records')
              .upsert(prUpserts, { onConflict: 'user_id,exercise_id,record_type' })
          : Promise.resolve(),
      ]);

      return {
        weightUpdates: weightHistoryUpserts.length,
        newPRs,
      };
    },
    onSuccess: () => {
      // Invalidate caches after batch persist
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
      queryClient.invalidateQueries({ queryKey: ['personal-records'] });
    },
  });
}
