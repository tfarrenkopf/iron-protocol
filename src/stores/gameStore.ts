import { create } from 'zustand';
import { GameStats, WorkoutSession, ExerciseSet, HIITConfig, TimerPhase } from '@/types/game';

// Bodyweight exercises use a proxy weight of 50 lbs for damage calculation
const BODYWEIGHT_PROXY_WEIGHT = 50;
// Database mission exercise type
export interface DBMissionExercise {
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  rest_between_sets_sec: number;
  exercises?: {
    id: string;
    name: string;
    instructions_setup?: string;
    instructions_execution?: string;
    instructions_tips?: string;
  };
}

// Database mission type
export interface DBMission {
  id: string;
  code_name: string;
  name: string;
  intro_lore?: string;
  outro_lore?: string;
  mission_exercises: DBMissionExercise[];
}

interface GameState {
  // Current session
  currentSession: WorkoutSession | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  currentMission: DBMission | null;
  
  // Stats
  stats: GameStats;
  
  // HIIT Timer
  hiitConfig: HIITConfig | null;
  timerPhase: TimerPhase;
  currentRound: number;
  timeRemaining: number;
  
  // Actions
  startMission: (mission: DBMission) => void;
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
  currentMission: null,
  stats: { ...initialStats },
  
  hiitConfig: null,
  timerPhase: 'IDLE',
  currentRound: 0,
  timeRemaining: 0,
  
  startMission: (mission: DBMission) => {
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      missionId: mission.id,
      startedAt: new Date().toISOString(),
      exercises: mission.mission_exercises.map(e => ({
        exerciseId: e.exercise_id,
        sets: [],
        completed: false,
      })),
      stats: { ...initialStats },
      status: 'IN_PROGRESS',
    };
    
    set({
      currentSession: session,
      currentMission: mission,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      stats: { ...initialStats },
    });
  },
  
  completeSet: (actualReps: number, weight: number) => {
    const { currentSession, currentMission, currentExerciseIndex, currentSetIndex, stats } = get();
    if (!currentSession || !currentMission) return;
    
    const missionExercises = currentMission.mission_exercises;
    if (currentExerciseIndex >= missionExercises.length) return;
    
    const missionExercise = missionExercises[currentExerciseIndex];
    
    const newSet: ExerciseSet = {
      setNumber: currentSetIndex + 1,
      targetReps: missionExercise.target_reps,
      actualReps,
      weight,
      unit: 'lb',
      completed: true,
      timestamp: new Date().toISOString(),
    };
    
    // Calculate score
    // Use proxy weight for bodyweight exercises
    const effectiveWeight = weight > 0 ? weight : BODYWEIGHT_PROXY_WEIGHT;
    const baseScore = actualReps * effectiveWeight;
    const comboMultiplier = 1 + (stats.combo * 0.1);
    const setScore = Math.floor(baseScore * comboMultiplier);
    const damage = Math.floor(effectiveWeight * (actualReps / 10));
    
    const updatedExercises = [...currentSession.exercises];
    updatedExercises[currentExerciseIndex].sets.push(newSet);
    
    const isLastSet = currentSetIndex + 1 >= missionExercise.target_sets;
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
    const { currentSession, currentMission, currentExerciseIndex } = get();
    if (!currentSession || !currentMission) return;
    
    const isLastExercise = currentExerciseIndex + 1 >= currentMission.mission_exercises.length;
    
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
      timeRemaining: 5, // 5 second countdown
    });
  },
  
  setTimerPhase: (phase) => {
    const { hiitConfig } = get();
    if (!hiitConfig) return;
    
    let time = 0;
    if (phase === 'WORK') time = hiitConfig.workDurationSec;
    if (phase === 'REST') time = hiitConfig.restDurationSec;
    if (phase === 'COUNTDOWN') time = 5;
    
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
      currentMission: null,
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
