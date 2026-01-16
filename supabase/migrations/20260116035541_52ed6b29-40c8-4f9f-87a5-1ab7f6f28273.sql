-- Create a function to get mission completion stats
CREATE OR REPLACE FUNCTION public.get_mission_stats(p_mission_id UUID)
RETURNS TABLE (
  completion_count BIGINT,
  unique_players BIGINT,
  avg_score NUMERIC,
  total_weight_lifted NUMERIC
) 
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*)::BIGINT as completion_count,
    COUNT(DISTINCT user_id)::BIGINT as unique_players,
    COALESCE(AVG(score_earned), 0)::NUMERIC as avg_score,
    COALESCE(SUM(total_weight), 0)::NUMERIC as total_weight_lifted
  FROM public.workout_sessions
  WHERE mission_id = p_mission_id AND status = 'COMPLETED';
$$;

-- Create a view for mission leaderboard (top scores per mission)
CREATE OR REPLACE VIEW public.mission_leaderboard AS
SELECT 
  ws.mission_id,
  ws.user_id,
  p.display_name,
  ws.score_earned,
  ws.total_weight,
  ws.max_combo,
  ws.completed_at,
  ROW_NUMBER() OVER (PARTITION BY ws.mission_id ORDER BY ws.score_earned DESC) as rank
FROM public.workout_sessions ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.status = 'COMPLETED';

-- Add RLS to the view (views inherit from underlying tables)
-- No additional RLS needed since workout_sessions already allows viewing completed sessions

-- Create trigger to update mission popularity on completion
CREATE OR REPLACE FUNCTION public.update_mission_popularity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.mission_id IS NOT NULL THEN
    UPDATE public.missions
    SET popularity_score = popularity_score + 1
    WHERE id = NEW.mission_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_complete_update_popularity
  AFTER INSERT OR UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mission_popularity();

-- Get user's rank for a specific mission
CREATE OR REPLACE FUNCTION public.get_user_mission_rank(p_user_id UUID, p_mission_id UUID)
RETURNS TABLE (
  user_rank BIGINT,
  user_best_score INTEGER,
  total_players BIGINT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT 
      user_id,
      MAX(score_earned) as best_score,
      RANK() OVER (ORDER BY MAX(score_earned) DESC) as rank
    FROM public.workout_sessions
    WHERE mission_id = p_mission_id AND status = 'COMPLETED'
    GROUP BY user_id
  ),
  total AS (
    SELECT COUNT(DISTINCT user_id)::BIGINT as total_players
    FROM public.workout_sessions
    WHERE mission_id = p_mission_id AND status = 'COMPLETED'
  )
  SELECT 
    r.rank as user_rank,
    r.best_score::INTEGER as user_best_score,
    t.total_players
  FROM ranked r, total t
  WHERE r.user_id = p_user_id
  UNION ALL
  SELECT 
    NULL::BIGINT as user_rank,
    NULL::INTEGER as user_best_score,
    t.total_players
  FROM total t
  WHERE NOT EXISTS (SELECT 1 FROM ranked r WHERE r.user_id = p_user_id)
  LIMIT 1;
$$;