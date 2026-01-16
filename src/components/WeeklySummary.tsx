import { motion } from 'framer-motion';
import { TrendingUp, Flame, Calendar, Trophy, Dumbbell, Target, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface WeeklyStats {
  sessionsCompleted: number;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  totalXp: number;
  prsSet: number;
  recentMuscleGroups: string[];
  totalDamage: number;
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
        recentMuscleGroups: [],
        totalDamage: 0,
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

      // Get recent workout sets with exercise info to determine muscle groups
      const { data: recentSets, error: setsError } = await supabase
        .from('workout_sets')
        .select(`
          exercise_id,
          exercises (
            primary_muscle_group
          )
        `)
        .eq('session_id', sessions?.[0]?.id || '')
        .limit(20);

      // Extract unique muscle groups from recent sets
      const muscleGroups = new Set<string>();
      recentSets?.forEach((set: any) => {
        if (set.exercises?.primary_muscle_group) {
          muscleGroups.add(set.exercises.primary_muscle_group);
        }
      });

      const totals = sessions?.reduce(
        (acc, session) => ({
          totalSets: acc.totalSets + (session.sets_completed || 0),
          totalReps: acc.totalReps + (session.total_reps || 0),
          totalWeight: acc.totalWeight + Number(session.total_weight || 0),
          totalXp: acc.totalXp + (session.xp_earned || 0),
          totalDamage: acc.totalDamage + (session.damage_dealt || 0),
        }),
        { totalSets: 0, totalReps: 0, totalWeight: 0, totalXp: 0, totalDamage: 0 }
      ) || { totalSets: 0, totalReps: 0, totalWeight: 0, totalXp: 0, totalDamage: 0 };

      return {
        sessionsCompleted: sessions?.length || 0,
        ...totals,
        prsSet: prsCount || 0,
        recentMuscleGroups: Array.from(muscleGroups).slice(0, 3),
      };
    },
    enabled: !!user,
  });
}

// Fun motivational phrases based on weekly performance
const getMotivationalPhrase = (stats: WeeklyStats): string => {
  if (stats.prsSet >= 3) return "🔥 UNSTOPPABLE! Breaking records left and right!";
  if (stats.sessionsCompleted >= 5) return "💪 WARRIOR MODE: 5+ missions this week!";
  if (stats.totalWeight >= 10000) return "⚔️ IRON WILL: 10,000+ lbs moved!";
  if (stats.totalDamage >= 5000) return "💀 DEVASTATING: 5k+ damage dealt!";
  if (stats.prsSet > 0) return "🏆 NEW PR! Keep pushing limits!";
  if (stats.sessionsCompleted >= 3) return "🎯 Consistent warrior! Keep it up!";
  return "⚡ Every rep counts. Keep fighting!";
};

export function WeeklySummary() {
  const { data: stats, isLoading } = useWeeklySummary();
  const { data: profile } = useProfile();
  
  if (isLoading) return null;
  
  // Calculate level from XP
  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const xpProgress = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const xpUntilNext = nextLevelXp - xp;
  const progressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Show even if no activity (for level/XP info)
  const hasWeeklyActivity = stats && stats.sessionsCompleted > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 bg-card border border-secondary/30 rounded-lg overflow-hidden"
    >
      {/* Weekly Stats Section */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-secondary" />
          <span className="font-display text-sm text-secondary">
            WEEKLY DEBRIEF
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
          </span>
        </div>

        {hasWeeklyActivity ? (
          <>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <div className="font-display text-2xl text-primary">{stats.sessionsCompleted}</div>
                <div className="text-[10px] text-muted-foreground">MISSIONS</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-accent">
                  {stats.totalWeight >= 1000 
                    ? `${(stats.totalWeight / 1000).toFixed(1)}k` 
                    : stats.totalWeight}
                </div>
                <div className="text-[10px] text-muted-foreground">LBS LIFTED</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-warning" />
                  <span className="font-display text-2xl text-warning">{stats.prsSet}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">NEW PRs</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-destructive">
                  {stats.totalDamage >= 1000 
                    ? `${(stats.totalDamage / 1000).toFixed(1)}k` 
                    : stats.totalDamage}
                </div>
                <div className="text-[10px] text-muted-foreground">DAMAGE</div>
              </div>
            </div>

            {/* Motivational phrase */}
            <div className="text-center py-2 bg-background/50 rounded">
              <span className="text-xs text-muted-foreground">
                {getMotivationalPhrase(stats)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No missions completed this week</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Start a mission to see your stats!</p>
          </div>
        )}
      </div>

      {/* Level & Progress Section */}
      <div className="p-4 bg-background/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-display text-sm text-primary">AGENT STATUS</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/50 flex flex-col items-center justify-center">
            <div className="text-[10px] text-muted-foreground">LEVEL</div>
            <div className="font-display text-2xl text-primary">{level}</div>
          </div>

          {/* XP Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                <span className="text-success font-display">{xp.toLocaleString()}</span> XP
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="text-primary font-display">{xpUntilNext.toLocaleString()}</span> to Level {level + 1}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>

            {/* Recent Muscle Groups */}
            {stats?.recentMuscleGroups && stats.recentMuscleGroups.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">RECENT:</span>
                <div className="flex gap-1">
                  {stats.recentMuscleGroups.map((muscle) => (
                    <span 
                      key={muscle} 
                      className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
