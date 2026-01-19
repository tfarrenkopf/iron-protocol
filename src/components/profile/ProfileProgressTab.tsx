import { motion } from "framer-motion";
import { Trophy, Dumbbell, Target, Zap, Skull, TrendingUp } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCompletedSessions } from "@/hooks/useWorkoutSessions";
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";

export function ProfileProgressTab() {
  const { data: profile } = useProfile();
  const { data: sessions } = useCompletedSessions();

  const now = new Date();
  
  // This week stats
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  // Last week stats
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const thisWeekSessions = sessions?.filter(s => {
    const date = s.completed_at ? new Date(s.completed_at) : null;
    return date && isWithinInterval(date, { start: thisWeekStart, end: thisWeekEnd });
  }) || [];

  const lastWeekSessions = sessions?.filter(s => {
    const date = s.completed_at ? new Date(s.completed_at) : null;
    return date && isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
  }) || [];

  // Calculate weekly comparisons
  const thisWeekMissions = thisWeekSessions.length;
  const lastWeekMissions = lastWeekSessions.length;
  const missionsTrend = thisWeekMissions - lastWeekMissions;

  const thisWeekWeight = thisWeekSessions.reduce((acc, s) => acc + Number(s.total_weight || 0), 0);
  const lastWeekWeight = lastWeekSessions.reduce((acc, s) => acc + Number(s.total_weight || 0), 0);
  const weightTrend = thisWeekWeight - lastWeekWeight;

  // Active days this week
  const thisWeekDays = new Set(
    thisWeekSessions.map(s => new Date(s.completed_at!).toDateString())
  ).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Weekly Performance */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-display text-muted-foreground">THIS WEEK</span>
        </div>
        
        <div className="space-y-4">
          {/* Missions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Missions Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-foreground">{thisWeekMissions}</span>
              {missionsTrend !== 0 && (
                <span className={`text-xs ${missionsTrend > 0 ? 'text-success' : 'text-destructive'}`}>
                  {missionsTrend > 0 ? '+' : ''}{missionsTrend}
                </span>
              )}
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Total Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-foreground">
                {(thisWeekWeight / 1000).toFixed(1)}k lbs
              </span>
              {weightTrend !== 0 && (
                <span className={`text-xs ${weightTrend > 0 ? 'text-success' : 'text-destructive'}`}>
                  {weightTrend > 0 ? '+' : ''}{(weightTrend / 1000).toFixed(1)}k
                </span>
              )}
            </div>
          </div>

          {/* Active Days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Active Days</span>
            </div>
            <span className="font-display text-lg text-foreground">{thisWeekDays}</span>
          </div>
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-warning" />
          <span className="text-sm font-display text-muted-foreground">LIFETIME</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">TOTAL MISSIONS</div>
            <div className="font-display text-2xl text-foreground">{sessions?.length || 0}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">TOTAL VOLUME</div>
            <div className="font-display text-2xl text-foreground">
              {((profile?.total_weight || 0) / 1000).toFixed(1)}k
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">TOTAL SCORE</div>
            <div className="font-display text-2xl text-foreground">
              {(profile?.total_score || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">TOTAL SETS</div>
            <div className="font-display text-2xl text-foreground">
              {profile?.total_sets || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Boss Contributions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skull className="w-4 h-4 text-destructive" />
          <span className="text-sm font-display text-muted-foreground">BOSS CONTRIBUTIONS</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">TOTAL DAMAGE</div>
            <div className="font-display text-xl text-foreground">
              {(profile?.total_score || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">MAX COMBO</div>
            <div className="font-display text-xl text-foreground">{profile?.max_combo || 0}x</div>
          </div>
        </div>
      </div>

      {/* Trend Note */}
      <div className="text-center text-xs text-muted-foreground py-2">
        Trends vs. last week • Personal records tracked in History
      </div>
    </motion.div>
  );
}
