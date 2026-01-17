import { motion } from 'framer-motion';
import { Target, Trophy, Timer, Zap, Flame, Star, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CampaignProgress } from '@/hooks/useCampaignProgress';

interface CampaignProgressCardProps {
  progress: CampaignProgress | null;
  completedCount: number;
  totalMissions: number;
}

export function CampaignProgressCard({ 
  progress, 
  completedCount, 
  totalMissions 
}: CampaignProgressCardProps) {
  const progressPercent = totalMissions > 0 
    ? Math.round((completedCount / totalMissions) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isComplete = progressPercent === 100;
  const totalRuns = progress?.total_completions || 0;
  
  // Calculate rank based on runs (arcade-style progression)
  const getRank = (runs: number) => {
    if (runs >= 50) return { name: 'LEGEND', color: 'text-yellow-400', icon: Star };
    if (runs >= 25) return { name: 'MASTER', color: 'text-purple-400', icon: Trophy };
    if (runs >= 10) return { name: 'VETERAN', color: 'text-primary', icon: Flame };
    if (runs >= 5) return { name: 'OPERATOR', color: 'text-secondary', icon: Zap };
    if (runs >= 1) return { name: 'ROOKIE', color: 'text-muted-foreground', icon: Target };
    return { name: 'RECRUIT', color: 'text-muted-foreground/50', icon: Target };
  };

  const rank = getRank(totalRuns);
  const RankIcon = rank.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`mb-6 p-4 bg-card border rounded-lg overflow-hidden relative ${
        isComplete ? 'border-secondary' : 'border-border'
      }`}
    >
      {/* Arcade-style background effect */}
      {isComplete && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-accent animate-pulse" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-display text-sm text-primary tracking-wider">
              CAMPAIGN PROGRESS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RankIcon className={`w-4 h-4 ${rank.color}`} />
            <span className={`text-xs font-display ${rank.color}`}>
              {rank.name}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative mb-4">
          <Progress 
            value={progressPercent} 
            className={`h-3 ${isComplete ? '[&>div]:bg-secondary' : ''}`} 
          />
          <div className="absolute right-0 top-0 -mt-5 text-[10px] text-muted-foreground">
            {completedCount} / {totalMissions}
          </div>
        </div>
        
        {/* Stats Grid - Arcade Style */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-background/50 rounded border border-border/50">
            <div className="text-xl font-display text-primary">{progressPercent}%</div>
            <div className="text-[9px] text-muted-foreground tracking-wider">PROGRESS</div>
          </div>
          <div className="p-2 bg-background/50 rounded border border-border/50">
            <div className="text-xl font-display text-secondary flex items-center justify-center gap-1">
              <RotateCcw className="w-3 h-3" />
              {totalRuns}
            </div>
            <div className="text-[9px] text-muted-foreground tracking-wider">RUNS</div>
          </div>
          <div className="p-2 bg-background/50 rounded border border-border/50">
            <div className="text-xl font-display text-accent">
              {progress?.best_completion_time_seconds 
                ? formatTime(progress.best_completion_time_seconds)
                : '--:--'}
            </div>
            <div className="text-[9px] text-muted-foreground tracking-wider">BEST TIME</div>
          </div>
          <div className="p-2 bg-background/50 rounded border border-border/50">
            <motion.div 
              className="text-xl font-display"
              animate={isComplete ? { 
                color: ['hsl(var(--secondary))', 'hsl(var(--primary))', 'hsl(var(--secondary))'],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isComplete ? '✓' : '○'}
            </motion.div>
            <div className="text-[9px] text-muted-foreground tracking-wider">
              {isComplete ? 'CLEARED' : 'IN PROG'}
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-secondary/10 border border-secondary/30 rounded text-center"
          >
            <p className="text-xs text-secondary font-display tracking-wider">
              ⚡ CAMPAIGN COMPLETE ⚡
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Complete missions again to start a new run and beat your best time!
            </p>
          </motion.div>
        )}

        {/* Next milestone hint */}
        {!isComplete && totalRuns > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">
              {completedCount > 0 
                ? `${totalMissions - completedCount} missions left to complete this run`
                : 'Start completing missions to begin your run'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
