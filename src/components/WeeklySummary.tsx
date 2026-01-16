import { motion } from 'framer-motion';
import { TrendingUp, Flame, Calendar, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface WeeklyStats {
  sessionsCompleted: number;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  totalXp: number;
  prsSet: number;
}

export function useWeeklySummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-summary', user?.id],
    queryFn: async (): Promise<WeeklyStats> => {
      if (!user) return {
        sessionsCompleted: 0,
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        totalXp: 0,
        prsSet: 0,
      };

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      // Get completed sessions this week
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString());

      if (sessionsError) throw sessionsError;

      // Get PRs set this week
      const { count: prsCount, error: prsError } = await supabase
        .from('personal_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('achieved_at', weekStart.toISOString())
        .lte('achieved_at', weekEnd.toISOString());

      if (prsError) throw prsError;

      const totals = sessions?.reduce(
        (acc, session) => ({
          totalSets: acc.totalSets + (session.sets_completed || 0),
          totalReps: acc.totalReps + (session.total_reps || 0),
          totalWeight: acc.totalWeight + Number(session.total_weight || 0),
          totalXp: acc.totalXp + (session.xp_earned || 0),
        }),
        { totalSets: 0, totalReps: 0, totalWeight: 0, totalXp: 0 }
      ) || { totalSets: 0, totalReps: 0, totalWeight: 0, totalXp: 0 };

      return {
        sessionsCompleted: sessions?.length || 0,
        ...totals,
        prsSet: prsCount || 0,
      };
    },
    enabled: !!user,
  });
}

export function WeeklySummary() {
  const { data: stats, isLoading } = useWeeklySummary();
  
  if (isLoading || !stats) return null;
  
  // Don't show if no activity this week
  if (stats.sessionsCompleted === 0) return null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 bg-card border border-secondary/30 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-secondary" />
        <span className="font-display text-sm text-secondary">
          WEEKLY DEBRIEF
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="font-display text-2xl text-primary">{stats.sessionsCompleted}</div>
          <div className="text-[10px] text-muted-foreground">MISSIONS</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl text-accent">{stats.totalSets}</div>
          <div className="text-[10px] text-muted-foreground">SETS</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl text-success">+{stats.totalXp}</div>
          <div className="text-[10px] text-muted-foreground">XP</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="font-display text-2xl text-warning">{stats.prsSet}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">NEW PRs</div>
        </div>
      </div>

      {stats.prsSet > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center">
          <span className="text-xs text-success flex items-center justify-center gap-1">
            <Flame className="w-3 h-3" />
            You set {stats.prsSet} personal record{stats.prsSet > 1 ? 's' : ''} this week!
          </span>
        </div>
      )}
    </motion.div>
  );
}
