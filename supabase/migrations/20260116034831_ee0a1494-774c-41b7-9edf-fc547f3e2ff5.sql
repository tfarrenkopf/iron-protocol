-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'consistency', 'performance', 'exploration', 'hidden'
  trigger_type TEXT NOT NULL, -- 'sets_completed', 'weight_lifted', 'prs_set', 'missions_completed', 'combo_reached', 'first_workout', etc.
  trigger_value NUMERIC NOT NULL DEFAULT 1,
  icon TEXT,
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  hint TEXT, -- cryptic hint for hidden achievements
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Create cosmetics table
CREATE TABLE public.cosmetics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'title', 'icon', 'border', 'effect'
  value TEXT NOT NULL, -- the actual title text, icon emoji, or CSS class
  rarity TEXT NOT NULL DEFAULT 'common',
  unlock_achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  unlock_milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_cosmetics table
CREATE TABLE public.user_cosmetics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, cosmetic_id)
);

-- Add equipped cosmetics to profiles for quick access
ALTER TABLE public.profiles 
  ADD COLUMN equipped_title_id UUID REFERENCES public.cosmetics(id) ON DELETE SET NULL,
  ADD COLUMN equipped_icon_id UUID REFERENCES public.cosmetics(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;

-- Achievements policies (public read)
CREATE POLICY "Anyone can view active achievements" 
  ON public.achievements FOR SELECT 
  USING (is_active = true AND is_hidden = false);

CREATE POLICY "Users can view hidden achievements they've unlocked" 
  ON public.achievements FOR SELECT 
  USING (is_hidden = true AND EXISTS (
    SELECT 1 FROM public.user_achievements 
    WHERE user_achievements.achievement_id = achievements.id 
    AND user_achievements.user_id = auth.uid()
  ));

-- User achievements policies
CREATE POLICY "Users view own achievements" 
  ON public.user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements" 
  ON public.user_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own achievements" 
  ON public.user_achievements FOR UPDATE 
  USING (auth.uid() = user_id);

-- Cosmetics policies (public read)
CREATE POLICY "Anyone can view active cosmetics" 
  ON public.cosmetics FOR SELECT 
  USING (is_active = true);

-- User cosmetics policies
CREATE POLICY "Users view own cosmetics" 
  ON public.user_cosmetics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own cosmetics" 
  ON public.user_cosmetics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cosmetics" 
  ON public.user_cosmetics FOR UPDATE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_trigger ON public.achievements(trigger_type, trigger_value);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_cosmetics_user ON public.user_cosmetics(user_id);

-- Insert starter achievements
INSERT INTO public.achievements (code_name, name, description, category, trigger_type, trigger_value, icon, rarity, xp_reward, sort_order) VALUES
  ('first_blood', 'First Blood', 'Complete your first workout', 'consistency', 'missions_completed', 1, '🩸', 'common', 50, 1),
  ('iron_initiate', 'Iron Initiate', 'Complete 10 sets', 'consistency', 'sets_completed', 10, '⚔️', 'common', 100, 2),
  ('centurion', 'Centurion', 'Complete 100 sets', 'consistency', 'sets_completed', 100, '🛡️', 'uncommon', 250, 3),
  ('thousand_strikes', 'Thousand Strikes', 'Complete 1,000 sets', 'consistency', 'sets_completed', 1000, '⚡', 'rare', 500, 4),
  ('ten_thousand_fists', 'Ten Thousand Fists', 'Complete 10,000 sets', 'consistency', 'sets_completed', 10000, '👊', 'legendary', 2000, 5),
  ('pr_hunter', 'PR Hunter', 'Set your first personal record', 'performance', 'prs_set', 1, '🎯', 'common', 75, 10),
  ('record_breaker', 'Record Breaker', 'Set 10 personal records', 'performance', 'prs_set', 10, '💥', 'uncommon', 200, 11),
  ('unstoppable', 'Unstoppable', 'Set 50 personal records', 'performance', 'prs_set', 50, '🔥', 'rare', 400, 12),
  ('combo_starter', 'Combo Starter', 'Reach a 5x combo', 'performance', 'combo_reached', 5, '✨', 'common', 50, 20),
  ('combo_master', 'Combo Master', 'Reach a 10x combo', 'performance', 'combo_reached', 10, '💫', 'uncommon', 150, 21),
  ('combo_legend', 'Combo Legend', 'Reach a 25x combo', 'performance', 'combo_reached', 25, '🌟', 'rare', 350, 22),
  ('ton_lifter', 'Ton Lifter', 'Lift 2,000 lbs total', 'performance', 'weight_lifted', 2000, '🏋️', 'common', 100, 30),
  ('iron_giant', 'Iron Giant', 'Lift 100,000 lbs total', 'performance', 'weight_lifted', 100000, '🦾', 'rare', 400, 31),
  ('titan', 'Titan', 'Lift 1,000,000 lbs total', 'performance', 'weight_lifted', 1000000, '🗿', 'legendary', 1500, 32);

-- Insert hidden achievements
INSERT INTO public.achievements (code_name, name, description, category, trigger_type, trigger_value, icon, rarity, xp_reward, is_hidden, hint, sort_order) VALUES
  ('night_owl', 'Night Owl', 'Complete a workout after midnight', 'hidden', 'workout_hour', 0, '🦉', 'rare', 300, true, 'The iron calls even when others sleep...', 100),
  ('early_bird', 'Early Bird', 'Complete a workout before 6 AM', 'hidden', 'workout_hour', 5, '🐦', 'rare', 300, true, 'Victory belongs to those who rise first...', 101),
  ('perfect_form', 'Perfect Form', 'Hit exactly your target reps 10 times in a row', 'hidden', 'perfect_reps', 10, '💎', 'epic', 500, true, 'Precision is the path to mastery...', 102);

-- Insert starter cosmetics linked to achievements
INSERT INTO public.cosmetics (code_name, name, description, type, value, rarity, unlock_achievement_id, sort_order) VALUES
  ('title_rookie', 'Rookie', 'A title for new warriors', 'title', 'Rookie', 'common', (SELECT id FROM public.achievements WHERE code_name = 'first_blood'), 1),
  ('title_centurion', 'Centurion', 'One who has completed a hundred battles', 'title', 'Centurion', 'uncommon', (SELECT id FROM public.achievements WHERE code_name = 'centurion'), 2),
  ('title_titan', 'Titan', 'A legendary lifter', 'title', 'Titan', 'legendary', (SELECT id FROM public.achievements WHERE code_name = 'titan'), 3),
  ('icon_fire', 'Flame Icon', 'Show your burning passion', 'icon', '🔥', 'uncommon', (SELECT id FROM public.achievements WHERE code_name = 'record_breaker'), 10),
  ('icon_star', 'Star Icon', 'Shine bright on the leaderboard', 'icon', '🌟', 'rare', (SELECT id FROM public.achievements WHERE code_name = 'combo_legend'), 11);