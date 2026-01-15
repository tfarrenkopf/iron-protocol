import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Check, ChevronRight, Info, Scroll } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useMission } from '@/hooks/useMissions';
import { useWeightHistory, useUpdateWeight } from '@/hooks/useWeightHistory';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileStats } from '@/hooks/useProfile';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { XPPopup } from '@/components/XPPopup';

const WorkoutSession = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: mission, isLoading: missionLoading } = useMission(missionId);
  const { data: weightHistory } = useWeightHistory();
  const updateWeight = useUpdateWeight();
  const updateProfileStats = useUpdateProfileStats();

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
  const [showLore, setShowLore] = useState<'intro' | 'outro' | null>(null);
  const prevStatsRef = useRef(stats);

  // Start mission when data is loaded
  useEffect(() => {
    if (mission && missionId && !currentSession) {
      // Show intro lore if available
      if (mission.intro_lore) {
        setShowLore('intro');
      }
      // We'll use a custom session tracking since we're using DB missions
    }
  }, [mission, missionId, currentSession]);

  // Set initial reps and weight when exercise changes
  useEffect(() => {
    if (mission && mission.mission_exercises && currentExerciseIndex < mission.mission_exercises.length) {
      const missionExercise = mission.mission_exercises[currentExerciseIndex];
      setReps(missionExercise.target_reps);
      
      // Get last weight for this exercise
      const exerciseId = missionExercise.exercise_id;
      const lastWeight = weightHistory?.[exerciseId]?.lastWeight;
      setWeight(lastWeight || 20);
    }
  }, [currentExerciseIndex, mission, weightHistory]);

  // Start the workout store session
  useEffect(() => {
    if (mission && missionId && !currentSession && showLore !== 'intro') {
      // Pass the full mission object to the store
      startMission(mission);
    }
  }, [mission, missionId, currentSession, showLore, startMission]);

  if (missionLoading || !mission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING MISSION...</div>
      </div>
    );
  }

  // Show intro lore
  if (showLore === 'intro' && mission.intro_lore) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      >
        <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg text-center relative z-10"
        >
          <Scroll className="w-12 h-12 text-secondary mx-auto mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-primary text-glow-primary mb-4">
            {mission.code_name}
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
            {mission.intro_lore}
          </p>
          <button
            onClick={() => setShowLore(null)}
            className="px-8 py-4 bg-primary text-primary-foreground font-display text-xl rounded hover:box-glow-primary transition-all"
          >
            BEGIN ASSAULT
          </button>
        </motion.div>
      </motion.div>
    );
  }

  const missionExercises = mission.mission_exercises || [];

  if (currentSession?.status === 'COMPLETED' || showLore === 'outro') {
    // Save stats to profile if logged in
    if (user && currentSession?.status === 'COMPLETED' && showLore !== 'outro') {
      updateProfileStats.mutate({
        score: stats.score,
        xp: stats.xp,
        sets: stats.setsCompleted,
        reps: stats.totalReps,
        weight: stats.totalWeight,
        maxCombo: stats.maxCombo,
      });
      if (mission.outro_lore) {
        setShowLore('outro');
        return null;
      }
    }

    // Show outro lore
    if (showLore === 'outro' && mission.outro_lore) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        >
          <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-lg text-center relative z-10"
          >
            <h1 className="font-display text-5xl md:text-6xl text-success text-glow-primary mb-4">
              MISSION COMPLETE
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
              {mission.outro_lore}
            </p>
            <button
              onClick={() => {
                setShowLore(null);
              }}
              className="px-8 py-4 bg-success text-success-foreground font-display text-xl rounded transition-all"
            >
              VIEW RESULTS
            </button>
          </motion.div>
        </motion.div>
      );
    }

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
          <p className="font-display text-4xl text-secondary mb-8">{mission.code_name}</p>
          
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
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
          
          {/* Total Weight Lifted */}
          <div className="bg-card border-2 border-accent rounded-lg p-4 max-w-md mx-auto mb-10">
            <div className="font-display text-5xl text-accent">{stats.totalWeight.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">TOTAL LBS LIFTED</div>
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
  const safeExerciseIndex = Math.min(currentExerciseIndex, missionExercises.length - 1);
  const missionExercise = missionExercises[safeExerciseIndex];
  
  if (!missionExercise || !missionExercise.exercises) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
      </div>
    );
  }
  
  const exercise = missionExercise.exercises;
  const totalSets = missionExercises.reduce((acc, e) => acc + e.target_sets, 0);
  const completedSets = missionExercises.slice(0, safeExerciseIndex).reduce((acc, e) => acc + e.target_sets, 0) + currentSetIndex;
  const progress = (completedSets / totalSets) * 100;

  const handleCompleteSet = async () => {
    setIsCompleting(true);
    
    // Capture stats before completing
    const prevStats = { ...stats };
    
    // Save weight to history if logged in
    if (user && missionExercise.exercise_id) {
      try {
        await updateWeight.mutateAsync({
          exerciseId: missionExercise.exercise_id,
          weight,
        });
      } catch (e) {
        // Non-blocking - continue even if weight save fails
      }
    }
    
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
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-border flex-shrink-0">
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
          <div className="font-display text-lg text-primary">{mission.code_name}</div>
          <div className="text-xs text-muted-foreground">
            {safeExerciseIndex + 1}/{missionExercises.length}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-display text-xl text-accent">{stats.combo}x</div>
          <div className="text-xs text-muted-foreground">COMBO</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted flex-shrink-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content - scrollable area */}
      <main className="flex-1 relative z-10 flex flex-col p-4 overflow-y-auto min-h-0">
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
          className="text-center mb-4"
        >
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl text-primary text-glow-primary mb-2 leading-tight break-words">
            {exercise.name?.toUpperCase()}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Set {currentSetIndex + 1} of {missionExercise.target_sets} • Target: {missionExercise.target_reps} reps
          </p>
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors"
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
              className="bg-card border border-border rounded-lg mb-4 overflow-hidden flex-shrink-0"
            >
              <div className="p-4 space-y-3 text-sm">
                {exercise.instructions_setup && (
                  <div>
                    <span className="text-secondary font-display">SETUP:</span>
                    <p className="text-muted-foreground">{exercise.instructions_setup}</p>
                  </div>
                )}
                {exercise.instructions_execution && (
                  <div>
                    <span className="text-secondary font-display">EXECUTION:</span>
                    <p className="text-muted-foreground">{exercise.instructions_execution}</p>
                  </div>
                )}
                {exercise.instructions_tips && (
                  <div>
                    <span className="text-accent font-display">TIPS:</span>
                    <p className="text-muted-foreground">{exercise.instructions_tips}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weight Control */}
        <div className="bg-card border border-border rounded-lg p-4 mb-3 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center mb-3">WEIGHT (LB)</div>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => adjustValue(setWeight, -5)}
              className="tap-target-xl bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Minus className="w-8 h-8" />
            </button>
            <div className="arcade-number text-secondary min-w-[120px] text-center text-5xl md:text-7xl">
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
        <div className="bg-card border border-border rounded-lg p-4 mb-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center mb-3">REPS</div>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => adjustValue(setReps, -1)}
              className="tap-target-xl bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Minus className="w-8 h-8" />
            </button>
            <div className="arcade-number text-accent min-w-[120px] text-center text-5xl md:text-7xl">
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

        {/* Spacer to push button to bottom */}
        <div className="flex-1 min-h-0" />

        {/* Score display */}
        <div className="flex justify-between text-sm mb-3 flex-shrink-0">
          <div className="text-muted-foreground">
            <span className="text-secondary font-display">{stats.score.toLocaleString()}</span> pts
          </div>
          <div className="text-muted-foreground">
            <span className="text-success font-display">{stats.xp}</span> XP
          </div>
        </div>
      </main>

      {/* Fixed Complete Set Button - ALWAYS visible at bottom */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-20 flex-shrink-0">
        <motion.button
          onClick={handleCompleteSet}
          disabled={isCompleting}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full py-5 rounded-lg font-display text-2xl 
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
      </div>
    </div>
  );
};

export default WorkoutSession;
