-- =====================================================
-- IRON PROTOCOL - Complete Database Schema
-- Sprint 1: Core Features
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE (User identity & leaderboard)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT UNIQUE,
  total_score BIGINT NOT NULL DEFAULT 0,
  total_xp BIGINT NOT NULL DEFAULT 0,
  total_sets INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  total_weight BIGINT NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT display_name_length CHECK (display_name IS NULL OR (char_length(display_name) >= 3 AND char_length(display_name) <= 15))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (for leaderboard)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. EQUIPMENT ENUM
-- =====================================================
CREATE TYPE public.equipment_type AS ENUM (
  'BENCH', 'DUMBBELLS', 'BARBELL', 'CABLE_MACHINE', 'LAT_PULLDOWN', 
  'LEG_PRESS', 'LEG_CURL', 'LEG_EXTENSION', 'SMITH_MACHINE', 
  'PEC_DECK', 'CHEST_PRESS', 'SHOULDER_PRESS_MACHINE', 'SEATED_ROW',
  'PULL_UP_BAR', 'DIP_STATION', 'PREACHER_BENCH', 'HACK_SQUAT',
  'CALF_RAISE', 'AB_MACHINE', 'BODYWEIGHT', 'KETTLEBELL', 'EZ_BAR'
);

-- =====================================================
-- 3. EXERCISES TABLE
-- =====================================================
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  equipment equipment_type[] NOT NULL DEFAULT '{}',
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_groups TEXT[] DEFAULT '{}',
  focus_areas TEXT[] DEFAULT '{}',
  instructions_setup TEXT,
  instructions_execution TEXT,
  instructions_tips TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_public_mission_allowed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT exercise_name_length CHECK (char_length(name) <= 50)
);

-- Unique constraint: exercise name per user (NULL created_by = system/public)
CREATE UNIQUE INDEX exercises_unique_name_per_user 
  ON public.exercises (name, COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- View public exercises OR own exercises
CREATE POLICY "View public or own exercises" ON public.exercises
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

-- Create own private exercises only
CREATE POLICY "Create own private exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_public = false);

-- Update own exercises only
CREATE POLICY "Update own exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by AND is_public = false);

-- Delete own exercises only
CREATE POLICY "Delete own exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = created_by AND is_public = false);

-- =====================================================
-- 4. MISSIONS TABLE
-- =====================================================
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  description TEXT,
  focus_areas TEXT[] DEFAULT '{}',
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  intro_lore TEXT,
  outro_lore TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- View public missions OR own missions
CREATE POLICY "View public or own missions" ON public.missions
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

-- Create own private missions only
CREATE POLICY "Create own private missions" ON public.missions
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_public = false);

-- Update own missions only
CREATE POLICY "Update own missions" ON public.missions
  FOR UPDATE USING (auth.uid() = created_by AND is_public = false);

-- Delete own missions only
CREATE POLICY "Delete own missions" ON public.missions
  FOR DELETE USING (auth.uid() = created_by AND is_public = false);

-- =====================================================
-- 5. MISSION EXERCISES (Junction table)
-- =====================================================
CREATE TABLE public.mission_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER NOT NULL DEFAULT 10,
  rest_between_sets_sec INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_exercises_mission ON public.mission_exercises(mission_id);

ALTER TABLE public.mission_exercises ENABLE ROW LEVEL SECURITY;

-- View if can view parent mission
CREATE POLICY "View mission exercises if can view mission" ON public.mission_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE id = mission_id AND (is_public = true OR created_by = auth.uid())
    )
  );

-- Insert if owns parent mission
CREATE POLICY "Insert mission exercises if owns mission" ON public.mission_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE id = mission_id AND created_by = auth.uid()
    )
  );

-- Update if owns parent mission
CREATE POLICY "Update mission exercises if owns mission" ON public.mission_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE id = mission_id AND created_by = auth.uid()
    )
  );

-- Delete if owns parent mission
CREATE POLICY "Delete mission exercises if owns mission" ON public.mission_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE id = mission_id AND created_by = auth.uid()
    )
  );

-- =====================================================
-- 6. USER WEIGHT HISTORY (Remember last weight per exercise)
-- =====================================================
CREATE TABLE public.user_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  last_weight NUMERIC NOT NULL DEFAULT 0,
  max_weight NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'lb',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX idx_user_weight_history_user ON public.user_weight_history(user_id);

ALTER TABLE public.user_weight_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own weight history
CREATE POLICY "Users view own weight history" ON public.user_weight_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own weight history
CREATE POLICY "Users insert own weight history" ON public.user_weight_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own weight history
CREATE POLICY "Users update own weight history" ON public.user_weight_history
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 7. WORKOUT SESSIONS
-- =====================================================
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  mission_snapshot JSONB, -- Store mission data at time of workout
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'ABORTED')),
  score_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  sets_completed INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  damage_dealt INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users view own sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users insert own sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users update own sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 8. WORKOUT SETS (Individual set logs)
-- =====================================================
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_reps INTEGER,
  actual_reps INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lb',
  score_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_sets_session ON public.workout_sets(session_id);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Users can view sets from their sessions
CREATE POLICY "Users view own workout sets" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can insert sets to their sessions
CREATE POLICY "Users insert own workout sets" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. HIIT CONFIGS
-- =====================================================
CREATE TABLE public.hiit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  work_duration_sec INTEGER NOT NULL DEFAULT 20,
  rest_duration_sec INTEGER NOT NULL DEFAULT 10,
  rounds INTEGER NOT NULL DEFAULT 8,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hiit_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View public or own HIIT configs" ON public.hiit_configs
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Create own HIIT configs" ON public.hiit_configs
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Update own HIIT configs" ON public.hiit_configs
  FOR UPDATE USING (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Delete own HIIT configs" ON public.hiit_configs
  FOR DELETE USING (auth.uid() = created_by AND is_public = false);

-- =====================================================
-- 10. GLOBAL LEADERBOARD VIEW
-- =====================================================
CREATE VIEW public.global_leaderboard AS
SELECT 
  display_name,
  total_score,
  total_xp,
  total_sets,
  max_combo,
  RANK() OVER (ORDER BY total_score DESC) as rank
FROM public.profiles
WHERE display_name IS NOT NULL
ORDER BY total_score DESC;

-- =====================================================
-- 11. HELPER FUNCTION: Calculate Difficulty Score
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_mission_difficulty(
  p_estimated_minutes INTEGER,
  p_exercise_count INTEGER,
  p_total_sets INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_score INTEGER;
BEGIN
  -- Base score from time
  base_score := CASE
    WHEN p_estimated_minutes <= 15 THEN 1
    WHEN p_estimated_minutes <= 25 THEN 2
    WHEN p_estimated_minutes <= 35 THEN 3
    WHEN p_estimated_minutes <= 50 THEN 4
    ELSE 5
  END;
  
  -- Adjust based on intensity (sets per exercise)
  IF p_exercise_count > 0 THEN
    base_score := base_score + LEAST(2, (p_total_sets / p_exercise_count - 3) / 2);
  END IF;
  
  RETURN GREATEST(1, LEAST(5, base_score));
END;
$$;

-- =====================================================
-- 12. UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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