import { motion } from "framer-motion";
import { Target, Zap, Skull, Calendar } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useMyAssignments } from "@/hooks/useAssignments";
import { useCompletedSessions } from "@/hooks/useWorkoutSessions";
import { startOfWeek, endOfWeek, differenceInDays } from "date-fns";

export function ProfileOverviewTab() {
  const { data: profile } = useProfile();
  const { data: assignments } = useMyAssignments();
  const { data: sessions } = useCompletedSessions();

  // Calculate weekly stats
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const daysRemaining = differenceInDays(weekEnd, now);

  const weeklySessions = sessions?.filter(s => {
    const completedAt = s.completed_at ? new Date(s.completed_at) : null;
    return completedAt && completedAt >= weekStart && completedAt <= weekEnd;
  }) || [];

  const weeklyMissions = weeklySessions.length;
  const weeklyWeight = weeklySessions.reduce((acc, s) => acc + Number(s.total_weight || 0), 0);
  const weeklyScore = weeklySessions.reduce((acc, s) => acc + (s.score_earned || 0), 0);

  // Active assignments
  const activeAssignments = assignments?.filter((a: any) => a.status !== 'COMPLETED') || [];

  // Simple streak calculation (consecutive days with sessions)
  const streakDays = calculateStreak(sessions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Week Status */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">THIS WEEK</span>
          </div>
          <span className="text-xs text-primary font-display">
            {daysRemaining} DAYS LEFT
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-background border border-border rounded">
            <div className="font-display text-xl text-foreground">{weeklyMissions}</div>
            <div className="text-xs text-muted-foreground">MISSIONS</div>
          </div>
          <div className="text-center p-2 bg-background border border-border rounded">
            <div className="font-display text-xl text-foreground">
              {(weeklyWeight / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-muted-foreground">LBS</div>
          </div>
          <div className="text-center p-2 bg-background border border-border rounded">
            <div className="font-display text-xl text-foreground">
              {weeklyScore.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">SCORE</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Orders */}
        <div className="bg-card border border-section-orders/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-section-orders" />
            <span className="text-xs text-section-orders font-display">ACTIVE ORDERS</span>
          </div>
          <div className="font-display text-3xl text-foreground">
            {activeAssignments.length}
          </div>
          {activeAssignments.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Pending execution
            </div>
          )}
        </div>

        {/* Streak */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground font-display">STREAK</span>
          </div>
          <div className="font-display text-3xl text-foreground">
            {streakDays}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {streakDays === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Boss Contribution (this cycle) */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skull className="w-4 h-4 text-destructive" />
          <span className="text-xs text-muted-foreground font-display">BOSS DAMAGE (THIS CYCLE)</span>
        </div>
        <div className="font-display text-2xl text-foreground">
          {weeklySessions.reduce((acc, s) => acc + (s.damage_dealt || 0), 0).toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          damage dealt
        </div>
      </div>

      {/* Max Combo Lifetime */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-display mb-1">MAX COMBO</div>
            <div className="font-display text-2xl text-foreground">
              {profile?.max_combo || 0}x
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-display mb-1">LIFETIME SCORE</div>
            <div className="font-display text-2xl text-foreground">
              {(profile?.total_score || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function calculateStreak(sessions: any[] | undefined): number {
  if (!sessions || sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique dates with sessions
  const sessionDates = new Set<string>();
  sessions.forEach(s => {
    if (s.completed_at) {
      const date = new Date(s.completed_at);
      date.setHours(0, 0, 0, 0);
      sessionDates.add(date.toISOString());
    }
  });

  // Check consecutive days backwards from today
  let streak = 0;
  let checkDate = new Date(today);

  // First check if today has a session, if not check yesterday
  if (!sessionDates.has(checkDate.toISOString())) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!sessionDates.has(checkDate.toISOString())) {
      return 0;
    }
  }

  while (sessionDates.has(checkDate.toISOString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
