// Focus Areas - Core movement patterns (broad categories)
export const FOCUS_AREAS = [
  'PUSH',
  'PULL', 
  'LEGS',
  'FULL BODY',
  'CORE',
  'CARDIO',
  'Strength',
  'Hypertrophy',
  'Power',
  'Endurance',
] as const;

export type FocusArea = typeof FOCUS_AREAS[number];

// Primary Muscle Groups - Specific muscles that can be targeted
export const MUSCLE_GROUPS = [
  // Upper Body - Push
  'Chest',
  'Upper Chest',
  'Anterior Deltoids',
  'Lateral Deltoids',
  'Triceps',
  
  // Upper Body - Pull
  'Back',
  'Lats',
  'Rear Deltoids',
  'Traps',
  'Biceps',
  'Forearms',
  
  // Shoulders (general)
  'Shoulders',
  'Deltoids',
  
  // Legs
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  
  // Core
  'Core',
  'Obliques',
  
  // Full Body
  'Full Body',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

// Mapping of focus areas to their related primary muscle groups
export const FOCUS_AREA_MUSCLES: Record<FocusArea, MuscleGroup[]> = {
  'PUSH': [
    'Chest',
    'Upper Chest', 
    'Anterior Deltoids',
    'Lateral Deltoids',
    'Shoulders',
    'Deltoids',
    'Triceps',
  ],
  'PULL': [
    'Back',
    'Lats',
    'Rear Deltoids',
    'Traps',
    'Biceps',
    'Forearms',
  ],
  'LEGS': [
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Calves',
  ],
  'FULL BODY': [
    'Full Body',
    'Chest',
    'Back',
    'Quadriceps',
    'Core',
  ],
  'CORE': [
    'Core',
    'Obliques',
  ],
  'CARDIO': [
    'Full Body',
    'Core',
    'Quadriceps',
  ],
  'Strength': [
    'Full Body',
    'Chest',
    'Back',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Shoulders',
  ],
  'Hypertrophy': [
    'Full Body',
    'Chest',
    'Back',
    'Biceps',
    'Triceps',
    'Quadriceps',
    'Shoulders',
  ],
  'Power': [
    'Full Body',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Core',
  ],
  'Endurance': [
    'Full Body',
    'Core',
    'Quadriceps',
    'Calves',
  ],
};

// Equipment categories for filtering
export const EQUIPMENT_CATEGORIES = {
  'Free Weights': ['DUMBBELLS', 'BARBELL', 'KETTLEBELL', 'EZ_BAR'],
  'Bodyweight': ['BODYWEIGHT', 'PULL_UP_BAR', 'DIP_STATION'],
  'Machines': [
    'CABLE_MACHINE', 'LAT_PULLDOWN', 'LEG_PRESS', 'LEG_CURL', 
    'LEG_EXTENSION', 'SMITH_MACHINE', 'PEC_DECK', 'CHEST_PRESS',
    'SHOULDER_PRESS_MACHINE', 'SEATED_ROW', 'HACK_SQUAT', 
    'CALF_RAISE', 'AB_MACHINE'
  ],
  'Bench': ['BENCH', 'PREACHER_BENCH'],
} as const;

// Flat list of all equipment
export const EQUIPMENT_OPTIONS = [
  'DUMBBELLS', 'BARBELL', 'BENCH', 'CABLE_MACHINE', 'LAT_PULLDOWN',
  'LEG_PRESS', 'LEG_CURL', 'LEG_EXTENSION', 'SMITH_MACHINE', 'PEC_DECK',
  'CHEST_PRESS', 'SHOULDER_PRESS_MACHINE', 'SEATED_ROW', 'PULL_UP_BAR',
  'DIP_STATION', 'PREACHER_BENCH', 'HACK_SQUAT', 'CALF_RAISE', 'AB_MACHINE',
  'BODYWEIGHT', 'KETTLEBELL', 'EZ_BAR'
] as const;

export type EquipmentType = typeof EQUIPMENT_OPTIONS[number];

// Helper to format equipment for display
export function formatEquipment(equipment: string): string {
  return equipment
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Helper to get muscles for a focus area
export function getMusclesForFocusArea(focusArea: FocusArea | string | null): MuscleGroup[] {
  if (!focusArea) return [...MUSCLE_GROUPS];
  return FOCUS_AREA_MUSCLES[focusArea as FocusArea] || [...MUSCLE_GROUPS];
}
