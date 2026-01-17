import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Swords, 
  Crown, 
  Medal, 
  Flame, 
  Target, 
  Users, 
  Dumbbell, 
  Zap, 
  Trophy,
  BarChart3,
  Shield,
  TrendingUp,
  RefreshCw,
  Activity,
  Star,
  Award,
  Weight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useWarReport, 
  formatCompletionTime, 
  formatLargeNumber,
  getFocusAreaLabel 
} from '@/hooks/useWarReport';
import { useProfile, useLeaderboard } from '@/hooks/useProfile';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { useMuscleGroupStats } from '@/hooks/useMuscleGroupStats';
import { useAuth } from '@/hooks/useAuth';
import BodyDiagram from '@/components/BodyDiagram';
import { useUserMilestones } from '@/hooks/useMilestones';
import { MilestoneList } from '@/components/MilestoneProgress';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { AchievementList } from '@/components/AchievementList';

// ==================== TYPES ====================

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

// ==================== HOOKS ====================

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
      
      const leaders: StreakLeader[] = Object.entries(userWorkouts).map(([userId, data]) => {
        const sortedDates = Array.from(data.dates).sort().reverse();
        let streak = 0;
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
        
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
      
      return leaders.sort((a, b) => b.streak - a.streak).slice(0, 3);
    },
  });
}

// ==================== COMPONENTS ====================

const LiveFeedTab = () => {
  const navigate = useNavigate();
  const { data: feed, isLoading } = usePublicFeed();
  const { data: streakLeaders } = useStreakLeaders();
  const { data: communityStats } = useCommunityStats();

  const rankIcons = [Crown, Medal, Flame];
  const rankColors = ['text-yellow-400', 'text-slate-300', 'text-orange-500'];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      {communityStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-card border border-primary/50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              THIS WEEK'S STATS
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
          className="p-4 bg-card border border-accent/50 rounded-lg"
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

      {/* Recent Combat Feed */}
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
                transition={{ delay: i * 0.03 }}
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
  );
};

const CampaignIntelTab = () => {
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useWarReport();

  if (error) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="font-display text-destructive">INTEL UNAVAILABLE</p>
        <p className="text-xs text-muted-foreground mt-2">Campaign data could not be retrieved</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Message */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/30 border border-border rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">
              All data shown is <span className="text-foreground font-medium">aggregated and anonymized</span>.
              Player identities are protected by design.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          WEEKLY OVERVIEW
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Campaigns"
            value={isLoading ? null : report?.totalCampaignsActive || 0}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Completions"
            value={isLoading ? null : report?.totalCompletionsThisWeek || 0}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Players"
            value={isLoading ? null : report?.totalPlayersThisWeek || 0}
          />
          <StatCard
            icon={<Dumbbell className="w-5 h-5" />}
            label="Weight"
            value={isLoading ? null : formatLargeNumber(report?.totalWeightThisWeek || 0)}
            suffix="lbs"
          />
        </div>
      </motion.div>

      {/* Campaign Sections */}
      <CampaignSection
        title="MOST COMPLETED"
        icon={<TrendingUp className="w-4 h-4" />}
        campaigns={report?.mostCompletedCampaigns || []}
        isLoading={isLoading}
        metric="completions"
        navigate={navigate}
      />

      <CampaignSection
        title="SPEED RECORDS"
        icon={<Zap className="w-4 h-4" />}
        campaigns={report?.fastestCampaigns || []}
        isLoading={isLoading}
        metric="speed"
        navigate={navigate}
      />

      <CampaignSection
        title="GRINDER FAVORITES"
        icon={<RefreshCw className="w-4 h-4" />}
        campaigns={report?.mostReplayedCampaigns || []}
        isLoading={isLoading}
        metric="replay"
        navigate={navigate}
      />
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
  suffix?: string;
}

const StatCard = ({ icon, label, value, suffix }: StatCardProps) => (
  <Card className="bg-card/50 border-border">
    <CardContent className="p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-mono uppercase">{label}</span>
      </div>
      {value === null ? (
        <Skeleton className="h-6 w-16" />
      ) : (
        <div className="font-display text-xl text-foreground">
          {value}
          {suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

// Campaign Section Component
interface CampaignSectionProps {
  title: string;
  icon: React.ReactNode;
  campaigns: any[];
  isLoading: boolean;
  metric: 'completions' | 'speed' | 'replay' | 'score';
  navigate: (path: string) => void;
}

const CampaignSection = ({ title, icon, campaigns, isLoading, metric, navigate }: CampaignSectionProps) => {
  const getMetricValue = (campaign: any) => {
    switch (metric) {
      case 'completions':
        return `${campaign.total_completions} runs`;
      case 'speed':
        return formatCompletionTime(campaign.fastest_completion_seconds);
      case 'replay':
        return `${campaign.replay_rate?.toFixed(0) || 0}% replay`;
      case 'score':
        return `${formatLargeNumber(campaign.total_score)} pts`;
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card/30 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2 text-muted-foreground">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available this week
            </p>
          ) : (
            campaigns.slice(0, 3).map((campaign, index) => (
              <button
                key={campaign.id}
                onClick={() => navigate(`/campaign/${campaign.campaign_id}`)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-primary w-6">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {campaign.campaign_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs font-mono">
                        {getFocusAreaLabel(campaign)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm text-primary">
                    {getMetricValue(campaign)}
                  </p>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== MAIN COMPONENT ====================

const Intel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed');

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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary text-glow-primary">INTEL CENTER</h1>
            <p className="text-xs text-muted-foreground tracking-wider">STATS • FEED • CAMPAIGNS • RANKINGS</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-card border border-border">
            <TabsTrigger 
              value="feed" 
              className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Swords className="w-3.5 h-3.5 mr-1" />
              FEED
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              CAMPAIGNS
            </TabsTrigger>
            <TabsTrigger 
              value="rankings" 
              className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-3.5 h-3.5 mr-1" />
              RANKINGS
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Target className="w-3.5 h-3.5 mr-1" />
              MY STATS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <LiveFeedTab />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignIntelTab />
          </TabsContent>

          <TabsContent value="rankings">
            <RankingsTab />
          </TabsContent>

          <TabsContent value="stats">
            <MyStatsTab />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-8 mt-8 border-t border-border">
          <p className="font-display text-xs text-muted-foreground">
            INTEL CENTER :: ALPHA SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
};

// Rankings Tab (from Stats page)
const RankingsTab = () => {
  const { data: profile } = useProfile();
  const { data: leaderboard, isLoading } = useLeaderboard();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-warning" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Medal className="w-5 h-5 text-accent" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-display">{rank}</span>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12"><div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div></div>;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Trophy className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No rankings yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-4 gap-2 p-3 border-b border-border text-xs text-muted-foreground font-display">
        <span>RANK</span><span>OPERATOR</span><span className="text-right">SCORE</span><span className="text-right">LVL</span>
      </div>
      {leaderboard.map((entry, i) => {
        const entryLevel = Math.max(1, Math.floor(Math.sqrt((entry.total_xp || 0) / 100)) + 1);
        const isCurrentUser = profile && entry.display_name === profile.display_name;
        return (
          <div key={entry.rank || i} className={`grid grid-cols-4 gap-2 p-3 items-center ${isCurrentUser ? 'bg-primary/10 border-l-2 border-primary' : 'border-b border-border/50 last:border-b-0'}`}>
            <div>{getRankIcon(entry.rank || i + 1)}</div>
            <div className={`font-display text-sm ${isCurrentUser ? 'text-primary' : 'text-foreground'} truncate`}>{entry.display_name || 'ANONYMOUS'}</div>
            <div className="text-right font-display text-secondary">{(entry.total_score || 0).toLocaleString()}</div>
            <div className="text-right font-display text-accent">{entryLevel}</div>
          </div>
        );
      })}
    </div>
  );
};

// My Stats Tab (from Stats page)
const MyStatsTab = () => {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();
  const { data: profile } = useProfile();
  const { data: weightHistory } = useWeightHistory();
  const { data: muscleStats } = useMuscleGroupStats();
  const { data: userMilestones } = useUserMilestones();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();

  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const weightEntries = Object.entries(weightHistory || {}).map(([exerciseId, data]) => ({ exerciseId, ...data }));

  if (isAnonymous) {
    return (
      <div className="bg-card border border-warning/30 rounded-lg p-6 text-center">
        <Trophy className="w-8 h-8 mx-auto mb-3 text-warning" />
        <p className="text-warning font-display mb-2">SIGN IN FOR YOUR STATS</p>
        <p className="text-sm text-muted-foreground mb-4">Track your progress, achievements, and personal records.</p>
        <button onClick={() => navigate("/auth")} className="px-4 py-2 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary">SIGN IN</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'SCORE', value: (profile?.total_score || 0).toLocaleString(), color: 'text-primary' },
          { label: 'LEVEL', value: level, color: 'text-secondary' },
          { label: 'SETS', value: profile?.total_sets || 0, color: 'text-accent' },
          { label: 'COMBO', value: `${profile?.max_combo || 0}x`, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded p-2 text-center">
            <div className={`font-display text-lg ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Body Diagram */}
      {muscleStats && muscleStats.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-display text-sm text-muted-foreground mb-3">// COMBAT ANALYSIS</h3>
          <BodyDiagram muscleStats={muscleStats} />
        </div>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-muted-foreground mb-3">// ACHIEVEMENTS</h3>
          <AchievementList achievements={achievements as any} userAchievements={userAchievements as any} />
        </div>
      )}

      {/* Milestones */}
      {userMilestones && userMilestones.length > 0 && (
        <div>
          <h3 className="font-display text-sm text-muted-foreground mb-3">// MILESTONES</h3>
          <MilestoneList userMilestones={userMilestones} />
        </div>
      )}
    </div>
  );
};

export default Intel;
