import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
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
  AlertTriangle,
  Share2,
  Play,
  Skull,
  Clock,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { GlobalNav } from '@/components/GlobalNav';
import { RivalWidget } from '@/components/RivalWidget';
import { WeeklyBossWidget } from '@/components/WeeklyBossWidget';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subHours, subDays } from 'date-fns';
import { getWeekBoundaries, getWeekRangeText, WEEK_CONFIG } from '@/lib/weekUtils';
import { SecondaryNav, SecondaryNavTab, TabsContent } from '@/components/SecondaryNav';
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
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useWeeklyBoss, useUserBossDamage, getSyntheticBossData, getSyntheticUserDamage, WeeklyBoss } from '@/hooks/useWeeklyBoss';
import { useBossHistory, getSyntheticBossHistory, HistoricalBoss } from '@/hooks/useBossHistory';
import { BossVictoryScreen } from '@/components/BossVictoryScreen';
import { AppFooter } from '@/components/AppFooter';
// ==================== HACKER PSEUDONYMS ====================
const HACKER_NAMES = [
  'ZERO_COOL', 'ACID_BURN', 'CRASH_OVERRIDE', 'THE_PLAGUE', 'LORD_NIKON',
  'PHANTOM_PHREAK', 'CEREAL_KILLER', 'RAZOR', 'BLADE', 'GHOST_PROTOCOL',
  'NEO', 'MORPHEUS', 'TRINITY', 'CYPHER', 'TANK', 'D4RK_M4TTER',
  'SH4D0W_RUN', 'NETW0RK_GHOST', 'CIPHER_PUNK', 'SILICON_SAINT',
];

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

interface SyntheticRivalStats {
  user_id: string;
  display_name: string;
  weekly_sessions: number;
  weekly_weight: number;
  weekly_sets: number;
  weekly_max_combo: number;
}

interface SyntheticRivalActivity {
  id: string;
  display_name: string;
  completed_at: string;
  mission_id: string;
  mission_snapshot: { name: string; code_name: string };
  score_earned: number;
  total_weight: number;
  max_combo: number;
}

// ==================== SYNTHETIC DATA GENERATORS ====================
function generateSyntheticFeed(missions: any[]): CompletedSession[] {
  if (!missions || missions.length === 0) return [];
  const now = new Date();
  const syntheticSessions: CompletedSession[] = [];
  const sessionCount = 15 + Math.floor(Math.random() * 6);
  
  for (let i = 0; i < sessionCount; i++) {
    const mission = missions[Math.floor(Math.random() * missions.length)];
    const hackerName = HACKER_NAMES[Math.floor(Math.random() * HACKER_NAMES.length)];
    let completedAt: Date;
    if (i < 3) completedAt = subHours(now, 1 + Math.floor(Math.random() * 5));
    else if (i < 8) completedAt = subHours(now, 6 + Math.floor(Math.random() * 42));
    else completedAt = subDays(now, 2 + Math.floor(Math.random() * 5));
    
    syntheticSessions.push({
      id: `synth-${i}-${mission.id}`,
      completed_at: completedAt.toISOString(),
      score_earned: 500 + Math.floor(Math.random() * 2000),
      xp_earned: 100 + Math.floor(Math.random() * 400),
      sets_completed: 8 + Math.floor(Math.random() * 20),
      total_reps: 40 + Math.floor(Math.random() * 100),
      total_weight: 1000 + Math.floor(Math.random() * 15000),
      damage_dealt: 200 + Math.floor(Math.random() * 1000),
      mission_snapshot: { name: mission.name, code_name: mission.code_name },
      mission_id: mission.id,
      user_id: `synth-user-${i}`,
      profiles: { display_name: hackerName },
    });
  }
  return syntheticSessions.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
}

function generateSyntheticCommunityStats(): CommunityStats {
  return {
    activeWarriors: 12 + Math.floor(Math.random() * 20),
    totalWeight: 150000 + Math.floor(Math.random() * 300000),
    totalDamage: 25000 + Math.floor(Math.random() * 50000),
    totalMissions: 45 + Math.floor(Math.random() * 80),
    topDamageDealer: { name: HACKER_NAMES[0], damage: 8500 + Math.floor(Math.random() * 5000) },
    topWeightLifter: { name: HACKER_NAMES[1], weight: 45000 + Math.floor(Math.random() * 30000) },
    topMissionCompleter: { name: HACKER_NAMES[2], missions: 12 + Math.floor(Math.random() * 10) },
  };
}

function generateSyntheticStreakLeaders(): StreakLeader[] {
  return [
    { user_id: 'synth-1', display_name: HACKER_NAMES[0], streak: 7 + Math.floor(Math.random() * 5) },
    { user_id: 'synth-2', display_name: HACKER_NAMES[3], streak: 4 + Math.floor(Math.random() * 3) },
    { user_id: 'synth-3', display_name: HACKER_NAMES[5], streak: 2 + Math.floor(Math.random() * 2) },
  ];
}

function generateSyntheticLeaderboard() {
  return HACKER_NAMES.slice(0, 10).map((name, i) => ({
    rank: i + 1,
    display_name: name,
    total_score: 50000 - (i * 4000) + Math.floor(Math.random() * 2000),
    total_xp: 8000 - (i * 600) + Math.floor(Math.random() * 300),
    total_sets: 200 - (i * 15) + Math.floor(Math.random() * 20),
    max_combo: 15 - i + Math.floor(Math.random() * 3),
  }));
}

function generateSyntheticWarReport() {
  return {
    totalCampaignsActive: 8 + Math.floor(Math.random() * 5),
    totalCompletionsThisWeek: 45 + Math.floor(Math.random() * 30),
    totalPlayersThisWeek: 18 + Math.floor(Math.random() * 12),
    totalWeightThisWeek: 250000 + Math.floor(Math.random() * 150000),
    mostCompletedCampaigns: [
      { id: '1', campaign_id: 'c1', campaign_name: 'IRON FURY', total_completions: 24, campaign_code: 'PUSH' },
      { id: '2', campaign_id: 'c2', campaign_name: 'GHOST PROTOCOL', total_completions: 18, campaign_code: 'FULL' },
      { id: '3', campaign_id: 'c3', campaign_name: 'SHADOW OPS', total_completions: 12, campaign_code: 'PULL' },
    ],
    fastestCampaigns: [
      { id: '1', campaign_id: 'c1', campaign_name: 'QUICK STRIKE', fastest_completion_seconds: 1200, campaign_code: 'CARDIO' },
      { id: '2', campaign_id: 'c2', campaign_name: 'BLITZ ASSAULT', fastest_completion_seconds: 1800, campaign_code: 'UPPER' },
      { id: '3', campaign_id: 'c3', campaign_name: 'RAPID FIRE', fastest_completion_seconds: 2400, campaign_code: 'CORE' },
    ],
    mostReplayedCampaigns: [
      { id: '1', campaign_id: 'c1', campaign_name: 'GRINDER SPECIAL', replay_rate: 85, campaign_code: 'LEGS' },
      { id: '2', campaign_id: 'c2', campaign_name: 'DAILY DOSE', replay_rate: 72, campaign_code: 'PUSH' },
      { id: '3', campaign_id: 'c3', campaign_name: 'PAIN TRAIN', replay_rate: 65, campaign_code: 'FULL' },
    ],
  };
}

function generateSyntheticRivalData(missions: any[]): { stats: SyntheticRivalStats[]; activity: SyntheticRivalActivity[] } {
  const rivalNames = HACKER_NAMES.slice(0, 4);
  const now = new Date();
  
  const stats: SyntheticRivalStats[] = rivalNames.map((name, i) => ({
    user_id: `synth-rival-${i}`,
    display_name: name,
    weekly_sessions: 5 - i + Math.floor(Math.random() * 2),
    weekly_weight: 8000 - (i * 1500) + Math.floor(Math.random() * 3000),
    weekly_sets: 45 - (i * 8) + Math.floor(Math.random() * 10),
    weekly_max_combo: 12 - (i * 2) + Math.floor(Math.random() * 3),
  }));
  
  const activity: SyntheticRivalActivity[] = [];
  if (missions && missions.length > 0) {
    for (let i = 0; i < 5; i++) {
      const mission = missions[Math.floor(Math.random() * missions.length)];
      const rivalName = rivalNames[Math.floor(Math.random() * rivalNames.length)];
      activity.push({
        id: `synth-activity-${i}`,
        display_name: rivalName,
        completed_at: subHours(now, 2 + Math.floor(Math.random() * 24)).toISOString(),
        mission_id: mission.id,
        mission_snapshot: { name: mission.name, code_name: mission.code_name },
        score_earned: 800 + Math.floor(Math.random() * 1500),
        total_weight: 2000 + Math.floor(Math.random() * 8000),
        max_combo: 5 + Math.floor(Math.random() * 10),
      });
    }
  }
  return { stats, activity };
}

// ==================== HOOKS ====================
function usePublicFeed() {
  return useQuery({
    queryKey: ['public-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`id, completed_at, score_earned, xp_earned, sets_completed, total_reps, total_weight, damage_dealt, mission_snapshot, mission_id, user_id, profiles (display_name)`)
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
      const { weekStart, weekEnd } = getWeekBoundaries();
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select(`user_id, total_weight, damage_dealt, profiles (display_name)`)
        .eq('status', 'COMPLETED')
        .gte('completed_at', weekStart)
        .lte('completed_at', weekEnd);
      if (error) throw error;

      const userStats: Record<string, { name: string; weight: number; damage: number; missions: number }> = {};
      sessions?.forEach((session: any) => {
        const userId = session.user_id;
        if (!userStats[userId]) {
          userStats[userId] = { name: session.profiles?.display_name || 'Unknown Agent', weight: 0, damage: 0, missions: 0 };
        }
        userStats[userId].weight += Number(session.total_weight || 0);
        userStats[userId].damage += Number(session.damage_dealt || 0);
        userStats[userId].missions += 1;
      });

      const users = Object.values(userStats);
      const byDamage = [...users].sort((a, b) => b.damage - a.damage);
      const byWeight = [...users].sort((a, b) => b.weight - a.weight);
      const byMissions = [...users].sort((a, b) => b.missions - a.missions);

      return {
        activeWarriors: users.length,
        totalWeight: users.reduce((sum, u) => sum + u.weight, 0),
        totalDamage: users.reduce((sum, u) => sum + u.damage, 0),
        totalMissions: users.reduce((sum, u) => sum + u.missions, 0),
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
        .select(`user_id, completed_at, profiles (display_name)`)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      
      const userWorkouts: Record<string, { dates: Set<string>; display_name: string }> = {};
      data?.forEach((session: any) => {
        if (!session.completed_at) return;
        const userId = session.user_id;
        const date = format(new Date(session.completed_at), 'yyyy-MM-dd');
        if (!userWorkouts[userId]) {
          userWorkouts[userId] = { dates: new Set(), display_name: session.profiles?.display_name || 'Unknown Agent' };
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
            if (diffDays === 1) streak++;
            else break;
          }
        }
        return { user_id: userId, display_name: data.display_name, streak };
      });
      return leaders.sort((a, b) => b.streak - a.streak).slice(0, 3);
    },
  });
}

// ==================== SAMPLE DATA BANNER ====================
const SampleDataBanner = () => (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
    <div>
      <p className="text-xs text-warning font-display">SAMPLE DATA PREVIEW</p>
      <p className="text-xs text-muted-foreground">Sign in to see real community activity</p>
    </div>
  </motion.div>
);

// ==================== OVERVIEW TAB (NEW PRIMARY) ====================
const OverviewTab = ({ isGuest }: { isGuest: boolean }) => {
  const navigate = useNavigate();
  const { data: realCommunityStats } = useCommunityStats();
  const { data: realReport } = useWarReport();
  
  const syntheticStats = useMemo(() => isGuest ? generateSyntheticCommunityStats() : null, [isGuest]);
  const syntheticReport = useMemo(() => isGuest ? generateSyntheticWarReport() : null, [isGuest]);
  
  const communityStats = isGuest ? syntheticStats : realCommunityStats;
  const report = isGuest ? syntheticReport : realReport;
  const weekRangeText = getWeekRangeText();

  return (
    <div className="space-y-6">
      {isGuest && <SampleDataBanner />}
      
      {/* Cycle Label */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span className="uppercase tracking-wider">THIS CYCLE</span>
        <span className="text-muted-foreground/50">•</span>
        <span>{weekRangeText}</span>
      </div>
      
      {/* Weekly Boss - Primary Focus */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <WeeklyBossWidget />
      </motion.div>
      
      {/* Quick Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-display text-lg text-foreground">{communityStats?.activeWarriors || 0}</div>
            <div className="text-xs text-muted-foreground">ACTIVE</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-display text-lg text-foreground">{communityStats?.totalMissions || 0}</div>
            <div className="text-xs text-muted-foreground">MISSIONS</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-display text-lg text-foreground">
              {formatLargeNumber(communityStats?.totalWeight || 0)}
            </div>
            <div className="text-xs text-muted-foreground">LBS</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-display text-lg text-foreground">
              {formatLargeNumber(communityStats?.totalDamage || 0)}
            </div>
            <div className="text-xs text-muted-foreground">DMG</div>
          </div>
        </div>
      </motion.div>
      
      {/* Campaign Highlights */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            CAMPAIGN HIGHLIGHTS
          </h3>
          <div className="space-y-2">
            {report.mostCompletedCampaigns?.slice(0, 3).map((campaign: any, i: number) => (
              <button
                key={campaign.id}
                onClick={() => !isGuest && navigate(`/campaign/${campaign.campaign_id}`)}
                className={`w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg transition-colors ${isGuest ? 'cursor-default' : 'hover:border-muted-foreground'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-muted-foreground w-6">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-medium text-sm text-foreground">{campaign.campaign_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{campaign.total_completions} runs</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/command')}
          className="p-4 bg-card border border-primary/30 rounded-lg hover:border-primary/50 transition-colors text-left"
        >
          <Target className="w-5 h-5 text-primary mb-2" />
          <div className="font-display text-sm text-foreground">START MISSION</div>
          <div className="text-xs text-muted-foreground">Browse available ops</div>
        </button>
        <button
          onClick={() => navigate(isGuest ? '/auth' : '/profile')}
          className="p-4 bg-card border border-border rounded-lg hover:border-muted-foreground transition-colors text-left"
        >
          <BarChart3 className="w-5 h-5 text-muted-foreground mb-2" />
          <div className="font-display text-sm text-foreground">YOUR STATS</div>
          <div className="text-xs text-muted-foreground">{isGuest ? 'Sign in to track' : 'View progress'}</div>
        </button>
      </motion.div>
    </div>
  );
};

// ==================== FEED TAB ====================
const FeedTab = ({ isGuest }: { isGuest: boolean }) => {
  const navigate = useNavigate();
  const { data: realFeed, isLoading: feedLoading } = usePublicFeed();
  const { data: realStreakLeaders } = useStreakLeaders();
  const { data: missions } = useMissions({ showOnlyPublic: true });

  const syntheticFeed = useMemo(() => isGuest && missions ? generateSyntheticFeed(missions) : [], [isGuest, missions]);
  const syntheticStreaks = useMemo(() => isGuest ? generateSyntheticStreakLeaders() : null, [isGuest]);

  const feed = isGuest ? syntheticFeed : realFeed;
  const streakLeaders = isGuest ? syntheticStreaks : realStreakLeaders;
  const isLoading = isGuest ? false : feedLoading;

  const rankIcons = [Crown, Medal, Flame];
  const rankColors = ['text-foreground', 'text-muted-foreground', 'text-muted-foreground'];

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, 'MMM d');
  };

  return (
    <div className="space-y-6">
      {isGuest && <SampleDataBanner />}
      
      {/* Streak Leaders */}
      {streakLeaders && streakLeaders.some(l => l.streak > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-card border border-border rounded-lg">
          <h2 className="font-display text-lg text-muted-foreground mb-4 flex items-center gap-2">
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
                  <span className="font-display text-foreground">{leader.streak} DAY{leader.streak !== 1 ? 'S' : ''}</span>
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
        ) : !feed || feed.length === 0 ? (
          <div className="text-center py-12">
            <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-display text-muted-foreground">NO COMBAT DATA YET</p>
            <p className="text-xs text-muted-foreground mt-2">Be the first to complete a mission</p>
          </div>
        ) : (
          <>
            {feed.slice(0, 10).map((session, i) => {
              const missionName = session.mission_snapshot?.code_name || 'CLASSIFIED MISSION';
              const displayName = session.profiles?.display_name || 'Unknown Agent';
              
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
                        <span className="font-display text-foreground">{displayName}</span>
                        <span className="text-xs text-muted-foreground">completed</span>
                      </div>
                      <div className="font-display text-lg text-muted-foreground">{missionName}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{session.sets_completed} sets</span>
                        <span>{Number(session.total_weight || 0).toLocaleString()} lbs</span>
                        <span>{session.damage_dealt || 0} dmg</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground font-display">
                        {formatRelativeTime(session.completed_at)}
                      </div>
                    </div>
                  </div>
                  
                  {session.mission_id && (
                    <button
                      onClick={() => navigate(`/mission/${session.mission_id}`)}
                      className="mt-3 w-full py-2 border border-section-intel/50 rounded text-sm font-display text-section-intel hover:bg-section-intel/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      JOIN THE MISSION
                    </button>
                  )}
                </motion.div>
              );
            })}
            <div className="text-center py-3 text-xs text-muted-foreground border-t border-border mt-4">
              Showing last 10 combat entries
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== BOSS TAB (NEW) ====================
const BossTab = ({ isGuest }: { isGuest: boolean }) => {
  const { user } = useAuth();
  const [selectedBoss, setSelectedBoss] = useState<HistoricalBoss | null>(null);
  const { data: bossHistory, isLoading: historyLoading } = useBossHistory();
  
  const displayHistory = isGuest ? getSyntheticBossHistory() : bossHistory;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {isGuest && <SampleDataBanner />}
      
      {/* Current Cycle Label */}
      <div className="flex items-center gap-2 text-xs text-destructive/80">
        <Skull className="w-3 h-3" />
        <span className="uppercase tracking-wider">THIS CYCLE • ACTIVE THREAT</span>
      </div>
      
      {/* Current Boss Widget */}
      <WeeklyBossWidget />
      
      {/* Past Bosses Archive */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="uppercase tracking-wider">PREVIOUS CYCLES</span>
        </div>
        
        {historyLoading && !isGuest ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !displayHistory || displayHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No past boss records</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayHistory.map((boss, i) => (
              <motion.div
                key={boss.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-4 hover:border-muted-foreground transition-colors cursor-pointer"
                onClick={() => setSelectedBoss(boss)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Skull className="w-4 h-4 text-muted-foreground" />
                      <span className="font-display text-foreground">{boss.name.toUpperCase()}</span>
                      {boss.is_defeated ? (
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          DEFEATED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          SURVIVED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{boss.lore}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {boss.unique_contributors} contributors
                      </span>
                      <span className="flex items-center gap-1">
                        <Swords className="w-3 h-3" />
                        {formatNumber(boss.total_damage_dealt || 0)} damage
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(boss.week_start), 'MMM d')}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Victory Screen for selected historical boss */}
      {selectedBoss && !isGuest && (
        <BossVictoryScreen
          boss={{
            ...selectedBoss,
            image_url: null,
            total_damage_dealt: selectedBoss.total_damage_dealt || 0,
            unique_contributors: selectedBoss.unique_contributors || 0,
          } as WeeklyBoss}
          onClose={() => setSelectedBoss(null)}
          userId={user?.id}
        />
      )}
    </div>
  );
};

// ==================== CAMPAIGNS TAB ====================
const CampaignsTab = ({ isGuest }: { isGuest: boolean }) => {
  const navigate = useNavigate();
  const { data: realReport, isLoading: realLoading, error } = useWarReport();
  const syntheticReport = useMemo(() => isGuest ? generateSyntheticWarReport() : null, [isGuest]);
  const report = isGuest ? syntheticReport : realReport;
  const isLoading = isGuest ? false : realLoading;

  if (!isGuest && error) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="font-display text-destructive">INTEL UNAVAILABLE</p>
        <p className="text-xs text-muted-foreground mt-2">Campaign data could not be retrieved</p>
      </div>
    );
  }

  const CampaignSection = ({ title, icon, campaigns, metric }: { title: string; icon: React.ReactNode; campaigns: any[]; metric: string }) => {
    const getMetricValue = (campaign: any) => {
      switch (metric) {
        case 'completions': return `${campaign.total_completions} runs`;
        case 'speed': return formatCompletionTime(campaign.fastest_completion_seconds);
        case 'replay': return `${campaign.replay_rate?.toFixed(0) || 0}% replay`;
        default: return '';
      }
    };

    return (
      <Card className="bg-card/30 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2 text-foreground">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          ) : (
            campaigns.slice(0, 3).map((campaign, index) => (
              <button
                key={campaign.id}
                onClick={() => !isGuest && navigate(`/campaign/${campaign.campaign_id}`)}
                className={`w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg transition-colors text-left ${isGuest ? 'cursor-default' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg w-6 text-muted-foreground">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{campaign.campaign_name}</p>
                    <Badge variant="outline" className="text-xs font-mono border-muted text-muted-foreground mt-0.5">
                      {getFocusAreaLabel(campaign)}
                    </Badge>
                  </div>
                </div>
                <p className="font-display text-sm text-muted-foreground">{getMetricValue(campaign)}</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {isGuest && <SampleDataBanner />}
      
      {/* Trust Message */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-section-intel mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            All data shown is <span className="text-foreground font-medium">aggregated and anonymized</span>.
            Player identities are protected by design.
          </p>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          THIS WEEK
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-mono uppercase">Campaigns</span>
              </div>
              <div className="font-display text-xl text-foreground">{report?.totalCampaignsActive || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-mono uppercase">Completions</span>
              </div>
              <div className="font-display text-xl text-foreground">{report?.totalCompletionsThisWeek || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-mono uppercase">Players</span>
              </div>
              <div className="font-display text-xl text-foreground">{report?.totalPlayersThisWeek || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Dumbbell className="w-4 h-4" />
                <span className="text-xs font-mono uppercase">Weight</span>
              </div>
              <div className="font-display text-xl text-foreground">{formatLargeNumber(report?.totalWeightThisWeek || 0)}</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Campaign Sections */}
      <CampaignSection title="MOST COMPLETED" icon={<TrendingUp className="w-4 h-4" />} campaigns={report?.mostCompletedCampaigns || []} metric="completions" />
      <CampaignSection title="SPEED RECORDS" icon={<Zap className="w-4 h-4" />} campaigns={report?.fastestCampaigns || []} metric="speed" />
      <CampaignSection title="GRINDER FAVORITES" icon={<RefreshCw className="w-4 h-4" />} campaigns={report?.mostReplayedCampaigns || []} metric="replay" />
    </div>
  );
};

// ==================== RIVALS TAB ====================
const RivalsTab = ({ isGuest }: { isGuest: boolean }) => {
  const navigate = useNavigate();
  const { data: missions } = useMissions({ showOnlyPublic: true });
  const syntheticData = useMemo(() => generateSyntheticRivalData(missions || []), [missions]);
  const weekRangeText = getWeekRangeText();
  
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return format(date, 'MMM d');
  };
  
  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-3 h-3" />;
    return <span>{index + 1}</span>;
  };
  const getRankColor = (index: number) => index === 0 ? 'bg-foreground/20 text-foreground' : 'bg-muted/20 text-muted-foreground';

  if (!isGuest) {
    return <RivalWidget variant="full" />;
  }
  
  return (
    <div className="space-y-6">
      <SampleDataBanner />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-section-intel/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-section-intel" />
            <h3 className="font-display text-lg text-section-intel">RIVAL MODE</h3>
          </div>
          <Share2 className="w-4 h-4 text-section-intel/50" />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>WEEKLY LEADERBOARD</span>
            </div>
            <div className="text-xs text-muted-foreground">{weekRangeText}</div>
          </div>
          <p className="text-xs text-muted-foreground/70 mb-2">
            {WEEK_CONFIG.resetDescription}. Compete for missions completed this week.
          </p>
          <div className="space-y-2">
            {syntheticData.stats.map((stat, index) => (
              <motion.div key={stat.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-2 rounded bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankColor(index)}`}>
                    {getRankIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{stat.display_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-display text-foreground">{stat.weekly_sessions}</p>
                    <p className="text-xs text-muted-foreground">MISSIONS</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            <span>RIVAL ACTIVITY FEED</span>
          </div>
          <div className="space-y-2">
            {syntheticData.activity.map((activity, index) => (
              <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="p-3 bg-background border border-border rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-display text-sm text-foreground">{activity.display_name}</span>
                    <span className="text-xs text-muted-foreground ml-1">completed</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.completed_at)}</span>
                </div>
                <div className="font-display text-sm text-muted-foreground mb-2">{activity.mission_snapshot?.code_name || 'CLASSIFIED MISSION'}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/80 mb-3">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3 text-muted-foreground/60" />{activity.score_earned.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3 text-muted-foreground/60" />{activity.total_weight.toLocaleString()} lbs</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-muted-foreground/60" />{activity.max_combo}x</span>
                </div>
                <button onClick={() => navigate(`/mission/${activity.mission_id}`)} className="w-full py-2.5 border-2 border-section-intel rounded text-sm font-display text-section-intel hover:bg-section-intel/10 transition-colors flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />
                  ACCEPT CHALLENGE
                </button>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground mb-2">Sign in to track real rivals and compete head-to-head</p>
          <button onClick={() => navigate('/auth')} className="px-4 py-2 bg-section-intel text-white font-display text-sm rounded hover:opacity-90 transition-all">SIGN IN TO COMPETE</button>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== RANKINGS TAB ====================
const RankingsTab = ({ isGuest }: { isGuest: boolean }) => {
  const { data: profile } = useProfile();
  const { data: realLeaderboard, isLoading: realLoading } = useLeaderboard();
  const syntheticLeaderboard = useMemo(() => isGuest ? generateSyntheticLeaderboard() : null, [isGuest]);
  const leaderboard = isGuest ? syntheticLeaderboard : realLeaderboard;
  const isLoading = isGuest ? false : realLoading;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-foreground" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Medal className="w-5 h-5 text-muted-foreground" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-display">{rank}</span>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12"><div className="font-display text-lg text-section-intel animate-neon-pulse">LOADING...</div></div>;
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
    <div className="space-y-4">
      {isGuest && <SampleDataBanner />}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-border text-xs text-muted-foreground font-display">
          <span>RANK</span><span>OPERATOR</span><span className="text-right">SCORE</span><span className="text-right">LVL</span>
        </div>
        {leaderboard.map((entry: any, i: number) => {
          const entryLevel = Math.max(1, Math.floor(Math.sqrt((entry.total_xp || 0) / 100)) + 1);
          const isCurrentUser = !isGuest && profile && entry.display_name === profile.display_name;
          return (
            <div key={entry.rank || i} className={`grid grid-cols-4 gap-2 p-3 items-center ${isCurrentUser ? 'bg-section-intel/10 border-l-2 border-section-intel' : 'border-b border-border/50 last:border-b-0'}`}>
              <div>{getRankIcon(entry.rank || i + 1)}</div>
              <div className={`font-display text-sm ${isCurrentUser ? 'text-section-intel' : 'text-foreground'} truncate`}>{entry.display_name || 'ANONYMOUS'}</div>
              <div className="text-right font-display text-foreground">{(entry.total_score || 0).toLocaleString()}</div>
              <div className="text-right font-display text-muted-foreground">{entryLevel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Intel = () => {
  const { isAnonymous, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const isGuest = !user || isAnonymous;

  const tabs: SecondaryNavTab[] = [
    { id: 'overview', label: 'OVERVIEW', shortLabel: 'OVERVIEW', icon: Eye },
    { id: 'feed', label: 'FEED', shortLabel: 'FEED', icon: Swords },
    { id: 'boss', label: 'BOSS', shortLabel: 'BOSS', icon: Skull, activeColor: 'destructive' },
    { id: 'campaigns', label: 'CAMPAIGNS', shortLabel: 'OPS', icon: Flame },
    { id: 'rivals', label: 'RIVALS', shortLabel: 'RIVALS', icon: Users, activeColor: 'section-rivals', activeTextColor: 'text-black' },
    { id: 'rankings', label: 'RANKINGS', shortLabel: 'RANKS', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        <GlobalNav 
          title="INTEL CENTER"
          subtitle="SITUATIONAL AWARENESS • COMMUNITY • HISTORY"
          section="intel"
        />

        <SecondaryNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          section="intel"
        >
          <TabsContent value="overview"><OverviewTab isGuest={isGuest} /></TabsContent>
          <TabsContent value="feed"><FeedTab isGuest={isGuest} /></TabsContent>
          <TabsContent value="boss"><BossTab isGuest={isGuest} /></TabsContent>
          <TabsContent value="campaigns"><CampaignsTab isGuest={isGuest} /></TabsContent>
          <TabsContent value="rivals"><RivalsTab isGuest={isGuest} /></TabsContent>
          <TabsContent value="rankings"><RankingsTab isGuest={isGuest} /></TabsContent>
        </SecondaryNav>

        <AppFooter />
      </div>
    </div>
  );
};

export default Intel;
