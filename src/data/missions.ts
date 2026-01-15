import { Mission, HIITConfig } from '@/types/game';

export const defaultMissions: Mission[] = [
  {
    id: 'mission-shoulder-assault',
    name: 'Shoulders and Arms',
    codeName: 'SHOULDER ASSAULT',
    description: 'Push Focus. Destroy the deltoids. No mercy.',
    focusAreas: ['PUSH', 'SHOULDERS', 'ARMS'],
    difficulty: 3,
    estimatedMinutes: 35,
    isDefault: true,
    exercises: [
      { exerciseId: 'db-shoulder-press', targetSets: 4, targetReps: 10, restBetweenSetsSec: 90 },
      { exerciseId: 'db-front-raise', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-upright-row', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-kickbacks', targetSets: 3, targetReps: 15, restBetweenSetsSec: 60 },
      { exerciseId: 'db-hammer-curl', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-shrugs', targetSets: 3, targetReps: 15, restBetweenSetsSec: 60 },
    ],
  },
  {
    id: 'mission-chest-destruction',
    name: 'Chest and Arms',
    codeName: 'CHEST DESTRUCTION',
    description: 'Pull Focus. Cave in the ribcage. Build the armor.',
    focusAreas: ['PULL', 'CHEST', 'ARMS'],
    difficulty: 4,
    estimatedMinutes: 40,
    isDefault: true,
    exercises: [
      { exerciseId: 'db-bench-press', targetSets: 4, targetReps: 10, restBetweenSetsSec: 90 },
      { exerciseId: 'db-fly', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'bb-incline-bench', targetSets: 4, targetReps: 8, restBetweenSetsSec: 120 },
      { exerciseId: 'db-preacher-curl', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-pullover', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
    ],
  },
  {
    id: 'mission-rear-assault',
    name: 'Shoulders and Arms',
    codeName: 'REAR ASSAULT',
    description: 'Pull Focus. Attack from behind. Sculpt the rear delts.',
    focusAreas: ['PULL', 'SHOULDERS', 'ARMS'],
    difficulty: 3,
    estimatedMinutes: 35,
    isDefault: true,
    exercises: [
      { exerciseId: 'db-rear-delt-row', targetSets: 4, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-seated-rear-lateral', targetSets: 3, targetReps: 15, restBetweenSetsSec: 60 },
      { exerciseId: 'bb-close-grip-bench', targetSets: 4, targetReps: 10, restBetweenSetsSec: 90 },
      { exerciseId: 'db-concentration-curl', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-bentover-row', targetSets: 4, targetReps: 10, restBetweenSetsSec: 90 },
    ],
  },
  {
    id: 'mission-concrete-slaughter',
    name: 'Chest and Arms',
    codeName: 'CONCRETE SLAUGHTER',
    description: 'Push Focus. Compound chaos. Pure pressing power.',
    focusAreas: ['PUSH', 'CHEST', 'ARMS'],
    difficulty: 5,
    estimatedMinutes: 45,
    isDefault: true,
    exercises: [
      { exerciseId: 'bb-bench-press', targetSets: 5, targetReps: 5, restBetweenSetsSec: 180 },
      { exerciseId: 'db-incline-bench', targetSets: 4, targetReps: 10, restBetweenSetsSec: 90 },
      { exerciseId: 'db-skull-crusher', targetSets: 3, targetReps: 12, restBetweenSetsSec: 60 },
      { exerciseId: 'db-fly', targetSets: 3, targetReps: 15, restBetweenSetsSec: 60 },
      { exerciseId: 'db-shrugs', targetSets: 3, targetReps: 15, restBetweenSetsSec: 60 },
    ],
  },
  {
    id: 'mission-core-execution',
    name: 'Core Finisher',
    codeName: 'CORE EXECUTION',
    description: 'Cardio + Core. Burn it down. Finish strong.',
    focusAreas: ['CARDIO', 'CORE'],
    difficulty: 2,
    estimatedMinutes: 20,
    isDefault: true,
    exercises: [
      { exerciseId: 'db-russian-twist', targetSets: 3, targetReps: 20, restBetweenSetsSec: 45 },
      { exerciseId: 'db-woodchopper', targetSets: 3, targetReps: 15, restBetweenSetsSec: 45 },
    ],
  },
];

export const defaultHIITConfigs: HIITConfig[] = [
  {
    id: 'hiit-execution-protocol',
    name: 'Execution Protocol',
    codeName: 'EXECUTION PROTOCOL',
    workDurationSec: 20,
    restDurationSec: 10,
    rounds: 8,
    isDefault: true,
  },
  {
    id: 'hiit-endless-assault',
    name: 'Endless Assault',
    codeName: 'ENDLESS ASSAULT',
    workDurationSec: 40,
    restDurationSec: 20,
    rounds: 15,
    isDefault: true,
  },
  {
    id: 'hiit-boss-rush',
    name: 'Boss Rush',
    codeName: 'BOSS RUSH',
    workDurationSec: 45,
    restDurationSec: 15,
    rounds: 10,
    isDefault: true,
  },
  {
    id: 'hiit-sudden-death',
    name: 'Sudden Death',
    codeName: 'SUDDEN DEATH',
    workDurationSec: 30,
    restDurationSec: 10,
    rounds: 12,
    isDefault: true,
  },
];

export const getMissionById = (id: string): Mission | undefined => {
  return defaultMissions.find(m => m.id === id);
};

export const getHIITById = (id: string): HIITConfig | undefined => {
  return defaultHIITConfigs.find(h => h.id === id);
};
