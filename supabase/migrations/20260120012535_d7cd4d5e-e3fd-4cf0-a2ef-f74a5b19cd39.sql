-- Add optional email column to feedback table
ALTER TABLE public.feedback 
ADD COLUMN contact_email TEXT;

-- Update trigger to include email in notification
CREATE OR REPLACE FUNCTION public.notify_feedback_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_name TEXT;
  v_admin_id UUID := '149573b7-1c81-4f58-9314-ab69d271a640';
  v_body TEXT;
BEGIN
  -- Get submitter's display name
  SELECT COALESCE(display_name, 'Operative') INTO v_user_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Build notification body
  v_body := 'From ' || v_user_name;
  IF NEW.contact_email IS NOT NULL AND NEW.contact_email != '' THEN
    v_body := v_body || ' (' || NEW.contact_email || ')';
  END IF;
  v_body := v_body || ': ' || LEFT(NEW.message, 80) || CASE WHEN LENGTH(NEW.message) > 80 THEN '...' ELSE '' END;
  
  -- Notify admin
  PERFORM emit_notification(
    v_admin_id,
    'FEEDBACK_SUBMITTED',
    'New Feedback Received',
    v_body,
    '/profile?tab=notifications',
    'medium',
    jsonb_build_object(
      'feedback_id', NEW.id, 
      'user_id', NEW.user_id,
      'contact_email', NEW.contact_email,
      'message', NEW.message
    )
  );
  
  RETURN NEW;
END;
$$;