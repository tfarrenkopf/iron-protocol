-- =====================================================
-- FIX SECURITY WARNINGS
-- =====================================================

-- 1. Drop and recreate the view with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.global_leaderboard;

CREATE VIEW public.global_leaderboard 
WITH (security_invoker = true) AS
SELECT 
  display_name,
  total_score,
  total_xp,
  total_sets,
  max_combo,
  RANK() OVER (ORDER BY total_score DESC) as rank
FROM public.profiles
WHERE display_name IS NOT NULL
ORDER BY total_score DESC;

-- 2. Fix calculate_mission_difficulty function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_mission_difficulty(
  p_estimated_minutes INTEGER,
  p_exercise_count INTEGER,
  p_total_sets INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  base_score INTEGER;
BEGIN
  -- Base score from time
  base_score := CASE
    WHEN p_estimated_minutes <= 15 THEN 1
    WHEN p_estimated_minutes <= 25 THEN 2
    WHEN p_estimated_minutes <= 35 THEN 3
    WHEN p_estimated_minutes <= 50 THEN 4
    ELSE 5
  END;
  
  -- Adjust based on intensity (sets per exercise)
  IF p_exercise_count > 0 THEN
    base_score := base_score + LEAST(2, (p_total_sets / p_exercise_count - 3) / 2);
  END IF;
  
  RETURN GREATEST(1, LEAST(5, base_score));
END;
$$;

-- 3. Fix update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;