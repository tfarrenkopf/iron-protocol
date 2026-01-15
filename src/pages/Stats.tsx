import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Dumbbell, Target, Zap, Skull, Crown, Medal, Star } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

// Mock leaderboard data - in production this would come from a database
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'COBRA_KAI', score: 156780, level: 42, streak: 30 },
  { rank: 2, name: 'IRON_WOLF', score: 143250, level: 38, streak: 21 },
  { rank: 3, name: 'NEON_GHOST', score: 128900, level: 35, streak: 14 },
  { rank: 4, name: 'YOU', score: 12450, level: 14, streak: 7, isPlayer: true },
  { rank: 5, name: 'SHADOW_X', score: 11200, level: 12, streak: 5 },
  { rank: 6, name: 'CHROME_88', score: 9800, level: 11, streak: 4 },
  { rank: 7, name: 'PIXEL_FURY', score: 8400, level: 9, streak: 3 },
  { rank: 8, name: 'BYTE_STORM', score: 6200, level: 7, streak: 2 },
];

// Mock weight tracking data
const WEIGHT_HISTORY = [
  { exercise: 'BENCH PRESS', current: 135, pr: 185, trend: 'up', sessions: 12 },
  { exercise: 'OVERHEAD PRESS', current: 95, pr: 115, trend: 'up', sessions: 10 },
  { exercise: 'INCLINE PRESS', current: 115, pr: 135, trend: 'stable', sessions: 8 },
  { exercise: 'DB LATERAL RAISE', current: 25, pr: 30, trend: 'up', sessions: 15 },
  { exercise: 'DB CURLS', current: 35, pr: 40, trend: 'up', sessions: 11 },
  { exercise: 'TRICEP PUSHDOWN', current: 50, pr: 60, trend: 'stable', sessions: 9 },
];

const Stats = () => {
  const navigate = useNavigate();
  const { stats } = useGameStore();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-warning" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Medal className="w-5 h-5 text-accent" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-display">{rank}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span className="text-success">↑</span>;
      case 'down': return <span className="text-destructive">↓</span>;
      default: return <span className="text-muted-foreground">→</span>;
    }
  };

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

        {/* Player Stats Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // YOUR STATS
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'TOTAL SCORE', value: stats.score.toLocaleString(), icon: Target, color: 'text-primary' },
              { label: 'XP EARNED', value: stats.xp.toLocaleString(), icon: Star, color: 'text-success' },
              { label: 'SETS CRUSHED', value: stats.setsCompleted.toString(), icon: Dumbbell, color: 'text-secondary' },
              { label: 'DAMAGE DEALT', value: stats.damageDealt.toLocaleString(), icon: Skull, color: 'text-destructive' },
              { label: 'TOTAL REPS', value: stats.totalReps.toLocaleString(), icon: Zap, color: 'text-accent' },
              { label: 'WEIGHT LIFTED', value: `${(stats.totalWeight / 1000).toFixed(1)}K`, icon: Dumbbell, color: 'text-warning' },
              { label: 'MAX COMBO', value: `${stats.maxCombo}x`, icon: Trophy, color: 'text-secondary' },
              { label: 'AVG WEIGHT', value: stats.setsCompleted > 0 ? Math.round(stats.totalWeight / stats.setsCompleted / stats.totalReps * stats.setsCompleted).toString() : '0', icon: Target, color: 'text-primary' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-3 text-center"
              >
                <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                <div className={`font-display text-xl ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Weight Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // WEIGHT TRACKING
          </h2>
          
          <div className="space-y-2">
            {WEIGHT_HISTORY.map((exercise, i) => (
              <motion.div
                key={exercise.exercise}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-sm text-secondary">
                      {exercise.exercise}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {exercise.sessions} sessions
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl text-accent">
                        {exercise.current}
                      </span>
                      <span className="text-xs text-muted-foreground">lb</span>
                      {getTrendIcon(exercise.trend)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PR: <span className="text-primary font-display">{exercise.pr}</span> lb
                    </div>
                  </div>
                </div>
                
                {/* Progress bar to PR */}
                <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(exercise.current / exercise.pr) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-secondary to-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Leaderboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // GLOBAL RANKINGS
          </h2>
          
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-2 p-3 border-b border-border text-xs text-muted-foreground font-display">
              <span>RANK</span>
              <span>OPERATOR</span>
              <span className="text-right">SCORE</span>
              <span className="text-right">LVL</span>
            </div>
            
            {/* Entries */}
            {MOCK_LEADERBOARD.map((entry, i) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className={`grid grid-cols-4 gap-2 p-3 items-center ${
                  entry.isPlayer 
                    ? 'bg-primary/10 border-l-2 border-primary' 
                    : 'border-b border-border/50 last:border-b-0'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className={`font-display text-sm ${entry.isPlayer ? 'text-primary text-glow-primary' : 'text-foreground'}`}>
                  {entry.name}
                </div>
                
                <div className="text-right font-display text-secondary">
                  {entry.score.toLocaleString()}
                </div>
                
                <div className="text-right">
                  <span className="font-display text-accent">{entry.level}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    🔥{entry.streak}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground/50 text-center mt-4 tracking-wider">
            CLIMB THE RANKS • DEFEAT YOUR RIVALS
          </p>
        </motion.section>
      </div>
    </div>
  );
};

export default Stats;
