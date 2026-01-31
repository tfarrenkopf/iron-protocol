-- =====================================================
-- IRON PROTOCOL - Consolidated Database Schema Export
-- Generated: 2026-01-31
-- =====================================================
-- This file contains the complete database schema.
-- For individual migrations, see supabase/migrations/
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.equipment_type AS ENUM (
  'BENCH', 'DUMBBELLS', 'BARBELL', 'CABLE_MACHINE', 'LAT_PULLDOWN', 
  'LEG_PRESS', 'LEG_CURL', 'LEG_EXTENSION', 'SMITH_MACHINE', 
  'PEC_DECK', 'CHEST_PRESS', 'SHOULDER_PRESS_MACHINE', 'SEATED_ROW',
  'PULL_UP_BAR', 'DIP_STATION', 'PREACHER_BENCH', 'HACK_SQUAT',
  'CALF_RAISE', 'AB_MACHINE', 'BODYWEIGHT', 'KETTLEBELL', 'EZ_BAR'
);

CREATE TYPE public.app_role AS ENUM ('user', 'handler');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- PROFILES: User identity and stats
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT UNIQUE,
  total_score BIGINT NOT NULL DEFAULT 0,
  total_xp BIGINT NOT NULL DEFAULT 0,
  total_sets INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  total_weight BIGINT NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  active_campaign_id UUID,
  equipped_icon_id UUID,
  equipped_title_id UUID,
  rival_code TEXT DEFAULT SUBSTRING(md5((random())::text) FROM 1 FOR 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT display_name_length CHECK (display_name IS NULL OR (char_length(display_name) >= 3 AND char_length(display_name) <= 15))
);

-- EXERCISES: Exercise library
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exercise_name_length CHECK (char_length(name) <= 50)
);

-- MISSIONS: Workout mission templates
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MISSION_EXERCISES: Junction table
CREATE TABLE public.mission_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER NOT NULL DEFAULT 10,
  rest_between_sets_sec INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COLLECTIONS: Campaigns/collections of missions
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  is_system BOOLEAN NOT NULL DEFAULT false,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COLLECTION_MISSIONS: Junction table
CREATE TABLE public.collection_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WORKOUT_SESSIONS: Active/completed workouts
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  mission_snapshot JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'ABORTED')),
  score_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  sets_completed INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  damage_dealt INTEGER NOT NULL DEFAULT 0
);

-- WORKOUT_SETS: Individual set logs
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
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_WEIGHT_HISTORY: Remember last weight per exercise
CREATE TABLE public.user_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  last_weight NUMERIC NOT NULL DEFAULT 0,
  max_weight NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'lb',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- PERSONAL_RECORDS: PR tracking
CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lb',
  session_id UUID REFERENCES public.workout_sessions(id),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HIIT_CONFIGS: Timer presets
CREATE TABLE public.hiit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  work_duration_sec INTEGER NOT NULL DEFAULT 20,
  rest_duration_sec INTEGER NOT NULL DEFAULT 10,
  rounds INTEGER NOT NULL DEFAULT 8,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- GAMIFICATION TABLES
-- =====================================================

-- ACHIEVEMENTS: Achievement definitions
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  hint TEXT,
  icon TEXT,
  category TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_value NUMERIC NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_ACHIEVEMENTS: Unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- MILESTONES: Progress milestones
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_MILESTONES: User milestone progress
CREATE TABLE public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  current_value NUMERIC NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- COSMETICS: Unlockable cosmetics
CREATE TABLE public.cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  unlock_achievement_id UUID REFERENCES public.achievements(id),
  unlock_milestone_id UUID REFERENCES public.milestones(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_COSMETICS: User unlocked cosmetics
CREATE TABLE public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, cosmetic_id)
);

-- =====================================================
-- WEEKLY BOSS SYSTEM
-- =====================================================

-- BOSS_TEMPLATES: Boss template definitions
CREATE TABLE public.boss_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  lore TEXT NOT NULL,
  image_url TEXT,
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  weakness_multiplier NUMERIC NOT NULL DEFAULT 1.25,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WEEKLY_BOSSES: Active/historical weekly bosses
CREATE TABLE public.weekly_bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.boss_templates(id),
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  lore TEXT NOT NULL,
  image_url TEXT,
  max_hp INTEGER NOT NULL DEFAULT 1000000,
  current_hp INTEGER NOT NULL DEFAULT 1000000,
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  weakness_multiplier NUMERIC NOT NULL DEFAULT 1.25,
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_defeated BOOLEAN NOT NULL DEFAULT false,
  defeated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WEEKLY_BOSS_DAMAGE: User damage contributions
CREATE TABLE public.weekly_boss_damage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id UUID NOT NULL REFERENCES public.weekly_bosses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID UNIQUE REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  base_damage INTEGER NOT NULL DEFAULT 0,
  bonus_damage INTEGER NOT NULL DEFAULT 0,
  total_damage INTEGER NOT NULL DEFAULT 0,
  weakness_hits TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- USER_ROLES: Role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- SQUADS: Training groups
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SQUAD_MEMBERS: Squad membership
CREATE TABLE public.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_stats BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- MISSION_ASSIGNMENTS: Handler-assigned missions
CREATE TABLE public.mission_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL,
  assignee_type TEXT NOT NULL CHECK (assignee_type IN ('USER', 'SQUAD')),
  mission_snapshot JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_session_id UUID REFERENCES public.workout_sessions(id)
);

-- RIVALRIES: Rival tracking
CREATE TABLE public.rivalries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rival_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, rival_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- NOTIFICATIONS: In-app notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'unread',
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_NOTIFICATION_PREFERENCES: Notification settings
CREATE TABLE public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  type_preferences JSONB NOT NULL DEFAULT '{"BOSS_UPDATE": true, "SYSTEM_ALERT": true, "WEEKLY_SUMMARY": true, "MISSION_ASSIGNED": true, "RIVAL_INVITE_ACCEPTED": true, "SQUAD_INVITE_ACCEPTED": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FEEDBACK: User feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- CAMPAIGN_COMPLETIONS: Campaign completion records
CREATE TABLE public.campaign_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  missions_completed INTEGER NOT NULL,
  completion_time_seconds INTEGER NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  is_personal_record BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_CAMPAIGN_PROGRESS: Active campaign progress
CREATE TABLE public.user_campaign_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  missions_completed_count INTEGER NOT NULL DEFAULT 0,
  total_missions_count INTEGER NOT NULL DEFAULT 0,
  current_run_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  best_completion_time_seconds INTEGER,
  total_completions INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- WAR_REPORT_CAMPAIGN_SNAPSHOTS: Weekly analytics
CREATE TABLE public.war_report_campaign_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  total_completions INTEGER DEFAULT 0,
  unique_players_count INTEGER DEFAULT 0,
  average_completion_time_seconds INTEGER DEFAULT 0,
  replay_rate NUMERIC DEFAULT 0,
  fastest_completion_seconds INTEGER,
  total_weight_lifted NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, week_start_date)
);

-- USER_TIME_TRACKING: Session time tracking
CREATE TABLE public.user_time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_mission_exercises_mission ON public.mission_exercises(mission_id);
CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sets_session ON public.workout_sets(session_id);
CREATE INDEX idx_user_weight_history_user ON public.user_weight_history(user_id);
CREATE UNIQUE INDEX exercises_unique_name_per_user ON public.exercises (name, COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid));

-- =====================================================
-- VIEWS
-- =====================================================

-- Global Leaderboard
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

-- Mission Leaderboard
CREATE VIEW public.mission_leaderboard AS
SELECT 
  ws.mission_id,
  ws.user_id,
  p.display_name,
  ws.score_earned,
  ws.total_weight,
  ws.max_combo,
  ws.completed_at,
  RANK() OVER (PARTITION BY ws.mission_id ORDER BY ws.score_earned DESC) as rank
FROM public.workout_sessions ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.status = 'COMPLETED' AND ws.mission_id IS NOT NULL;

-- Weekly Boss Leaderboard
CREATE VIEW public.weekly_boss_leaderboard AS
SELECT
  d.boss_id,
  d.user_id,
  p.display_name,
  SUM(d.base_damage) as base_damage,
  SUM(d.bonus_damage) as bonus_damage,
  SUM(d.total_damage) as total_damage,
  COUNT(d.id) as contribution_count,
  SUM(array_length(d.weakness_hits, 1)) as weakness_hits_count,
  RANK() OVER (PARTITION BY d.boss_id ORDER BY SUM(d.total_damage) DESC) as rank
FROM public.weekly_boss_damage d
JOIN public.profiles p ON p.id = d.user_id
GROUP BY d.boss_id, d.user_id, p.display_name;

-- Rival Weekly Stats
CREATE VIEW public.rival_weekly_stats AS
SELECT
  p.id as user_id,
  p.display_name,
  p.rival_code,
  COALESCE(SUM(ws.score_earned), 0) as weekly_score,
  COALESCE(SUM(ws.total_weight), 0) as weekly_weight,
  COUNT(ws.id) as weekly_sessions,
  COALESCE(SUM(ws.sets_completed), 0) as weekly_sets,
  COALESCE(MAX(ws.max_combo), 0) as weekly_max_combo
FROM public.profiles p
LEFT JOIN public.workout_sessions ws ON ws.user_id = p.id
  AND ws.status = 'COMPLETED'
  AND ws.completed_at >= date_trunc('week', CURRENT_TIMESTAMP)
GROUP BY p.id, p.display_name, p.rival_code;

-- War Report Current Week
CREATE VIEW public.war_report_current_week AS
SELECT 
  s.*,
  c.name as campaign_name,
  c.code_name as campaign_code
FROM public.war_report_campaign_snapshots s
JOIN public.collections c ON c.id = s.campaign_id
WHERE s.week_start_date = date_trunc('week', CURRENT_DATE)::DATE;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiit_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_boss_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rivalries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_report_campaign_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- See supabase/rls-policies.sql for all RLS policies
-- See supabase/functions.sql for all database functions
-- =====================================================
