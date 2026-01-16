-- =============================================
-- PHASE 1: Personal Records & Milestones Schema
-- =============================================

-- 1. Create personal_records table for detailed PR tracking
-- This extends beyond user_weight_history to track multiple PR types
CREATE TABLE public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'WEIGHT', 'REPS', 'VOLUME'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lb',
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Each user can have one record per exercise per type
  UNIQUE(user_id, exercise_id, record_type)
);

-- Enable RLS
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal_records
CREATE POLICY "Users view own PRs"
  ON public.personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own PRs"
  ON public.personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own PRs"
  ON public.personal_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own PRs"
  ON public.personal_records FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_personal_records_user_exercise ON public.personal_records(user_id, exercise_id);

-- 2. Create milestones table (definitions)
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'WEIGHT', 'REPS', 'MISSIONS', 'SETS', 'STREAK', 'XP'
  target_value NUMERIC NOT NULL,
  icon TEXT, -- emoji or icon name
  tier INTEGER NOT NULL DEFAULT 1, -- bronze=1, silver=2, gold=3, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read)
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view milestones"
  ON public.milestones FOR SELECT
  USING (is_active = true);

-- 3. Create user_milestones table (progress tracking)
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  current_value NUMERIC NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own milestone progress"
  ON public.user_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own milestone progress"
  ON public.user_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own milestone progress"
  ON public.user_milestones FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_milestones_user ON public.user_milestones(user_id);

-- 4. Seed initial milestones
INSERT INTO public.milestones (name, code_name, description, category, target_value, icon, tier, sort_order) VALUES
-- Weight milestones (cumulative)
('Iron Recruit', 'weight_1k', 'Lift 1,000 lbs total', 'WEIGHT', 1000, '🏋️', 1, 1),
('Steel Soldier', 'weight_10k', 'Lift 10,000 lbs total', 'WEIGHT', 10000, '⚔️', 2, 2),
('Iron Warrior', 'weight_50k', 'Lift 50,000 lbs total', 'WEIGHT', 50000, '🛡️', 3, 3),
('Titan', 'weight_100k', 'Lift 100,000 lbs total', 'WEIGHT', 100000, '👑', 4, 4),
('Demigod', 'weight_500k', 'Lift 500,000 lbs total', 'WEIGHT', 500000, '⚡', 5, 5),

-- Mission milestones
('First Blood', 'missions_1', 'Complete your first mission', 'MISSIONS', 1, '🎯', 1, 10),
('Operator', 'missions_10', 'Complete 10 missions', 'MISSIONS', 10, '🔫', 2, 11),
('Veteran', 'missions_50', 'Complete 50 missions', 'MISSIONS', 50, '🎖️', 3, 12),
('Legend', 'missions_100', 'Complete 100 missions', 'MISSIONS', 100, '🏆', 4, 13),

-- Sets milestones
('Warm Up', 'sets_10', 'Complete 10 sets', 'SETS', 10, '💪', 1, 20),
('Getting Serious', 'sets_100', 'Complete 100 sets', 'SETS', 100, '🔥', 2, 21),
('Relentless', 'sets_500', 'Complete 500 sets', 'SETS', 500, '💀', 3, 22),
('Unstoppable', 'sets_1000', 'Complete 1,000 sets', 'SETS', 1000, '🌟', 4, 23),

-- XP milestones
('Rookie', 'xp_1k', 'Earn 1,000 XP', 'XP', 1000, '⭐', 1, 30),
('Experienced', 'xp_10k', 'Earn 10,000 XP', 'XP', 10000, '🌟', 2, 31),
('Elite', 'xp_50k', 'Earn 50,000 XP', 'XP', 50000, '💫', 3, 32),
('Legendary', 'xp_100k', 'Earn 100,000 XP', 'XP', 100000, '✨', 4, 33);

-- 5. Create trigger to update user_milestones.updated_at
CREATE TRIGGER update_user_milestones_updated_at
  BEFORE UPDATE ON public.user_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create function to check and update milestone progress
CREATE OR REPLACE FUNCTION public.update_milestone_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  milestone_rec RECORD;
  current_val NUMERIC;
BEGIN
  -- Loop through all active milestones and check progress for this user
  FOR milestone_rec IN 
    SELECT id, category, target_value FROM public.milestones WHERE is_active = true
  LOOP
    -- Calculate current value based on category
    CASE milestone_rec.category
      WHEN 'WEIGHT' THEN
        current_val := NEW.total_weight;
      WHEN 'SETS' THEN
        current_val := NEW.total_sets;
      WHEN 'REPS' THEN
        current_val := NEW.total_reps;
      WHEN 'XP' THEN
        current_val := NEW.total_xp;
      ELSE
        current_val := 0;
    END CASE;
    
    -- Upsert milestone progress
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

-- 7. Create trigger on profiles to update milestone progress
CREATE TRIGGER profile_milestone_progress_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.total_weight IS DISTINCT FROM NEW.total_weight OR
    OLD.total_sets IS DISTINCT FROM NEW.total_sets OR
    OLD.total_reps IS DISTINCT FROM NEW.total_reps OR
    OLD.total_xp IS DISTINCT FROM NEW.total_xp
  )
  EXECUTE FUNCTION public.update_milestone_progress();

-- 8. Create function to count completed missions for milestone tracking
CREATE OR REPLACE FUNCTION public.get_completed_mission_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.workout_sessions
  WHERE user_id = p_user_id AND status = 'COMPLETED';
$$;