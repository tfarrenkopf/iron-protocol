-- Drop and recreate the mission assignment notification trigger with correct deep_link
CREATE OR REPLACE FUNCTION public.notify_mission_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_squad_name TEXT;
  v_handler_name TEXT;
  v_mission_name TEXT;
  v_squad_members UUID[];
BEGIN
  -- Get mission name from the snapshot
  v_mission_name := NEW.mission_snapshot->>'name';
  
  -- Get handler name
  SELECT COALESCE(display_name, 'Handler') INTO v_handler_name
  FROM public.profiles WHERE id = NEW.handler_id;

  IF NEW.assignee_type = 'squad' THEN
    -- Get squad name
    SELECT name INTO v_squad_name
    FROM public.squads WHERE id = NEW.assignee_id;
    
    -- Get all squad members (excluding the handler)
    SELECT ARRAY_AGG(user_id) INTO v_squad_members
    FROM public.squad_members
    WHERE squad_id = NEW.assignee_id AND user_id != NEW.handler_id;
    
    -- Create notification for each squad member with deep link to the assignment
    IF v_squad_members IS NOT NULL THEN
      FOR i IN 1..array_length(v_squad_members, 1) LOOP
        PERFORM public.emit_notification(
          p_recipient_user_id := v_squad_members[i],
          p_type := 'MISSION_ASSIGNED',
          p_title := 'New Mission Assigned',
          p_body := 'New mission assigned: ' || v_mission_name,
          p_deep_link := '/mission/' || (NEW.mission_snapshot->>'id') || '?assignmentId=' || NEW.id::TEXT,
          p_priority := 'high',
          p_context := jsonb_build_object(
            'assignment_id', NEW.id,
            'handler_id', NEW.handler_id,
            'mission_name', v_mission_name,
            'squad_name', v_squad_name
          )
        );
      END LOOP;
    END IF;
  ELSE
    -- Direct user assignment with deep link to the assignment
    PERFORM public.emit_notification(
      p_recipient_user_id := NEW.assignee_id,
      p_type := 'MISSION_ASSIGNED',
      p_title := 'New Mission Assigned',
      p_body := 'New mission assigned: ' || v_mission_name,
      p_deep_link := '/mission/' || (NEW.mission_snapshot->>'id') || '?assignmentId=' || NEW.id::TEXT,
      p_priority := 'high',
      p_context := jsonb_build_object(
        'assignment_id', NEW.id,
        'handler_id', NEW.handler_id,
        'mission_name', v_mission_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;