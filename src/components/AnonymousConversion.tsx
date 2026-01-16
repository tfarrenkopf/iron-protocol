import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, Shield, Ghost, Trophy, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

// Persistent guest mode indicator
interface GuestIndicatorProps {
  variant?: 'minimal' | 'standard';
  className?: string;
}

export function GuestIndicator({ variant = 'minimal', className = '' }: GuestIndicatorProps) {
  const navigate = useNavigate();
  
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-1.5 text-warning/80 ${className}`}
      >
        <Ghost className="w-3 h-3" />
        <span className="text-xs font-display tracking-wider">GUEST</span>
      </motion.div>
    );
  }
  
  return (
    <motion.button
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate('/auth')}
      className={`flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded text-warning text-xs hover:bg-warning/20 transition-colors ${className}`}
    >
      <Ghost className="w-3 h-3" />
      <span className="font-display">GUEST RUN</span>
      <span className="text-warning/60">• Progress not saved</span>
    </motion.button>
  );
}

// Stats preview showing what will be lost
interface LossPreviewProps {
  stats: {
    score?: number;
    xp?: number;
    sets?: number;
    prs?: number;
    missions?: number;
  };
}

export function LossPreview({ stats }: LossPreviewProps) {
  const items = [
    { label: 'SCORE', value: stats.score, icon: Trophy, color: 'text-primary' },
    { label: 'XP', value: stats.xp, icon: TrendingUp, color: 'text-success' },
    { label: 'SETS', value: stats.sets, icon: Zap, color: 'text-accent' },
    { label: 'MISSIONS', value: stats.missions, icon: Shield, color: 'text-secondary' },
  ].filter(item => item.value && item.value > 0);
  
  if (items.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-xs text-destructive font-display">WILL BE LOST</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 p-2 bg-card/50 rounded border border-border/50"
          >
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <div>
              <div className={`font-display text-lg ${item.color}`}>
                {item.value?.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Moment of loss prompt - dramatic conversion modal
interface MomentOfLossProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    score?: number;
    xp?: number;
    sets?: number;
    prs?: number;
    missions?: number;
  };
  missionId?: string;
  missionSnapshot?: { name: string; code_name: string };
  workoutData?: {
    totalReps: number;
    totalWeight: number;
    maxCombo: number;
    damageDealt: number;
  };
  trigger?: 'mission_complete' | 'pr_set' | 'exit' | 'milestone';
}

export function MomentOfLossPrompt({ 
  isOpen, 
  onClose, 
  stats, 
  missionId,
  missionSnapshot,
  workoutData,
  trigger = 'mission_complete' 
}: MomentOfLossProps) {
  const navigate = useNavigate();
  
  const headlines: Record<string, { title: string; subtitle: string }> = {
    mission_complete: {
      title: 'MISSION COMPLETE',
      subtitle: 'But your legend fades without a name...',
    },
    pr_set: {
      title: 'NEW RECORD',
      subtitle: 'A feat worth remembering...',
    },
    exit: {
      title: 'LEAVING THE BATTLEFIELD?',
      subtitle: 'Your progress dies here...',
    },
    milestone: {
      title: 'MILESTONE REACHED',
      subtitle: 'But nobody will know...',
    },
  };
  
  const { title, subtitle } = headlines[trigger] || headlines.mission_complete;
  
  const handleSave = () => {
    // Store pending workout data in localStorage for after auth
    if (missionId && stats && workoutData) {
      const pendingWorkout = {
        missionId,
        missionSnapshot,
        scoreEarned: stats.score || 0,
        xpEarned: stats.xp || 0,
        setsCompleted: stats.sets || 0,
        totalReps: workoutData.totalReps,
        totalWeight: workoutData.totalWeight,
        maxCombo: workoutData.maxCombo,
        damageDealt: workoutData.damageDealt,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('pendingWorkout', JSON.stringify(pendingWorkout));
    }
    navigate('/auth', { state: { intent: 'save_progress' } });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-sm"
          >
            {/* Glowing border effect */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-warning via-destructive to-warning rounded-lg blur-sm opacity-50 animate-pulse" />
              
              <div className="relative bg-card border border-border rounded-lg p-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-center mb-4"
                >
                  <Flame className="w-12 h-12 mx-auto text-warning" />
                </motion.div>
                
                {/* Headlines */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <h2 className="font-display text-2xl text-warning text-glow-primary mb-2">
                    {title}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {subtitle}
                  </p>
                </motion.div>
                
                {/* Stats preview */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <LossPreview stats={stats} />
                </motion.div>
                
                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <button
                    onClick={handleSave}
                    className="w-full py-3 bg-primary text-primary-foreground font-display text-lg rounded hover:box-glow-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    SAVE YOUR LEGEND
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-muted-foreground text-sm hover:text-destructive transition-colors font-display"
                  >
                    🔥 LET IT BURN
                  </button>
                </motion.div>
                
                <p className="text-center text-[10px] text-muted-foreground/60 mt-4">
                  Create a free account to save your progress
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline conversion nudge for smaller moments
interface ConversionNudgeProps {
  message?: string;
  className?: string;
}

export function ConversionNudge({ message = "Sign up to save your progress", className = '' }: ConversionNudgeProps) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded ${className}`}
    >
      <div className="flex items-center gap-2">
        <Ghost className="w-4 h-4 text-warning" />
        <span className="text-xs text-warning">{message}</span>
      </div>
      <button
        onClick={() => navigate('/auth')}
        className="px-3 py-1 bg-primary text-primary-foreground text-xs font-display rounded hover:box-glow-primary transition-all"
      >
        SIGN UP
      </button>
    </motion.div>
  );
}
