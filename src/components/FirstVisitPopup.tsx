import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, X, ChevronRight, Flame, Crosshair, Dumbbell } from 'lucide-react';

const STORAGE_KEY = 'iron-protocol-visited';

export const FirstVisitPopup = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (!hasVisited) {
      // Show popup after a brief delay for smoother UX
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const handleViewGuide = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
    navigate('/guide');
  };

  const handleStartNow = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
    navigate('/command');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card border-2 border-primary rounded-lg p-4 max-w-sm w-full relative"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
                className="p-3 bg-primary/10 border border-primary/30 rounded-full"
              >
                <Target className="w-8 h-8 text-primary" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center mb-4">
              <h2 className="font-display text-2xl text-primary text-glow-primary mb-1">
                WELCOME, AGENT
              </h2>
              <p className="text-muted-foreground text-sm">
                Gamify your workouts. Earn XP. Compete.
              </p>
            </div>

            {/* Content Structure */}
            <div className="bg-background rounded-lg p-3 mb-3 border border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-section-campaigns/20">
                    <Flame className="w-3.5 h-3.5 text-section-campaigns" />
                  </div>
                  <span className="text-section-campaigns font-medium text-sm">Campaigns</span>
                  <span className="text-muted-foreground text-sm">— multi-mission programs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-section-missions/20">
                    <Crosshair className="w-3.5 h-3.5 text-section-missions" />
                  </div>
                  <span className="text-section-missions font-medium text-sm">Missions</span>
                  <span className="text-muted-foreground text-sm">— individual workouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-section-exercises/20">
                    <Dumbbell className="w-3.5 h-3.5 text-section-exercises" />
                  </div>
                  <span className="text-section-exercises font-medium text-sm">Exercises</span>
                  <span className="text-muted-foreground text-sm">— squats, curls, etc.</span>
                </div>
              </div>
            </div>

            {/* Social Features */}
            <div className="bg-background rounded-lg p-3 mb-4 border border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-section-intel/20">
                    <Target className="w-3.5 h-3.5 text-section-intel" />
                  </div>
                  <span className="text-section-intel font-medium text-sm">Rivals</span>
                  <span className="text-muted-foreground text-sm">— compete with friends</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-section-orders/20">
                    <Flame className="w-3.5 h-3.5 text-section-orders" />
                  </div>
                  <span className="text-section-orders font-medium text-sm">Squads</span>
                  <span className="text-muted-foreground text-sm">— trainer-assigned workouts</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleStartNow}
                className="w-full py-3 bg-primary text-primary-foreground font-display rounded flex items-center justify-center gap-2 hover:box-glow-primary transition-all"
              >
                START TRAINING
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleViewGuide}
                className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-border rounded hover:border-primary/50"
              >
                <BookOpen className="w-4 h-4" />
                Read the Field Manual
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstVisitPopup;