import { motion } from 'framer-motion';
import { Trophy, Lock, HelpCircle } from 'lucide-react';
import { Achievement, UserAchievement, getRarityColor, getRarityBorderColor, getRarityGlow } from '@/hooks/useAchievements';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function AchievementCard({ achievement, isUnlocked, unlockedAt }: AchievementCardProps) {
  const isHidden = achievement.isHidden && !isUnlocked;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isUnlocked ? { scale: 1.02 } : undefined}
      className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
        isUnlocked 
          ? `bg-card ${getRarityBorderColor(achievement.rarity)} ${getRarityGlow(achievement.rarity)}`
          : 'bg-muted/20 border-border/50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
          {isHidden ? (
            <HelpCircle className="w-6 h-6 text-muted-foreground" />
          ) : !isUnlocked ? (
            <Lock className="w-6 h-6 text-muted-foreground" />
          ) : (
            <span>{achievement.icon || '🏆'}</span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-display text-sm ${isUnlocked ? getRarityColor(achievement.rarity) : 'text-muted-foreground'}`}>
              {isHidden ? '???' : achievement.name}
            </h3>
            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
              isUnlocked ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
            }`}>
              {achievement.rarity}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHidden ? achievement.hint : achievement.description}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {achievement.xpReward > 0 && `+${achievement.xpReward} XP`}
            </span>
            {isUnlocked && unlockedAt && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Shine effect for unlocked legendary */}
      {isUnlocked && achievement.rarity === 'legendary' && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-warning/10 to-transparent pointer-events-none"
        />
      )}
    </motion.div>
  );
}

interface AchievementListProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  category?: string;
}

export function AchievementList({ achievements, userAchievements, category }: AchievementListProps) {
  const unlockedMap = new Map(
    userAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
  );
  
  let filtered = achievements;
  if (category) {
    filtered = achievements.filter(a => a.category === category);
  }
  
  // Sort: unlocked first, then by sort_order
  const sorted = [...filtered].sort((a, b) => {
    const aUnlocked = unlockedMap.has(a.id);
    const bUnlocked = unlockedMap.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });
  
  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No achievements in this category</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <AchievementCard
            achievement={achievement}
            isUnlocked={unlockedMap.has(achievement.id)}
            unlockedAt={unlockedMap.get(achievement.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Summary component for dashboard
interface AchievementSummaryProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
}

export function AchievementSummary({ achievements, userAchievements }: AchievementSummaryProps) {
  const unlockedCount = userAchievements.length;
  const totalCount = achievements.filter(a => !a.isHidden).length;
  const hiddenUnlocked = userAchievements.filter(
    ua => achievements.find(a => a.id === ua.achievementId)?.isHidden
  ).length;
  
  const recentUnlocks = userAchievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Achievements</span>
        <div className="text-right">
          <span className="font-display text-primary">{unlockedCount}</span>
          <span className="text-muted-foreground">/{totalCount}</span>
          {hiddenUnlocked > 0 && (
            <span className="text-xs text-warning ml-2">+{hiddenUnlocked} hidden</span>
          )}
        </div>
      </div>
      
      {recentUnlocks.length > 0 && (
        <div className="flex gap-2">
          {recentUnlocks.map(ua => (
            <div
              key={ua.id}
              className="text-xl"
              title={ua.achievement.name}
            >
              {ua.achievement.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
