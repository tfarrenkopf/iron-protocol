-- Create boss templates table with 12 unique bosses
CREATE TABLE public.boss_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code_name TEXT NOT NULL UNIQUE,
  lore TEXT NOT NULL,
  image_url TEXT,
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  weakness_multiplier NUMERIC NOT NULL DEFAULT 1.25,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boss_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view boss templates
CREATE POLICY "Anyone can view boss templates"
ON public.boss_templates FOR SELECT
USING (is_active = true);

-- Insert 12 unique bosses with varied weaknesses
INSERT INTO public.boss_templates (name, code_name, lore, weaknesses, weakness_multiplier, sort_order) VALUES
('Iron Goliath', 'iron_goliath', 'A rogue war machine forged from the wreckage of a forgotten facility. Its reinforced legs and armored back are its only structural weaknesses. Strike where the plating is thin.', ARRAY['LEGS', 'BACK'], 1.25, 1),
('Phantom Sentinel', 'phantom_sentinel', 'An experimental stealth unit that escaped containment. Its chest cavity houses an exposed power core, and its shoulder joints lack proper shielding. Precision strikes recommended.', ARRAY['CHEST', 'SHOULDERS'], 1.25, 2),
('Crimson Berserker', 'crimson_berserker', 'Once a training drone, now corrupted by a viral subroutine. It attacks relentlessly but its arm servos overheat under sustained assault. Target the upper extremities.', ARRAY['ARMS', 'CHEST'], 1.30, 3),
('Titan Breaker', 'titan_breaker', 'A siege-class unit designed to demolish fortifications. Its massive legs are its foundation and weakness. Undermine its stability to bring it down.', ARRAY['LEGS', 'CORE'], 1.25, 4),
('Shadow Reaper', 'shadow_reaper', 'An assassin protocol gone rogue. Fast but fragile, its back-mounted thrusters and exposed core make it vulnerable to coordinated strikes.', ARRAY['BACK', 'CORE'], 1.30, 5),
('Storm Warden', 'storm_warden', 'An environmental control unit that weaponized its own systems. Its shoulder-mounted generators and leg stabilizers are critical failure points.', ARRAY['SHOULDERS', 'LEGS'], 1.25, 6),
('Void Crusher', 'void_crusher', 'A gravity manipulation unit that bends space around itself. Its chest reactor and arm gauntlets draw immense power—overload them.', ARRAY['CHEST', 'ARMS'], 1.25, 7),
('Apex Predator', 'apex_predator', 'A hunter-killer prototype with adaptive camouflage. Its back-mounted sensor array and core processor are shielded but not impenetrable.', ARRAY['BACK', 'CORE'], 1.35, 8),
('Nuclear Phantom', 'nuclear_phantom', 'A reactor breach spawned this radioactive nightmare. Its unstable core and weakened leg joints are its undoing. Approach with overwhelming force.', ARRAY['CORE', 'LEGS'], 1.30, 9),
('Chrome Devastator', 'chrome_devastator', 'Pure destruction incarnate. This heavy assault unit has reinforced everything except its shoulder artillery mounts and arm weapon systems.', ARRAY['SHOULDERS', 'ARMS'], 1.25, 10),
('Obsidian Wraith', 'obsidian_wraith', 'A psychological warfare unit that projects fear. Its chest-mounted emitter and exposed back vents are physical weaknesses in an otherwise terrifying frame.', ARRAY['CHEST', 'BACK'], 1.30, 11),
('Omega Protocol', 'omega_protocol', 'The final boss. A command unit that coordinates all others. Every system is a target—focus fire on legs, arms, and core simultaneously for maximum damage.', ARRAY['LEGS', 'ARMS', 'CORE'], 1.40, 12);

-- Add template_id to weekly_bosses for tracking which template was used
ALTER TABLE public.weekly_bosses ADD COLUMN template_id UUID REFERENCES public.boss_templates(id);

-- Create view for boss defeat leaderboard
CREATE OR REPLACE VIEW public.weekly_boss_leaderboard AS
SELECT 
  d.user_id,
  p.display_name,
  d.boss_id,
  SUM(d.total_damage) as total_damage,
  SUM(d.base_damage) as base_damage,
  SUM(d.bonus_damage) as bonus_damage,
  COUNT(d.id) as contribution_count,
  COALESCE(SUM(array_length(d.weakness_hits, 1)), 0) as weakness_hits_count,
  RANK() OVER (PARTITION BY d.boss_id ORDER BY SUM(d.total_damage) DESC) as rank
FROM public.weekly_boss_damage d
JOIN public.profiles p ON p.id = d.user_id
GROUP BY d.user_id, p.display_name, d.boss_id;

-- Create function to rotate weekly boss with dynamic HP
CREATE OR REPLACE FUNCTION public.rotate_weekly_boss()
RETURNS public.weekly_bosses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  -- Calculate week boundaries (Monday 00:00 UTC)
  week_start_ts := date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  week_end_ts := week_start_ts + INTERVAL '7 days' - INTERVAL '1 second';
  
  -- Get prior boss stats
  SELECT * INTO prior_boss FROM public.weekly_bosses WHERE is_active = true LIMIT 1;
  
  IF prior_boss.id IS NOT NULL THEN
    -- Calculate prior week's total damage and contributors
    SELECT 
      COALESCE(SUM(total_damage), 0),
      COUNT(DISTINCT user_id)
    INTO prior_week_damage, prior_week_contributors
    FROM public.weekly_boss_damage
    WHERE boss_id = prior_boss.id;
    
    -- Deactivate prior boss
    UPDATE public.weekly_bosses SET is_active = false WHERE id = prior_boss.id;
  ELSE
    prior_week_damage := 0;
    prior_week_contributors := 0;
  END IF;
  
  -- Calculate new HP based on prior activity
  -- Formula: 85% of prior damage (achievable with similar effort)
  -- Min: 500,000 | Max: 5,000,000
  IF prior_week_damage > 0 THEN
    -- Scale HP to be ~85% of prior week's damage output
    calculated_hp := GREATEST(500000, LEAST(5000000, (prior_week_damage * 0.85)::INTEGER));
    
    -- Boost slightly if many contributors (reward community engagement)
    IF prior_week_contributors > 50 THEN
      calculated_hp := LEAST(5000000, calculated_hp + (prior_week_contributors * 1000));
    END IF;
  ELSE
    -- Default for first week or no activity
    calculated_hp := 1000000;
  END IF;
  
  -- Select next boss template (rotate through by sort_order)
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
  
  -- Fallback if all templates recently used
  IF next_template.id IS NULL THEN
    SELECT * INTO next_template
    FROM public.boss_templates
    WHERE is_active = true
    ORDER BY sort_order
    LIMIT 1;
  END IF;
  
  -- Create new weekly boss
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

-- Create function to get boss defeat stats
CREATE OR REPLACE FUNCTION public.get_boss_defeat_stats(p_boss_id UUID)
RETURNS TABLE(
  boss_name TEXT,
  max_hp INTEGER,
  total_damage_dealt BIGINT,
  time_to_defeat_seconds BIGINT,
  unique_contributors BIGINT,
  total_contributions BIGINT,
  total_weakness_hits BIGINT,
  defeated_at TIMESTAMP WITH TIME ZONE,
  week_start TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
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

-- Grant access to the leaderboard view
GRANT SELECT ON public.weekly_boss_leaderboard TO anon, authenticated;