import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

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
  onComplete?: () => void;
}

export const XPPopup = ({ show, xp, score, combo, damage = 0, onComplete }: XPPopupProps) => {
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

      const timer = setTimeout(() => {
        setShowContainer(false);
        setItems([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, xp, score, combo, damage, onComplete]);

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
            className="relative bg-card/95 border-2 border-primary rounded-lg p-6 min-w-[280px] backdrop-blur-sm"
            style={{
              boxShadow: '0 0 30px hsl(343 100% 59% / 0.5), inset 0 0 20px hsl(343 100% 59% / 0.1)',
            }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-center mb-4"
            >
              <div className="font-display text-xl text-primary text-glow-primary tracking-wider">
                ★ SET COMPLETE ★
              </div>
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

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
