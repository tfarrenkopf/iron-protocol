-- Create trigger function to update profile stats atomically on workout session changes
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_session()
RETURNS TRIGGER
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
    -- Session was just completed (status changed to COMPLETED)
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

-- Create trigger on workout_sessions table
DROP TRIGGER IF EXISTS workout_session_stats_trigger ON public.workout_sessions;
CREATE TRIGGER workout_session_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_stats_on_session();