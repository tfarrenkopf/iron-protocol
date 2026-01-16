import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Achievement, getRarityColor, getRarityGlow } from '@/hooks/useAchievements';

interface LootItem {
  id: number;
  label: string;
  value: string;
  color: string;
  delay: number;
}

interface XPPopupProps {
  show: boolean;
  xp: number;
  score: number;
  combo: number;
  damage?: number;
  totalWeight?: number;
  setsCompleted?: number;
  totalSets?: number;
  achievement?: Achievement | null;
  lorePhrase?: string;
  onComplete?: () => void;
}

export const XPPopup = ({ 
  show, 
  xp, 
  score, 
  combo, 
  damage = 0, 
  totalWeight = 0,
  setsCompleted = 0,
  totalSets = 0,
  achievement,
  lorePhrase,
  onComplete 
}: XPPopupProps) => {
  const [items, setItems] = useState<LootItem[]>([]);
  const [showContainer, setShowContainer] = useState(false);

  useEffect(() => {
    if (show) {
      const lootItems: LootItem[] = [
        {
          id: 1,
          label: 'XP GAINED',
          value: `+${xp}`,
          color: 'text-success',
          delay: 0.1,
        },
        {
          id: 2,
          label: 'SCORE',
          value: `+${score.toLocaleString()}`,
          color: 'text-secondary',
          delay: 0.25,
        },
        {
          id: 3,
          label: 'COMBO',
          value: `${combo}x`,
          color: 'text-accent',
          delay: 0.4,
        },
      ];

      if (damage > 0) {
        lootItems.push({
          id: 4,
          label: 'DAMAGE',
          value: `${damage}`,
          color: 'text-primary',
          delay: 0.55,
        });
      }

      setItems(lootItems);
      setShowContainer(true);

      // Longer display time if showing achievement
      const displayTime = achievement ? 3500 : 2000;

      const timer = setTimeout(() => {
        setShowContainer(false);
        setItems([]);
        onComplete?.();
      }, displayTime);

      return () => clearTimeout(timer);
    }
  }, [show, xp, score, combo, damage, achievement, onComplete]);

  // Determine border color based on achievement rarity or default
  const getBorderStyle = () => {
    if (achievement) {
      const rarityColors: Record<string, string> = {
        legendary: 'hsl(45 100% 50%)',
        epic: 'hsl(280 100% 60%)',
        rare: 'hsl(200 100% 50%)',
        common: 'hsl(343 100% 59%)',
      };
      return {
        borderColor: rarityColors[achievement.rarity] || rarityColors.common,
        boxShadow: `0 0 30px ${rarityColors[achievement.rarity]}80, inset 0 0 20px ${rarityColors[achievement.rarity]}20`,
      };
    }
    return {
      boxShadow: '0 0 30px hsl(343 100% 59% / 0.5), inset 0 0 20px hsl(343 100% 59% / 0.1)',
    };
  };

  return (
    <AnimatePresence>
      {showContainer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
        >
          {/* RPG-style loot box */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative bg-card/95 border-2 border-primary rounded-lg p-6 min-w-[280px] max-w-[340px] backdrop-blur-sm ${
              achievement ? getRarityGlow(achievement.rarity) : ''
            }`}
            style={getBorderStyle()}
          >
            {/* Story 14.2: Achievement Display (replaces standard header when present) */}
            {achievement ? (
              <>
                {/* Achievement Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-center mb-3"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className={`w-5 h-5 ${getRarityColor(achievement.rarity)}`} />
                    <span className="font-display text-sm text-muted-foreground tracking-wider">
                      ACHIEVEMENT UNLOCKED
                    </span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring' }}
                    className="text-4xl mb-2"
                  >
                    {achievement.icon || '🏆'}
                  </motion.div>
                  <div className={`font-display text-xl ${getRarityColor(achievement.rarity)} tracking-wide`}>
                    {achievement.name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                  {achievement.xpReward > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-2 text-sm text-success font-display"
                    >
                      +{achievement.xpReward} BONUS XP
                    </motion.div>
                  )}
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className={`h-0.5 bg-gradient-to-r from-transparent via-current to-transparent mb-3 ${getRarityColor(achievement.rarity)}`}
                />

                {/* Compact stats */}
                <div className="flex justify-between text-sm font-display">
                  <span className="text-success">+{xp} XP</span>
                  <span className="text-secondary">+{score.toLocaleString()}</span>
                  <span className="text-accent">{combo}x</span>
                </div>

                {/* Animated shine for legendary */}
                {achievement.rarity === 'legendary' && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-warning/30 to-transparent pointer-events-none rounded-lg"
                  />
                )}
              </>
            ) : (
              <>
                {/* Standard Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-center mb-4"
                >
                  <div className="font-display text-xl text-primary text-glow-primary tracking-wider">
                    ★ SET COMPLETE ★
                  </div>
                  {/* Story 14.1: Lore phrase display */}
                  {lorePhrase && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-xs text-muted-foreground italic mt-2 max-w-[260px] mx-auto"
                    >
                      "{lorePhrase}"
                    </motion.p>
                  )}
                  {/* Weight progress indicator */}
                  {totalWeight > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-[10px] text-accent mt-1"
                    >
                      {totalWeight.toLocaleString()} lbs lifted
                      {setsCompleted > 0 && totalSets > 0 && (
                        <span className="text-muted-foreground"> • {setsCompleted}/{totalSets} sets</span>
                      )}
                    </motion.div>
                  )}
                  {/* Suggestion to increase */}
                  {combo >= 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="text-[10px] text-success mt-1"
                    >
                      ↑ Increase weight for more damage!
                    </motion.div>
                  )}
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mb-4"
                />

                {/* Loot items - FF7 style list */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, type: 'spring', stiffness: 200 }}
                      className="flex justify-between items-center font-display text-lg"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <motion.span
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: item.delay + 0.1, type: 'spring' }}
                        className={`${item.color} text-glow-${item.color.split('-')[1]} tracking-wider`}
                      >
                        {item.value}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent mt-4"
                />
              </>
            )}

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-50" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-50" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-50" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-50" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
