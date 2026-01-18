import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { UserMilestone, useMarkMilestoneNotified } from '@/hooks/useMilestones';
import { useEffect, useState } from 'react';

interface MilestoneNotificationProps {
  milestones: UserMilestone[];
}

export function MilestoneNotification({ milestones }: MilestoneNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);
  const markNotified = useMarkMilestoneNotified();
  
  const currentMilestone = milestones[currentIndex];
  
  useEffect(() => {
    if (milestones.length > 0 && !show) {
      // Small delay before showing
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [milestones.length, show]);
  
  const handleDismiss = async () => {
    if (currentMilestone) {
      // Mark as notified
      await markNotified.mutateAsync(currentMilestone.id);
    }
    
    if (currentIndex < milestones.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShow(false);
    }
  };
  
  if (!currentMilestone) return null;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="relative max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{ 
                    opacity: 0, 
                    scale: 1,
                    x: Math.cos(i * 30 * Math.PI / 180) * 100,
                    y: Math.sin(i * 30 * Math.PI / 180) * 100,
                  }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 via-amber-400/40 to-orange-400/40 blur-2xl rounded-lg" />
            
            <div className="relative bg-card border-2 border-yellow-400 rounded-lg p-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, damping: 8 }}
                className="text-6xl mb-4"
              >
                {currentMilestone.milestone.icon || '🏆'}
              </motion.div>
              
              {/* Header */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="font-display text-sm text-yellow-400 uppercase tracking-wider mb-1">
                  Milestone Achieved
                </div>
                <div className="font-display text-3xl text-foreground mb-2">
                  {currentMilestone.milestone.name}
                </div>
                <p className="text-muted-foreground text-sm">
                  {currentMilestone.milestone.description}
                </p>
              </motion.div>
              
              {/* Counter */}
              {milestones.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-sm text-muted-foreground"
                >
                  {currentIndex + 1} of {milestones.length}
                </motion.div>
              )}
              
              {/* Tap to continue */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-sm text-muted-foreground"
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
