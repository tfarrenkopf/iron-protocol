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
            className="bg-card border-2 border-primary rounded-lg p-6 max-w-md w-full relative"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
                className="p-4 bg-primary/10 border border-primary/30 rounded-full"
              >
                <Target className="w-12 h-12 text-primary" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center mb-5">
              <h2 className="font-display text-3xl text-primary text-glow-primary mb-2">
                WELCOME, AGENT
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Turn your workouts into tactical missions. Log sets, build combos, 
                earn XP, and climb the global leaderboard.
              </p>
            </div>

            {/* Content Structure */}
            <div className="bg-background rounded-lg p-4 mb-4 border border-border">
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wide">How It Works:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-section-campaigns/20 mt-0.5">
                    <Flame className="w-4 h-4 text-section-campaigns" />
                  </div>
                  <div className="text-sm">
                    <span className="text-section-campaigns font-medium">Campaigns</span>
                    <p className="text-muted-foreground text-sm mt-0.5 leading-snug">Training programs with multiple missions (e.g., Push Pull Legs)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-section-missions/20 mt-0.5">
                    <Crosshair className="w-4 h-4 text-section-missions" />
                  </div>
                  <div className="text-sm">
                    <span className="text-section-missions font-medium">Missions</span>
                    <p className="text-muted-foreground text-sm mt-0.5 leading-snug">Individual workouts with exercises and rep targets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-section-exercises/20 mt-0.5">
                    <Dumbbell className="w-4 h-4 text-section-exercises" />
                  </div>
                  <div className="text-sm">
                    <span className="text-section-exercises font-medium">Exercises</span>
                    <p className="text-muted-foreground text-sm mt-0.5 leading-snug">The building blocks — squats, curls, presses, etc.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Features */}
            <div className="bg-background rounded-lg p-4 mb-5 border border-border">
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wide">Compete & Train Together:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-section-intel/20">
                    <Target className="w-4 h-4 text-section-intel" />
                  </div>
                  <div className="text-sm">
                    <span className="text-section-intel font-medium">Rival Mode</span>
                    <span className="text-muted-foreground"> — challenge friends head-to-head</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-section-orders/20">
                    <Flame className="w-4 h-4 text-section-orders" />
                  </div>
                  <div className="text-sm">
                    <span className="text-section-orders font-medium">Squads</span>
                    <span className="text-muted-foreground"> — trainers assign missions to athletes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key tip */}
            <p className="text-sm text-center text-accent mb-5 italic">
              Tip: Sign up to save your progress. Guest mode doesn't persist data.
            </p>

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