import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Swords, Crown, Medal, Flame, Target, Users, Dumbbell, Zap, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface CompletedSession {
  id: string;
  completed_at: string;
  score_earned: number;
  xp_earned: number;
  sets_completed: number;
  total_reps: number;
  total_weight: number;
  damage_dealt: number;
  mission_snapshot: { name: string; code_name: string } | null;
  mission_id: string | null;
  user_id: string;
  profiles: { display_name: string | null } | null;
}

interface StreakLeader {
  user_id: string;
  display_name: string;
  streak: number;
}

interface CommunityStats {
  activeWarriors: number;
  totalWeight: number;
  totalDamage: number;
  totalMissions: number;
  topDamageDealer: { name: string; damage: number } | null;
  topWeightLifter: { name: string; weight: number } | null;
  topMissionCompleter: { name: string; missions: number } | null;
}

function usePublicFeed() {
  return useQuery({
    queryKey: ['public-feed'],
    queryFn: async () => {
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
          damage_dealt,
          mission_snapshot,
          mission_id,
          user_id,
          profiles (
            display_name
          )
        `)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CompletedSession[];
    },
  });
}

function useCommunityStats() {
  return useQuery({
    queryKey: ['community-stats'],
    queryFn: async (): Promise<CommunityStats> => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      // Get all sessions from this week
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select(`
          user_id,
          total_weight,
          damage_dealt,
          profiles (
            display_name
          )
        `)
        .eq('status', 'COMPLETED')
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString());

      if (error) throw error;

      // Aggregate stats by user
      const userStats: Record<string, { 
        name: string; 
        weight: number; 
        damage: number; 
        missions: number;
      }> = {};

      sessions?.forEach((session: any) => {
        const userId = session.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            name: session.profiles?.display_name || 'Unknown Agent',
            weight: 0,
            damage: 0,
            missions: 0,
          };
        }
        userStats[userId].weight += Number(session.total_weight || 0);
        userStats[userId].damage += Number(session.damage_dealt || 0);
        userStats[userId].missions += 1;
      });

      const users = Object.values(userStats);
      const activeWarriors = users.length;
      const totalWeight = users.reduce((sum, u) => sum + u.weight, 0);
      const totalDamage = users.reduce((sum, u) => sum + u.damage, 0);
      const totalMissions = users.reduce((sum, u) => sum + u.missions, 0);

      // Find top performers
      const byDamage = [...users].sort((a, b) => b.damage - a.damage);
      const byWeight = [...users].sort((a, b) => b.weight - a.weight);
      const byMissions = [...users].sort((a, b) => b.missions - a.missions);

      return {
        activeWarriors,
        totalWeight,
        totalDamage,
        totalMissions,
        topDamageDealer: byDamage[0] ? { name: byDamage[0].name, damage: byDamage[0].damage } : null,
        topWeightLifter: byWeight[0] ? { name: byWeight[0].name, weight: byWeight[0].weight } : null,
        topMissionCompleter: byMissions[0] ? { name: byMissions[0].name, missions: byMissions[0].missions } : null,
      };
    },
  });
}

function useStreakLeaders() {
  return useQuery({
    queryKey: ['streak-leaders'],
    queryFn: async () => {
      // Get all completed sessions grouped by user and date
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          user_id,
          completed_at,
          profiles (
            display_name
          )
        `)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate streaks for each user
      const userWorkouts: Record<string, { dates: Set<string>; display_name: string }> = {};
      
      data?.forEach((session: any) => {
        if (!session.completed_at) return;
        const userId = session.user_id;
        const date = format(new Date(session.completed_at), 'yyyy-MM-dd');
        
        if (!userWorkouts[userId]) {
          userWorkouts[userId] = {
            dates: new Set(),
            display_name: session.profiles?.display_name || 'Unknown Agent',
          };
        }
        userWorkouts[userId].dates.add(date);
      });
      
      // Calculate current streak for each user
      const leaders: StreakLeader[] = Object.entries(userWorkouts).map(([userId, data]) => {
        const sortedDates = Array.from(data.dates).sort().reverse();
        let streak = 0;
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
        
        // Streak counts if they worked out today or yesterday
        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000;
            
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
        
        return {
          user_id: userId,
          display_name: data.display_name,
          streak,
        };
      });
      
      // Sort by streak and return top 3
      return leaders.sort((a, b) => b.streak - a.streak).slice(0, 3);
    },
  });
}

const FrontLines = () => {
  const navigate = useNavigate();
  const { data: feed, isLoading } = usePublicFeed();
  const { data: streakLeaders } = useStreakLeaders();
  const { data: communityStats } = useCommunityStats();

  const rankIcons = [Crown, Medal, Flame];
  const rankColors = ['text-yellow-400', 'text-slate-300', 'text-orange-500'];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary">THE FRONT LINES</h1>
            <p className="text-xs text-muted-foreground tracking-wider">LIVE COMBAT FEED</p>
          </div>
        </div>

        {/* Community Stats */}
        {communityStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-card border border-primary/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-primary flex items-center gap-2">
                <Users className="w-5 h-5" />
                THIS WEEK'S WAR REPORT
              </h2>
              <span className="text-xs text-muted-foreground">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </span>
            </div>

            {/* Aggregate Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="font-display text-xl text-secondary">{communityStats.activeWarriors}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">ACTIVE</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="font-display text-xl text-primary">{communityStats.totalMissions}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">MISSIONS</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="font-display text-xl text-accent">
                  {communityStats.totalWeight >= 1000000 
                    ? `${(communityStats.totalWeight / 1000000).toFixed(1)}M`
                    : communityStats.totalWeight >= 1000 
                      ? `${(communityStats.totalWeight / 1000).toFixed(0)}k` 
                      : communityStats.totalWeight}
                </div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">LBS</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="font-display text-xl text-destructive">
                  {communityStats.totalDamage >= 1000000 
                    ? `${(communityStats.totalDamage / 1000000).toFixed(1)}M`
                    : communityStats.totalDamage >= 1000 
                      ? `${(communityStats.totalDamage / 1000).toFixed(0)}k` 
                      : communityStats.totalDamage}
                </div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">DMG</div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-3 gap-2">
              {communityStats.topDamageDealer && (
                <div className="p-2 bg-destructive/10 border border-destructive/30 rounded text-center">
                  <Zap className="w-4 h-4 text-destructive mx-auto mb-1" />
                  <div className="text-xs text-destructive font-display uppercase">TOP DMG</div>
                  <div className="text-sm text-foreground truncate">{communityStats.topDamageDealer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {communityStats.topDamageDealer.damage.toLocaleString()}
                  </div>
                </div>
              )}
              {communityStats.topWeightLifter && (
                <div className="p-2 bg-accent/10 border border-accent/30 rounded text-center">
                  <Dumbbell className="w-4 h-4 text-accent mx-auto mb-1" />
                  <div className="text-xs text-accent font-display uppercase">TOP LBS</div>
                  <div className="text-sm text-foreground truncate">{communityStats.topWeightLifter.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {communityStats.topWeightLifter.weight.toLocaleString()}
                  </div>
                </div>
              )}
              {communityStats.topMissionCompleter && (
                <div className="p-2 bg-primary/10 border border-primary/30 rounded text-center">
                  <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
                  <div className="text-xs text-primary font-display uppercase">TOP OPS</div>
                  <div className="text-sm text-foreground truncate">{communityStats.topMissionCompleter.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {communityStats.topMissionCompleter.missions}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Streak Leaders */}
        {streakLeaders && streakLeaders.some(l => l.streak > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 bg-card border border-accent/50 rounded-lg"
          >
            <h2 className="font-display text-lg text-accent mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              ACTIVE STREAK CHAMPIONS
            </h2>
            <div className="space-y-2">
              {streakLeaders.filter(l => l.streak > 0).map((leader, i) => {
                const Icon = rankIcons[i];
                return (
                  <div key={leader.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${rankColors[i]}`} />
                      <span className="font-display text-foreground">{leader.display_name}</span>
                    </div>
                    <span className="font-display text-accent">{leader.streak} DAY{leader.streak !== 1 ? 'S' : ''}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          <h2 className="font-display text-lg text-muted-foreground flex items-center gap-2">
            <Swords className="w-5 h-5" />
            RECENT COMBAT
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="font-display text-muted-foreground animate-pulse">LOADING TRANSMISSIONS...</div>
            </div>
          ) : feed?.length === 0 ? (
            <div className="text-center py-12">
              <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-display text-muted-foreground">NO COMBAT DATA YET</p>
              <p className="text-xs text-muted-foreground mt-2">Be the first to complete a mission</p>
            </div>
          ) : (
            feed?.map((session, i) => {
              const missionName = session.mission_snapshot?.code_name || 'CLASSIFIED MISSION';
              const displayName = session.profiles?.display_name || 'Unknown Agent';
              const completedDate = session.completed_at ? new Date(session.completed_at) : new Date();
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-primary">{displayName}</span>
                        <span className="text-xs text-muted-foreground">completed</span>
                      </div>
                      <div className="font-display text-lg text-secondary">{missionName}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{session.sets_completed} sets</span>
                        <span>{Number(session.total_weight || 0).toLocaleString()} lbs</span>
                        <span className="text-destructive">{session.damage_dealt || 0} dmg</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {format(completedDate, 'MMM d')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(completedDate, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  {session.mission_id && (
                    <button
                      onClick={() => navigate(`/mission/${session.mission_id}`)}
                      className="mt-3 w-full py-2 border border-primary/50 rounded text-sm font-display text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      JOIN THE MISSION
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FrontLines;
