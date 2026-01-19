-- Fix security definer view by using SECURITY INVOKER
DROP VIEW IF EXISTS public.weekly_boss_leaderboard;

CREATE VIEW public.weekly_boss_leaderboard
WITH (security_invoker = true)
AS
SELECT 
  d.user_id,
  p.display_name,
  d.boss_id,
  SUM(d.total_damage) as total_damage,
  SUM(d.base_damage) as base_damage,
  SUM(d.bonus_damage) as bonus_damage,
  COUNT(d.id) as contribution_count,
  COALESCE(SUM(array_length(d.weakness_hits, 1)), 0) as weakness_hits_count,
  RANK() OVER (PARTITION BY d.boss_id ORDER BY SUM(d.total_damage) DESC) as rank
FROM public.weekly_boss_damage d
JOIN public.profiles p ON p.id = d.user_id
GROUP BY d.user_id, p.display_name, d.boss_id;

-- Grant access
GRANT SELECT ON public.weekly_boss_leaderboard TO anon, authenticated;