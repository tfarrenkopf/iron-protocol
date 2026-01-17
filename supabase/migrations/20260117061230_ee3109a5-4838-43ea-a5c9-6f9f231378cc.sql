-- =============================================
-- Campaign Progress & Completion Tracking
-- =============================================

-- 1. UserCampaignProgress - Tracks current and historical completion data
CREATE TABLE public.user_campaign_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  missions_completed_count INTEGER NOT NULL DEFAULT 0,
  total_missions_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  best_completion_time_seconds INTEGER,
  total_completions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one progress record per user per campaign
  UNIQUE(user_id, campaign_id)
);

-- 2. CampaignCompletion - Records each completion run (for PRs and history)
CREATE TABLE public.campaign_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  completion_time_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_personal_record BOOLEAN NOT NULL DEFAULT false,
  missions_completed INTEGER NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_campaign_progress
CREATE POLICY "Users view own campaign progress"
  ON public.user_campaign_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own campaign progress"
  ON public.user_campaign_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own campaign progress"
  ON public.user_campaign_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for campaign_completions
CREATE POLICY "Users view own campaign completions"
  ON public.campaign_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own campaign completions"
  ON public.campaign_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow viewing completions for leaderboards (completed campaigns)
CREATE POLICY "Anyone can view campaign completions for leaderboards"
  ON public.campaign_completions FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX idx_user_campaign_progress_user ON public.user_campaign_progress(user_id);
CREATE INDEX idx_user_campaign_progress_campaign ON public.user_campaign_progress(campaign_id);
CREATE INDEX idx_campaign_completions_user ON public.campaign_completions(user_id);
CREATE INDEX idx_campaign_completions_campaign ON public.campaign_completions(campaign_id);
CREATE INDEX idx_campaign_completions_pr ON public.campaign_completions(campaign_id, is_personal_record) WHERE is_personal_record = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_campaign_progress_updated_at
  BEFORE UPDATE ON public.user_campaign_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();