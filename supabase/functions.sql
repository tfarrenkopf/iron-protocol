-- =====================================================
-- IRON PROTOCOL - Database Functions & Triggers
-- =====================================================

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Updated at column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Calculate mission difficulty
CREATE OR REPLACE FUNCTION public.calculate_mission_difficulty(
  p_estimated_minutes INTEGER,
  p_exercise_count INTEGER,
  p_total_sets INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_score INTEGER;
BEGIN
  base_score := CASE
    WHEN p_estimated_minutes <= 15 THEN 1
    WHEN p_estimated_minutes <= 25 THEN 2
    WHEN p_estimated_minutes <= 35 THEN 3
    WHEN p_estimated_minutes <= 50 THEN 4
    ELSE 5
  END;
  
  IF p_exercise_count > 0 THEN
    base_score := base_score + LEAST(2, (p_total_sets / p_exercise_count - 3) / 2);
  END IF;
  
  RETURN GREATEST(1, LEAST(5, base_score));
END;
$$;

-- =====================================================
-- AUTH FUNCTIONS
-- =====================================================

-- Handle new user signup - create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Check if user has a role (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is squad member
CREATE OR REPLACE FUNCTION public.is_squad_member(_user_id uuid, _squad_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.squad_members
    WHERE user_id = _user_id
      AND squad_id = _squad_id
  )
$$;

-- Check if user is squad handler
CREATE OR REPLACE FUNCTION public.is_squad_handler(_user_id uuid, _squad_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.squads
    WHERE id = _squad_id
      AND handler_id = _user_id
  )
$$;

-- =====================================================
-- STATS FUNCTIONS
-- =====================================================

-- Update profile stats when workout session is completed
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'COMPLETED' THEN
    UPDATE public.profiles
    SET 
      total_score = total_score + NEW.score_earned,
      total_xp = total_xp + NEW.xp_earned,
      total_sets = total_sets + NEW.sets_completed,
      total_reps = total_reps + NEW.total_reps,
      total_weight = total_weight + NEW.total_weight,
      max_combo = GREATEST(max_combo, NEW.max_combo),
      updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED' THEN
    UPDATE public.profiles
    SET 
      total_score = total_score + NEW.score_earned,
      total_xp = total_xp + NEW.xp_earned,
      total_sets = total_sets + NEW.sets_completed,
      total_reps = total_reps + NEW.total_reps,
      total_weight = total_weight + NEW.total_weight,
      max_combo = GREATEST(max_combo, NEW.max_combo),
      updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'COMPLETED' THEN
    UPDATE public.profiles
    SET 
      total_score = GREATEST(0, total_score - OLD.score_earned),
      total_xp = GREATEST(0, total_xp - OLD.xp_earned),
      total_sets = GREATEST(0, total_sets - OLD.sets_completed),
      total_reps = GREATEST(0, total_reps - OLD.total_reps),
      total_weight = GREATEST(0, total_weight - OLD.total_weight),
      updated_at = now()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update milestone progress
CREATE OR REPLACE FUNCTION public.update_milestone_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  milestone_rec RECORD;
  current_val NUMERIC;
BEGIN
  FOR milestone_rec IN 
    SELECT id, category, target_value FROM public.milestones WHERE is_active = true
  LOOP
    CASE milestone_rec.category
      WHEN 'WEIGHT' THEN current_val := NEW.total_weight;
      WHEN 'SETS' THEN current_val := NEW.total_sets;
      WHEN 'REPS' THEN current_val := NEW.total_reps;
      WHEN 'XP' THEN current_val := NEW.total_xp;
      ELSE current_val := 0;
    END CASE;
    
    INSERT INTO public.user_milestones (user_id, milestone_id, current_value, completed_at)
    VALUES (
      NEW.id,
      milestone_rec.id,
      current_val,
      CASE WHEN current_val >= milestone_rec.target_value THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id, milestone_id) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      completed_at = CASE 
        WHEN user_milestones.completed_at IS NULL AND EXCLUDED.current_value >= milestone_rec.target_value 
        THEN now() 
        ELSE user_milestones.completed_at 
      END,
      updated_at = now();
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Update mission popularity
CREATE OR REPLACE FUNCTION public.update_mission_popularity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.mission_id IS NOT NULL THEN
    UPDATE public.missions
    SET popularity_score = popularity_score + 1
    WHERE id = NEW.mission_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Get completed mission count
CREATE OR REPLACE FUNCTION public.get_completed_mission_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.workout_sessions
  WHERE user_id = p_user_id AND status = 'COMPLETED';
$$;

-- Get mission stats
CREATE OR REPLACE FUNCTION public.get_mission_stats(p_mission_id uuid)
RETURNS TABLE(completion_count bigint, unique_players bigint, avg_score numeric, total_weight_lifted numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as completion_count,
    COUNT(DISTINCT user_id)::BIGINT as unique_players,
    COALESCE(AVG(score_earned), 0)::NUMERIC as avg_score,
    COALESCE(SUM(total_weight), 0)::NUMERIC as total_weight_lifted
  FROM public.workout_sessions
  WHERE mission_id = p_mission_id AND status = 'COMPLETED';
$$;

-- Get user mission rank
CREATE OR REPLACE FUNCTION public.get_user_mission_rank(p_user_id uuid, p_mission_id uuid)
RETURNS TABLE(user_rank bigint, user_best_score integer, total_players bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT 
      user_id,
      MAX(score_earned) as best_score,
      RANK() OVER (ORDER BY MAX(score_earned) DESC) as rank
    FROM public.workout_sessions
    WHERE mission_id = p_mission_id AND status = 'COMPLETED'
    GROUP BY user_id
  ),
  total AS (
    SELECT COUNT(DISTINCT user_id)::BIGINT as total_players
    FROM public.workout_sessions
    WHERE mission_id = p_mission_id AND status = 'COMPLETED'
  )
  SELECT 
    r.rank as user_rank,
    r.best_score::INTEGER as user_best_score,
    t.total_players
  FROM ranked r, total t
  WHERE r.user_id = p_user_id
  UNION ALL
  SELECT 
    NULL::BIGINT as user_rank,
    NULL::INTEGER as user_best_score,
    t.total_players
  FROM total t
  WHERE NOT EXISTS (SELECT 1 FROM ranked r WHERE r.user_id = p_user_id)
  LIMIT 1;
$$;

-- =====================================================
-- WEEKLY BOSS FUNCTIONS
-- =====================================================

-- Get active weekly boss
CREATE OR REPLACE FUNCTION public.get_active_weekly_boss()
RETURNS TABLE(
  id uuid, name text, code_name text, lore text, image_url text,
  max_hp integer, current_hp integer, weaknesses text[],
  weakness_multiplier numeric, week_start timestamptz, week_end timestamptz,
  is_defeated boolean, defeated_at timestamptz,
  total_damage_dealt bigint, unique_contributors bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    b.id, b.name, b.code_name, b.lore, b.image_url,
    b.max_hp, b.current_hp, b.weaknesses,
    b.weakness_multiplier, b.week_start, b.week_end,
    b.is_defeated, b.defeated_at,
    COALESCE(SUM(d.total_damage), 0)::BIGINT as total_damage_dealt,
    COUNT(DISTINCT d.user_id)::BIGINT as unique_contributors
  FROM public.weekly_bosses b
  LEFT JOIN public.weekly_boss_damage d ON d.boss_id = b.id
  WHERE b.is_active = true
  GROUP BY b.id
  LIMIT 1;
$$;

-- Get user boss damage
CREATE OR REPLACE FUNCTION public.get_user_boss_damage(p_user_id uuid)
RETURNS TABLE(total_damage bigint, contribution_count bigint, weakness_hits_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(d.total_damage), 0)::BIGINT as total_damage,
    COUNT(d.id)::BIGINT as contribution_count,
    COALESCE(SUM(array_length(d.weakness_hits, 1)), 0)::BIGINT as weakness_hits_count
  FROM public.weekly_boss_damage d
  JOIN public.weekly_bosses b ON b.id = d.boss_id AND b.is_active = true
  WHERE d.user_id = p_user_id;
$$;

-- Apply boss damage
CREATE OR REPLACE FUNCTION public.apply_boss_damage(
  p_user_id uuid, p_session_id uuid, p_base_damage integer, 
  p_bonus_damage integer, p_weakness_hits text[]
)
RETURNS weekly_bosses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_boss public.weekly_bosses%ROWTYPE;
  total_dmg INTEGER;
BEGIN
  SELECT * INTO active_boss FROM public.weekly_bosses WHERE is_active = true LIMIT 1;
  
  IF active_boss.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  total_dmg := p_base_damage + p_bonus_damage;
  
  INSERT INTO public.weekly_boss_damage (boss_id, user_id, session_id, base_damage, bonus_damage, total_damage, weakness_hits)
  VALUES (active_boss.id, p_user_id, p_session_id, p_base_damage, p_bonus_damage, total_dmg, p_weakness_hits)
  ON CONFLICT (session_id) DO UPDATE SET
    base_damage = EXCLUDED.base_damage,
    bonus_damage = EXCLUDED.bonus_damage,
    total_damage = EXCLUDED.total_damage,
    weakness_hits = EXCLUDED.weakness_hits;
  
  UPDATE public.weekly_bosses
  SET 
    current_hp = GREATEST(0, current_hp - total_dmg),
    is_defeated = CASE WHEN current_hp - total_dmg <= 0 THEN true ELSE is_defeated END,
    defeated_at = CASE WHEN current_hp - total_dmg <= 0 AND defeated_at IS NULL THEN now() ELSE defeated_at END
  WHERE id = active_boss.id
  RETURNING * INTO active_boss;
  
  RETURN active_boss;
END;
$$;

-- Rotate weekly boss
CREATE OR REPLACE FUNCTION public.rotate_weekly_boss()
RETURNS weekly_bosses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prior_boss public.weekly_bosses%ROWTYPE;
  prior_week_damage BIGINT;
  prior_week_contributors BIGINT;
  next_template public.boss_templates%ROWTYPE;
  calculated_hp INTEGER;
  new_boss public.weekly_bosses%ROWTYPE;
  week_start_ts TIMESTAMP WITH TIME ZONE;
  week_end_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  week_start_ts := date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  week_end_ts := week_start_ts + INTERVAL '7 days' - INTERVAL '1 second';
  
  SELECT * INTO prior_boss FROM public.weekly_bosses WHERE is_active = true LIMIT 1;
  
  IF prior_boss.id IS NOT NULL THEN
    SELECT COALESCE(SUM(total_damage), 0), COUNT(DISTINCT user_id)
    INTO prior_week_damage, prior_week_contributors
    FROM public.weekly_boss_damage
    WHERE boss_id = prior_boss.id;
    
    UPDATE public.weekly_bosses SET is_active = false WHERE id = prior_boss.id;
  ELSE
    prior_week_damage := 0;
    prior_week_contributors := 0;
  END IF;
  
  IF prior_week_damage > 0 THEN
    calculated_hp := GREATEST(500000, LEAST(5000000, (prior_week_damage * 0.85)::INTEGER));
    IF prior_week_contributors > 50 THEN
      calculated_hp := LEAST(5000000, calculated_hp + (prior_week_contributors * 1000));
    END IF;
  ELSE
    calculated_hp := 1000000;
  END IF;
  
  SELECT * INTO next_template
  FROM public.boss_templates
  WHERE is_active = true
    AND id NOT IN (
      SELECT template_id FROM public.weekly_bosses 
      WHERE template_id IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 3
    )
  ORDER BY sort_order
  LIMIT 1;
  
  IF next_template.id IS NULL THEN
    SELECT * INTO next_template
    FROM public.boss_templates
    WHERE is_active = true
    ORDER BY sort_order
    LIMIT 1;
  END IF;
  
  INSERT INTO public.weekly_bosses (
    name, code_name, lore, image_url, max_hp, current_hp,
    weaknesses, weakness_multiplier, week_start, week_end, 
    is_active, template_id
  ) VALUES (
    next_template.name,
    next_template.code_name || '_' || to_char(week_start_ts, 'YYYYMMDD'),
    next_template.lore,
    next_template.image_url,
    calculated_hp,
    calculated_hp,
    next_template.weaknesses,
    next_template.weakness_multiplier,
    week_start_ts,
    week_end_ts,
    true,
    next_template.id
  )
  RETURNING * INTO new_boss;
  
  RETURN new_boss;
END;
$$;

-- Get boss defeat stats
CREATE OR REPLACE FUNCTION public.get_boss_defeat_stats(p_boss_id uuid)
RETURNS TABLE(
  boss_name text, max_hp integer, total_damage_dealt bigint,
  time_to_defeat_seconds bigint, unique_contributors bigint,
  total_contributions bigint, total_weakness_hits bigint,
  defeated_at timestamptz, week_start timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    b.name as boss_name,
    b.max_hp,
    COALESCE(SUM(d.total_damage), 0)::BIGINT as total_damage_dealt,
    EXTRACT(EPOCH FROM (b.defeated_at - b.week_start))::BIGINT as time_to_defeat_seconds,
    COUNT(DISTINCT d.user_id)::BIGINT as unique_contributors,
    COUNT(d.id)::BIGINT as total_contributions,
    COALESCE(SUM(array_length(d.weakness_hits, 1)), 0)::BIGINT as total_weakness_hits,
    b.defeated_at,
    b.week_start
  FROM public.weekly_bosses b
  LEFT JOIN public.weekly_boss_damage d ON d.boss_id = b.id
  WHERE b.id = p_boss_id
  GROUP BY b.id;
$$;

-- =====================================================
-- NOTIFICATION FUNCTIONS
-- =====================================================

-- Emit notification
CREATE OR REPLACE FUNCTION public.emit_notification(
  p_recipient_user_id uuid, p_type text, p_title text, p_body text,
  p_deep_link text, p_priority text DEFAULT 'medium', p_context jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_prefs_enabled BOOLEAN;
  v_type_enabled BOOLEAN;
BEGIN
  SELECT in_app_enabled, COALESCE((type_preferences->>p_type)::boolean, true)
  INTO v_prefs_enabled, v_type_enabled
  FROM user_notification_preferences
  WHERE user_id = p_recipient_user_id;
  
  IF v_prefs_enabled IS NULL THEN
    v_prefs_enabled := true;
    v_type_enabled := true;
  END IF;
  
  IF v_prefs_enabled AND v_type_enabled THEN
    INSERT INTO notifications (
      recipient_user_id, type, title, body, deep_link, priority, context
    ) VALUES (
      p_recipient_user_id, p_type, p_title, p_body, p_deep_link, p_priority, p_context
    )
    RETURNING id INTO v_notification_id;
  END IF;
  
  RETURN v_notification_id;
END;
$$;

-- Notify mission assigned
CREATE OR REPLACE FUNCTION public.notify_mission_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_squad_name TEXT;
  v_handler_name TEXT;
  v_mission_name TEXT;
  v_squad_members UUID[];
BEGIN
  v_mission_name := NEW.mission_snapshot->>'name';
  
  SELECT COALESCE(display_name, 'Handler') INTO v_handler_name
  FROM public.profiles WHERE id = NEW.handler_id;

  IF NEW.assignee_type = 'squad' THEN
    SELECT name INTO v_squad_name FROM public.squads WHERE id = NEW.assignee_id;
    
    SELECT ARRAY_AGG(user_id) INTO v_squad_members
    FROM public.squad_members
    WHERE squad_id = NEW.assignee_id AND user_id != NEW.handler_id;
    
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
$$;

-- Notify squad invite accepted
CREATE OR REPLACE FUNCTION public.notify_squad_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_squad_name TEXT;
  v_handler_id UUID;
  v_member_name TEXT;
BEGIN
  SELECT s.name, s.handler_id INTO v_squad_name, v_handler_id
  FROM squads s WHERE s.id = NEW.squad_id;
  
  SELECT COALESCE(display_name, 'Operative') INTO v_member_name
  FROM profiles WHERE id = NEW.user_id;
  
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

-- Notify rival invite accepted
CREATE OR REPLACE FUNCTION public.notify_rival_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rival_name TEXT;
BEGIN
  SELECT COALESCE(display_name, 'Operative') INTO v_rival_name
  FROM profiles WHERE id = NEW.rival_id;
  
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

-- Notify feedback submitted
CREATE OR REPLACE FUNCTION public.notify_feedback_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_admin_id UUID := '149573b7-1c81-4f58-9314-ab69d271a640'; -- Update for your admin
  v_body TEXT;
BEGIN
  SELECT COALESCE(display_name, 'Operative') INTO v_user_name
  FROM profiles WHERE id = NEW.user_id;
  
  v_body := 'From ' || v_user_name;
  IF NEW.contact_email IS NOT NULL AND NEW.contact_email != '' THEN
    v_body := v_body || ' (' || NEW.contact_email || ')';
  END IF;
  v_body := v_body || ': ' || LEFT(NEW.message, 80) || CASE WHEN LENGTH(NEW.message) > 80 THEN '...' ELSE '' END;
  
  PERFORM emit_notification(
    v_admin_id,
    'FEEDBACK_SUBMITTED',
    'New Feedback Received',
    v_body,
    '/profile?tab=notifications',
    'medium',
    jsonb_build_object('feedback_id', NEW.id, 'user_id', NEW.user_id, 'contact_email', NEW.contact_email, 'message', NEW.message)
  );
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- ASSIGNMENT FUNCTIONS
-- =====================================================

-- Get user assignments
CREATE OR REPLACE FUNCTION public.get_user_assignments(_user_id uuid)
RETURNS TABLE(
  id uuid, handler_id uuid, mission_snapshot jsonb, assignee_type text,
  status text, assigned_at timestamptz, due_at timestamptz,
  handler_name text, squad_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ma.id, ma.handler_id, ma.mission_snapshot, ma.assignee_type,
    ma.status, ma.assigned_at, ma.due_at,
    p.display_name as handler_name,
    CASE WHEN ma.assignee_type = 'SQUAD' THEN s.name ELSE NULL END as squad_name
  FROM public.mission_assignments ma
  LEFT JOIN public.profiles p ON p.id = ma.handler_id
  LEFT JOIN public.squads s ON ma.assignee_type = 'SQUAD' AND s.id = ma.assignee_id
  WHERE 
    ma.status != 'COMPLETED'
    AND (
      (ma.assignee_type = 'USER' AND ma.assignee_id = _user_id)
      OR
      (ma.assignee_type = 'SQUAD' AND EXISTS (
        SELECT 1 FROM public.squad_members sm
        WHERE sm.squad_id = ma.assignee_id AND sm.user_id = _user_id
      ))
    )
  ORDER BY ma.due_at ASC NULLS LAST, ma.assigned_at DESC;
$$;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Generate war report snapshot
CREATE OR REPLACE FUNCTION public.generate_war_report_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start DATE;
BEGIN
  week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  INSERT INTO public.war_report_campaign_snapshots (
    campaign_id, week_start_date, total_completions, unique_players_count,
    average_completion_time_seconds, replay_rate, fastest_completion_seconds,
    total_weight_lifted, total_score
  )
  SELECT 
    cc.campaign_id,
    week_start,
    COUNT(*)::INTEGER as total_completions,
    COUNT(DISTINCT cc.user_id)::INTEGER as unique_players_count,
    COALESCE(AVG(cc.completion_time_seconds), 0)::INTEGER as average_completion_time_seconds,
    CASE WHEN COUNT(DISTINCT cc.user_id) > 0 
      THEN ROUND((COUNT(*)::NUMERIC / COUNT(DISTINCT cc.user_id)::NUMERIC - 1) * 100, 2)
      ELSE 0 END as replay_rate,
    MIN(cc.completion_time_seconds)::INTEGER as fastest_completion_seconds,
    COALESCE(SUM(cc.total_weight), 0) as total_weight_lifted,
    COALESCE(SUM(cc.total_score), 0) as total_score
  FROM public.campaign_completions cc
  WHERE cc.completed_at >= week_start AND cc.completed_at < week_start + INTERVAL '7 days'
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Profile creation on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_weight_history_updated_at
  BEFORE UPDATE ON public.user_weight_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile stats trigger
CREATE TRIGGER update_profile_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats_on_session();

-- Milestone progress trigger
CREATE TRIGGER update_milestone_progress_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_milestone_progress();

-- Mission popularity trigger
CREATE TRIGGER update_mission_popularity_trigger
  AFTER UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_mission_popularity();

-- Notification triggers
CREATE TRIGGER notify_mission_assigned_trigger
  AFTER INSERT ON public.mission_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_mission_assigned();

CREATE TRIGGER notify_squad_invite_accepted_trigger
  AFTER INSERT ON public.squad_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_squad_invite_accepted();

CREATE TRIGGER notify_rival_invite_accepted_trigger
  AFTER INSERT ON public.rivalries
  FOR EACH ROW EXECUTE FUNCTION public.notify_rival_invite_accepted();

CREATE TRIGGER notify_feedback_submitted_trigger
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_submitted();
