-- Clean up focus_areas to use only movement patterns (PUSH, PULL, LEGS, FULL BODY, CORE, CARDIO)
-- Map old muscle-based focus areas to movement patterns

-- Update missions with CHEST/SHOULDERS-only focus to PUSH
UPDATE missions 
SET focus_areas = ARRAY(
  SELECT DISTINCT unnest(
    CASE 
      -- Replace muscle names with movement patterns
      WHEN 'CHEST' = ANY(focus_areas) AND NOT 'PUSH' = ANY(focus_areas) THEN array_cat(focus_areas, ARRAY['PUSH'])
      ELSE focus_areas
    END
  )
  EXCEPT SELECT unnest(ARRAY['CHEST', 'SHOULDERS', 'ARMS', 'BACK', 'UPPER', 'PUMP', 'STRENGTH', 'CONDITIONING', 'FUNCTIONAL'])
)
WHERE focus_areas IS NOT NULL;

-- Fix missions that now have empty focus_areas by inferring from exercises
UPDATE missions m
SET focus_areas = ARRAY(
  SELECT DISTINCT 
    CASE 
      WHEN e.primary_muscle_group IN ('Chest', 'Upper Chest', 'Anterior Deltoids', 'Lateral Deltoids', 'Shoulders', 'Deltoids', 'Triceps') THEN 'PUSH'
      WHEN e.primary_muscle_group IN ('Back', 'Lats', 'Rear Deltoids', 'Traps', 'Biceps', 'Forearms') THEN 'PULL'
      WHEN e.primary_muscle_group IN ('Quadriceps', 'Hamstrings', 'Glutes', 'Calves') THEN 'LEGS'
      WHEN e.primary_muscle_group IN ('Core', 'Obliques') THEN 'CORE'
      WHEN e.primary_muscle_group = 'Full Body' THEN 'FULL BODY'
      ELSE 'FULL BODY'
    END
  FROM mission_exercises me
  JOIN exercises e ON e.id = me.exercise_id
  WHERE me.mission_id = m.id
)
WHERE focus_areas IS NULL OR array_length(focus_areas, 1) IS NULL OR array_length(focus_areas, 1) = 0;