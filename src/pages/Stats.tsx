import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Dumbbell, Target, Zap, Crown, Medal, Star } from 'lucide-react';
import { useProfile, useLeaderboard } from '@/hooks/useProfile';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { useMuscleGroupStats } from '@/hooks/useMuscleGroupStats';
import { useAuth } from '@/hooks/useAuth';
import BodyDiagram from '@/components/BodyDiagram';
import { useUserMilestones } from '@/hooks/useMilestones';
import { MilestoneList } from '@/components/MilestoneProgress';

const Stats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { data: weightHistory, isLoading: weightLoading } = useWeightHistory();
  const { data: muscleStats, isLoading: muscleLoading } = useMuscleGroupStats();
  const { data: userMilestones } = useUserMilestones();

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
  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

  // Convert weight history map to array for display
  const weightEntries = Object.entries(weightHistory || {}).map(([exerciseId, data]) => ({
    exerciseId,
    ...data,
  }));

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary text-glow-primary">WAR ROOM</h1>
            <p className="text-xs text-muted-foreground tracking-wider">STATS & LEADERBOARD</p>
          </div>
        </header>

        {/* Leaderboard - FIRST */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
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
                        <span className="text-[10px] text-muted-foreground ml-1">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
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
                { label: 'TOTAL SCORE', value: (profile?.total_score || 0).toLocaleString(), icon: Target, color: 'text-primary' },
                { label: 'XP EARNED', value: (profile?.total_xp || 0).toLocaleString(), icon: Star, color: 'text-success' },
                { label: 'SETS CRUSHED', value: (profile?.total_sets || 0).toString(), icon: Dumbbell, color: 'text-secondary' },
                { label: 'MAX COMBO', value: `${profile?.max_combo || 0}x`, icon: Trophy, color: 'text-accent' },
                { label: 'TOTAL REPS', value: (profile?.total_reps || 0).toLocaleString(), icon: Zap, color: 'text-accent' },
                { label: 'WEIGHT LIFTED', value: `${((profile?.total_weight || 0) / 1000).toFixed(1)}K`, icon: Dumbbell, color: 'text-warning' },
                { label: 'LEVEL', value: level.toString(), icon: Crown, color: 'text-secondary' },
                { label: 'AVG WEIGHT/SET', value: (profile?.total_sets || 0) > 0 ? Math.round((profile?.total_weight || 0) / (profile?.total_sets || 1)).toString() : '0', icon: Target, color: 'text-primary' },
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
                  <div className="text-[10px] text-muted-foreground tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Body Diagram - Muscle Group Focus */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
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
              <BodyDiagram muscleStats={muscleStats || []} />
            </div>
          )}
        </motion.section>

        {/* Weight Stats - THIRD */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // WEIGHT TRACKING
          </h2>
          
          {weightLoading ? (
            <div className="text-center py-4">
              <div className="font-display text-sm text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : weightEntries.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No weight history yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Complete workouts to track your progress.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weightEntries.slice(0, 10).map((entry, i) => (
                <motion.div
                  key={entry.exerciseId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
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
                      transition={{ delay: 0.7 + i * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-secondary to-primary"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Stats;
