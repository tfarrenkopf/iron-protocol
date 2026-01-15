import { create } from 'zustand';
import { GameStats, WorkoutSession, ExerciseSet, Mission, HIITConfig, TimerPhase } from '@/types/game';
import { getMissionById } from '@/data/missions';
import { getExerciseById } from '@/data/exercises';

interface GameState {
  // Current session
  currentSession: WorkoutSession | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  
  // Stats
  stats: GameStats;
  
  // HIIT Timer
  hiitConfig: HIITConfig | null;
  timerPhase: TimerPhase;
  currentRound: number;
  timeRemaining: number;
  
  // Actions
  startMission: (missionId: string) => void;
  completeSet: (actualReps: number, weight: number) => void;
  nextExercise: () => void;
  endSession: (status: 'COMPLETED' | 'FAILED' | 'ABORTED') => void;
  
  // HIIT Actions
  startHIIT: (config: HIITConfig) => void;
  setTimerPhase: (phase: TimerPhase) => void;
  nextRound: () => void;
  setTimeRemaining: (time: number) => void;
  resetHIIT: () => void;
  
  // Combo system
  incrementCombo: () => void;
  breakCombo: () => void;
  
  // Reset
  resetGame: () => void;
}

const initialStats: GameStats = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  xp: 0,
  damageDealt: 0,
  setsCompleted: 0,
  totalReps: 0,
  totalWeight: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  currentSession: null,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  stats: { ...initialStats },
  
  hiitConfig: null,
  timerPhase: 'IDLE',
  currentRound: 0,
  timeRemaining: 0,
  
  startMission: (missionId: string) => {
    const mission = getMissionById(missionId);
    if (!mission) return;
    
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      missionId,
      startedAt: new Date().toISOString(),
      exercises: mission.exercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: [],
        completed: false,
      })),
      stats: { ...initialStats },
      status: 'IN_PROGRESS',
    };
    
    set({
      currentSession: session,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      stats: { ...initialStats },
    });
  },
  
  completeSet: (actualReps: number, weight: number) => {
    const { currentSession, currentExerciseIndex, currentSetIndex, stats } = get();
    if (!currentSession) return;
    
    const mission = getMissionById(currentSession.missionId);
    if (!mission) return;
    
    const missionExercise = mission.exercises[currentExerciseIndex];
    const exercise = getExerciseById(missionExercise.exerciseId);
    
    const newSet: ExerciseSet = {
      setNumber: currentSetIndex + 1,
      targetReps: missionExercise.targetReps,
      actualReps,
      weight,
      unit: 'lb',
      completed: true,
      timestamp: new Date().toISOString(),
    };
    
    // Calculate score
    const baseScore = actualReps * weight;
    const comboMultiplier = 1 + (stats.combo * 0.1);
    const setScore = Math.floor(baseScore * comboMultiplier);
    const damage = Math.floor(weight * (actualReps / 10));
    
    const updatedExercises = [...currentSession.exercises];
    updatedExercises[currentExerciseIndex].sets.push(newSet);
    
    const isLastSet = currentSetIndex + 1 >= missionExercise.targetSets;
    if (isLastSet) {
      updatedExercises[currentExerciseIndex].completed = true;
    }
    
    set({
      currentSession: {
        ...currentSession,
        exercises: updatedExercises,
      },
      currentSetIndex: isLastSet ? 0 : currentSetIndex + 1,
      stats: {
        ...stats,
        score: stats.score + setScore,
        combo: stats.combo + 1,
        maxCombo: Math.max(stats.maxCombo, stats.combo + 1),
        xp: stats.xp + Math.floor(setScore / 10),
        damageDealt: stats.damageDealt + damage,
        setsCompleted: stats.setsCompleted + 1,
        totalReps: stats.totalReps + actualReps,
        totalWeight: stats.totalWeight + (weight * actualReps),
      },
    });
    
    if (isLastSet) {
      get().nextExercise();
    }
  },
  
  nextExercise: () => {
    const { currentSession, currentExerciseIndex } = get();
    if (!currentSession) return;
    
    const mission = getMissionById(currentSession.missionId);
    if (!mission) return;
    
    const isLastExercise = currentExerciseIndex + 1 >= mission.exercises.length;
    
    if (isLastExercise) {
      get().endSession('COMPLETED');
    } else {
      set({
        currentExerciseIndex: currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
    }
  },
  
  endSession: (status) => {
    const { currentSession, stats } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        completedAt: new Date().toISOString(),
        stats,
        status,
      },
    });
  },
  
  // HIIT Timer
  startHIIT: (config) => {
    set({
      hiitConfig: config,
      timerPhase: 'COUNTDOWN',
      currentRound: 1,
      timeRemaining: 3, // 3 second countdown
    });
  },
  
  setTimerPhase: (phase) => {
    const { hiitConfig } = get();
    if (!hiitConfig) return;
    
    let time = 0;
    if (phase === 'WORK') time = hiitConfig.workDurationSec;
    if (phase === 'REST') time = hiitConfig.restDurationSec;
    if (phase === 'COUNTDOWN') time = 3;
    
    set({ timerPhase: phase, timeRemaining: time });
  },
  
  nextRound: () => {
    const { currentRound, hiitConfig, stats } = get();
    if (!hiitConfig) return;
    
    if (currentRound >= hiitConfig.rounds) {
      set({ timerPhase: 'COMPLETED' });
    } else {
      set({
        currentRound: currentRound + 1,
        timerPhase: 'WORK',
        timeRemaining: hiitConfig.workDurationSec,
        stats: {
          ...stats,
          combo: stats.combo + 1,
          maxCombo: Math.max(stats.maxCombo, stats.combo + 1),
          score: stats.score + 100 * (1 + stats.combo * 0.1),
        },
      });
    }
  },
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  resetHIIT: () => {
    set({
      hiitConfig: null,
      timerPhase: 'IDLE',
      currentRound: 0,
      timeRemaining: 0,
    });
  },
  
  incrementCombo: () => {
    const { stats } = get();
    set({
      stats: {
        ...stats,
        combo: stats.combo + 1,
        maxCombo: Math.max(stats.maxCombo, stats.combo + 1),
      },
    });
  },
  
  breakCombo: () => {
    const { stats } = get();
    set({
      stats: {
        ...stats,
        combo: 0,
      },
    });
  },
  
  resetGame: () => {
    set({
      currentSession: null,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      stats: { ...initialStats },
      hiitConfig: null,
      timerPhase: 'IDLE',
      currentRound: 0,
      timeRemaining: 0,
    });
  },
}));
