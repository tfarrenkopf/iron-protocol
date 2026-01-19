import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Zap, Clock, Users, Swords, Target, Shield } from 'lucide-react';
import { useWeeklyBoss, useUserBossDamage, getSyntheticBossData, getSyntheticUserDamage } from '@/hooks/useWeeklyBoss';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export function WeeklyBossWidget() {
  const { user } = useAuth();
  const isGuest = !user;
  
  const { data: boss, isLoading: bossLoading } = useWeeklyBoss();
  const { data: userDamage } = useUserBossDamage();
  
  // Use synthetic data for guests
  const displayBoss = isGuest ? getSyntheticBossData() : boss;
  const displayUserDamage = isGuest ? getSyntheticUserDamage() : userDamage;
  
  if (bossLoading && !isGuest) {
    return (
      <div className="border border-border/50 rounded-lg p-4 bg-card/50 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-4 bg-muted rounded w-2/3 mb-6" />
        <div className="h-8 bg-muted rounded mb-4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }
  
  if (!displayBoss) {
    return null;
  }
  
  const hpPercent = Math.max(0, (displayBoss.current_hp / displayBoss.max_hp) * 100);
  const damageDealtPercent = 100 - hpPercent;
  const deadline = new Date(displayBoss.week_end);
  const timeRemaining = formatDistanceToNow(deadline, { addSuffix: true });
  
  // Determine HP bar color based on remaining HP
  const getHpColor = () => {
    if (hpPercent > 60) return 'bg-destructive';
    if (hpPercent > 30) return 'bg-orange-500';
    return 'bg-yellow-500';
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden border-2 border-destructive/30 rounded-lg bg-gradient-to-br from-card via-card to-destructive/5"
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-destructive/10 via-transparent to-transparent opacity-50" />
      
      {/* Guest banner */}
      {isGuest && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2">
          <p className="text-xs text-amber-200 font-mono tracking-wide text-center">
            SAMPLE DATA PREVIEW — Sign in to contribute damage
          </p>
        </div>
      )}
      
      <div className="relative p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Weekly Raid Label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs font-mono rounded border border-destructive/30 tracking-wider">
                🔥 WEEKLY RAID
              </span>
              {displayBoss.is_defeated && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded">
                  DEFEATED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Skull className="w-5 h-5 text-destructive shrink-0" />
              <h3 className="font-display text-lg sm:text-xl font-bold text-destructive truncate">
                {displayBoss.name.toUpperCase()}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground italic">
              {displayBoss.lore}
            </p>
          </div>
          
          {/* Boss silhouette/icon */}
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-destructive/60" />
          </div>
        </div>
        
        {/* HP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">BOSS HP</span>
            <span className="text-foreground">
              {formatNumber(displayBoss.current_hp)} / {formatNumber(displayBoss.max_hp)}
            </span>
          </div>
          <div className="relative h-6 rounded-full bg-muted/50 overflow-hidden border border-border/50">
            <motion.div
              className={`absolute inset-y-0 left-0 ${getHpColor()} rounded-full`}
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {hpPercent.toFixed(1)}% REMAINING
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {displayBoss.unique_contributors} operatives
            </span>
            <span className="flex items-center gap-1">
              <Swords className="w-3 h-3" />
              {formatNumber(displayBoss.total_damage_dealt)} total damage
            </span>
          </div>
        </div>
        
        {/* Weaknesses */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Target className="w-3 h-3 text-amber-400" />
            <span>WEAKNESSES (×{displayBoss.weakness_multiplier} DAMAGE)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayBoss.weaknesses.map((weakness) => (
              <span
                key={weakness}
                className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-mono rounded border border-amber-500/30"
              >
                {weakness}
              </span>
            ))}
          </div>
        </div>
        
        {/* User contribution */}
        {displayUserDamage && displayUserDamage.total_damage > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">YOUR DAMAGE</span>
              <span className="font-display text-lg font-bold text-primary">
                {formatNumber(displayUserDamage.total_damage)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />
                {displayUserDamage.contribution_count} missions
              </span>
              {displayUserDamage.weakness_hits_count > 0 && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  {displayUserDamage.weakness_hits_count} weakness hits
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Deadline */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Boss resets {timeRemaining}</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {deadline.toLocaleDateString('en-US', { weekday: 'short' })} {deadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {/* Defeat animation overlay */}
      <AnimatePresence>
        {displayBoss.is_defeated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-green-500/10 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-center"
            >
              <Skull className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="font-display text-xl text-green-400 font-bold">BOSS DEFEATED!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
