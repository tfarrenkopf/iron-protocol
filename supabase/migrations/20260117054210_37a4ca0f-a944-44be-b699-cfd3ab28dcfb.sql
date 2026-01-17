-- Create rivalries table for head-to-head competition
CREATE TABLE public.rivalries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rival_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique pairing (both directions)
  CONSTRAINT unique_rivalry UNIQUE (user_id, rival_id),
  -- Prevent self-rivalry
  CONSTRAINT no_self_rivalry CHECK (user_id != rival_id)
);

-- Enable RLS
ALTER TABLE public.rivalries ENABLE ROW LEVEL SECURITY;

-- Users can view their own rivalries
CREATE POLICY "Users view own rivalries"
  ON public.rivalries FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = rival_id);

-- Users can create rivalries where they are the user_id
CREATE POLICY "Users create rivalries"
  ON public.rivalries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete rivalries they're part of
CREATE POLICY "Users delete own rivalries"
  ON public.rivalries FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = rival_id);

-- Create indexes for efficient queries
CREATE INDEX idx_rivalries_user_id ON public.rivalries(user_id);
CREATE INDEX idx_rivalries_rival_id ON public.rivalries(rival_id);

-- Create a view for weekly rival stats (computed from workout_sessions)
CREATE OR REPLACE VIEW public.rival_weekly_stats AS
SELECT 
  ws.user_id,
  p.display_name,
  p.rival_code,
  SUM(ws.score_earned) as weekly_score,
  SUM(ws.total_weight) as weekly_weight,
  COUNT(*) as weekly_sessions,
  SUM(ws.sets_completed) as weekly_sets,
  MAX(ws.max_combo) as weekly_max_combo
FROM public.workout_sessions ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.status = 'COMPLETED'
  AND ws.completed_at >= date_trunc('week', CURRENT_DATE)
GROUP BY ws.user_id, p.display_name, p.rival_code;

-- Grant access to the view
GRANT SELECT ON public.rival_weekly_stats TO authenticated;