-- Fix security definer view by recreating with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.rival_weekly_stats;

CREATE VIEW public.rival_weekly_stats 
WITH (security_invoker = true)
AS
SELECT 
  ws.user_id,
  p.display_name,
  p.rival_code,
  COALESCE(SUM(ws.score_earned), 0)::BIGINT as weekly_score,
  COALESCE(SUM(ws.total_weight), 0)::NUMERIC as weekly_weight,
  COUNT(*)::INTEGER as weekly_sessions,
  COALESCE(SUM(ws.sets_completed), 0)::INTEGER as weekly_sets,
  COALESCE(MAX(ws.max_combo), 0)::INTEGER as weekly_max_combo
FROM public.workout_sessions ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.status = 'COMPLETED'
  AND ws.completed_at >= date_trunc('week', CURRENT_DATE)
GROUP BY ws.user_id, p.display_name, p.rival_code;