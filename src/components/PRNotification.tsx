import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Zap } from 'lucide-react';
import { PRCheckResult } from '@/hooks/usePersonalRecords';

interface PRNotificationProps {
  prs: PRCheckResult[];
  show: boolean;
  onComplete: () => void;
}

const recordTypeConfig = {
  WEIGHT: {
    icon: Trophy,
    label: 'MAX WEIGHT',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    borderColor: 'border-yellow-400',
  },
  REPS: {
    icon: Flame,
    label: 'MAX REPS',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    borderColor: 'border-orange-400',
  },
  VOLUME: {
    icon: Zap,
    label: 'MAX VOLUME',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20',
    borderColor: 'border-purple-400',
  },
};

export function PRNotification({ prs, show, onComplete }: PRNotificationProps) {
  if (!prs.length) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-purple-400/30 blur-xl rounded-lg" />
            
            <div className="relative bg-card border-2 border-yellow-400 rounded-lg p-6 text-center">
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="font-display text-5xl text-yellow-400 mb-2 animate-pulse">
                  NEW PR!
                </div>
                <div className="text-muted-foreground text-sm mb-4">
                  {prs[0].exerciseName}
                </div>
              </motion.div>
              
              {/* PR Cards */}
              <div className="space-y-3">
                {prs.map((pr, index) => {
                  const config = recordTypeConfig[pr.recordType];
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={pr.recordType}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <span className={`font-display text-sm ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-display text-2xl ${config.color}`}>
                          {pr.newValue.toLocaleString()}
                          {pr.recordType !== 'REPS' && <span className="text-sm ml-1">lb</span>}
                        </div>
                        {pr.previousValue !== null && (
                          <div className="text-xs text-muted-foreground">
                            was {pr.previousValue.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Tap to continue */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-xs text-muted-foreground"
              >
                Tap to continue
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Smaller inline PR indicator for the kill feed style
export function PRBadge({ recordType }: { recordType: 'WEIGHT' | 'REPS' | 'VOLUME' }) {
  const config = recordTypeConfig[recordType];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display ${config.bgColor} ${config.color} ${config.borderColor} border`}>
      <Icon className="w-3 h-3" />
      PR
    </span>
  );
}
