import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Check, ChevronRight, Info } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { getMissionById } from '@/data/missions';
import { getExerciseById } from '@/data/exercises';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { XPPopup } from '@/components/XPPopup';

const WorkoutSession = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { 
    currentSession, 
    currentExerciseIndex, 
    currentSetIndex, 
    stats,
    startMission, 
    completeSet,
    endSession,
    resetGame,
  } = useGameStore();

  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [lastXPGain, setLastXPGain] = useState({ xp: 0, score: 0, combo: 0, damage: 0 });
  const prevStatsRef = useRef(stats);

  const mission = missionId ? getMissionById(missionId) : null;
  
  useEffect(() => {
    if (missionId && !currentSession) {
      startMission(missionId);
    }
  }, [missionId, currentSession, startMission]);

  useEffect(() => {
    if (mission && currentExerciseIndex < mission.exercises.length) {
      const missionExercise = mission.exercises[currentExerciseIndex];
      setReps(missionExercise.targetReps);
      // Default weight based on previous or typical
      if (weight === 0) setWeight(20);
    }
  }, [currentExerciseIndex, mission]);

  if (!mission || !currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
      </div>
    );
  }

  if (currentSession.status === 'COMPLETED') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="font-display text-6xl md:text-8xl text-primary text-glow-primary mb-4">
            MISSION COMPLETE
          </h1>
          <p className="font-display text-4xl text-secondary mb-8">{mission.codeName}</p>
          
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-10">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="font-display text-4xl text-accent">{stats.score.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">SCORE</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="font-display text-4xl text-secondary">{stats.maxCombo}x</div>
              <div className="text-xs text-muted-foreground">MAX COMBO</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="font-display text-4xl text-primary">{stats.setsCompleted}</div>
              <div className="text-xs text-muted-foreground">SETS</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="font-display text-4xl text-success">{stats.xp}</div>
              <div className="text-xs text-muted-foreground">XP EARNED</div>
            </div>
          </div>

          <button
            onClick={() => {
              resetGame();
              navigate('/');
            }}
            className="px-8 py-4 bg-primary text-primary-foreground font-display text-xl rounded hover:box-glow-primary transition-all"
          >
            CONTINUE
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Guard against out-of-bounds access
  const safeExerciseIndex = Math.min(currentExerciseIndex, mission.exercises.length - 1);
  const missionExercise = mission.exercises[safeExerciseIndex];
  
  if (!missionExercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
      </div>
    );
  }
  
  const exercise = getExerciseById(missionExercise.exerciseId);
  const totalSets = mission.exercises.reduce((acc, e) => acc + e.targetSets, 0);
  const completedSets = mission.exercises.slice(0, safeExerciseIndex).reduce((acc, e) => acc + e.targetSets, 0) + currentSetIndex;
  const progress = (completedSets / totalSets) * 100;

  const handleCompleteSet = () => {
    setIsCompleting(true);
    
    // Capture stats before completing
    const prevStats = { ...stats };
    
    setTimeout(() => {
      completeSet(reps, weight);
      setIsCompleting(false);
      
      // Trigger explosion
      setShowExplosion(true);
      
      // Calculate gains for popup
      setTimeout(() => {
        const newStats = useGameStore.getState().stats;
        setLastXPGain({
          xp: newStats.xp - prevStats.xp,
          score: newStats.score - prevStats.score,
          combo: newStats.combo,
          damage: newStats.damageDealt - prevStats.damageDealt,
        });
        setShowXPPopup(true);
      }, 300);
    }, 200);
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min = 0) => {
    setter(prev => Math.max(min, prev + delta));
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-border">
        <button 
          onClick={() => {
            endSession('ABORTED');
            navigate('/');
          }}
          className="p-2 border border-destructive/50 rounded text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="font-display text-lg text-primary">{mission.codeName}</div>
          <div className="text-xs text-muted-foreground">
            {safeExerciseIndex + 1}/{mission.exercises.length}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-display text-xl text-accent">{stats.combo}x</div>
          <div className="text-xs text-muted-foreground">COMBO</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col p-4">
        {/* Explosion Effect */}
        <ExplosionEffect 
          trigger={showExplosion} 
          onComplete={() => setShowExplosion(false)} 
        />
        
        {/* XP Popup */}
        <XPPopup
          show={showXPPopup}
          xp={lastXPGain.xp}
          score={lastXPGain.score}
          combo={lastXPGain.combo}
          damage={lastXPGain.damage}
          onComplete={() => setShowXPPopup(false)}
        />

        {/* Exercise Info */}
        <motion.div 
          key={currentExerciseIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="font-display text-5xl md:text-7xl text-primary text-glow-primary mb-3 leading-tight">
            {exercise?.name.toUpperCase()}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Set {currentSetIndex + 1} of {missionExercise.targetSets} • Target: {missionExercise.targetReps} reps
          </p>
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors"
          >
            <Info className="w-4 h-4" />
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </button>
        </motion.div>

        {/* Instructions Panel */}
        <AnimatePresence>
          {showInstructions && exercise && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-card border border-border rounded-lg mb-6 overflow-hidden"
            >
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <span className="text-secondary font-display">SETUP:</span>
                  <p className="text-muted-foreground">{exercise.instructions.setup}</p>
                </div>
                <div>
                  <span className="text-secondary font-display">EXECUTION:</span>
                  <p className="text-muted-foreground">{exercise.instructions.execution}</p>
                </div>
                <div>
                  <span className="text-accent font-display">TIPS:</span>
                  <p className="text-muted-foreground">{exercise.instructions.tips}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weight Control */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="text-xs text-muted-foreground text-center mb-3">WEIGHT (LB)</div>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => adjustValue(setWeight, -5)}
              className="tap-target-xl bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Minus className="w-8 h-8" />
            </button>
            <div className="arcade-number text-secondary min-w-[150px] text-center">
              {weight}
            </div>
            <button 
              onClick={() => adjustValue(setWeight, 5)}
              className="tap-target-xl bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Reps Control */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="text-xs text-muted-foreground text-center mb-3">REPS</div>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => adjustValue(setReps, -1)}
              className="tap-target-xl bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Minus className="w-8 h-8" />
            </button>
            <div className="arcade-number text-accent min-w-[150px] text-center">
              {reps}
            </div>
            <button 
              onClick={() => adjustValue(setReps, 1)}
              className="tap-target-xl bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Complete Set Button */}
        <motion.button
          onClick={handleCompleteSet}
          disabled={isCompleting}
          whileTap={{ scale: 0.98 }}
          className={`
            flex-none mt-auto py-6 rounded-lg font-display text-2xl 
            flex items-center justify-center gap-3
            transition-all
            ${isCompleting 
              ? 'bg-success text-success-foreground' 
              : 'bg-primary text-primary-foreground hover:box-glow-primary'
            }
          `}
        >
          {isCompleting ? (
            <Check className="w-8 h-8 animate-combo-pop" />
          ) : (
            <>
              <span>COMPLETE SET</span>
              <ChevronRight className="w-6 h-6" />
            </>
          )}
        </motion.button>

        {/* Score display */}
        <div className="mt-4 flex justify-between text-sm">
          <div className="text-muted-foreground">
            <span className="text-secondary font-display">{stats.score.toLocaleString()}</span> pts
          </div>
          <div className="text-muted-foreground">
            <span className="text-success font-display">{stats.xp}</span> XP
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkoutSession;
