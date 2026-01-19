-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deep_link TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = recipient_user_id);

-- Users can update their own notifications (mark read/dismissed)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = recipient_user_id);

-- System/triggers can insert notifications (service role or triggers)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_recipient_status ON public.notifications(recipient_user_id, status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create user notification preferences table (stub for future)
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  type_preferences JSONB NOT NULL DEFAULT '{
    "SQUAD_INVITE_ACCEPTED": true,
    "MISSION_ASSIGNED": true,
    "RIVAL_INVITE_ACCEPTED": true,
    "BOSS_UPDATE": true,
    "WEEKLY_SUMMARY": true,
    "SYSTEM_ALERT": true
  }',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on preferences
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view own preferences
CREATE POLICY "Users can view own notification preferences" 
ON public.user_notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update own preferences
CREATE POLICY "Users can update own notification preferences" 
ON public.user_notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert own preferences
CREATE POLICY "Users can insert own notification preferences" 
ON public.user_notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to emit notification (called by triggers)
CREATE OR REPLACE FUNCTION public.emit_notification(
  p_recipient_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_deep_link TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_prefs_enabled BOOLEAN;
  v_type_enabled BOOLEAN;
BEGIN
  -- Check user preferences (if they exist)
  SELECT 
    in_app_enabled,
    COALESCE((type_preferences->>p_type)::boolean, true)
  INTO v_prefs_enabled, v_type_enabled
  FROM user_notification_preferences
  WHERE user_id = p_recipient_user_id;
  
  -- If no preferences exist, default to enabled
  IF v_prefs_enabled IS NULL THEN
    v_prefs_enabled := true;
    v_type_enabled := true;
  END IF;
  
  -- Only insert if notifications are enabled for this type
  IF v_prefs_enabled AND v_type_enabled THEN
    INSERT INTO notifications (
      recipient_user_id,
      type,
      title,
      body,
      deep_link,
      priority,
      context
    ) VALUES (
      p_recipient_user_id,
      p_type,
      p_title,
      p_body,
      p_deep_link,
      p_priority,
      p_context
    )
    RETURNING id INTO v_notification_id;
  END IF;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger function for squad invite acceptance
CREATE OR REPLACE FUNCTION public.notify_squad_invite_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_squad_name TEXT;
  v_handler_id UUID;
  v_member_name TEXT;
BEGIN
  -- Get squad info and handler
  SELECT s.name, s.handler_id INTO v_squad_name, v_handler_id
  FROM squads s
  WHERE s.id = NEW.squad_id;
  
  -- Get joining member's display name
  SELECT COALESCE(display_name, 'Operative') INTO v_member_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Notify the handler
  PERFORM emit_notification(
    v_handler_id,
    'SQUAD_INVITE_ACCEPTED',
    'New Squad Member',
    v_member_name || ' has joined your squad!',
    '/handler',
    'medium',
    jsonb_build_object('squad_id', NEW.squad_id, 'member_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for squad member joins
CREATE TRIGGER on_squad_member_joined
AFTER INSERT ON public.squad_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_squad_invite_accepted();

-- Trigger function for mission assignment
CREATE OR REPLACE FUNCTION public.notify_mission_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission_name TEXT;
  v_member_record RECORD;
BEGIN
  -- Extract mission name from snapshot
  v_mission_name := COALESCE(NEW.mission_snapshot->>'name', 'New Mission');
  
  -- If assigned to a squad, notify all members
  IF NEW.assignee_type = 'SQUAD' THEN
    FOR v_member_record IN 
      SELECT user_id FROM squad_members WHERE squad_id = NEW.assignee_id
    LOOP
      PERFORM emit_notification(
        v_member_record.user_id,
        'MISSION_ASSIGNED',
        'New Mission Assigned',
        'New mission assigned: ' || v_mission_name,
        '/profile?tab=handler-ops',
        'high',
        jsonb_build_object('assignment_id', NEW.id, 'mission_name', v_mission_name, 'handler_id', NEW.handler_id)
      );
    END LOOP;
  ELSE
    -- Direct user assignment
    PERFORM emit_notification(
      NEW.assignee_id,
      'MISSION_ASSIGNED',
      'New Mission Assigned',
      'New mission assigned: ' || v_mission_name,
      '/profile?tab=handler-ops',
      'high',
      jsonb_build_object('assignment_id', NEW.id, 'mission_name', v_mission_name, 'handler_id', NEW.handler_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for mission assignments
CREATE TRIGGER on_mission_assigned
AFTER INSERT ON public.mission_assignments
FOR EACH ROW
EXECUTE FUNCTION public.notify_mission_assigned();

-- Trigger function for rival invite acceptance
CREATE OR REPLACE FUNCTION public.notify_rival_invite_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rival_name TEXT;
BEGIN
  -- Get the new rival's display name
  SELECT COALESCE(display_name, 'Operative') INTO v_rival_name
  FROM profiles
  WHERE id = NEW.rival_id;
  
  -- Notify the user who now has a new rival
  PERFORM emit_notification(
    NEW.user_id,
    'RIVAL_INVITE_ACCEPTED',
    'Rival Challenge Accepted',
    v_rival_name || ' has accepted your rival challenge!',
    '/intel?tab=rivals',
    'medium',
    jsonb_build_object('rival_id', NEW.rival_id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for rival creation
CREATE TRIGGER on_rivalry_created
AFTER INSERT ON public.rivalries
FOR EACH ROW
EXECUTE FUNCTION public.notify_rival_invite_accepted();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;