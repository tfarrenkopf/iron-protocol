-- Fix security issues

-- Drop the security definer view and recreate as invoker
DROP VIEW IF EXISTS public.war_report_current_week;

CREATE VIEW public.war_report_current_week 
WITH (security_invoker = true)
AS
SELECT 
  w.id,
  w.campaign_id,
  c.name as campaign_name,
  c.code_name as campaign_code,
  w.week_start_date,
  w.total_completions,
  w.unique_players_count,
  w.average_completion_time_seconds,
  w.replay_rate,
  w.fastest_completion_seconds,
  w.total_weight_lifted,
  w.total_score,
  w.created_at
FROM public.war_report_campaign_snapshots w
JOIN public.collections c ON c.id = w.campaign_id
WHERE w.week_start_date = date_trunc('week', CURRENT_DATE)::DATE
ORDER BY w.total_completions DESC;

-- Drop the overly permissive insert policy and make it more restrictive
DROP POLICY IF EXISTS "Only authenticated users can insert war report data" ON public.war_report_campaign_snapshots;

-- Only allow inserts via the generate function (service role)
-- For now, restrict to users with handler role who might run reports
CREATE POLICY "Handlers can generate war report data"
  ON public.war_report_campaign_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'handler'));