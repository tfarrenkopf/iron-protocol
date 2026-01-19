import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, Plus, Minus, Check, ChevronRight, Info, Scroll, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore, DBMission } from '@/stores/gameStore';
import { useMission } from '@/hooks/useMissions';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileStats, useProfile } from '@/hooks/useProfile';
import { useCreateWorkoutSession } from '@/hooks/useWorkoutSessions';
import { useMyAssignments, useUpdateAssignmentStatus } from '@/hooks/useAssignments';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { XPPopup } from '@/components/XPPopup';
import { PRNotification } from '@/components/PRNotification';
import { PRCheckResult } from '@/hooks/usePersonalRecords';
import { useCheckAchievements, Achievement } from '@/hooks/useAchievements';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { MissionCompleteScreen } from '@/components/MissionCompleteScreen';
import { getWeightedRandomLorePhrase } from '@/data/lorePhrases';
import { useBatchPersist } from '@/hooks/useBatchPersist';
import { useUpdateCampaignProgress } from '@/hooks/useCampaignProgress';
import { useWeeklyBoss, useApplyBossDamage, calculateBossDamage } from '@/hooks/useWeeklyBoss';

const WorkoutSession = () => {
  const { missionId, assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAnonymous } = useAuth();
  
  // Assignment mode: fetch assignment data
  const { data: assignments, isLoading: assignmentsLoading } = useMyAssignments();
  const updateAssignmentStatus = useUpdateAssignmentStatus();
  
  // Regular mode: fetch mission from DB
  const { data: dbMission, isLoading: missionLoading } = useMission(missionId);
  
  const { data: weightHistory } = useWeightHistory();
  const { data: profile } = useProfile();
  const updateProfileStats = useUpdateProfileStats();
  const createWorkoutSession = useCreateWorkoutSession();
  const batchPersist = useBatchPersist();
  const { checkAndUnlock } = useCheckAchievements();
  const updateCampaignProgress = useUpdateCampaignProgress();
  const { data: activeBoss } = useWeeklyBoss();
  const applyBossDamage = useApplyBossDamage();

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
  const prevStatsRef = useRef(stats);
  const hasInitialized = useRef(false);

  // Cache assignment data to prevent it from disappearing when marked complete
  const [cachedAssignment, setCachedAssignment] = useState<any>(null);
  const [cachedMissionSnapshot, setCachedMissionSnapshot] = useState<any>(null);

  // Determine if we're in assignment mode
  const isAssignmentMode = !!assignmentId;
  
  // Find the live assignment or use cached
  const liveAssignment = assignments?.find((a) => a.id === assignmentId);
  const assignment = liveAssignment || cachedAssignment;
  const missionSnapshot = assignment?.mission_snapshot || cachedMissionSnapshot;

  // Cache assignment when first loaded
  useEffect(() => {
    if (liveAssignment && !cachedAssignment) {
      setCachedAssignment(liveAssignment);
      setCachedMissionSnapshot(liveAssignment.mission_snapshot);
    }
  }, [liveAssignment, cachedAssignment]);

  // Convert assignment snapshot OR use DB mission
  const mission: DBMission | null = isAssignmentMode
    ? missionSnapshot
      ? {
          id: missionSnapshot.id,
          code_name: missionSnapshot.code_name,
          name: missionSnapshot.name,
          intro_lore: missionSnapshot.intro_lore,
          outro_lore: missionSnapshot.outro_lore,
          mission_exercises: (missionSnapshot.mission_exercises || []).map(
            (me: any) => ({
              exercise_id: me.exercise_id,
              target_sets: me.target_sets,
              target_reps: me.target_reps,
              rest_between_sets_sec: me.rest_between_sets_sec,
              exercises: me.exercises,
            }),
          ),
        }
      : null
    : dbMission || null;

  // Determine loading state
  const isLoading = isAssignmentMode 
    ? (assignmentsLoading && !cachedAssignment) 
    : missionLoading;

  // Reset game state when entering a new mission/assignment
  useEffect(() => {
    resetGame();
    hasInitialized.current = false;
    setStatsSaved(false);
    setShowLore(null);
  }, [missionId, assignmentId, resetGame]);

  // Mark assignment as in progress when starting
  useEffect(() => {
    if (isAssignmentMode && user && assignment && assignment.status === 'NOT_STARTED' && !hasInitialized.current) {
      updateAssignmentStatus.mutate({
        assignmentId: assignment.id,
        status: 'IN_PROGRESS',
      });
    }
  }, [isAssignmentMode, user, assignment, hasInitialized.current]);

  // Show intro lore when mission is loaded (after reset)
  useEffect(() => {
    if (mission && !hasInitialized.current && !currentSession) {
      hasInitialized.current = true;
      if (mission.intro_lore) {
        setShowLore('intro');
      }
    }
  }, [mission, currentSession]);

  // Track the last exercise index to only reset reps/weight when moving to a new exercise
  const lastExerciseIndexRef = useRef<number>(-1);

  // Set initial reps and weight when exercise changes
  useEffect(() => {
    if (mission && mission.mission_exercises && currentExerciseIndex < mission.mission_exercises.length) {
      if (lastExerciseIndexRef.current !== currentExerciseIndex) {
        lastExerciseIndexRef.current = currentExerciseIndex;
        const missionExercise = mission.mission_exercises[currentExerciseIndex];
        setReps(missionExercise.target_reps);
        
        const exerciseId = missionExercise.exercise_id;
        const lastWeight = weightHistory?.[exerciseId]?.lastWeight;
        setWeight(lastWeight || 20);
      }
    }
  }, [currentExerciseIndex, mission, weightHistory]);

  // Start the workout store session
  useEffect(() => {
    if (mission && !currentSession && showLore !== 'intro') {
      startMission(mission);
    }
  }, [mission, currentSession, showLore, startMission]);

  // Save stats and session when mission completes (only once)
  useEffect(() => {
    if (currentSession?.status === 'COMPLETED' && !statsSaved && mission) {
      setStatsSaved(true);
      
      const allSets: Array<{
        exerciseId: string;
        setNumber: number;
        targetReps: number;
        actualReps: number;
        weight: number;
        unit: string;
        scoreEarned: number;
      }> = [];
      
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

      const startTime = new Date(currentSession.startedAt).getTime();
      const endTime = currentSession.completedAt ? new Date(currentSession.completedAt).getTime() : Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      // For logged-in users, save everything
      if (user) {
        Promise.all([
          updateProfileStats.mutateAsync({
            score: stats.score,
            xp: stats.xp,
            sets: stats.setsCompleted,
            reps: stats.totalReps,
            weight: stats.totalWeight,
            maxCombo: stats.maxCombo,
          }).catch(() => {}),
          
          createWorkoutSession.mutateAsync({
            missionId: mission.id,
            missionSnapshot: {
              name: mission.name,
              code_name: mission.code_name,
              ...(isAssignmentMode && assignment ? {
                assignment_id: assignment.id,
                handler_name: assignment.handler_name,
              } : {}),
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
          }).then((session) => {
            // Update assignment as completed if in assignment mode
            if (isAssignmentMode && assignment) {
              updateAssignmentStatus.mutate({
                assignmentId: assignment.id,
                status: 'COMPLETED',
                sessionId: session?.id,
              });
            }
            
            // Apply boss damage if there's an active boss
            if (activeBoss && session?.id && user) {
              // Get focus areas from the original database mission
              const focusAreas = dbMission?.focus_areas || [];
              const damageResult = calculateBossDamage(
                stats.setsCompleted,
                stats.totalReps,
                stats.totalWeight,
                focusAreas,
                activeBoss.weaknesses,
                activeBoss.weakness_multiplier
              );
              
              applyBossDamage.mutate({
                userId: user.id,
                sessionId: session.id,
                baseDamage: damageResult.baseDamage,
                bonusDamage: damageResult.bonusDamage,
                weaknessHits: damageResult.weaknessHits,
              });
            }
          }).catch(() => {}),
          
          campaignId ? updateCampaignProgress.mutateAsync({
            campaignId,
            missionId: mission.id,
            sessionData: {
              score: stats.score,
              weight: stats.totalWeight,
              duration_seconds: durationSeconds,
            },
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['collection', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['campaign-progress', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['active-campaign-details'] });
            queryClient.invalidateQueries({ queryKey: ['active-campaign-completed-missions'] });
          }).catch(() => {}) : Promise.resolve(),
          
          batchPersist.mutateAsync({
            sets: batchSets,
            sessionId: currentSession.id,
          }).then(result => {
            if (result.newPRs.length > 0) {
              setNewPRs(result.newPRs);
              setTimeout(() => setShowPRNotification(true), 1500);
            }
          }).catch(() => {}),
          
          (async () => {
            try {
              const unlocked = await checkAndUnlock({
                setsCompleted: (profile?.total_sets || 0) + stats.setsCompleted,
                weightLifted: (profile?.total_weight || 0) + stats.totalWeight,
                prsSet: 0,
                comboReached: stats.maxCombo,
                workoutHour: new Date().getHours(),
              });
              if (unlocked.length > 0) {
                setCurrentSetAchievement(unlocked[0]);
              }
            } catch (e) {}
          })(),
        ]);
      } else {
        // Guest: create anonymous session
        createWorkoutSession.mutate({
          missionId: mission.id,
          missionSnapshot: {
            name: mission.name,
            code_name: mission.code_name,
            is_guest: true,
            ...(isAssignmentMode && assignment ? {
              assignment_id: assignment.id,
              handler_name: assignment.handler_name,
            } : {}),
          },
          scoreEarned: stats.score,
          xpEarned: stats.xp,
          setsCompleted: stats.setsCompleted,
          totalReps: stats.totalReps,
          totalWeight: stats.totalWeight,
          maxCombo: stats.maxCombo,
          damageDealt: stats.damageDealt,
        });
      }
    }
  }, [currentSession?.status, statsSaved, mission, stats, user, assignment, isAssignmentMode, updateProfileStats, createWorkoutSession, batchPersist, checkAndUnlock, profile, campaignId, updateCampaignProgress, queryClient, updateAssignmentStatus]);

  // (Moment of Loss removed - now unified in MissionCompleteScreen)

  if (isLoading || !mission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">
          {isAssignmentMode ? 'LOADING ORDERS...' : 'LOADING MISSION...'}
        </div>
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
          {isAssignmentMode && assignment && (
            <div className="text-xs text-section-orders mb-4 font-display">
              ORDERS FROM: {assignment.handler_name || 'YOUR HANDLER'}
            </div>
          )}
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

  // UNIFIED COMPLETION SCREEN
  if (currentSession?.status === 'COMPLETED') {
    const handleContinue = () => {
      resetGame();
      if (campaignId) {
        navigate(`/campaign/${campaignId}`);
      } else {
        navigate('/');
      }
    };

    return (
      <MissionCompleteScreen
        isGuest={isAnonymous}
        isAssignmentMode={isAssignmentMode}
        assignment={assignment}
        mission={{
          id: mission.id,
          name: mission.name,
          code_name: mission.code_name,
          outro_lore: mission.outro_lore,
        }}
        stats={{
          score: stats.score,
          xp: stats.xp,
          setsCompleted: stats.setsCompleted,
          totalReps: stats.totalReps,
          totalWeight: stats.totalWeight,
          maxCombo: stats.maxCombo,
          damageDealt: stats.damageDealt,
        }}
        boss={activeBoss ? {
          name: activeBoss.name,
          current_hp: activeBoss.current_hp,
          max_hp: activeBoss.max_hp,
          is_defeated: activeBoss.is_defeated,
          weaknesses: activeBoss.weaknesses || [],
        } : null}
        campaignId={campaignId}
        onContinue={handleContinue}
      />
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
    if (isCompleting) return;
    setIsCompleting(true);
    
    const prevStats = { ...stats };
    const lorePhrase = getWeightedRandomLorePhrase();
    setCurrentLorePhrase(lorePhrase.text);
    
    completeSet(reps, weight);
    setShowExplosion(true);
    
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
    
    setTimeout(() => {
      setShowXPPopup(true);
      setIsCompleting(false);
    }, 100);
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
            if (stats.setsCompleted > 0) {
              setShowCancelConfirm(true);
            } else {
              endSession('ABORTED');
              if (campaignId) {
                navigate(`/campaign/${campaignId}`);
              } else {
                navigate('/');
              }
            }
          }}
          className="p-2 border border-destructive/50 rounded text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          {isAssignmentMode && (
            <div className="text-xs text-section-orders mb-1">ORDERS</div>
          )}
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

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col p-4 overflow-y-auto min-h-0">
        <ExplosionEffect 
          trigger={showExplosion} 
          onComplete={() => setShowExplosion(false)} 
        />
        
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
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 mb-3 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center mb-3 sm:mb-4">WEIGHT (LB)</div>
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <button 
              onClick={() => adjustValue(setWeight, -5)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center touch-manipulation"
            >
              <Minus className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>
            <div className="arcade-number text-secondary min-w-[100px] sm:min-w-[140px] text-center text-5xl sm:text-6xl md:text-7xl font-display">{weight}</div>
            <button 
              onClick={() => adjustValue(setWeight, 5)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center touch-manipulation"
            >
              <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>
          </div>
        </div>

        {/* Reps Control */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 mb-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center mb-3 sm:mb-4">REPS</div>
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <button 
              onClick={() => adjustValue(setReps, -1)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center touch-manipulation"
            >
              <Minus className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>
            <div className="arcade-number text-accent min-w-[100px] sm:min-w-[140px] text-center text-5xl sm:text-6xl md:text-7xl font-display">{reps}</div>
            <button 
              onClick={() => adjustValue(setReps, 1)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center touch-manipulation"
            >
              <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>
          </div>
        </div>

        <div className="flex-1" />
      </main>

      {/* Complete Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-20 flex-shrink-0">
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
              <h2 className="font-display text-2xl text-destructive mb-2">
                {isAssignmentMode ? 'ABANDON ORDERS?' : 'ABORT MISSION?'}
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                You've logged <span className="text-primary font-display">{stats.setsCompleted}</span> sets
                {isAssignmentMode ? ' for your handler' : ' so far'}.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                {isAssignmentMode 
                  ? "Deserting your post means losing your XP, combo streak, and disappointing your handler. Real soldiers finish what they start."
                  : "Retreating now means losing your XP, combo streak, and the glory you've earned. The battlefield doesn't reward quitters."
                }
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
                >
                  {isAssignmentMode ? 'COMPLETE ORDERS' : 'KEEP FIGHTING'}
                </button>
                <button
                  onClick={() => {
                    endSession('ABORTED');
                    if (campaignId) {
                      navigate(`/campaign/${campaignId}`);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="w-full py-3 border border-destructive text-destructive font-display rounded hover:bg-destructive/10 transition-all"
                >
                  {isAssignmentMode ? 'ABANDON ANYWAY' : 'RETREAT ANYWAY'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutSession;
