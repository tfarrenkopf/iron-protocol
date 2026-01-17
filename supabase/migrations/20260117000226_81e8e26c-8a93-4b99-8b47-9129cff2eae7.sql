-- Create table to track user time on site
CREATE TABLE public.user_time_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  session_end timestamp with time zone,
  duration_seconds integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_time_tracking ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tracking records
CREATE POLICY "Users insert own time tracking"
ON public.user_time_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tracking records
CREATE POLICY "Users update own time tracking"
ON public.user_time_tracking
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can view their own tracking records
CREATE POLICY "Users view own time tracking"
ON public.user_time_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Admin view policy for the hidden analytics page (authenticated users can see all for now)
CREATE POLICY "Authenticated users view all time tracking"
ON public.user_time_tracking
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_user_time_tracking_user_id ON public.user_time_tracking(user_id);
CREATE INDEX idx_user_time_tracking_session_start ON public.user_time_tracking(session_start);

-- Add trigger for updated_at
CREATE TRIGGER update_user_time_tracking_updated_at
BEFORE UPDATE ON public.user_time_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();