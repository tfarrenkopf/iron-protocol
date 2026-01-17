import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, Plus, Minus, Check, ChevronRight, Info, Scroll, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useMission } from '@/hooks/useMissions';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileStats, useProfile } from '@/hooks/useProfile';
import { useCreateWorkoutSession } from '@/hooks/useWorkoutSessions';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { XPPopup } from '@/components/XPPopup';
import { PRNotification } from '@/components/PRNotification';
import { PRCheckResult } from '@/hooks/usePersonalRecords';
import { useCheckAchievements, Achievement } from '@/hooks/useAchievements';
import { GuestIndicator, MomentOfLossPrompt, ConversionNudge } from '@/components/AnonymousConversion';
import { getWeightedRandomLorePhrase } from '@/data/lorePhrases';
import { useBatchPersist } from '@/hooks/useBatchPersist';

const WorkoutSession = () => {
  const { missionId } = useParams();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { data: mission, isLoading: missionLoading } = useMission(missionId);
  const { data: weightHistory } = useWeightHistory();
  const { data: profile } = useProfile();
  const updateProfileStats = useUpdateProfileStats();
  const createWorkoutSession = useCreateWorkoutSession();
  const batchPersist = useBatchPersist();
  const { checkAndUnlock } = useCheckAchievements();

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
  const [lastXPGain, setLastXPGain] = useState({ xp: 0, score: 0, combo: 0, damage: 0, totalWeight: 0, setsCompleted: 0, totalSets: 0 });
  const [showLore, setShowLore] = useState<'intro' | 'outro' | null>(null);
  const [statsSaved, setStatsSaved] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPRNotification, setShowPRNotification] = useState(false);
  const [newPRs, setNewPRs] = useState<PRCheckResult[]>([]);
  const [currentSetAchievement, setCurrentSetAchievement] = useState<Achievement | null>(null);
  const [currentLorePhrase, setCurrentLorePhrase] = useState<string>('');
  const [showMomentOfLoss, setShowMomentOfLoss] = useState(false);
  const [momentOfLossTrigger, setMomentOfLossTrigger] = useState<'mission_complete' | 'pr_set'>('mission_complete');
  const prevStatsRef = useRef(stats);
  const hasInitialized = useRef(false);

  // Reset game state when entering a new mission
  useEffect(() => {
    // Reset on mount to clear any leftover state from previous sessions
    resetGame();
    hasInitialized.current = false;
    setStatsSaved(false);
    setShowLore(null);
  }, [missionId, resetGame]);

  // Show intro lore when mission is loaded (after reset)
  useEffect(() => {
    if (mission && missionId && !hasInitialized.current && !currentSession) {
      hasInitialized.current = true;
      // Show intro lore if available
      if (mission.intro_lore) {
        setShowLore('intro');
      }
    }
  }, [mission, missionId, currentSession]);

  // Track the last exercise index to only reset reps/weight when moving to a new exercise
  const lastExerciseIndexRef = useRef<number>(-1);

  // Set initial reps and weight when exercise changes (only when moving to a NEW exercise)
  useEffect(() => {
    if (mission && mission.mission_exercises && currentExerciseIndex < mission.mission_exercises.length) {
      // Only reset reps/weight when the exercise actually changes
      if (lastExerciseIndexRef.current !== currentExerciseIndex) {
        lastExerciseIndexRef.current = currentExerciseIndex;
        const missionExercise = mission.mission_exercises[currentExerciseIndex];
        setReps(missionExercise.target_reps);
        
        // Get last weight for this exercise
        const exerciseId = missionExercise.exercise_id;
        const lastWeight = weightHistory?.[exerciseId]?.lastWeight;
        setWeight(lastWeight || 20);
      }
    }
  }, [currentExerciseIndex, mission, weightHistory]);

  // Start the workout store session
  useEffect(() => {
    if (mission && missionId && !currentSession && showLore !== 'intro') {
      // Pass the full mission object to the store
      startMission(mission);
    }
  }, [mission, missionId, currentSession, showLore, startMission]);

  // Save stats and session when mission completes (only once)
  useEffect(() => {
    if (user && currentSession?.status === 'COMPLETED' && !statsSaved && mission) {
      setStatsSaved(true);
      
      // Collect all sets from the session for database persistence
      const allSets: Array<{
        exerciseId: string;
        setNumber: number;
        targetReps: number;
        actualReps: number;
        weight: number;
        unit: string;
        scoreEarned: number;
      }> = [];
      
      // Also collect data for batch weight/PR persist
      const batchSets: Array<{
        exerciseId: string;
        exerciseName: string;
        weight: number;
        reps: number;
        unit: string;
      }> = [];
      
      currentSession.exercises.forEach((exercise, exerciseIndex) => {
        const missionExercise = mission.mission_exercises?.[exerciseIndex];
        const exerciseName = missionExercise?.exercises?.name || 'Unknown Exercise';
        
        exercise.sets.forEach((set) => {
          allSets.push({
            exerciseId: exercise.exerciseId,
            setNumber: set.setNumber,
            targetReps: set.targetReps,
            actualReps: set.actualReps,
            weight: set.weight,
            unit: set.unit,
            scoreEarned: Math.floor(set.actualReps * set.weight),
          });
          
          batchSets.push({
            exerciseId: exercise.exerciseId,
            exerciseName,
            weight: set.weight,
            reps: set.actualReps,
            unit: set.unit,
          });
        });
      });

      // Calculate session duration in seconds
      const startTime = new Date(currentSession.startedAt).getTime();
      const endTime = currentSession.completedAt ? new Date(currentSession.completedAt).getTime() : Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      // Run all persistence in parallel - profile stats, workout session, weight history, and PRs
      Promise.all([
        // Save profile stats
        updateProfileStats.mutateAsync({
          score: stats.score,
          xp: stats.xp,
          sets: stats.setsCompleted,
          reps: stats.totalReps,
          weight: stats.totalWeight,
          maxCombo: stats.maxCombo,
        }).catch(() => {}),
        
        // Save workout session to database with individual sets
        createWorkoutSession.mutateAsync({
          missionId: mission.id,
          missionSnapshot: {
            name: mission.name,
            code_name: mission.code_name,
          },
          scoreEarned: stats.score,
          xpEarned: stats.xp,
          setsCompleted: stats.setsCompleted,
          totalReps: stats.totalReps,
          totalWeight: stats.totalWeight,
          maxCombo: stats.maxCombo,
          damageDealt: stats.damageDealt,
          sets: allSets,
          durationSeconds,
        }).catch(() => {}),
        
        // Batch persist weight history and PRs (replaces per-set calls)
        batchPersist.mutateAsync({
          sets: batchSets,
          sessionId: currentSession.id,
        }).then(result => {
          // Show PR notification if any new PRs were set
          if (result.newPRs.length > 0) {
            setNewPRs(result.newPRs);
            setTimeout(() => setShowPRNotification(true), 1500);
          }
        }).catch(() => {}),
        
        // Check achievements based on final stats
        (async () => {
          try {
            const unlocked = await checkAndUnlock({
              setsCompleted: (profile?.total_sets || 0) + stats.setsCompleted,
              weightLifted: (profile?.total_weight || 0) + stats.totalWeight,
              prsSet: 0, // Will be updated by batch persist
              comboReached: stats.maxCombo,
              workoutHour: new Date().getHours(),
            });
            if (unlocked.length > 0) {
              setCurrentSetAchievement(unlocked[0]);
            }
          } catch (e) {
            // Non-blocking
          }
        })(),
      ]);
      
      if (mission.outro_lore) {
        setShowLore('outro');
      }
    }
  }, [currentSession?.status, user, statsSaved, mission, stats, updateProfileStats, createWorkoutSession, batchPersist, checkAndUnlock, profile]);

  // Show moment of loss prompt for anonymous users after mission complete
  // MUST be before any conditional returns to satisfy React hooks rules
  useEffect(() => {
    if (isAnonymous && currentSession?.status === 'COMPLETED' && !showMomentOfLoss) {
      const timer = setTimeout(() => {
        setMomentOfLossTrigger('mission_complete');
        setShowMomentOfLoss(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentSession?.status, isAnonymous, showMomentOfLoss]);

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
            onClick={() => setShowLore(null)}
            className="px-8 py-4 bg-success text-success-foreground font-display text-xl rounded transition-all hover:opacity-90"
          >
            VIEW RESULTS
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (currentSession?.status === 'COMPLETED') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
      >
        {/* Guest indicator */}
        {isAnonymous && (
          <div className="absolute top-4 left-4">
            <GuestIndicator variant="standard" />
          </div>
        )}

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
            <div className={`bg-card border rounded-lg p-4 ${isAnonymous ? 'border-warning/30' : 'border-border'}`}>
              <div className="font-display text-4xl text-accent">{stats.score.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">SCORE</div>
            </div>
            <div className={`bg-card border rounded-lg p-4 ${isAnonymous ? 'border-warning/30' : 'border-border'}`}>
              <div className="font-display text-4xl text-secondary">{stats.maxCombo}x</div>
              <div className="text-xs text-muted-foreground">MAX COMBO</div>
            </div>
            <div className={`bg-card border rounded-lg p-4 ${isAnonymous ? 'border-warning/30' : 'border-border'}`}>
              <div className="font-display text-4xl text-primary">{stats.setsCompleted}</div>
              <div className="text-xs text-muted-foreground">SETS</div>
            </div>
            <div className={`bg-card border rounded-lg p-4 ${isAnonymous ? 'border-warning/30' : 'border-border'}`}>
              <div className="font-display text-4xl text-success">{stats.xp}</div>
              <div className="text-xs text-muted-foreground">XP EARNED</div>
            </div>
          </div>
          
          {/* Total Weight Lifted */}
          <div className={`bg-card border-2 rounded-lg p-4 max-w-md mx-auto mb-6 ${isAnonymous ? 'border-warning/50' : 'border-accent'}`}>
            <div className="font-display text-5xl text-accent">{stats.totalWeight.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">TOTAL LBS LIFTED</div>
          </div>

          {/* Anonymous conversion nudge */}
          {isAnonymous && (
            <ConversionNudge 
              message="This progress won't be saved" 
              className="max-w-md mx-auto mb-6"
            />
          )}

          <button
            onClick={() => {
              resetGame();
              if (campaignId) {
                navigate(`/campaign/${campaignId}`);
              } else {
                navigate('/');
              }
            }}
            className="px-8 py-4 bg-primary text-primary-foreground font-display text-xl rounded hover:box-glow-primary transition-all"
          >
            CONTINUE
          </button>
        </motion.div>

        {/* Moment of Loss Prompt */}
        <MomentOfLossPrompt
          isOpen={showMomentOfLoss}
          onClose={() => setShowMomentOfLoss(false)}
          trigger={momentOfLossTrigger}
          missionId={mission.id}
          missionSnapshot={{ name: mission.name, code_name: mission.code_name }}
          stats={{
            score: stats.score,
            xp: stats.xp,
            sets: stats.setsCompleted,
            missions: 1,
          }}
          workoutData={{
            totalReps: stats.totalReps,
            totalWeight: stats.totalWeight,
            maxCombo: stats.maxCombo,
            damageDealt: stats.damageDealt,
          }}
        />
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
  const completedSets = stats.setsCompleted;
  const progress = totalSets > 0 ? Math.min(100, (completedSets / totalSets) * 100) : 0;

  const handleCompleteSet = () => {
    if (isCompleting) return; // Prevent double-tap
    setIsCompleting(true);
    
    // Capture stats before completing
    const prevStats = { ...stats };
    
    // Get a random lore phrase for this set (Story 14.1)
    const lorePhrase = getWeightedRandomLorePhrase();
    setCurrentLorePhrase(lorePhrase.text);
    
    // IMMEDIATELY update game state - NO DB operations here!
    completeSet(reps, weight);
    
    // Trigger explosion immediately
    setShowExplosion(true);
    
    // Calculate gains for popup immediately
    const newStats = useGameStore.getState().stats;
    const missionTotalSets = missionExercises.reduce((acc, e) => acc + e.target_sets, 0);
    setLastXPGain({
      xp: newStats.xp - prevStats.xp,
      score: newStats.score - prevStats.score,
      combo: newStats.combo,
      damage: newStats.damageDealt - prevStats.damageDealt,
      totalWeight: newStats.totalWeight,
      setsCompleted: newStats.setsCompleted,
      totalSets: missionTotalSets,
    });
    
    // Show XP popup with minimal delay
    setTimeout(() => {
      setShowXPPopup(true);
      setIsCompleting(false);
    }, 100);
    
    // All DB operations (weight history, PRs, achievements) are now batched
    // and executed once at mission end - see the useEffect for session.status === 'COMPLETED'
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
            // If at least one set is logged, show confirmation
            if (stats.setsCompleted > 0) {
              setShowCancelConfirm(true);
            } else {
              endSession('ABORTED');
              navigate('/');
            }
          }}
          className="p-2 border border-destructive/50 rounded text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="font-display text-lg text-primary">{mission.code_name}</div>
          <div className="text-xs text-muted-foreground">
            {safeExerciseIndex + 1}/{missionExercises.length}
            {isAnonymous && <span className="text-warning ml-2">• GUEST</span>}
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
        
        {/* XP Popup - Story 14.2: Now includes achievement and lore phrase */}
        <XPPopup
          show={showXPPopup}
          xp={lastXPGain.xp}
          score={lastXPGain.score}
          combo={lastXPGain.combo}
          damage={lastXPGain.damage}
          totalWeight={lastXPGain.totalWeight}
          setsCompleted={lastXPGain.setsCompleted}
          totalSets={lastXPGain.totalSets}
          achievement={currentSetAchievement}
          lorePhrase={currentSetAchievement ? undefined : currentLorePhrase}
          onComplete={() => {
            setShowXPPopup(false);
            setCurrentSetAchievement(null);
          }}
        />
        
        {/* PR Notification */}
        <PRNotification
          prs={newPRs}
          show={showPRNotification}
          onComplete={() => {
            setShowPRNotification(false);
            setNewPRs([]);
          }}
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
          <div className="text-xs text-muted-foreground text-center mb-1">WEIGHT (LB)</div>
          <p className="text-xs text-muted-foreground/60 text-center mb-2">0 = bodyweight</p>
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
          <div className="text-xs text-muted-foreground text-center mb-1">REPS</div>
          <p className="text-[10px] text-muted-foreground/60 text-center mb-2">Adjust to match what you actually completed</p>
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

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-destructive rounded-lg p-6 max-w-sm w-full text-center"
            >
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="font-display text-2xl text-destructive mb-2">ABORT MISSION?</h2>
              <p className="text-muted-foreground text-sm mb-2">
                You've logged <span className="text-primary font-display">{stats.setsCompleted}</span> sets so far.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                Retreating now means losing your XP, combo streak, and the glory you've earned. The battlefield doesn't reward quitters.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
                >
                  KEEP FIGHTING
                </button>
                <button
                  onClick={() => {
                    endSession('ABORTED');
                    navigate('/');
                  }}
                  className="w-full py-3 border border-destructive text-destructive font-display rounded hover:bg-destructive/10 transition-all"
                >
                  RETREAT ANYWAY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story 14.2: Achievements now shown inside XPPopup, no separate notification */}
    </div>
  );
};

export default WorkoutSession;
