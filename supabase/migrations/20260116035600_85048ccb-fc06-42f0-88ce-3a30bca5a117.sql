-- Fix: Drop the security definer view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.mission_leaderboard;

CREATE VIEW public.mission_leaderboard 
WITH (security_invoker = true)
AS
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