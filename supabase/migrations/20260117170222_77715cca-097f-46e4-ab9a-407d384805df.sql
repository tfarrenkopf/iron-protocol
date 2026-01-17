-- Add a dedicated run start timestamp so campaigns can be replayed fresh
ALTER TABLE public.user_campaign_progress
ADD COLUMN IF NOT EXISTS current_run_started_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing rows so current behavior stays the same (treat first tracked run as the current run)
UPDATE public.user_campaign_progress
SET current_run_started_at = created_at
WHERE current_run_started_at IS NULL;

-- Enforce presence going forward
ALTER TABLE public.user_campaign_progress
ALTER COLUMN current_run_started_at SET NOT NULL;

ALTER TABLE public.user_campaign_progress
ALTER COLUMN current_run_started_at SET DEFAULT now();

-- Helpful index for filtering sessions by the active run window
CREATE INDEX IF NOT EXISTS idx_ucp_user_campaign_run_started
ON public.user_campaign_progress (user_id, campaign_id, current_run_started_at);