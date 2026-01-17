-- Create war report campaign snapshots table for aggregated, anonymized data
CREATE TABLE public.war_report_campaign_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  total_completions INTEGER DEFAULT 0,
  unique_players_count INTEGER DEFAULT 0,
  average_completion_time_seconds INTEGER DEFAULT 0,
  replay_rate NUMERIC(5,2) DEFAULT 0,
  fastest_completion_seconds INTEGER,
  total_weight_lifted NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.war_report_campaign_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access - this is aggregated anonymous data
CREATE POLICY "War report snapshots are publicly readable"
  ON public.war_report_campaign_snapshots
  FOR SELECT
  USING (true);

-- Only system can insert/update (via edge function or admin)
CREATE POLICY "Only authenticated users can insert war report data"
  ON public.war_report_campaign_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_war_report_week ON public.war_report_campaign_snapshots(week_start_date DESC);
CREATE INDEX idx_war_report_campaign ON public.war_report_campaign_snapshots(campaign_id);

-- Create a function to generate weekly war report snapshots
CREATE OR REPLACE FUNCTION public.generate_war_report_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start DATE;
BEGIN
  -- Get the start of the current week (Monday)
  week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  -- Insert or update snapshots for each campaign with activity
  INSERT INTO public.war_report_campaign_snapshots (
    campaign_id,
    week_start_date,
    total_completions,
    unique_players_count,
    average_completion_time_seconds,
    replay_rate,
    fastest_completion_seconds,
    total_weight_lifted,
    total_score
  )
  SELECT 
    cc.campaign_id,
    week_start,
    COUNT(*)::INTEGER as total_completions,
    COUNT(DISTINCT cc.user_id)::INTEGER as unique_players_count,
    COALESCE(AVG(cc.completion_time_seconds), 0)::INTEGER as average_completion_time_seconds,
    CASE 
      WHEN COUNT(DISTINCT cc.user_id) > 0 
      THEN ROUND((COUNT(*)::NUMERIC / COUNT(DISTINCT cc.user_id)::NUMERIC - 1) * 100, 2)
      ELSE 0 
    END as replay_rate,
    MIN(cc.completion_time_seconds)::INTEGER as fastest_completion_seconds,
    COALESCE(SUM(cc.total_weight), 0) as total_weight_lifted,
    COALESCE(SUM(cc.total_score), 0) as total_score
  FROM public.campaign_completions cc
  WHERE cc.completed_at >= week_start
    AND cc.completed_at < week_start + INTERVAL '7 days'
  GROUP BY cc.campaign_id
  ON CONFLICT (campaign_id, week_start_date) DO UPDATE SET
    total_completions = EXCLUDED.total_completions,
    unique_players_count = EXCLUDED.unique_players_count,
    average_completion_time_seconds = EXCLUDED.average_completion_time_seconds,
    replay_rate = EXCLUDED.replay_rate,
    fastest_completion_seconds = EXCLUDED.fastest_completion_seconds,
    total_weight_lifted = EXCLUDED.total_weight_lifted,
    total_score = EXCLUDED.total_score;
END;
$$;

-- Create a view for current week war report with campaign names
CREATE OR REPLACE VIEW public.war_report_current_week AS
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