import { motion } from 'framer-motion';
import { Users, Trophy, Crown, Medal, Flame } from 'lucide-react';
import { getPopularityTier, formatWarriorCount } from '@/hooks/useMissionStats';

interface PopularityBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function PopularityBadge({ score, size = 'sm' }: PopularityBadgeProps) {
  const tier = getPopularityTier(score);
  if (!tier) return null;
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display ${tier.color} ${
        tier.glow ? 'bg-warning/20 animate-pulse' : 'bg-card border border-border'
      }`}
    >
      {tier.label}
    </motion.span>
  );
}

interface WarriorCountProps {
  count: number;
  className?: string;
}

export function WarriorCount({ count, className = '' }: WarriorCountProps) {
  return (
    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <Users className="w-3 h-3" />
      <span>{formatWarriorCount(count)}</span>
    </div>
  );
}

interface MissionRankBadgeProps {
  rank: number | null;
  totalPlayers: number;
  bestScore?: number | null;
}

export function MissionRankBadge({ rank, totalPlayers, bestScore }: MissionRankBadgeProps) {
  if (!rank || totalPlayers === 0) return null;
  
  const getRankIcon = () => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 text-warning" />;
      case 2: return <Medal className="w-4 h-4 text-slate-400" />;
      case 3: return <Medal className="w-4 h-4 text-amber-600" />;
      default: return <Trophy className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  const getPercentile = () => {
    if (totalPlayers <= 1) return null;
    const percentile = Math.round((1 - (rank - 1) / totalPlayers) * 100);
    return percentile;
  };
  
  const percentile = getPercentile();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-2 bg-card border border-border rounded"
    >
      {getRankIcon()}
      <div className="flex-1">
        <div className="text-sm font-display">
          <span className={rank <= 3 ? 'text-warning' : 'text-primary'}>#{rank}</span>
          <span className="text-muted-foreground"> of {totalPlayers}</span>
        </div>
        {percentile && percentile >= 50 && (
          <div className="text-xs text-muted-foreground">
            Top {100 - percentile}%
          </div>
        )}
      </div>
      {bestScore && (
        <div className="text-right">
          <div className="font-display text-secondary">{bestScore.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">BEST</div>
        </div>
      )}
    </motion.div>
  );
}

interface MissionLeaderboardMiniProps {
  entries: Array<{
    rank: number;
    displayName: string;
    scoreEarned: number;
  }>;
  currentUserId?: string;
}

export function MissionLeaderboardMini({ entries, currentUserId }: MissionLeaderboardMiniProps) {
  if (entries.length === 0) return null;
  
  const top3 = entries.slice(0, 3);
  
  return (
    <div className="space-y-1">
      {top3.map((entry, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`flex items-center gap-2 p-1.5 rounded text-xs ${
            i === 0 ? 'bg-warning/10' : 'bg-card'
          }`}
        >
          <span className={`w-4 font-display ${
            i === 0 ? 'text-warning' : i === 1 ? 'text-slate-400' : 'text-amber-600'
          }`}>
            {entry.rank}
          </span>
          <span className="flex-1 truncate">{entry.displayName}</span>
          <span className="font-display text-primary">{entry.scoreEarned.toLocaleString()}</span>
        </motion.div>
      ))}
    </div>
  );
}

interface HotMissionGlowProps {
  score: number;
  children: React.ReactNode;
}

export function HotMissionGlow({ score, children }: HotMissionGlowProps) {
  const tier = getPopularityTier(score);
  
  if (!tier?.glow) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-warning/30 via-accent/30 to-warning/30 rounded-lg blur-sm animate-pulse" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
