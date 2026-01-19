import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, X, ChevronRight, Crosshair, Skull, Users, Send, UserPlus, Shield } from 'lucide-react';

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

  const handleCreateAccount = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
    navigate('/auth?mode=signup');
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
    navigate('/command?tab=missions');
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
                Fitness through action, not tracking.
              </p>
            </div>

            {/* What Makes This Different */}
            <div className="bg-background rounded-lg p-3 mb-4 border border-border space-y-3">
              {/* Missions */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-section-missions/20 mt-0.5">
                  <Crosshair className="w-4 h-4 text-section-missions" />
                </div>
                <div>
                  <span className="text-section-missions font-display text-sm">MISSIONS</span>
                  <p className="text-muted-foreground text-xs">
                    Pick a workout. Execute it. Done.
                  </p>
                </div>
              </div>

              {/* Weekly Raid */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-destructive/20 mt-0.5">
                  <Skull className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <span className="text-destructive font-display text-sm">WEEKLY RAID</span>
                  <p className="text-muted-foreground text-xs">
                    Every workout deals damage to a shared boss. Take it down together.
                  </p>
                </div>
              </div>

              {/* Rivals */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-section-intel/20 mt-0.5">
                  <Users className="w-4 h-4 text-section-intel" />
                </div>
                <div>
                  <span className="text-section-intel font-display text-sm">RIVALS</span>
                  <p className="text-muted-foreground text-xs">
                    Challenge friends. Compare weekly stats.
                  </p>
                </div>
              </div>

              {/* Send Orders */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-warning/20 mt-0.5">
                  <Send className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <span className="text-warning font-display text-sm">SEND ORDERS</span>
                  <p className="text-muted-foreground text-xs">
                    Assign workouts to others. Hold them accountable.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Statement */}
            <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="text-xs">No tracking. No ads. Your data stays yours.</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleCreateAccount}
                className="w-full py-3 bg-primary text-primary-foreground font-display rounded flex items-center justify-center gap-2 hover:box-glow-primary transition-all"
              >
                <UserPlus className="w-5 h-5" />
                CREATE ACCOUNT
              </button>
              <button
                onClick={handleContinueAsGuest}
                className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-border rounded hover:border-primary/50"
              >
                <ChevronRight className="w-4 h-4" />
                Continue as Guest
              </button>
              <button
                onClick={handleViewGuide}
                className="w-full py-2 text-muted-foreground/70 font-display text-xs hover:text-muted-foreground transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-3 h-3" />
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