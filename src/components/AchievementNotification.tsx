import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Achievement, getRarityColor, getRarityGlow } from '@/hooks/useAchievements';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onComplete: () => void;
}

export function AchievementNotification({ achievement, onComplete }: AchievementNotificationProps) {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 3000);
        }}
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-card border-2 rounded-lg p-4 min-w-[280px] ${getRarityGlow(achievement.rarity)}`}
        style={{ borderColor: `hsl(var(--${achievement.rarity === 'legendary' ? 'warning' : achievement.rarity === 'epic' ? 'purple-400' : 'primary'}))` }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-3xl"
          >
            {achievement.icon || '🏆'}
          </motion.div>
          
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <Trophy className={`w-4 h-4 ${getRarityColor(achievement.rarity)}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Achievement Unlocked!
              </span>
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-display text-lg ${getRarityColor(achievement.rarity)}`}
            >
              {achievement.name}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-muted-foreground"
            >
              {achievement.description}
            </motion.p>
            
            {achievement.xpReward > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-xs text-success font-display"
              >
                +{achievement.xpReward} XP
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Animated shine effect for legendary */}
        {achievement.rarity === 'legendary' && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-warning/20 to-transparent pointer-events-none"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
