-- Weekly Boss System Tables

-- Table for weekly boss definitions
CREATE TABLE public.weekly_bosses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code_name TEXT NOT NULL UNIQUE,
  lore TEXT NOT NULL,
  image_url TEXT,
  max_hp INTEGER NOT NULL DEFAULT 1000000,
  current_hp INTEGER NOT NULL DEFAULT 1000000,
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  weakness_multiplier NUMERIC NOT NULL DEFAULT 1.25,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_defeated BOOLEAN NOT NULL DEFAULT false,
  defeated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking user damage contributions per boss
CREATE TABLE public.weekly_boss_damage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boss_id UUID NOT NULL REFERENCES public.weekly_bosses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  base_damage INTEGER NOT NULL DEFAULT 0,
  bonus_damage INTEGER NOT NULL DEFAULT 0,
  total_damage INTEGER NOT NULL DEFAULT 0,
  weakness_hits TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Create indexes for performance
CREATE INDEX idx_weekly_bosses_active ON public.weekly_bosses(is_active) WHERE is_active = true;
CREATE INDEX idx_weekly_bosses_week ON public.weekly_bosses(week_start, week_end);
CREATE INDEX idx_weekly_boss_damage_boss_id ON public.weekly_boss_damage(boss_id);
CREATE INDEX idx_weekly_boss_damage_user_id ON public.weekly_boss_damage(user_id);

-- Enable RLS
ALTER TABLE public.weekly_bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_boss_damage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_bosses (everyone can read, only system can write)
CREATE POLICY "Anyone can view weekly bosses"
  ON public.weekly_bosses FOR SELECT
  USING (true);

-- RLS Policies for weekly_boss_damage
CREATE POLICY "Users can view all damage contributions"
  ON public.weekly_boss_damage FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own damage"
  ON public.weekly_boss_damage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get current active boss
CREATE OR REPLACE FUNCTION public.get_active_weekly_boss()
RETURNS TABLE (
  id UUID,
  name TEXT,
  code_name TEXT,
  lore TEXT,
  image_url TEXT,
  max_hp INTEGER,
  current_hp INTEGER,
  weaknesses TEXT[],
  weakness_multiplier NUMERIC,
  week_start TIMESTAMP WITH TIME ZONE,
  week_end TIMESTAMP WITH TIME ZONE,
  is_defeated BOOLEAN,
  defeated_at TIMESTAMP WITH TIME ZONE,
  total_damage_dealt BIGINT,
  unique_contributors BIGINT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    b.id,
    b.name,
    b.code_name,
    b.lore,
    b.image_url,
    b.max_hp,
    b.current_hp,
    b.weaknesses,
    b.weakness_multiplier,
    b.week_start,
    b.week_end,
    b.is_defeated,
    b.defeated_at,
    COALESCE(SUM(d.total_damage), 0)::BIGINT as total_damage_dealt,
    COUNT(DISTINCT d.user_id)::BIGINT as unique_contributors
  FROM public.weekly_bosses b
  LEFT JOIN public.weekly_boss_damage d ON d.boss_id = b.id
  WHERE b.is_active = true
  GROUP BY b.id
  LIMIT 1;
$$;

-- Function to get user's damage for current boss
CREATE OR REPLACE FUNCTION public.get_user_boss_damage(p_user_id UUID)
RETURNS TABLE (
  total_damage BIGINT,
  contribution_count BIGINT,
  weakness_hits_count BIGINT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(SUM(d.total_damage), 0)::BIGINT as total_damage,
    COUNT(d.id)::BIGINT as contribution_count,
    COALESCE(SUM(array_length(d.weakness_hits, 1)), 0)::BIGINT as weakness_hits_count
  FROM public.weekly_boss_damage d
  JOIN public.weekly_bosses b ON b.id = d.boss_id AND b.is_active = true
  WHERE d.user_id = p_user_id;
$$;

-- Function to apply damage to boss (called after workout)
CREATE OR REPLACE FUNCTION public.apply_boss_damage(
  p_user_id UUID,
  p_session_id UUID,
  p_base_damage INTEGER,
  p_bonus_damage INTEGER,
  p_weakness_hits TEXT[]
)
RETURNS public.weekly_bosses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_boss public.weekly_bosses%ROWTYPE;
  total_dmg INTEGER;
BEGIN
  -- Get active boss
  SELECT * INTO active_boss FROM public.weekly_bosses WHERE is_active = true LIMIT 1;
  
  IF active_boss.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate total damage
  total_dmg := p_base_damage + p_bonus_damage;
  
  -- Insert damage record
  INSERT INTO public.weekly_boss_damage (boss_id, user_id, session_id, base_damage, bonus_damage, total_damage, weakness_hits)
  VALUES (active_boss.id, p_user_id, p_session_id, p_base_damage, p_bonus_damage, total_dmg, p_weakness_hits)
  ON CONFLICT (session_id) DO UPDATE SET
    base_damage = EXCLUDED.base_damage,
    bonus_damage = EXCLUDED.bonus_damage,
    total_damage = EXCLUDED.total_damage,
    weakness_hits = EXCLUDED.weakness_hits;
  
  -- Update boss HP
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

-- Insert first weekly boss (Iron Goliath)
INSERT INTO public.weekly_bosses (
  name,
  code_name,
  lore,
  image_url,
  max_hp,
  current_hp,
  weaknesses,
  weakness_multiplier,
  week_start,
  week_end,
  is_active
) VALUES (
  'Iron Goliath',
  'iron_goliath',
  'A rogue war machine threatens the protocol. Complete your missions to disable its cores.',
  NULL,
  1000000,
  1000000,
  ARRAY['LEGS', 'BACK'],
  1.25,
  date_trunc('week', CURRENT_TIMESTAMP),
  date_trunc('week', CURRENT_TIMESTAMP) + INTERVAL '7 days' - INTERVAL '1 second',
  true
);

-- Enable realtime for boss updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_bosses;