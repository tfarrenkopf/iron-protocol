import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Dumbbell, Target, Zap, Crown, Medal, Star, Users, Activity, Award, Weight } from 'lucide-react';
import { useProfile, useLeaderboard } from '@/hooks/useProfile';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { useMuscleGroupStats } from '@/hooks/useMuscleGroupStats';
import { useAuth } from '@/hooks/useAuth';
import BodyDiagram from '@/components/BodyDiagram';
import { useUserMilestones } from '@/hooks/useMilestones';
import { MilestoneList } from '@/components/MilestoneProgress';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { AchievementList } from '@/components/AchievementList';
import { GlobalNav } from '@/components/GlobalNav';
import { AppFooter } from '@/components/AppFooter';

// Section IDs for navigation
const SECTIONS = [
  { id: 'rankings', label: 'RANKINGS', icon: Trophy },
  { id: 'stats', label: 'STATS', icon: Target },
  { id: 'analysis', label: 'BODY', icon: Activity },
  { id: 'milestones', label: 'GOALS', icon: Award },
  { id: 'achievements', label: 'BADGES', icon: Star },
  { id: 'weights', label: 'WEIGHTS', icon: Weight },
] as const;

// Sample data for guest users
const GUEST_SAMPLE_PROFILE = {
  total_score: 8750,
  total_xp: 2450,
  total_sets: 156,
  max_combo: 12,
  total_reps: 1248,
  total_weight: 45600,
};

const GUEST_SAMPLE_WEIGHT_HISTORY = [
  { exerciseId: '1', exerciseName: 'Bench Press', lastWeight: 135, maxWeight: 155, unit: 'lbs' },
  { exerciseId: '2', exerciseName: 'Squat', lastWeight: 185, maxWeight: 205, unit: 'lbs' },
  { exerciseId: '3', exerciseName: 'Deadlift', lastWeight: 225, maxWeight: 245, unit: 'lbs' },
  { exerciseId: '4', exerciseName: 'Overhead Press', lastWeight: 95, maxWeight: 105, unit: 'lbs' },
  { exerciseId: '5', exerciseName: 'Barbell Row', lastWeight: 135, maxWeight: 145, unit: 'lbs' },
];

const GUEST_SAMPLE_MUSCLE_STATS = [
  { muscle_group: 'Chest', total_sets: 24, total_reps: 192, total_volume: 8400 },
  { muscle_group: 'Back', total_sets: 22, total_reps: 176, total_volume: 7800 },
  { muscle_group: 'Quadriceps', total_sets: 20, total_reps: 160, total_volume: 12000 },
  { muscle_group: 'Shoulders', total_sets: 16, total_reps: 128, total_volume: 4200 },
  { muscle_group: 'Biceps', total_sets: 18, total_reps: 144, total_volume: 3600 },
];

const GUEST_SAMPLE_ACHIEVEMENTS = [
  { id: '1', codeName: 'FIRST_BLOOD', name: 'First Blood', description: 'Complete your first workout', icon: '🩸', rarity: 'common' as const, xpReward: 50, category: 'EXPLORATION', triggerType: 'sessions_completed', triggerValue: 1, sortOrder: 1, isHidden: false, hint: null },
  { id: '2', codeName: 'CENTURION', name: 'Centurion', description: 'Complete 100 sets', icon: '🏛️', rarity: 'rare' as const, xpReward: 150, category: 'STRENGTH', triggerType: 'total_sets', triggerValue: 100, sortOrder: 2, isHidden: false, hint: null },
  { id: '3', codeName: 'IRON_WILL', name: 'Iron Will', description: 'Lift 10,000 lbs total', icon: '⚔️', rarity: 'epic' as const, xpReward: 300, category: 'STRENGTH', triggerType: 'total_weight', triggerValue: 10000, sortOrder: 3, isHidden: false, hint: null },
  { id: '4', codeName: 'DEVASTATOR', name: 'Devastator', description: 'Deal 5,000 damage', icon: '💀', rarity: 'rare' as const, xpReward: 200, category: 'STRENGTH', triggerType: 'damage_dealt', triggerValue: 5000, sortOrder: 4, isHidden: false, hint: null },
  { id: '5', codeName: 'COMBO_MASTER', name: 'Combo Master', description: 'Achieve a 10x combo', icon: '🔥', rarity: 'epic' as const, xpReward: 250, category: 'CONSISTENCY', triggerType: 'max_combo', triggerValue: 10, sortOrder: 5, isHidden: false, hint: null },
  { id: '6', codeName: 'HIDDEN_LEGEND', name: '???', description: 'A secret awaits...', icon: '❓', rarity: 'legendary' as const, xpReward: 500, category: 'EXPLORATION', triggerType: 'hidden', triggerValue: 1, sortOrder: 6, isHidden: true, hint: 'The strongest warriors find this on their own...' },
];

const GUEST_SAMPLE_USER_ACHIEVEMENTS = [
  { id: '1', achievementId: '1', unlockedAt: new Date().toISOString(), achievement: GUEST_SAMPLE_ACHIEVEMENTS[0] },
  { id: '2', achievementId: '2', unlockedAt: new Date().toISOString(), achievement: GUEST_SAMPLE_ACHIEVEMENTS[1] },
];

const Stats = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { data: weightHistory, isLoading: weightLoading } = useWeightHistory();
  const { data: muscleStats, isLoading: muscleLoading } = useMuscleGroupStats();
  const { data: userMilestones } = useUserMilestones();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const [activeSection, setActiveSection] = useState('rankings');

  // Use sample data for guests
  const displayProfile = isAnonymous ? GUEST_SAMPLE_PROFILE : profile;
  const displayWeightEntries = isAnonymous 
    ? GUEST_SAMPLE_WEIGHT_HISTORY 
    : Object.entries(weightHistory || {}).map(([exerciseId, data]) => ({ exerciseId, ...data }));
  const displayMuscleStats = isAnonymous ? GUEST_SAMPLE_MUSCLE_STATS : muscleStats;
  const displayAchievements = isAnonymous ? GUEST_SAMPLE_ACHIEVEMENTS : achievements;
  const displayUserAchievements = isAnonymous ? GUEST_SAMPLE_USER_ACHIEVEMENTS : userAchievements;

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = SECTIONS.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      })).filter(s => s.element);

      const scrollPosition = window.scrollY + 150; // Offset for sticky header

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-warning" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Medal className="w-5 h-5 text-accent" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-display">{rank}</span>;
    }
  };

  const getTrendIcon = (current: number, max: number) => {
    if (current >= max) return <span className="text-success">★</span>;
    if (current >= max * 0.9) return <span className="text-success">↑</span>;
    return <span className="text-muted-foreground">→</span>;
  };

  // Calculate level from XP
  const xp = displayProfile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <GlobalNav 
          title="WAR ROOM"
          subtitle="STATS & LEADERBOARD"
        />

        {/* Guest Banner */}
        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm text-warning font-display">👤 SAMPLE DATA PREVIEW</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sign in to track your real stats and appear on the leaderboard.
              </p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground font-display text-sm rounded hover:box-glow-primary transition-all"
            >
              SIGN IN
            </button>
          </motion.div>
        )}

        {/* Story 12.2: Sticky Section Navigation */}
        <nav className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border mb-6 -mx-4 px-4 py-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Leaderboard - FIRST */}
        <motion.section
          id="rankings"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // GLOBAL RANKINGS
          </h2>
          
          {leaderboardLoading ? (
            <div className="text-center py-8">
              <div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No rankings yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Complete workouts to join the leaderboard.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 p-3 border-b border-border text-xs text-muted-foreground font-display">
                <span>RANK</span>
                <span>OPERATOR</span>
                <span className="text-right">SCORE</span>
                <span className="text-right">LVL</span>
              </div>
              
              {/* Entries */}
              {leaderboard.map((entry, i) => {
                const entryXp = entry.total_xp || 0;
                const entryLevel = Math.max(1, Math.floor(Math.sqrt(entryXp / 100)) + 1);
                const isCurrentUser = profile && entry.display_name === profile.display_name;
                
                return (
                  <motion.div
                    key={entry.rank || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`grid grid-cols-4 gap-2 p-3 items-center ${
                      isCurrentUser 
                        ? 'bg-primary/10 border-l-2 border-primary' 
                        : 'border-b border-border/50 last:border-b-0'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank || i + 1)}
                    </div>
                    
                    <div className={`font-display text-sm ${isCurrentUser ? 'text-primary text-glow-primary' : 'text-foreground'} truncate`}>
                      {entry.display_name || 'ANONYMOUS'}
                    </div>
                    
                    <div className="text-right font-display text-secondary">
                      {(entry.total_score || 0).toLocaleString()}
                    </div>
                    
                    <div className="text-right">
                      <span className="font-display text-accent">{entryLevel}</span>
                      {entry.max_combo && entry.max_combo > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          🔥{entry.max_combo}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground/50 text-center mt-4 tracking-wider">
            CLIMB THE RANKS • DEFEAT YOUR RIVALS
          </p>
        </motion.section>

        {/* Player Stats Summary - SECOND */}
        <motion.section
          id="stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // YOUR STATS
          </h2>
          
          {profileLoading ? (
            <div className="text-center py-8">
              <div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'SCORE', value: (displayProfile?.total_score || 0).toLocaleString(), icon: Target, color: isAnonymous ? 'text-muted-foreground' : 'text-primary' },
                { label: 'XP', value: (displayProfile?.total_xp || 0).toLocaleString(), icon: Star, color: isAnonymous ? 'text-muted-foreground' : 'text-success' },
                { label: 'SETS', value: (displayProfile?.total_sets || 0).toString(), icon: Dumbbell, color: isAnonymous ? 'text-muted-foreground' : 'text-secondary' },
                { label: 'COMBO', value: `${displayProfile?.max_combo || 0}x`, icon: Trophy, color: isAnonymous ? 'text-muted-foreground' : 'text-accent' },
                { label: 'REPS', value: (displayProfile?.total_reps || 0).toLocaleString(), icon: Zap, color: isAnonymous ? 'text-muted-foreground' : 'text-accent' },
                { label: 'WEIGHT', value: `${((displayProfile?.total_weight || 0) / 1000).toFixed(1)}K`, icon: Dumbbell, color: isAnonymous ? 'text-muted-foreground' : 'text-warning' },
                { label: 'LEVEL', value: level.toString(), icon: Crown, color: isAnonymous ? 'text-muted-foreground' : 'text-secondary' },
                { label: 'AVG/SET', value: (displayProfile?.total_sets || 0) > 0 ? Math.round((displayProfile?.total_weight || 0) / (displayProfile?.total_sets || 1)).toString() : '0', icon: Target, color: isAnonymous ? 'text-muted-foreground' : 'text-primary' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-card border border-border rounded-lg p-3 text-center"
                >
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div className={`font-display text-xl ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Body Diagram - Muscle Group Focus */}
        <motion.section
          id="analysis"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // COMBAT ANALYSIS
          </h2>
          
          {muscleLoading ? (
            <div className="text-center py-8">
              <div className="font-display text-sm text-primary animate-neon-pulse">SCANNING...</div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4">
              <BodyDiagram muscleStats={displayMuscleStats || []} />
            </div>
          )}
        </motion.section>

        {/* Milestones Section */}
        <motion.section
          id="milestones"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // MILESTONES
          </h2>
          
          {userMilestones && userMilestones.length > 0 ? (
            <MilestoneList userMilestones={userMilestones} />
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No milestone progress yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Complete workouts to unlock achievements.</p>
            </div>
          )}
        </motion.section>

        {/* Achievements Section - Before Weights */}
        <motion.section
          id="achievements"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // ACHIEVEMENTS
          </h2>
          
          {displayAchievements && displayAchievements.length > 0 ? (
            <AchievementList 
              achievements={displayAchievements as any} 
              userAchievements={displayUserAchievements as any} 
            />
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Loading achievements...</p>
            </div>
          )}
        </motion.section>

        {/* Weight Stats - Last */}
        <motion.section
          id="weights"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // WEIGHT TRACKING
          </h2>
          
          {weightLoading ? (
            <div className="text-center py-4">
              <div className="font-display text-sm text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : displayWeightEntries.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No weight history yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Complete workouts to track your progress.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayWeightEntries.slice(0, 10).map((entry, i) => (
                <motion.div
                  key={entry.exerciseId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-display text-sm text-secondary truncate">
                        {entry.exerciseName}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-2xl text-accent">
                          {entry.lastWeight}
                        </span>
                        <span className="text-xs text-muted-foreground">{entry.unit}</span>
                        {getTrendIcon(entry.lastWeight, entry.maxWeight)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PR: <span className="text-primary font-display">{entry.maxWeight}</span> {entry.unit}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar to PR */}
                  <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(entry.lastWeight / entry.maxWeight) * 100}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-secondary to-primary"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Footer */}
        <AppFooter />
      </div>
    </div>
  );
};

export default Stats;
