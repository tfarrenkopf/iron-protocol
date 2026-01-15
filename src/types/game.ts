// IRON PROTOCOL - Core Game Types

export type Equipment = 'BENCH' | 'DUMBBELLS' | 'BARBELL';
export type FocusArea = 'PUSH' | 'PULL' | 'SHOULDERS' | 'CHEST' | 'ARMS' | 'CORE' | 'CARDIO' | 'RECOVERY';

export interface Exercise {
  id: string;
  name: string;
  equipment: Equipment[];
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  focusAreas: FocusArea[];
  instructions: {
    setup: string;
    execution: string;
    tips: string;
  };
  isDefault: boolean;
}

export interface ExerciseSet {
  setNumber: number;
  targetReps: number | null;
  actualReps: number;
  weight: number;
  unit: 'kg' | 'lb';
  completed: boolean;
  timestamp?: string;
}

export interface Mission {
  id: string;
  name: string;
  codeName: string;
  description: string;
  focusAreas: FocusArea[];
  exercises: MissionExercise[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  isDefault: boolean;
}

export interface MissionExercise {
  exerciseId: string;
  exercise?: Exercise;
  targetSets: number;
  targetReps: number;
  restBetweenSetsSec: number;
}

export interface HIITConfig {
  id: string;
  name: string;
  codeName: string;
  workDurationSec: number;
  restDurationSec: number;
  rounds: number;
  isDefault: boolean;
}

export type TimerPhase = 'IDLE' | 'COUNTDOWN' | 'WORK' | 'REST' | 'COMPLETED';

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  xp: number;
  damageDealt: number;
  setsCompleted: number;
  totalReps: number;
  totalWeight: number;
}

export interface WorkoutSession {
  id: string;
  missionId: string;
  startedAt: string;
  completedAt?: string;
  exercises: WorkoutExerciseLog[];
  stats: GameStats;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABORTED';
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  sets: ExerciseSet[];
  completed: boolean;
}
