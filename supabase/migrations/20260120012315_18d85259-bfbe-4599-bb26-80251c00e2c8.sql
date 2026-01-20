-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger to notify admin on new feedback
CREATE OR REPLACE FUNCTION public.notify_feedback_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_name TEXT;
  v_admin_id UUID := '149573b7-1c81-4f58-9314-ab69d271a640';
BEGIN
  -- Get submitter's display name
  SELECT COALESCE(display_name, 'Operative') INTO v_user_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify admin
  PERFORM emit_notification(
    v_admin_id,
    'FEEDBACK_SUBMITTED',
    'New Feedback Received',
    'Feedback from ' || v_user_name || ': ' || LEFT(NEW.message, 100) || CASE WHEN LENGTH(NEW.message) > 100 THEN '...' ELSE '' END,
    '/profile?tab=notifications',
    'medium',
    jsonb_build_object('feedback_id', NEW.id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_feedback_submitted
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.notify_feedback_submitted();