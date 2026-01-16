import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, X, ChevronRight } from 'lucide-react';

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
            <div className="text-center mb-6">
              <h2 className="font-display text-3xl text-primary text-glow-primary mb-2">
                WELCOME, AGENT
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You've entered the Iron Protocol. This is a gamified workout tracker 
                where every rep counts toward your score and rank.
              </p>
            </div>

            {/* Features preview */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: 'Missions', desc: 'Structured workouts' },
                { label: 'Combos', desc: 'Chain sets for bonus' },
                { label: 'Ranks', desc: 'Global leaderboard' },
              ].map((item) => (
                <div key={item.label} className="bg-background rounded p-2 text-center">
                  <div className="font-display text-xs text-secondary">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleViewGuide}
                className="w-full py-3 bg-primary text-primary-foreground font-display rounded flex items-center justify-center gap-2 hover:box-glow-primary transition-all"
              >
                <BookOpen className="w-5 h-5" />
                VIEW FIELD MANUAL
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                Skip, I'll figure it out
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstVisitPopup;
